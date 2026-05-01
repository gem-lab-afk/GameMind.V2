import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Heart, Trophy, User, Ghost } from 'lucide-react';

interface WhatsNewModalProps {
  onClose: () => void;
}

export default function WhatsNewModal({ onClose }: WhatsNewModalProps) {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-primary-500/30 p-6 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-indigo-500"></div>
        
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-full">
          <X size={16} />
        </button>

        <div className="mb-6 flex flex-col items-center text-center mt-2">
          <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center mb-3 text-primary-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-primary-500/20">
            <Sparkles size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">What's New in V2!</h2>
          <p className="text-sm text-slate-400">We've loaded up some fresh upgrades.</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex gap-4 items-start">
             <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400 shrink-0 mt-1">
               <Trophy size={18} />
             </div>
             <div>
               <h3 className="text-slate-200 font-bold text-md">Advanced Analyzer</h3>
               <p className="text-slate-400 text-sm leading-relaxed mt-1">The analyzer now deeply weighs your mood and control scores to provide pinpoint gaming insights.</p>
             </div>
          </div>

          <div className="flex gap-4 items-start">
             <div className="bg-pink-500/20 p-2 rounded-lg text-pink-400 shrink-0 mt-1">
               <User size={18} />
             </div>
             <div>
               <h3 className="text-slate-200 font-bold text-md">Enhanced Profiles</h3>
               <p className="text-slate-400 text-sm leading-relaxed mt-1">Upload a custom avatar and select multiple platforms and genres to truly make your profile your own.</p>
             </div>
          </div>

          <div className="flex gap-4 items-start">
             <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 shrink-0 mt-1">
               <Ghost size={18} />
             </div>
             <div>
               <h3 className="text-slate-200 font-bold text-md">Guest Mode</h3>
               <p className="text-slate-400 text-sm leading-relaxed mt-1">Want to show an alt account or friend? Try out the app instantly without an email using Guest Mode.</p>
             </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-900/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <Check size={18} />
          Awesome, Let's Go
        </button>
      </div>
    </div>
  );
}
