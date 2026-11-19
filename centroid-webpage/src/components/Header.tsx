import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { api, usingMock } from '../api';

export function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M14 1v6M14 21v6M1 14h6M21 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="3" fill="var(--accent)" />
    </svg>
  );
}

const Header = () => {
  const [online, setOnline] = useState<boolean | null>(null);
  const { pathname } = useLocation();

  // ping /api/health now and every 15 seconds
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const ok = await api.checkHealth();
      if (!cancelled) setOnline(ok);
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // a preview page counts as part of "Videos"
  const videosActive = pathname.startsWith('/videos') || pathname.startsWith('/preview/');

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/videos" className="brand">
          <Logo />
          <span>Centroid Finder</span>
        </Link>
        <nav aria-label="Main" className="main-nav">
          <Link to="/videos" className={videosActive ? 'active' : undefined} aria-current={videosActive ? 'page' : undefined}>
            Videos
          </Link>
          <NavLink to="/jobs" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Jobs
          </NavLink>
        </nav>
        {usingMock ? (
          <span className="pill pill--processing">
            <span className="pill__dot" />
            Mock data
          </span>
        ) : (
          online !== null && (
            <span className={`pill ${online ? 'pill--done' : 'pill--error'}`}>
              <span className="pill__dot" />
              {online ? 'Server online' : 'Server offline'}
            </span>
          )
        )}
      </div>
    </header>
  );
};

export default Header;
