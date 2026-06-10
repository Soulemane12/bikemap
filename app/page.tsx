"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import SearchPanel from "./components/SearchPanel";
import { useDirections } from "./hooks/useDirections";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

export default function Home() {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const { route, steps, loading, error, fetchRoute, clearRoute } = useDirections();

  const handleRoute = useCallback(
    (o: [number, number], d: [number, number]) => fetchRoute(o, d),
    [fetchRoute]
  );

  const handleClear = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    clearRoute();
  }, [clearRoute]);

  return (
    <div className="relative w-full h-full">
      <Map route={route} origin={origin} destination={destination} />
      <SearchPanel
        onRoute={handleRoute}
        onOriginSelect={setOrigin}
        onDestinationSelect={setDestination}
        onClear={handleClear}
        steps={steps}
        routeDistance={route?.distance ?? null}
        routeDuration={route?.duration ?? null}
        loading={loading}
        error={error}
      />
    </div>
  );
}
