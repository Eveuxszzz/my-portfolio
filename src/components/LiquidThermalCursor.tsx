import { useEffect, useRef } from 'react';
import {
  ContourPoint,
  createPebbleFollowState,
  stepPebbleFollowState,
} from '../utils/thermalEngine';

// Compact display buffer (~0.35x viewport, capped at 520px wide) keeps vector
// curves velvety-smooth while minimizing compositor fill cost across devices.
const CANVAS_SCALE = 0.36;
const MAX_CANVAS_WIDTH = 520;
const MIN_CANVAS_DIM = 160;

// Soft multi-shell feather profile replaces costly per-tier CPU Gaussian blurs
// with ultra-fast native vector fills that look silky and consistent across browsers.
const FEATHER_SHELLS = [
  { expand: 1.13, alphaWeight: 0.10 },
  { expand: 1.08, alphaWeight: 0.22 },
  { expand: 1.04, alphaWeight: 0.42 },
  { expand: 1.0, alphaWeight: 0.72 },
] as const;

const traceScaledSmoothContour = (
  ctx: CanvasRenderingContext2D,
  points: ContourPoint[],
  centerX: number,
  centerY: number,
  expand: number,
  scaleX: number,
  scaleY: number
) => {
  const n = points.length;
  if (n < 3) return;

  const mapX = (px: number) => (centerX + (px - centerX) * expand) * scaleX;
  const mapY = (py: number) => (centerY + (py - centerY) * expand) * scaleY;

  const lastX = mapX(points[n - 1].x);
  const lastY = mapY(points[n - 1].y);
  const firstX = mapX(points[0].x);
  const firstY = mapY(points[0].y);

  ctx.beginPath();
  ctx.moveTo((lastX + firstX) * 0.5, (lastY + firstY) * 0.5);

  for (let i = 0; i < n; i++) {
    const px = mapX(points[i].x);
    const py = mapY(points[i].y);
    const next = points[(i + 1) % n];
    const nx = mapX(next.x);
    const ny = mapY(next.y);
    ctx.quadraticCurveTo(px, py, (px + nx) * 0.5, (py + ny) * 0.5);
  }

  ctx.closePath();
};

const LiquidThermalCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;

    let viewportW = window.innerWidth;
    let viewportH = window.innerHeight;
    let bufW = MIN_CANVAS_DIM;
    let bufH = MIN_CANVAS_DIM;
    let scaleX = CANVAS_SCALE;
    let scaleY = CANVAS_SCALE;

    const sim = createPebbleFollowState(viewportW * 0.5, viewportH * 0.5);

    const resize = () => {
      viewportW = Math.max(1, window.innerWidth);
      viewportH = Math.max(1, window.innerHeight);

      const rawW = Math.round(viewportW * CANVAS_SCALE);
      bufW = Math.max(MIN_CANVAS_DIM, Math.min(MAX_CANVAS_WIDTH, rawW));
      bufH = Math.max(
        MIN_CANVAS_DIM,
        Math.round((bufW * viewportH) / Math.max(1, viewportW))
      );

      canvas.width = bufW;
      canvas.height = bufH;
      scaleX = bufW / viewportW;
      scaleY = bufH / viewportH;
    };

    resize();

    let rafId = 0;
    let running = false;
    let lastTime = performance.now();
    let pointerInside = true;
    let visibilityAlpha = 1;

    const renderPebbleTiers = (nowSec: number, dt: number) => {
      const { tiers, kineticEnergy } = stepPebbleFollowState(sim, dt, nowSec, 56);

      const targetVis = pointerInside ? 1 : 0;
      visibilityAlpha += (targetVis - visibilityAlpha) * Math.min(1, 0.16 * (dt * 60));

      ctx.clearRect(0, 0, bufW, bufH);
      if (visibilityAlpha <= 0.01) {
        return kineticEnergy;
      }

      for (let i = 0; i < tiers.length; i++) {
        const { spec, points, centerX, centerY } = tiers[i];
        // Outer tiers feather slightly wider than the inner hotspot for natural heatmap depth
        const tierFeatherBoost = 1 + (tiers.length - 1 - i) * 0.025;

        for (let s = 0; s < FEATHER_SHELLS.length; s++) {
          const shell = FEATHER_SHELLS[s];
          const expand = 1 + (shell.expand - 1) * tierFeatherBoost;
          const shellAlpha = spec.alpha * shell.alphaWeight * visibilityAlpha;

          ctx.fillStyle = `rgba(${spec.r}, ${spec.g}, ${spec.b}, ${shellAlpha.toFixed(3)})`;
          traceScaledSmoothContour(ctx, points, centerX, centerY, expand, scaleX, scaleY);
          ctx.fill();
        }
      }

      return kineticEnergy;
    };

    const drawReducedMotionFrame = () => {
      sim.anchorX = sim.targetX;
      sim.anchorY = sim.targetY;
      sim.vx = 0;
      sim.vy = 0;
      sim.leanStrength = 0;
      visibilityAlpha = pointerInside ? 1 : 0;
      renderPebbleTiers(0, 1 / 60);
    };

    const tick = (now: number) => {
      const dt = Math.max(0.004, Math.min((now - lastTime) / 1000, 0.05));
      lastTime = now;

      if (prefersReducedMotion) {
        drawReducedMotionFrame();
        running = false;
        return;
      }

      const kineticEnergy = renderPebbleTiers(now * 0.001, dt);
      const idleMs = now - sim.lastMoveTime;
      const shouldKeepRunning = pointerInside
        ? kineticEnergy > 0.15 || idleMs < 3200
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
