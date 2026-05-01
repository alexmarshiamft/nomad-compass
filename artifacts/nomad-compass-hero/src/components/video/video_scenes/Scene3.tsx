import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (phase >= 2) {
      let startTime: number;
      const duration = 1500;
      const animateCounter = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOutExpo = 1 - Math.pow(2, -10 * progress);
        setCounter(Math.floor(easeOutExpo * 8900));
        if (progress < 1) {
          requestAnimationFrame(animateCounter);
        } else {
          setCounter(8900);
        }
      };
      requestAnimationFrame(animateCounter);
    }
  }, [phase]);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-dark)]"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "linear" }}
      >
        <video 
          src={`${import.meta.env.BASE_URL}videos/coastline.mp4`}
          autoPlay muted loop playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[var(--color-bg-dark)] opacity-60" />
      </motion.div>

      <div className="z-10 flex flex-col items-center justify-center w-full max-w-[80vw]">
        
        {/* Data Box 1 */}
        <motion.div 
          className="bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-white/10 p-8 rounded-xl mb-8 flex flex-col items-center relative overflow-hidden"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            className="absolute top-0 left-0 h-1 bg-[var(--color-success)] origin-left"
            initial={{ scaleX: 0 }}
            animate={phase >= 2 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%' }}
          />
          <div className="font-mono text-[var(--color-success)] text-[6vw] font-bold leading-none mb-2">
            ${counter.toLocaleString()}<span className="text-[3vw] text-white/50">/mo</span>
          </div>
          <div className="text-[1.5vw] text-white/70 uppercase tracking-widest">
            Disposable Income
          </div>
        </motion.div>

        {/* Data Box 2 */}
        <motion.div 
          className="bg-[var(--color-bg-dark)]/80 backdrop-blur-md border border-[var(--color-primary)]/30 p-6 rounded-xl flex flex-col items-center relative overflow-hidden"
          initial={{ opacity: 0, x: -50, scale: 0.95 }}
          animate={phase >= 3 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -50, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            className="absolute top-0 right-0 h-full w-1 bg-[var(--color-primary)] origin-top"
            initial={{ scaleY: 0 }}
            animate={phase >= 3 ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="font-mono text-[var(--color-primary)] text-[5vw] font-bold leading-none mb-1">
            0%
          </div>
          <div className="text-[1.2vw] text-white/70 uppercase tracking-widest">
            Effective Tax Rate
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}