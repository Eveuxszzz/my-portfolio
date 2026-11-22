export interface OilLobe {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  weight: number;
  stiffness: number;
  damping: number;
  offsetRadius: number;
  orbitSpeed: number;
  phase: number;
}

export interface OilFollowState {
  targetX: number;
  targetY: number;
  anchorX: number;
  anchorY: number;
  anchorVx: number;
  anchorVy: number;
  speed: number;
  angle: number;
  lastMoveTime: number;
  lobes: OilLobe[];
}

export interface OilLobeSample {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  angle: number;
  weight: number;
}

export interface StepOilResult {
  samples: OilLobeSample[];
  kineticEnergy: number;
}

export interface ScrollDashboardState {
  progress: number;
  headerOpacity: number;
  isHeaderVisible: boolean;
  activeSectionIndex: number;
}

export interface ValueBand {
  threshold: number;
  r: number;
  g: number;
  b: number;
  a: number;
}

export const HEADER_REVEAL_START = 0.18;
export const HEADER_REVEAL_END = 0.58;
export const HEADER_REVEAL_THRESHOLD = 0.32;

/**
 * 4-value monochrome silver & ash gradient bands for the oil-in-water highlight.
 * Thresholds are evenly distributed across the non-clipping metaball field so
 * all 4 values (smoked ash -> graphite -> cool silver -> pearl white) read
 * clearly as lush, softly feathered concentric oil bands.
 */
export const OIL_FOUR_VALUES: readonly ValueBand[] = [
  { threshold: 0.10, r: 48, g: 50, b: 54, a: 46 },    // Value 1: Smoked Ash (outer slick)
  { threshold: 0.30, r: 98, g: 101, b: 106, a: 84 },  // Value 2: Cool Graphite
  { threshold: 0.54, r: 164, g: 167, b: 172, a: 126 },// Value 3: Liquid Silver
  { threshold: 0.76, r: 232, g: 235, b: 239, a: 168 },// Value 4: Pearl Core
];

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp01((x - edge0) / Math.max(edge1 - edge0, 1e-6));
  return t * t * (3 - 2 * t);
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Builds a 256-entry RGBA lookup table (length 1024) implementing a 4-value
 * monochrome gradient with soft, feathered transitions between each of the
 * 4 tonal plateaus so the floating oil highlight reads cleanly as 4 nested
 * organic value bands.
 */
export function buildFourValueOilLUT(): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256 * 4);
  const feather = 0.058;

  for (let i = 0; i < 256; i++) {
    const t = i / 255;

    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;

    // Fade cleanly from transparent canvas into Value 1
    const v0 = OIL_FOUR_VALUES[0];
    const enter = smoothstep(v0.threshold - feather, v0.threshold + feather, t);
    r = lerp(0, v0.r, enter);
    g = lerp(0, v0.g, enter);
    b = lerp(0, v0.b, enter);
    a = lerp(0, v0.a, enter);

    // Step smoothly through Values 2, 3, and 4
    for (let k = 1; k < OIL_FOUR_VALUES.length; k++) {
      const band = OIL_FOUR_VALUES[k];
      const blend = smoothstep(band.threshold - feather, band.threshold + feather, t);
      r = lerp(r, band.r, blend);
      g = lerp(g, band.g, blend);
      b = lerp(b, band.b, blend);
      a = lerp(a, band.a, blend);
    }

    const idx = i * 4;
    lut[idx] = Math.round(r);
    lut[idx + 1] = Math.round(g);
    lut[idx + 2] = Math.round(b);
    lut[idx + 3] = Math.round(a);
  }

  return lut;
}

/**
 * Initializes a simple, cohesive oil-in-water follow simulation.
 * Lobe weights are calibrated so their additive sum peaks near ~0.95 at the
 * center without flat-clipping, letting all 4 gradient values spread evenly
 * across the buoyant, gently morphing oil silhouette.
 */
