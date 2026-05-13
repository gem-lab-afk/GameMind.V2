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
    return () => {
      window.removeEventListener('mousemove', moveCursor);
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
          
          {!acceptedLogos && (
            <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-4 text-center">
              <p className="text-sm text-slate-300 font-medium mb-4">Please accept our Terms & Conditions to sign up or log in.</p>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg active:scale-95 text-sm">
                    View Terms
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in" />
                  <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-md bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    <Dialog.Title className="text-xl font-bold text-white mb-4">Terms & Conditions</Dialog.Title>
                    <Dialog.Description className="text-sm text-slate-300 mb-6 h-48 overflow-y-auto pr-2 custom-scrollbar">
                      By using GameMind, you agree to track your gaming habits responsibly. We store your data securely and use it only to provide analytics that help you reflect on your emotional health. We do not sell your personal data. 
                      <br /><br />
                      You understand that GameMind is an emotional health tool, not a medical device. Always consult a professional for serious mental health concerns.
                    </Dialog.Description>
                    
                    <div className="flex justify-end gap-3">
                      <Dialog.Close asChild>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                          Cancel
                        </button>
                      </Dialog.Close>
                      <Dialog.Close asChild>
                        <button 
                          onClick={() => {
                            setTimeout(() => setAcceptedLogos(true), 300);
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-bold bg-primary-600 hover:bg-primary-500 text-white transition-colors"
                        >
                          I Agree
                        </button>
                      </Dialog.Close>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          )}
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
