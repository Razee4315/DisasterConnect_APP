import { create } from "zustand";

interface MapState {
    center: [number, number]; // [lat, lng]
    zoom: number;
    layers: {
        incidents: boolean;
        resources: boolean;
        heatmap: boolean;
        routes: boolean;
    };

    setCenter: (center: [number, number]) => void;
    setZoom: (zoom: number) => void;
    toggleLayer: (layer: keyof MapState["layers"]) => void;
    setLayers: (layers: Partial<MapState["layers"]>) => void;
}

export const useMapStore = create<MapState>((set) => ({
    center: [28.6139, 77.209], // Default: New Delhi (India)
    zoom: 10,
    layers: {
        incidents: true,
        resources: true,
        heatmap: false,
        routes: false,
    },

    setCenter: (center) => set({ center }),
    setZoom: (zoom) => set({ zoom }),
    toggleLayer: (layer) =>
        set((s) => ({
            layers: { ...s.layers, [layer]: !s.layers[layer] },
        })),
    setLayers: (layers) =>
        set((s) => ({
            layers: { ...s.layers, ...layers },
        })),
}));
