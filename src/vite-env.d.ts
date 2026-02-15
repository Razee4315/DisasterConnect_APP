/// <reference types="vite/client" />

declare module "leaflet.heat" {
  // Side-effect import: extends L with L.heatLayer()
}

declare module "leaflet.markercluster" {
  import * as L from "leaflet";
  export class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: {
      showCoverageOnHover?: boolean;
      zoomToBoundsOnClick?: boolean;
      maxClusterRadius?: number;
      spiderfyOnMaxZoom?: boolean;
      disableClusteringAtZoom?: number;
      chunkedLoading?: boolean;
      [key: string]: unknown;
    });
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
  }
}
