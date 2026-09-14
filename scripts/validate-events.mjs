import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTPS_RE = /^https:\/\//i;
const TICKETMASTER_AFFILIATE_HOST = 'ticketmaster.evyy.net';
const TICKETMASTER_AFFILIATE_PATH = '/c/7729619/1965662/24023';
const TICKETMASTER_UK_HOSTS = new Set(['ticketmaster.co.uk', 'www.ticketmaster.co.uk']);
const ALLOWED_SOURCES = new Set(['Londonist', 'The Times', 'Londonfy', 'London x London']);
const ALLOWED_CATEGORIES = new Set([
  'architecture',
  'art-design',
  'community',
  'heritage-history',
  'local-culture',
  'nature',
  'talk',
  'urban-exploration'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function requiredString(errors, value, path, min = 1, max = 500) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    errors.push(`${path} must be a string between ${min} and ${max} characters`);
  }
}

function exactKeys(errors, object, path, allowed) {
  if (!isObject(object)) {
    errors.push(`${path} must be an object`);
    return false;
  }
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) errors.push(`${path}.${key} is not allowed`);
  }
  return true;
}

function validateAffiliateUrl(errors, affiliateUrl, bookingUrl, path) {
  if (affiliateUrl === null || affiliateUrl === undefined) return;
  if (typeof affiliateUrl !== 'string') {
    errors.push(`${path} must be an HTTPS Ticketmaster affiliate URL or null`);
    return;
  }

  try {
    const url = new URL(affiliateUrl);
    if (url.protocol !== 'https:' || url.hostname !== TICKETMASTER_AFFILIATE_HOST || url.pathname !== TICKETMASTER_AFFILIATE_PATH) {
      errors.push(`${path} must use the approved Ticketmaster UK affiliate account`);
      return;
    }
    const parameterNames = [...url.searchParams.keys()];
    if (parameterNames.length !== 1 || parameterNames[0] !== 'u' || url.hash) {
      errors.push(`${path} must contain only the Ticketmaster destination parameter u`);
      return;
    }
    const destination = url.searchParams.get('u');
    const destinationUrl = new URL(destination);
    if (destinationUrl.protocol !== 'https:' || !TICKETMASTER_UK_HOSTS.has(destinationUrl.hostname)) {
      errors.push(`${path} destination must be on ticketmaster.co.uk`);
      return;
    }
    if (destinationUrl.href !== bookingUrl) {
      errors.push(`${path} destination must exactly match ${path.replace(/affiliate_url$/, 'url')}`);
    }
  } catch {
    errors.push(`${path} must be a valid Ticketmaster affiliate URL`);
  }
}

export function validateDigest(data) {
  const errors = [];
  const topKeys = new Set([
    'schema_version', 'generated_at', 'valid_from', 'valid_until',
    'timezone', 'editorial_title', 'homepage_event_ids', 'events'
  ]);
  if (!exactKeys(errors, data, '$', topKeys)) return errors;

  if (data.schema_version !== '1.1') errors.push('$.schema_version must equal "1.1"');
  if (!validDate(data.generated_at)) errors.push('$.generated_at must be an ISO date-time');
  if (!DATE_RE.test(data.valid_from ?? '')) errors.push('$.valid_from must be YYYY-MM-DD');
  if (!DATE_RE.test(data.valid_until ?? '')) errors.push('$.valid_until must be YYYY-MM-DD');
  if (DATE_RE.test(data.valid_from ?? '') && DATE_RE.test(data.valid_until ?? '') && data.valid_until < data.valid_from) {
    errors.push('$.valid_until must not precede $.valid_from');
  }
  if (data.timezone !== 'Europe/London') errors.push('$.timezone must equal "Europe/London"');
  if (data.editorial_title !== 'THIS WEEK, BEYOND THE OBVIOUS') {
    errors.push('$.editorial_title has an unexpected value');
  }
  if (!Array.isArray(data.homepage_event_ids) || data.homepage_event_ids.length < 1 || data.homepage_event_ids.length > 3) {
    errors.push('$.homepage_event_ids must contain between 1 and 3 event ids');
  } else {
    if (new Set(data.homepage_event_ids).size !== data.homepage_event_ids.length) {
      errors.push('$.homepage_event_ids must not contain duplicates');
    }
    data.homepage_event_ids.forEach((id, index) => {
      if (typeof id !== 'string' || !SLUG_RE.test(id)) {
        errors.push(`$.homepage_event_ids[${index}] must be a lowercase slug`);
      }
    });
  }
  if (!Array.isArray(data.events) || data.events.length < 1 || data.events.length > 8) {
    errors.push('$.events must contain between 1 and 8 approved events');
    return errors;
  }

  const ids = new Set();
  const duplicateKeys = new Set();
  data.events.forEach((event, index) => {
    validateEvent(event, `$.events[${index}]`, errors);
    if (typeof event?.id === 'string') {
      if (ids.has(event.id)) errors.push(`$.events[${index}].id is duplicated`);
      ids.add(event.id);
    }
    if (typeof event?.duplicate_key === 'string') {
      if (duplicateKeys.has(event.duplicate_key)) errors.push(`$.events[${index}].duplicate_key is duplicated`);
      duplicateKeys.add(event.duplicate_key);
    }
  });
  if (Array.isArray(data.homepage_event_ids)) {
    for (const id of data.homepage_event_ids) {
      if (!ids.has(id)) errors.push(`$.homepage_event_ids references missing event id: ${id}`);
    }
  }
  return errors;
}

