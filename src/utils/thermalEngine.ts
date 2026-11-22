export interface OilLobe {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  aspectX: number;
  aspectY: number;
  weight: number;
  damping: number;
  offsetRadius: number;
  orbitSpeed: number;
  spinSpeed: number;
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

export interface WarpBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const HEADER_REVEAL_START = 0.18;
export const HEADER_REVEAL_END = 0.58;
export const HEADER_REVEAL_THRESHOLD = 0.32;

/**
 * Non-linear 4-value monochrome silver & ash heatmap bands.
 * Non-uniform thresholds give a wide atmospheric ash outer slick, fluid
 * graphite & silver mid-thermal contours, and a concentrated eccentric
 * pearl-white hotspot rather than evenly spaced concentric rings.
 */
export const OIL_FOUR_VALUES: readonly ValueBand[] = [
  { threshold: 0.08, r: 44, g: 46, b: 50, a: 50 },    // Value 1: Smoked Ash outer plume
  { threshold: 0.25, r: 92, g: 95, b: 101, a: 90 },   // Value 2: Cool Graphite contour
  { threshold: 0.49, r: 158, g: 162, b: 168, a: 134 },// Value 3: Liquid Silver thermal ridge
  { threshold: 0.78, r: 234, g: 237, b: 241, a: 178 },// Value 4: Pearl Hotspot core
];

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp01((x - edge0) / Math.max(edge1 - edge0, 1e-6));
  return t * t * (3 - 2 * t);
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Builds a 256-entry RGBA lookup table (length 1024) implementing a non-linear
 * 4-value monochrome heatmap gradient with silky feathered transitions.
 */
export function buildFourValueOilLUT(): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256 * 4);
  const feather = 0.052;

  for (let i = 0; i < 256; i++) {
    const t = i / 255;

    const v0 = OIL_FOUR_VALUES[0];
    const enter = smoothstep(v0.threshold - feather, v0.threshold + feather, t);
    let r = lerp(0, v0.r, enter);
    let g = lerp(0, v0.g, enter);
    let b = lerp(0, v0.b, enter);
    let a = lerp(0, v0.a, enter);

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
 * Initializes a tight-follow, asymmetric 5-lobe fluid heatmap drop.
 * Varied elliptical ratios, non-zero offsets, and counter-drifting phases
 * produce an organic, non-circular oil-in-water heatmap silhouette that stays
 * close to the cursor with only a subtle liquid delay.
 */
export function createOilFollowState(initialX: number, initialY: number): OilFollowState {
  const lobes: OilLobe[] = [
    // Eccentric core hotspot (slightly offset so peak heat isn't a dead-center bullseye)
    {
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius: 146,
      aspectX: 1.26,
      aspectY: 0.82,
      weight: 0.50,
      damping: 0.60,
      offsetRadius: 16,
      orbitSpeed: 0.58,
      spinSpeed: 0.24,
      phase: 0.2,
    },
    // Broad primary fluid shoulder
    {
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius: 164,
      aspectX: 1.42,
      aspectY: 0.72,
      weight: 0.30,
      damping: 0.69,
      offsetRadius: 56,
      orbitSpeed: 0.44,
      spinSpeed: -0.31,
      phase: 1.35,
    },
    // Counter-drifting flank lobe creating organic waist / asymmetry
    {
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius: 148,
      aspectX: 1.34,
      aspectY: 0.76,
      weight: 0.26,
      damping: 0.74,
      offsetRadius: 68,
      orbitSpeed: -0.52,
      spinSpeed: 0.28,
      phase: 3.1,
    },
    // Trailing fluid tendril that bends gently with cursor movement
    {
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius: 120,
      aspectX: 1.52,
      aspectY: 0.66,
      weight: 0.22,
      damping: 0.79,
      offsetRadius: 82,
      orbitSpeed: 0.38,
      spinSpeed: -0.22,
      phase: 4.75,
    },
    // Secondary buoyant thermal eddy
    {
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
      radius: 112,
      aspectX: 0.76,
      aspectY: 1.36,
      weight: 0.19,
      damping: 0.76,
      offsetRadius: 72,
      orbitSpeed: -0.66,
      spinSpeed: 0.35,
      phase: 5.6,
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
 * Advances the tight-follow fluid heatmap simulation by one frame.
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

    // Non-circular Lissajous-like buoyant drift keeps lobes flowing organically
    const tOrbit = nowSeconds * lobe.orbitSpeed + lobe.phase;
    const radialMod = 0.76 + 0.34 * Math.sin(nowSeconds * 0.75 + lobe.phase * 1.9);
    const orbitX = Math.cos(tOrbit) * lobe.offsetRadius * radialMod;
    const orbitY =
      Math.sin(tOrbit * 0.78 + lobe.phase * 0.5) * lobe.offsetRadius * (radialMod * 0.92);

    // Slight wake bias bends outer lobes fluidly behind motion without long lag
    const wakeDrag = i === 0 ? 0.15 : 0.45 + i * 0.28;
    const goalX = state.anchorX + orbitX - state.anchorVx * wakeDrag;
    const goalY = state.anchorY + orbitY - state.anchorVy * wakeDrag;

    const lobeEase = 1 - Math.pow(lobe.damping, stepScale);
    const nextX = lobe.x + (goalX - lobe.x) * lobeEase;
    const nextY = lobe.y + (goalY - lobe.y) * lobeEase;
    const rawVx = (nextX - lobe.x) / Math.max(stepScale, 0.25);
    const rawVy = (nextY - lobe.y) / Math.max(stepScale, 0.25);

    lobe.vx = lerp(lobe.vx, rawVx, Math.min(1, 0.34 * stepScale));
    lobe.vy = lerp(lobe.vy, rawVy, Math.min(1, 0.34 * stepScale));
    lobe.x = nextX;
    lobe.y = nextY;

    const lobeSpeed = Math.hypot(lobe.vx, lobe.vy);
    kineticEnergy += lobeSpeed * 0.55;

    // Combine inherent eccentric lobe proportions with gentle motion-driven stretch
    const motionStretch = 1 + Math.min(lobeSpeed * 0.014, 0.32);
    const motionSquash = 1 / Math.sqrt(motionStretch);
    const breathX = 1 + Math.sin(nowSeconds * 1.15 + lobe.phase) * 0.09;
    const breathY = 1 + Math.cos(nowSeconds * 0.95 + lobe.phase * 1.4) * 0.09;

    const baseAngle = nowSeconds * lobe.spinSpeed + lobe.phase;
    const localAngle =
      lobeSpeed > 0.45
        ? lerp(baseAngle, Math.atan2(lobe.vy, lobe.vx), Math.min(0.65, lobeSpeed * 0.06))
        : baseAngle;

    samples.push({
      x: lobe.x,
      y: lobe.y,
      radiusX: lobe.radius * lobe.aspectX * motionStretch * breathX,
      radiusY: lobe.radius * lobe.aspectY * motionSquash * breathY,
      angle: localAngle,
      weight: lobe.weight,
    });
  }

  return { samples, kineticEnergy };
}

/**
 * Applies smooth 2D fluid domain warping + bilinear sampling to a scalar heat
 * buffer and maps each pixel through the 4-value monochrome heatmap LUT.
 * Breaks geometric circularity into organic, flowing thermal oil contours.
 */
export function warpHeatmapField(
  fieldData: Uint8ClampedArray,
  outputData: Uint8ClampedArray,
  width: number,
  height: number,
  lut: Uint8ClampedArray,
  nowSeconds: number,
  bounds?: WarpBounds
): void {
  outputData.fill(0);
  if (width < 2 || height < 2) return;

  const minX = Math.max(0, bounds ? Math.floor(bounds.minX) : 0);
  const minY = Math.max(0, bounds ? Math.floor(bounds.minY) : 0);
  const maxX = Math.min(width - 1, bounds ? Math.ceil(bounds.maxX) : width - 1);
  const maxY = Math.min(height - 1, bounds ? Math.ceil(bounds.maxY) : height - 1);

  if (minX > maxX || minY > maxY) return;

  // Multi-frequency spatial warp amplitudes (in compact buffer pixels)
  const ampPrimary = Math.max(5.5, Math.min(11.5, width * 0.032));
  const ampSecondary = ampPrimary * 0.46;
  const f1 = 0.068;
  const f2 = 0.128;
  const t1 = nowSeconds * 0.92;
  const t2 = nowSeconds * 0.64;

  // Precompute 1D axis waves so inner pixel loop avoids trig calls
  const sinX1 = new Float32Array(width);
  const cosX1 = new Float32Array(width);
  const sinX2 = new Float32Array(width);
  for (let x = minX; x <= maxX; x++) {
    sinX1[x] = Math.sin(x * f1 + t1);
    cosX1[x] = Math.cos(x * f1 - t1 * 0.85);
    sinX2[x] = Math.sin(x * f2 - t2 * 1.15);
  }

  const sinY1 = new Float32Array(height);
  const cosY1 = new Float32Array(height);
  const cosY2 = new Float32Array(height);
  for (let y = minY; y <= maxY; y++) {
    sinY1[y] = Math.sin(y * f1 - t1 * 0.78);
    cosY1[y] = Math.cos(y * f1 + t1 * 0.95);
    cosY2[y] = Math.cos(y * f2 + t2);
  }

  const maxW = width - 1.001;
  const maxH = height - 1.001;

  for (let y = minY; y <= maxY; y++) {
    const sy1 = sinY1[y];
    const cy1 = cosY1[y];
    const cy2 = cosY2[y];
    const rowOffset = y * width;

    for (let x = minX; x <= maxX; x++) {
      // Smooth 2D curl-like fluid displacement breaks radial symmetry organically
      const dx = ampPrimary * (sy1 * cosX1[x] + 0.45 * cy1) + ampSecondary * (sinX2[x] * cy2);
      const dy = ampPrimary * (cosX1[x] * cy1 - 0.45 * sinX1[x]) + ampSecondary * (cy2 * sinX1[x]);

      const sx = x + dx;
      const sy = y + dy;
      if (sx < 0 || sy < 0 || sx >= maxW || sy >= maxH) continue;

      // Bilinear interpolation of scalar heat alpha channel keeps contours silky
      const x0 = sx | 0;
      const y0 = sy | 0;
      const fx = sx - x0;
      const fy = sy - y0;

      const i00 = (y0 * width + x0) * 4 + 3;
      const i10 = i00 + 4;
      const i01 = i00 + width * 4;
      const i11 = i01 + 4;

      const top = fieldData[i00] + (fieldData[i10] - fieldData[i00]) * fx;
      const bot = fieldData[i01] + (fieldData[i11] - fieldData[i01]) * fx;
      const rawDensity = top + (bot - top) * fy;

      if (rawDensity < 9) continue;

      // Non-linear thermal response curve enriches outer fluid contours & hotspot peak
      const norm = rawDensity / 255;
      const curved = Math.pow(norm, 0.92);
      const lutIdx = Math.min(255, Math.round(curved * 255)) * 4;

      const outIdx = (rowOffset + x) * 4;
      outputData[outIdx] = lut[lutIdx];
      outputData[outIdx + 1] = lut[lutIdx + 1];
      outputData[outIdx + 2] = lut[lutIdx + 2];
      outputData[outIdx + 3] = lut[lutIdx + 3];
    }
  }
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
