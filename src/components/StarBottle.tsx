import { Star } from 'lucide-react';
import { motion } from 'motion/react';

interface StarBottleProps {
  count: number;
  isDarkMode: boolean;
  label: string;
  color?: string;
  shape?: 'jar' | 'flask' | 'vial';
  onClick?: () => void;
}

export const StarBottle = ({
  count,
  isDarkMode,
  label,
  color = '#fbbf24',
  shape = 'jar',
  onClick,
}: StarBottleProps) => {
  const maxVisualStars = 15;
  const fillPercentage = Math.min((count / maxVisualStars) * 100, 100);

  const stars = Array.from({ length: Math.min(count, maxVisualStars) }).map((_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 80 - Math.random() * (fillPercentage * 0.7),
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
      className="group relative flex cursor-pointer flex-col items-center"
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`relative h-40 w-32 transition-all duration-500 ${getShapeStyles()}`}>
        <div
          className={`absolute inset-0 overflow-hidden border-2 shadow-[inset_0_0_30px_rgba(255,255,255,0.1)] backdrop-blur-md ${getShapeStyles()} ${
            isDarkMode ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/5'
          }`}
        >
          <motion.div
            animate={{ height: `${fillPercentage}%` }}
            className="absolute bottom-0 left-0 right-0 opacity-30 blur-[4px]"
            initial={{ height: 0 }}
            style={{ backgroundColor: color }}
            transition={{ type: 'spring', stiffness: 40, damping: 15 }}
          />

          {stars.map((star) => (
            <motion.div
              key={star.id}
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1],
                y: [0, -4, 0],
              }}
              className="absolute"
              initial={{ opacity: 0, scale: 0 }}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                color,
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: 'easeInOut',
              }}
            >
              <Star fill="currentColor" size={star.size} />
            </motion.div>
          ))}

          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
            <div className="flex gap-5">
              <div className={`h-1.5 w-1.5 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
              <div className={`h-1.5 w-1.5 rounded-full ${isDarkMode ? 'bg-white' : 'bg-black'}`} />
            </div>
            <div className="-mt-0.5 flex gap-8">
              <div className="h-1 w-2 rounded-full bg-pink-400/40 blur-[1px]" />
              <div className="h-1 w-2 rounded-full bg-pink-400/40 blur-[1px]" />
            </div>
            <div
              className={`mx-auto mt-0.5 h-1.5 w-3 rounded-full border-b-2 border-current ${isDarkMode ? 'text-white' : 'text-black'}`}
            />
          </div>

          <div className="absolute top-4 left-4 h-16 w-3 -rotate-12 rounded-full bg-white/20 blur-[2px]" />
          <div className="absolute top-4 left-10 h-6 w-1.5 -rotate-12 rounded-full bg-white/10 blur-[1px]" />

          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            className="absolute top-10 right-6 text-white/40"
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          >
            <Star fill="currentColor" size={10} />
          </motion.div>
          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            className="absolute bottom-12 left-8 text-white/30"
            transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
          >
            <Star fill="currentColor" size={8} />
          </motion.div>
        </div>

        <div
          className={`absolute -top-2 left-1/2 z-10 h-6 w-12 -translate-x-1/2 rounded-t-xl shadow-md ${
            isDarkMode ? 'bg-stone-700' : 'bg-stone-400'
          }`}
        >
          <div className="absolute top-4 -right-2 h-8 w-5 rotate-12 border-l-2 border-red-400/60" />
        </div>

        <div className="pointer-events-none absolute inset-2 rounded-tl-[3rem] border-t-2 border-l-2 border-white/10" />
      </div>

      <div className="mt-5 text-center">
        <div className="mb-1 flex items-center justify-center gap-1">
          <Star
            className={isDarkMode ? 'text-stone-500' : 'text-stone-400'}
            fill="currentColor"
            size={8}
          />
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
              isDarkMode ? 'text-stone-300' : 'text-stone-600'
            }`}
          >
            {label}
          </p>
          <Star
            className={isDarkMode ? 'text-stone-500' : 'text-stone-400'}
            fill="currentColor"
            size={8}
          />
        </div>
        <div
          className={`inline-block rounded-full border px-3 py-0.5 text-[9px] font-bold shadow-sm ${
            isDarkMode
              ? 'border-stone-700 bg-stone-800 text-stone-400'
              : 'border-stone-100 bg-white text-stone-400'
          }`}
        >
          {count} 颗星
        </div>
      </div>
    </motion.div>
  );
};
