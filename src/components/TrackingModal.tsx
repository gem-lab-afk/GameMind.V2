import React, { useState, useEffect } from 'react';
import { X, Play, Square, Check, ChevronDown, Loader2 } from 'lucide-react';
import { Session } from '../types';
import { formatTime } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackingModalProps {
  onClose: () => void;
  onSave: (session: Session) => void;
}

export default function TrackingModal({ onClose, onSave }: TrackingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(() => Number(localStorage.getItem('ht_step')) as any || 1);
  
  // Step 1 State
  const [gameName, setGameName] = useState(() => localStorage.getItem('ht_game_name') || localStorage.getItem('habit_tracker_default_game') || '');
  const [plannedTime, setPlannedTime] = useState<number | ''>(() => {
    const saved = localStorage.getItem('ht_planned_time');
    if (saved) return Number(saved);
    const defTime = localStorage.getItem('habit_tracker_default_time');
    return defTime ? Number(defTime) : '';
  });
  const [baselineMood, setBaselineMood] = useState<number>(() => Number(localStorage.getItem('ht_baseline_mood')) || 3);
  
  // Step 2 State
  const [actualTime, setActualTime] = useState(() => Number(localStorage.getItem('ht_actual_time')) || 0); // in seconds
  const [isPaused, setIsPaused] = useState(() => localStorage.getItem('ht_is_paused') === 'true');
  const [lastTick, setLastTick] = useState<number>(() => Number(localStorage.getItem('ht_last_tick')) || Date.now());
  
  // Step 3 State
  const [satisfaction, setSatisfaction] = useState(() => Number(localStorage.getItem('ht_satisfaction')) || 3);
  const [durationPerception, setDurationPerception] = useState(() => Number(localStorage.getItem('ht_durationPerception')) || 3);
  const [endMood, setEndMood] = useState(() => Number(localStorage.getItem('ht_endMood')) || 3);
  const [control, setControl] = useState(() => Number(localStorage.getItem('ht_control')) || 3);
  const [diary, setDiary] = useState(() => localStorage.getItem('ht_diary') || '');

  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Persist state to localstorage
  useEffect(() => {
    localStorage.setItem('ht_step', step.toString());
    localStorage.setItem('ht_game_name', gameName);
    localStorage.setItem('ht_planned_time', plannedTime.toString());
    localStorage.setItem('ht_baseline_mood', baselineMood.toString());
    localStorage.setItem('ht_satisfaction', satisfaction.toString());
    localStorage.setItem('ht_durationPerception', durationPerception.toString());
    localStorage.setItem('ht_endMood', endMood.toString());
    localStorage.setItem('ht_control', control.toString());
    localStorage.setItem('ht_diary', diary);
    localStorage.setItem('ht_is_paused', isPaused.toString());
    localStorage.setItem('ht_actual_time', actualTime.toString());
  }, [step, gameName, plannedTime, baselineMood, satisfaction, durationPerception, endMood, control, diary, isPaused, actualTime]);

  // Catch up unmounted time
  useEffect(() => {
    if (step === 2 && !isPaused) {
      const now = Date.now();
      const savedLastTick = Number(localStorage.getItem('ht_last_tick')) || now;
      const missedSeconds = Math.floor((now - savedLastTick) / 1000);
      if (missedSeconds > 0) {
        setActualTime(prev => prev + missedSeconds);
      }
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && !isPaused) {
      interval = setInterval(() => {
        setActualTime(prev => prev + 1);
        const now = Date.now();
        setLastTick(now);
        localStorage.setItem('ht_last_tick', now.toString());
      }, 1000);
    } else if (isPaused) {
      // make sure lastTick is updated if paused so we don't catch up wrongly when unpaused
      localStorage.setItem('ht_last_tick', Date.now().toString());
    }
    return () => clearInterval(interval);
  }, [step, isPaused]);

  const handleStart = () => {
    if (!gameName.trim() || !plannedTime) {
      setErrorMsg('Please enter a game name and planned time to start.');
      return;
    }
    setErrorMsg('');
    setStep(2);
    setLastTick(Date.now());
    localStorage.setItem('ht_last_tick', Date.now().toString());
  };

  const handleEndSession = () => {
    if (actualTime < 60) {
      setErrorMsg('Session too short to log. Minimum 1 minute required.');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const generateAnalyzerTip = (): string => {
    const ptMins = Number(plannedTime) || 0;
    const plannedSeconds = ptMins * 60;
    
    // 1. Compulsive Logic: Compare actual_seconds vs planned_mins. 
    // If time exceeds 150% and control_score < 3, trigger the "Compulsive Pattern" warning.
    if (plannedSeconds > 0 && actualTime > plannedSeconds * 1.5 && control < 3) {
      return "Compulsive Pattern: You played 50% longer than planned with low control. Consider a hard external alarm next time.";
    }

    // 2. Sentiment Logic: Scan the diary_entry for stress-related keywords 
    // ("burnout", "frustrated", "toxic") and trigger the "Emotional Trigger" warning.
    const stressWords = ['burnout', 'frustrated', 'toxic', 'stress', 'angry', 'mad', 'tilt', 'exhausted', 'hate'];
    const lowerDiary = diary.toLowerCase();
    
    if (diary.trim().length > 0 && stressWords.some(w => lowerDiary.includes(w))) {
      return "Emotional Trigger: Stressful patterns detected in your notes. We highly recommend a 15-minute cool-down break.";
    }

    // 3. Sweet Spot Logic: High satisfaction + High control + On-time session = "Sweet Spot" reinforcement.
    const isOnTime = Math.abs(actualTime - plannedSeconds) <= 1800; // Within 30 minutes
    if (satisfaction >= 4 && control >= 4 && isOnTime) {
      return "Sweet Spot: High satisfaction, high control, and strictly on time. Perfect habit execution!";
    }

    // 4. Default fallbacks
    if (diary.trim().length === 0) {
      return "Session Logged: Try adding a short diary entry next time to receive better emotional insights!";
    }

    return "Session Logged: Solid play. Keep tracking to help GameMind uncover your personal gaming trends.";
  };

  const clearSessionStorage = () => {
    localStorage.removeItem('ht_step');
    localStorage.removeItem('ht_game_name');
    localStorage.removeItem('ht_planned_time');
    localStorage.removeItem('ht_baseline_mood');
    localStorage.removeItem('ht_actual_time');
    localStorage.removeItem('ht_is_paused');
    localStorage.removeItem('ht_last_tick');
    localStorage.removeItem('ht_satisfaction');
    localStorage.removeItem('ht_durationPerception');
    localStorage.removeItem('ht_endMood');
    localStorage.removeItem('ht_control');
    localStorage.removeItem('ht_diary');
  };

  const handleCloseOrMinimize = () => {
    // If canceled in step 1, clear it so next time it's clean.
    if (step === 1) {
      clearSessionStorage();
    }
    onClose();
  };

  const handleSave = () => {
    setIsProcessing(true);
    
    // Simulate 1.5-second processing state to increase perceived value
    setTimeout(() => {
      const generateUUID = () => {
        if (crypto && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const newSession = {
        id: generateUUID(),
        user_id: '', // Will be set by App
        game_name: gameName,
        planned_mins: Number(plannedTime),
        actual_seconds: actualTime,
        baseline_mood: baselineMood,
        satisfaction: satisfaction,
        duration_perception: durationPerception,
        end_mood: endMood,
        control_score: control,
        diary_entry: diary,
        analyzer_tip: generateAnalyzerTip(),
        created_at: new Date().toISOString()
      } as Session;
      
      clearSessionStorage();
      setIsProcessing(false);
      onSave(newSession);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950/80 backdrop-blur-md flex flex-col p-6 animate-in slide-in-from-bottom-8 duration-300">
      <header className="flex justify-between items-center py-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-primary-300 to-primary-400 bg-clip-text text-transparent uppercase tracking-wide">
          {step === 1 ? 'New Session' : step === 2 ? 'Active Session' : 'Reflection'}
        </h2>
        
        <button onClick={handleCloseOrMinimize} className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors flex items-center gap-2">
          {step === 2 || step === 3 ? (
             <>
               <span className="text-xs font-semibold pr-1">Minimize</span>
               <ChevronDown size={20} />
             </>
          ) : (
             <X size={20} />
          )}
        </button>
      </header>

      <div className={`flex-1 flex flex-col ${step === 3 ? 'justify-start mt-2' : 'justify-center'} max-w-sm w-full mx-auto pb-32`}>
        
        {/* STEP 1: PRE-GAME */}
        {step === 1 && (
          <div className="space-y-8 mt-4">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-300 block mb-1">What are you playing?</span>
                <input 
                  type="text" 
                  value={gameName}
                  onChange={e => setGameName(e.target.value)}
                  placeholder="e.g. Cyberpunk 2077"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300 block mb-1">Planned Time (Minutes)</span>
                <input 
                  type="number" 
                  value={plannedTime}
                  onChange={e => setPlannedTime(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="60"
                  min="1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                />
              </label>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-sm font-medium text-slate-400 block text-center">How do you feel right now?</span>
              <div className="flex justify-between items-center gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => setBaselineMood(num)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
                      baselineMood === num 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-110' 
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-500 px-2">
                <span>Stressed</span>
                <span>Great</span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-rose-400 text-sm font-medium text-center animate-in fade-in">{errorMsg}</p>
            )}

            <button 
              onClick={handleStart}
              className="w-full mt-4 bg-gradient-to-r from-primary-grad-from to-primary-grad-to hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-xl shadow-primary-900/20 flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Play size={20} className="fill-white" />
              Start Timer
            </button>
          </div>
        )}

        {/* STEP 2: ACTIVE GAME */}
        {step === 2 && (
          <div className="flex flex-col items-center justify-center space-y-12 h-full text-center py-10">
            <div className="space-y-4 w-full">
              <div className="inline-block px-4 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 font-medium tracking-wide text-sm">
                Playing {gameName}
              </div>
              <div 
                className="text-6xl font-mono font-bold tracking-tighter text-white"
                style={{ filter: `drop-shadow(0 0 15px var(--color-primary-500))` }}
              >
                {formatTime(actualTime)}
              </div>
              <div className="text-slate-400 font-medium">
                Goal: <span className="text-slate-200">{plannedTime} min</span>
              </div>
              {actualTime / 60 > (plannedTime as number) && (
                <div className="text-rose-400 font-medium animate-pulse text-sm">
                  Overtime!
                </div>
              )}
            </div>

            {/* Interactive massive interaction area (tap to pause/resume) */}
            <div className="flex-1 w-full flex items-center justify-center">
               <button 
                 onClick={() => setIsPaused(!isPaused)}
                 className="w-48 h-48 rounded-full border border-slate-800 flex items-center justify-center relative cursor-pointer hover:border-primary-500/50 transition-colors group"
               >
                 {!isPaused && <div className="absolute inset-0 rounded-full border border-primary-500/20 animate-ping opacity-20"></div>}
                 <div className={`w-32 h-32 rounded-full border flex items-center justify-center transition-all ${isPaused ? 'border-amber-500/50 bg-amber-500/10' : 'border-slate-700 bg-slate-900 group-hover:bg-slate-800'}`}>
                   {isPaused ? (
                     <Play className="text-amber-400 ml-2" size={40} fill="currentColor" />
                   ) : (
                     <div className="flex gap-2">
                       <div className="w-3 h-10 bg-primary-400 rounded-full"></div>
                       <div className="w-3 h-10 bg-primary-400 rounded-full"></div>
                     </div>
                   )}
                 </div>
               </button>
            </div>

            {errorMsg && (
              <p className="text-rose-400 text-sm font-medium text-center animate-in fade-in">{errorMsg}</p>
            )}

            <button 
              onClick={handleEndSession}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-5 rounded-xl shadow-lg shadow-rose-900/20 flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Square size={20} className="fill-white" />
              End Session
            </button>
          </div>
        )}

        {/* STEP 3: POST-GAME REFLECTION */}
        {step === 3 && (
          <div className="space-y-6 mt-4 w-full animate-in fade-in duration-500 pb-10">
            
            <div className="text-center py-4 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-slate-400 text-sm">Total Time</span>
              <div className="text-3xl font-mono font-bold text-white tracking-tight mt-1">
                {formatTime(actualTime)}
              </div>
            </div>

            <div className="space-y-5">
              <ScaleQuestion 
                label="Satisfaction?" 
                leftText="Not at all" rightText="Very"
                value={satisfaction} onChange={setSatisfaction} 
              />
              <ScaleQuestion 
                label="Duration Perception?" 
                leftText="Too short" rightText="Too long"
                value={durationPerception} onChange={setDurationPerception} 
                centerIsIdeal={true}
              />
              <ScaleQuestion 
                label="End Mood?" 
                leftText="Drained" rightText="Energized"
                value={endMood} onChange={setEndMood} 
              />
              <ScaleQuestion 
                label="Felt in Control?" 
                leftText="Lost track" rightText="Full control"
                value={control} onChange={setControl} 
              />
            </div>

            <label className="block mt-6">
              <span className="text-sm font-medium text-slate-300 block mb-2">Diary (FRQ): How did this session influence your mood?</span>
              <textarea 
                value={diary}
                onChange={e => setDiary(e.target.value)}
                placeholder="Write your thoughts..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none"
              />
            </label>

            <button 
              onClick={handleSave}
              disabled={isProcessing}
              className={`w-full mt-4 flex justify-center items-center gap-2 transition-all font-bold py-4 rounded-xl shadow-xl ${
                isProcessing 
                  ? 'bg-primary-900 border border-primary-500/30 text-primary-300 cursor-default' 
                  : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:opacity-90 text-white active:scale-[0.98] shadow-primary-900/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing Data...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Save & Analyze
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// Sub-component for questions
function ScaleQuestion({ label, value, onChange, leftText, rightText, centerIsIdeal = false }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <span className="text-sm font-medium text-slate-300">{label}</span>
      </div>
      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5].map(num => {
          const isSelected = value === num;
          
          let activeClass = 'bg-primary-600 text-white';

          return (
            <button
              key={num}
              onClick={() => onChange(num)}
              className={`flex-1 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                isSelected 
                  ? `${activeClass} shadow-md scale-105` 
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {num}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 font-medium px-1">
        <span>{leftText}</span>
        <span>{rightText}</span>
      </div>
    </div>
  );
}
