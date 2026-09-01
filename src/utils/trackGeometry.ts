// ============================================================================
// High-Precision Silverstone Grand Prix Circuit Geometry & Spline Engine
// ============================================================================

export interface Point2D {
  x: number;
  y: number;
}

export interface SplineTrackPoint {
  x: number;
  y: number;
  tangentX: number;
  tangentY: number;
  normalX: number;
  normalY: number;
  distance: number;
  progress: number; // 0.0 to 1.0
}

export interface CornerInfo {
  number: number;
  name: string;
  progress: number;
  apex: Point2D;
  kerbSide: 'left' | 'right' | 'both';
  labelOffset: Point2D;
}

export interface DRSZoneInfo {
  id: string;
  name: string;
  startProgress: number;
  endProgress: number;
  detectionProgress: number;
}

export interface SectorSplitInfo {
  sector: number;
  progress: number;
  label: string;
}

// ----------------------------------------------------------------------------
// Authentic Normalized Silverstone Grand Prix Waypoints (0 - 100 coordinate box)
// ----------------------------------------------------------------------------
export const SILVERSTONE_MASTER_ANCHORS: Array<Point2D & { name?: string; corner?: number }> = [
  // 1. Hamilton Straight (Start / Finish)
  { x: 38.0, y: 78.5, name: 'Hamilton Straight' },
  { x: 48.0, y: 81.0 },
  
  // 2. Abbey (Turn 1) & Farm Curve (Turn 2)
  { x: 57.5, y: 82.5, name: 'Abbey', corner: 1 },
  { x: 64.0, y: 79.5, name: 'Farm Curve', corner: 2 },
  
  // 3. Village (Turn 3) & The Loop (Turn 4)
  { x: 70.0, y: 71.0, name: 'Village', corner: 3 },
  { x: 74.0, y: 62.0 },
  { x: 72.5, y: 53.0, name: 'The Loop', corner: 4 },
  { x: 67.0, y: 51.5 },
  
  // 4. Aintree (Turn 5) into Wellington Straight
  { x: 60.5, y: 54.0, name: 'Aintree', corner: 5 },
  { x: 50.0, y: 58.5, name: 'Wellington Straight' },
  { x: 38.0, y: 63.5 },
  { x: 26.5, y: 68.0 },
  
  // 5. Brooklands (Turn 6) & Luffield (Turn 7) & Woodcote (Turn 8)
  { x: 19.5, y: 68.5, name: 'Brooklands', corner: 6 },
  { x: 14.5, y: 61.5 },
  { x: 13.5, y: 52.0, name: 'Luffield', corner: 7 },
  { x: 16.5, y: 44.0 },
  { x: 22.0, y: 39.5, name: 'Woodcote', corner: 8 },
  
  // 6. National Straight into Copse (Turn 9)
  { x: 28.0, y: 33.0, name: 'National Straight' },
  { x: 36.5, y: 22.5 },
  { x: 44.0, y: 15.0, name: 'Copse', corner: 9 },
  { x: 52.0, y: 13.5 },
  
  // 7. Maggots (Turn 10), Becketts (Turns 11-12), Chapel (Turns 13-14)
  { x: 59.0, y: 16.0, name: 'Maggots', corner: 10 },
  { x: 65.5, y: 20.0, name: 'Becketts', corner: 11 },
  { x: 65.0, y: 26.0 },
  { x: 71.0, y: 29.5, name: 'Chapel', corner: 13 },
  { x: 78.5, y: 35.0 },
  
  // 8. Hangar Straight into Stowe (Turn 15)
  { x: 82.5, y: 44.0, name: 'Hangar Straight' },
  { x: 86.5, y: 57.0 },
  { x: 90.0, y: 70.0 },
  { x: 88.5, y: 79.5, name: 'Stowe', corner: 15 },
  { x: 82.0, y: 84.5 },
  
  // 9. Vale (Turns 16-17) & Club (Turn 18)
  { x: 68.0, y: 85.5, name: 'Vale', corner: 16 },
  { x: 55.0, y: 86.0 },
  { x: 43.5, y: 84.5, name: 'Club Entry', corner: 17 },
  { x: 33.5, y: 81.5, name: 'Club', corner: 18 }
];

