import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, toggle, t } = useLang();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector('.snap-container');
      const pageY = container ? container.scrollTop : window.scrollY;
      setScrolled(pageY > 50);
    };

    const container = document.querySelector('.snap-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close the menu whenever the route changes
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isHome = pathname === '/';

  return (
    <>
      <nav className={`navbar ${scrolled && !menuOpen ? 'scrolled' : ''}`}>
        <div className="navbar__logo">
          <Link href="/" aria-label="Toshi — Startseite">
            <img src="/images/toshi-logo.webp" alt="Toshi" className="navbar__logo-img" />
          </Link>
        </div>

        <div className="navbar__right">
          <ul className="navbar__links">
            <li><Link href="/story">{t.nav.about}</Link></li>
            <li><a href={isHome ? "#menu" : "/#menu"}>{t.nav.menu}</a></li>
            <li><a href={isHome ? "#gallery" : "/#gallery"}>{t.nav.gallery}</a></li>
            <li><a href={isHome ? "#contact" : "/#contact"}>{t.nav.contact}</a></li>
          </ul>

          <div className="lang-toggle" onClick={toggle}>
            <span className={lang === 'de' ? 'lang-toggle__active' : ''}>DE</span>
            <span className="lang-toggle__sep">/</span>
            <span className={lang === 'en' ? 'lang-toggle__active' : ''}>EN</span>
          </div>

          <a href="https://www.lieferando.de/speisekarte/toshi-sushi-asia-kuche-freital" target="_blank" rel="noopener noreferrer" className="btn-primary navbar__order">
            {t.nav.order}
          </a>

          <button
            type="button"
            className={`navbar__burger ${menuOpen ? 'is-open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}>
        <ul className="mobile-menu__links">
          <li><Link href="/story" onClick={() => setMenuOpen(false)}>{t.nav.about}</Link></li>
          <li><a href={isHome ? "#menu" : "/#menu"} onClick={() => setMenuOpen(false)}>{t.nav.menu}</a></li>
          <li><a href={isHome ? "#gallery" : "/#gallery"} onClick={() => setMenuOpen(false)}>{t.nav.gallery}</a></li>
          <li><a href={isHome ? "#contact" : "/#contact"} onClick={() => setMenuOpen(false)}>{t.nav.contact}</a></li>
        </ul>

        <a
          href="https://www.lieferando.de/speisekarte/toshi-sushi-asia-kuche-freital"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mobile-menu__order"
          onClick={() => setMenuOpen(false)}
        >
          {t.nav.order}
        </a>

        <div className="mobile-menu__lang" onClick={toggle}>
          <span className={lang === 'de' ? 'lang-toggle__active' : ''}>DE</span>
          <span className="lang-toggle__sep">/</span>
          <span className={lang === 'en' ? 'lang-toggle__active' : ''}>EN</span>
        </div>
      </div>
    </>
  );
}
