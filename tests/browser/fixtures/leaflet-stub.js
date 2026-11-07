(() => {
  let activeMap = null;
  const update = layer => {
    if (layer?._mapElement) layer._mapElement.dataset.markerCount = String(layer._layers.length);
  };
  const group = () => ({
    _layers: [],
    _mapElement: null,
    addLayer(layer) { this._layers.push(layer); update(this); return this; },
    clearLayers() { this._layers = []; update(this); return this; }
  });
  const attachable = extra => ({
    ...extra,
    bindPopup() { return this; },
    addTo() { return this; }
  });
  window.L = {
    map(id) {
      const element = document.getElementById(id);
      activeMap = {
        setView() { return this; },
        addLayer(layer) { layer._mapElement = element; update(layer); return this; },
        removeLayer() { return this; },
        fitBounds() { return this; },
        invalidateSize() { element.dataset.invalidated = "true"; return this; }
      };
      return activeMap;
    },
    tileLayer() { return { addTo() { return this; } }; },
    markerClusterGroup: group,
    layerGroup: group,
    marker() { return attachable({}); },
    circleMarker() { return attachable({}); },
    circle() { return attachable({ getBounds() { return {}; } }); },
    latLngBounds() { return {}; },
    divIcon(options) { return options; }
  };
})();
