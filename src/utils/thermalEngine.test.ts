import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEADER_REVEAL_THRESHOLD,
  MAX_ACTIVE_RIPPLES,
  PEBBLE_CONTOUR_TIERS,
  computeScrollDashboardState,
  computeVelocityLean,
  createPebbleFollowState,
  evaluateHeatRippleVisuals,
  evaluatePulseEnvelope,
  exponentialSmoothingFactor,
  samplePebbleContour,
  smootherstep,
  stepPebbleFollowState,
  triggerPebblePulse,
  updatePebbleTarget,
} from './thermalEngine';

test('exponentialSmoothingFactor and smootherstep satisfy mathematical smoothing invariants', () => {
  // Frame-rate independence: two 1/120s steps equal one 1/60s step
  const alpha60 = exponentialSmoothingFactor(1 / 60, 0.08);
  const alpha120 = exponentialSmoothingFactor(1 / 120, 0.08);
  const combined120 = 1 - (1 - alpha120) * (1 - alpha120);
  assert.ok(Math.abs(alpha60 - combined120) < 1e-12, 'Exponential smoothing must be frame-rate independent');

  // Quintic smootherstep boundary and symmetry invariants
  assert.equal(smootherstep(0), 0);
  assert.equal(smootherstep(0.5), 0.5);
  assert.equal(smootherstep(1), 1);
  assert.ok(smootherstep(0.2) < 0.2, 'Smootherstep eases gently out of zero');
  assert.ok(smootherstep(0.8) > 0.8, 'Smootherstep eases gently into one');

  // Velocity-to-lean response smoothly saturates without discontinuity
  const still = computeVelocityLean(0, 0);
  const gentle = computeVelocityLean(350, 0);
  const fast = computeVelocityLean(1800, 0);
  const extreme = computeVelocityLean(9000, 0);

  assert.equal(still.leanStrength, 0);
  assert.ok(gentle.leanStrength > 0 && gentle.leanStrength < fast.leanStrength);
  assert.ok(fast.leanStrength < extreme.leanStrength && extreme.leanStrength <= 1);
  assert.ok(Math.abs(fast.angle - 0) < 1e-6);
  assert.ok(Math.abs(fast.dirX - 1) < 1e-6);
});

test('PEBBLE_CONTOUR_TIERS defines 4 ascending monochrome topographic values', () => {
  assert.equal(PEBBLE_CONTOUR_TIERS.length, 4);

  for (let i = 0; i < PEBBLE_CONTOUR_TIERS.length; i++) {
    const t = PEBBLE_CONTOUR_TIERS[i];
    const spread = Math.max(t.r, t.g, t.b) - Math.min(t.r, t.g, t.b);
    assert.ok(spread <= 12, `Tier ${t.id} should stay monochrome silver/ash (spread=${spread})`);

    if (i > 0) {
      const prev = PEBBLE_CONTOUR_TIERS[i - 1];
      assert.ok(t.radius < prev.radius, 'Inner tiers must nest cleanly inside outer tiers');
      assert.ok(t.r - prev.r >= 40, 'Each tonal value should step up clearly in luminance');
      assert.ok(t.alpha > prev.alpha, 'Inner tiers should increase gently in opacity');
      assert.ok(t.eccentricOffset > prev.eccentricOffset, 'Inner tiers should nest with subtle eccentric shift');
    }
  }
});

test('samplePebbleContour applies subtle directional lean toward the velocity angle', () => {
  const pts = samplePebbleContour(200, 200, 120, {
    a2: 0.17,
    a3: 0.0,
    a4: 0.0,
    axisAngle: 0,
    kidneyAngle: 0,
    polishAngle: 0,
    leanBias: 0.055,
    leanAngle: 0, // leaning right (+X)
    vertexCount: 64,
  });

  // Point directly ahead (theta = 0, index 0) reaches slightly farther than point behind (theta = pi, index 32)
  const leadingReach = pts[0].x - 200;
  const trailingReach = 200 - pts[32].x;
  assert.ok(
    leadingReach > trailingReach + 8,
    `Leading edge (${leadingReach.toFixed(1)}) should subtly lean ahead of trailing edge (${trailingReach.toFixed(1)})`
  );
});

