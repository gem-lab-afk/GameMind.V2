export interface RewardDef {
  level: number;
  id: string;
  title: string;
  type: 'frame' | 'title' | 'color';
  value: string;
}

export const REWARDS_MAP: RewardDef[] = [
  { level: 1, id: 'r_lvl1', title: 'Seeker Title', type: 'title', value: 'Seeker' },
  { level: 2, id: 'r_lvl2', title: 'Novice Title', type: 'title', value: 'Novice' },
  { level: 3, id: 'r_lvl3', title: 'Apprentice Title', type: 'title', value: 'Apprentice' },
  { level: 5, id: 'r_lvl5', title: 'Chrome Frame', type: 'frame', value: 'border-slate-300' },
  { level: 7, id: 'r_lvl7', title: 'Focus Badge', type: 'title', value: 'Focussed' },
  { level: 10, id: 'r_lvl10', title: 'Zen Master Title', type: 'title', value: 'Zen Master' },
  { level: 12, id: 'r_lvl12', title: 'Iron Frame', type: 'frame', value: 'border-slate-500' },
  { level: 15, id: 'r_lvl15', title: 'Gold Frame', type: 'frame', value: 'border-yellow-400' },
  { level: 18, id: 'r_lvl18', title: 'Elite Title', type: 'title', value: 'Elite' },
  { level: 20, id: 'r_lvl20', title: 'Legend Title', type: 'title', value: 'Legend' },
  { level: 25, id: 'r_lvl25', title: 'Diamond Frame', type: 'frame', value: 'border-cyan-400' },
  { level: 30, id: 'r_lvl30', title: 'Grandmaster', type: 'title', value: 'Grandmaster' },
];
