import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEADER_REVEAL_THRESHOLD,
  OIL_FOUR_VALUES,
  buildFourValueOilLUT,
  computeScrollDashboardState,
  createOilFollowState,
  stepOilFollowState,
  warpHeatmapField,
} from './thermalEngine';

test('buildFourValueOilLUT produces 4 distinct non-linear monochrome tonal plateaus', () => {
  const lut = buildFourValueOilLUT();
  assert.equal(lut.length, 256 * 4);
  assert.equal(OIL_FOUR_VALUES.length, 4);

  // Transparent below first value threshold
  assert.equal(lut[3], 0);
  assert.equal(lut[5 * 4 + 3], 0);

  // Sample inside each of the 4 non-linear plateaus
  const plateauIndices = [42, 95, 162, 232];
  const plateauLuminances = plateauIndices.map((idx) => lut[idx * 4]);
  const plateauAlphas = plateauIndices.map((idx) => lut[idx * 4 + 3]);

  for (let i = 1; i < plateauLuminances.length; i++) {
    assert.ok(
      plateauLuminances[i] - plateauLuminances[i - 1] >= 40,
      `Value ${i + 1} (${plateauLuminances[i]}) should clearly step above Value ${i} (${plateauLuminances[i - 1]})`
    );
    assert.ok(plateauAlphas[i] > plateauAlphas[i - 1]);
  }

  for (let i = 0; i < 256; i++) {
    const idx = i * 4;
    const spread =
      Math.max(lut[idx], lut[idx + 1], lut[idx + 2]) -
      Math.min(lut[idx], lut[idx + 1], lut[idx + 2]);
    assert.ok(spread <= 12, `LUT entry ${i} should stay monochrome (spread=${spread})`);
  }
});

test('fluid heatmap follow simulation stays close to cursor and forms non-circular lobes', () => {
  const state = createOilFollowState(200, 200);
  assert.equal(state.lobes.length, 5);

  state.targetX = 520;
  state.targetY = 340;

  let result = stepOilFollowState(state, 1 / 60, 0.1);
  for (let f = 1; f <= 5; f++) {
    result = stepOilFollowState(state, 1 / 60, 0.1 + f / 60);
  }

  // Tight delay: closes >75% of gap within 5 frames (~83ms) with zero overshoot
  const progressX = (state.anchorX - 200) / (520 - 200);
  assert.ok(progressX > 0.75 && progressX < 1, `Expected tight follow progress (got ${progressX.toFixed(2)})`);

  // Lobes are genuinely elliptical/non-circular
  assert.ok(
    result.samples.some((s) => Math.abs(s.radiusX - s.radiusY) > 25),
    'Fluid heatmap lobes should be strongly non-circular'
  );

  // Settles quickly onto the pointer
  for (let f = 0; f < 30; f++) {
    result = stepOilFollowState(state, 1 / 60, 0.2 + f / 60);
  }
  assert.ok(Math.abs(state.anchorX - 520) < 2);
  assert.ok(Math.abs(state.anchorY - 340) < 2);
});

test('warpHeatmapField organically breaks radial symmetry of a circular scalar field', () => {
  const w = 80;
  const h = 80;
  const field = new Uint8ClampedArray(w * h * 4);
  const out = new Uint8ClampedArray(w * h * 4);
  const lut = buildFourValueOilLUT();

  // Populate a perfectly circular heat spot at center (40, 40)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dist = Math.hypot(x - 40, y - 40);
      const val = Math.max(0, Math.round((1 - dist / 28) * 255));
      field[(y * w + x) * 4 + 3] = val;
    }
  }

  warpHeatmapField(field, out, w, h, lut, 1.4);

  // Compare four symmetric cardinal points at equal radius from center:
  // Domain warping must break rotational symmetry so they do not all match.
  const pts = [
    out[(40 * w + 56) * 4 + 3],
    out[(40 * w + 24) * 4 + 3],
    out[(56 * w + 40) * 4 + 3],
    out[(24 * w + 40) * 4 + 3],
  ];
  const uniqueAlphas = new Set(pts);
  assert.ok(
    uniqueAlphas.size > 1,
    `Warped heatmap should break circular symmetry (got alphas: ${pts.join(', ')})`
  );
  assert.ok(out[(40 * w + 40) * 4 + 3] > 0, 'Center region should remain illuminated');
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