function validateEvent(event, path, errors) {
  const keys = new Set([
    'id', 'title_en', 'title_it', 'summary_en', 'summary_it', 'start', 'end',
    'venue', 'price', 'booking', 'category', 'advanced', 'newsletter_sources',
    'official_url', 'verification', 'publication_status', 'publish_at', 'expire_at',
    'duplicate_key'
  ]);
  if (!exactKeys(errors, event, path, keys)) return;

  if (typeof event.id !== 'string' || !SLUG_RE.test(event.id)) errors.push(`${path}.id must be a lowercase slug`);
  requiredString(errors, event.title_en, `${path}.title_en`, 3, 100);
  requiredString(errors, event.title_it, `${path}.title_it`, 3, 100);
  requiredString(errors, event.summary_en, `${path}.summary_en`, 40, 280);
  requiredString(errors, event.summary_it, `${path}.summary_it`, 40, 280);
  if (!validDate(event.start)) errors.push(`${path}.start must be an ISO date-time`);
  if (!validDate(event.end)) errors.push(`${path}.end must be an ISO date-time`);
  if (validDate(event.start) && validDate(event.end) && Date.parse(event.end) < Date.parse(event.start)) {
    errors.push(`${path}.end must not precede start`);
  }

  if (exactKeys(errors, event.venue, `${path}.venue`, new Set(['name', 'address', 'postcode', 'borough']))) {
    requiredString(errors, event.venue.name, `${path}.venue.name`, 2, 120);
    requiredString(errors, event.venue.address, `${path}.venue.address`, 3, 180);
    requiredString(errors, event.venue.postcode, `${path}.venue.postcode`, 3, 12);
    requiredString(errors, event.venue.borough, `${path}.venue.borough`, 2, 80);
  }

  if (exactKeys(errors, event.price, `${path}.price`, new Set(['amount_gbp', 'display', 'classification']))) {
    const amount = event.price.amount_gbp;
    if (typeof amount !== 'number' || amount < 0 || amount > 15) errors.push(`${path}.price.amount_gbp must be between 0 and 15`);
    requiredString(errors, event.price.display, `${path}.price.display`, 2, 40);
    if (!['free', 'cheap', 'exceptional'].includes(event.price.classification)) errors.push(`${path}.price.classification is invalid`);
    if (event.price.classification === 'free' && amount !== 0) errors.push(`${path}.price free events must have amount_gbp 0`);
    if (event.price.classification === 'cheap' && !(amount > 0 && amount <= 10)) errors.push(`${path}.price cheap events must cost £0.01–£10`);
    if (event.price.classification === 'exceptional' && !(amount > 10 && amount <= 15)) errors.push(`${path}.price exceptional events must cost £10.01–£15`);
  }

  if (exactKeys(errors, event.booking, `${path}.booking`, new Set(['required', 'status', 'url', 'affiliate_url']))) {
    if (typeof event.booking.required !== 'boolean') errors.push(`${path}.booking.required must be boolean`);
    if (!['drop-in', 'recommended', 'required'].includes(event.booking.status)) errors.push(`${path}.booking.status is invalid`);
    if (event.booking.required && event.booking.status !== 'required') errors.push(`${path}.booking status must be required when required is true`);
    if (event.booking.required && !HTTPS_RE.test(event.booking.url ?? '')) errors.push(`${path}.booking.url must be HTTPS when booking is required`);
    if (event.booking.url !== null && !HTTPS_RE.test(event.booking.url ?? '')) errors.push(`${path}.booking.url must be HTTPS or null`);
    validateAffiliateUrl(errors, event.booking.affiliate_url, event.booking.url, `${path}.booking.affiliate_url`);
  }

  if (!ALLOWED_CATEGORIES.has(event.category)) errors.push(`${path}.category is invalid`);

  if (exactKeys(errors, event.advanced, `${path}.advanced`, new Set(['score', 'reason', 'breakdown']))) {
    if (!Number.isInteger(event.advanced.score) || event.advanced.score < 7 || event.advanced.score > 10) errors.push(`${path}.advanced.score must be an integer from 7 to 10`);
    requiredString(errors, event.advanced.reason, `${path}.advanced.reason`, 20, 220);
    const b = event.advanced.breakdown;
    if (exactKeys(errors, b, `${path}.advanced.breakdown`, new Set(['non_obvious', 'place_story', 'unusual_access', 'local_character', 'value']))) {
      const limits = { non_obvious: 3, place_story: 2, unusual_access: 2, local_character: 1, value: 2 };
      let total = 0;
      for (const [key, max] of Object.entries(limits)) {
        if (!Number.isInteger(b[key]) || b[key] < 0 || b[key] > max) errors.push(`${path}.advanced.breakdown.${key} must be 0–${max}`);
        else total += b[key];
      }
      if (Number.isInteger(event.advanced.score) && total !== event.advanced.score) errors.push(`${path}.advanced breakdown must total the score`);
    }
  }

  if (!Array.isArray(event.newsletter_sources) || event.newsletter_sources.length < 1) {
    errors.push(`${path}.newsletter_sources must be a non-empty array`);
  } else {
    if (new Set(event.newsletter_sources).size !== event.newsletter_sources.length) errors.push(`${path}.newsletter_sources must not contain duplicates`);
    for (const source of event.newsletter_sources) if (!ALLOWED_SOURCES.has(source)) errors.push(`${path}.newsletter_sources contains an unknown source`);
  }

  if (!HTTPS_RE.test(event.official_url ?? '')) errors.push(`${path}.official_url must be HTTPS`);
  if (exactKeys(errors, event.verification, `${path}.verification`, new Set(['verified_at', 'confidence', 'source_url']))) {
    if (!validDate(event.verification.verified_at)) errors.push(`${path}.verification.verified_at must be an ISO date-time`);
    if (event.verification.confidence !== 'high') errors.push(`${path}.verification.confidence must be high for publication`);
    if (!HTTPS_RE.test(event.verification.source_url ?? '')) errors.push(`${path}.verification.source_url must be HTTPS`);
  }
  if (event.publication_status !== 'approved') errors.push(`${path}.publication_status must equal approved`);
  if (!validDate(event.publish_at)) errors.push(`${path}.publish_at must be an ISO date-time`);
  if (!validDate(event.expire_at)) errors.push(`${path}.expire_at must be an ISO date-time`);
  if (validDate(event.end) && validDate(event.expire_at) && Date.parse(event.expire_at) < Date.parse(event.end)) {
    errors.push(`${path}.expire_at must not precede the event end`);
  }
  requiredString(errors, event.duplicate_key, `${path}.duplicate_key`, 8, 180);
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node scripts/validate-events.mjs <events.json>');
    process.exitCode = 2;
    return;
  }
  let data;
  try {
    data = JSON.parse(await readFile(input, 'utf8'));
  } catch (error) {
    console.error(`Cannot parse ${input}: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const errors = validateDigest(data);
  if (errors.length) {
    console.error(`Invalid events feed (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log(`Valid events feed: ${data.events.length} event${data.events.length === 1 ? '' : 's'}, ${data.valid_from} to ${data.valid_until}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
