import { Link } from 'react-router-dom';

export interface StudioSectionItem {
  id: string;
  label: string;
  pageIndex: number;
}

interface BarlessHeaderDashboardProps {
  visible: boolean;
  revealOpacity: number;
  activeSectionIndex: number;
  sections: StudioSectionItem[];
  onNavigateSection: (pageIndex: number) => void;
}

const BarlessHeaderDashboard = ({
  visible,
  revealOpacity,
  activeSectionIndex,
  sections,
  onNavigateSection,
}: BarlessHeaderDashboardProps) => {
  const linkTabIndex = visible ? 0 : -1;
  const clampedReveal = Math.max(0, Math.min(1, revealOpacity));

  return (
    <header
      className={`barless-header${visible ? ' is-visible' : ''}`}
      style={{
        opacity: clampedReveal,
        transform: `translateY(${((1 - clampedReveal) * -10).toFixed(2)}px)`,
      }}
      data-testid="barless-header-dashboard"
      data-visible={visible ? 'true' : 'false'}
      aria-hidden={!visible}
    >
      <div className="barless-header__inner">
        {/* Zone 1: Single-line portfolio placeholder wordmark */}
        <button
          type="button"
          className="barless-header__wordmark"
          onClick={() => onNavigateSection(0)}
          tabIndex={linkTabIndex}
          aria-label="Return to front page"
        >
          Name
        </button>

        {/* Zone 2: Floating barless studio section links */}
        <nav className="barless-header__nav" aria-label="Portfolio sections">
          {sections.map((section) => {
            const isActive = activeSectionIndex === section.pageIndex;
            return (
              <button
                key={section.id}
                type="button"
                className={`barless-header__link${isActive ? ' is-active' : ''}`}
                onClick={() => onNavigateSection(section.pageIndex)}
                tabIndex={linkTabIndex}
                aria-current={isActive ? 'location' : undefined}
              >
                {section.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single floating Contact text action */}
        <div className="barless-header__action">
          <Link
            to="/contact"
            className="barless-header__link barless-header__contact"
            tabIndex={linkTabIndex}
          >
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
};

export default BarlessHeaderDashboard;
