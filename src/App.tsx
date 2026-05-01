import React, { useState, useEffect } from 'react';
import { Home, List, Settings as SettingsIcon, LogOut, CheckCircle2 } from 'lucide-react';
import { Session, Profile } from './types';
import Dashboard from './components/Dashboard';
import Logs from './components/Logs';
import Settings from './components/Settings';
import TrackingModal from './components/TrackingModal';
import AuthScreen from './components/AuthScreen';
import Onboarding from './components/Onboarding';
import WhatsNewModal from './components/WhatsNewModal';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('habit_tracker_theme') || 'default');
  const [toastMsg, setToastMsg] = useState('');
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  useEffect(() => {
    localStorage.setItem('habit_tracker_theme', theme);
  }, [theme]);

  // Auth & Profile Initialization
  useEffect(() => {
    let initTimeout = setTimeout(() => {
      setIsInitializing(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsInitializing(true);
        setSessionUser(session.user);
        fetchProfile(session.user.id);
      } else {
        if (localStorage.getItem('ht_is_guest') !== 'true') {
          setSessionUser(null);
        } else {
          setSessionUser({
            id: 'guest_user_12345',
            email: 'guest@gamemind.app',
          } as any);
          setProfile({
            id: 'guest_user_12345',
            username: 'Guest Player',
            platforms: ['PC'],
            genres: ['RPG'],
            app_goal: 'Testing GameMind out',
            created_at: new Date().toISOString()
          } as any);
        }
        setIsInitializing(false);
        clearTimeout(initTimeout);
      }
    }).catch(err => {
      console.error('Session error:', err);
      setIsInitializing(false);
      clearTimeout(initTimeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setIsInitializing(true);
        setSessionUser(session.user);
        fetchProfile(session.user.id);
        
        // Edge Function Logic Framework: Track Last Login
        // We'll prepare a backend trigger to check if users haven't logged in for 7 days
        // Here we just update a local timestamp so it could be synced if the user wants.
        try {
          await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', session.user.id);
        } catch (e) {} // ignore if column doesn't exist yet
        
      } else {
        if (localStorage.getItem('ht_is_guest') !== 'true') {
          setSessionUser(null);
          setProfile(null);
          setSessions([]);
        } else {
          setSessionUser({
            id: 'guest_user_12345',
            email: 'guest@gamemind.app',
          } as any);
          setProfile({
            id: 'guest_user_12345',
            username: 'Guest Player',
            platforms: ['PC'],
            genres: ['RPG'],
            app_goal: 'Testing GameMind out',
            created_at: new Date().toISOString()
          } as any);
        }
        setIsInitializing(false);
      }
    });

    return () => {
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setIsInitializing(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
        
        // Verify What's New
        if (localStorage.getItem('ht_whats_new_v2') !== 'seen') {
          setTimeout(() => setShowWhatsNew(true), 1500);
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitializing(false);
    }
  };

  // Sessions fetching & REAL-TIME
  useEffect(() => {
    if (sessionUser && profile) {
      fetchSessions(sessionUser.id);
      
      const channel = supabase.channel('realtime sessions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sessions', filter: `user_id=eq.${sessionUser.id}` },
          (payload) => {
            fetchSessions(sessionUser.id);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [sessionUser, profile]);


  const fetchSessions = async (userId: string) => {
    try {
      setIsLoading(true);
      // Skip fetching if this is a local mock guest user
      if (userId === 'guest_user_12345') {
        setSessions([]);
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      if (data) {
        setSessions(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSession = async (session: Session) => {
    if (!sessionUser) return;
    
    // Optimistic UI update
    const newSessionWithUserId = { ...session, user_id: sessionUser.id };
    setSessions(prev => [newSessionWithUserId, ...prev]);
    setIsTracking(false);
    
    setToastMsg('Session Tracking Saved!');
    setTimeout(() => setToastMsg(''), 3000);

    // Don't save to DB for guest user
    if (sessionUser.id === 'guest_user_12345') return;

    try {
      const { error } = await supabase
        .from('sessions')
        .insert([newSessionWithUserId]);

      if (error) {
        console.error('Error saving session to Supabase:', error);
        setToastMsg('Cloud sync failed.');
      } else {
        console.log('Session successfully saved to Supabase');
      }
    } catch (err) {
      console.error('Unexpected error saving session:', err);
    }
  };

  const handleClearData = async () => {
    if (!sessionUser) return;
    try {
      if (sessionUser.id === 'guest_user_12345') {
        setSessions([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', sessionUser.id)
        .select('*');
        
      if (error) {
        console.error('Error clearing cloud data:', error);
        alert('Failed to clear cloud data.');
      } else if (data && data.length === 0) {
        if (sessions.length > 0) {
          alert('Could not delete data in the cloud. This is usually because your Supabase Row Level Security (RLS) policies are missing a "DELETE" rule for this table. Please check your Supabase dashboard.');
        } else {
          setSessions([]);
        }
      } else {
        setSessions([]);
      }
    } catch (err) {
       console.error('Unexpected error clearing sessions:', err);
    }
  };

  const clearLocalAuthAndTracking = () => {
    // Clear tracking session and defaults
    const keysToRemove = [
      'ht_step', 'ht_game_name', 'ht_planned_time', 'ht_baseline_mood',
      'ht_actual_time', 'ht_is_paused', 'ht_last_tick', 'ht_satisfaction',
      'ht_durationPerception', 'ht_endMood', 'ht_control', 'ht_diary',
      'habit_tracker_default_game', 'habit_tracker_default_time',
      'habit_tracker_username', 'ht_is_guest'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  };

  const handleSignOut = async () => {
    clearLocalAuthAndTracking();
    if (sessionUser?.id === 'guest_user_12345') {
      setSessionUser(null);
      setProfile(null);
      setSessions([]);
    } else {
      await supabase.auth.signOut();
    }
  };

  const handleGuestLogin = async () => {
    clearLocalAuthAndTracking();
    localStorage.setItem('ht_is_guest', 'true');
    console.log('Using local guest mode');
    const mockGuestUser = {
      id: 'guest_user_12345',
      email: 'guest@gamemind.app',
    };
    setSessionUser(mockGuestUser);
    
    const mockProfile = {
      id: 'guest_user_12345',
      username: 'Guest Player',
      platforms: ['PC'],
      genres: ['RPG'],
      app_goal: 'Testing GameMind out',
      created_at: new Date().toISOString()
    };
    setProfile(mockProfile);
    
    if (localStorage.getItem('ht_whats_new_v2') !== 'seen') {
      setTimeout(() => setShowWhatsNew(true), 1500);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-12 h-12 bg-primary-500 rounded-full mb-4 animate-bounce"></div>
           <p className="text-slate-400 font-medium">Loading GameMind...</p>
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return <AuthScreen onGuestLogin={handleGuestLogin} />;
  }

  if (!profile) {
    return <Onboarding userId={sessionUser.id} onComplete={() => fetchProfile(sessionUser.id)} />;
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-sans selection:bg-primary-500/30 ${theme !== 'default' ? `theme-${theme}` : ''}`}>
      <div className="max-w-md mx-auto h-screen relative flex flex-col shadow-2xl bg-slate-950 sm:border-x sm:border-slate-800">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-24 relative">
          <div className="absolute top-4 right-6 z-10 flex gap-2">
            <button onClick={handleSignOut} className="p-2 text-slate-500 hover:text-rose-400 transition-colors bg-slate-900 rounded-full border border-slate-800" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
          
          <AnimatePresence>
            {toastMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-md px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10 text-emerald-100 font-medium whitespace-nowrap text-sm"
              >
                <CheckCircle2 size={16} className="text-emerald-400" />
                {toastMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'dashboard' && <Dashboard sessions={sessions} onStartSession={() => setIsTracking(true)} />}
           {activeTab === 'logs' && <Logs sessions={sessions} />}
           {activeTab === 'settings' && (
             <Settings 
                profile={profile}
                sessions={sessions}
                onClearData={handleClearData} 
                currentTheme={theme} 
                onThemeChange={setTheme} 
             />
           )}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 p-4 pb-safe flex justify-around">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1.5 p-2 transition-colors ${activeTab === 'dashboard' ? 'text-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Home size={24} className={activeTab === 'dashboard' ? 'fill-primary-400/20' : ''} />
            <span className="text-[10px] font-semibold">Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center gap-1.5 p-2 transition-colors ${activeTab === 'logs' ? 'text-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List size={24} className={activeTab === 'logs' ? 'fill-primary-400/20' : ''} />
            <span className="text-[10px] font-semibold">Logs</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1.5 p-2 transition-colors ${activeTab === 'settings' ? 'text-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <SettingsIcon size={24} className={activeTab === 'settings' ? 'fill-primary-400/20' : ''} />
            <span className="text-[10px] font-semibold">Settings</span>
          </button>
        </nav>

        {/* Full Screen Modals */}
        {isTracking && (
          <div className="absolute inset-0 z-50 bg-slate-950">
            <TrackingModal 
              onClose={() => setIsTracking(false)} 
              onSave={handleSaveSession}
            />
          </div>
        )}

        {showWhatsNew && (
          <WhatsNewModal onClose={() => {
            setShowWhatsNew(false);
            localStorage.setItem('ht_whats_new_v2', 'seen');
          }} />
        )}
      </div>
    </div>
  );
}
