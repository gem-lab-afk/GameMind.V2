import React from 'react';
import { motion } from 'motion/react';

interface VirtualPetProps {
  averageControlScore: number;
  size?: number;
}

export default function VirtualPet({ averageControlScore, size = 20 }: VirtualPetProps) {
  // Determine state based on control score (1-5)
  // 1-2: Sad/Tired
  // 3: Neutral
  // 4: Happy
  // 5: Zen/Evolution
  
  let emoji = '😐';
  let color = 'text-slate-400';
  let label = 'Neutral';

  if (averageControlScore >= 4.5) {
    emoji = '🐉';
    color = 'text-primary-400';
    label = 'Zen Dragon';
  } else if (averageControlScore >= 4) {
    emoji = '🐱';
    color = 'text-emerald-400';
    label = 'Happy Kit';
  } else if (averageControlScore >= 3) {
    emoji = '🐹';
    color = 'text-amber-400';
    label = 'Steady Hamster';
  } else if (averageControlScore >= 2) {
    emoji = '😴';
    color = 'text-slate-500';
    label = 'Sleepy Sloth';
  } else {
    emoji = '👻';
    color = 'text-indigo-400';
    label = 'Ghostly';
  }

  return (
    <motion.div 
      className={`relative inline-flex items-center justify-center p-1 rounded-full bg-slate-900/80 border border-white/10 shadow-lg ${color}`}
      style={{ width: size + 8, height: size + 8 }}
      animate={{ 
        y: [0, -2, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity,
        ease: "easeInOut"
      }}
      title={`Pet Status: ${label} (${averageControlScore.toFixed(1)})`}
    >
      <span style={{ fontSize: size }}>{emoji}</span>
    </motion.div>
  );
}
