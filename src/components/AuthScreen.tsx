import React, { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { Ghost, Loader2, Check } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';

interface AuthScreenProps {
  onGuestLogin?: () => void;
}

export default function AuthScreen({ onGuestLogin }: AuthScreenProps) {
  const [guestLoading, setGuestLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [acceptedLogos, setAcceptedLogos] = useState(false);

  // Framer Motion Cursor Tracking
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 150 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 150);
      cursorY.set(e.clientY - 150);
    };
    window.addEventListener('mousemove', moveCursor);

    // Observer to intercept and rewrite Supabase generic error messages
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const messageEls = document.querySelectorAll('.supabase-message');
          messageEls.forEach((el: any) => {
            if (el.textContent?.includes('Invalid login credentials')) {
              el.textContent = 'Incorrect email or password. Please try again.';
            }
            if (el.textContent?.includes('Invalid Refresh Token') || el.textContent?.includes('Refresh Token Not Found')) {
              el.style.display = 'none';
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      observer.disconnect();
    };
  }, []);

  const handleGuest = async () => {
    setGuestLoading(true);
    if (onGuestLogin) {
      setTimeout(() => {
        onGuestLogin();
      }, 800);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black flex flex-col items-center justify-center p-6">
      
      {/* Dynamic Cursor Glow */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 w-[300px] h-[300px] rounded-full bg-primary-500/10 blur-[100px] z-0"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
      />
      
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-[0_0_80px_-15px_rgba(0,0,0,0.5)] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <h1 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">GameMind</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Level up your emotional health.</p>
        
        {/* Auth / T&C Logic */}
        <div className="relative">
          {(!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) && (
            <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/50 rounded-xl">
              <p className="text-orange-400 text-sm font-medium text-center shadow-sm">
                Supabase credentials not found. Please add <code className="bg-orange-500/20 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-orange-500/20 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to the Settings &rarr; Secrets panel and restart the server.
              </p>
            </div>
          )}
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
                message: 'supabase-message',
              }
            }}
            providers={[]}
            redirectTo={window.location.origin}
            theme="dark"
          />
        </div>

        <div className="mt-6 flex flex-col items-center relative z-10">
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
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-3xl z-30 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-200">
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