// Pit Lane Anchors (Dedicated path)
export const SILVERSTONE_PIT_LANE_ANCHORS: Point2D[] = [
  { x: 44.0, y: 83.5 }, // Pit Entry (Vale / Club area)
  { x: 38.0, y: 76.5 }, // Pit Entry Lane
  { x: 42.0, y: 78.5 }, // Pit Boxes / Garages
  { x: 49.0, y: 80.5 }, // Pit Exit Lane
  { x: 56.0, y: 81.5 }, // Pit Exit Rejoin (after Abbey)
];

// ----------------------------------------------------------------------------
// Centripetal Catmull-Rom Spline Math (prevents overshoot, loops, and cusps)
// ----------------------------------------------------------------------------
function getCatmullRomPoint(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  t: number,
  alpha = 0.5
): Point2D {
  const getT = (t0: number, pA: Point2D, pB: Point2D) => {
    const d = Math.hypot(pB.x - pA.x, pB.y - pA.y);
    return t0 + Math.pow(Math.max(d, 0.0001), alpha);
  };

  const t0 = 0;
  const t1 = getT(t0, p0, p1);
  const t2 = getT(t1, p1, p2);
  const t3 = getT(t2, p2, p3);

  const evalT = t1 + t * (t2 - t1);

  // De Casteljau / Catmull-Rom step
  const lerp = (tA: number, tB: number, pA: Point2D, pB: Point2D, tVal: number): Point2D => {
    const factor = (tVal - tA) / (tB - tA || 0.0001);
    return {
      x: pA.x + factor * (pB.x - pA.x),
      y: pA.y + factor * (pB.y - pA.y)
    };
  };

  const a1 = lerp(t0, t1, p0, p1, evalT);
  const a2 = lerp(t1, t2, p1, p2, evalT);
  const a3 = lerp(t2, t3, p2, p3, evalT);

  const b1 = lerp(t0, t2, a1, a2, evalT);
  const b2 = lerp(t1, t3, a2, a3, evalT);

  return lerp(t1, t2, b1, b2, evalT);
}

// ----------------------------------------------------------------------------
// Build Dense Arc-Length Parameterized Spline Track
// ----------------------------------------------------------------------------
export function generateSplineTrack(
  anchors: Point2D[],
  samplesPerSegment = 40,
  closed = true
): {
  splinePoints: SplineTrackPoint[];
  totalLength: number;
  getPointAtProgress: (p: number) => SplineTrackPoint;
} {
  const rawPoints: Point2D[] = [];
  const n = anchors.length;

  for (let i = 0; i < n; i++) {
    const p0 = closed ? anchors[(i - 1 + n) % n] : anchors[Math.max(0, i - 1)];
    const p1 = anchors[i];
    const p2 = closed ? anchors[(i + 1) % n] : anchors[Math.min(n - 1, i + 1)];
    const p3 = closed ? anchors[(i + 2) % n] : anchors[Math.min(n - 1, i + 2)];

    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      rawPoints.push(getCatmullRomPoint(p0, p1, p2, p3, t, 0.5));
    }
  }

  // Calculate cumulative distances
  const distances: number[] = [0];
  let cumulative = 0;
  for (let i = 1; i < rawPoints.length; i++) {
    const d = Math.hypot(rawPoints[i].x - rawPoints[i - 1].x, rawPoints[i].y - rawPoints[i - 1].y);
    cumulative += d;
    distances.push(cumulative);
  }

  if (closed && rawPoints.length > 0) {
    const dClosing = Math.hypot(rawPoints[0].x - rawPoints[rawPoints.length - 1].x, rawPoints[0].y - rawPoints[rawPoints.length - 1].y);
    cumulative += dClosing;
  }

  const totalLength = cumulative;

  // Build SplineTrackPoint list with tangents & normals
  const totalCount = rawPoints.length;
  const splinePoints: SplineTrackPoint[] = [];

  for (let i = 0; i < totalCount; i++) {
    const pt = rawPoints[i];
    const prevPt = rawPoints[(i - 1 + totalCount) % totalCount];
    const nextPt = rawPoints[(i + 1) % totalCount];

    // Tangent (direction of travel)
    let tx = nextPt.x - prevPt.x;
    let ty = nextPt.y - prevPt.y;
    const tLen = Math.hypot(tx, ty) || 1;
    tx /= tLen;
    ty /= tLen;

    // Normal (perpendicular to travel, pointing left of track)
    const nx = -ty;
    const ny = tx;

    const dist = distances[i];
    const progress = dist / (totalLength || 1);

    splinePoints.push({
      x: pt.x,
      y: pt.y,
      tangentX: tx,
      tangentY: ty,
      normalX: nx,
      normalY: ny,
      distance: dist,
      progress
    });
  }

  // Fast interpolation helper for any progress in [0, 1)
  const getPointAtProgress = (p: number): SplineTrackPoint => {
    let normP = p % 1;
    if (normP < 0) normP += 1;

    const targetDist = normP * totalLength;

    // Binary search in distances
    let low = 0;
    let high = distances.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (distances[mid] < targetDist) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx2 = Math.min(distances.length - 1, Math.max(0, low));
    const idx1 = (idx2 - 1 + distances.length) % distances.length;

    const d1 = distances[idx1];
    const d2 = distances[idx2] || totalLength;
    const span = (d2 >= d1 ? d2 - d1 : totalLength - d1 + d2) || 0.0001;
    const factor = Math.max(0, Math.min(1, (targetDist - d1) / span));

    const p1 = splinePoints[idx1];
    const p2 = splinePoints[idx2];

    const x = p1.x + (p2.x - p1.x) * factor;
    const y = p1.y + (p2.y - p1.y) * factor;
    const tx = p1.tangentX + (p2.tangentX - p1.tangentX) * factor;
    const ty = p1.tangentY + (p2.tangentY - p1.tangentY) * factor;
    const nx = p1.normalX + (p2.normalX - p1.normalX) * factor;
    const ny = p1.normalY + (p2.normalY - p1.normalY) * factor;

    return {
      x,
      y,
      tangentX: tx,
      tangentY: ty,
      normalX: nx,
      normalY: ny,
      distance: targetDist,
      progress: normP
    };
  };

  return { splinePoints, totalLength, getPointAtProgress };
}

