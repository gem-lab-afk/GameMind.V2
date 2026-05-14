import React from 'react';

// Average control score will dictate the pet's 'health/mood'
// <= 2: Glitchy / Sick
// 2 - 4: Neutral
// >= 4: Happy / Glowing aura

interface VirtualPetProps {
  averageControlScore: number;
  size?: number;
}

export default function VirtualPet({ averageControlScore, size = 32 }: VirtualPetProps) {
  const isSick = averageControlScore < 3;
  const isGlowing = averageControlScore > 4.5;
  const isNeutral = !isSick && !isGlowing;

  return (
    <div 
      className={`relative flex items-center justify-center`}
      style={{ width: size, height: size }}
      title={`Virtual Pet - Control Score: ${averageControlScore.toFixed(1)}`}
    >
      {isGlowing && (
        <div className="absolute inset-0 rounded-full bg-emerald-400 blur-md opacity-60 animate-pulse"></div>
      )}
      {isSick && (
        <div className="absolute inset-0 rounded-full bg-rose-500 blur-sm opacity-40 mix-blend-color-dodge"></div>
      )}
      
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isSick ? 'animate-bounce' : isGlowing ? 'animate-pulse' : ''}
      >
        {/* Base polygon / Diamond shape */}
        <path
          d="M50 10 L90 50 L50 90 L10 50 Z"
          fill={isSick ? '#f43f5e' : isGlowing ? '#10b981' : '#3b82f6'}
          className="transition-colors duration-500"
        />
        {/* Inner geometric core */}
        <circle cx="50" cy="50" r="15" fill="#ffffff" opacity="0.8" />
        
        {/* Emotion indicators */}
        {isSick && (
          <>
            <line x1="40" y1="40" x2="60" y2="60" stroke="#f43f5e" strokeWidth="4" />
            <line x1="60" y1="40" x2="40" y2="60" stroke="#f43f5e" strokeWidth="4" />
          </>
        )}
        {isGlowing && (
          <path d="M45 55 Q 50 65 55 55" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
        {isNeutral && (
          <line x1="40" y1="50" x2="60" y2="50" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}
