import React, { useState } from 'react';
import { Session } from '../types';
import { Clock, Gamepad2, Brain, Activity } from 'lucide-react';
import { formatTime } from '../utils';

interface LogsProps {
  sessions: Session[];
}

export default function Logs({ sessions }: LogsProps) {
  const [viewMode, setViewMode] = useState<'stats' | 'diary'>('stats');

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <header className="pt-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Session Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Review your history</p>
        </div>
        
        {/* Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex">
          <button 
            onClick={() => setViewMode('stats')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'stats' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Stats
          </button>
          <button 
            onClick={() => setViewMode('diary')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'diary' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Diary
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No sessions recorded yet.
          </div>
        ) : (
          sessions.map(session => {
            const date = new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            return (
              <div key={session.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-lg">
                      <Gamepad2 className="text-primary-400" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200">{session.game_name}</h3>
                      <p className="text-xs text-slate-500">{date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-slate-300 font-mono text-sm justify-end">
                      <Clock size={14} className="text-slate-500" />
                      {formatTime(session.actual_seconds)}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Planned: {formatTime(session.planned_mins * 60)}</p>
                  </div>
                </div>

                {viewMode === 'stats' ? (
                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-800/50">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 mb-1">Start Mood</span>
                      <span className="text-sm font-semibold text-primary-300">{session.baseline_mood}/5</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 mb-1">End Mood</span>
                      <span className="text-sm font-semibold text-primary-400">{session.end_mood}/5</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 mb-1">Control</span>
                      <span className="text-sm font-semibold text-primary-400">{session.control_score}/5</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 mb-1">Satisfied</span>
                      <span className="text-sm font-semibold text-primary-400">{session.satisfaction}/5</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-800/50 space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                        <Brain size={12} />
                        Diary Entry
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                        "{session.diary_entry || "No entry recorded."}"
                      </p>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-primary-400 mb-1 flex items-center gap-1.5">
                        <Activity size={12} />
                        Analyzer Insight
                      </h4>
                      <p className="text-xs text-slate-400">
                        {session.analyzer_tip}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
