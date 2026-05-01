import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Ghost, Loader2 } from 'lucide-react';

interface AuthScreenProps {
  onGuestLogin?: () => void;
}

export default function AuthScreen({ onGuestLogin }: AuthScreenProps) {
  const [guestLoading, setGuestLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleGuest = async () => {
    setGuestLoading(true);
    if (onGuestLogin) {
      setTimeout(() => {
        onGuestLogin();
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <h1 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">GameMind</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Level up your emotional health.</p>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#3b82f6', // primary-500
                  brandAccent: '#2563eb', // primary-600
                  brandButtonText: 'white',
                  defaultButtonBackground: '#1e293b',
                  defaultButtonBackgroundHover: '#334155',
                  inputBackground: '#0f172a',
                  inputBorder: '#1e293b',
                  inputBorderHover: '#3b82f6',
                  inputBorderFocus: '#3b82f6',
                },
                radii: {
                  inputBorderRadius: '12px',
                  buttonBorderRadius: '12px',
                }
              }
            },
            className: {
              container: 'supabase-auth-container',
              button: 'supabase-button font-bold tracking-wide',
              input: 'supabase-input',
            }
          }}
          providers={[]}
          redirectTo={`${window.location.origin}/`}
          view="sign_in"
          theme="dark"
          magicLink={true}
        />

        <div className="mt-6 flex flex-col items-center">
          <div className="w-full relative flex items-center justify-center mb-6">
             <div className="absolute w-full h-[1px] bg-slate-800"></div>
             <span className="relative bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-widest font-semibold">Or</span>
          </div>
          
          <button 
            onClick={() => setShowWarning(true)}
            disabled={guestLoading}
            className="w-full py-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold tracking-wide transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {guestLoading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : <Ghost size={18} className="text-slate-400" />}
            Enter as Guest
          </button>
        </div>

        {showWarning && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-3xl z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <Ghost size={48} className="text-slate-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Guest Mode Limitation</h2>
            <p className="text-sm text-slate-400 mb-6">
              Guest data is stored locally and will be lost if you clear your browser data or use a different device. 
              <br /><br />
              Creating an account ensures your session history and profile are safely saved.
            </p>
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={() => setShowWarning(false)}
                className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold tracking-wide transition-all shadow-lg active:scale-95"
              >
                Sign Up / Log In Instead
              </button>
              <button 
                onClick={handleGuest}
                disabled={guestLoading}
                className="w-full py-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold tracking-wide transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {guestLoading ? <Loader2 size={18} className="animate-spin text-slate-400" /> : null}
                Continue as Guest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
