"use client";

import { useState, useCallback } from "react";

export interface Step {
  maneuver: { instruction: string };
  distance: number;
  duration: number;
}

export interface RouteResult {
  geometry: GeoJSON.LineString;
  distance: number; // meters
  duration: number; // seconds
  legs: Array<{ steps: Step[] }>;
}

export function useDirections() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = useCallback(
    async (origin: [number, number], destination: [number, number]) => {
      setLoading(true);
      setError(null);
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
      const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/cycling/${coords}?geometries=geojson&steps=true&access_token=${token}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data.routes?.length) {
          setError("No route found.");
          setRoute(null);
          setSteps([]);
          return;
        }
        const r: RouteResult = data.routes[0];
        setRoute(r);
        setSteps(r.legs.flatMap((leg) => leg.steps));
      } catch {
        setError("Failed to fetch route.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearRoute = useCallback(() => {
    setRoute(null);
    setSteps([]);
    setError(null);
  }, []);

  return { route, steps, loading, error, fetchRoute, clearRoute };
}
