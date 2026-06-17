"use client";

import { useState, useCallback, useRef } from "react";
import type { Step } from "../hooks/useDirections";
import type { SavedRoute } from "../hooks/useSavedRoutes";

interface Place {
  id: string;
  place_name: string;
  center: [number, number];
}

interface Props {
  onRoute: (origin: [number, number], destination: [number, number]) => void;
  onOriginSelect: (coords: [number, number]) => void;
  onDestinationSelect: (coords: [number, number]) => void;
  onOriginNameChange: (name: string) => void;
  onDestNameChange: (name: string) => void;
  onClear: () => void;
  onSave: () => void;
  onLoadSaved: (origin: [number, number], dest: [number, number]) => void;
  onRemoveSaved: (id: string) => void;
  onStartNav: () => void;
  navigating: boolean;
  steps: Step[];
  routeDistance: number | null;
  routeDuration: number | null;
  loading: boolean;
  error: string | null;
  savedRoutes: SavedRoute[];
  currentRouteId: string | null;
}

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatDuration(s: number) {
  const mins = Math.round(s / 60);
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function SearchPanel({
  onRoute,
  onOriginSelect,
  onDestinationSelect,
  onOriginNameChange,
  onDestNameChange,
  onClear,
  onSave,
  onLoadSaved,
  onRemoveSaved,
  onStartNav,
  navigating,
  steps,
  routeDistance,
  routeDuration,
  loading,
  error,
  savedRoutes,
}: Props) {
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<Place[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Place[]>([]);
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [dest, setDest] = useState<[number, number] | null>(null);
  const [saved, setSaved] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
  const originTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const destTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const geocode = useCallback(
    async (query: string): Promise<Place[]> => {
      if (!query.trim()) return [];
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      return data.features ?? [];
    },
    [token]
  );

  const handleOriginChange = (val: string) => {
    setOriginText(val);
    setSaved(false);
    clearTimeout(originTimer.current);
    if (!val.trim()) { setOriginSuggestions([]); return; }
    originTimer.current = setTimeout(async () => {
      setOriginSuggestions(await geocode(val));
    }, 300);
  };

  const handleDestChange = (val: string) => {
    setDestText(val);
    setSaved(false);
    clearTimeout(destTimer.current);
    if (!val.trim()) { setDestSuggestions([]); return; }
    destTimer.current = setTimeout(async () => {
      setDestSuggestions(await geocode(val));
    }, 300);
  };

  const selectOrigin = (place: Place) => {
    setOriginText(place.place_name);
    setOriginSuggestions([]);
    setOrigin(place.center);
    onOriginSelect(place.center);
    onOriginNameChange(place.place_name);
    if (dest) onRoute(place.center, dest);
  };

  const selectDest = (place: Place) => {
    setDestText(place.place_name);
    setDestSuggestions([]);
    setDest(place.center);
    onDestinationSelect(place.center);
    onDestNameChange(place.place_name);
    if (origin) onRoute(origin, place.center);
  };

  const handleClear = () => {
    setOriginText(""); setDestText("");
    setOrigin(null); setDest(null);
    setOriginSuggestions([]); setDestSuggestions([]);
    setSaved(false);
    onClear();
  };

  const handleSave = () => {
    onSave();
    setSaved(true);
  };

  const handleLoadSaved = (r: SavedRoute) => {
    setOriginText(r.originName);
    setDestText(r.destName);
    setOrigin(r.origin);
    setDest(r.destination);
    setSaved(true);
    setShowSaved(false);
    onOriginSelect(r.origin);
    onDestinationSelect(r.destination);
    onOriginNameChange(r.originName);
    onDestNameChange(r.destName);
    onLoadSaved(r.origin, r.destination);
  };

  const hasRoute = !loading && routeDistance !== null && routeDuration !== null;

  return (
    <div className="absolute top-4 left-4 z-10 w-80 bg-white rounded-2xl shadow-xl">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-2 rounded-t-2xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚲</span>
            <span className="font-semibold text-gray-800 text-lg">Bikemap</span>
          </div>
          {/* Saved routes toggle */}
          <button
            onClick={() => setShowSaved((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-500 transition-colors"
          >
            <span className={savedRoutes.length > 0 ? "text-yellow-400" : ""}>★</span>
            <span>{savedRoutes.length > 0 ? `${savedRoutes.length} saved` : "Saved"}</span>
          </button>
        </div>

        {/* Origin */}
        <div className="relative mt-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              placeholder="Choose starting point"
              value={originText}
              onChange={(e) => handleOriginChange(e.target.value)}
            />
          </div>
          {originSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-50 overflow-hidden">
              {originSuggestions.map((p) => (
                <li
                  key={p.id}
                  className="px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 cursor-pointer truncate"
                  onClick={() => selectOrigin(p)}
                >
                  {p.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Destination */}
        <div className="relative mt-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              placeholder="Choose destination"
              value={destText}
              onChange={(e) => handleDestChange(e.target.value)}
            />
          </div>
          {destSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-50 overflow-hidden">
              {destSuggestions.map((p) => (
                <li
                  key={p.id}
                  className="px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 cursor-pointer truncate"
                  onClick={() => selectDest(p)}
                >
                  {p.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {(origin || dest) && (
          <button
            onClick={handleClear}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Saved routes panel */}
      {showSaved && (
        <div className="border-t border-gray-100">
          {savedRoutes.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-400">No saved routes yet. Star a route to save it.</p>
          ) : (
            <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
              {savedRoutes.map((r) => (
                <li key={r.id} className="px-4 py-2 flex items-center gap-2 hover:bg-gray-50">
                  <button
                    className="flex-1 text-left"
                    onClick={() => handleLoadSaved(r)}
                  >
                    <p className="text-xs font-medium text-gray-800 truncate">{r.originName} → {r.destName}</p>
                    <p className="text-xs text-gray-400">{formatDistance(r.distance)} · {formatDuration(r.duration)}</p>
                  </button>
                  <button
                    onClick={() => onRemoveSaved(r.id)}
                    className="text-gray-300 hover:text-red-400 text-sm shrink-0"
                    title="Remove"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Route summary */}
      {loading && (
        <div className="px-4 py-3 text-sm text-gray-500 border-t border-gray-100">
          Finding best cycling route…
        </div>
      )}
      {error && (
        <div className="px-4 py-3 text-sm text-red-500 border-t border-gray-100">{error}</div>
      )}
      {hasRoute && (
        <>
          <div className="px-4 py-3 border-t border-gray-100 bg-blue-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-700">
              {formatDistance(routeDistance!)} · {formatDuration(routeDuration!)} by bike
            </p>
            <button
              onClick={handleSave}
              title={saved ? "Saved!" : "Save route"}
              className={`text-lg transition-colors ${saved ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`}
            >
              ★
            </button>
          </div>
          {!navigating && (
            <div className="px-4 pb-3">
              <button
                onClick={onStartNav}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-base py-2.5 rounded-xl transition-colors"
              >
                GO
              </button>
            </div>
          )}
          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
            {steps.map((step, i) => (
              <li key={i} className="px-4 py-2 flex gap-3 items-start">
                <span className="mt-0.5 text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
                <span className="text-xs text-gray-700 leading-snug">
                  {step.maneuver.instruction}
                  <span className="ml-1 text-gray-400">({formatDistance(step.distance)})</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
