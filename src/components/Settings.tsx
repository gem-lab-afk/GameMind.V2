import React, { useState, useEffect } from 'react';
import { Trash2, User, Bell, Shield, Check, Palette } from 'lucide-react';
import { Profile, Session } from '../types';

interface SettingsProps {
  onClearData: () => Promise<void>;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  profile?: Profile | null;
  sessions: Session[];
}

export default function Settings({ onClearData, currentTheme, onThemeChange, profile, sessions }: SettingsProps) {
  const [username, setUsername] = useState(() => profile?.username || localStorage.getItem('habit_tracker_username') || 'GamerTag_01');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [hasCleared, setHasCleared] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem('habit_tracker_push') === 'true');
  const [privacyEnabled, setPrivacyEnabled] = useState(() => localStorage.getItem('habit_tracker_privacy') === 'true');
  
  const [defaultGame, setDefaultGame] = useState(() => localStorage.getItem('habit_tracker_default_game') || '');
  const [defaultTime, setDefaultTime] = useState(() => localStorage.getItem('habit_tracker_default_time') || '60');

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

  const handleEditSave = () => {
    if (isEditingUsername) {
      if (tempUsername.trim()) {
        setUsername(tempUsername.trim());
      }
      setIsEditingUsername(false);
    } else {
      setTempUsername(username);
      setIsEditingUsername(true);
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center border border-primary-500/30">
              <User className="text-primary-400" size={24} />
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
                <p className="font-medium text-slate-200">{username}</p>
              )}
              <p className="text-xs text-slate-500 mt-0.5">Free Tier</p>
            </div>
          </div>
          <button 
            onClick={handleEditSave}
            className={`text-xs font-medium flex items-center gap-1 transition-colors ${isEditingUsername ? 'text-teal-400 hover:text-teal-300' : 'text-primary-400 hover:text-primary-300'}`}
          >
            {isEditingUsername ? (
              <>
                <Check size={14} /> Save
              </>
            ) : (
              'Edit'
            )}
          </button>
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
