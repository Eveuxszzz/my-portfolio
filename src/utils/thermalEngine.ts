export interface ContourTierSpec {
  id: string;
  radius: number;
  blurPx: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  eccentricOffset: number;
  phaseShift: number;
  a2Scale: number;
  a3Scale: number;
}

export interface ContourPoint {
  x: number;
  y: number;
}

export interface SculptedTierGeometry {
  spec: ContourTierSpec;
  points: ContourPoint[];
  centerX: number;
  centerY: number;
}

export interface PebbleFollowState {
  targetX: number;
  targetY: number;
  anchorX: number;
  anchorY: number;
  vx: number;
  vy: number;
  leanAngle: number;
  leanStrength: number;
  lastMoveTime: number;
}

export interface StepPebbleResult {
  tiers: SculptedTierGeometry[];
  kineticEnergy: number;
}

export interface ScrollDashboardState {
  progress: number;
  headerOpacity: number;
  isHeaderVisible: boolean;
  activeSectionIndex: number;
}

export const HEADER_REVEAL_START = 0.18;
export const HEADER_REVEAL_END = 0.58;
export const HEADER_REVEAL_THRESHOLD = 0.32;

/**
 * 4-step monochrome silver & ash topographic contour tiers (outer to inner).
 * Drawn sequentially with soft optical feathering so all 4 values read clearly
 * as a cohesive sculptural pebble / organic kidney heatmap.
 */
export const PEBBLE_CONTOUR_TIERS: readonly ContourTierSpec[] = [
  {
    id: 'smoked-ash',
    radius: 152,
    blurPx: 11,
    r: 72,
    g: 75,
    b: 82,
    alpha: 0.30,
    eccentricOffset: 0,
    phaseShift: 0,
    a2Scale: 1.0,
    a3Scale: 1.05,
  },
  {
    id: 'cool-graphite',
    radius: 112,
    blurPx: 8,
    r: 124,
    g: 128,
    b: 136,
    alpha: 0.36,
    eccentricOffset: 10,
    phaseShift: 0.22,
    a2Scale: 1.04,
    a3Scale: 0.96,
  },
  {
    id: 'liquid-silver',
    radius: 75,
    blurPx: 5.5,
    r: 184,
    g: 188,
    b: 195,
    alpha: 0.44,
    eccentricOffset: 20,
    phaseShift: 0.42,
    a2Scale: 1.08,
    a3Scale: 0.85,
  },
  {
    id: 'pearl-core',
    radius: 40,
    blurPx: 4,
    r: 242,
    g: 244,
    b: 248,
    alpha: 0.56,
    eccentricOffset: 28,
    phaseShift: 0.58,
    a2Scale: 1.12,
    a3Scale: 0.72,
  },
];

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpAngle = (from: number, to: number, t: number): number => {
  let diff = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return from + diff * t;
};

/**
 * Initializes the tight-follow sculptural pebble heatmap state.
 */
export function createPebbleFollowState(
  initialX: number,
  initialY: number
): PebbleFollowState {
  return {
    targetX: initialX,
    targetY: initialY,
    anchorX: initialX,
    anchorY: initialY,
    vx: 0,
    vy: 0,
    leanAngle: -0.35,
    leanStrength: 0,
    lastMoveTime: 0,
  };
}

/**
 * Evaluates a single smooth closed sculptural pebble / organic kidney contour
 * using strictly bounded low-order polar harmonics (n = 2 pebble axis +
 * n = 3 gentle kidney indentation + subtle n = 4 polish).
 * Total harmonic amplitude stays < 0.38, guaranteeing a clean, unified contour
 * that never pinches, self-intersects, or breaks into messy fragments.
 */
export function samplePebbleContour(
  centerX: number,
  centerY: number,
  baseRadius: number,
  options: {
    a2: number;
    a3: number;
    a4: number;
    axisAngle: number;
    kidneyAngle: number;
    polishAngle: number;
    vertexCount?: number;
  }
): ContourPoint[] {
  const count = Math.max(16, options.vertexCount ?? 64);
  const points: ContourPoint[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const mod =
      1 +
      options.a2 * Math.cos(2 * (theta - options.axisAngle)) +
      options.a3 * Math.cos(3 * (theta - options.kidneyAngle)) +
      options.a4 * Math.cos(4 * (theta - options.polishAngle));

    const r = baseRadius * mod;
    points[i] = {
      x: centerX + Math.cos(theta) * r,
      y: centerY + Math.sin(theta) * r,
    };
  }

  return points;
}

/**
 * Advances the tight viscous anchor, damped directional lean, and slow gentle
 * breathing morph to produce all 4 nested monochrome topographic contours.
 */
