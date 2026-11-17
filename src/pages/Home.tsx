import { useEffect, useRef } from 'react';

// Grayscale fractal-noise grain as a fully-encoded data URI (safe inside CSS url("...")).
const NOISE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

const GLOW_SIZE = 320;
const PAGES = [1, 2, 3];

const Home = () => {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = glow.current;
    if (!el) return;

    // The glow eases toward the pointer each frame, trailing it dynamically,
    // and scales up with how fast the pointer is moving.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { x: target.x, y: target.y };
    let raf = 0;
    let running = false;

    const tick = () => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy);
      pos.x += dx * 0.16;
      pos.y += dy * 0.16;
      const scale = 1 + Math.min(dist * 0.004, 0.35);
      el.style.transform = `translate(${pos.x - GLOW_SIZE / 2}px, ${pos.y - GLOW_SIZE / 2}px) scale(${scale.toFixed(3)})`;
      if (dist > 0.2 || scale > 1.001) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };
    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const onMouse = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      start();
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) {
        target.x = t.clientX;
        target.y = t.clientY;
        start();
      }
    };

    window.addEventListener('mousemove', onMouse);
    window.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        height: '100%',
        background: '#000',
        overflow: 'hidden',
        userSelect: 'none',
        isolation: 'isolate',
      }}
    >
      <div className="snap-scroller" role="region" aria-label="Portfolio snap pages" tabIndex={0}>
        <section className="snap-page" aria-label="Front page">
          <div className="snap-page__layer" aria-hidden="true" />
        </section>
        {PAGES.map((page) => (
          <section key={page} className="snap-page" aria-label={`Page ${page}`}>
            <div className="snap-page__layer" aria-hidden="true" />
            <div className="snap-placeholder">
              <span className="snap-placeholder__label">Page {page} placeholder</span>
              <div className="snap-placeholder__bar" aria-hidden="true" />
              <div className="snap-placeholder__bar" aria-hidden="true" />
            </div>
          </section>
        ))}
      </div>
      {/* grainy black background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: GRAIN,
          backgroundRepeat: 'repeat',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      {/* white grainy glow that eases toward the pointer and lights the grain beneath it */}
      <div
        ref={glow}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: `${GLOW_SIZE}px`,
          height: `${GLOW_SIZE}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0) 66%), ${GRAIN}`,
          backgroundSize: '100% 100%, 256px 256px',
          backgroundRepeat: 'no-repeat, repeat',
          mixBlendMode: 'screen',
          filter: 'blur(20px)',
          pointerEvents: 'none',
          transform: `translate(calc(50vw - ${GLOW_SIZE / 2}px), calc(50vh - ${GLOW_SIZE / 2}px))`,
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default Home;
