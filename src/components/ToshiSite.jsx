'use client';

import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import Script from 'next/script';
import ToshiPreloader from './ToshiPreloader';
import ToshiCursor from './ToshiCursor';

/* ══════════════════════════════════════════════════
   TOSHI SUSHI & ASIA KÜCHE — one-page site
   Palette: ink lacquer #14110d · aged brass #c9a876 · parchment #f3ead9 · hanko red #8c2a26
   Type: Marcellus (serif headline) · Zen Kaku Gothic New (sans body) · Cormorant italic (accent)
   ══════════════════════════════════════════════════ */

const LIEFERANDO = 'https://www.lieferando.de/en/menu/toshi-sushi-asia-kuche-freital';
const INSTAGRAM = 'https://www.instagram.com/toshi.dresden/';
const KNIFE_IMAGE = '/images/knife-freshness.webp';
const COOKIE_KEY = 'toshi-cookie-consent';

const GOLD = '#c9a876';
const STAMP = '#8c2a26';
const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 36, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: EASE } },
};

/* ---------- Order Modal — store/location data ---------- */
function checkStoreOpen(slots) {
  const now = new Date();
  const gt = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const day = gt.getDay();
  const total = gt.getHours() * 60 + gt.getMinutes();
  return slots.some((s) => s.days.includes(day) && total >= s.open && total < s.close);
}

const ORDER_STORES = [
  {
    id: 'buehlau',
    name: 'Dresden Bühlau',
    address: 'Elisabethstraße 19',
    city: '01324 Dresden',
    lat: 51.0621074,
    lng: 13.8386589,
    postcodes: ['01097', '01099', '01237', '01277', '01279', '01307', '01309', '01324', '01326', '01328', '01454', '01477'],
    comingSoon: false,
    deliveryOnly: false,
    lieferandoUrl: 'https://www.lieferando.de/speisekarte/toshi-sushi-asia-kuche',
    openHours: [
      { days: [1, 2, 3, 4], open: 11 * 60 + 30, close: 21 * 60 },
      { days: [5, 6, 0], open: 11 * 60 + 30, close: 21 * 60 + 30 },
    ],
    hoursRows: [
      { days: 'Mo – Do', time: '11:30 – 21:00' },
      { days: 'Fr – So', time: '11:30 – 21:30' },
    ],
    directions: [
      { type: 'transit', text: 'Straßenbahnlinie 11 bis Endhaltestelle Bühlau, von dort nur wenige Gehminuten.' },
      { type: 'car', text: 'Parkmöglichkeiten in der Umgebung vorhanden.' },
      { type: 'bike', text: 'Gut mit dem Fahrrad zu erreichen.' },
    ],
  },
  {
    id: 'freital',
    name: 'Freital',
    address: 'Dresdner Str. 220',
    city: '01705 Freital',
    lat: 51.0088544,
    lng: 13.6589511,
    postcodes: ['01156', '01157', '01159', '01169', '01187', '01189', '01217', '01219', '01705', '01728', '01731', '01734', '01737', '01738'],
    comingSoon: false,
    deliveryOnly: false,
    lieferandoUrl: 'https://www.lieferando.de/en/menu/toshi-sushi-asia-kuche-freital',
    openHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: 11 * 60 + 30, close: 21 * 60 }],
    hoursRows: [{ days: 'Mo – So', time: '11:30 – 21:00' }],
    directions: [
      { type: 'transit', text: 'Bushaltestelle Wehrstraße direkt am Standort. Mit der S-Bahn vom Dresdner Hauptbahnhof nur 2 Stationen bis Freital-Deuben, von dort ca. 5 Minuten zu Fuß.' },
      { type: 'car', text: 'Parkplätze direkt neben dem Restaurant vorhanden.' },
      { type: 'bike', text: 'Fahrradabstellplätze direkt vor Ort verfügbar.' },
    ],
  },
  {
    id: 'klotzsche',
    name: 'Dresden-Klotzsche',
    address: 'Nur Lieferung',
    city: '',
    lat: null,
    lng: null,
    postcodes: ['01097', '01099', '01108', '01109', '01127', '01129', '01139', '01445', '01458', '01465', '01468', '01471', '01640', '01689'],
    comingSoon: false,
    deliveryOnly: true,
    lieferandoUrl: 'https://www.lieferando.de/en/menu/toshi-sushi-asia-kuche-klotzsche',
    openHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: 11 * 60 + 30, close: 21 * 60 }],
    hoursRows: [{ days: 'Mo – So', time: '11:30 – 21:00' }],
    directions: [],
  },
];

function findStoresByPostcode(code) {
  return ORDER_STORES.filter((s) => s.postcodes.includes(code.trim()));
}

/* ---------- Ornament (Japanese diamond divider) ---------- */
function Ornament({ tone = 'gold' }) {
  const line = tone === 'gold' ? 'rgba(201,168,118,0.5)' : 'rgba(140,42,38,0.45)';
  const dot = tone === 'gold' ? GOLD : STAMP;
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden="true">
      <div className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${line})` }} />
      <div className="w-1.5 h-1.5 rotate-45" style={{ background: dot }} />
      <div className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${line})` }} />
    </div>
  );
}

/* ---------- Corner frame (luxury picture-frame detail) ---------- */
function CornerFrame({ inset = -12 }) {
  const style = { width: 30, height: 30 };
  return (
    <>
      <span className="absolute border-t border-l border-[#c9a876]/60 pointer-events-none" style={{ top: inset, left: inset, ...style }} aria-hidden="true" />
      <span className="absolute border-b border-r border-[#c9a876]/60 pointer-events-none" style={{ bottom: inset, right: inset, ...style }} aria-hidden="true" />
    </>
  );
}

/* ---------- Navbar ---------- */
function Navbar({ onOrderClick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const LINKS = [
    { label: 'Speisekarte', href: '#speisekarte' },
    { label: 'Über uns', href: '#ueber-uns' },
    { label: 'Kontakt', href: '#kontakt' },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 2.1, ease: EASE }}
      className="fixed top-3 left-3 right-3 md:top-4 md:left-6 md:right-6 z-50"
    >
      <div
        className={`mx-auto max-w-7xl relative flex items-center justify-between px-4 md:px-8 py-2.5 md:py-3 rounded-full border transition-all duration-500 ${
          scrolled
            ? 'border-[#c9a876]/25 bg-[#14110d]/90 md:bg-[#14110d]/80 shadow-[0_12px_44px_rgba(0,0,0,0.5)]'
            : 'border-[#c9a876]/15 bg-[#14110d]/75 md:bg-[#14110d]/40 shadow-[0_8px_32px_rgba(0,0,0,0.35)]'
        } md:backdrop-blur-xl md:backdrop-saturate-150`}
      >
        {/* Logo */}
        <a href="#" className="group relative flex items-center" data-cursor-hover>
          <img
            src="/images/Toshi_Logo.webp"
            alt="Toshi Sushi & Asia Küche"
            className="h-11 md:h-13 w-auto object-contain transition-all duration-500 group-hover:scale-105"
          />
        </a>

        {/* Center links — desktop */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              data-cursor-hover
              className="group/link relative px-4 py-1.5 text-[12px] tracking-[0.14em] uppercase text-[#f3ead9]/75 hover:text-[#f3ead9] transition-all duration-300 font-medium rounded-lg"
            >
              {item.label}
              <span className="absolute left-4 right-4 -bottom-0.5 h-px bg-[#c9a876] origin-left scale-x-0 group-hover/link:scale-x-100 transition-transform duration-400 ease-out" />
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOrderClick}
            data-cursor-hover
            className="group hidden sm:flex items-center gap-1.5 px-5 md:px-6 py-2 md:py-2.5 rounded-full border border-[#c9a876]/45 hover:border-[#c9a876] hover:bg-[#c9a876] text-[#f3ead9] hover:text-[#14110d] text-[10.5px] md:text-[11.5px] tracking-[0.16em] uppercase font-medium transition-all duration-400"
          >
            Bestellen
          </button>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menü öffnen"
            className="md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-full border border-[#c9a876]/20 bg-white/[0.03] hover:bg-white/[0.07] transition-all duration-300 gap-[5px]"
          >
            <motion.span animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.22 }} className="w-[14px] h-[1px] bg-[#c9a876] rounded-full" />
            <motion.span animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: 0.18 }} className="w-[14px] h-[1px] bg-[#c9a876] rounded-full" />
            <motion.span animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.22 }} className="w-[14px] h-[1px] bg-[#c9a876] rounded-full" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="md:hidden mt-2 rounded-3xl border border-[#c9a876]/20 bg-[#14110d]/95 backdrop-blur-xl overflow-hidden"
          >
            {LINKS.map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-6 py-4 text-sm tracking-[0.1em] uppercase text-[#f3ead9]/70 hover:text-[#f3ead9] hover:bg-white/[0.03] transition-all duration-300 font-medium border-b border-white/[0.06] last:border-b-0"
              >
                {item.label}
                <span className="w-1 h-1 rotate-45" style={{ background: GOLD }} />
              </motion.a>
            ))}
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onOrderClick(); }}
              className="flex items-center justify-center gap-2 mx-5 my-4 py-3.5 rounded-full border border-[#c9a876]/50 text-[#c9a876] text-xs tracking-[0.14em] uppercase font-medium"
            >
              Online Bestellen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ---------- Hero ---------- */
const HERO_IMAGES = ['/images/TOSHI_img2.webp', '/images/TOSHI_img4.webp', '/images/TOSHI_img6.webp'];
const WORDMARK = 'Toshi'.split('');

