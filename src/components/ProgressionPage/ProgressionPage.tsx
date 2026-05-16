import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, CheckCircle, Lock, Crown, Star, Medal, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VirtualPet from '../VirtualPet';

import { calculateProgression } from '../../lib/progressionUtils';
import { Session, Profile } from '../../types';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar_url: string;
  level: number;
  current_xp: number;
  average_control_score: number;
  equipped_avatar_frame: string;
  equipped_title: string;
}

import { REWARDS_MAP, RewardDef } from '../../constants';

interface ProgressionPageProps {
  sessionUser: any;
  profile: Profile | null;
  sessions: Session[];
  onProfileUpdate: (updates: Partial<Profile>) => void;
}

export default function ProgressionPage({ sessionUser, profile, sessions, onProfileUpdate }: ProgressionPageProps) {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'path'>('leaderboard');

  // Use the same XP logic as the Dashboard for consistency
  const { totalXp, level: calculatedLevel } = calculateProgression(sessions);
  
  // Use profile level as priority, fall back to calculated for legacy/instability
  const currentLevel = Math.max(profile?.level || 1, calculatedLevel);

  // Parse unlocked rewards
  const unlockedRewards: string[] = profile?.unlocked_rewards || [];

  useEffect(() => {
    fetchLeaderboard();
  }, [profile]);

  const [errorToast, setErrorToast] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    if (!sessionUser?.id || sessionUser.id === 'guest_user_12345') {
      setLeaderboard([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', { req_user_id: sessionUser.id });
      if (error) {
        if (error.code === 'PGRST202') {
          console.warn("RPC get_leaderboard not found, falling back to standard query...");
          // Fallback to fetch top 50
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, level, current_xp, equipped_title, equipped_avatar_frame')
            .order('current_xp', { ascending: false })
            .limit(50);
            
          if (fallbackError) throw fallbackError;
          
          let leaderboardRows = (fallbackData || []).map((row: any, idx: number) => ({
            ...row,
            rank: idx + 1,
            average_control_score: 0
          }));

          // check if current user is in it
          const isUserInTop50 = leaderboardRows.some(r => r.id === sessionUser.id);
          if (!isUserInTop50 && profile) {
            leaderboardRows.push({
              id: profile.id,
              username: profile.username || 'You',
              avatar_url: profile.avatar_url,
              level: profile.level || 1,
              current_xp: profile.current_xp || 0,
              equipped_title: profile.equipped_title,
              equipped_avatar_frame: profile.equipped_avatar_frame,
              average_control_score: 0,
              rank: 999 // placeholder rank
            });
          }
          
          setLeaderboard(leaderboardRows);
          return;
        }
        throw error;
      }
      setLeaderboard(data || []);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setErrorToast(`Leaderboard sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (reward: RewardDef) => {
    if (!sessionUser?.id || sessionUser.id === 'guest_user_12345') return;
    setClaiming(reward.id);
    setErrorToast(null);
    try {
      // Ensure we have a fresh copy of unlocked rewards
      const currentUnlocked = profile?.unlocked_rewards || [];
      if (currentUnlocked.includes(reward.id)) return;

      const newUnlocked = [...currentUnlocked, reward.id];
      const updates: any = { 
        unlocked_rewards: newUnlocked,
        last_updated: new Date().toISOString()
      };
      
      // Auto-equip logic
      if (reward.type === 'frame') updates.equipped_avatar_frame = reward.value;
      if (reward.type === 'title') updates.equipped_title = reward.value;

      // Update parent state (optimistic)
      onProfileUpdate(updates);

      // Identify through auth directly for security
      const { data: authData } = await supabase.auth.getUser();
      const authId = authData.user?.id;
      if (!authId) throw new Error("Not authenticated");

      // Persist to database
      let { error } = await supabase
        .from('profiles')
        .update({
          unlocked_rewards: newUnlocked,
          equipped_avatar_frame: updates.equipped_avatar_frame || undefined,
          equipped_title: updates.equipped_title || undefined
        })
        .eq('id', authId);
        
      if (error && error.code === 'PGRST204') {
        console.warn('Schema cache stale for profile rewards. Retrying without equipped columns...');
        const retryResult = await supabase
          .from('profiles')
          .update({
            unlocked_rewards: newUnlocked
          })
          .eq('id', authId);
          
        error = retryResult.error;
        
        if (error && error.code === 'PGRST204') {
             // Change throw to a toast instead of breaking the whole UI
             setErrorToast("Database missing 'unlocked_rewards' column. Run the SQL fix in Subabase Editor to enable persistence.");
             return;
        }
      }
      
      if (error) {
        console.error(`Failed to claim reward in cloud [Error Code: ${error.code}]:`, error.message, error.details);
        setErrorToast(`Cloud sync failed: [${error.code}] ${error.message}`);
        setTimeout(() => setErrorToast(null), 5000);
      } else {
        console.log('Reward successfully claimed and saved.');
      }
      
    } catch (err: any) {
      console.error('Error claiming reward:', err);
      setErrorToast(err.message || 'Error claiming reward');
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setClaiming(null);
    }
  };

  const goHome = () => {
    navigate('/');
    // Force a small delay then active tab reset if needed
    setTimeout(() => {
       window.dispatchEvent(new CustomEvent('tab-change', { detail: 'dashboard' }));
    }, 10);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden">
      {errorToast && (
        <div className="absolute top-16 md:top-6 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-full px-4 animate-in fade-in slide-in-from-top-10">
          <div className="bg-slate-900/90 backdrop-blur-md border border-rose-500/50 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.15)] p-4 flex items-start justify-between gap-3">
            <p className="text-xs text-rose-200 font-mono tracking-tight">{errorToast}</p>
            <button onClick={() => setErrorToast(null)} className="text-slate-500 hover:text-white p-1 -mt-1 -mr-1">✕</button>
          </div>
        </div>
      )}
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex flex-col border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-40 relative">
        <div className="flex items-center justify-between p-4 pb-2 border-b border-slate-800/50">
          <button 
             onClick={goHome} 
             className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition active:scale-95 shadow-lg border border-white/5 cursor-pointer flex items-center justify-center shrink-0"
             aria-label="Go back to dashboard"
           >
             <ArrowLeft size={24} />
           </button>
           <h1 className="text-sm font-bold text-slate-300 uppercase tracking-widest shrink-0 ml-2">
             Profile Progression
           </h1>
           <div className="flex-1"></div>
        </div>
        {/* Mobile Tab Switcher */}
        <div className="p-4 pt-2">
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'leaderboard' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Leaderboard
            </button>
            <button 
              onClick={() => setActiveTab('path')}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'path' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-400'}`}
            >
              My Path
            </button>
          </div>
        </div>
      </div>
      
      {/* Side-by-side Layout for Desktop, Tabs for Mobile */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Global Back Button (Top Left) - DESKTOP ONLY */}
        <div className="absolute left-4 top-4 z-50 hidden md:block">
          <button 
            onClick={goHome} 
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 transition active:scale-95 shadow-lg border border-white/5 cursor-pointer"
            aria-label="Go back to dashboard"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        {/* Left Panel - Leaderboard */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 md:pt-16 border-r border-slate-800 relative md:w-1/2 ${activeTab === 'leaderboard' ? 'block' : 'hidden md:block'}`}>
          <div className="flex flex-col mb-8 mt-12 md:mt-0">
             <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent uppercase tracking-widest text-center md:text-left">
               Hall of Legends
             </h2>
             <p className="text-[10px] text-slate-500 font-mono tracking-tighter text-center md:text-left mt-1">THE TOP 50 PUBLIC RECORDS</p>
          </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
            <p className="text-slate-500 font-mono text-xs uppercase animate-pulse">Scanning Ranks...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const el = document.getElementById('my-rank');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      // Add a brief highlight effect
                      el.classList.add('ring-4', 'ring-primary-500');
                      setTimeout(() => el.classList.remove('ring-4', 'ring-primary-500'), 2000);
                    } else {
                      alert("You aren't on the leaderboard yet. Ensure 'Show on Public Leaderboard' is enabled in Settings, or log your first session!");
                    }
                  }}
                  className="text-[10px] uppercase tracking-tighter text-primary-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  Find Me
                </button>
                {sessionUser?.id === 'guest_user_12345' && (
                  <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">Guest Profile (Will Reset on Reload)</span>
                )}
              </div>
              <button 
                onClick={fetchLeaderboard}
                className="text-[10px] uppercase tracking-tighter text-slate-500 hover:text-primary-400 transition-colors flex items-center gap-1"
              >
                <div className="w-1 h-1 bg-primary-400 rounded-full animate-ping"></div>
                Live Update
              </button>
            </div>
            {leaderboard.map((user) => (
              <div 
                key={user.id} 
                id={user.id === sessionUser?.id ? 'my-rank' : undefined}
                className={`p-4 rounded-xl flex items-center justify-between backdrop-blur-md border transition-all ${
                  user.id === sessionUser?.id 
                    ? 'bg-primary-900/40 border-primary-500/50 ring-2 ring-primary-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.02]' 
                    : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center font-mono font-bold text-slate-500">
                    {user.rank === 1 ? <Crown className="mx-auto text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" size={20} /> :
                     user.rank === 2 ? <Star className="mx-auto text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" size={20} /> :
                     user.rank === 3 ? <Medal className="mx-auto text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" size={20} /> :
                     `#${user.rank}`}
                  </div>
                  <div className={`relative rounded-full p-0.5 border-2 ${user.equipped_avatar_frame || 'border-transparent'}`}>
                     <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Avatar" className="w-10 h-10 rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <p className="font-bold tracking-wide truncate max-w-[120px]">{user.username || 'Anonymous'}</p>
                       <VirtualPet averageControlScore={Number(user.average_control_score) || 3} size={20} />
                    </div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tight">{user.equipped_title || 'Novice'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-slate-950/50 px-3 py-1.5 rounded-lg border border-white/5 flex flex-col items-end">
                    <span className="text-[9px] text-slate-600 uppercase font-bold leading-none mb-1">Level</span>
                    <span className="font-mono font-bold text-lg text-primary-400 leading-none">{user.level}</span>
                  </div>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-center py-12 px-6 bg-slate-900/40 rounded-3xl border border-white/5">
                <Trophy size={48} className="mx-auto text-slate-800 mb-4" />
                <p className="text-slate-400 font-medium italic">"The throne is currently vacant."</p>
                <p className="text-xs text-slate-500 mt-2">Be the first to enable Privacy &rarr; Show on Leaderboard in Settings!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Timeline Checklist */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-8 md:pt-16 bg-slate-900/30 relative ${activeTab === 'path' ? 'block' : 'hidden md:block'}`}>
         <div className="flex flex-col mb-8 mt-12 md:mt-0 items-center md:items-start">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-100 uppercase tracking-widest">
              My Path
            </h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-tighter mt-1">CLAIM YOUR EXCLUSIVE COSMETICS</p>
         </div>
         
         <div className="relative pl-6 space-y-12 pb-12">
            {/* Vertical timeline line */}
            <div className="absolute left-8 top-4 bottom-0 w-1 bg-slate-800 rounded-full">
               {/* Filled portion of timeline */}
               <div 
                 className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary-400 to-indigo-500 rounded-full transition-all duration-700"
                 style={{ 
                   height: `${(() => {
                     const totalRewards = REWARDS_MAP.length;
                     if (totalRewards === 0) return "0%";
                     
                     // Find the highest reward user has reached
                     let highestReachedIndex = -1;
                     for (let i = 0; i < REWARDS_MAP.length; i++) {
                       if (currentLevel >= REWARDS_MAP[i].level) {
                         highestReachedIndex = i;
                       }
                     }
                     
                     if (highestReachedIndex === -1) return "0%";
                     if (highestReachedIndex === totalRewards - 1) return "100%";
                     
                     // Position is: (index / (total - 1)) + (progress to next / range) * (1 / (total - 1))
                     const baseProgress = (highestReachedIndex / (totalRewards - 1));
                     
                     const currentRewardLvl = REWARDS_MAP[highestReachedIndex].level;
                     const nextRewardLvl = REWARDS_MAP[highestReachedIndex + 1].level;
                     const range = nextRewardLvl - currentRewardLvl;
                     const inBetweenProgress = (currentLevel - currentRewardLvl) / range;
                     
                     const totalProgress = baseProgress + (inBetweenProgress * (1 / (totalRewards - 1)));
                     
                     return `${Math.min(totalProgress * 100, 100)}%`;
                   })()}` 
                 }}
               ></div>
            </div>

            {REWARDS_MAP.map((reward, i) => {
              const isUnlocked = currentLevel >= reward.level;
              const isClaimed = unlockedRewards.includes(reward.id);
              return (
                <div key={reward.id} className="relative flex items-center gap-6 z-10 transition-all duration-500">
                  {/* Timeline Node */}
                  <div className={`w-5 h-5 rounded-full border-4 shadow-lg shrink-0 transition-colors duration-500 ${
                    isClaimed ? 'bg-primary-400 border-primary-900 shadow-primary-500/50' : 
                    isUnlocked ? 'bg-yellow-400 border-yellow-900 shadow-yellow-500/50 animate-pulse' : 
                    'bg-slate-800 border-slate-950'
                  }`} />
                  
                  {/* Reward Card */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex-1 p-4 rounded-xl border backdrop-blur-sm flex justify-between items-center transition-all ${
                      isClaimed ? 'bg-primary-900/20 border-primary-500/30' : 
                      isUnlocked ? 'bg-white/5 border-yellow-500/30 shadow-[0_0_20px_rgba(250,204,21,0.1)]' : 
                      'bg-slate-900/50 border-slate-800 opacity-60'
                    }`}
                  >
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Level {reward.level}</span>
                          {isClaimed && <CheckCircle size={14} className="text-primary-400" />}
                          {!isUnlocked && <Lock size={14} className="text-slate-600" />}
                        </div>
                        <h4 className={`font-bold ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{reward.title}</h4>
                     </div>

                     {isUnlocked && !isClaimed && (
                       <button 
                         onClick={() => handleClaim(reward)}
                         disabled={claiming === reward.id}
                         className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold text-xs uppercase tracking-widest rounded-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                       >
                         {claiming === reward.id ? 'Claiming...' : 'Claim'}
                       </button>
                     )}
                     {!isUnlocked && (
                       <div className="px-3 py-1 bg-slate-800 rounded-md text-xs text-slate-500 font-mono">
                         Locked
                       </div>
                     )}
                     {isClaimed && (
                       <div className="px-3 py-1 bg-primary-900/50 rounded-md text-xs text-primary-300 font-mono border border-primary-500/20">
                         Acquired
                       </div>
                     )}
                  </motion.div>
                </div>
              );
            })}
         </div>
      </div>
      </div>
    </div>
  );
}
