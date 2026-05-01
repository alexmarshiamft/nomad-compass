import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const lines = [
    "WHERE YOU LIVE",
    "DETERMINES",
    "WHAT YOU KEEP"
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-dark)]"
      initial={{ clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)' }}
      animate={{ clipPath: 'polygon(50% -100%, 250% 50%, 50% 250%, -150% 50%)' }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Texture Overlay */}
      <motion.div 
        className="absolute inset-0 opacity-15 mix-blend-overlay"
        initial={{ x: '-5%', y: '-5%', scale: 1.1 }}
        animate={{ x: '0%', y: '0%', scale: 1 }}
        transition={{ duration: 7, ease: "linear" }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/data-texture.png`} 
          className="w-full h-full object-cover"
          alt=""
        />
      </motion.div>

      {/* Ambient Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4vw_4vw]" />

      {/* Amber Accent Shapes */}
      <motion.div 
        className="absolute top-0 right-[20%] w-[1px] h-[30vh] bg-[var(--color-primary)] origin-top"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div 
        className="absolute bottom-[20%] left-0 w-[20vw] h-[1px] bg-[var(--color-primary)] origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      <div className="z-10 flex flex-col items-start w-full max-w-[80vw] mx-auto" style={{ perspective: '1000px' }}>
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} className="overflow-hidden">
            <motion.h2 
              className={`font-black tracking-tighter leading-[1.1] ${lineIndex === 2 ? 'text-[var(--color-primary)] text-[7vw]' : 'text-white text-[5vw]'}`}
              initial={{ opacity: 0, y: 100, rotateX: -20 }}
              animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 100, rotateX: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: lineIndex * 0.3 }}
            >
              {line}
            </motion.h2>
          </div>
        ))}
      </div>

    </motion.div>
  );
}