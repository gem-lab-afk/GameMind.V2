import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Play } from 'lucide-react';
import { Session } from '../types';

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

  const lastSession = sessions.length > 0 ? sessions[0] : null; // Assuming sorted descending in App

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="pt-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary-300 to-primary-500 bg-clip-text text-transparent">
          GameMind
        </h1>
        <p className="text-slate-400 text-sm mt-1">Monitor your screen time & mood</p>
      </header>

      {/* Hero Section */}
      <button 
        onClick={onStartSession} 
        className="w-full relative group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-grad-from to-primary-grad-to rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"></div>
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center overflow-hidden hover:border-primary-500/50 transition-colors">
          <div className="bg-primary-500/20 p-4 rounded-full mb-4">
            <Play className="text-primary-400 ml-1" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Start New Session</h2>
          <p className="text-slate-400 text-sm">Track your playtime and feelings.</p>
        </div>
      </button>

      {/* Stats Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">Mood Timeline</h3>
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#475569" fontSize={12} tickLine={false} axisLine={false} width={20} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-primary-400)' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value, name, props) => [`Mood: ${value}`, props.payload.game]}
                />
                <Line 
                  type="linear" 
                  dataKey="endMood" 
                  stroke="var(--color-primary-500)" 
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: 'var(--color-primary-400)', stroke: '#0f172a', strokeWidth: 2 }}
                  dot={{ r: 4, fill: '#1e293b', stroke: 'var(--color-primary-500)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              No data yet. Complete a session!
            </div>
          )}
        </div>
      </section>

      {/* Insight Box */}
      {lastSession && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">Latest Insight</h3>
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-primary-900/40 rounded-2xl p-5 shadow-lg shadow-primary-900/10">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 shrink-0 shadow-sm shadow-primary-500"></div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {lastSession.analyzer_tip}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-4 ml-6">From your recent {lastSession.game_name} session</p>
          </div>
        </section>
      )}
    </div>
  );
}
