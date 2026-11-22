import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEADER_REVEAL_THRESHOLD,
  OIL_FOUR_VALUES,
  buildFourValueOilLUT,
  computeScrollDashboardState,
  createOilFollowState,
  stepOilFollowState,
} from './thermalEngine';

test('buildFourValueOilLUT produces 4 distinct monochrome tonal value plateaus', () => {
  const lut = buildFourValueOilLUT();
  assert.equal(lut.length, 256 * 4);
  assert.equal(OIL_FOUR_VALUES.length, 4);

  // Transparent below first value threshold
  assert.equal(lut[3], 0);
  assert.equal(lut[8 * 4 + 3], 0);

  // Sample the center of each of the 4 value plateaus
  const plateauIndices = [52, 108, 166, 232];
  const plateauLuminances = plateauIndices.map((idx) => lut[idx * 4]);
  const plateauAlphas = plateauIndices.map((idx) => lut[idx * 4 + 3]);

  // Luminance and opacity should strictly step up across all 4 values
  for (let i = 1; i < plateauLuminances.length; i++) {
    assert.ok(
      plateauLuminances[i] - plateauLuminances[i - 1] >= 40,
      `Value ${i + 1} (${plateauLuminances[i]}) should be clearly brighter than Value ${i} (${plateauLuminances[i - 1]})`
    );
    assert.ok(plateauAlphas[i] > plateauAlphas[i - 1]);
  }

  // Every LUT entry remains monochrome silver/ash
  for (let i = 0; i < 256; i++) {
    const idx = i * 4;
    const spread =
      Math.max(lut[idx], lut[idx + 1], lut[idx + 2]) -
      Math.min(lut[idx], lut[idx + 1], lut[idx + 2]);
    assert.ok(spread <= 14, `LUT entry ${i} should stay monochrome (spread=${spread})`);
  }
});

test('oil-in-water follow simulation stays close to cursor with only a subtle delay', () => {
  const state = createOilFollowState(200, 200);
  assert.equal(state.lobes.length, 4);

  state.targetX = 520;
  state.targetY = 340;

  let result = stepOilFollowState(state, 1 / 60, 0.1);
  for (let f = 1; f <= 5; f++) {
    result = stepOilFollowState(state, 1 / 60, 0.1 + f / 60);
  }

  // Tight delay: closes >75% of the 320px gap within 5 frames (~83ms) with zero overshoot
  const progressX = (state.anchorX - 200) / (520 - 200);
  assert.ok(progressX > 0.75 && progressX < 1, `Expected tight follow progress (got ${progressX.toFixed(2)})`);
  assert.ok(result.samples[0].radiusX > result.samples[0].radiusY);

  // Lobes stay closely coupled (cohesive oil drop, not a fragmented streak)
  for (let i = 1; i < state.lobes.length; i++) {
    const dist = Math.hypot(
      state.lobes[i].x - state.lobes[0].x,
      state.lobes[i].y - state.lobes[0].y
    );
    assert.ok(dist < 90, `Lobe ${i} should remain cohesively coupled to oil core (dist=${dist})`);
  }

  // Settles quickly onto the pointer
  for (let f = 0; f < 30; f++) {
    result = stepOilFollowState(state, 1 / 60, 0.2 + f / 60);
  }
  assert.ok(Math.abs(state.anchorX - 520) < 2);
  assert.ok(Math.abs(state.anchorY - 340) < 2);
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
  assert.deepEqual(computeScrollDashboardState(vh * 3, vh, totalPages), {
    progress: 3,
    headerOpacity: 1,
    isHeaderVisible: true,
    activeSectionIndex: 3,
  });
});
