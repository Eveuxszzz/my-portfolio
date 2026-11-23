import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEADER_REVEAL_THRESHOLD,
  PEBBLE_CONTOUR_TIERS,
  computeScrollDashboardState,
  createPebbleFollowState,
  samplePebbleContour,
  stepPebbleFollowState,
} from './thermalEngine';

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

test('samplePebbleContour generates a smooth, cohesive, non-circular pebble/kidney curve', () => {
  const pts = samplePebbleContour(200, 200, 120, {
    a2: 0.17,
    a3: 0.095,
    a4: 0.018,
    axisAngle: -0.35,
    kidneyAngle: 0.75,
    polishAngle: -0.9,
    vertexCount: 64,
  });

  assert.equal(pts.length, 64);

  const radii = pts.map((p) => Math.hypot(p.x - 200, p.y - 200));
  const minR = Math.min(...radii);
  const maxR = Math.max(...radii);

  // Clearly non-circular (aspect/harmonic spread > 28%) while staying strictly smooth & bounded
  const ratio = maxR / minR;
  assert.ok(ratio > 1.28 && ratio < 2.0, `Expected smooth sculptural pebble ratio (got ${ratio.toFixed(2)})`);
  assert.ok(minR > 75, 'Contour should never pinch inward or self-intersect');

  // Verify smooth step-to-step continuity around the closed loop (no spiky jumps)
  for (let i = 0; i < radii.length; i++) {
    const next = radii[(i + 1) % radii.length];
    assert.ok(Math.abs(next - radii[i]) < 8, 'Adjacent contour vertices must transition smoothly');
  }
});

test('stepPebbleFollowState tracks tightly with subtle directional lean and settles cleanly', () => {
  const state = createPebbleFollowState(200, 200);
  state.targetX = 520;
  state.targetY = 320;

  let res = stepPebbleFollowState(state, 1 / 60, 0.1);
  for (let f = 1; f <= 5; f++) {
    res = stepPebbleFollowState(state, 1 / 60, 0.1 + f / 60);
  }

  assert.equal(res.tiers.length, 4);

  // Tight delay: closes >75% within 5 frames (~83ms) with zero overshoot
  const progressX = (state.anchorX - 200) / (520 - 200);
  assert.ok(progressX > 0.75 && progressX < 1, `Expected tight follow progress (got ${progressX.toFixed(2)})`);

  // Subtle directional lean engages while moving
  assert.ok(state.leanStrength > 0.25, `Expected directional lean while moving (got ${state.leanStrength.toFixed(2)})`);

  // Settles back cleanly onto pointer with lean relaxing toward zero
  for (let f = 0; f < 60; f++) {
    res = stepPebbleFollowState(state, 1 / 60, 0.2 + f / 60);
  }
  assert.ok(Math.abs(state.anchorX - 520) < 1.5);
  assert.ok(Math.abs(state.anchorY - 320) < 1.5);
  assert.ok(state.leanStrength < 0.08, `Expected directional lean to relax at rest (got ${state.leanStrength.toFixed(2)})`);
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
