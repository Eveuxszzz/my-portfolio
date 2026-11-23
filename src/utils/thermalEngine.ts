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

export interface VelocityLeanMetrics {
  speed: number;
  angle: number;
  leanStrength: number;
  dirX: number;
  dirY: number;
}

export interface PebbleFollowState {
  targetX: number;
  targetY: number;
  lastTargetX: number;
  lastTargetY: number;
  hasPointerMoved: boolean;
  anchorX: number;
  anchorY: number;
  /** Low-pass smoothed cursor velocity vector in px/s */
  smoothVx: number;
  smoothVy: number;
  leanAngle: number;
  leanStrength: number;
  lastMoveTime: number;
}

export interface StepPebbleResult {
  tiers: SculptedTierGeometry[];
  kineticEnergy: number;
  lean: VelocityLeanMetrics;
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
 * Exact frame-rate-independent first-order exponential smoothing coefficient:
 * alpha = 1 - exp(-dt / tau).
 */
export function exponentialSmoothingFactor(
  dtSeconds: number,
  timeConstantSeconds: number
): number {
  if (dtSeconds <= 0) return 0;
  if (timeConstantSeconds <= 0) return 1;
  return 1 - Math.exp(-dtSeconds / timeConstantSeconds);
}

/**
 * C2-continuous quintic Hermite smoothing polynomial (6t^5 - 15t^4 + 10t^3).
 * Has zero first and second derivatives at t = 0 and t = 1 for silky transitions.
 */
export function smootherstep(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Maps a smoothed 2D cursor velocity vector (px/s) through a smooth hyperbolic
 * tangent saturation curve composed with quintic smootherstep so directional
 * lean ramps organically from stillness and saturates gently on fast flicks.
 */
export function computeVelocityLean(
  vx: number,
  vy: number,
  referenceSpeedPxPerSec = 1100
): VelocityLeanMetrics {
  const speed = Math.hypot(vx, vy);
  if (speed < 1e-3) {
    return { speed: 0, angle: 0, leanStrength: 0, dirX: 0, dirY: 0 };
  }

  const normalized = Math.tanh(speed / Math.max(referenceSpeedPxPerSec, 1));
  const leanStrength = smootherstep(normalized);
  const invSpeed = 1 / speed;

  return {
    speed,
    angle: Math.atan2(vy, vx),
    leanStrength,
    dirX: vx * invSpeed,
    dirY: vy * invSpeed,
  };
}

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
    lastTargetX: initialX,
    lastTargetY: initialY,
    hasPointerMoved: false,
    anchorX: initialX,
    anchorY: initialY,
    smoothVx: 0,
    smoothVy: 0,
    leanAngle: -0.35,
    leanStrength: 0,
    lastMoveTime: 0,
  };
}

/**
 * Updates cursor target coordinates cleanly without introducing a velocity spike
 * on the first pointer entry event.
 */
export function updatePebbleTarget(
  state: PebbleFollowState,
  x: number,
  y: number,
  nowMs: number
): void {
  if (!state.hasPointerMoved) {
    state.lastTargetX = x;
    state.lastTargetY = y;
    state.hasPointerMoved = true;
  }
  state.targetX = x;
  state.targetY = y;
  state.lastMoveTime = nowMs;
}

/**
 * Evaluates a single smooth closed sculptural pebble / organic kidney contour
 * using strictly bounded low-order polar harmonics plus a subtle asymmetric
 * directional lean along the smoothed velocity vector.
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
    leanBias?: number;
    leanAngle?: number;
    vertexCount?: number;
  }
): ContourPoint[] {
  const count = Math.max(16, options.vertexCount ?? 64);
  const points: ContourPoint[] = new Array(count);
  const leanBias = options.leanBias ?? 0;
  const leanAngle = options.leanAngle ?? options.axisAngle;

  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const mod =
      1 +
      leanBias * Math.cos(theta - leanAngle) +
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
 * Advances the tight viscous anchor and mathematically smoothed cursor velocity
 * vector (continuous-time exponential low-pass filter + tanh/smootherstep lean
 * response) to produce all 4 nested monochrome topographic contours.
 */