export function stepPebbleFollowState(
  state: PebbleFollowState,
  dtSeconds: number,
  nowSeconds: number,
  vertexCount = 64
): StepPebbleResult {
  const clampedDt = Math.max(0.001, Math.min(dtSeconds, 0.05));
  const stepScale = clampedDt * 60;

  // Tight, bounce-free viscous follow (~30% closure per 60fps frame -> only a little delay)
  const anchorEase = 1 - Math.pow(0.70, stepScale);
  const nextX = state.anchorX + (state.targetX - state.anchorX) * anchorEase;
  const nextY = state.anchorY + (state.targetY - state.anchorY) * anchorEase;
  const instVx = (nextX - state.anchorX) / Math.max(stepScale, 0.25);
  const instVy = (nextY - state.anchorY) / Math.max(stepScale, 0.25);

  state.anchorX = nextX;
  state.anchorY = nextY;

  const velEase = Math.min(1, 0.22 * stepScale);
  state.vx = lerp(state.vx, instVx, velEase);
  state.vy = lerp(state.vy, instVy, velEase);

  const speed = Math.hypot(state.vx, state.vy);
  const targetLeanStrength = clamp01(speed / 24);
  const leanEase = Math.min(1, (targetLeanStrength > state.leanStrength ? 0.22 : 0.08) * stepScale);
  state.leanStrength = lerp(state.leanStrength, targetLeanStrength, leanEase);

  if (speed > 0.4) {
    const motionAngle = Math.atan2(state.vy, state.vx);
    state.leanAngle = lerpAngle(state.leanAngle, motionAngle, Math.min(1, 0.16 * stepScale));
  }

  // Slow, calm breathing morph keeps the sculptural pebble subtly alive
  const restAxis = -0.35 + Math.sin(nowSeconds * 0.34) * 0.28;
  const axisAngle = lerpAngle(restAxis, state.leanAngle, state.leanStrength * 0.72);
  const kidneyBase = 0.75 + Math.sin(nowSeconds * 0.26 + 1.1) * 0.38;
  const polishBase = -0.9 + Math.cos(nowSeconds * 0.21) * 0.45;

  const breathScale = 1 + Math.sin(nowSeconds * 0.85) * 0.028;
  const baseA2 = 0.155 + Math.sin(nowSeconds * 0.62) * 0.02 + state.leanStrength * 0.075;
  const baseA3 = 0.092 + Math.cos(nowSeconds * 0.48 + 0.8) * 0.018;
  const baseA4 = 0.018 + Math.sin(nowSeconds * 0.39 + 2.1) * 0.006;

  // Eccentric thermal core drifts gently inside the pebble along its organic spine
  const eccentricDir = axisAngle + 0.32 + Math.sin(nowSeconds * 0.31) * 0.24;
  const eccentricCos = Math.cos(eccentricDir);
  const eccentricSin = Math.sin(eccentricDir);
  const leanShiftX = Math.cos(state.leanAngle) * state.leanStrength * 8;
  const leanShiftY = Math.sin(state.leanAngle) * state.leanStrength * 8;

  const tiers: SculptedTierGeometry[] = PEBBLE_CONTOUR_TIERS.map((spec, idx) => {
    const cx =
      state.anchorX +
      eccentricCos * spec.eccentricOffset +
      leanShiftX * (idx / (PEBBLE_CONTOUR_TIERS.length - 1));
    const cy =
      state.anchorY +
      eccentricSin * spec.eccentricOffset +
      leanShiftY * (idx / (PEBBLE_CONTOUR_TIERS.length - 1));

    // Strictly cap harmonics so the shape always remains a smooth sculptural pebble/kidney
    const a2 = Math.min(0.25, baseA2 * spec.a2Scale);
    const a3 = Math.min(0.115, baseA3 * spec.a3Scale);
    const a4 = Math.min(0.026, baseA4);

    const points = samplePebbleContour(cx, cy, spec.radius * breathScale, {
      a2,
      a3,
      a4,
      axisAngle: axisAngle + spec.phaseShift * 0.28,
      kidneyAngle: kidneyBase + spec.phaseShift * 0.45,
      polishAngle: polishBase - spec.phaseShift * 0.35,
      vertexCount,
    });

    return { spec, points, centerX: cx, centerY: cy };
  });

  const remainingDist = Math.hypot(state.targetX - state.anchorX, state.targetY - state.anchorY);
  const kineticEnergy = speed + remainingDist * 0.25 + state.leanStrength * 2;

  return { tiers, kineticEnergy };
}

/**
 * Maps snap-scroller vertical offset to barless header visibility, smooth
 * scroll-linked opacity, and active portfolio section index.
 */
export function computeScrollDashboardState(
  scrollTop: number,
  viewportHeight: number,
  sectionCount: number
): ScrollDashboardState {
  if (viewportHeight <= 0 || sectionCount <= 0) {
    return {
      progress: 0,
      headerOpacity: 0,
      isHeaderVisible: false,
      activeSectionIndex: 0,
    };
  }

  const safeScrollTop = Math.max(0, scrollTop);
  const progress = safeScrollTop / viewportHeight;
  const rawReveal = clamp01(
    (progress - HEADER_REVEAL_START) / (HEADER_REVEAL_END - HEADER_REVEAL_START)
  );
  const headerOpacity = 1 - Math.pow(1 - rawReveal, 3);
  const isHeaderVisible = progress >= HEADER_REVEAL_THRESHOLD;
  const activeSectionIndex = Math.max(
    0,
    Math.min(sectionCount - 1, Math.round(progress))
  );

  return {
    progress,
    headerOpacity,
    isHeaderVisible,
    activeSectionIndex,
  };
}
