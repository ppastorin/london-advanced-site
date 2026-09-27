const h = window.h;

function value(entry, name, fallback = "") {
  const result = entry.getIn(["data", name]);
  return result == null ? fallback : result;
}

function list(entry, name) {
  const result = entry.getIn(["data", name]);
  return result?.toJS ? result.toJS() : (Array.isArray(result) ? result : []);
}

const JournalPreview = window.createClass({
  render() {
    const entry = this.props.entry;
    const images = list(entry, "images");
    const hero = images.find(image => image.role === "hero") || images[0];
    const focalX = Number.isFinite(Number(hero?.focal_x)) ? Math.min(100, Math.max(0, Number(hero.focal_x))) : 50;
    const focalY = Number.isFinite(Number(hero?.focal_y)) ? Math.min(100, Math.max(0, Number(hero.focal_y))) : 50;
    const practical = list(entry, "practical");
    const status = value(entry, "editorial_status", "draft");
    return h("div", { className: "studio-preview" },
      h("div", { className: "studio-preview-status" }, `Journal Studio · ${status}`),
      h("header", { className: "studio-preview-header" },
        h("div", null,
          h("span", { className: "studio-preview-kicker" }, value(entry, "eyebrow", "Field notes")),
          h("h1", null, value(entry, "title", "Untitled article")),
          h("p", { className: "studio-preview-dek" }, value(entry, "dek", "Add the standfirst in the editor.")),
          h("p", { className: "studio-preview-meta" }, "By Paolo Pastorino · bilingual publication")
        ),
        practical.length ? h("dl", { className: "studio-preview-practical" }, practical.map((item, index) =>
          h("div", { key: index }, h("dt", null, item.label), h("dd", null, item.value))
        )) : null
      ),
      hero?.src ? h("figure", { className: "studio-preview-hero" },
        h("img", {
          src: this.props.getAsset(hero.src)?.toString() || hero.src,
          alt: hero.alt || "",
          style: hero.display_mode === "natural"
            ? { objectPosition: `${focalX}% ${focalY}%`, height: "auto", maxHeight: "none", objectFit: "contain" }
            : { objectPosition: `${focalX}% ${focalY}%` }
        }),
        h("figcaption", null, hero.caption || "Caption to be added")
      ) : h("div", { className: "studio-preview-placeholder" }, "The hero photograph will appear here"),
      h("div", { className: "studio-preview-body" }, this.props.widgetFor("body")),
      h("section", { className: "studio-preview-tools" },
        h("span", { className: "studio-preview-kicker" }, "Plan the visit"),
        h("h2", null, "The finished article connects directly to the relevant London Advanced tools."),
        h("p", null, "The production page also adds sources, structured data, paired-language links, an author panel and newsletter pathway automatically.")
      )
    );
  }
});

window.CMS.registerPreviewStyle("/studio/preview.css");
window.CMS.registerPreviewTemplate("journal", JournalPreview);
window.CMS.init();
