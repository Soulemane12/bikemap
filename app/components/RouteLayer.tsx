"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import type { RouteResult } from "../hooks/useDirections";

interface Props {
  route: RouteResult;
}

export default function RouteLayer({ route }: Props) {
  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    properties: {},
    geometry: route.geometry,
  };

  return (
    <Source id="route" type="geojson" data={geojson}>
      <Layer
        id="route-line"
        type="line"
        paint={{
          "line-color": "#1a73e8",
          "line-width": 5,
          "line-opacity": 0.85,
        }}
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
      />
    </Source>
  );
}
