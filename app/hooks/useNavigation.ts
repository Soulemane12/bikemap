"use client";

import { useState, useRef, useCallback } from "react";
import type { Step, RouteResult } from "./useDirections";
import { distanceToRoute, nearestStepIndex, haversine } from "../utils/geo";

const OFF_ROUTE_THRESHOLD = 30; // meters before re-routing
const ANNOUNCE_DISTANCE = 50;   // meters before a turn to speak

function speak(text: string) {
  if (typeof window === "undefined") return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.volume = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

interface NavState {
  navigating: boolean;
  currentStepIndex: number;
  distanceToTurn: number;
  userHeading: number;
  userPosition: [number, number] | null;
}

export function useNavigation() {
  const [state, setState] = useState<NavState>({
    navigating: false,
    currentStepIndex: 0,
    distanceToTurn: 0,
    userHeading: 0,
    userPosition: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const stepsRef = useRef<Step[]>([]);
  const routeRef = useRef<RouteResult | null>(null);
  const destinationRef = useRef<[number, number] | null>(null);
  const onRerouteRef = useRef<((pos: [number, number], dest: [number, number]) => void) | null>(null);
  const announcedStepRef = useRef<number>(-1);
  const reroutingRef = useRef(false);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    window.speechSynthesis?.cancel();
    announcedStepRef.current = -1;
    reroutingRef.current = false;
    setState({
      navigating: false,
      currentStepIndex: 0,
      distanceToTurn: 0,
      userHeading: 0,
      userPosition: null,
    });
  }, []);

  const start = useCallback(
    (
      steps: Step[],
      route: RouteResult,
      destination: [number, number],
      onReroute: (pos: [number, number], dest: [number, number]) => void
    ) => {
      stepsRef.current = steps;
      routeRef.current = route;
      destinationRef.current = destination;
      onRerouteRef.current = onReroute;
      announcedStepRef.current = -1;
      reroutingRef.current = false;

      setState((s) => ({ ...s, navigating: true }));
      speak("Navigation started.");

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const userPos: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          const heading = pos.coords.heading ?? 0;
          const currentSteps = stepsRef.current;
          const currentRoute = routeRef.current;
          const dest = destinationRef.current;

          if (!currentRoute || !dest || currentSteps.length === 0) return;

          // Check off-route
          const routeCoords = currentRoute.geometry.coordinates as [number, number][];
          const distFromRoute = distanceToRoute(userPos, routeCoords);

          if (distFromRoute > OFF_ROUTE_THRESHOLD && !reroutingRef.current) {
            reroutingRef.current = true;
            speak("Re-routing.");
            onRerouteRef.current?.(userPos, dest);
            return;
          }

          // Find current step
          const stepLocations = currentSteps.map((s) => s.maneuver.location);
          const stepIdx = nearestStepIndex(userPos, stepLocations);
          const nextIdx = Math.min(stepIdx + 1, currentSteps.length - 1);
          const nextStep = currentSteps[nextIdx];
          const distToTurn = haversine(userPos, nextStep.maneuver.location);

          // Announce upcoming turn
          if (distToTurn < ANNOUNCE_DISTANCE && announcedStepRef.current !== nextIdx) {
            announcedStepRef.current = nextIdx;
            speak(`In ${Math.round(distToTurn)} meters, ${nextStep.maneuver.instruction}`);
          }

          setState({
            navigating: true,
            currentStepIndex: stepIdx,
            distanceToTurn: distToTurn,
            userHeading: heading,
            userPosition: userPos,
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
          speak("Could not get your location.");
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    },
    []
  );

  // Called by page.tsx after re-routing completes to update refs
  const updateRoute = useCallback((steps: Step[], route: RouteResult) => {
    stepsRef.current = steps;
    routeRef.current = route;
    announcedStepRef.current = -1;
    reroutingRef.current = false;
    speak("Route updated.");
  }, []);

  return { ...state, start, stop, updateRoute };
}
