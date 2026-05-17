import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Play, Gamepad2, TrendingUp, Clock, Target, Star, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Session, Profile } from '../types';
import { formatTime, safeParseJSON } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { calculateProgression } from '../lib/progressionUtils';
import VirtualPet, { getSpiritName } from './VirtualPet';

const getSessionIdentifier = (s: Session) => {
  if (s.games_played && s.games_played.length > 0) {
    return s.games_played.join(', ');
  }
  if (s.tags && s.tags.length > 0) {
    return s.tags.join(', ');
  }
  return s.session_name || s.game_name || 'Unnamed Session';
};

interface DashboardProps {
  sessions: Session[];
  onStartSession: () => void;
  profile?: Profile | null;
}

export default function Dashboard({ sessions, onStartSession, profile }: DashboardProps) {
  const navigate = useNavigate();
  const chartData = useMemo(() => {
    // Last 7 sessions, oldest first for left-to-right chart
    const recent = [...sessions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).slice(-7);
    return recent.map((s, idx) => ({
      name: new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      endMood: s.end_mood,
      duration: Math.round((s.actual_seconds || 0) / 60),
      sessionLabel: getSessionIdentifier(s)
    }));
  }, [sessions]);

  // Derived stats & XP
  const { stats, xpData } = useMemo(() => {
    if (sessions.length === 0) return { 
      stats: { avgMood: 0, totalTime: 0, controlRatio: 0 },
      xpData: { xp: 0, level: 1, progress: 0, currentLevelStartingXp: 0, nextLevelXp: 10 }
    };
    
    // Average mood last 7 days
    const recent7 = sessions.slice(0, 7);
    const avgMood = recent7.reduce((sum, s) => sum + s.end_mood, 0) / (recent7.length || 1);
    
    // Total time all time
    const totalTime = sessions.reduce((sum, s) => sum + (s.actual_seconds || 0), 0);
    
    // Control ratio
    const highControlSessions = sessions.filter(s => s.control_score >= 4).length;
    const controlRatio = (highControlSessions / sessions.length) * 100;

    // XP calculation
    const { totalXp, level } = calculateProgression(sessions);

    const currentLevelStartingXp = Math.pow((level - 1) * 2, 2);
    const nextLevelXp = Math.pow(level * 2, 2);
    const progress = Math.min(100, Math.max(0, ((totalXp - currentLevelStartingXp) / (nextLevelXp - currentLevelStartingXp)) * 100));

    return { 
      stats: { avgMood, totalTime, controlRatio },
      xpData: { xp: totalXp, level, progress, currentLevelStartingXp, nextLevelXp }
    };
  }, [sessions]);

  const lastSession = sessions.length > 0 ? sessions[0] : null;
  
  const activeStepStr = localStorage.getItem('ht_step');
  const isTrackingActive = activeStepStr === '2' || activeStepStr === '3';

  // Streak & Retention Logic
  const [showStreakToast, setShowStreakToast] = React.useState<number | null>(null);
  const [dailyQuote, setDailyQuote] = React.useState(0);

  const currentStreak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const dates = sessions.map(s => new Date(s.created_at).toDateString());
    const uniqueDates = Array.from(new Set(dates));
    
    let streak = 0;
    let checkDate = new Date();
    // Start checking from today or yesterday
    if (!uniqueDates.includes(checkDate.toDateString())) {
      checkDate.setDate(checkDate.getDate() - 1); // Check yesterday
    }
    
    while (uniqueDates.includes(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }, [sessions]);

  React.useEffect(() => {
    // Generate a random-ish daily quote based on the current day
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    setDailyQuote(dayOfYear % 3);

    // Show toast for milestones
    const viewedStreaks = safeParseJSON<number[]>(localStorage.getItem('ht_viewed_streaks'), []);
    if (currentStreak >= 7 && !viewedStreaks.includes(7)) {
      setShowStreakToast(7);
    } else if (currentStreak >= 3 && !viewedStreaks.includes(3)) {
      setShowStreakToast(3);
    }
  }, [currentStreak]);

  const handleCloseStreak = (streak: number) => {
    const viewed = safeParseJSON<number[]>(localStorage.getItem('ht_viewed_streaks'), []);
    viewed.push(streak);
    localStorage.setItem('ht_viewed_streaks', JSON.stringify(viewed));
    setShowStreakToast(null);
  };

  const quotes = [
    "Gaming is a journey, not a marathon. Take breaks to stay sharp.",
    "Mastering a game takes time; mastering your mind takes consistency.",
    "A session played with intention is worth ten played on autopilot."
  ];

  return (
    <div className="p-6 space-y-8 pb-32 relative">
      <AnimatePresence>
        {showStreakToast !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-6 left-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 shadow-2xl flex items-center gap-4"
          >
            <div className="bg-white/20 p-2 rounded-full">
              <Trophy className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold tracking-wide">Achievement Unlocked!</h3>
              <p className="text-white/90 text-sm">{showStreakToast}-Day Streak! Consistency is key.</p>
            </div>
            <button onClick={() => handleCloseStreak(showStreakToast)} className="text-white/60 hover:text-white transition-colors bg-black/10 p-2 rounded-full">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="pt-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-extrabold tracking-widest uppercase font-sans text-white drop-shadow-md">
            Game<span className="text-primary-400">Mind</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-300 text-sm">Monitor your screen time & mood</p>
            {profile?.id === 'guest_user_12345' && (
              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase tracking-tighter border border-amber-500/20 rounded animate-pulse">Guest Node</span>
            )}
          </div>
        </div>
        
        {profile && (
          <div className="flex items-center gap-2 text-right z-10">
             <div className="hidden sm:block">
               <p className="text-sm font-bold text-white capitalize">{profile.equipped_title || 'Novice'}</p>
               <p className="text-xs text-primary-400 font-mono">Lvl {xpData.level}</p>
             </div>
             <div className="relative">
                <div className={`w-12 h-12 bg-slate-800 rounded-full border-2 overflow-hidden ${profile.equipped_avatar_frame || 'border-transparent'}`}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary-400">
                      {profile.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Virtual Pet next to Avatar */}
                <div className="absolute -bottom-1 -left-1 z-50">
                   {stats && <VirtualPet averageControlScore={sessions.length > 0 ? sessions.reduce((s, x) => s + (x.control_score || 3), 0) / sessions.length : 3} size={32} streak={currentStreak} />}
                </div>
             </div>
          </div>
        )}
      </header>

      {/* Level Bar Section */}
      <motion.div 
        layout
        onClick={() => navigate('/progression')}
        className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden group cursor-pointer hover:border-primary-500/50 transition-colors"
        title="View Progression Dashboard"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-indigo-600/10 blur-xl opacity-50 group-hover:opacity-100 group-hover:from-primary-600/30 transition-all duration-300"></div>
        <div className="flex justify-between items-end mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="bg-primary-500/20 p-1.5 rounded-lg border border-primary-500/30">
              <Trophy size={18} className="text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Player Level</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xl font-bold text-white leading-none">{xpData.level}</p>
                <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-md border border-primary-500/30 font-semibold shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
                  VIEW LEADERBOARD & REWARDS →
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">XP</p>
            <p className="text-sm font-bold text-primary-400 leading-none">{Math.floor(xpData.xp)} <span className="text-slate-500 text-xs font-normal">/ {xpData.nextLevelXp}</span></p>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden relative z-10 shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${xpData.progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary-500 to-indigo-400 relative"
          >
            <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
          </motion.div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <button 
        onClick={onStartSession} 
        className="w-full relative group cursor-pointer text-left focus:outline-none rounded-3xl shadow-[0_0_25px_rgba(59,130,246,0.3)] border border-white/20 overflow-hidden hover:scale-[1.02] active:scale-95 transition-transform duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/40 via-indigo-600/20 to-primary-400/40 rounded-3xl blur-md opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="bg-primary-500/20 p-4 rounded-full mb-4 shadow-lg shadow-black/40 border border-primary-500/30 group-hover:scale-110 transition-transform duration-500">
            <Play className="text-primary-300 ml-1" size={32} />
          </div>
          <h2 className="text-xl font-bold tracking-widest text-white mb-2 uppercase drop-shadow-md">{isTrackingActive ? 'RESUME SESSION' : 'START SESSION'}</h2>
          <p className="text-slate-300 text-sm font-medium">{isTrackingActive ? 'You have a session in progress.' : 'Track your playtime and feelings.'}</p>
        </div>
      </button>

      {sessions.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in slide-in-from-bottom-5 duration-700"
        >
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Gamepad2 size={40} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">Ready for your first session?</h2>
          <p className="text-slate-400 max-w-xs mx-auto">Tap the button above when you start playing a game to begin tracking your mood.</p>
        </div>
      ) : (
        <>
          {/* Quick Stats Section */}
          <section className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
              <TrendingUp className="text-primary-400 mb-1" size={20} />
              <div className="text-xs text-slate-400 font-medium tracking-wide">AVG MOOD</div>
              <div className="text-lg font-bold text-white">{stats.avgMood.toFixed(1)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
              <Clock className="text-emerald-400 mb-1" size={20} />
              <div className="text-xs text-slate-400 font-medium tracking-wide">TOTAL TIME</div>
              <div className="text-lg font-bold text-white">{Math.floor(stats.totalTime / 3600)}h {Math.floor((stats.totalTime % 3600) / 60)}m</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
              <Target className="text-amber-400 mb-1" size={20} />
              <div className="text-xs text-slate-400 font-medium tracking-wide">CONTROL %</div>
              <div className="text-lg font-bold text-white">{Math.round(stats.controlRatio)}%</div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold tracking-wide text-slate-100 uppercase">Composite Analytics</h3>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 h-72 shadow-lg">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} width={35} />
                  <YAxis yAxisId="right" orientation="right" domain={[1, 5]} ticks={[1, 5]} stroke="#fbbf24" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val === 5 ? 'High' : val === 1 ? 'Low' : ''} width={35} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)', padding: '12px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}
                    formatter={(value, name, props) => {
                      if (name === 'endMood') return [`Mood: ${value}/5`, props.payload.sessionLabel || 'Session'];
                      if (name === 'duration') return [`${value} min`, 'Time Played'];
                      return [value, name];
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8', bottom: -10 }} />
                  <Bar yAxisId="left" dataKey="duration" name="Time Played" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} opacity={0.8} barSize={24} />
                  <Line yAxisId="right" type="monotone" dataKey="endMood" name="End Mood" stroke="#fbbf24" strokeWidth={3} activeDot={{ r: 6, fill: '#fbbf24', stroke: '#fff', strokeWidth: 2 }} dot={{ strokeWidth: 2, r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Insight Box */}
          {lastSession && (
            <section className="space-y-4 pb-8">
              <h3 className="text-lg font-bold tracking-wide text-slate-100 uppercase">Companion Insight</h3>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative flex items-start gap-4">
                 <div className="shrink-0 pt-2">
                    <VirtualPet averageControlScore={lastSession.control_score || 3} size={56} streak={currentStreak} />
                 </div>
                 <div className="flex-1">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-r-[12px] border-r-slate-800 border-b-8 border-b-transparent absolute left-[72px] top-10"></div>
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
                      <h4 className="text-primary-400 font-bold mb-1 text-xs uppercase tracking-wider">{getSpiritName(lastSession.control_score || 3)} Says...</h4>
                      <p className="text-slate-300 text-sm leading-relaxed font-medium italic">
                        "{lastSession.analyzer_tip || quotes[dailyQuote]}"
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-wider pl-2">From {getSessionIdentifier(lastSession)}</p>
                 </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
