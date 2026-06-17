"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import SearchPanel from "./components/SearchPanel";
import NavBanner from "./components/NavBanner";
import { useDirections } from "./hooks/useDirections";
import { useSavedRoutes } from "./hooks/useSavedRoutes";
import { useNavigation } from "./hooks/useNavigation";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

export default function Home() {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [originName, setOriginName] = useState("");
  const [destName, setDestName] = useState("");

  const { route, steps, loading, error, fetchRoute, clearRoute } = useDirections();
  const { saved, saveRoute, removeRoute } = useSavedRoutes();
  const nav = useNavigation();

  const handleRoute = useCallback(
    (o: [number, number], d: [number, number]) => fetchRoute(o, d),
    [fetchRoute]
  );

  const handleClear = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setOriginName("");
    setDestName("");
    clearRoute();
    if (nav.navigating) nav.stop();
  }, [clearRoute, nav]);

  const handleSave = useCallback(() => {
    if (!route || !origin || !destination) return;
    saveRoute({ originName, destName, origin, destination, distance: route.distance, duration: route.duration });
  }, [route, origin, destination, originName, destName, saveRoute]);

  const handleLoadSaved = useCallback(
    (o: [number, number], d: [number, number]) => {
      setOrigin(o);
      setDestination(d);
      fetchRoute(o, d);
    },
    [fetchRoute]
  );

  const handleStartNav = useCallback(() => {
    if (!steps.length || !route || !destination) return;
    nav.start(steps, route, destination, (userPos, dest) => {
      fetchRoute(userPos, dest);
    });
  }, [steps, route, destination, nav, fetchRoute]);

  // When re-routing completes during navigation, update nav refs
  useEffect(() => {
    if (nav.navigating && route && steps.length) {
      nav.updateRoute(steps, route);
    }
  }, [route, steps]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStep = steps[nav.currentStepIndex] ?? null;
  const nextStep = steps[nav.currentStepIndex + 1] ?? null;

  return (
    <div className="relative w-full h-full">
      <Map
        route={route}
        origin={origin}
        destination={destination}
        navigating={nav.navigating}
        userPosition={nav.userPosition}
        userHeading={nav.userHeading}
      />

      {nav.navigating ? (
        <NavBanner
          currentStep={currentStep}
          nextStep={nextStep}
          distanceToTurn={nav.distanceToTurn}
          onStop={nav.stop}
        />
      ) : (
        <SearchPanel
          onRoute={handleRoute}
          onOriginSelect={setOrigin}
          onDestinationSelect={setDestination}
          onOriginNameChange={setOriginName}
          onDestNameChange={setDestName}
          onClear={handleClear}
          onSave={handleSave}
          onLoadSaved={handleLoadSaved}
          onRemoveSaved={removeRoute}
          onStartNav={handleStartNav}
          navigating={nav.navigating}
          steps={steps}
          routeDistance={route?.distance ?? null}
          routeDuration={route?.duration ?? null}
          loading={loading}
          error={error}
          savedRoutes={saved}
          currentRouteId={null}
        />
      )}
    </div>
  );
}
