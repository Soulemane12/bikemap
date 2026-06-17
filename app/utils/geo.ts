const R = 6371000; // Earth radius in meters

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversine(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sin2));
}

function distanceToSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return haversine(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return haversine(p, [a[0] + t * dx, a[1] + t * dy]);
}

export function distanceToRoute(
  point: [number, number],
  coords: [number, number][]
): number {
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = distanceToSegment(point, coords[i], coords[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

export function nearestStepIndex(
  point: [number, number],
  stepLocations: [number, number][]
): number {
  let minDist = Infinity;
  let idx = 0;
  for (let i = 0; i < stepLocations.length; i++) {
    const d = haversine(point, stepLocations[i]);
    if (d < minDist) { minDist = d; idx = i; }
  }
  return idx;
}

export function formatImperial(meters: number): string {
  const feet = meters * 3.28084;
  if (feet < 1000) return `${Math.round(feet / 10) * 10} ft`;
  return `${(feet / 5280).toFixed(1)} mi`;
}

export function bearingToArrow(bearing: number): string {
  const b = ((bearing % 360) + 360) % 360;
  if (b < 22.5 || b >= 337.5) return "↑";
  if (b < 67.5) return "↗";
  if (b < 112.5) return "→";
  if (b < 157.5) return "↘";
  if (b < 202.5) return "↓";
  if (b < 247.5) return "↙";
  if (b < 292.5) return "←";
  return "↖";
}