test('stepPebbleFollowState tracks tightly, leans along smoothed cursor velocity, and relaxes at rest', () => {
  const state = createPebbleFollowState(200, 200);
  // First pointer entry initializes cleanly without a jump
  updatePebbleTarget(state, 200, 200, 0);

  // Move cursor steadily down-right along ~30° vector
  let res = stepPebbleFollowState(state, 1 / 60, 0.01);
  for (let f = 1; f <= 8; f++) {
    updatePebbleTarget(state, 200 + f * 32, 200 + f * 18, f * 16.6);
    res = stepPebbleFollowState(state, 1 / 60, f / 60);
  }

  assert.equal(res.tiers.length, 4);
  const expectedAngle = Math.atan2(18, 32);
  assert.ok(
    Math.abs(res.lean.angle - expectedAngle) < 0.35,
    `Expected pebble lean angle (~${expectedAngle.toFixed(2)}) to align with cursor velocity (got ${res.lean.angle.toFixed(2)})`
  );
  assert.ok(res.lean.leanStrength > 0.35, `Expected clear directional lean while moving (got ${res.lean.leanStrength.toFixed(2)})`);

  // Pause cursor -> anchor settles tightly and directional lean smoothly relaxes toward zero
  for (let f = 0; f < 65; f++) {
    res = stepPebbleFollowState(state, 1 / 60, 0.2 + f / 60);
  }
  assert.ok(Math.abs(state.anchorX - (200 + 8 * 32)) < 2);
  assert.ok(Math.abs(state.anchorY - (200 + 8 * 18)) < 2);
  assert.ok(res.lean.leanStrength < 0.06, `Expected directional lean to relax smoothly at rest (got ${res.lean.leanStrength.toFixed(2)})`);
});

test('computeScrollDashboardState hides header on first page and smoothly reveals past threshold', () => {
  const vh = 900;
  const totalPages = 4;

  const top = computeScrollDashboardState(0, vh, totalPages);
  assert.equal(top.isHeaderVisible, false);
  assert.equal(top.headerOpacity, 0);
  assert.equal(top.activeSectionIndex, 0);

  const mid = computeScrollDashboardState(vh * (HEADER_REVEAL_THRESHOLD + 0.05), vh, totalPages);
  assert.equal(mid.isHeaderVisible, true);
  assert.ok(mid.headerOpacity > 0.4 && mid.headerOpacity < 1);

  assert.deepEqual(computeScrollDashboardState(vh * 1, vh, totalPages), {
    progress: 1,
    headerOpacity: 1,
    isHeaderVisible: true,
    activeSectionIndex: 1,
  });
});

test('triggerPebblePulse swells the pebble, radiates a temporary organic heat ring ripple, and returns to breathing', () => {
  // Pure pulse envelope invariants
  assert.equal(evaluatePulseEnvelope(0), 0);
  assert.equal(evaluatePulseEnvelope(1), 0);
  assert.ok(evaluatePulseEnvelope(0.22) > 0.85, 'Pulse peaks smoothly soon after click');
  assert.ok(evaluatePulseEnvelope(0.7) < evaluatePulseEnvelope(0.22), 'Pulse decays gently back to baseline');

  // Pure heat ring ripple visual progression
  const early = evaluateHeatRippleVisuals(0.15);
  const mid = evaluateHeatRippleVisuals(0.5);
  const end = evaluateHeatRippleVisuals(1.0);
  assert.ok(early.alpha > 0 && early.alpha <= 0.28, 'Heat ring starts faint and atmospheric');
  assert.ok(mid.radius > early.radius, 'Heat ring radiates outward over time');
  assert.ok(mid.alpha < early.alpha, 'Heat ring fades gently as it expands');
  assert.equal(end.alpha, 0, 'Heat ring completely vanishes at end of lifetime');

  // Integrated state lifecycle
  const state = createPebbleFollowState(500, 400);
  const baseline = stepPebbleFollowState(state, 1 / 60, 1.0);
  assert.equal(baseline.ripples.length, 0);
  assert.equal(baseline.pulseIntensity, 0);

  triggerPebblePulse(state, 510, 405);
  // Advance ~120ms (7 frames) to catch active pulse swell + expanding ripple
  let active = baseline;
  for (let i = 0; i < 7; i++) {
    active = stepPebbleFollowState(state, 1 / 60, 1.0 + (i + 1) / 60);
  }
  assert.ok(active.pulseIntensity > 0.5, `Expected active click pulse swell (got ${active.pulseIntensity.toFixed(2)})`);
  assert.equal(active.ripples.length, 1);
  assert.ok(active.ripples[0].alpha > 0.05 && active.ripples[0].alpha <= 0.28);
  assert.ok(active.tiers[3].alphaMultiplier > 1.05, 'Inner thermal core briefly brightens during pulse');

  // Rapid clicks respect MAX_ACTIVE_RIPPLES cap
  for (let c = 0; c < MAX_ACTIVE_RIPPLES + 3; c++) {
    triggerPebblePulse(state, 500, 400);
  }
  assert.equal(state.ripples.length, MAX_ACTIVE_RIPPLES);

  // After 1.1s (66 frames), both pulse and all heat ripples expire cleanly back to breathing state
  let settled = active;
  for (let i = 0; i < 66; i++) {
    settled = stepPebbleFollowState(state, 1 / 60, 1.2 + i / 60);
  }
  assert.equal(settled.pulseIntensity, 0);
  assert.equal(settled.ripples.length, 0);
  assert.equal(settled.tiers[3].alphaMultiplier, 1);
});
