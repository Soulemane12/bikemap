"use client";

import { useState, useCallback, useRef } from "react";
import type { Step } from "../hooks/useDirections";

interface Place {
  id: string;
  place_name: string;
  center: [number, number];
}

interface Props {
  onRoute: (origin: [number, number], destination: [number, number]) => void;
  onOriginSelect: (coords: [number, number]) => void;
  onDestinationSelect: (coords: [number, number]) => void;
  onClear: () => void;
  steps: Step[];
  routeDistance: number | null;
  routeDuration: number | null;
  loading: boolean;
  error: string | null;
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
  onClear,
  steps,
  routeDistance,
  routeDuration,
  loading,
  error,
}: Props) {
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<Place[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Place[]>([]);
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [dest, setDest] = useState<[number, number] | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
  const originTimer = useRef<ReturnType<typeof setTimeout>>();
  const destTimer = useRef<ReturnType<typeof setTimeout>>();

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
    clearTimeout(originTimer.current);
    if (!val.trim()) { setOriginSuggestions([]); return; }
    originTimer.current = setTimeout(async () => {
      setOriginSuggestions(await geocode(val));
    }, 300);
  };

  const handleDestChange = (val: string) => {
    setDestText(val);
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
    if (dest) onRoute(place.center, dest);
  };

  const selectDest = (place: Place) => {
    setDestText(place.place_name);
    setDestSuggestions([]);
    setDest(place.center);
    onDestinationSelect(place.center);
    if (origin) onRoute(origin, place.center);
  };

  const handleClear = () => {
    setOriginText(""); setDestText("");
    setOrigin(null); setDest(null);
    setOriginSuggestions([]); setDestSuggestions([]);
    onClear();
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-80 bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🚲</span>
          <span className="font-semibold text-gray-800 text-lg">Bikemap</span>
        </div>

        {/* Origin */}
        <div className="relative mt-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              placeholder="Choose starting point"
              value={originText}
              onChange={(e) => handleOriginChange(e.target.value)}
            />
          </div>
          {originSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-20 overflow-hidden">
              {originSuggestions.map((p) => (
                <li
                  key={p.id}
                  className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer truncate"
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
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              placeholder="Choose destination"
              value={destText}
              onChange={(e) => handleDestChange(e.target.value)}
            />
          </div>
          {destSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg z-20 overflow-hidden">
              {destSuggestions.map((p) => (
                <li
                  key={p.id}
                  className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer truncate"
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

      {/* Route summary */}
      {loading && (
        <div className="px-4 py-3 text-sm text-gray-500 border-t border-gray-100">
          Finding best cycling route…
        </div>
      )}
      {error && (
        <div className="px-4 py-3 text-sm text-red-500 border-t border-gray-100">{error}</div>
      )}
      {!loading && routeDistance !== null && routeDuration !== null && (
        <>
          <div className="px-4 py-3 border-t border-gray-100 bg-blue-50">
            <p className="text-sm font-semibold text-blue-700">
              {formatDistance(routeDistance)} · {formatDuration(routeDuration)} by bike
            </p>
          </div>
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
