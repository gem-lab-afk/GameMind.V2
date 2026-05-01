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
  const [platform, setPlatform] = useState('');
  const [genre, setGenre] = useState('');
  const [goal, setGoal] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error("Session missing or invalid:", sessionError);
        alert("Session expired or invalid. Please sign in again.");
        onComplete(); // App Component will handle redirection since sessionUser will be null
        return;
      }

      console.log("Saving profile for user:", sessionData.session.user.id);

      const { data, error, status } = await supabase.from('profiles').upsert([
        {
          id: sessionData.session.user.id,
          username,
          platform,
          primary_genre: genre,
          app_goal: goal
        }
      ], { onConflict: 'id' });
      
      if (error) {
        console.error("Full Supabase Error Object:", JSON.stringify(error, null, 2));
        alert(`Could not save profile. Error: ${error.message}\nDetails: ${error.details || 'N/A'}\nHint: ${error.hint || 'N/A'}\nCode: ${error.code}`);
      } else if (status === 201 || status === 204) {
        onComplete();
      } else {
         console.log("Unexpected status:", status);
         onComplete();
      }
    } catch (err: any) {
      console.error("Unexpected error in handleSave:", err);
      alert(`Unexpected error: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"></div>
      
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        
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
              <h2 className="text-2xl font-bold text-white mb-2">Primary Platform</h2>
              <p className="text-slate-400 text-sm">Where do you play mostly?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile', 'VR'].map(p => (
                <button
                  key={p}
                  onClick={() => { setPlatform(p); setStep(3); }}
                  className="bg-slate-950 border border-slate-800 hover:border-primary-500 text-slate-300 font-medium py-3 rounded-xl transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Primary Genre</h2>
              <p className="text-slate-400 text-sm">What do you enjoy playing?</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['FPS/Shooter', 'RPG', 'MOBA', 'Strategy', 'Sports/Racing', 'Cozy/Casual'].map(g => (
                <button
                  key={g}
                  onClick={() => { setGenre(g); setStep(4); }}
                  className="bg-slate-950 border border-slate-800 hover:border-primary-500 text-slate-300 font-medium py-3 rounded-xl transition-all"
                >
                  {g}
                </button>
              ))}
            </div>
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
