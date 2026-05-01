import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 8000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const wordmark = "NOMAD COMPASS";

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-dark)]"
      initial={{ clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' }}
      animate={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_60%)]" />

      {/* Ambient background motion for the tail */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.03) 0%, transparent 50%)',
          backgroundSize: '150% 150%'
        }}
      />

      <motion.div 
        className="mb-8 z-10"
        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.5, rotate: -45 }}
        transition={{ duration: 1.5, type: 'spring', bounce: 0.4 }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <motion.path 
            d="M60 10L70 50L110 60L70 70L60 110L50 70L10 60L50 50L60 10Z" 
            stroke="var(--color-primary)" 
            strokeWidth="4"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={phase >= 1 ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.circle 
            cx="60" cy="60" r="20" 
            stroke="var(--color-primary)" 
            strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </svg>
      </motion.div>

      <div className="flex overflow-hidden mb-6 z-10">
        {wordmark.split('').map((char, i) => (
          <motion.span
            key={i}
            className="text-[4vw] font-black tracking-[0.2em] text-white"
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>

      <div className="relative overflow-hidden pt-2 pb-4 z-10">
        <motion.div 
          className="text-[2vw] text-[var(--color-primary)] font-bold tracking-widest"
          initial={{ opacity: 0, y: "100%" }}
          animate={phase >= 3 ? { opacity: 1, y: "0%" } : { opacity: 0, y: "100%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          LIVE BETTER. KEEP MORE.
        </motion.div>
        <motion.div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-[var(--color-primary)] origin-center"
          initial={{ width: 0 }}
          animate={phase >= 3 ? { width: '100%' } : { width: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}