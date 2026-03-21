import React from 'react';
import { motion } from 'motion/react';

export const PixelCat = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <motion.svg 
    width={size} 
    height={size} 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    animate={{ 
      y: [0, -1, 0],
      rotate: [0, 1, -1, 0]
    }}
    transition={{ 
      repeat: Infinity, 
      duration: 3, 
      ease: "easeInOut" 
    }}
  >
    {/* Tail - Wagging animation */}
    <motion.path 
      d="M1 9H2V11H1V9Z" 
      fill="currentColor"
      animate={{ 
        rotate: [0, 20, 0, -20, 0],
        x: [0, 0.5, 0, -0.5, 0]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 1.5, 
        ease: "easeInOut" 
      }}
      style={{ originX: '2px', originY: '11px' }}
    />
    <motion.path 
      d="M0 10H1V12H0V10Z" 
      fill="currentColor"
      animate={{ 
        rotate: [0, 30, 0, -30, 0],
        x: [0, 1, 0, -1, 0]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 1.5, 
        ease: "easeInOut" 
      }}
      style={{ originX: '1px', originY: '12px' }}
    />

    {/* Ears - More triangular */}
    <path d="M3 2H5V3H3V2Z" fill="currentColor"/>
    <path d="M4 3H6V4H4V3Z" fill="currentColor"/>
    
    <path d="M11 2H13V3H11V2Z" fill="currentColor"/>
    <path d="M10 3H12V4H10V3Z" fill="currentColor"/>
    
    {/* Head/Body */}
    <path d="M3 4H13V5H3V4Z" fill="currentColor"/>
    <path d="M2 5H14V11H2V5Z" fill="currentColor"/>
    
    {/* Eyes - Blinking animation */}
    <motion.g
      animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
      transition={{ 
        repeat: Infinity, 
        duration: 4, 
        times: [0, 0.9, 0.95, 0.98, 1] 
      }}
      style={{ originY: '7px' }}
    >
      <path d="M4 6H6V8H4V6Z" fill="white"/>
      <path d="M10 6H12V8H10V6Z" fill="white"/>
      <path d="M5 7H6V8H5V7Z" fill="black"/>
      <path d="M11 7H12V8H11V7Z" fill="black"/>
    </motion.g>

    {/* Whiskers */}
    <path d="M1 7H3V7.5H1V7Z" fill="currentColor" opacity="0.3"/>
    <path d="M1 8.5H3V9H1V8.5Z" fill="currentColor" opacity="0.3"/>
    
    <path d="M13 7H15V7.5H13V7Z" fill="currentColor" opacity="0.3"/>
    <path d="M13 8.5H15V9H13V8.5Z" fill="currentColor" opacity="0.3"/>

    {/* Blushing Cheeks - Pulsing animation */}
    <motion.path 
      d="M3 8.5H4V9.5H3V8.5Z" 
      fill="#FFB3B3"
      animate={{ opacity: [0.2, 0.6, 0.2] }}
      transition={{ repeat: Infinity, duration: 2.5 }}
    />
    <motion.path 
      d="M12 8.5H13V9.5H12V8.5Z" 
      fill="#FFB3B3"
      animate={{ opacity: [0.2, 0.6, 0.2] }}
      transition={{ repeat: Infinity, duration: 2.5 }}
    />

    {/* Nose/Mouth area */}
    <path d="M7 8.5H9V9.5H7V8.5Z" fill="#FFB3B3"/>
    <path d="M7.5 9.5H8.5V10H7.5V9.5Z" fill="currentColor" opacity="0.5"/>
    
    {/* Paws */}
    <path d="M4 11V13H6V11H4Z" fill="currentColor"/>
    <path d="M10 11V13H12V11H10Z" fill="currentColor"/>
    <path d="M3 13H13V14H3V13Z" fill="currentColor"/>
  </motion.svg>
);