// ----------------------------------------------------------------------------
// Generated Silverstone High-Fidelity Spline Model
// ----------------------------------------------------------------------------
export const SILVERSTONE_TRACK_MODEL = generateSplineTrack(SILVERSTONE_MASTER_ANCHORS, 35, true);

// Pre-computed Silverstone Pit Lane Model
export const SILVERSTONE_PIT_LANE_MODEL = generateSplineTrack(SILVERSTONE_PIT_LANE_ANCHORS, 25, false);

// ----------------------------------------------------------------------------
// Silverstone Circuit Meta Info (Corners, DRS Zones, Sectors, Kerbs)
// ----------------------------------------------------------------------------
export const SILVERSTONE_CORNERS: CornerInfo[] = [
  { number: 1, name: 'Abbey', progress: 0.065, apex: { x: 57.5, y: 82.5 }, kerbSide: 'right', labelOffset: { x: 0, y: 14 } },
  { number: 2, name: 'Farm', progress: 0.095, apex: { x: 64.0, y: 79.5 }, kerbSide: 'left', labelOffset: { x: 12, y: -10 } },
  { number: 3, name: 'Village', progress: 0.130, apex: { x: 70.0, y: 71.0 }, kerbSide: 'right', labelOffset: { x: 14, y: 0 } },
  { number: 4, name: 'The Loop', progress: 0.170, apex: { x: 72.5, y: 53.0 }, kerbSide: 'left', labelOffset: { x: 14, y: -8 } },
  { number: 5, name: 'Aintree', progress: 0.210, apex: { x: 60.5, y: 54.0 }, kerbSide: 'left', labelOffset: { x: -8, y: -12 } },
  { number: 6, name: 'Brooklands', progress: 0.360, apex: { x: 19.5, y: 68.5 }, kerbSide: 'left', labelOffset: { x: -16, y: 10 } },
  { number: 7, name: 'Luffield', progress: 0.415, apex: { x: 13.5, y: 52.0 }, kerbSide: 'right', labelOffset: { x: -18, y: -4 } },
  { number: 8, name: 'Woodcote', progress: 0.460, apex: { x: 22.0, y: 39.5 }, kerbSide: 'right', labelOffset: { x: -14, y: -12 } },
  { number: 9, name: 'Copse', progress: 0.520, apex: { x: 44.0, y: 15.0 }, kerbSide: 'right', labelOffset: { x: 0, y: -14 } },
  { number: 10, name: 'Maggots', progress: 0.570, apex: { x: 59.0, y: 16.0 }, kerbSide: 'left', labelOffset: { x: 0, y: -12 } },
  { number: 11, name: 'Becketts', progress: 0.605, apex: { x: 65.5, y: 20.0 }, kerbSide: 'right', labelOffset: { x: 14, y: -8 } },
  { number: 13, name: 'Chapel', progress: 0.645, apex: { x: 71.0, y: 29.5 }, kerbSide: 'left', labelOffset: { x: 14, y: 0 } },
  { number: 15, name: 'Stowe', progress: 0.825, apex: { x: 88.5, y: 79.5 }, kerbSide: 'right', labelOffset: { x: 16, y: 6 } },
  { number: 16, name: 'Vale', progress: 0.890, apex: { x: 68.0, y: 85.5 }, kerbSide: 'left', labelOffset: { x: 0, y: 14 } },
  { number: 18, name: 'Club', progress: 0.965, apex: { x: 33.5, y: 81.5 }, kerbSide: 'right', labelOffset: { x: -14, y: 10 } }
];

