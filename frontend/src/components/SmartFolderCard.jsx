import React from 'react';
import { Folder, Sparkles, Files, ChevronRight, Layers, User, Users, UserCheck, AlertCircle } from 'lucide-react';

const categoryColorMap = {
  Nature: 'from-emerald-500 to-teal-700',
  Animals: 'from-amber-500 to-orange-700',
  Technology: 'from-cyan-500 to-blue-700',
  People: 'from-pink-500 to-rose-700',
  Travel: 'from-sky-500 to-indigo-700',
  Food: 'from-red-500 to-rose-700',
  Architecture: 'from-stone-500 to-neutral-700',
  Vehicles: 'from-purple-500 to-indigo-700',
  Documents: 'from-blue-500 to-slate-700',
  Screenshots: 'from-violet-500 to-purple-800',
  Code: 'from-green-500 to-emerald-800',
  'Individual Photos': 'from-pink-500 to-rose-600',
  'Single Photos': 'from-pink-500 to-rose-600',
  'Two People': 'from-blue-500 to-cyan-600',
  'Two Member Groups': 'from-blue-500 to-cyan-600',
  'Pair Photos': 'from-blue-500 to-cyan-600',
  'Three People': 'from-emerald-500 to-teal-600',
  'Three Member Groups': 'from-emerald-500 to-teal-600',
  'Four People': 'from-amber-500 to-orange-600',
  'Four Member Groups': 'from-amber-500 to-orange-600',
  'Group Photos': 'from-indigo-600 to-purple-800',
  'Needs Review': 'from-rose-600 to-red-800',
  Person: 'from-purple-500 to-indigo-700',
  Other: 'from-purple-600 to-slate-800',
};

export const SmartFolderCard = ({ folder, onClick, isSelected }) => {
  const gradient = categoryColorMap[folder.category] || categoryColorMap[folder.name] || 'from-purple-600 to-indigo-800';
  const fileCount = folder.fileIds?.length ?? folder.fileCount ?? 0;
  
  const IconComponent =
    ['Single Photos', 'Individual Photos'].includes(folder.category) || ['Single Photos', 'Individual Photos'].includes(folder.name)
      ? User
      : ['Two People', 'Two Member Groups', 'Pair Photos'].includes(folder.category) || ['Two People', 'Two Member Groups', 'Pair Photos'].includes(folder.name)
      ? UserCheck
      : ['Three People', 'Three Member Groups', 'Four People', 'Four Member Groups', 'Group Photos'].includes(folder.category) || ['Three People', 'Three Member Groups', 'Four People', 'Four Member Groups', 'Group Photos'].includes(folder.name)
      ? Users
      : folder.category === 'Needs Review' || folder.name === 'Needs Review'
      ? AlertCircle
      : folder.category === 'Person'
      ? UserCheck
      : Folder;

  return (
    <div
      onClick={() => onClick && onClick(folder)}
      className={`group relative p-4 rounded-2xl glass-panel border transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
        isSelected
          ? 'border-purple-500 bg-purple-500/10 shadow-glow-primary'
          : 'border-white/10 hover:border-purple-500/40 hover:bg-white/[0.07]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Folder Icon with category gradient */}
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>

        {/* AI Badge */}
        {folder.isAIGenerated && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-2.5 h-2.5" /> AI
          </span>
        )}
      </div>

      {/* Folder Name & Category */}
      <h3 className="font-semibold text-sm text-white group-hover:text-purple-300 transition-colors truncate mb-1">
        {folder.name}
      </h3>
      <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
        <Layers className="w-3 h-3 text-slate-500" />
        {folder.category || 'General'}
      </p>

      {/* Bottom meta row */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
        <span className="flex items-center gap-1">
          <Files className="w-3 h-3 text-slate-500" />
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};

export default SmartFolderCard;
