import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = path => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
const link = label => new RegExp(`<a href="https:\\/\\/ko-fi\\.com\\/paolopastorino" target="_blank" rel="noopener noreferrer">${label}<\\/a>`);
test("Phase 1 uses one configured Ko-fi destination", async () => {
  const config=JSON.parse(await readFile(new URL("../content/site-config.json",import.meta.url),"utf8"));
  assert.equal(config.kofiUrl,"https://ko-fi.com/paolopastorino");
});
test("generated EN and IT footers expose the contribution link", async () => {
  for(const [path,label] of [["index.html","Buy me a flat white"],["it/index.html","Offrimi un flat white"],["journal/index.html","Buy me a flat white"],["it/journal/index.html","Offrimi un flat white"],["privacy/index.html","Buy me a flat white"],["it/privacy/index.html","Offrimi un flat white"]]){
    assert.match(await read(path),link(label),path);
  }
});
test("About pages contain one disclosure and the support section", async () => {
  const [en,it]=await Promise.all([read("about/index.html"),read("it/chi-sono/index.html")]);
  assert.match(en,/Support independent London exploration/); assert.match(en,/Support is entirely optional and never influences/); assert.match(en,link("Buy me a flat white")); assert.equal((en.match(/may receive voluntary contributions through Ko-fi/g)||[]).length,1);
  assert.match(it,/Sostieni l’esplorazione indipendente di Londra/); assert.match(it,/Il sostegno è del tutto facoltativo/); assert.match(it,link("Offrimi un flat white")); assert.equal((it.match(/può ricevere contributi volontari tramite Ko-fi/g)||[]).length,1);
});
test("privacy notices explain Ko-fi external handling and supporter information", async () => {
  const [en,it]=await Promise.all([read("privacy/index.html"),read("it/privacy/index.html")]);
  assert.match(en,/Ko-fi handles voluntary contributions on its external service/); assert.match(en,/may share supporter information/);
  assert.match(it,/Ko-fi gestisce i contributi volontari sul proprio servizio esterno/); assert.match(it,/può condividere con Paolo/);
});
