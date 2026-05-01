import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const FEATURES = ["TAXES", "VISAS", "COST", "QUALITY"];

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 6500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-dark)]"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div 
        className="absolute inset-0 opacity-20 mix-blend-screen flex items-center justify-center"
        initial={{ rotate: -10, scale: 1.2 }}
        animate={{ rotate: 10, scale: 1.0 }}
        transition={{ duration: 8, ease: "linear" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/globe.png`} 
          className="w-[80vw] h-[80vw] object-contain"
          alt=""
        />
      </motion.div>

      <div className="z-10 grid grid-cols-2 gap-x-24 gap-y-16 w-full max-w-[70vw]">
        {FEATURES.map((feature, i) => (
          <div key={i} className="relative flex flex-col items-start">
            <motion.div 
              className="text-[6vw] font-black tracking-tighter text-[var(--color-primary)]"
              initial={{ opacity: 0, x: -50, rotateY: 45 }}
              animate={phase >= 1 ? { opacity: 1, x: 0, rotateY: 0 } : { opacity: 0, x: -50, rotateY: 45 }}
              transition={{ 
                duration: 0.6, 
                delay: i * 0.4, 
                type: "spring", 
                stiffness: 200, 
                damping: 20 
              }}
              style={{ perspective: '1000px' }}
            >
              {feature}
            </motion.div>
            <motion.div 
              className="h-[2px] bg-[var(--color-primary)]/50 mt-2 origin-left"
              initial={{ scaleX: 0 }}
              animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: (i * 0.4) + 0.2, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>

    </motion.div>
  );
}