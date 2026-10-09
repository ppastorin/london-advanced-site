const h = window.h;

function value(entry, name, fallback = "") {
  const result = entry.getIn(["data", name]);
  return result == null ? fallback : result;
}

function list(entry, name) {
  const result = entry.getIn(["data", name]);
  return result?.toJS ? result.toJS() : (Array.isArray(result) ? result : []);
}

function object(entry, name) {
  const result = entry.getIn(["data", name]);
  return result?.toJS ? result.toJS() : (result && typeof result === "object" ? result : {});
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

const ItineraryPreview = window.createClass({
  render() {
    const entry = this.props.entry;
    const stops = list(entry, "stops");
    const images = list(entry, "images");
    const hero = images.find(image => image.role === "hero") || images[0];
    const map = object(entry, "map");
    const status = value(entry, "editorial_status", "draft");
    const distance = value(entry, "distance_km", "—");
    return h("div", { className: "studio-preview studio-itinerary-preview" },
      h("div", { className: "studio-preview-status" }, `Itineraries Studio · ${status}`),
      h("header", { className: "studio-preview-header" },
        h("div", null,
          h("span", { className: "studio-preview-kicker" }, value(entry, "eyebrow", "One-day itinerary")),
          h("h1", null, value(entry, "title", "Untitled itinerary")),
          h("p", { className: "studio-preview-dek" }, value(entry, "dek", "Add the standfirst in the editor.")),
          h("p", { className: "studio-preview-meta" }, `${value(entry, "duration", "Duration pending")} · ${distance} km · ${value(entry, "best_day", "day pending")}`)
        ),
        h("dl", { className: "studio-preview-practical" },
          [["Theme", value(entry, "theme")], ["Area", value(entry, "area")], ["Walking", value(entry, "walking_level")], ["Transport", value(entry, "transit_level")]].map(([label, content]) =>
            h("div", { key: label }, h("dt", null, label), h("dd", null, content || "—"))
          )
        )
      ),
      hero?.src ? h("figure", { className: "studio-preview-hero" },
        h("img", { src: this.props.getAsset(hero.src)?.toString() || hero.src, alt: hero.alt || "" }),
        h("figcaption", null, hero.caption || "Caption to be added")
      ) : h("div", { className: "studio-preview-placeholder" }, "Choose the hero after the route and copy are approved"),
      map?.src ? h("section", { className: "studio-preview-map" },
        h("span", { className: "studio-preview-kicker" }, "Editorial route map"),
        h("img", { src: this.props.getAsset(map.src)?.toString() || map.src, alt: map.alt || "" }),
        h("p", null, map.caption || "Map caption to be added")
      ) : null,
      h("section", { className: "studio-preview-route" },
        h("span", { className: "studio-preview-kicker" }, "Draft schedule"),
        h("ol", null, stops.map((stop, index) => {
          const photo = images.find(image => image.role !== "hero" && Number(image.stop_order) === Number(stop.order));
          return h("li", { key: index },
            h("time", null, stop.arrival || "—"),
            h("div", null,
              h("strong", null, stop.name || "Untitled stop"),
              h("p", null, stop.summary || "Add the reason for this stop."),
              photo?.src ? h("figure", { className: "studio-preview-stop-photo" },
                h("img", { src: this.props.getAsset(photo.src)?.toString() || photo.src, alt: photo.alt || "" }),
                h("figcaption", null, photo.caption || "Caption to be added")
              ) : null
            )
          );
        }))
      ),
      h("div", { className: "studio-preview-body" }, this.props.widgetFor("body")),
      h("section", { className: "studio-preview-tools" },
        h("span", { className: "studio-preview-kicker" }, "Publication gate"),
        h("h2", null, "Approval can happen before photography; publication cannot."),
        h("p", null, "Both languages, approval details, a hero photograph, the editorial route map and a Google Maps itinerary are required before this route can appear publicly.")
      )
    );
  }
});

window.CMS.registerPreviewStyle("/studio/preview.css");
window.CMS.registerPreviewTemplate("journal", JournalPreview);
window.CMS.registerPreviewTemplate("itineraries", ItineraryPreview);
window.CMS.init();
