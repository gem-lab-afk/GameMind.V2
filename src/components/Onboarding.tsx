import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Play } from 'lucide-react';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

export default function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [goal, setGoal] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    try {
      setLoading(true);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session || !sessionData.session.user.id) {
        console.error("Session missing or invalid:", sessionError);
        setErrorMsg("Session expired or invalid. Please sign in again.");
        setTimeout(() => onComplete(), 2000);
        return;
      }

      const { error } = await supabase.from('profiles').upsert([
        {
          id: sessionData.session.user.id,
          username,
          platform: platforms.join(', '),
          primary_genre: genres.join(', '),
          app_goal: goal
        }
      ], { onConflict: 'id' });
      
      if (error) {
        throw error;
      }
      
      onComplete();
    } catch (error: any) {
      console.error("Supabase Insert Error:", error);
      setErrorMsg("Oops! Couldn't save profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>
      
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
        {errorMsg && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-xl text-sm font-medium text-center">
            {errorMsg}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Choose your Gamertag</h2>
              <p className="text-slate-400 text-sm">How should we call you?</p>
            </div>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. Neo"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-center text-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-bold tracking-tight"
            />
            <button 
              disabled={username.length < 2}
              onClick={() => setStep(2)}
              className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
            >
              Next Step
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Primary Platforms</h2>
              <p className="text-slate-400 text-sm">Where do you play mostly? (Select all that apply)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile', 'VR'].map(p => {
                const isSelected = platforms.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => {
                      if (isSelected) {
                        setPlatforms(platforms.filter(plat => plat !== p));
                      } else {
                        setPlatforms([...platforms, p]);
                      }
                    }}
                    className={`border font-medium py-3 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-primary-900/40 border-primary-500 text-primary-400' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button 
              disabled={platforms.length === 0}
              onClick={() => setStep(3)}
              className="w-full mt-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
            >
              Next Step
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Primary Genres</h2>
              <p className="text-slate-400 text-sm">What do you enjoy playing? (Select all that apply)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['FPS/Shooter', 'RPG', 'MOBA', 'Strategy', 'Sports/Racing', 'Cozy/Casual'].map(g => {
                const isSelected = genres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => {
                      if (isSelected) {
                        setGenres(genres.filter(genre => genre !== g));
                      } else {
                        setGenres([...genres, g]);
                      }
                    }}
                    className={`border font-medium py-3 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-primary-900/40 border-primary-500 text-primary-400' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
            <button 
              disabled={genres.length === 0}
              onClick={() => setStep(4)}
              className="w-full mt-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
            >
              Next Step
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Your App Goal</h2>
              <p className="text-slate-400 text-sm">What do you want to achieve?</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                'Track my emotional health',
                'Reduce screen time',
                'Find my sweet spot',
                'Just logging games'
              ].map(g => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`bg-slate-950 border ${goal === g ? 'border-primary-500 text-primary-400 ring-1 ring-primary-500' : 'border-slate-800 text-slate-300 hover:border-slate-600'} font-medium py-4 px-4 text-left rounded-xl transition-all`}
                >
                  {g}
                </button>
              ))}
            </div>
            
            <button 
              disabled={!goal || loading}
              onClick={handleSave}
              className="w-full mt-4 bg-gradient-to-r from-primary-grad-from to-primary-grad-to hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-xl flex justify-center items-center gap-2 transition-all"
            >
              {loading ? (
                 <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <Play size={20} className="fill-white" />
                  Enter GameMind
                </>
              )}
            </button>
          </div>
        )}

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${step >= s ? 'w-8 bg-primary-500' : 'w-4 bg-slate-800'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}
