import { motion } from 'motion/react';

export const PixelCat = ({
  size = 24,
  className = '',
  ariaLabel = 'loading-cat',
}: {
  size?: number;
  className?: string;
  ariaLabel?: string;
}) => (
  <motion.svg
    aria-label={ariaLabel}
    animate={{
      y: [0, -1, 0],
      rotate: [0, 1, -1, 0],
    }}
    className={className}
    fill="none"
    height={size}
    role="img"
    transition={{
      repeat: Infinity,
      duration: 3,
      ease: 'easeInOut',
    }}
    viewBox="0 0 16 16"
    width={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <motion.path
      animate={{
        rotate: [0, 20, 0, -20, 0],
        x: [0, 0.5, 0, -0.5, 0],
      }}
      d="M1 9H2V11H1V9Z"
      fill="currentColor"
      style={{ originX: '2px', originY: '11px' }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: 'easeInOut',
      }}
    />
    <motion.path
      animate={{
        rotate: [0, 30, 0, -30, 0],
        x: [0, 1, 0, -1, 0],
      }}
      d="M0 10H1V12H0V10Z"
      fill="currentColor"
      style={{ originX: '1px', originY: '12px' }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: 'easeInOut',
      }}
    />

    <path d="M3 2H5V3H3V2Z" fill="currentColor" />
    <path d="M4 3H6V4H4V3Z" fill="currentColor" />
    <path d="M11 2H13V3H11V2Z" fill="currentColor" />
    <path d="M10 3H12V4H10V3Z" fill="currentColor" />
    <path d="M3 4H13V5H3V4Z" fill="currentColor" />
    <path d="M2 5H14V11H2V5Z" fill="currentColor" />

    <motion.g
      animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
      style={{ originY: '7px' }}
      transition={{
        repeat: Infinity,
        duration: 4,
        times: [0, 0.9, 0.95, 0.98, 1],
      }}
    >
      <path d="M4 6H6V8H4V6Z" fill="var(--app-surface)" />
      <path d="M10 6H12V8H10V6Z" fill="var(--app-surface)" />
      <path d="M5 7H6V8H5V7Z" fill="var(--app-text)" />
      <path d="M11 7H12V8H11V7Z" fill="var(--app-text)" />
    </motion.g>

    <path d="M1 7H3V7.5H1V7Z" fill="currentColor" opacity="0.3" />
    <path d="M1 8.5H3V9H1V8.5Z" fill="currentColor" opacity="0.3" />
    <path d="M13 7H15V7.5H13V7Z" fill="currentColor" opacity="0.3" />
    <path d="M13 8.5H15V9H13V8.5Z" fill="currentColor" opacity="0.3" />

    <motion.path
      animate={{ opacity: [0.2, 0.6, 0.2] }}
      d="M3 8.5H4V9.5H3V8.5Z"
      fill="#FFB3B3"
      transition={{ repeat: Infinity, duration: 2.5 }}
    />
    <motion.path
      animate={{ opacity: [0.2, 0.6, 0.2] }}
      d="M12 8.5H13V9.5H12V8.5Z"
      fill="#FFB3B3"
      transition={{ repeat: Infinity, duration: 2.5 }}
    />

    <path d="M7 8.5H9V9.5H7V8.5Z" fill="#FFB3B3" />
    <path d="M7.5 9.5H8.5V10H7.5V9.5Z" fill="currentColor" opacity="0.5" />
    <path d="M4 11V13H6V11H4Z" fill="currentColor" />
    <path d="M10 11V13H12V11H10Z" fill="currentColor" />
    <path d="M3 13H13V14H3V13Z" fill="currentColor" />
  </motion.svg>
);
