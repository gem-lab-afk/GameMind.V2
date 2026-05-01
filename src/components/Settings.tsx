import React, { useState, useEffect, useRef } from 'react';
import { Trash2, User, Bell, Shield, Check, Palette, Upload, Gamepad2, Layers } from 'lucide-react';
import { Profile, Session } from '../types';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  onClearData: () => Promise<void>;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  profile?: Profile | null;
  sessions: Session[];
}

export default function Settings({ onClearData, currentTheme, onThemeChange, profile, sessions }: SettingsProps) {
  const [username, setUsername] = useState(() => profile?.username || localStorage.getItem('habit_tracker_username') || 'GamerTag_01');
  const [avatarUrl, setAvatarUrl] = useState(() => profile?.avatar_url || null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  
  const AVAILABLE_PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile', 'VR'];
  const AVAILABLE_GENRES = ['FPS', 'RPG', 'MMO', 'Strategy', 'Action', 'Adventure', 'Sports', 'Racing', 'Simulation', 'Puzzle'];
  
  const [isEditingProfileDetails, setIsEditingProfileDetails] = useState(false);
  const [tempPlatforms, setTempPlatforms] = useState<string[]>([]);
  const [tempGenres, setTempGenres] = useState<string[]>([]);
  
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [hasCleared, setHasCleared] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem('habit_tracker_push') === 'true');
  const [privacyEnabled, setPrivacyEnabled] = useState(() => localStorage.getItem('habit_tracker_privacy') === 'true');
  
  const [defaultGame, setDefaultGame] = useState(() => localStorage.getItem('habit_tracker_default_game') || '');
  const [defaultTime, setDefaultTime] = useState(() => localStorage.getItem('habit_tracker_default_time') || '60');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('habit_tracker_username', username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem('habit_tracker_push', String(pushEnabled));
  }, [pushEnabled]);

  useEffect(() => {
    localStorage.setItem('habit_tracker_privacy', String(privacyEnabled));
  }, [privacyEnabled]);

  useEffect(() => {
    localStorage.setItem('habit_tracker_default_game', defaultGame);
  }, [defaultGame]);

  useEffect(() => {
    localStorage.setItem('habit_tracker_default_time', defaultTime);
  }, [defaultTime]);

  const handleEditSave = async () => {
    if (isEditingUsername) {
      if (tempUsername.trim() && profile && profile.id !== 'guest_user_12345') {
        setUsername(tempUsername.trim());
        await supabase.from('profiles').update({ username: tempUsername.trim() }).eq('id', profile.id);
      } else if (profile?.id === 'guest_user_12345' && tempUsername.trim()) {
        setUsername(tempUsername.trim());
      }
      setIsEditingUsername(false);
    } else {
      setTempUsername(username);
      setIsEditingUsername(true);
    }
  };

  const handleProfileDetailsSave = async () => {
    if (isEditingProfileDetails) {
      if (profile && profile.id !== 'guest_user_12345') {
        // Save using legacy column names, but keep UI using arrays
        await supabase.from('profiles').update({ 
          platform: tempPlatforms.join(', '), 
          primary_genre: tempGenres.join(', ') 
        }).eq('id', profile.id);
        profile.platforms = tempPlatforms;
        profile.genres = tempGenres;
      } else if (profile && profile.id === 'guest_user_12345') {
        profile.platforms = tempPlatforms;
        profile.genres = tempGenres;
      }
      setIsEditingProfileDetails(false);
    } else {
      setTempPlatforms(profile?.platforms || []);
      setTempGenres(profile?.genres || []);
      setIsEditingProfileDetails(true);
    }
  };

  const togglePlatform = (p: string) => setTempPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleGenre = (g: string) => setTempGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!e.target.files || e.target.files.length === 0 || !profile) {
        return;
      }
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      if (data) {
        const url = data.publicUrl;
        setAvatarUrl(url);
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const themes = [
    { id: 'default', name: 'Midnight', bg: 'bg-indigo-600' },
    { id: 'cyberpunk', name: 'Cyberpunk', bg: 'bg-pink-500' },
    { id: 'emerald', name: 'Forest', bg: 'bg-emerald-500' },
    { id: 'crimson', name: 'Crimson', bg: 'bg-red-600' },
    { id: 'ocean', name: 'Ocean', bg: 'bg-blue-500' },
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 relative">
      <header className="pt-8">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
      </header>

      {/* Profile section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Account</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center border border-primary-500/30 overflow-hidden relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="text-primary-400" size={32} />
                )}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                  {uploadingAvatar ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : <Upload className="text-white" size={20} />}
                </div>
                <input type="file" hidden accept="image/*" ref={fileInputRef} onChange={handleAvatarUpload} />
              </div>
              <div>
                {isEditingUsername ? (
                  <input 
                    type="text" 
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 outline-none focus:border-primary-500 w-32"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                  />
                ) : (
                  <p className="font-medium text-slate-200 text-lg">{username}</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">{profile?.app_goal || 'Free Tier'}</p>
              </div>
            </div>
            <button 
              onClick={handleEditSave}
              className={`text-xs font-medium flex items-center gap-1 transition-colors ${isEditingUsername ? 'text-primary-400 hover:text-primary-300' : 'text-primary-400 hover:text-primary-300'}`}
            >
              {isEditingUsername ? <><Check size={14} /> Save</> : 'Edit Name'}
            </button>
          </div>
          
          {profile && (
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-4 relative">
               <div className="absolute right-0 top-4">
                 <button 
                   onClick={handleProfileDetailsSave}
                   className={`text-xs font-medium flex items-center gap-1 transition-colors ${isEditingProfileDetails ? 'text-primary-400 hover:text-primary-300' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   {isEditingProfileDetails ? <><Check size={14} /> Save</> : 'Edit Details'}
                 </button>
               </div>
               
               <div className="flex-1 w-full mt-2">
                 <div className="flex items-center gap-2 mb-2">
                    <Gamepad2 size={14} className="text-slate-500" />
                    <span className="text-xs text-slate-400 uppercase tracking-widest">Platforms</span>
                 </div>
                 <div className="flex flex-wrap gap-1.5">
                   {isEditingProfileDetails ? (
                     AVAILABLE_PLATFORMS.map(p => (
                       <button
                         key={p}
                         onClick={() => togglePlatform(p)}
                         className={`px-2 py-1 rounded-md text-xs uppercase font-bold transition-colors ${tempPlatforms.includes(p) ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'}`}
                       >
                         {p}
                       </button>
                     ))
                   ) : (
                     profile.platforms && profile.platforms.length > 0 ? profile.platforms.map(p => (
                       <span key={p} className="px-2 py-0.5 bg-primary-900/30 text-primary-400 border border-primary-500/20 rounded-md text-[10px] uppercase font-bold">{p}</span>
                     )) : <span className="text-xs text-slate-600">None selected</span>
                   )}
                 </div>
               </div>
               
               <div className="flex-1 w-full">
                 <div className="flex items-center gap-2 mb-2">
                    <Layers size={14} className="text-slate-500" />
                    <span className="text-xs text-slate-400 uppercase tracking-widest">Genres</span>
                 </div>
                 <div className="flex flex-wrap gap-1.5">
                   {isEditingProfileDetails ? (
                     AVAILABLE_GENRES.map(g => (
                       <button
                         key={g}
                         onClick={() => toggleGenre(g)}
                         className={`px-2 py-1 rounded-md text-xs uppercase font-bold transition-colors ${tempGenres.includes(g) ? 'bg-primary-500/20 text-primary-300 border border-primary-500/50' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'}`}
                       >
                         {g}
                       </button>
                     ))
                   ) : (
                     profile.genres && profile.genres.length > 0 ? profile.genres.map(g => (
                       <span key={g} className="px-2 py-0.5 bg-primary-900/30 text-primary-400 border border-primary-500/20 rounded-md text-[10px] uppercase font-bold">{g}</span>
                     )) : <span className="text-xs text-slate-600">None selected</span>
                   )}
                 </div>
               </div>
            </div>
          )}
        </div>
      </section>

      {/* Theme Selection */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Appearance</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="text-slate-400" size={18} />
            <span className="text-sm text-slate-300">App Theme</span>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                className={`w-full aspect-square rounded-full flex items-center justify-center transition-all ${t.bg} ${currentTheme === t.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                title={t.name}
              >
                {currentTheme === t.id && <Check size={16} className="text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Preferences</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/50 mb-6">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-slate-400" size={18} />
              <span className="text-sm text-slate-300">Push Notifications</span>
            </div>
            <button 
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${pushEnabled ? 'bg-primary-600' : 'bg-slate-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm ${pushEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="text-slate-400" size={18} />
              <span className="text-sm text-slate-300">Privacy Mode</span>
            </div>
            <button 
              onClick={() => setPrivacyEnabled(!privacyEnabled)}
              className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${privacyEnabled ? 'bg-primary-600' : 'bg-slate-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm ${privacyEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-6">Tracking Defaults</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Default Game</label>
            <input 
              type="text" 
              value={defaultGame}
              onChange={(e) => setDefaultGame(e.target.value)}
              placeholder="e.g. Valorant, League..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Default Planned Time (mins)</label>
            <input 
              type="number" 
              value={defaultTime}
              onChange={(e) => setDefaultTime(e.target.value)}
              placeholder="60"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-primary-500"
            />
          </div>
        </div>
      </section>

      {/* Data & Storage Section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Data Management</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-200">Export Data</p>
            <p className="text-xs text-slate-500 mt-0.5">Download your session history.</p>
          </div>
          <button 
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "gamemind_sessions.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-slate-700 active:scale-[0.98]"
          >
            Export JSON
          </button>
        </div>
        
        {/* Danger Zone */}
        <div className="bg-slate-900 border border-rose-900/30 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Wipe Data</p>
              <p className="text-xs text-slate-500 mt-0.5">Delete all session history.</p>
            </div>
            {!showWipeConfirm && (
              <button 
                onClick={() => setShowWipeConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-lg text-xs font-semibold transition-colors border border-rose-500/20 active:scale-[0.98]"
              >
                <Trash2 size={14} />
                Clear
              </button>
            )}
          </div>
          
          {showWipeConfirm && (
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
              <p className="text-xs text-rose-200 mb-3 font-medium">
                {hasCleared ? "Data successfully wiped." : "Are you sure? This action cannot be undone."}
              </p>
              <div className="flex justify-end gap-2">
                {!hasCleared && (
                  <button 
                    onClick={() => setShowWipeConfirm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  disabled={isClearing || hasCleared}
                  onClick={async () => {
                    if (hasCleared) {
                      setShowWipeConfirm(false);
                      setHasCleared(false);
                      return;
                    }
                    setIsClearing(true);
                    await onClearData();
                    setIsClearing(false);
                    setHasCleared(true);
                    setTimeout(() => {
                      setShowWipeConfirm(false);
                      setHasCleared(false);
                    }, 2000);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center justify-center min-w-[100px] ${
                    hasCleared 
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20'
                  } ${isClearing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isClearing ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  ) : hasCleared ? (
                    <><Check size={14} className="mr-1" /> Wiped</>
                  ) : (
                    'Yes, wipe data'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
