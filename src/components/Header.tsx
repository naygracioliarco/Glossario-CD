import React from 'react';
import { BookOpen, Sparkles, Plus, Settings, GraduationCap } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenNewTerm: () => void;
  onOpenManage: () => void;
  totalTerms: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenNewTerm,
  onOpenManage,
  totalTerms,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              G
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap leading-none">
                Glossário Corporativo
              </span>
              <span className="text-xs text-slate-500 mt-1 tabular-nums">
                {totalTerms} siglas catalogadas
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onViewChange('grid')}
              className={`flex items-center gap-2 pb-1 border-b-2 transition-colors whitespace-nowrap ${
                currentView === 'grid' || currentView === 'table'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Explorar Siglas</span>
            </button>

            <button
              onClick={() => onViewChange('quiz')}
              className={`flex items-center gap-2 pb-1 border-b-2 transition-colors whitespace-nowrap ${
                currentView === 'quiz'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Modo Onboarding</span>
            </button>

            <button
              onClick={onOpenManage}
              className="flex items-center gap-2 pb-1 border-b-2 border-transparent text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              <Settings className="w-4 h-4" />
              <span>Personalizar & Exportar</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenManage}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Gerenciar Dados"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenNewTerm}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Sigla</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="flex md:hidden border-t border-slate-100 py-2 gap-2 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => onViewChange('grid')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
              currentView === 'grid' || currentView === 'table'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600'
            }`}
          >
            Explorar Siglas
          </button>
          <button
            onClick={() => onViewChange('quiz')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
              currentView === 'quiz'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600'
            }`}
          >
            Modo Onboarding
          </button>
        </div>
      </div>
    </header>
  );
};
