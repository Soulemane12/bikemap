"use client";

import { useRef, useCallback, useEffect } from "react";
import MapGL, {
  GeolocateControl,
  NavigationControl,
  Marker,
  useMap,
} from "react-map-gl/mapbox";
import type { GeolocateControl as GeolocateControlType } from "mapbox-gl";
import RouteLayer from "./RouteLayer";
import type { RouteResult } from "../hooks/useDirections";

interface Props {
  route: RouteResult | null;
  origin: [number, number] | null;
  destination: [number, number] | null;
  navigating: boolean;
  userPosition: [number, number] | null;
  userHeading: number;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

function RouteFitter({ route, navigating }: { route: RouteResult | null; navigating: boolean }) {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map || !route || navigating) return;
    const coords = route.geometry.coordinates as [number, number][];
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, duration: 1000 }
    );
  }, [map, route, navigating]);

  return null;
}

function NavFollower({
  navigating,
  userPosition,
  userHeading,
}: {
  navigating: boolean;
  userPosition: [number, number] | null;
  userHeading: number;
}) {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map || !navigating || !userPosition) return;
    map.easeTo({
      center: userPosition,
      bearing: userHeading,
      pitch: 60,
      zoom: 17,
      duration: 300,
    });
  }, [map, navigating, userPosition, userHeading]);

  // Reset pitch/bearing when navigation stops
  useEffect(() => {
    if (!map || navigating) return;
    map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
  }, [map, navigating]);

  return null;
}

export default function Map({ route, origin, destination, navigating, userPosition, userHeading }: Props) {
  const geolocateRef = useRef<GeolocateControlType | null>(null);

  const handleMapLoad = useCallback(() => {
    setTimeout(() => geolocateRef.current?.trigger(), 500);
  }, []);

  return (
    <MapGL
      id="mainMap"
      mapboxAccessToken={TOKEN}
      initialViewState={{
        longitude: -75.4,
        latitude: 42.9,
        zoom: 7,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onLoad={handleMapLoad}
    >
      <GeolocateControl
        ref={geolocateRef}
        position="top-right"
        showUserLocation
        fitBoundsOptions={{ maxZoom: 14 }}
      />
      <NavigationControl position="top-right" />

      {!navigating && origin && (
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

      {/* Navigation user position marker */}
      {navigating && userPosition && (
        <Marker longitude={userPosition[0]} latitude={userPosition[1]} anchor="center" rotation={userHeading}>
          <div className="w-6 h-6 rounded-full bg-blue-600 border-3 border-white shadow-lg flex items-center justify-center">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white" />
          </div>
        </Marker>
      )}

      {route && <RouteLayer route={route} />}
      <RouteFitter route={route} navigating={navigating} />
      <NavFollower navigating={navigating} userPosition={userPosition} userHeading={userHeading} />
    </MapGL>
  );
}
