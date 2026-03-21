import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

interface StarBottleProps {
  count: number;
  isDarkMode: boolean;
  label: string;
  color?: string;
  shape?: 'jar' | 'flask' | 'vial';
  onClick?: () => void;
}

export const StarBottle = ({ count, isDarkMode, label, color = '#fbbf24', shape = 'jar', onClick }: StarBottleProps) => {
  // Max stars to show in the bottle visualization
  const maxVisualStars = 15;
  const fillPercentage = Math.min((count / maxVisualStars) * 100, 100);
  
  // Generate star positions
  const stars = Array.from({ length: Math.min(count, maxVisualStars) }).map((_, i) => ({
    id: i,
    x: 20 + Math.random() * 60, // 20% to 80%
    y: 80 - (Math.random() * (fillPercentage * 0.7)), // Start from bottom
    size: 6 + Math.random() * 8,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
  }));

  const getShapeStyles = () => {
    switch (shape) {
      case 'flask':
        return 'rounded-b-[4rem] rounded-t-[1.5rem]';
      case 'vial':
        return 'rounded-b-3xl rounded-t-xl w-24 h-36';
      default:
        return 'rounded-b-[3.5rem] rounded-t-3xl';
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative flex flex-col items-center group cursor-pointer"
    >
      <div className={`relative w-32 h-40 transition-all duration-500 ${getShapeStyles()}`}>
        {/* Glass Body */}
        <div className={`absolute inset-0 border-2 overflow-hidden backdrop-blur-md shadow-[inset_0_0_30px_rgba(255,255,255,0.1)] ${getShapeStyles()} ${
          isDarkMode ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/5'
        }`}>
          {/* Fill Level - Soft Glow */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${fillPercentage}%` }}
            transition={{ type: 'spring', stiffness: 40, damping: 15 }}
            className="absolute bottom-0 left-0 right-0 opacity-30 blur-[4px]"
            style={{ backgroundColor: color }}
          />

          {/* Stars inside */}
          {stars.map((star) => (
            <motion.div
              key={star.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1],
                y: [0, -4, 0],
              }}
              transition={{ 
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut"
              }}
              className="absolute"
              style={{ 
                left: `${star.x}%`, 
                top: `${star.y}%`,
                color: color
              }}
            >
              <Star size={star.size} fill="currentColor" />
            </motion.div>
          ))}

          {/* Cute Face on the Bottle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
            <div className="flex gap-5">
              <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
              <div className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
            </div>
            {/* Blush */}
            <div className="flex gap-8 -mt-0.5">
              <div className="w-2 h-1 bg-pink-400/40 rounded-full blur-[1px]" />
              <div className="w-2 h-1 bg-pink-400/40 rounded-full blur-[1px]" />
            </div>
            <div className={`w-3 h-1.5 mx-auto mt-0.5 rounded-full border-b-2 border-current ${isDarkMode ? 'text-white' : 'text-black'}`} />
          </div>

          {/* Glass Shine */}
          <div className="absolute top-4 left-4 w-3 h-16 bg-white/20 rounded-full blur-[2px] -rotate-12" />
          <div className="absolute top-4 left-10 w-1.5 h-6 bg-white/10 rounded-full blur-[1px] -rotate-12" />
          
          {/* Sparkles */}
          <motion.div 
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute top-10 right-6 text-white/40"
          >
            <Star size={10} fill="currentColor" />
          </motion.div>
          <motion.div 
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
            className="absolute bottom-12 left-8 text-white/30"
          >
            <Star size={8} fill="currentColor" />
          </motion.div>
        </div>

        {/* Cork/Stopper */}
        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-6 rounded-t-xl shadow-md z-10 ${
          isDarkMode ? 'bg-stone-700' : 'bg-stone-400'
        }`}>
          {/* Little Ribbon */}
          <div className="absolute top-4 -right-2 w-5 h-8 border-l-2 border-red-400/60 rotate-12" />
        </div>

        {/* Reflection */}
        <div className="absolute inset-2 border-l-2 border-t-2 border-white/10 rounded-tl-[3rem] pointer-events-none" />
      </div>

      {/* Label */}
      <div className="mt-5 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Star size={8} className={isDarkMode ? 'text-stone-500' : 'text-stone-400'} fill="currentColor" />
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-stone-300' : 'text-stone-600'}`}>
            {label}
          </p>
          <Star size={8} className={isDarkMode ? 'text-stone-500' : 'text-stone-400'} fill="currentColor" />
        </div>
        <div className={`inline-block px-3 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${
          isDarkMode ? 'bg-stone-800 text-stone-400 border border-stone-700' : 'bg-white text-stone-400 border border-stone-100'
        }`}>
          {count} 颗星
        </div>
      </div>
    </motion.div>
  );
};
