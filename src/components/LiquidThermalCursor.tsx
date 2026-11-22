import { useEffect, useRef } from 'react';
import {
  OIL_FOUR_VALUES,
  buildFourValueOilLUT,
  createOilFollowState,
  stepOilFollowState,
} from '../utils/thermalEngine';

const BUFFER_SCALE = 0.24;
const MIN_BUFFER_DIM = 96;
const MAX_BUFFER_WIDTH = 360;

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
      const maxR = 148 * scaleX;
      const radii = [maxR, maxR * 0.76, maxR * 0.52, maxR * 0.28];

      // Draw 4 calm concentric values for reduced-motion accessibility
      for (let i = 0; i < OIL_FOUR_VALUES.length; i++) {
        const v = OIL_FOUR_VALUES[i];
        ctx.fillStyle = `rgba(${v.r}, ${v.g}, ${v.b}, ${(v.a / 255).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, radii[i], 0, Math.PI * 2);
        ctx.fill();
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

      // Gently fade visibility when the pointer leaves the document
      const targetVis = pointerInside ? 1 : 0;
      visibilityAlpha += (targetVis - visibilityAlpha) * Math.min(1, 0.12 * (dt * 60));

      // 1. Clear field each frame so it behaves as a clean, cohesive oil drop following the pointer
      fieldCtx.clearRect(0, 0, bufW, bufH);

      if (visibilityAlpha > 0.01) {
        fieldCtx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < samples.length; i++) {
          const s = samples[i];
          const cx = s.x * scaleX;
          const cy = s.y * scaleY;
          const rx = Math.max(6, s.radiusX * scaleX);
          const ry = Math.max(6, s.radiusY * scaleY);

          fieldCtx.save();
          fieldCtx.translate(cx, cy);
          fieldCtx.rotate(s.angle);
          fieldCtx.scale(1, ry / rx);

          const alpha = Math.min(0.6, s.weight * visibilityAlpha);
          const grad = fieldCtx.createRadialGradient(0, 0, 0, 0, 0, rx);
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
          grad.addColorStop(0.32, `rgba(255, 255, 255, ${(alpha * 0.7).toFixed(3)})`);
          grad.addColorStop(0.64, `rgba(255, 255, 255, ${(alpha * 0.36).toFixed(3)})`);
          grad.addColorStop(0.86, `rgba(255, 255, 255, ${(alpha * 0.12).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          fieldCtx.fillStyle = grad;
          fieldCtx.beginPath();
          fieldCtx.arc(0, 0, rx, 0, Math.PI * 2);
          fieldCtx.fill();
          fieldCtx.restore();
        }
      }

      // 2. Map the merged metaball field through the 4-value monochrome gradient LUT
      if (outputImageData) {
        const fieldData = fieldCtx.getImageData(0, 0, bufW, bufH).data;
        const out = outputImageData.data;

        for (let i = 0; i < fieldData.length; i += 4) {
          const density = fieldData[i + 3];
          if (density < 10) {
            out[i] = 0;
            out[i + 1] = 0;
            out[i + 2] = 0;
            out[i + 3] = 0;
          } else {
            const lutIdx = density * 4;
            out[i] = lut[lutIdx];
            out[i + 1] = lut[lutIdx + 1];
            out[i + 2] = lut[lutIdx + 2];
            out[i + 3] = lut[lutIdx + 3];
          }
        }

        oilCtx.putImageData(outputImageData, 0, 0);

        // 3. Subtle smoothing keeps the 4 tonal bands distinct yet organic like oil in water
        ctx.clearRect(0, 0, bufW, bufH);
        ctx.save();
        ctx.filter = 'blur(1.2px)';
        ctx.drawImage(oilCanvas, 0, 0);
        ctx.restore();
      }

      const idleMs = now - sim.lastMoveTime;
      const shouldKeepRunning = pointerInside
        ? kineticEnergy > 0.25 || idleMs < 2600
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