export const SILVERSTONE_DRS_ZONES: DRSZoneInfo[] = [
  {
    id: 'DRS1',
    name: 'Wellington Straight',
    startProgress: 0.23,
    endProgress: 0.35,
    detectionProgress: 0.19
  },
  {
    id: 'DRS2',
    name: 'Hangar Straight',
    startProgress: 0.67,
    endProgress: 0.81,
    detectionProgress: 0.63
  }
];

export const SILVERSTONE_SECTOR_SPLITS: SectorSplitInfo[] = [
  { sector: 1, progress: 0.33, label: 'SECTOR 1' },
  { sector: 2, progress: 0.66, label: 'SECTOR 2' },
  { sector: 3, progress: 1.00, label: 'SECTOR 3' }
];

// Kerb segments (progress intervals where apex / exit kerbing is rendered)
export const SILVERSTONE_KERB_INTERVALS = [
  { start: 0.050, end: 0.075, side: 'right' as const, color: 'curb-red-white' }, // Abbey apex
  { start: 0.075, end: 0.090, side: 'left' as const, color: 'curb-red-white' },  // Abbey exit
  { start: 0.120, end: 0.140, side: 'right' as const, color: 'curb-red-white' }, // Village apex
  { start: 0.160, end: 0.185, side: 'left' as const, color: 'curb-red-white' },  // Loop apex
  { start: 0.200, end: 0.220, side: 'left' as const, color: 'curb-red-white' },  // Aintree apex
  { start: 0.345, end: 0.370, side: 'left' as const, color: 'curb-red-white' },  // Brooklands apex
  { start: 0.395, end: 0.435, side: 'right' as const, color: 'curb-red-white' }, // Luffield apex
  { start: 0.445, end: 0.470, side: 'right' as const, color: 'curb-red-white' }, // Woodcote exit
  { start: 0.505, end: 0.535, side: 'right' as const, color: 'curb-red-white' }, // Copse apex
  { start: 0.535, end: 0.550, side: 'left' as const, color: 'curb-red-white' },  // Copse exit
  { start: 0.560, end: 0.580, side: 'left' as const, color: 'curb-red-white' },  // Maggots
  { start: 0.590, end: 0.615, side: 'right' as const, color: 'curb-red-white' }, // Becketts
  { start: 0.630, end: 0.655, side: 'left' as const, color: 'curb-red-white' },  // Chapel
  { start: 0.810, end: 0.835, side: 'right' as const, color: 'curb-red-white' }, // Stowe apex
  { start: 0.835, end: 0.855, side: 'left' as const, color: 'curb-red-white' },  // Stowe exit
  { start: 0.880, end: 0.900, side: 'left' as const, color: 'curb-red-white' },  // Vale chicane
  { start: 0.950, end: 0.980, side: 'right' as const, color: 'curb-red-white' }, // Club apex
];
