import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);

function element(type, props, ...children) {
  return { type, props: props || {}, children: children.flat().filter(child => child != null) };
}

function entryFor(data) {
  return {
    getIn(path) {
      return path[0] === "data" ? data[path[1]] : undefined;
    },
  };
}

async function loadTemplates() {
  const templates = new Map();
  const window = {
    h: element,
    createClass: definition => definition,
    CMS: {
      registerPreviewStyle() {},
      registerPreviewTemplate(name, template) {
        templates.set(name, template);
      },
      init() {},
    },
  };
  const source = await readFile(new URL("studio/preview.js", root), "utf8");
  vm.runInNewContext(source, { window }, { filename: "studio/preview.js" });
  return templates;
}

function render(template, data) {
  return template.render.call({
    props: {
      entry: entryFor(data),
      getAsset: path => ({ toString: () => path }),
      widgetFor: name => ({ widget: name }),
    },
  });
}

test("itinerary preview renders both Wimbledon locales with their map and hero", async () => {
  const templates = await loadTemplates();
  const template = templates.get("itineraries");
  assert.ok(template, "itinerary preview should be registered");

  for (const locale of ["en", "it"]) {
    const data = JSON.parse(
      await readFile(
        new URL(`content/itineraries/wimbledon-without-tennis.${locale}.json`, root),
        "utf8",
      ),
    );
    const rendered = JSON.stringify(render(template, data));
    assert.match(rendered, /it01-wimbledon-route-map\.webp/);
    assert.match(rendered, /it01-wimbledon-03-temple\.webp/);
    assert.match(rendered, /Wimbledon Museum/);
    assert.match(rendered, /Cannizaro Park/);
  }
});

test("journal preview renders without itinerary-only data", async () => {
  const templates = await loadTemplates();
  const template = templates.get("journal");
  assert.ok(template, "journal preview should be registered");
  assert.doesNotThrow(() => render(template, {
    title: "Preview smoke test",
    body: "Body",
    images: [],
    practical: [],
  }));
});
