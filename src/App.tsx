import React, { useState, useEffect } from 'react';
import { Home, List, Settings as SettingsIcon, LogOut, CheckCircle2 } from 'lucide-react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Session, Profile } from './types';
import Dashboard from './components/Dashboard';
import Logs from './components/Logs';
import Settings from './components/Settings';
import TrackingModal from './components/TrackingModal';
import AuthScreen from './components/AuthScreen';
import Onboarding from './components/Onboarding';
import WhatsNewModal from './components/WhatsNewModal';
import ProgressionPage from './components/ProgressionPage';
import { supabase } from './lib/supabase';
import { calculateProgression } from './lib/progressionUtils';


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

  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Auth & Profile Initialization
  useEffect(() => {
    let authChecked = false;

    // Safety timeout for initialize state
    const bootTimeout = setTimeout(() => {
      if (isMounted.current && isInitializing) setIsInitializing(false);
    }, 5000);

    // Optimistic Load: check local storage first
    try {
      const cachedProfile = localStorage.getItem('ht_user_profile_cache');
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
      }
    } catch (e) {}

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;
      
      if (session?.user) {
        setSessionUser(session.user);
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || !authChecked) {
          authChecked = true;
          fetchProfile(session.user.id);
        }
        if (event === 'SIGNED_IN') {
          try {
            supabase.from('profiles').update({ last_login: new Date().toISOString() as any }).eq('id', session.user.id);
          } catch (e) {}
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('ht_user_profile_cache');
        localStorage.removeItem('ht_onboarded_v2');
        setSessionUser(null);
        setProfile(null);
        setSessions([]);
        setIsInitializing(false);
      } else {
        // No session
        if (event === 'INITIAL_SESSION') {
          if (localStorage.getItem('ht_is_guest') === 'true') {
            handleGuestLogin();
          } else {
            setIsInitializing(false);
          }
        }
      }
      
      if (event === 'INITIAL_SESSION') {
        clearTimeout(bootTimeout);
      }
    });

    return () => {
      clearTimeout(bootTimeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('tab-change', handleTabChange);
    return () => window.removeEventListener('tab-change', handleTabChange);
  }, []);

  const fetchProfileLock = React.useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    if (!userId) return;
    
    // Prevent double-fetching on initialization
    if (fetchProfileLock.current === userId) return;
    fetchProfileLock.current = userId;
    
    // Safety timeout: 5s is plenty
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current) {
        console.warn('Profile fetch timeout');
        setIsInitializing(false);
        fetchProfileLock.current = null;
      }
    }, 5000);

    try {
      if (userId === 'guest_user_12345') {
        const hasOnboarded = localStorage.getItem('ht_guest_onboarded');
        if (hasOnboarded === 'true') {
          const storedProfile = localStorage.getItem('ht_guest_profile');
          if (storedProfile) setProfile(JSON.parse(storedProfile));
        }
        return;
      }

      // We don't set isInitializing(true) here anymore to prevent kicking user out of UI
      let { data, error } = await supabase.from('profiles').select('*, unlocked_rewards, level').eq('id', userId).maybeSingle(); 
      
      if (error && error.code === 'PGRST204') {
        console.warn('Profile schema stale. Retrying without new columns...');
        const retryResult = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        data = retryResult.data;
        error = retryResult.error;
      }
      
      if (error) throw error;

      if (data) {
        const processedProfile: Profile = {
          ...data,
          level: data.level || 1,
          platforms: data.platforms || (data.platform ? data.platform.split(', ') : []),
          genres: data.genres || (data.primary_genre ? data.primary_genre.split(', ') : []),
          unlocked_rewards: Array.isArray(data.unlocked_rewards) ? data.unlocked_rewards : []
        };
        setProfile(processedProfile);
        localStorage.setItem('ht_user_profile_cache', JSON.stringify(processedProfile));
        localStorage.setItem('ht_onboarded_v2', 'true');
        
        // Sync level/xp if it's a legacy account (no level or mismatched)
        // We do this after sessions are loaded in a separate effect
        
        if (localStorage.getItem('ht_whats_new_v2') !== 'seen') {
          setTimeout(() => setShowWhatsNew(true), 1500);
        }
      } else {
        // ONLY set to null if we don't have a profile cached or in state already
        // This prevents the "flash back to onboarding" during slow DB syncs
        if (!localStorage.getItem('ht_onboarded_v2')) {
          setProfile(null);
        } else {
          console.log('Profile fetch returned null, but user is marked as onboarded. Keeping current profile.');
        }
      }
    } catch (err: any) {
      console.error('Profile fetch error', err);
      if (err?.status === 401) supabase.auth.signOut();
      setProfile(null);
    } finally {
      clearTimeout(safetyTimeout);
      if (isMounted.current) setIsInitializing(false);
      // Let subsequent manual fetches work after a short delay
      setTimeout(() => { fetchProfileLock.current = null; }, 1000);
    }
  };

  // Auto-sync profile level with history for legacy accounts
  useEffect(() => {
    if (profile && sessions.length > 0 && sessionUser?.id !== 'guest_user_12345') {
       const { totalXp, level } = calculateProgression(sessions);
       const needsSync = profile.level !== level || profile.current_xp !== totalXp;
       
       if (needsSync) {
         console.log('Syncing legacy account levels...');
         supabase.from('profiles').update({
           level: level,
           current_xp: totalXp
         }).eq('id', profile.id).then(({ error }) => {
            if (!error) {
              setProfile(prev => prev ? { ...prev, level, current_xp: totalXp } : null);
            }
         });
       }
    }
  }, [profile?.id, sessions.length]);
  // Sessions fetching & REAL-TIME
  useEffect(() => {
    if (sessionUser?.id && profile?.id) {
      fetchSessions(sessionUser.id);
      
      const channelSessions = supabase.channel('realtime sessions')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sessions', filter: `user_id=eq.${String(sessionUser.id)}` },
          (payload) => {
            fetchSessions(sessionUser.id);
          }
        )
        .subscribe();

      const channelProfiles = supabase.channel('realtime profiles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${String(sessionUser.id)}` },
          (payload) => {
            fetchProfileLock.current = null; // Clear lock so it can fetch
            fetchProfile(sessionUser.id);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channelSessions);
        supabase.removeChannel(channelProfiles);
      }
    }
  }, [sessionUser?.id, profile?.id]);


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
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      if (data) {
        setSessions(data);
        
        // Retention & Dormancy Logic
        if (data.length > 0 && userId !== 'guest_user_12345') {
          const lastSessionDate = new Date(data[0].created_at).getTime();
          const now = Date.now();
          const daysSinceLastSession = (now - lastSessionDate) / (1000 * 60 * 60 * 24);
          
          if (daysSinceLastSession > 7) {
            // Simulated Email Trigger
            console.log(`
              [SERVERLESS EDGE FUNCTION LOG]
              Trigger: Dormancy > 7 Days.
              Action: Preparing automated email for user ${userId}.
              Subject: "Your Stats are Cooling Down—Ready for a Session?"
              Body: "We missed you at GameMind! Your XP and Level are waiting. Play your favorite game and log a session today to keep your streak alive."
            `);
          }
        }
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
    
    setToastMsg('Saving Session...');

    // Don't save to DB for guest user
    if (sessionUser.id === 'guest_user_12345') {
      setTimeout(() => setToastMsg('Session Tracking Saved!'), 500);
      setTimeout(() => setToastMsg(''), 3500);
      return;
    }

    try {
      // Pass game_name as well for backwards compatibility with un-migrated databases
      const payload: any = { ...newSessionWithUserId, game_name: newSessionWithUserId.session_name };
      let { error } = await supabase
        .from('sessions')
        .insert([payload]);

      // Fallback for stale schema cache
      if (error && error.code === 'PGRST204') {
        console.warn('Schema cache stale. Retrying without new columns...');
        const { session_name, games_played, ...legacyPayload } = payload;
        const result = await supabase.from('sessions').insert([legacyPayload]);
        error = result.error;
      }

      if (error) {
        console.error('Error saving session to Supabase:', error);
        setToastMsg(`Cloud sync failed: ${error.message || error.code}`);
        setTimeout(() => setToastMsg(''), 5000);
        // Revert optimistic UI
        setSessions(prev => prev.filter(s => s.id !== newSessionWithUserId.id));
      } else {
        console.log('Session successfully saved to Supabase');
        setToastMsg('Session Tracking Saved!');
        setTimeout(() => setToastMsg(''), 3000);
        
        // Update XP & Level in profile
        if (profile) {
          const sessionsWithNew = [newSessionWithUserId, ...sessions];
          const { totalXp, level: newLevel } = calculateProgression(sessionsWithNew);
          
          const { error: profileError } = await supabase.from('profiles').update({
            current_xp: totalXp,
            level: newLevel
          }).eq('id', profile.id);
          
          if (profileError) {
             if (profileError.code === 'PGRST204') {
               console.warn('Profile XP sync skipped: database schema needs update (run migration SQL).');
             } else {
               console.error('Failed to sync new XP/Level to profile', profileError);
             }
          }
          setProfile({ ...profile, current_xp: totalXp, level: newLevel });
        }
      }
    } catch (err: any) {
      console.error('Unexpected error saving session:', err);
      setToastMsg(`Unexpected error: ${err.message}`);
      setTimeout(() => setToastMsg(''), 5000);
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
      'ht_step', 'ht_session_name', 'ht_planned_time', 'ht_baseline_mood',
      'ht_actual_time', 'ht_is_paused', 'ht_last_tick', 'ht_satisfaction',
      'ht_durationPerception', 'ht_endMood', 'ht_control', 'ht_diary',
      'habit_tracker_default_game', 'habit_tracker_default_time',
      'habit_tracker_username', 'ht_is_guest'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  };

  const handleSignOut = async () => {
    clearLocalAuthAndTracking();
    localStorage.removeItem('ht_user_profile_cache');
    localStorage.removeItem('ht_onboarded_v2');
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
    
    setIsInitializing(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="animate-pulse flex flex-col items-center">
           <div className="w-12 h-12 bg-primary-500 rounded-full mb-4 animate-bounce"></div>
           <p className="text-slate-400 font-medium">Loading GameMind...</p>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <button 
            onClick={() => window.location.reload()}
            className="text-xs text-primary-400 hover:text-primary-300 font-medium tracking-widest uppercase border border-primary-500/30 px-6 py-2 rounded-full transition-all"
          >
            Connection taking too long? Retry
          </button>
          
          <button 
            onClick={handleGuestLogin}
            className="text-xs text-slate-500 hover:text-slate-400 font-medium"
          >
            Continue as Guest anyway
          </button>
        </div>
      </div>
    );
  }

  if (!sessionUser) {
    return <AuthScreen onGuestLogin={handleGuestLogin} />;
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-sans selection:bg-primary-500/30 ${theme !== 'default' ? `theme-${theme}` : ''}`}>
      <Routes>
        <Route path="/progression" element={
          <ProgressionPage 
            sessionUser={sessionUser} 
            profile={profile} 
            sessions={sessions}
            onProfileUpdate={(updates) => {
              setProfile(prev => {
                const next = prev ? { ...prev, ...updates } : null;
                if (next) localStorage.setItem('ht_user_profile_cache', JSON.stringify(next));
                return next;
              });
            }}
          />
        } />
        <Route path="*" element={
          <div className="max-w-md mx-auto h-screen relative flex flex-col shadow-2xl bg-slate-950 sm:border-x sm:border-slate-800 overflow-hidden">
            
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-24 relative">
              <div className="absolute top-4 right-6 z-10 flex gap-2">
                <button onClick={handleSignOut} className="p-2 text-slate-500 hover:text-rose-400 transition-colors bg-slate-900 rounded-full border border-slate-800" title="Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
              
              <div className="relative">
                {toastMsg && (
                  <div 
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-md px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10 text-emerald-100 font-medium whitespace-nowrap text-sm animate-in fade-in slide-in-from-top-4 duration-300"
                  >
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    {toastMsg}
                  </div>
                )}
              </div>

              {activeTab === 'dashboard' && <Dashboard sessions={sessions} onStartSession={() => setIsTracking(true)} profile={profile} />}
              {activeTab === 'logs' && <Logs sessions={sessions} />}
              {activeTab === 'settings' && (
                <Settings 
                    profile={profile}
                    sessions={sessions}
                    onClearData={handleClearData} 
                    currentTheme={theme} 
                    onThemeChange={setTheme} 
                    onProfileUpdate={(updates) => {
                      setProfile(prev => {
                        const next = prev ? { ...prev, ...updates } : null;
                        if (next) localStorage.setItem('ht_user_profile_cache', JSON.stringify(next));
                        return next;
                      });
                    }}
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
            {!profile && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm">
                <Onboarding 
                  userId={sessionUser.id} 
                  onComplete={(newProfile) => {
                    if (newProfile) {
                      setProfile(newProfile);
                      localStorage.setItem('ht_user_profile_cache', JSON.stringify(newProfile));
                      if (localStorage.getItem('ht_whats_new_v2') !== 'seen') {
                        setTimeout(() => setShowWhatsNew(true), 1500);
                      }
                    } else {
                      fetchProfile(sessionUser.id);
                    }
                  }} 
                />
              </div>
            )}

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
        } />
      </Routes>
    </div>
  );
}