function HeroSection({ onOrderClick }) {
  const [storeOpen, setStoreOpen] = useState({});
  const [slide, setSlide] = useState(0);
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  useEffect(() => {
    const result = {};
    ORDER_STORES.forEach((s) => { result[s.id] = checkStoreOpen(s.openHours); });
    setStoreOpen(result);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setSlide((p) => (p + 1) % HERO_IMAGES.length), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={ref} className="relative w-full h-screen min-h-[640px] overflow-hidden bg-[#0c0a08]">
      {/* Crossfading Ken Burns slideshow with scroll parallax */}
      <motion.div style={{ scale: bgScale }} className="absolute inset-0">
        <AnimatePresence>
          <motion.div
            key={slide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 animate-kenburns bg-cover bg-center"
              style={{ backgroundImage: `url(${HERO_IMAGES[slide]})` }}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Warm ink overlay — no neon */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,17,13,0.6) 0%, rgba(20,17,13,0.4) 40%, rgba(12,10,8,0.8) 100%)' }} />
      <div className="absolute inset-0 grain-overlay opacity-[0.18] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 45%, transparent 50%, rgba(12,10,8,0.6) 100%)' }} />
      <div
        className="absolute inset-x-0 bottom-0 h-56 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #14110d 0%, rgba(20,17,13,0.85) 40%, transparent 100%)' }}
      />

      {/* Vertical Japanese accents — desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8, delay: 1.6 }}
        className="hidden lg:flex absolute left-9 top-1/2 -translate-y-1/2 flex-col items-center gap-6 pointer-events-none"
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-[#c9a876]/25" />
        <p className="font-serif text-[#c9a876]/50 text-sm tracking-[0.5em]" style={{ writingMode: 'vertical-rl' }}>
          寿司・鮨・匠
        </p>
        <div className="w-px h-16 bg-gradient-to-t from-transparent to-[#c9a876]/25" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8, delay: 1.6 }}
        className="hidden lg:flex absolute right-9 top-1/2 -translate-y-1/2 flex-col items-center gap-6 pointer-events-none"
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-[#c9a876]/25" />
        <p className="font-serif text-[#c9a876]/50 text-sm tracking-[0.5em]" style={{ writingMode: 'vertical-rl' }}>
          鮮度・職人・心
        </p>
        <div className="w-px h-16 bg-gradient-to-t from-transparent to-[#c9a876]/25" />
      </motion.div>

      {/* Content */}
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: EASE }}
          className="font-accent text-lg md:text-xl text-[#e5cb99] mb-7"
        >
          Asiatisch · Authentisch · Anders
        </motion.p>

        <motion.h1
          className="font-serif text-[#f6efdf] leading-[1.05]"
          style={{ fontSize: 'clamp(3.4rem, 9vw, 8rem)' }}
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.55 } } }}
        >
          {WORDMARK.map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              variants={{
                hidden: { opacity: 0, y: 26, filter: 'blur(7px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: EASE } },
              }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, delay: 1.15 }}
          className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-[#f3ead9]/65 font-medium mt-5 mb-11"
        >
          Sushi &amp; Asia Küche — Freital
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4, ease: EASE }}
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5"
        >
          <div className="relative">
            <div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(201,168,118,0.45) 0%, transparent 70%)', animation: 'ctaGlow 2.6s ease-in-out infinite' }}
            />
            <button
              type="button"
              onClick={onOrderClick}
              data-cursor-hover
              className="btn-shimmer relative flex items-center gap-3 px-12 py-[1.15rem] md:px-14 md:py-[1.35rem] text-[#17140e] font-semibold text-[13px] md:text-sm tracking-[0.22em] uppercase rounded-full transition-all duration-400 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #e8d3a8 0%, #c9a876 50%, #ad8a5c 100%)',
                boxShadow: '0 16px 44px rgba(201,168,118,0.4), 0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              Online Bestellen
            </button>
          </div>
          <a
            href="#kontakt"
            data-cursor-hover
            className="group inline-flex items-center gap-2.5 px-9 py-4 md:px-10 md:py-[1.1rem] rounded-full border-2 border-[#f3ead9]/35 hover:border-[#c9a876] hover:bg-[#c9a876]/10 text-[#f3ead9] hover:text-[#f6e9cf] text-[12.5px] md:text-[13px] tracking-[0.2em] uppercase font-medium transition-all duration-400"
          >
            <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Tisch reservieren
          </a>
        </motion.div>
      </motion.div>

      {/* Locations bar — pinned to bottom */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.6, ease: EASE }}
        className="absolute bottom-0 inset-x-0 z-10"
      >
        {/* MOBILE: full-width bar */}
        <div className="md:hidden flex border-t border-[#c9a876]/20 bg-[#14110d]/70 backdrop-blur-sm">
          {ORDER_STORES.map((loc, i) => (
            <div key={loc.id} className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${i < ORDER_STORES.length - 1 ? 'border-r border-[#c9a876]/15' : ''}`}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: storeOpen[loc.id] ? '#8fae86' : STAMP }} />
              <p className="text-[9px] font-semibold uppercase tracking-[0.05em] text-[#f3ead9] text-center leading-tight">{loc.name}</p>
              <p className="text-[8px] font-normal text-[#f3ead9]/50 text-center leading-tight">{loc.deliveryOnly ? 'Nur Lieferung' : loc.address}</p>
            </div>
          ))}
        </div>

        {/* DESKTOP: pill */}
        <div className="hidden md:flex items-center justify-center pb-7">
          <div className="flex items-center rounded-full bg-[#14110d]/55 backdrop-blur-sm border border-[#c9a876]/25 overflow-hidden">
            {ORDER_STORES.map((loc, i) => (
              <div key={loc.id} className={`flex items-center gap-2.5 px-6 py-3 ${i < ORDER_STORES.length - 1 ? 'border-r border-[#c9a876]/20' : ''}`}>
                <span className="relative flex w-1.5 h-1.5 flex-shrink-0">
                  {storeOpen[loc.id] && <span className="absolute inline-flex h-full w-full rounded-full bg-[#8fae86] opacity-60 animate-ping" />}
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: storeOpen[loc.id] ? '#8fae86' : STAMP }} />
                </span>
                <div className="text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] leading-none text-[#f3ead9]">{loc.name}</p>
                  <p className="text-[10.5px] font-normal leading-none mt-1 text-[#f3ead9]/55">{loc.deliveryOnly ? 'Nur Lieferung' : loc.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------- Ticker ---------- */
function TickerStrip() {
  const WORDS = ['Rainbow Roll', '鮨', 'California Roll', '巻', 'Chirashi Bowl', '丼', 'Chicken Teriyaki', '照り焼き', 'Gyoza', '餃子', 'Sashimi Mix', '刺身'];
  const row = [...WORDS, ...WORDS];
  return (
    <div className="relative z-20 bg-[#14110d] border-y border-[#c9a876]/[0.14] py-3.5 md:py-4 overflow-hidden">
      <div className="flex whitespace-nowrap animate-ticker">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center">
            {row.map((w, i) => (
              <span key={`${half}-${i}`} className={`flex items-center text-[#e5d6ae]/80 uppercase tracking-[0.24em] text-[10.5px] md:text-[11.5px] ${/[぀-鿿]/.test(w) ? 'font-serif normal-case tracking-[0.1em] text-[#c9a876]/75' : 'font-medium'}`}>
                <span className="px-5 md:px-7">{w}</span>
                <span className="text-[#c9a876]/30 text-[10px]">·</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Order Section ---------- */
function OrderSection({ onOrderClick }) {
  return (
    <section id="bestellen" className="relative bg-[#f3ead9] overflow-hidden">
      {/* Subtle texture watermark */}
      <div className="absolute -right-16 top-8 pointer-events-none select-none hidden md:block" aria-hidden="true">
        <span className="font-serif text-[16rem] leading-none text-[#14110d]/[0.035]">出前</span>
      </div>

      {/* MOBILE */}
      <div className="relative md:hidden" style={{ minHeight: '86vh' }}>
        <div className="absolute bottom-0 left-0 right-0 h-[54%]">
          <img src="/images/sushi-platter.jpg" alt="Toshi Sushi Platte" className="w-full h-full object-cover object-center" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, #f3ead9 0%, #f3ead9 12%, rgba(243,234,217,0.3) 45%, rgba(243,234,217,0) 100%)' }}
          />
        </div>

        <div className="relative z-10 pt-16 px-6 pb-0 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="font-accent text-lg text-[#8c2a26] mb-4">Lieferung &amp; Abholung</p>
            <h2 className="font-serif text-[#14110d] leading-[1.02] mb-6" style={{ fontSize: 'clamp(2.6rem, 11vw, 3.4rem)' }}>
              Jetzt bestellen.
            </h2>
            <p className="text-[15px] text-[#14110d]/80 font-normal leading-relaxed max-w-[280px] mx-auto mb-8">
              Bestell dein Lieblings-Sushi zur Lieferung oder Abholung — frisch gerollt, mit Sorgfalt verpackt.
            </p>
            <button
              type="button"
              onClick={onOrderClick}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#14110d] hover:bg-[#221d17] text-[#f3ead9] font-medium text-xs tracking-[0.16em] uppercase rounded-full transition-all duration-400 border border-[#c9a876]/40"
            >
              Online Bestellen
            </button>
          </motion.div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-12">
          <div className="flex flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1.2, ease: EASE }}
              className="flex-1 text-left"
            >
              <p className="font-accent text-2xl text-[#8c2a26] mb-4">Lieferung &amp; Abholung</p>
              <h2 className="font-serif text-[#14110d] leading-[1.02] mb-8" style={{ fontSize: 'clamp(3.5rem, 5.5vw, 5.5rem)' }}>
                Jetzt bestellen.
              </h2>
              <p className="text-xl text-[#14110d]/80 font-normal leading-relaxed mb-10 max-w-sm">
                Bestell dein Lieblings-Sushi zur Lieferung oder Abholung — frisch gerollt, mit Sorgfalt verpackt.
              </p>
              <button
                type="button"
                onClick={onOrderClick}
                data-cursor-hover
                className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#14110d] hover:bg-[#221d17] text-[#f3ead9] font-medium text-xs tracking-[0.16em] uppercase rounded-full transition-all duration-400 border border-[#c9a876]/40 hover:border-[#c9a876] hover:-translate-y-0.5"
              >
                Online Bestellen
              </button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1.3, delay: 0.1, ease: EASE }}
              className="flex-1 relative flex justify-end"
            >
              <div className="relative w-full max-w-[500px] group">
                <CornerFrame />
                <div className="card-sheen relative rounded-[4px] overflow-hidden aspect-[4/3] shadow-[0_24px_64px_rgba(20,17,13,0.25)]">
                  <img src="/images/sushi-platter.jpg" alt="Toshi Sushi Platte" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Freshness Guarantee ---------- */
function FreshnessSection() {
  const GUARANTEES = [
    'Täglich frischer Fisch — niemals tiefgekühlt',
    'Von Hand geschnitten, nicht maschinell',
    'Ausgewählte Zutaten, ohne Kompromisse',
  ];

  return (
    <section id="frische" className="relative w-full min-h-[100svh] overflow-hidden bg-[#0c0a08]">
      {/* Full-bleed photo — slow cinematic zoom */}
      <div className="absolute inset-0">
        <img
          src={KNIFE_IMAGE}
          alt="Scharfes Messer beim Zuschneiden von frischem Fisch"
          className="absolute inset-0 w-full h-full object-cover animate-kenburns"
        />
      </div>

      {/* Scrim — heavy, uniform darkening so text is legible regardless of what's behind it */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(100deg, rgba(8,7,5,0.97) 0%, rgba(8,7,5,0.93) 32%, rgba(8,7,5,0.72) 54%, rgba(8,7,5,0.4) 75%, rgba(8,7,5,0.22) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(8,7,5,0.92) 0%, rgba(8,7,5,0.25) 30%, rgba(8,7,5,0.25) 75%, rgba(8,7,5,0.6) 100%)' }} />
      <div className="absolute inset-0 bg-[#0c0a08]/25 pointer-events-none" />
      <div className="absolute inset-0 grain-overlay opacity-[0.15] pointer-events-none" />

      {/* Ambient watermark kanji */}
      <span className="font-serif absolute -right-6 bottom-4 text-[18rem] leading-none text-[#c9a876]/[0.05] select-none hidden lg:block pointer-events-none" aria-hidden="true">鮮</span>

      {/* Hanko stamp */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
        className="absolute top-28 md:top-32 left-6 md:left-12 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_10px_28px_rgba(140,42,38,0.4)] z-10"
        style={{ background: STAMP }}
      >
        <span className="font-serif text-[#f3ead9] text-xl md:text-2xl">鮮</span>
      </motion.div>

      {/* Content — overlaid on the scrim */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 min-h-[100svh] flex items-center py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="max-w-xl"
        >
          <p className="font-accent text-2xl text-[#e9d4a3] mb-4" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>Frischegarantie</p>
          <h2 className="font-serif text-white leading-[1.03] mb-7" style={{ fontSize: 'clamp(3rem, 6vw, 5.2rem)', textShadow: '0 4px 28px rgba(0,0,0,0.65)' }}>
            Frische, die man schmeckt.
          </h2>
          <p className="text-lg text-[#f6efdf]/90 leading-relaxed mb-9 max-w-lg" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}>
            Unser Fisch wird täglich frisch geliefert und von Hand geschnitten — nie aus der Tiefkühltruhe, nie auf Vorrat. Mit geschärften Klingen und geschultem Auge verwandeln wir nur ausgewählte Zutaten in jedes Gericht, das wir servieren.
          </p>
          <ul className="flex flex-col gap-4 mb-10">
            {GUARANTEES.map((g, i) => (
              <motion.li
                key={g}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: i * 0.12, ease: EASE }}
                className="flex items-center gap-3 text-[15px] text-[#f6efdf]/95 font-medium"
                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.55)' }}
              >
                <span className="w-1.5 h-1.5 rotate-45 flex-shrink-0" style={{ background: GOLD }} />
                {g}
              </motion.li>
            ))}
          </ul>
          <a href="#speisekarte" data-cursor-hover className="group inline-flex items-center gap-2 text-[#f6efdf]/95 hover:text-[#c9a876] text-[11px] tracking-[0.2em] uppercase font-medium transition-colors duration-400">
            <span className="pb-0.5 border-b border-current/50 group-hover:border-current">Zur Speisekarte</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Menu (3D Carousel — museum-label card chrome) ---------- */
const DISHES = [
  { src: '/menu_items/rainbow-roll.jpg', name: 'Rainbow Roll', category: 'Signature', price: '12,90 €', description: 'Mit gegrilltem Flussaal, Avocado, Gurke und Frischkäse, umhüllt von 4 verschiedenen Fischsorten und hauseigener Sauce' },
  { src: '/menu_items/nigiri-shake.jpg', name: 'Nigiri Shake', category: 'Nigiri', price: '4,90 €', description: 'Zarte Scheibe Premium-Lachs auf handgeformtem Sushireis (2 Stk.)' },
  { src: '/menu_items/ebi-tempura-roll.jpg', name: 'Ebi Tempura Roll', category: 'Inside Out', price: '10,90 €', description: 'Knusprige Garnele Tempura mit Avocado und Sesam (8 Stk.)' },
  { src: '/menu_items/tempura-chicken.jpg', name: 'Tempura Chicken', category: 'Tempura Futo Maki', price: '10,90 €', description: 'Knusprig frittiertes Hähnchen im Tempurateig, großzügig gerollt (10 Stk.)' },
  { src: '/menu_items/mango-curry.jpg', name: 'Mango-Kokos', category: 'Thai-Curry', price: 'ab 12,90 €', description: 'Mango-Kokos-Curry verwöhnt mit saftigen Mangostücken und zartem Gemüse' },
  { src: '/menu_items/pho-suppe.jpg', name: 'Pho Suppe', category: 'Vietnamesisch', price: '12,90 €', description: 'Klassische vietnamesische Brühe mit Reisnudeln, zartem Rind und frischen Kräutern' },
  { src: '/menu_items/gebratene-nudeln.jpg', name: 'Gebratene Nudeln', category: 'Gebratene Spezialitäten', price: '8,90 €', description: 'Wok-gebratene Eiernudeln mit frischem Gemüse — wahlweise mit Hühnchen, Rind oder vegetarisch' },
  { src: '/menu_items/biang-biang-nudeln.jpg', name: 'Handgemachte Biang Biang Noodles', category: 'Spezialitäten', price: '15,90 €', description: 'Breite, frisch gezogene Nudeln treffen auf zartes Rindfleisch, Pak Choi, knusprigen Knoblauch und würziges Chiliöl …' },
  { src: '/menu_items/peking-suppe.jpg', name: 'Peking-Suppe', category: 'Suppen', price: '5,90 €', description: 'Ein echter Klassiker der asiatischen Küche — unsere original Peking-Suppe begeistert mit ihrer perfekt ausbalancierten …' },
  { src: '/menu_items/mango-cheesecake.jpg', name: 'Mango Cheesecake', category: 'Desserts', price: '5,90 €', description: 'Hausgemachtes Mango-Cheesecake mit Butterkeksboden' },
];

function MenuSection({ onItemClick }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = DISHES.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((p) => (p + 1) % total), 4200);
    return () => clearInterval(t);
  }, [paused, total]);

  const getOffset = (i) => {
    let off = i - active;
    if (off > total / 2) off -= total;
    if (off < -total / 2) off += total;
    return off;
  };

  const CARD_W = 296;
  const CARD_H = 460;
  const SLOT = 326;

  return (
    <section
      id="speisekarte"
      className="relative overflow-hidden py-24 md:py-36"
      style={{ background: 'linear-gradient(180deg, #0c0a08 0%, #16130f 45%, #0c0a08 100%)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Ambient glow + watermark */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(201,168,118,0.05) 0%, transparent 65%)' }} />
        <div className="absolute top-0 inset-x-0 h-px hairline-gold" />
        <div className="absolute bottom-0 inset-x-0 h-px hairline-gold" />
        <span className="font-serif absolute -left-6 top-24 text-[18rem] leading-none text-[#c9a876]/[0.025] select-none hidden lg:block" style={{ writingMode: 'vertical-rl' }}>鮨匠</span>
      </div>

      {/* Heading */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative text-center mb-16 md:mb-24 px-6"
      >
        <div className="mb-5"><Ornament /></div>
        <span className="block text-[11.5px] tracking-[0.42em] uppercase text-[#c9a876]/80 font-medium mb-4">Ausgewählte Gerichte</span>
        <h2 className="font-serif text-[#f6efdf] leading-[1.05]" style={{ fontSize: 'clamp(2.6rem, 6.5vw, 5.2rem)' }}>
          Unsere Karte
        </h2>
      </motion.div>

      {/* 3D Carousel */}
      <div className="relative mx-auto" style={{ height: CARD_H, maxWidth: '100%', perspective: '1400px', perspectiveOrigin: '50% 40%' }}>
        {DISHES.map((dish, i) => {
          const off = getOffset(i);
          const absOff = Math.abs(off);
          if (absOff > 2.4) return null;

          const isCenter = off === 0;
          const brightness = 1 - absOff * 0.28;

          return (
            <motion.div
              key={dish.name}
              className="absolute cursor-pointer"
              data-cursor-hover
              style={{
                width: CARD_W,
                height: CARD_H,
                top: '50%',
                left: '50%',
                marginLeft: -CARD_W / 2,
                marginTop: -CARD_H / 2,
                transformStyle: 'preserve-3d',
                filter: `brightness(${brightness})`,
                willChange: 'transform, opacity',
              }}
              animate={{
                x: off * SLOT,
                rotateY: off * -30,
                scale: 1 - absOff * 0.13,
                opacity: absOff > 2 ? 0 : 1 - absOff * 0.22,
                zIndex: Math.round(10 - absOff * 3),
              }}
              transition={{ type: 'tween', duration: 0.6, ease: EASE }}
              onClick={() => (isCenter ? onItemClick(dish) : setActive(i))}
            >
              <div
                className="card-sheen relative w-full h-full overflow-hidden rounded-[3px] group flex flex-col"
                style={{
                  boxShadow: isCenter
                    ? '0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,118,0.5)'
                    : '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
                }}
              >
                {/* Image */}
                <div className="relative flex-1 overflow-hidden">
                  <img src={dish.src} alt={dish.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.05]" loading="lazy" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,10,8,0.35) 0%, transparent 30%, transparent 100%)' }} />
                  <span className="absolute top-4 right-4 font-serif text-[11px] tracking-[0.2em] text-white/35">{String(i + 1).padStart(2, '0')}</span>
                </div>

                {/* Museum-label caption strip */}
                <div className="relative bg-[#16130f] px-5 py-4 border-t border-[#c9a876]/[0.14]">
                  <span className="block text-[9px] tracking-[0.32em] uppercase text-[#c9a876]/70 font-medium mb-1.5">{dish.category}</span>
                  <div className="flex items-baseline gap-2">
                    <p className="font-serif text-[17px] text-[#f6efdf] leading-tight truncate min-w-0" title={dish.name}>{dish.name}</p>
                    <span className="flex-1 border-b border-dotted border-[#f3ead9]/[0.16] translate-y-[-3px]" aria-hidden="true" />
                    <p className="text-[13px] font-medium text-[#c9a876] whitespace-nowrap shrink-0">{dish.price}</p>
                  </div>

                  <AnimatePresence>
                    {isCenter && (
                      <motion.button
                        key="cta"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        onClick={(e) => { e.stopPropagation(); onItemClick(dish); }}
                        className="flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-[#f3ead9]/55 hover:text-[#c9a876] transition-colors duration-300 overflow-hidden"
                      >
                        Details ansehen
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {isCenter && (
                  <div className="absolute inset-0 rounded-[3px] pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(201,168,118,0.5)' }} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        className="relative flex flex-col items-center gap-5 mt-12 md:mt-16"
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActive((p) => (p - 1 + total) % total)}
            aria-label="Vorheriges Gericht"
            data-cursor-hover
            className="flex items-center justify-center w-11 h-11 rounded-full border border-[#c9a876]/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#c9a876]/50 transition-all duration-300 group"
          >
            <svg className="w-4 h-4 text-[#e5d6ae]/40 group-hover:text-[#e5d6ae]/80 transition-all duration-300 group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {DISHES.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={`Gericht ${i + 1}`} data-cursor-hover className="flex items-center justify-center transition-all duration-300">
                <motion.div
                  className="rounded-full"
                  animate={{ width: i === active ? 20 : 5, height: 5, background: i === active ? GOLD : 'rgba(255,255,255,0.14)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => setActive((p) => (p + 1) % total)}
            aria-label="Nächstes Gericht"
            data-cursor-hover
            className="flex items-center justify-center w-11 h-11 rounded-full border border-[#c9a876]/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#c9a876]/50 transition-all duration-300 group"
          >
            <svg className="w-4 h-4 text-[#e5d6ae]/40 group-hover:text-[#e5d6ae]/80 transition-all duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <span className="text-[9px] tracking-[0.5em] uppercase text-[#f3ead9]/15 font-normal select-none">
          {String(active + 1).padStart(2, '0')}&nbsp;&nbsp;/&nbsp;&nbsp;{String(total).padStart(2, '0')}
        </span>

        <a
          href={LIEFERANDO}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor-hover
          className="group mt-2 inline-flex items-center gap-2 px-7 py-3 rounded-full border border-[#c9a876]/25 text-[#e5d6ae]/75 hover:text-[#14110d] hover:border-[#c9a876] hover:bg-[#c9a876] text-[11px] font-medium tracking-[0.16em] uppercase transition-all duration-400"
        >
          Ganze Speisekarte ansehen
        </a>
      </motion.div>

      {/* Closing pull-quote — the kitchen's philosophy */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative max-w-xl mx-auto mt-24 md:mt-32 px-6 text-center"
      >
        <div className="mb-7"><Ornament /></div>
        <p className="font-accent text-2xl md:text-3xl text-[#e5d6ae] leading-relaxed">
          „Wahres Handwerk liegt in der Stille — im ruhigen Schnitt, in der Geduld des Reises, im Respekt vor jeder Zutat.“
        </p>
        <p className="mt-6 text-[10.5px] tracking-[0.32em] uppercase text-[#c9a876]/55 font-medium">Toshi Küchenteam</p>
      </motion.div>
    </section>
  );
}

/* ---------- Product Modal ---------- */
function ProductModal({ item, onClose, onOrderClick }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#0c0a08]/90 backdrop-blur-3xl"
      onClick={onClose}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(201,168,118,0.1) 0%, transparent 65%)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 280, damping: 26 }}
        className="relative w-full max-w-sm md:max-w-3xl rounded-3xl overflow-hidden border border-[#c9a876]/25"
        style={{ background: '#16130f', boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 40px rgba(201,168,118,0.06)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(201,168,118,0.1) 0%, transparent 70%)' }} />

        <button
          onClick={onClose}
          aria-label="Schließen"
          data-cursor-hover
          className="absolute top-3 right-3 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-[#0c0a08]/60 border border-[#c9a876]/25 backdrop-blur-sm hover:bg-[#0c0a08]/85 hover:border-[#c9a876]/50 hover:rotate-90 transition-all duration-300"
        >
          <svg className="w-4 h-4 text-[#f3ead9]/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative w-full h-48 flex-shrink-0 md:w-[48%] md:h-auto md:min-h-[400px]">
            <img src={item.src} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="md:hidden absolute inset-x-0 bottom-0 h-16 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #16130f)' }} />
            <div className="hidden md:block absolute inset-y-0 right-0 w-20 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, #16130f)' }} />
          </div>

          {/* Info */}
          <div className="relative z-10 flex flex-col p-5 md:p-8 md:pl-5 md:justify-between flex-1">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-5 h-[1px] bg-[#c9a876]/50" />
                <span className="text-[9px] tracking-[0.4em] uppercase text-[#c9a876]/70 font-normal">Toshi Sushi</span>
                <span className="font-serif text-[11px] text-[#f3ead9]/25">鮨</span>
              </div>

              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="font-serif text-2xl md:text-3xl text-[#f6efdf] leading-[1.05]">{item.name}</h2>
                <span className="text-lg md:text-xl font-semibold text-[#c9a876] whitespace-nowrap mt-0.5">{item.price}</span>
              </div>

              <p className="text-[15px] font-normal text-[#f3ead9]/85 leading-relaxed">{item.description}</p>
            </div>

            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => { onClose(); onOrderClick(); }}
                data-cursor-hover
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#c9a876] hover:bg-[#ddc59a] text-[#14110d] font-semibold text-sm tracking-[0.1em] uppercase transition-all duration-300"
              >
                Online Bestellen
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Order Modal (delivery/pickup → postcode → store) ---------- */
function OrderModal({ onClose }) {
  const [storeOpen, setStoreOpen] = useState({});
  useEffect(() => {
    const result = {};
    ORDER_STORES.forEach((s) => { result[s.id] = checkStoreOpen(s.openHours); });
    setStoreOpen(result);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState(null);
  const [postcode, setPostcode] = useState('');
  const [postcodeMatches, setPostcodeMatches] = useState(null);
  const [postcodeNotFound, setPostcodeNotFound] = useState(false);
  const [expandedStore, setExpandedStore] = useState(null);

  const handlePostcodeLookup = () => {
    const matches = findStoresByPostcode(postcode);
    if (matches.length > 0) {
      setPostcodeMatches(matches);
      setPostcodeNotFound(false);
      setExpandedStore(matches[0].id);
    } else {
      setPostcodeMatches(null);
      setPostcodeNotFound(true);
    }
  };

  const handleSelectOrderType = (type) => {
    setOrderType(type);
    setStep(2);
  };

  const stepTitles = { 1: 'Lieferung oder\nAbholung?', 2: 'Standort\nwählen' };

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-[#0c0a08]/85 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-[440px] max-h-[92vh] flex flex-col"
        initial={{ scale: 0.86, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 14 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26, mass: 0.75 }}
      >
        <div
          className="relative rounded-3xl overflow-hidden border border-[#c9a876]/25 flex flex-col min-h-0"
          style={{ boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 40px rgba(201,168,118,0.06)' }}
        >
          {/* ── Ink header ── */}
          <div className="relative h-[112px] overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1c1712] via-[#14110d] to-[#0c0a08]" />
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#c9a876]/[0.09] to-transparent"
                style={{ animation: 'shimmer 5s ease-in-out infinite' }}
              />
            </div>
            <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-[#c9a876]/[0.05]" />
            <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-black/20" />

            {/* Step indicators */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-[3px] rounded-full transition-all duration-300 ${
                    s === step ? 'w-6' : s < step ? 'w-6' : 'w-4'
                  }`}
                  style={{ background: s === step ? GOLD : s < step ? 'rgba(201,168,118,0.6)' : 'rgba(255,255,255,0.18)' }}
                />
              ))}
            </div>

            {/* Back button */}
            {step === 2 && (
              <button
                type="button"
                onClick={() => { setStep(1); setPostcode(''); setPostcodeMatches(null); setPostcodeNotFound(false); }}
                data-cursor-hover
                className="absolute top-3.5 left-3.5 z-20 w-8 h-8 rounded-full bg-[#c9a876]/10 border border-[#c9a876]/30 hover:bg-[#c9a876]/20 flex items-center justify-center transition-all duration-300"
              >
                <svg className="w-3.5 h-3.5 text-[#f3ead9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              data-cursor-hover
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-[#c9a876]/10 border border-[#c9a876]/30 hover:bg-[#c9a876]/20 flex items-center justify-center transition-all duration-300 hover:rotate-90"
            >
              <svg className="w-[11px] h-[11px] text-[#f3ead9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-16 pt-3">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="font-serif text-[24px] sm:text-[26px] text-[#f6efdf] leading-[1.15] text-center whitespace-pre-line"
                >
                  {stepTitles[step]}
                </motion.h2>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Parchment body ── */}
          <div className="bg-[#f3ead9] px-5 sm:px-6 pt-5 pb-5 overflow-y-auto flex-1 min-h-0" style={{ scrollbarWidth: 'none' }}>
            <AnimatePresence mode="wait">

              {/* ── STEP 1: Delivery or Pickup ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  {/* Choice buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectOrderType('delivery')}
                      data-cursor-hover
                      className="group flex flex-col items-center gap-2.5 p-4 rounded-[6px] border-2 border-[#14110d]/12 hover:border-[#c9a876] hover:bg-[#c9a876]/[0.08] transition-all duration-200"
                    >
                      <div className="w-11 h-11 rounded-[4px] bg-[#14110d]/[0.06] group-hover:bg-[#c9a876] flex items-center justify-center transition-colors duration-200">
                        <svg className="w-5 h-5 text-[#14110d]/45 group-hover:text-[#14110d] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
                          <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                      </div>
                      <span className="text-[14px] font-medium text-[#14110d] group-hover:text-[#8c2a26] transition-colors duration-200">Lieferung</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectOrderType('pickup')}
                      data-cursor-hover
                      className="group flex flex-col items-center gap-2.5 p-4 rounded-[6px] border-2 border-[#14110d]/12 hover:border-[#c9a876] hover:bg-[#c9a876]/[0.08] transition-all duration-200"
                    >
                      <div className="w-11 h-11 rounded-[4px] bg-[#14110d]/[0.06] group-hover:bg-[#c9a876] flex items-center justify-center transition-colors duration-200">
                        <svg className="w-5 h-5 text-[#14110d]/45 group-hover:text-[#14110d] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                      </div>
                      <span className="text-[14px] font-medium text-[#14110d] group-hover:text-[#8c2a26] transition-colors duration-200">Abholung</span>
                    </button>
                  </div>

                  {/* Store info */}
                  <div className="rounded-[6px] border border-[#14110d]/10 bg-white/40 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#14110d]/10">
                      <svg className="w-3.5 h-3.5 text-[#c9a876]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#14110d]/45">Unsere Standorte</span>
                    </div>
                    {ORDER_STORES.map((store, i) => {
                      const isOpen = storeOpen[store.id];
                      return (
                        <div key={store.id} className={`flex items-center gap-3 px-4 py-3 ${i < ORDER_STORES.length - 1 ? 'border-b border-[#14110d]/10' : ''}`}>
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isOpen ? '#8fae86' : STAMP }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-serif text-[15px] leading-none text-[#14110d]">{store.name}</p>
                            {!store.deliveryOnly && (
                              <p className="text-[11px] text-[#14110d]/45 font-normal mt-1">{store.address}{store.city ? ` · ${store.city}` : ''}</p>
                            )}
                          </div>
                          {store.deliveryOnly ? (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#c9a876]/10 border border-[#c9a876]/30 text-[#a1854f] text-[10px] font-medium uppercase tracking-[0.1em]">Nur Lieferung</span>
                          ) : isOpen ? (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-[#8fae86]/10 border border-[#8fae86]/35 text-[#5f7d57] text-[10px] font-medium uppercase tracking-[0.1em]">Geöffnet</span>
                          ) : (
                            <span className="flex-shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-[0.1em]" style={{ background: 'rgba(140,42,38,0.08)', borderColor: 'rgba(140,42,38,0.25)', color: STAMP }}>Geschlossen</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Choose Store ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-3"
                >
                  {/* Order type badge */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a876]/10 border border-[#c9a876]/30">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
                      <span className="text-[11px] font-medium text-[#a1854f] uppercase tracking-[0.1em]">
                        {orderType === 'delivery' ? 'Lieferung' : 'Abholung'}
                      </span>
                    </span>
                  </div>

                  {/* Postcode lookup */}
                  <div className="rounded-[6px] border border-[#14110d]/12 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/40 border-b border-[#14110d]/10">
                      <svg className="w-3.5 h-3.5 text-[#c9a876]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                      </svg>
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#14110d]/50">PLZ-Suche</span>
                    </div>
                    <div className="flex gap-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="Deine Postleitzahl…"
                        value={postcode}
                        onChange={(e) => {
                          setPostcode(e.target.value.replace(/\D/g, ''));
                          setPostcodeMatches(null);
                          setPostcodeNotFound(false);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && postcode.length === 5 && handlePostcodeLookup()}
                        className="flex-1 px-4 py-3 text-[14px] font-medium text-[#14110d] placeholder:text-[#14110d]/30 outline-none bg-white/70"
                      />
                      <button
                        type="button"
                        onClick={handlePostcodeLookup}
                        disabled={postcode.length !== 5}
                        data-cursor-hover
                        className="px-4 py-3 bg-[#14110d] disabled:bg-[#14110d]/20 text-[#f3ead9] text-[12px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 hover:bg-[#221d17] disabled:cursor-not-allowed"
                      >
                        Suchen
                      </button>
                    </div>

                    {/* Postcode result */}
                    <AnimatePresence>
                      {postcodeNotFound && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 py-2.5 text-[12px] font-normal text-[#14110d]/75 border-t border-[#14110d]/10 bg-white/40">
                            Keine Lieferung in deine PLZ — wähle einen Standort zur Abholung.
                          </p>
                        </motion.div>
                      )}
                      {postcodeMatches && postcodeMatches.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-[#14110d]/10"
                        >
                          <p className="px-4 pt-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[#a1854f]">
                            {postcodeMatches.length > 1 ? 'Mehrere Standorte verfügbar:' : 'Standort gefunden:'}
                          </p>
                          {postcodeMatches.map((s) => (
                            <p key={s.id} className="px-4 pb-2.5 font-serif text-[14px] text-[#14110d]">→ {s.name}</p>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Store cards */}
                  <div className="space-y-2">
                    {ORDER_STORES.map((store) => {
                      const isHighlighted = postcodeMatches?.some((m) => m.id === store.id);
                      const isExpanded = expandedStore === store.id;
                      return (
                        <div
                          key={store.id}
                          className="rounded-[6px] border overflow-hidden transition-all duration-200"
                          style={
                            isHighlighted
                              ? { borderColor: GOLD, background: 'rgba(201,168,118,0.08)', boxShadow: '0 4px 20px rgba(201,168,118,0.15)' }
                              : { borderColor: 'rgba(20,17,13,0.12)', background: 'rgba(255,255,255,0.4)' }
                          }
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedStore(isExpanded ? null : store.id)}
                            data-cursor-hover
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                          >
                            <div
                              className="w-9 h-9 rounded-[4px] flex-shrink-0 flex items-center justify-center"
                              style={{ background: isHighlighted ? GOLD : 'rgba(20,17,13,0.06)' }}
                            >
                              <svg className="w-4 h-4" style={{ color: isHighlighted ? '#14110d' : 'rgba(20,17,13,0.45)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-[15px] leading-none text-[#14110d]">{store.name}</p>
                              {!store.deliveryOnly && (
                                <p className="text-[11px] text-[#14110d]/45 font-normal mt-1">{store.address}{store.city ? ` · ${store.city}` : ''}</p>
                              )}
                            </div>
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <svg className="w-4 h-4 text-[#14110d]/35 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.div>
                          </button>

                          {/* Expanded: postcode area + order button */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: 'easeInOut' }}
                                className="overflow-hidden border-t border-[#14110d]/10"
                              >
                                <div className="px-4 pt-3 pb-3">
                                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#14110d]/40 mb-1.5">Liefergebiet PLZ</p>
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {store.postcodes.map((z) => (
                                      <span key={z} className="text-[10px] font-medium text-[#14110d]/60 bg-[#14110d]/[0.04] border border-[#14110d]/10 rounded px-1.5 py-0.5">{z}</span>
                                    ))}
                                  </div>
                                  <a
                                    href={store.lieferandoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    data-cursor-hover
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#c9a876] hover:bg-[#ddc59a] text-[#14110d] text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-200"
                                  >
                                    Hier bestellen
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                  </a>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- About / Story ---------- */
function AboutSection() {
  const STATS = [
    { value: '100%', label: 'Frischer Fisch' },
    { value: '60+', label: 'Gerichte auf der Karte' },
    { value: '7 Tage', label: 'Die Woche geöffnet' },
  ];

  return (
    <section id="ueber-uns" className="relative bg-[#f3ead9] overflow-hidden py-24 md:py-36">
      {/* Watermark */}
      <div className="absolute right-6 bottom-4 pointer-events-none select-none hidden lg:block" aria-hidden="true">
        <span className="font-serif text-[22rem] leading-none text-[#14110d]/[0.03]">匠</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1.2, ease: EASE }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative max-w-[480px]">
              <CornerFrame />
              {/* Owner portrait — using an existing site photo as a stand-in. Swap the <img src> for the real owner photo once it's ready. */}
              <div className="card-sheen relative rounded-[4px] overflow-hidden aspect-[4/5] shadow-[0_24px_64px_rgba(20,17,13,0.25)] border-2 border-dashed border-[#c9a876]/45 group">
                <img src="/images/ramen-person.jpg" alt="Platzhalter — Inhaber-Foto folgt" className="absolute inset-0 w-full h-full object-cover grayscale-[0.25] opacity-80 transition-transform duration-1000 ease-out group-hover:scale-[1.04]" loading="lazy" />
                <div className="absolute inset-0 bg-[#14110d]/15" />
                <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14110d]/70 backdrop-blur-sm border border-[#c9a876]/30 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a876] shrink-0" />
                  <span className="text-[9.5px] tracking-[0.14em] uppercase text-[#f3ead9]/90 font-medium whitespace-nowrap">Foto folgt</span>
                </div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
              className="absolute -bottom-8 -right-2 md:-right-8 w-[52%] rounded-[3px] overflow-hidden aspect-square shadow-[0_20px_50px_rgba(20,17,13,0.35)] border-4 border-[#f3ead9] card-sheen group"
            >
              <img src="/images/interior-bar.jpg" alt="Toshi Restaurant Interieur" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]" loading="lazy" />
            </motion.div>
            {/* Hanko stamp — small, quiet, on-brand */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.45, ease: EASE }}
              className="absolute -top-5 -left-3 md:-left-6 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_10px_28px_rgba(140,42,38,0.3)]"
              style={{ background: STAMP }}
            >
              <span className="font-serif text-[#f3ead9] text-xl md:text-2xl">鮨</span>
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="order-1 lg:order-2"
          >
            <p className="font-accent text-2xl text-[#8c2a26] mb-4">Unsere Geschichte</p>
            <h2 className="font-serif text-[#14110d] leading-[1.05] mb-8" style={{ fontSize: 'clamp(2.6rem, 5vw, 4.6rem)' }}>
              Wenn Sushi, dann Toshi.
            </h2>
            <p className="text-lg text-[#14110d]/80 font-normal leading-relaxed mb-5 max-w-lg">
              Bei Toshi beginnt alles mit Respekt — vor der Zutat, vor dem Handwerk und vor unseren Gästen.
              Jede Rolle wird von Hand geformt, jeder Fisch täglich frisch geschnitten, jedes Gericht mit Sorgfalt angerichtet.
            </p>
            <p className="text-lg text-[#14110d]/80 font-normal leading-relaxed mb-10 max-w-lg">
              Mitten in Freital vereinen wir japanische Präzision mit der Wärme asiatischer Küche —
              vom feinen Nigiri bis zur dampfenden Wok-Pfanne.
            </p>

            {/* Owner signature line */}
            <div className="flex items-center gap-4 mb-10 pb-10 border-b border-[#14110d]/10">
              <div className="w-11 h-11 rounded-full border border-dashed border-[#14110d]/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#14110d]/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
              </div>
              <div>
                <p className="font-serif text-base text-[#14110d]">Jackson</p>
                <p className="text-[11px] tracking-[0.1em] uppercase text-[#14110d]/45 font-medium">Inhaber, Toshi Sushi</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.12, ease: EASE }}
                >
                  <p className="font-serif text-2xl md:text-3xl text-[#8c2a26] mb-1">{s.value}</p>
                  <p className="text-[10.5px] md:text-xs tracking-[0.1em] uppercase text-[#14110d]/50 font-medium">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Photo Wall ---------- */
function PhotoWall() {
  const cardVariants = (i) => ({
    hidden: { opacity: 0, y: 40, scale: 0.94 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 1, delay: i * 0.12, ease: EASE } },
  });

  const PHOTOS = [
    { src: '/images/TOSHI_img1.webp', label: 'Sushi Art' },
    { src: '/images/TOSHI_img3.webp', label: 'Frische' },
    { src: '/images/TOSHI_img5.webp', label: 'Handwerk' },
    { src: '/images/interior-ceiling.jpg', label: 'Interieur' },
    { src: '/images/TOSHI_img2.webp', label: 'Atmosphäre' },
  ];

  const Caption = ({ label }) => (
    <>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(to top, rgba(12,10,8,0.8) 0%, transparent 45%)' }} />
      <div className="absolute bottom-4 left-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
        <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-[#f3ead9] font-medium">
          <span className="w-1 h-1 rotate-45" style={{ background: GOLD }} />
          {label}
        </span>
      </div>
    </>
  );

  return (
    <section className="relative overflow-hidden py-24 md:py-36" style={{ background: 'linear-gradient(160deg, #0c0a08 0%, #100d0a 60%, #0c0a08 100%)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(201,168,118,0.06) 0%, transparent 70%)' }} />

      {/* Label */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="text-center mb-14 md:mb-20 px-6 relative z-10"
      >
        <div className="mb-5"><Ornament /></div>
        <span className="block text-[11.5px] tracking-[0.42em] uppercase text-[#c9a876]/80 font-medium mb-4">Jetzt entdecken</span>
        <h2 className="font-serif text-[#f6efdf] leading-[1.05]" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)' }}>
          Erlebe Toshi Sushi.
        </h2>
      </motion.div>

      {/* DESKTOP bento */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-12 grid-rows-2 gap-3" style={{ height: 640 }}>
          {[
            { p: PHOTOS[0], cls: 'col-span-5 row-span-2' },
            { p: PHOTOS[1], cls: 'col-span-4 row-span-1' },
            { p: PHOTOS[2], cls: 'col-span-3 row-span-1' },
            { p: PHOTOS[3], cls: 'col-span-3 row-span-1' },
            { p: PHOTOS[4], cls: 'col-span-4 row-span-1' },
          ].map(({ p, cls }, i) => (
            <motion.div
              key={p.src}
              variants={cardVariants(i)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              whileHover={{ scale: 1.015, zIndex: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className={`${cls} relative rounded-[3px] overflow-hidden cursor-pointer group border border-[#c9a876]/10`}
              style={{ boxShadow: '0 20px 56px rgba(0,0,0,0.45)' }}
              data-cursor-hover
            >
              <img src={p.src} alt={`Toshi Sushi — ${p.label}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <Caption label={p.label} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* MOBILE stacked */}
      <div className="md:hidden px-4 space-y-3 relative z-10">
        <motion.div variants={cardVariants(0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative w-full rounded-[3px] overflow-hidden group border border-[#c9a876]/10" style={{ aspectRatio: '4/3', boxShadow: '0 16px 48px rgba(0,0,0,0.45)' }}>
          <img src={PHOTOS[0].src} alt="Toshi Sushi" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        </motion.div>
        <div className="grid grid-cols-2 gap-3">
          {[PHOTOS[1], PHOTOS[2]].map((p, i) => (
            <motion.div key={p.src} variants={cardVariants(i + 1)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative rounded-[3px] overflow-hidden border border-[#c9a876]/10" style={{ aspectRatio: '1/1', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <img src={p.src} alt="Toshi Sushi" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            </motion.div>
          ))}
        </div>
        <motion.div variants={cardVariants(3)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="relative w-full rounded-[3px] overflow-hidden border border-[#c9a876]/10" style={{ aspectRatio: '16/9', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <img src={PHOTOS[3].src} alt="Toshi Sushi" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Kontakt / Location ---------- */
const DIRECTION_ICONS = {
  transit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="12" rx="3" />
      <path d="M4 12h16" />
      <circle cx="8" cy="19" r="1.3" />
      <circle cx="16" cy="19" r="1.3" />
      <path d="M8 16.5v-1M16 16.5v-1" />
    </svg>
  ),
  car: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16V11.5a1.5 1.5 0 01.3-.9l2-2.7A2 2 0 018 7h8a2 2 0 011.7.9l2 2.7a1.5 1.5 0 01.3.9V16" />
      <path d="M4 16h16v2a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
      <circle cx="7.5" cy="13.5" r="1" />
      <circle cx="16.5" cy="13.5" r="1" />
    </svg>
  ),
  bike: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M6 17l4-8h4l3 8M10 9l3 4h5M10 9l-1.5-2" />
    </svg>
  ),
};
const DIRECTION_LABELS = {
  transit: 'Öffentliche Verkehrsmittel',
  car: 'Mit dem Auto',
  bike: 'Mit dem Fahrrad',
};

function LocationSection({ mapsConsent, onEnableMaps, onOrderClick }) {
  const [activeId, setActiveId] = useState(ORDER_STORES[0].id);
  const store = ORDER_STORES.find((s) => s.id === activeId) ?? ORDER_STORES[0];
  const hasMap = store.lat != null && store.lng != null;
  const mapSrc = hasMap ? `https://maps.google.com/maps?q=${store.lat},${store.lng}&t=&z=16&ie=UTF8&iwloc=&output=embed` : null;
  const directionsUrl = hasMap ? `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}` : null;

  return (
    <section id="kontakt" className="relative py-24 md:py-36 overflow-hidden bg-[#f3ead9]">
      <div className="absolute top-0 inset-x-0 h-px hairline-gold" style={{ opacity: 0.6 }} />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        {/* Heading + location selector */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-14 md:mb-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="flex flex-col justify-center"
          >
            <p className="font-accent text-2xl text-[#8c2a26] mb-4">Kontakt</p>
            <h2 className="font-serif text-[#14110d] leading-[1.05] mb-6" style={{ fontSize: 'clamp(2.6rem, 5vw, 4.6rem)' }}>
              Besuche uns.
            </h2>
            <p className="text-lg text-[#14110d]/70 leading-relaxed max-w-sm">
              Drei Standorte in und um Dresden — wähle deinen hier aus.
            </p>
          </motion.div>

          {/* Location selector list */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="flex flex-col justify-center divide-y divide-[#14110d]/10"
          >
            {ORDER_STORES.map((s, i) => {
              const isActive = s.id === activeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  data-cursor-hover
                  className="group relative flex items-center gap-5 py-5 text-left"
                >
                  <motion.span
                    className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-[#8c2a26]"
                    animate={{ scaleY: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ transformOrigin: 'top' }}
                  />
                  <span className={`font-serif text-3xl tabular-nums leading-none pl-5 transition-colors duration-300 ${isActive ? 'text-[#8c2a26]' : 'text-[#14110d]/20 group-hover:text-[#14110d]/35'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-lg md:text-xl font-medium leading-tight mb-0.5 transition-colors duration-300 ${isActive ? 'text-[#14110d]' : 'text-[#14110d]/55 group-hover:text-[#14110d]/80'}`}>
                      {s.name}
                    </div>
                    {s.deliveryOnly ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#14110d]/[0.05] text-[9.5px] font-medium tracking-[0.14em] uppercase text-[#14110d]/40">
                        <span className="w-1 h-1 rounded-full bg-[#8c2a26]/60" />
                        Nur Lieferung
                      </span>
                    ) : (
                      <div className={`text-sm transition-colors duration-300 ${isActive ? 'text-[#8c2a26]' : 'text-[#14110d]/45'}`}>
                        {s.address} · {s.city}
                      </div>
                    )}
                  </div>
                  <motion.span animate={{ opacity: isActive ? 1 : 0.25, x: isActive ? 2 : 0 }} transition={{ duration: 0.25 }}>
                    <svg className={`w-4 h-4 ${isActive ? 'text-[#8c2a26]' : 'text-[#14110d]/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </motion.span>
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Active location panel */}
        <AnimatePresence mode="wait">
          {!hasMap ? (
            <motion.div
              key={`${store.id}-delivery`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="rounded-[4px] border-2 border-dashed border-[#14110d]/15 bg-[#14110d]/[0.02] flex flex-col items-center justify-center text-center py-20 md:py-28 px-6"
            >
              <span className="font-serif text-4xl text-[#8c2a26]/60 mb-5">鮨</span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#8c2a26] font-medium mb-3">Nur Lieferung</span>
              <h3 className="font-serif text-3xl md:text-4xl text-[#14110d] mb-4">{store.name}</h3>
              <p className="text-[15px] text-[#14110d]/65 max-w-md leading-relaxed mb-8">
                Dieser Standort beliefert dein Gebiet, hat aber keinen eigenen Besucherstandort zum Abholen vor Ort.
              </p>
              <a
                href={store.lieferandoUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-hover
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#14110d] hover:bg-[#221d17] text-[#f3ead9] text-xs tracking-[0.14em] uppercase font-medium transition-all duration-300 border border-[#c9a876]/40 hover:border-[#c9a876]"
              >
                Jetzt bestellen
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </motion.div>
          ) : (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start"
            >
              {/* Map */}
              <div>
                <div className="relative min-h-[380px] aspect-[4/3] rounded-[4px] overflow-hidden shadow-[0_24px_64px_rgba(20,17,13,0.22)] border border-[#14110d]/10">
                  {mapsConsent ? (
                    <iframe
                      title={`Toshi Sushi ${store.name}`}
                      src={mapSrc}
                      className="w-full h-full"
                      style={{ border: 0, filter: 'saturate(0.75) sepia(0.12)' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center gap-4 bg-[#14110d] px-8">
                      <span className="font-serif text-3xl text-[#c9a876]/70">鮨</span>
                      <p className="text-sm text-[#f3ead9]/75 max-w-[280px] leading-relaxed">
                        Für die Karte wird eine Verbindung zu Google Maps hergestellt.
                      </p>
                      <button
                        type="button"
                        onClick={onEnableMaps}
                        data-cursor-hover
                        className="mt-1 inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#c9a876]/40 hover:border-[#c9a876] hover:bg-[#c9a876] text-[#f3ead9] hover:text-[#14110d] text-xs tracking-[0.14em] uppercase font-medium transition-all duration-300"
                      >
                        Karte anzeigen
                      </button>
                    </div>
                  )}
                </div>

                {/* Address recap + directions CTA */}
                <div className="flex items-center justify-between gap-4 flex-wrap mt-6 pt-6 border-t border-[#14110d]/10">
                  <div>
                    <p className="text-sm font-medium text-[#14110d]">Toshi Sushi — {store.name}</p>
                    <p className="text-sm text-[#14110d]/70">{store.address} · {store.city}</p>
                  </div>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor-hover
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#14110d] hover:bg-[#221d17] text-[#f3ead9] text-xs tracking-[0.14em] uppercase font-medium transition-all duration-300 border border-[#c9a876]/40 hover:border-[#c9a876]"
                  >
                    Route planen
                    <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Info column */}
              <div className="flex flex-col gap-10">
                <div>
                  <p className="text-[11px] tracking-[0.24em] uppercase text-[#14110d]/45 font-medium mb-3">Öffnungszeiten</p>
                  <div className="space-y-2 max-w-[300px]">
                    {store.hoursRows.map((h) => (
                      <div key={h.days} className="flex items-center justify-between border-b border-[#14110d]/10 pb-2">
                        <span className="text-sm font-normal text-[#14110d]/70">{h.days}</span>
                        <span className="text-sm font-medium text-[#14110d]">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Anfahrt — how to reach us */}
                <div>
                  <p className="text-[11px] tracking-[0.24em] uppercase text-[#14110d]/45 font-medium mb-4">Anfahrt</p>
                  <div className="space-y-5 max-w-md">
                    {store.directions.map((d) => (
                      <div key={d.type} className="flex items-start gap-4">
                        <span className="shrink-0 w-10 h-10 rounded-full border border-[#8c2a26]/25 bg-[#8c2a26]/[0.06] flex items-center justify-center text-[#8c2a26]">
                          {DIRECTION_ICONS[d.type]}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-[#14110d] mb-0.5">{DIRECTION_LABELS[d.type]}</p>
                          <p className="text-sm text-[#14110d]/75 leading-relaxed">{d.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onOrderClick}
                    data-cursor-hover
                    className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#14110d] hover:bg-[#221d17] text-[#f3ead9] font-medium text-xs tracking-[0.14em] uppercase rounded-full transition-all duration-400 border border-[#c9a876]/40 hover:border-[#c9a876] hover:-translate-y-0.5"
                  >
                    Online Bestellen
                  </button>
                  <a
                    href={INSTAGRAM}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor-hover
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 border border-[#14110d]/20 hover:border-[#8c2a26]/50 text-[#14110d] hover:text-[#8c2a26] font-medium text-xs tracking-[0.14em] uppercase rounded-full transition-all duration-400"
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ---------- Instagram ---------- */
const INSTAGRAM_POST_URL = 'https://www.instagram.com/p/DQmgkgKDXWb/';
const INSTAGRAM_BLOCKQUOTE = `<blockquote class="instagram-media" data-instgrm-permalink="${INSTAGRAM_POST_URL}?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style="background:#FFF;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin:1px;max-width:540px;min-width:326px;padding:0;width:99.375%;width:calc(100% - 2px);"><div style="padding:16px;"><a href="${INSTAGRAM_POST_URL}?utm_source=ig_embed&amp;utm_campaign=loading" style="background:#FFFFFF;line-height:0;padding:0 0;text-align:center;text-decoration:none;width:100%;" target="_blank"><div style="display:flex;flex-direction:row;align-items:center;"><div style="background-color:#F4F4F4;border-radius:50%;flex-grow:0;height:40px;margin-right:14px;width:40px;"></div><div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;"><div style="background-color:#F4F4F4;border-radius:4px;flex-grow:0;height:14px;margin-bottom:6px;width:100px;"></div><div style="background-color:#F4F4F4;border-radius:4px;flex-grow:0;height:14px;width:60px;"></div></div></div><div style="padding:19% 0;"></div><div style="display:block;height:50px;margin:0 auto 12px;width:50px;"><svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1" xmlns="http://www.w3.org/2000/svg"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g transform="translate(-511.000000, -20.000000)" fill="#000000"><g><path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631"></path></g></g></g></svg></div><div style="padding-top:8px;"><div style="color:#3897f0;font-family:Arial,sans-serif;font-size:14px;font-style:normal;font-weight:550;line-height:18px;">View this post on Instagram</div></div><div style="padding:12.5% 0;"></div><div style="display:flex;flex-direction:row;margin-bottom:14px;align-items:center;"><div><div style="background-color:#F4F4F4;border-radius:50%;height:12.5px;width:12.5px;transform:translateX(0px) translateY(7px);"></div><div style="background-color:#F4F4F4;height:12.5px;transform:rotate(-45deg) translateX(3px) translateY(1px);width:12.5px;flex-grow:0;margin-right:14px;margin-left:2px;"></div><div style="background-color:#F4F4F4;border-radius:50%;height:12.5px;width:12.5px;transform:translateX(9px) translateY(-18px);"></div></div><div style="margin-left:8px;"><div style="background-color:#F4F4F4;border-radius:50%;flex-grow:0;height:20px;width:20px;"></div><div style="width:0;height:0;border-top:2px solid transparent;border-left:6px solid #f4f4f4;border-bottom:2px solid transparent;transform:translateX(16px) translateY(-4px) rotate(30deg)"></div></div><div style="margin-left:auto;"><div style="width:0px;border-top:8px solid #F4F4F4;border-right:8px solid transparent;transform:translateY(16px);"></div><div style="background-color:#F4F4F4;flex-grow:0;height:12px;width:16px;transform:translateY(-4px);"></div><div style="width:0;height:0;border-top:8px solid #F4F4F4;border-left:8px solid transparent;transform:translateY(-4px) translateX(8px);"></div></div></div><div style="display:flex;flex-direction:column;flex-grow:1;justify-content:center;margin-bottom:24px;"><div style="background-color:#F4F4F4;border-radius:4px;flex-grow:0;height:14px;margin-bottom:6px;width:224px;"></div><div style="background-color:#F4F4F4;border-radius:4px;flex-grow:0;height:14px;width:144px;"></div></div></a><p style="color:#c9c8cd;font-family:Arial,sans-serif;font-size:14px;line-height:17px;margin-bottom:0;margin-top:8px;overflow:hidden;padding:8px 0 7px;text-align:center;text-overflow:ellipsis;white-space:nowrap;"><a href="${INSTAGRAM_POST_URL}?utm_source=ig_embed&amp;utm_campaign=loading" style="color:#c9c8cd;font-family:Arial,sans-serif;font-size:14px;font-style:normal;font-weight:normal;line-height:17px;text-decoration:none;" target="_blank">A post shared by Toshi Sushi &amp; Asia Küche (@toshi.dresden)</a></p></div></blockquote>`;

function InstagramSection() {
  const ref = useRef(null);
  const embedRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  // Insert the blockquote via ref so React never overwrites it after mount,
  // then trigger process() with retries to cover all timing scenarios.
  useEffect(() => {
    if (!embedRef.current) return;
    embedRef.current.innerHTML = INSTAGRAM_BLOCKQUOTE;

    const tryProcess = () => window.instgrm?.Embeds.process();
    tryProcess();
    const t1 = setTimeout(tryProcess, 800);
    const t2 = setTimeout(tryProcess, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section ref={ref} className="relative bg-[#0c0a08] overflow-hidden" style={{ paddingBottom: '6rem' }}>
      {/* Atmospheric glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[160px]" style={{ background: 'radial-gradient(ellipse, rgba(201,168,118,0.1) 0%, transparent 65%)' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: 'rgba(201,168,118,0.05)' }} />
        <div className="absolute top-0 inset-x-0 h-px hairline-gold" style={{ opacity: 0.6 }} />
      </div>

      {/* Heading */}
      <div className="relative pt-24 md:pt-32 pb-16 md:pb-20 text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 260, damping: 20 }}
          className="inline-flex items-center justify-center mb-8 relative"
        >
          <div className="absolute w-16 h-16 rounded-2xl bg-[#c9a876]/15 animate-ping" style={{ animationDuration: '2.5s' }} />
          <div
            className="relative w-14 h-14 rounded-2xl border border-[#c9a876]/25 bg-[#c9a876]/[0.04] backdrop-blur-sm flex items-center justify-center"
            style={{ boxShadow: '0 0 30px rgba(201,168,118,0.18), inset 0 0 0 1px rgba(201,168,118,0.06)' }}
          >
            <svg className="w-7 h-7 text-[#e5d6ae]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.1 }}>
          <h2 className="font-serif text-[#f6efdf] leading-[1.05]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.6rem)' }}>
            Folge uns auf
            <br />
            <span className="font-accent italic text-[#e5cb99]">Instagram</span>
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-8">
          <a
            href="https://www.instagram.com/toshi.dresden/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor-hover
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-[#c9a876]/40 hover:border-[#c9a876] hover:bg-[#c9a876] text-[#f3ead9] hover:text-[#14110d] text-xs tracking-[0.14em] uppercase font-medium transition-all duration-300"
          >
            @toshi.dresden
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay: 0.4 }}
          className="mt-14 md:mt-16 flex items-center justify-center gap-4"
        >
          <div className="h-px flex-1 max-w-[180px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,118,0.18))' }} />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#c9a876]/60" />
          <div className="h-px w-8 bg-[#c9a876]/30" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#c9a876]/60" />
          <div className="h-px flex-1 max-w-[180px]" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,118,0.18))' }} />
        </motion.div>
      </div>

      {/* Content — philosophy left / embed right */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-16 items-start">
          {/* Left — philosophy quote */}
          <motion.div style={{ y }} className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="font-serif text-[11rem] leading-none text-[#c9a876]/[0.08] select-none -mb-14 -ml-3"
              aria-hidden="true"
            >
              &ldquo;
            </motion.div>
            <motion.blockquote
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 1.1, delay: 0.1 }}
              className="font-serif text-4xl md:text-[3rem] text-[#f3ead9]/85 leading-[1.1] pl-1"
            >
              Gutes Sushi wird nicht
              <br />
              zusammengestellt.
              <br />
              <span className="font-accent italic text-[#e5cb99]">Es wird gemeistert.</span>
            </motion.blockquote>
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-8 flex items-center gap-4">
              <div className="h-px w-8 bg-[#c9a876]/40" />
              <span className="text-[10px] tracking-[0.4em] uppercase text-[#f3ead9]/30 font-medium">Toshi · Freital</span>
            </motion.div>
          </motion.div>

          {/* Right — Instagram embed */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex justify-center w-full min-w-0"
          >
            <div className="relative w-full max-w-[540px]">
              <div className="absolute -inset-6 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,118,0.1) 0%, transparent 65%)' }} />
              <div
                ref={embedRef}
                className="relative rounded-2xl overflow-hidden w-full"
                style={{ boxShadow: '0 0 0 1px rgba(201,168,118,0.2), 0 40px 100px rgba(0,0,0,0.75), 0 0 0 5px rgba(201,168,118,0.04)' }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Instagram embed script */}
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="afterInteractive"
        onLoad={() => { window.instgrm?.Embeds.process(); }}
      />
    </section>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#0c0a08] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 45% at 50% 0%, rgba(201,168,118,0.05) 0%, transparent 70%)' }} />
      <div className="absolute top-0 inset-x-0 h-px hairline-gold" style={{ opacity: 0.7 }} />
      {/* Faint watermark */}
      <div className="absolute -bottom-4 inset-x-0 flex justify-center pointer-events-none select-none" aria-hidden="true">
        <span className="font-serif text-[18vw] md:text-[13vw] leading-none text-[#c9a876]/[0.025] whitespace-nowrap">Toshi</span>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-20 md:pt-24 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">
          {/* Brand */}
          <div>
            <img src="/images/Toshi_Logo.webp" alt="Toshi Sushi & Asia Küche" className="h-16 w-auto object-contain mb-5" loading="lazy" />
            <p className="text-sm text-[#f3ead9]/75 font-normal leading-relaxed max-w-[280px]">
              Asiatisch. Authentisch. Anders. Frisches Sushi und Asia-Küche in Freital — von Hand gemacht, mit Respekt vor der Zutat.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                data-cursor-hover
                className="flex items-center justify-center w-10 h-10 rounded-full border border-[#c9a876]/20 bg-white/[0.02] hover:bg-[#c9a876]/10 hover:border-[#c9a876]/50 hover:-translate-y-0.5 transition-all duration-300"
              >
                <svg className="w-4 h-4 text-[#e5d6ae]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href={LIEFERANDO}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-hover
                className="flex items-center gap-2 px-4 h-10 rounded-full border border-[#c9a876]/20 bg-white/[0.02] hover:bg-[#c9a876]/10 hover:border-[#c9a876]/50 hover:-translate-y-0.5 text-[11px] font-medium tracking-[0.08em] uppercase text-[#e5d6ae]/70 hover:text-[#f3ead9] transition-all duration-300"
              >
                Lieferando
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#c9a876]/85 font-medium mb-5">Navigation</p>
            <ul className="space-y-3">
              {[
                { label: 'Speisekarte', href: '#speisekarte' },
                { label: 'Über uns', href: '#ueber-uns' },
                { label: 'Kontakt', href: '#kontakt' },
                { label: 'Online Bestellen', href: LIEFERANDO, ext: true },
              ].map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    {...(l.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="text-sm font-normal text-[#f3ead9]/80 hover:text-[#f3ead9] hover:pl-1.5 transition-all duration-300"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-[#c9a876]/85 font-medium mb-5">Kontakt</p>
            <p className="text-sm font-medium text-[#f3ead9]/85 mb-1">Dresdner Str. 106</p>
            <p className="text-sm font-normal text-[#f3ead9]/60 mb-5">01705 Freital</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between max-w-[220px]"><span className="text-[#f3ead9]/60 font-normal">Mo – Do</span><span className="text-[#f3ead9]/85 font-medium">11:00 – 22:00</span></div>
              <div className="flex justify-between max-w-[220px]"><span className="text-[#f3ead9]/60 font-normal">Fr – Sa</span><span className="text-[#f3ead9]/85 font-medium">11:00 – 23:00</span></div>
              <div className="flex justify-between max-w-[220px]"><span className="text-[#f3ead9]/60 font-normal">Sonntag</span><span className="text-[#f3ead9]/85 font-medium">12:00 – 22:00</span></div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-7 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-5">
          <p className="text-sm font-normal text-[#f3ead9]/75">
            © {year} Toshi Sushi &amp; Asia Küche · Freital
          </p>
          <p className="text-sm font-normal text-[#f3ead9]/75 flex items-center gap-2 flex-wrap justify-center">
            <span className="font-serif text-[#c9a876]/70">鮨</span> Alle Rechte vorbehalten.
            <span className="text-[#f3ead9]/40">·</span>
            Realisiert von{' '}
            <a
              href="https://www.netzflow.io/"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor-hover
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#c9a876]/40 bg-[#c9a876]/[0.08] text-[#ddc59a] hover:text-[#14110d] hover:bg-[#c9a876] hover:border-[#c9a876] font-semibold tracking-[0.02em] transition-all duration-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a876]" />
              NetzFlow
            </a>
          </p>
          {/* Payment badges — single row */}
          <div className="flex items-center gap-1.5 flex-nowrap justify-center">
            <span className="text-sm text-[#f3ead9]/75 font-medium mr-1 whitespace-nowrap">Wir akzeptieren:</span>
            {/* Apple Pay */}
            <div className="w-9 h-6 sm:w-10 sm:h-7 bg-white rounded-md flex items-center justify-center border border-gray-200" title="Apple Pay">
              <svg className="h-4" viewBox="0 0 165.521 105.965" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M150.698 0H14.823c-.566 0-1.133 0-1.698.003-.477.004-.953.009-1.43.022-1.039.028-2.087.09-3.113.274a10.51 10.51 0 0 0-2.958.975 9.897 9.897 0 0 0-4.35 4.35 10.59 10.59 0 0 0-.975 2.96C.113 9.611.052 10.658.024 11.696a70.22 70.22 0 0 0-.022 1.43C0 13.69 0 14.256 0 14.823v76.318c0 .567 0 1.132.002 1.699.003.476.009.953.022 1.43.028 1.036.09 2.084.274 3.11a10.46 10.46 0 0 0 .975 2.96 9.897 9.897 0 0 0 4.35 4.35c.953.49 1.943.796 2.958.975 1.026.183 2.074.246 3.113.274.477.011.953.017 1.43.019.565.004 1.132.004 1.698.004h135.875c.565 0 1.132 0 1.697-.004.476-.002.954-.008 1.431-.019 1.037-.028 2.085-.09 3.113-.274a10.512 10.512 0 0 0 2.958-.975 9.901 9.901 0 0 0 4.353-4.35 10.653 10.653 0 0 0 .972-2.96c.184-1.026.246-2.074.274-3.11.013-.477.017-.954.022-1.43 0-.567 0-1.132 0-1.699V14.824c0-.567 0-1.133 0-1.699a63.067 63.067 0 0 0-.022-1.429c-.028-1.038-.09-2.085-.274-3.112a10.544 10.544 0 0 0-.972-2.96 9.901 9.901 0 0 0-4.353-4.35 10.52 10.52 0 0 0-2.958-.974C155.344.092 154.296.03 153.259 0c-.477-.013-.955-.019-1.431-.022C151.83 0 151.263 0 150.698 0z" fill="#000"/>
                <path d="M150.698 3.532l1.672.003c.452.003.905.008 1.36.02.793.022 1.719.063 2.583.227.7.13 1.258.344 1.782.622a6.468 6.468 0 0 1 2.453 2.453c.28.53.494 1.075.623 1.782.163.856.205 1.772.226 2.583.013.453.018.906.02 1.36.004.564.004 1.13.004 1.694v76.318c0 .564 0 1.13-.004 1.693-.002.455-.007.908-.02 1.36-.021.812-.063 1.727-.226 2.586-.13.705-.343 1.25-.623 1.78a6.468 6.468 0 0 1-2.453 2.453c-.524.277-1.08.489-1.782.621-.864.164-1.79.206-2.583.227-.455.012-.908.018-1.36.02-.565.004-1.13.004-1.697.004H14.801c-.002 0-.003 0-.005 0-.564 0-1.128 0-1.694-.004-.45-.002-.905-.008-1.358-.02-.795-.021-1.72-.063-2.584-.227-.702-.132-1.258-.344-1.782-.621a6.197 6.197 0 0 1-1.35-.904 6.247 6.247 0 0 1-1.104-1.548c-.278-.53-.494-1.076-.623-1.78-.163-.86-.205-1.775-.226-2.587a62.94 62.94 0 0 1-.02-1.36c-.003-.563-.003-1.128-.003-1.693V14.276c0-.564 0-1.13.003-1.694.002-.454.008-.907.02-1.36.021-.811.063-1.726.226-2.583.129-.706.345-1.252.623-1.782A6.282 6.282 0 0 1 6.028 4.404c.417-.36.862-.667 1.35-.904.524-.278 1.08-.492 1.782-.622.864-.164 1.79-.205 2.584-.227.453-.012.907-.017 1.358-.02.567-.003 1.132-.003 1.698-.003h135.874" fill="#FFF"/>
                <path d="M43.508 35.77c1.404-1.755 2.356-4.112 2.105-6.52-2.054.102-4.56 1.355-6.012 3.112-1.303 1.504-2.456 3.96-2.156 6.266 2.306.2 4.61-1.152 6.063-2.858" fill="#000"/>
                <path d="M45.587 39.079c-3.35-.2-6.196 1.9-7.795 1.9-1.6 0-4.049-1.8-6.698-1.751-3.449.05-6.648 2-8.398 5.1-3.6 6.2-1 15.375 2.549 20.426 1.7 2.5 3.749 5.25 6.448 5.15 2.55-.1 3.549-1.65 6.648-1.65 3.1 0 4 1.65 6.698 1.6 2.8-.05 4.549-2.5 6.248-5 1.95-2.85 2.747-5.6 2.797-5.75-.05-.05-5.397-2.1-5.447-8.25-.05-5.15 4.198-7.6 4.398-7.75-2.399-3.55-6.148-3.95-7.448-4.025" fill="#000"/>
                <path d="M78.471 32.443c7.178 0 12.153 4.95 12.153 12.078 0 7.178-5.075 12.127-12.353 12.127h-7.929v12.602h-5.65V32.443h13.779zm-7.93 19.457h6.584c4.999 0 7.855-2.678 7.855-7.33 0-4.65-2.856-7.303-7.829-7.303H70.54v14.633z" fill="#000"/>
                <path d="M92.764 59.238c0-4.7 3.606-7.58 10.012-7.955l7.38-.425v-2.08c0-2.98-2.004-4.776-5.35-4.776-3.176 0-5.18 1.546-5.656 3.95h-5.175c.275-4.926 4.38-8.676 11.056-8.676 6.5 0 10.681 3.45 10.681 8.826v18.498h-5.225v-4.425h-.125c-1.526 2.88-4.876 4.725-8.35 4.725-5.2 0-9.248-3.225-9.248-7.662zm17.392-2.28v-2.13l-6.634.4c-3.3.225-5.175 1.726-5.175 4.08 0 2.404 1.95 3.98 4.926 3.98 3.876 0 6.883-2.654 6.883-6.33z" fill="#000"/>
                <path d="M120.975 79.652v-4.4c.4.1 1.3.1 1.65.1 2.35 0 3.65-1 4.425-3.55l.475-1.525-9.95-27.527h5.925l7.078 22.477h.1l7.078-22.477h5.775l-10.326 28.978c-2.375 6.675-5.075 8.824-10.776 8.824-.35 0-1.3-.05-1.454-.1z" fill="#000"/>
              </svg>
            </div>
            {/* Google Pay */}
            <div className="w-9 h-6 sm:w-10 sm:h-7 bg-white rounded-md flex items-center justify-center border border-gray-200" title="Google Pay">
              <svg className="h-4" viewBox="0 0 150 60" xmlns="http://www.w3.org/2000/svg">
                <path d="M71.154 28.874V45h-4.48V10.2h11.862c2.878 0 5.378.978 7.498 2.934 2.17 1.956 3.256 4.356 3.256 7.2s-1.086 5.27-3.256 7.25c-2.094 1.958-4.594 2.936-7.498 2.936H71.154v.354zm0-14.782v10.936h7.468c1.69 0 3.104-.58 4.24-1.742 1.162-1.16 1.742-2.57 1.742-4.226 0-1.632-.58-3.03-1.742-4.194-1.136-1.186-2.55-1.774-4.24-1.774h-7.468z" fill="#3C4043"/>
                <path d="M98.834 19.32c3.282 0 5.87.886 7.768 2.66 1.898 1.772 2.846 4.198 2.846 7.276v14.744h-4.288v-3.322h-.192c-1.836 2.734-4.276 4.102-7.318 4.102-2.594 0-4.768-.77-6.52-2.31-1.752-1.542-2.628-3.492-2.628-5.852 0-2.474.936-4.44 2.808-5.904 1.872-1.462 4.374-2.194 7.504-2.194 2.672 0 4.872.49 6.602 1.468v-1.03c0-1.75-.68-3.234-2.042-4.45-1.362-1.218-2.946-1.826-4.754-1.826-2.75 0-4.926 1.16-6.528 3.48l-3.948-2.49c2.362-3.434 5.862-5.152 10.498-5.152h-.808zm-5.822 19.396c0 1.318.546 2.416 1.638 3.292 1.094.878 2.37 1.316 3.832 1.316 2.078 0 3.93-.778 5.556-2.334 1.626-1.556 2.438-3.386 2.438-5.49-1.394-1.12-3.332-1.682-5.818-1.682-1.81 0-3.326.452-4.544 1.354-1.22.904-1.83 2-1.83 3.286l.728.258z" fill="#3C4043"/>
                <path d="M130.994 20.1l-14.898 34.28h-4.618l5.534-12.07L108.246 20.1h4.862l6.376 15.392h.074L125.89 20.1h5.104z" fill="#3C4043"/>
                <path d="M53.918 25.422a24.844 24.844 0 0 0-.354-4.222H30.66v7.976h13.06c-.564 3.028-2.268 5.592-4.832 7.31v6.076h7.824c4.578-4.216 7.214-10.43 7.214-17.14h-.008z" fill="#4285F4"/>
                <path d="M30.66 48.926c6.54 0 12.022-2.168 16.03-5.88l-7.824-6.076c-2.168 1.454-4.942 2.314-8.198 2.314-6.308 0-11.648-4.26-13.548-9.986H9.062v6.274c3.984 7.916 12.178 13.354 21.598 13.354z" fill="#34A853"/>
                <path d="M17.112 29.298a11.6 11.6 0 0 1-.604-3.698c0-1.284.22-2.53.604-3.698v-6.274H9.062A19.498 19.498 0 0 0 6.99 25.6c0 3.146.752 6.126 2.072 8.772l8.05-5.074z" fill="#FBBC04"/>
                <path d="M30.66 11.916c3.556 0 6.748 1.224 9.26 3.626l6.946-6.946C42.656 4.752 37.174 2.274 30.66 2.274c-9.42 0-17.614 5.438-21.598 13.354l8.05 6.274c1.9-5.726 7.24-9.986 13.548-9.986z" fill="#EA4335"/>
              </svg>
            </div>
            {/* PayPal */}
            <div className="w-9 h-6 sm:w-10 sm:h-7 bg-white rounded-md flex items-center justify-center border border-gray-200" title="PayPal">
              <svg className="h-4" viewBox="0 0 124 33" xmlns="http://www.w3.org/2000/svg">
                <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906z" fill="#253B80"/>
                <path d="M66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317z" fill="#253B80"/>
                <path d="M84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="#253B80"/>
                <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906z" fill="#179BD7"/>
                <path d="M115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317z" fill="#179BD7"/>
                <path d="M119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822a.949.949 0 0 0 .939-.803l2.768-17.536a.57.57 0 0 0-.562-.658h-3.16a.571.571 0 0 0-.562.481z" fill="#179BD7"/>
                <path d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .312-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73a2.21 2.21 0 0 0-2.183 1.866l-.055.299-0.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z" fill="#253B80"/>
                <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z" fill="#179BD7"/>
                <path d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177H11.59a1.165 1.165 0 0 0-1.152.99L9.38 13.545l-.031.199a1.34 1.34 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.303 6.303 0 0 0-2.638-1.366z" fill="#222D65"/>
                <path d="M10.438 8.697a1.166 1.166 0 0 1 1.152-.99h6.535c.774 0 1.496.05 2.16.177a9.757 9.757 0 0 1 1.47.353c.365.128.695.28.988.454a6.965 6.965 0 0 0-1.335-5.73C19.846 1.072 17.178 0 13.958 0H4.587A1.34 1.34 0 0 0 3.266 1.13L.011 25.804a.806.806 0 0 0 .795.932h5.791l1.454-9.225 2.387-8.814z" fill="#253B80"/>
              </svg>
            </div>
            {/* Klarna */}
            <div className="w-9 h-6 sm:w-10 sm:h-7 bg-[#FFB3C7] rounded-lg flex items-center justify-center border border-[#FFB3C7]" title="Klarna">
              <span className="text-[8px] font-black text-black leading-none tracking-tight">Klarna.</span>
            </div>
            {/* Mastercard */}
            <div className="w-9 h-6 sm:w-10 sm:h-7 bg-white rounded-md flex items-center justify-center border border-gray-200" title="Mastercard">
              <svg className="h-4" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="15" r="12" fill="#EB001B"/>
                <circle cx="30" cy="15" r="12" fill="#F79E1B"/>
                <path d="M24 5.15C26.516 7.15 28.086 10.29 28.086 13.8c0 3.51-1.57 6.65-4.086 8.65C21.484 20.45 19.914 17.31 19.914 13.8c0-3.51 1.57-6.65 4.086-8.65z" fill="#FF5F00"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Cookie Banner ---------- */
function CookieBanner({ show, onAccept, onDecline }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="fixed bottom-0 inset-x-0 z-[90] px-4 pb-4 md:px-6 md:pb-6"
          role="dialog"
          aria-label="Cookie-Einstellungen"
        >
          <div className="mx-auto max-w-3xl rounded-2xl border border-[#c9a876]/20 bg-[#14110d]/97 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] px-6 py-5 md:px-8 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <div className="flex-1">
                <p className="text-[11px] tracking-[0.3em] uppercase text-[#c9a876]/85 font-medium mb-2">Cookies</p>
                <p className="text-sm text-[#f3ead9]/80 leading-relaxed">
                  Wir verwenden Cookies für grundlegende Funktionen und optional für eingebettete Inhalte wie Google Maps. Du kannst deine Wahl jederzeit über die Karte im Kontaktbereich ändern.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 self-end md:self-auto">
                <button
                  type="button"
                  onClick={onDecline}
                  className="px-5 py-3 text-xs tracking-[0.14em] uppercase font-medium text-[#f3ead9]/55 hover:text-[#f3ead9] transition-colors duration-300 whitespace-nowrap"
                >
                  Ablehnen
                </button>
                <button
                  type="button"
                  onClick={onAccept}
                  data-cursor-hover
                  className="px-6 py-3 rounded-full bg-[#c9a876] hover:bg-[#ddc59a] text-[#14110d] text-xs tracking-[0.14em] uppercase font-medium transition-colors duration-300 whitespace-nowrap"
                >
                  Akzeptieren
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Promo Popup (scroll-triggered discount code) ---------- */
const PROMO_CODE = 'TOSHI15';

function PromoPopup({ show, onClose, onOrderClick }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[320] flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="absolute inset-0 bg-[#0c0a08]/82 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-[420px]"
            initial={{ scale: 0.88, opacity: 0, y: 26 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 14 }}
            transition={{ type: 'spring', stiffness: 320, damping: 27, mass: 0.8 }}
          >
            {/* Person cutout — placeholder, bleeds above the card. Swap the dashed box for an <img> once the transparent PNG is ready. */}
            <div className="relative z-20 flex justify-center -mb-12 sm:-mb-16 pointer-events-none">
              <div className="w-28 h-36 sm:w-36 sm:h-44 rounded-2xl border-2 border-dashed border-[#c9a876]/45 bg-[#14110d]/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <svg className="w-9 h-9 sm:w-11 sm:h-11 text-[#c9a876]/55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                </svg>
                <span className="text-[8.5px] sm:text-[9px] tracking-[0.12em] uppercase text-[#c9a876]/55 text-center px-2 leading-tight">Foto folgt</span>
              </div>
            </div>

            <div
              className="relative rounded-3xl overflow-hidden border border-[#c9a876]/25"
              style={{ background: '#16130f', boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 40px rgba(201,168,118,0.08)' }}
            >
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(201,168,118,0.14) 0%, transparent 70%)' }} />

              <button
                type="button"
                onClick={onClose}
                aria-label="Schließen"
                data-cursor-hover
                className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-[#0c0a08]/60 border border-[#c9a876]/25 backdrop-blur-sm hover:bg-[#0c0a08]/85 hover:border-[#c9a876]/50 hover:rotate-90 flex items-center justify-center transition-all duration-300"
              >
                <svg className="w-[11px] h-[11px] text-[#f3ead9]/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="relative z-10 pt-16 sm:pt-20 px-7 sm:px-9 pb-8 text-center">
                <p className="font-accent text-xl text-[#e5cb99] mb-2">Dein Willkommensgeschenk</p>
                <h2 className="font-serif text-[#f6efdf] leading-[1.1] mb-5" style={{ fontSize: 'clamp(1.7rem, 5vw, 2.1rem)' }}>
                  15% auf deine<br />erste Bestellung
                </h2>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={copyCode}
                    data-cursor-hover
                    className="group inline-flex items-center gap-3 pl-5 pr-3 py-3 rounded-full border-2 border-dashed border-[#c9a876]/50 hover:border-[#c9a876] transition-colors duration-300"
                  >
                    <span className="font-serif text-lg tracking-[0.1em] text-[#f6efdf]">{PROMO_CODE}</span>
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#c9a876]/15 group-hover:bg-[#c9a876]/25 transition-colors duration-300">
                      {copied ? (
                        <svg className="w-3.5 h-3.5 text-[#8fae86]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-[#c9a876]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                      )}
                    </span>
                  </button>
                </div>
                <p className="text-[11px] text-[#f3ead9]/60 mb-7">{copied ? 'Code kopiert!' : 'Antippen zum Kopieren'}</p>

                <button
                  type="button"
                  onClick={() => { onClose(); onOrderClick(); }}
                  data-cursor-hover
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-full bg-[#c9a876] hover:bg-[#ddc59a] text-[#14110d] font-semibold text-sm tracking-[0.1em] uppercase transition-all duration-300"
                >
                  Jetzt bestellen
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
                <p className="text-[10.5px] text-[#f3ead9]/35 mt-4">Code bei der Bestellung angeben · Nur für kurze Zeit</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Page ---------- */
export default function ToshiSite() {
  const [modalItem, setModalItem] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [cookieChoice, setCookieChoice] = useState(null);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const lenisRef = useRef(null);
  const promoTriggeredRef = useRef(false);
  const { scrollYProgress } = useScroll();

  const openOrderModal = () => setOrderModalOpen(true);

  // Mark the promo as already-shown if this browser tab has seen it this session
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem('toshi-promo-shown') === '1') {
        promoTriggeredRef.current = true;
      }
    } catch {}
  }, []);

  // Trigger the discount popup once, at 40% scroll depth
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      if (v >= 0.4 && !promoTriggeredRef.current && loaded && !orderModalOpen && !modalItem) {
        promoTriggeredRef.current = true;
        setShowPromo(true);
        try { window.sessionStorage.setItem('toshi-promo-shown', '1'); } catch {}
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, loaded, orderModalOpen, modalItem]);

  // Read any stored cookie choice on mount; show the banner only if none was made yet
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(COOKIE_KEY);
      if (saved === 'accepted' || saved === 'declined') {
        setCookieChoice(saved);
      } else {
        setShowCookieBanner(true);
      }
    } catch {
      setShowCookieBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    setCookieChoice('accepted');
    setShowCookieBanner(false);
    try { window.localStorage.setItem(COOKIE_KEY, 'accepted'); } catch {}
  };
  const declineCookies = () => {
    setCookieChoice('declined');
    setShowCookieBanner(false);
    try { window.localStorage.setItem(COOKIE_KEY, 'declined'); } catch {}
  };

  // Buttery smooth scrolling (Lenis) — created stopped, released once the preloader finishes
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLoaded(true);
      return;
    }
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: true,
    });
    lenis.stop();
    lenisRef.current = lenis;
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Lock scroll while the preloader is showing, or a modal is open
  useEffect(() => {
    const shouldLock = !loaded || Boolean(modalItem) || orderModalOpen || showPromo;
    if (shouldLock) {
      lenisRef.current?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenisRef.current?.start();
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [loaded, modalItem, orderModalOpen, showPromo]);

  return (
    <main className="bg-[#14110d] text-[#f3ead9]">
      <ToshiPreloader onDone={() => setLoaded(true)} />
      <ToshiCursor />

      {/* Scroll progress bar */}
      <motion.div style={{ scaleX: scrollYProgress }} className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]">
        <div className="w-full h-full bg-gradient-to-r from-[#8c2a26] via-[#c9a876] to-[#8c2a26]" />
      </motion.div>

      <Navbar onOrderClick={openOrderModal} />
      <HeroSection onOrderClick={openOrderModal} />
      <TickerStrip />
      <OrderSection onOrderClick={openOrderModal} />
      <FreshnessSection />
      <MenuSection onItemClick={setModalItem} />
      <AboutSection />
      <PhotoWall />
      <LocationSection mapsConsent={cookieChoice === 'accepted'} onEnableMaps={acceptCookies} onOrderClick={openOrderModal} />
      <InstagramSection />
      <Footer />

      <AnimatePresence>
        {modalItem && <ProductModal item={modalItem} onClose={() => setModalItem(null)} onOrderClick={openOrderModal} />}
      </AnimatePresence>

      <AnimatePresence>
        {orderModalOpen && <OrderModal onClose={() => setOrderModalOpen(false)} />}
      </AnimatePresence>

      <CookieBanner show={showCookieBanner && loaded} onAccept={acceptCookies} onDecline={declineCookies} />

      <PromoPopup show={showPromo} onClose={() => setShowPromo(false)} onOrderClick={openOrderModal} />
    </main>
  );
}
