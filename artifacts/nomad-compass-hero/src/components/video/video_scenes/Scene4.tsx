import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const CITIES = ["TBILISI", "LISBON", "DUBAI", "CHIANG MAI", "BOGOTÁ", "38 CITIES ANALYZED"];

export function Scene4() {
  const [phase, setPhase] = useState(0);
  const [cityIndex, setCityIndex] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (phase >= 1 && cityIndex < CITIES.length - 1) {
      const isLastHop = cityIndex === CITIES.length - 2;
      const delay = isLastHop ? 800 : 300;
      const timer = setTimeout(() => setCityIndex(prev => prev + 1), delay);
      return () => clearTimeout(timer);
    }
  }, [phase, cityIndex]);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-bg-dark)]"
      initial={{ x: '100%' }}
      animate={{ x: '0%' }}
      exit={{ x: '-100%' }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgwLDAsMCwwLjE1KSIvPjwvc3ZnPg==')] opacity-50" />
      
      {/* Background drifting element */}
      <motion.div 
        className="absolute w-[50vw] h-[50vw] border-[2px] border-[var(--color-bg-dark)] opacity-10 rounded-full"
        animate={{ scale: [1, 1.5, 1], rotate: [0, 90, 180] }}
        transition={{ duration: 7, ease: "linear", repeat: Infinity }}
      />

      <div className="z-10 w-full px-12 overflow-hidden flex flex-col items-center">
        <motion.div 
          key={cityIndex}
          className="text-[8vw] font-black tracking-tighter leading-none uppercase text-center"
          initial={{ y: 100, opacity: 0, rotateX: -45 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: -100, opacity: 0, rotateX: 45 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
          style={{ perspective: '1000px' }}
        >
          {CITIES[cityIndex]}
        </motion.div>
        
        {cityIndex === CITIES.length - 1 && (
          <motion.div 
            className="h-[4px] bg-[var(--color-bg-dark)] mt-8"
            initial={{ width: 0 }}
            animate={{ width: '40vw' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        )}
      </div>

    </motion.div>
  );
}