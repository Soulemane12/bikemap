"use client";

import { useRef, useCallback } from "react";
import MapGL, {
  GeolocateControl,
  NavigationControl,
  Marker,
} from "react-map-gl/mapbox";
import RouteLayer from "./RouteLayer";
import type { RouteResult } from "../hooks/useDirections";

interface Props {
  route: RouteResult | null;
  origin: [number, number] | null;
  destination: [number, number] | null;
  onMapClick?: (coords: [number, number]) => void;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function Map({ route, origin, destination }: Props) {
  const mapRef = useRef<{ flyTo: (opts: object) => void } | null>(null);

  const handleMapRef = useCallback((ref: { flyTo: (opts: object) => void } | null) => {
    mapRef.current = ref;
  }, []);

  return (
    <MapGL
      ref={handleMapRef}
      mapboxAccessToken={TOKEN}
      initialViewState={{
        longitude: -98.5795,
        latitude: 39.8283,
        zoom: 4,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      <GeolocateControl
        position="top-right"
        trackUserLocation
        showUserHeading
      />
      <NavigationControl position="top-right" />

      {origin && (
        <Marker longitude={origin[0]} latitude={origin[1]} anchor="center">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
        </Marker>
      )}

      {destination && (
        <Marker longitude={destination[0]} latitude={destination[1]} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md" />
            <div className="w-0.5 h-3 bg-red-500" />
          </div>
        </Marker>
      )}

      {route && <RouteLayer route={route} />}
    </MapGL>
  );
}
