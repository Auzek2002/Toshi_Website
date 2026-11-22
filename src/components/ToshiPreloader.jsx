'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

export default function ToshiPreloader({ onDone }) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 9) + 3;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => setDone(true), 620);
      }
      setCount(current);
    }, 110);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#14110d]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <div className="absolute inset-0 grain-overlay opacity-[0.15] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
            className="relative flex flex-col items-center"
          >
            <motion.img
              src="/images/toshi-logo.webp"
              alt="Toshi"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.3, ease: EASE }}
              className="h-24 md:h-28 w-auto object-contain mb-8"
            />

            <div className="relative w-44 h-px bg-white/[0.08] overflow-hidden mb-4">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[#c9a876]"
                animate={{ width: `${count}%` }}
                transition={{ duration: 0.25, ease: 'linear' }}
              />
            </div>

            <p className="text-[10px] tracking-[0.5em] uppercase text-[#c9a876]/60 font-medium">
              {String(count).padStart(3, '0')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
