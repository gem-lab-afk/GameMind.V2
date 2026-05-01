import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Play, Gamepad2, TrendingUp, Clock, Target } from 'lucide-react';
import { Session } from '../types';
import { formatTime } from '../utils';
import { motion } from 'framer-motion';

interface DashboardProps {
  sessions: Session[];
  onStartSession: () => void;
}

export default function Dashboard({ sessions, onStartSession }: DashboardProps) {
  const chartData = useMemo(() => {
    // Last 7 sessions, oldest first for left-to-right chart
    const recent = [...sessions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).slice(-7);
    return recent.map((s, idx) => ({
      name: `S${idx + 1}`,
      endMood: s.end_mood,
      game: s.game_name
    }));
  }, [sessions]);

  // Derived stats
  const stats = useMemo(() => {
    if (sessions.length === 0) return { avgMood: 0, totalTime: 0, controlRatio: 0 };
    
    // Average mood last 7 days (or just last 7 sessions like chart)
    const recent7 = sessions.slice(0, 7);
    const avgMood = recent7.reduce((sum, s) => sum + s.end_mood, 0) / (recent7.length || 1);
    
    // Total time all time
    const totalTime = sessions.reduce((sum, s) => sum + (s.actual_seconds || 0), 0);
    
    // Control ratio
    const highControlSessions = sessions.filter(s => s.control_score >= 4).length;
    const controlRatio = (highControlSessions / sessions.length) * 100;

    return { avgMood, totalTime, controlRatio };
  }, [sessions]);

  const lastSession = sessions.length > 0 ? sessions[0] : null;
  
  const activeStepStr = localStorage.getItem('ht_step');
  const isTrackingActive = activeStepStr === '2' || activeStepStr === '3';

  return (
    <div className="p-6 space-y-8 pb-32">
      <header className="pt-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl font-extrabold tracking-widest uppercase font-sans text-white drop-shadow-md">
          Game<span className="text-primary-400">Mind</span>
        </h1>
        <p className="text-slate-300 text-sm mt-1">Monitor your screen time & mood</p>
      </header>

      {/* Hero Section */}
      <motion.button 
        onClick={onStartSession} 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full relative group cursor-pointer text-left focus:outline-none rounded-3xl shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-white/20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/40 to-primary-400/40 rounded-3xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="bg-white/20 p-4 rounded-full mb-4 shadow-lg shadow-black/20">
            <Play className="text-white ml-1" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-wide">{isTrackingActive ? 'RESUME SESSION' : 'START SESSION'}</h2>
          <p className="text-slate-200 text-sm">{isTrackingActive ? 'You have a session in progress.' : 'Track your playtime and feelings.'}</p>
        </div>
      </motion.button>

      {sessions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Gamepad2 size={40} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">Ready for your first session?</h2>
          <p className="text-slate-400 max-w-xs mx-auto">Tap the button above when you start playing a game to begin tracking your mood.</p>
        </motion.div>
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
            <h3 className="text-lg font-bold tracking-wide text-slate-100 uppercase">Mood Timeline</h3>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 h-64 shadow-lg">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}
                    formatter={(value, name, props) => [`Mood: ${value}`, props.payload.game]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="endMood" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMood)"
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Insight Box */}
          {lastSession && (
            <section className="space-y-4 pb-8">
              <h3 className="text-lg font-bold tracking-wide text-slate-100 uppercase">Latest Insight</h3>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary-400 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                  <p className="text-slate-200 text-sm leading-relaxed font-medium">
                    {lastSession.analyzer_tip}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-4 ml-6 uppercase tracking-wider">From your {lastSession.game_name} session</p>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