export function createOilFollowState(initialX: number, initialY: number): OilFollowState {
  const lobes: OilLobe[] = [
    // Primary oil body: tracks tightly right behind the pointer
    {
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius: 196,
      weight: 0.45,
      stiffness: 0.36,
      damping: 0.62,
      offsetRadius: 0,
      orbitSpeed: 0.48,
      phase: 0,
    },
    // Closely coupled surface-tension lobes with minimal liquid lag
    {
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius: 162,
      weight: 0.24,
      stiffness: 0.28,
      damping: 0.70,
      offsetRadius: 30,
      orbitSpeed: 0.64,
      phase: 0.4,
    },
    {
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius: 148,
      weight: 0.20,
      stiffness: 0.23,
      damping: 0.75,
      offsetRadius: 38,
      orbitSpeed: -0.52,
      phase: 2.5,
    },
    {
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius: 132,
      weight: 0.17,
      stiffness: 0.19,
      damping: 0.79,
      offsetRadius: 42,
      orbitSpeed: 0.42,
      phase: 4.4,
    },
  ];

  return {
    targetX: initialX,
    targetY: initialY,
    anchorX: initialX,
    anchorY: initialY,
    anchorVx: 0,
    anchorVy: 0,
    speed: 0,
    angle: 0,
    lastMoveTime: 0,
    lobes,
  };
}

/**
 * Advances the oil-in-water follow simulation by one frame.
 * Uses tight viscous exponential easing so the highlight tracks closely to
 * the cursor with only a subtle liquid delay and gentle oil surface tension.
 */
export function stepOilFollowState(
  state: OilFollowState,
  dtSeconds: number,
  nowSeconds: number
): StepOilResult {
  const clampedDt = Math.max(0.001, Math.min(dtSeconds, 0.05));
  const stepScale = clampedDt * 60;

  // Tight, bounce-free viscous follow (~30% closure per 60fps frame -> only a subtle delay)
  const anchorEase = 1 - Math.pow(0.70, stepScale);
  const nextAnchorX = state.anchorX + (state.targetX - state.anchorX) * anchorEase;
  const nextAnchorY = state.anchorY + (state.targetY - state.anchorY) * anchorEase;
  state.anchorVx = (nextAnchorX - state.anchorX) / Math.max(stepScale, 0.25);
  state.anchorVy = (nextAnchorY - state.anchorY) / Math.max(stepScale, 0.25);
  state.anchorX = nextAnchorX;
  state.anchorY = nextAnchorY;

  const anchorSpeed = Math.hypot(state.anchorVx, state.anchorVy);
  state.speed = lerp(state.speed, anchorSpeed, Math.min(1, 0.28 * stepScale));
  if (anchorSpeed > 0.25) {
    state.angle = Math.atan2(state.anchorVy, state.anchorVx);
  }

  const samples: OilLobeSample[] = [];
  let kineticEnergy = anchorSpeed;

  for (let i = 0; i < state.lobes.length; i++) {
    const lobe = state.lobes[i];

    // Gentle buoyant orbit keeps the oil silhouette organically shifting like oil on water
    const driftAngle = nowSeconds * lobe.orbitSpeed + lobe.phase;
    const radialPulse = 1 + Math.sin(nowSeconds * 0.9 + lobe.phase * 1.4) * 0.2;
    const goalX = state.anchorX + Math.cos(driftAngle) * lobe.offsetRadius * radialPulse;
    const goalY = state.anchorY + Math.sin(driftAngle * 0.85) * lobe.offsetRadius * radialPulse;

    const lobeEase = 1 - Math.pow(lobe.damping, stepScale);
    const nextX = lobe.x + (goalX - lobe.x) * lobeEase;
    const nextY = lobe.y + (goalY - lobe.y) * lobeEase;
    const rawVx = (nextX - lobe.x) / Math.max(stepScale, 0.25);
    const rawVy = (nextY - lobe.y) / Math.max(stepScale, 0.25);

    lobe.vx = lerp(lobe.vx, rawVx, Math.min(1, 0.35 * stepScale));
    lobe.vy = lerp(lobe.vy, rawVy, Math.min(1, 0.35 * stepScale));
    lobe.x = nextX;
    lobe.y = nextY;

    const lobeSpeed = Math.hypot(lobe.vx, lobe.vy);
    kineticEnergy += lobeSpeed * 0.6;

    // Subtle surface-tension elongation along glide direction
    const stretch = 1 + Math.min(lobeSpeed * 0.011, 0.28);
    const squash = 1 / Math.sqrt(stretch);
    const breath = 1 + Math.sin(nowSeconds * 1.25 + lobe.phase) * 0.045;
    const localAngle = lobeSpeed > 0.25 ? Math.atan2(lobe.vy, lobe.vx) : state.angle;

    samples.push({
      x: lobe.x,
      y: lobe.y,
      radiusX: lobe.radius * stretch * breath,
      radiusY: lobe.radius * squash * breath,
      angle: localAngle,
      weight: lobe.weight,
    });
  }

  return { samples, kineticEnergy };
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
