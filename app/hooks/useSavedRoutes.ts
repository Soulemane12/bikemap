"use client";

import { useState, useEffect } from "react";

export interface SavedRoute {
  id: string;
  originName: string;
  destName: string;
  origin: [number, number];
  destination: [number, number];
  distance: number;
  duration: number;
  savedAt: number;
}

const KEY = "bikemap_saved_routes";

function load(): SavedRoute[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useSavedRoutes() {
  const [saved, setSaved] = useState<SavedRoute[]>([]);

  useEffect(() => {
    setSaved(load());
  }, []);

  const saveRoute = (route: Omit<SavedRoute, "id" | "savedAt">) => {
    const entry: SavedRoute = { ...route, id: crypto.randomUUID(), savedAt: Date.now() };
    const next = [entry, ...load()];
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next);
  };

  const removeRoute = (id: string) => {
    const next = load().filter((r) => r.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next);
  };

  return { saved, saveRoute, removeRoute };
}
