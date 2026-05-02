import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const text = "EXPLORE";
  const words = text.split(" ");

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-dark)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Video */}
      <motion.div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: "linear" }}
      >
        <video 
          src={`${import.meta.env.BASE_URL}videos/coastline.mp4`}
          autoPlay muted loop playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-dark)] to-transparent opacity-80" />
      </motion.div>

      {/* Globe Icon */}
      <motion.div
        className="absolute w-[30vw] h-[30vw] border-[1px] border-[var(--color-primary)] rounded-full opacity-20"
        initial={{ scale: 0.5, rotate: 0 }}
        animate={{ scale: 1, rotate: 180 }}
        transition={{ duration: 6, ease: "linear" }}
      >
        <div className="w-full h-full border-[1px] border-[var(--color-primary)] rounded-full absolute rotate-45" />
        <div className="w-full h-full border-[1px] border-[var(--color-primary)] rounded-full absolute -rotate-45" />
        <div className="w-full h-full border-[1px] border-[var(--color-primary)] rounded-full absolute rotate-90" />
      </motion.div>

      {/* Kinetic Typography */}
      <div className="z-10 flex flex-col items-center justify-center w-full px-12" style={{ perspective: '1000px' }}>
        <div className="flex flex-wrap justify-center gap-4 text-[6vw] font-bold tracking-tight text-white leading-none">
          {words.map((word, wordIndex) => (
            <div key={wordIndex} className="flex overflow-hidden pb-4">
              {word.split('').map((char, charIndex) => {
                const delay = (wordIndex * 5 + charIndex) * 0.04;
                return (
                  <motion.span
                    key={charIndex}
                    className="inline-block origin-bottom"
                    initial={{ opacity: 0, y: 100, rotateX: -40 }}
                    animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 100, rotateX: -40 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay }}
                  >
                    {char}
                  </motion.span>
                );
              })}
            </div>
          ))}
        </div>
        
        <motion.div 
          className="mt-8 h-[2px] bg-[var(--color-primary)] origin-center"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={phase >= 2 ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '40vw' }}
        />
      </div>
    </motion.div>
  );
}