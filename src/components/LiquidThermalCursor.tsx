import { useEffect, useRef } from 'react';
import {
  OIL_FOUR_VALUES,
  buildFourValueOilLUT,
  createOilFollowState,
  stepOilFollowState,
  warpHeatmapField,
} from '../utils/thermalEngine';

const BUFFER_SCALE = 0.22;
const MIN_BUFFER_DIM = 96;
const MAX_BUFFER_WIDTH = 320;

const LiquidThermalCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const fieldCanvas = document.createElement('canvas');
    const fieldCtx = fieldCanvas.getContext('2d', { willReadFrequently: true });
    if (!fieldCtx) return;

    const oilCanvas = document.createElement('canvas');
    const oilCtx = oilCanvas.getContext('2d');
    if (!oilCtx) return;

    const lut = buildFourValueOilLUT();
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;

    let viewportW = window.innerWidth;
    let viewportH = window.innerHeight;
    let bufW = MIN_BUFFER_DIM;
    let bufH = MIN_BUFFER_DIM;
    let scaleX = BUFFER_SCALE;
    let scaleY = BUFFER_SCALE;
    let outputImageData: ImageData | null = null;

    const sim = createOilFollowState(viewportW * 0.5, viewportH * 0.5);

    const resize = () => {
      viewportW = Math.max(1, window.innerWidth);
      viewportH = Math.max(1, window.innerHeight);

      const rawW = Math.round(viewportW * BUFFER_SCALE);
      bufW = Math.max(MIN_BUFFER_DIM, Math.min(MAX_BUFFER_WIDTH, rawW));
      bufH = Math.max(
        MIN_BUFFER_DIM,
        Math.round((bufW * viewportH) / Math.max(1, viewportW))
      );

      canvas.width = bufW;
      canvas.height = bufH;
      fieldCanvas.width = bufW;
      fieldCanvas.height = bufH;
      oilCanvas.width = bufW;
      oilCanvas.height = bufH;

      scaleX = bufW / viewportW;
      scaleY = bufH / viewportH;
      outputImageData = oilCtx.createImageData(bufW, bufH);
    };

    resize();

    let rafId = 0;
    let running = false;
    let lastTime = performance.now();
    let pointerInside = true;
    let visibilityAlpha = 1;

    const drawReducedMotionFrame = () => {
      ctx.clearRect(0, 0, bufW, bufH);
      const cx = sim.targetX * scaleX;
      const cy = sim.targetY * scaleY;
      const maxR = 160 * scaleX;
      const shapes = [
        { rx: maxR * 1.15, ry: maxR * 0.85, ox: 0, oy: 0, rot: -0.25 },
        { rx: maxR * 0.84, ry: maxR * 0.66, ox: -5, oy: 2, rot: -0.18 },
        { rx: maxR * 0.56, ry: maxR * 0.44, ox: -8, oy: -2, rot: -0.1 },
        { rx: maxR * 0.28, ry: maxR * 0.22, ox: -6, oy: -3, rot: 0.05 },
      ];

      for (let i = 0; i < OIL_FOUR_VALUES.length; i++) {
        const v = OIL_FOUR_VALUES[i];
        const s = shapes[i];
        ctx.save();
        ctx.translate(cx + s.ox, cy + s.oy);
        ctx.rotate(s.rot);
        ctx.fillStyle = `rgba(${v.r}, ${v.g}, ${v.b}, ${(v.a / 255).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const tick = (now: number) => {
      const dt = Math.max(0.004, Math.min((now - lastTime) / 1000, 0.05));
      lastTime = now;

      if (prefersReducedMotion) {
        drawReducedMotionFrame();
        running = false;
        return;
      }

      const nowSec = now * 0.001;
      const { samples, kineticEnergy } = stepOilFollowState(sim, dt, nowSec);

      const targetVis = pointerInside ? 1 : 0;
      visibilityAlpha += (targetVis - visibilityAlpha) * Math.min(1, 0.16 * (dt * 60));

      fieldCtx.clearRect(0, 0, bufW, bufH);

      let minX = bufW;
      let minY = bufH;
      let maxX = 0;
      let maxY = 0;

      if (visibilityAlpha > 0.01) {
        fieldCtx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          const cx = s.x * scaleX;
          const cy = s.y * scaleY;
          const rx = Math.max(6, s.radiusX * scaleX);
          const ry = Math.max(6, s.radiusY * scaleY);
          const maxExtent = Math.max(rx, ry);

          minX = Math.min(minX, cx - maxExtent);
          minY = Math.min(minY, cy - maxExtent);
          maxX = Math.max(maxX, cx + maxExtent);
          maxY = Math.max(maxY, cy + maxExtent);

          fieldCtx.save();
          fieldCtx.translate(cx, cy);
          fieldCtx.rotate(s.angle);
          fieldCtx.scale(1, ry / rx);

          const alpha = Math.min(0.62, s.weight * visibilityAlpha);
          const grad = fieldCtx.createRadialGradient(0, 0, 0, 0, 0, rx);
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
          grad.addColorStop(0.28, `rgba(255, 255, 255, ${(alpha * 0.72).toFixed(3)})`);
          grad.addColorStop(0.58, `rgba(255, 255, 255, ${(alpha * 0.34).toFixed(3)})`);
          grad.addColorStop(0.84, `rgba(255, 255, 255, ${(alpha * 0.1).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          fieldCtx.fillStyle = grad;
          fieldCtx.beginPath();
          fieldCtx.arc(0, 0, rx, 0, Math.PI * 2);
          fieldCtx.fill();
          fieldCtx.restore();
        }
      }

      // Warp the merged asymmetric metaball field and map through the 4-value heatmap LUT
      if (outputImageData) {
        const warpMargin = Math.ceil(bufW * 0.055) + 4;
        const fieldData = fieldCtx.getImageData(0, 0, bufW, bufH).data;

        warpHeatmapField(fieldData, outputImageData.data, bufW, bufH, lut, nowSec, {
          minX: minX - warpMargin,
          minY: minY - warpMargin,
          maxX: maxX + warpMargin,
          maxY: maxY + warpMargin,
        });

        oilCtx.putImageData(outputImageData, 0, 0);

        ctx.clearRect(0, 0, bufW, bufH);
        ctx.save();
        ctx.filter = 'blur(1.4px)';
        ctx.drawImage(oilCanvas, 0, 0);
        ctx.restore();
      }

      const idleMs = now - sim.lastMoveTime;
      const shouldKeepRunning = pointerInside
        ? kineticEnergy > 0.25 || idleMs < 2400
        : visibilityAlpha > 0.015;

      if (shouldKeepRunning) {
        rafId = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const wake = () => {
      if (!running) {
        running = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (x: number, y: number) => {
      pointerInside = true;
      sim.targetX = x;
      sim.targetY = y;
      sim.lastMoveTime = performance.now();
      wake();
    };

    const onMouseMove = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onPointerMove(t.clientX, t.clientY);
    };
    const onPointerLeave = () => {
      pointerInside = false;
      sim.lastMoveTime = performance.now();
      wake();
    };
    const onReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      wake();
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    reducedMotionQuery.addEventListener('change', onReducedMotionChange);

    sim.lastMoveTime = performance.now();
    wake();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('mouseleave', onPointerLeave);
      reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="thermal-cursor-canvas"
      className="thermal-cursor-canvas"
      aria-hidden="true"
    />
  );
};

export default LiquidThermalCursor;
