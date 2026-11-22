import { useCallback, useEffect, useRef, useState } from 'react';
import LiquidThermalCursor from '../components/LiquidThermalCursor';
import BarlessHeaderDashboard, {
  StudioSectionItem,
} from '../components/BarlessHeaderDashboard';
import { computeScrollDashboardState } from '../utils/thermalEngine';

// Grayscale fractal-noise grain as a fully-encoded data URI (safe inside CSS url("...")).
const NOISE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`;
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

interface PortfolioSnapPage extends StudioSectionItem {
  indexLabel: string;
  placeholderCaption: string;
}

const STUDIO_PAGES: PortfolioSnapPage[] = [
  {
    id: 'work',
    label: 'Work',
    pageIndex: 1,
    indexLabel: '01',
    placeholderCaption: 'Selected projects placeholder',
  },
  {
    id: 'about',
    label: 'About',
    pageIndex: 2,
    indexLabel: '02',
    placeholderCaption: 'Practice and background placeholder',
  },
  {
    id: 'journal',
    label: 'Journal',
    pageIndex: 3,
    indexLabel: '03',
    placeholderCaption: 'Notes and essays placeholder',
  },
];

const TOTAL_PAGES = 1 + STUDIO_PAGES.length;

const Home = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLElement | null>>([]);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  const syncScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const next = computeScrollDashboardState(
      scroller.scrollTop,
      scroller.clientHeight,
      TOTAL_PAGES
    );
    setIsHeaderVisible(next.isHeaderVisible);
    setHeaderOpacity(next.headerOpacity);
    setActiveSectionIndex(next.activeSectionIndex);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    syncScrollState();
    scroller.addEventListener('scroll', syncScrollState, { passive: true });
    window.addEventListener('resize', syncScrollState, { passive: true });

    return () => {
      scroller.removeEventListener('scroll', syncScrollState);
      window.removeEventListener('resize', syncScrollState);
    };
  }, [syncScrollState]);

  const handleNavigateSection = useCallback((pageIndex: number) => {
    const scroller = scrollerRef.current;
    const targetSection = pageRefs.current[pageIndex];
    if (!scroller || !targetSection) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    scroller.scrollTo({
      top: targetSection.offsetTop,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, []);

  return (
    <div
      className="home-stage"
      data-header-visible={isHeaderVisible ? 'true' : 'false'}
      data-active-section={activeSectionIndex}
    >
      {/* Static ambient monochrome thermal field */}
      <div className="gradient-field" aria-hidden="true" />

      {/* Liquified monochrome silver-and-ash thermal cursor trail */}
      <LiquidThermalCursor />

      {/* Barless floating portfolio header revealed when scrolling past the first snap page */}
      <BarlessHeaderDashboard
        visible={isHeaderVisible}
        revealOpacity={headerOpacity}
        activeSectionIndex={activeSectionIndex}
        sections={STUDIO_PAGES}
        onNavigateSection={handleNavigateSection}
      />

      <div
        ref={scrollerRef}
        className="snap-scroller"
        data-testid="snap-scroller"
        role="region"
        aria-label="Portfolio snap pages"
        tabIndex={0}
      >
        {/* First snap page: unobstructed dark thermal canvas with subtle scroll cue */}
        <section
          ref={(el) => {
            pageRefs.current[0] = el;
          }}
          className="snap-page snap-page--front"
          aria-label="Front page"
        >
          <button
            type="button"
            className={`front-scroll-cue${isHeaderVisible ? ' is-faded' : ''}`}
            onClick={() => handleNavigateSection(1)}
            aria-label="Scroll down to Work"
          >
            <span>Scroll</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 2.5V11.5M7 11.5L3.25 7.75M7 11.5L10.75 7.75"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>

        {/* Portfolio placeholder snap sections matching studio navigation */}
        {STUDIO_PAGES.map((page) => (
          <section
            key={page.id}
            ref={(el) => {
              pageRefs.current[page.pageIndex] = el;
            }}
            id={page.id}
            className="snap-page"
            aria-label={page.label}
          >
            <div className="snap-placeholder">
              <div className="snap-placeholder__header">
                <span className="snap-placeholder__index">{page.indexLabel}</span>
                <h2 className="snap-placeholder__title">{page.label}</h2>
              </div>
              <p className="snap-placeholder__caption">{page.placeholderCaption}</p>
              <div className="snap-placeholder__bar" aria-hidden="true" />
              <div className="snap-placeholder__bar" aria-hidden="true" />
            </div>
          </section>
        ))}
      </div>

      {/* Grainy dark film texture over the thermal field */}
      <div
        className="home-grain-overlay"
        style={{ backgroundImage: GRAIN }}
        aria-hidden="true"
      />
    </div>
  );
};

export default Home;
