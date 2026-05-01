import React, { useState, useEffect } from 'react';
import { Home, List, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Session, Profile } from './types';
import Dashboard from './components/Dashboard';
import Logs from './components/Logs';
import Settings from './components/Settings';
import TrackingModal from './components/TrackingModal';
import AuthScreen from './components/AuthScreen';
import Onboarding from './components/Onboarding';
import { supabase } from './lib/supabase';

export default function App() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(() => localStorage.getItem('habit_tracker_is_tracking') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('habit_tracker_theme') || 'default');

  useEffect(() => {
    localStorage.setItem('habit_tracker_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('habit_tracker_is_tracking', isTracking.toString());
  }, [isTracking]);

  // Auth & Profile Initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsInitializing(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setSessions([]);
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
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

    try {
      const { error } = await supabase
        .from('sessions')
        .insert([newSessionWithUserId]);

      if (error) {
        console.error('Error saving session to Supabase:', error);
        alert('Cloud sync failed.');
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
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', sessionUser.id);
        
      if (error) {
        console.error('Error clearing cloud data:', error);
      } else {
        setSessions([]);
      }
    } catch (err) {
       console.error('Unexpected error clearing sessions:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
    return <AuthScreen />;
  }

  if (!profile) {
    return <Onboarding userId={sessionUser.id} onComplete={() => fetchProfile(sessionUser.id)} />;
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-sans selection:bg-primary-500/30 ${theme !== 'default' ? `theme-${theme}` : ''}`}>
      <div className="max-w-md mx-auto h-screen relative flex flex-col shadow-2xl bg-slate-950 sm:border-x sm:border-slate-800">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="absolute top-4 right-6 z-10 flex gap-2">
            <button onClick={handleSignOut} className="p-2 text-slate-500 hover:text-rose-400 transition-colors bg-slate-900 rounded-full border border-slate-800" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
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
      </div>
    </div>
  );
}
