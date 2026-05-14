import { Session } from '../types';

export function calculateProgression(sessions: Session[]) {
  const totalXp = sessions.reduce((sum, s) => {
    // 1 XP per minute * Control Score multiplier
    const mins = Math.max(1, Math.round((s.actual_seconds || 0) / 60));
    const multiplier = s.control_score ?? 3; // Default to 3 for old sessions
    return sum + (mins * multiplier);
  }, 0);

  // Level formula (progressive curve)
  const level = Math.max(1, Math.floor(Math.sqrt(totalXp) / 2) + 1);
  
  return { totalXp, level };
}