export function stepPebbleFollowState(
  state: PebbleFollowState,
  dtSeconds: number,
  nowSeconds: number,
  vertexCount = 64
): StepPebbleResult {
  const dt = Math.max(0.001, Math.min(dtSeconds, 0.05));

  // 1. Tight, frame-rate-independent viscous anchor follow (tau = 0.048s -> ~30% per 60Hz frame)
  const anchorAlpha = exponentialSmoothingFactor(dt, 0.048);
  const nextX = state.anchorX + (state.targetX - state.anchorX) * anchorAlpha;
  const nextY = state.anchorY + (state.targetY - state.anchorY) * anchorAlpha;
  const anchorVx = (nextX - state.anchorX) / dt;
  const anchorVy = (nextY - state.anchorY) / dt;
  state.anchorX = nextX;
  state.anchorY = nextY;

  // 2. Measure true cursor velocity vector (blended lightly with anchor velocity for
  //    continuous silky flow between discrete pointer events) and low-pass smooth it.
  const rawCursorVx = (state.targetX - state.lastTargetX) / dt;
  const rawCursorVy = (state.targetY - state.lastTargetY) / dt;
  state.lastTargetX = state.targetX;
  state.lastTargetY = state.targetY;

  const drivenVx = rawCursorVx * 0.65 + anchorVx * 0.35;
  const drivenVy = rawCursorVy * 0.65 + anchorVy * 0.35;
  const drivenSpeed = Math.hypot(drivenVx, drivenVy);
  const currentSmoothSpeed = Math.hypot(state.smoothVx, state.smoothVy);

  // Asymmetric exponential smoothing: responsive attack when accelerating, calm viscous release when stopping
  const velocityTau = drivenSpeed > currentSmoothSpeed ? 0.075 : 0.165;
  const velocityAlpha = exponentialSmoothingFactor(dt, velocityTau);
  state.smoothVx = lerp(state.smoothVx, drivenVx, velocityAlpha);
  state.smoothVy = lerp(state.smoothVy, drivenVy, velocityAlpha);

  // 3. Apply smooth nonlinear velocity-to-lean transfer (tanh + quintic smootherstep)
  const lean = computeVelocityLean(state.smoothVx, state.smoothVy, 1100);

  const leanAlpha = exponentialSmoothingFactor(
    dt,
    lean.leanStrength > state.leanStrength ? 0.085 : 0.19
  );
  state.leanStrength = lerp(state.leanStrength, lean.leanStrength, leanAlpha);

  if (lean.speed > 18) {
    const angleAlpha = exponentialSmoothingFactor(dt, 0.11);
    state.leanAngle = lerpAngle(state.leanAngle, lean.angle, angleAlpha);
  }

  // 4. Slow calm breathing morph combined with subtle directional lean along the smoothed velocity vector
  const restAxis = -0.35 + Math.sin(nowSeconds * 0.34) * 0.28;
  const axisAngle = lerpAngle(restAxis, state.leanAngle, state.leanStrength * 0.78);
  const kidneyBase = 0.75 + Math.sin(nowSeconds * 0.26 + 1.1) * 0.38;
  const polishBase = -0.9 + Math.cos(nowSeconds * 0.21) * 0.45;

  const breathScale = 1 + Math.sin(nowSeconds * 0.85) * 0.028;
  const baseA2 = 0.15 + Math.sin(nowSeconds * 0.62) * 0.018 + state.leanStrength * 0.085;
  const baseA3 = 0.09 + Math.cos(nowSeconds * 0.48 + 0.8) * 0.016;
  const baseA4 = 0.017 + Math.sin(nowSeconds * 0.39 + 2.1) * 0.005;
  const baseLeanBias = state.leanStrength * 0.058;

  // Eccentric thermal core leans gently forward into the direction of cursor travel
  const eccentricDir = axisAngle + 0.32 + Math.sin(nowSeconds * 0.31) * 0.24;
  const eccentricCos = Math.cos(eccentricDir);
  const eccentricSin = Math.sin(eccentricDir);
  const leanCos = Math.cos(state.leanAngle);
  const leanSin = Math.sin(state.leanAngle);
  const forwardShiftMax = state.leanStrength * 14;

  const tiers: SculptedTierGeometry[] = PEBBLE_CONTOUR_TIERS.map((spec, idx) => {
    const tierRatio = idx / (PEBBLE_CONTOUR_TIERS.length - 1);
    const cx =
      state.anchorX +
      eccentricCos * spec.eccentricOffset +
      leanCos * forwardShiftMax * tierRatio;
    const cy =
      state.anchorY +
      eccentricSin * spec.eccentricOffset +
      leanSin * forwardShiftMax * tierRatio;

    const a2 = Math.min(0.25, baseA2 * spec.a2Scale);
    const a3 = Math.min(0.112, baseA3 * spec.a3Scale);
    const a4 = Math.min(0.025, baseA4);
    const leanBias = Math.min(0.065, baseLeanBias * (0.7 + tierRatio * 0.5));

    const points = samplePebbleContour(cx, cy, spec.radius * breathScale, {
      a2,
      a3,
      a4,
      axisAngle: axisAngle + spec.phaseShift * 0.26,
      kidneyAngle: kidneyBase + spec.phaseShift * 0.42,
      polishAngle: polishBase - spec.phaseShift * 0.32,
      leanBias,
      leanAngle: state.leanAngle,
      vertexCount,
    });

    return { spec, points, centerX: cx, centerY: cy };
  });

  const remainingDist = Math.hypot(state.targetX - state.anchorX, state.targetY - state.anchorY);
  const kineticEnergy = lean.speed / 60 + remainingDist * 0.25 + state.leanStrength * 3;

  return {
    tiers,
    kineticEnergy,
    lean: {
      speed: lean.speed,
      angle: state.leanAngle,
      leanStrength: state.leanStrength,
      dirX: leanCos * state.leanStrength,
      dirY: leanSin * state.leanStrength,
    },
  };
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
