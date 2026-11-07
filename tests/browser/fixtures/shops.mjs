const commonCharity = {
  address: "1 Test Street",
  postcode: "SW1A 1AA",
  tfl_zone: "1",
  description_en: "Fixture charity shop",
  description_it: "Negozio solidale di prova",
  source_url: "https://example.test/charity",
  last_verified: "2026-11-06",
  opening_hours: "Mon–Sat"
};

export const charityShops = [
  ["fixture-books-one", "Books One", "Oxfam", "books_music", 51.501, -0.101],
  ["fixture-books-two", "Books Two", "British Red Cross", "books_music", 51.502, -0.102],
  ["fixture-general", "General Shop", "Cancer Research UK", "general", 51.503, -0.103],
  ["fixture-vintage", "Vintage Shop", "Princess Alice Hospice", "vintage_designer", 51.504, -0.104]
].map(([id, name, organization, subtype, lat, lon]) => ({
  ...commonCharity,
  id,
  place_id: id,
  name,
  branch: name,
  organization,
  subtype,
  lat,
  lon
}));

const commonBookshop = {
  address: "2 Test Street",
  postcode: "WC1A 1AA",
  zone: "1",
  branch: "Fixture branch",
  station: "Test Station",
  description: "Fixture bookshop",
  description_it: "Libreria di prova",
  heritage: "Fixture history",
  heritage_it: "Storia di prova",
  stock: ["Books"],
  stock_it: ["Libri"],
  source: "https://example.test/books",
  website: "https://example.test",
  last_verified: "2026-11-06",
  feature_tags: []
};

export const bookshops = [
  ["fixture-second-art", "Second Art", ["second-hand"], ["art-design-photo"], 51.511, -0.111],
  ["fixture-second-general", "Second General", ["second-hand"], ["literature-poetry"], 51.512, -0.112],
  ["fixture-specialist", "Specialist", ["specialist"], ["art-design-photo"], 51.513, -0.113],
  ["fixture-independent", "Independent", ["independent-general"], ["children-ya"], 51.514, -0.114]
].map(([id, name, type_tags, specialism_tags, lat, lon]) => ({
  ...commonBookshop,
  id,
  place_id: id,
  name,
  type: type_tags[0],
  type_tags,
  specialism_tags,
  lat,
  lon
}));
