import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface VirtualPetProps {
  averageControlScore: number;
  size?: number;
  streak?: number;
}

export function getSpiritName(averageControlScore: number) {
  if (averageControlScore >= 4.5) return 'Aura';
  if (averageControlScore >= 3.5) return 'Nova';
  if (averageControlScore >= 2.5) return 'Echo';
  return 'Glitch';
}

export default function VirtualPet({ averageControlScore, size = 40, streak = 0 }: VirtualPetProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [isTooltipAbove, setIsTooltipAbove] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleInteraction = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const tooltipHeight = 160; // Estimated max height
      const tooltipWidth = 208; // w-52 is 13rem = 208px
      
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // Determine if we should show above or below
      const above = spaceAbove > tooltipHeight || spaceAbove > spaceBelow;
      setIsTooltipAbove(above);

      // Calculate center left position and clamp to screen edges
      let left = rect.left + rect.width / 2;
      const halfWidth = tooltipWidth / 2;
      const padding = 12; // Screen edge padding
      
      if (left - halfWidth < padding) {
        left = halfWidth + padding;
      } else if (left + halfWidth > window.innerWidth - padding) {
        left = window.innerWidth - halfWidth - padding;
      }

      setTooltipPos({
        top: above ? rect.top - 8 : rect.bottom + 8,
        left: left
      });
    }
    setShowInfo(prev => !prev);
  };

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const tooltipHeight = 160;
      const tooltipWidth = 208;
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const above = spaceAbove > tooltipHeight || spaceAbove > spaceBelow;
      setIsTooltipAbove(above);

      let left = rect.left + rect.width / 2;
      const halfWidth = tooltipWidth / 2;
      const padding = 12;
      
      if (left - halfWidth < padding) {
        left = halfWidth + padding;
      } else if (left + halfWidth > window.innerWidth - padding) {
        left = window.innerWidth - halfWidth - padding;
      }

      setTooltipPos({
        top: above ? rect.top - 8 : rect.bottom + 8,
        left: left
      });
    }
    setShowInfo(true);
  };

  // We use control score (1-5) to define the pet's "Health/Mood" State.
  // 4.5 - 5.0: Ascended / Majestic
  // 3.5 - 4.4: Happy / Thriving
  // 2.5 - 3.4: Neutral / Stable
  // 0.0 - 2.4: Corrupted / Chaotic

  let state = 'neutral';
  let colors = { base: '#94a3b8', glow: '#475569', stroke: '#cbd5e1' }; // Slate
  let label = 'Steady Spirit';
  let animationProps = { y: [0, -8, 0], scale: [1, 1.02, 1], rotate: [0, 0, 0] };
  let transitionProps = { duration: 8, ease: 'easeInOut', repeat: Infinity };

  if (averageControlScore >= 4.5) {
    state = 'ascended';
    colors = { base: '#fde047', glow: '#ca8a04', stroke: '#fef08a' }; // Gold
    label = 'Zen Spirit';
    animationProps = { y: [0, -10, 0], scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] };
    transitionProps = { duration: 12, ease: 'easeInOut', repeat: Infinity };
  } else if (averageControlScore >= 3.5) {
    state = 'happy';
    colors = { base: '#4ade80', glow: '#16a34a', stroke: '#bbf7d0' }; // Green
    label = 'Thriving Spirit';
    animationProps = { y: [0, -8, 0], scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] };
    transitionProps = { duration: 8, ease: 'easeInOut', repeat: Infinity };
  } else if (averageControlScore >= 2.5) {
    state = 'neutral';
    colors = { base: '#60a5fa', glow: '#2563eb', stroke: '#bfdbfe' }; // Blue
    label = 'Neutral Spirit';
    // default anim
  } else {
    state = 'chaotic';
    colors = { base: '#ef4444', glow: '#dc2626', stroke: '#fecaca' }; // Red
    label = 'Corrupted Spirit';
    animationProps = { y: [0, -4, 4, 0], scale: [1, 0.98, 1.02, 1], rotate: [0, -2, 2, 0] };
    transitionProps = { duration: 6, ease: 'easeInOut', repeat: Infinity };
  }

  // Visual Evolution based on Streak
  const hasAura = streak >= 3;
  const hasCrown = streak >= 7;

  return (
    <div 
      ref={containerRef}
      className={`relative inline-flex items-center justify-center rounded-full bg-slate-950/50 shadow-lg border cursor-help lg:cursor-pointer z-50 ${hasAura ? "border-primary-500/50 shadow-primary-500/20" : "border-white/5"}`}
      style={{ width: size + 8, height: size + 8 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowInfo(false)}
      onClick={handleInteraction}
    >
      {showInfo && createPortal(
          <div 
            className="fixed w-52 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            style={{ 
              top: tooltipPos.top, 
              left: tooltipPos.left,
              transform: isTooltipAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
            }}
          >
            <div className="flex flex-col gap-1 text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-sm font-bold text-slate-100">{getSpiritName(averageControlScore)}</span>
                <span className="text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-primary-400 font-mono">
                  Lvl {Math.max(1, Math.floor(averageControlScore))}
                </span>
              </div>
              <div className="w-full bg-slate-900 border border-slate-700/50 h-2 rounded-full mt-2 overflow-hidden relative">
                <div 
                   className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-600 to-primary-400" 
                   style={{ width: `${(Math.max(0, averageControlScore) / 5) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-medium">
                <span className="whitespace-nowrap">Control Base</span>
                <span>{averageControlScore.toFixed(1)} / 5.0</span>
              </div>
              {streak > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] text-slate-300 font-medium whitespace-nowrap">Current Streak</span>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    🔥 {streak}
                  </span>
                </div>
              )}
            </div>
            
            {/* Tooltip Arrow */}
            {isTooltipAbove ? (
              <>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-slate-700"></div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[5px] border-transparent border-t-slate-800"></div>
              </>
            ) : (
              <>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-[6px] border-transparent border-b-slate-700"></div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[2px] border-[5px] border-transparent border-b-slate-800"></div>
              </>
            )}
          </div>,
        document.body
      )}

      {hasAura && (
        <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-md animate-pulse"></div>
      )}
      
      {hasCrown && (
        <div className="absolute -top-3 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)] z-10" style={{ fontSize: size * 0.4 }}>
          👑
        </div>
      )}

      <motion.div
        animate={animationProps}
        transition={transitionProps}
        style={{ width: size, height: size, color: colors.glow }}
        className="drop-shadow-[0_0_8px_currentColor] z-0"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {state === 'happy' && (
            <>
              {/* Happy Form has a blobby shape */}
              <motion.path 
                animate={{ d: [
                  "M 50, 25 C 80, 25 90, 50 90, 75 C 90, 95 70, 95 50, 95 C 30, 95 10, 95 10, 75 C 10, 50 20, 25 50, 25 Z",
                  "M 50, 20 C 85, 20 95, 55 90, 75 C 85, 95 70, 95 50, 95 C 30, 95 15, 95 10, 75 C 5, 55 15, 20 50, 20 Z",
                  "M 50, 25 C 80, 25 90, 50 90, 75 C 90, 95 70, 95 50, 95 C 30, 95 10, 95 10, 75 C 10, 50 20, 25 50, 25 Z"
                ] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                fill={colors.base} 
              />
              <ellipse cx="35" cy="55" rx="6" ry="6" fill="#fff">
                 <animate attributeName="ry" values="6;6;6;0;6" keyTimes="0;0.9;0.95;0.97;1" dur="8s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="65" cy="55" rx="6" ry="6" fill="#fff">
                 <animate attributeName="ry" values="6;6;6;0;6" keyTimes="0;0.9;0.95;0.97;1" dur="8s" repeatCount="indefinite" />
              </ellipse>
              <path d="M 40, 65 Q 50, 75 60, 65" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </>
          )}
          {state === 'ascended' && (
            <>
              {/* Ascended form is a diamond star */}
              <motion.path 
                 animate={{ scale: [1, 1.05, 1], rotate: [0, 90, 180, 270, 360] }}
                 transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                 style={{ transformOrigin: '50% 50%' }}
                 d="M 50, 10 L 65, 40 L 95, 50 L 65, 60 L 50, 90 L 35, 60 L 5, 50 L 35, 40 Z" fill={colors.base} 
              />
              <motion.circle 
                animate={{ r: [10, 15, 10], opacity: [0.8, 0.4, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                cx="50" cy="50" r="10" fill="#fff" 
              />
              <ellipse cx="50" cy="50" rx="5" ry="5" fill={colors.base}>
                 <animate attributeName="ry" values="5;5;0;5" keyTimes="0;0.9;0.95;1" dur="10s" repeatCount="indefinite" />
                 <animate attributeName="rx" values="5;5;0;5" keyTimes="0;0.9;0.95;1" dur="10s" repeatCount="indefinite" />
              </ellipse>
            </>
          )}
          {state === 'neutral' && (
            <>
              {/* Neutral form is a rounded box */}
              <rect x="25" y="30" width="50" height="50" rx="15" fill={colors.base} />
              <ellipse cx="40" cy="50" rx="5" ry="5" fill="#fff">
                 <animate attributeName="ry" values="5;5;0;5" keyTimes="0;0.9;0.95;1" dur="8s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="60" cy="50" rx="5" ry="5" fill="#fff">
                 <animate attributeName="ry" values="5;5;0;5" keyTimes="0;0.9;0.95;1" dur="8s" repeatCount="indefinite" />
              </ellipse>
              <motion.line 
                animate={{ x1: [45, 40, 45], x2: [55, 60, 55] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                x1="45" y1="65" x2="55" y2="65" stroke="#fff" strokeWidth="4" strokeLinecap="round" 
              />
            </>
          )}
          {state === 'chaotic' && (
            <>
              <motion.path 
                animate={{ scale: [1, 0.95, 1.05, 1], rotate: [0, -2, 2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '50% 50%' }}
                d="M 50, 15 L 70, 30 L 90, 20 L 75, 45 L 95, 70 L 65, 65 L 50, 90 L 35, 65 L 5, 70 L 25, 45 L 10, 20 L 30, 30 Z" 
                fill={colors.base} 
              />
              <circle cx="38" cy="50" r="5" fill="#fff">
                <animate attributeName="r" values="5;2;6;5" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="62" cy="50" r="5" fill="#fff">
                <animate attributeName="r" values="5;6;2;5" dur="4s" repeatCount="indefinite" />
              </circle>
              <line x1="30" y1="40" x2="45" y2="45" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              <line x1="70" y1="40" x2="55" y2="45" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              <path d="M 40, 65 L 45, 60 L 50, 65 L 55, 60 L 60, 65" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
        </svg>
      </motion.div>
    </div>
  );
}
