"use client";

import { bearingToArrow, formatImperial } from "../utils/geo";
import type { Step } from "../hooks/useDirections";

interface Props {
  currentStep: Step | null;
  nextStep: Step | null;
  distanceToTurn: number;
  onStop: () => void;
}

export default function NavBanner({ currentStep, nextStep, distanceToTurn, onStop }: Props) {
  const step = nextStep ?? currentStep;
  const arrow = step ? bearingToArrow(step.maneuver.bearing_after) : "↑";
  const instruction = step?.maneuver.instruction ?? "Follow the route";
  const dist = formatImperial(distanceToTurn);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-blue-600 text-white shadow-lg">
      <div className="flex items-center px-4 py-3 gap-4">
        {/* Arrow */}
        <span className="text-5xl font-bold w-12 text-center leading-none shrink-0">
          {arrow}
        </span>

        {/* Instruction + distance */}
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold leading-tight truncate">{instruction}</p>
          <p className="text-blue-200 text-sm mt-0.5">{dist}</p>
        </div>

        {/* Stop button */}
        <button
          onClick={onStop}
          className="shrink-0 bg-white text-blue-600 font-semibold text-sm px-4 py-2 rounded-full hover:bg-blue-50 transition-colors"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
