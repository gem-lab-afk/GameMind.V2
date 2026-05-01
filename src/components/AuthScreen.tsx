import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
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
      </div>
    </div>
  );
}
