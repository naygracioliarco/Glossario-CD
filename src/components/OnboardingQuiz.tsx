import React, { useState, useMemo } from 'react';
import { Sparkles, Eye, CheckCircle2, RotateCcw, HelpCircle, ArrowRight, Building2, Lightbulb, MessageSquareQuote } from 'lucide-react';
import { GlossaryTerm, Department } from '../types';

interface OnboardingQuizProps {
  terms: GlossaryTerm[];
  onBackToGlossary: () => void;
}

export const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({
  terms,
  onBackToGlossary,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('todos');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [knownTermIds, setKnownTermIds] = useState<Set<string>>(new Set());

  // Filter pool
  const pool = useMemo(() => {
    if (selectedDept === 'todos') return terms;
    return terms.filter((t) => t.department === selectedDept);
  }, [terms, selectedDept]);

  const currentTerm: GlossaryTerm | undefined = pool[currentIndex];

  const handleNext = () => {
    setIsRevealed(false);
    if (currentIndex < pool.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleMarkMastered = () => {
    if (currentTerm) {
      setKnownTermIds((prev) => new Set(prev).add(currentTerm.id));
    }
    handleNext();
  };

  const handleResetQuiz = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setKnownTermIds(new Set());
  };

  if (pool.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <p className="text-slate-600 mb-4">Nenhuma sigla disponível para este filtro.</p>
        <button
          onClick={() => setSelectedDept('todos')}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Ver Todas as Siglas
        </button>
      </div>
    );
  }

  const masteredCount = Array.from(knownTermIds).filter(id => pool.some(p => p.id === id)).length;
  const progressPercent = Math.round((masteredCount / pool.length) * 100);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Header of Quiz */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Treino de Onboarding: Desafio das Siglas
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
          Teste seus conhecimentos para não ficar perdido nas reuniões e no Slack da empresa!
        </p>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 mb-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Filtrar por Área:</span>
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setCurrentIndex(0);
              setIsRevealed(false);
            }}
            className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="todos">Todas as Áreas ({terms.length})</option>
            <option value="Tecnologia & Produto">Tecnologia & Produto</option>
            <option value="Negócios & Vendas">Negócios & Vendas</option>
            <option value="Gente & Gestão (RH)">Gente & Gestão (RH)</option>
            <option value="Financeiro & Operações">Financeiro & Operações</option>
            <option value="Educação & Pedagógico">Educação & Pedagógico</option>
            <option value="Marketing">Marketing</option>
            <option value="Geral & Comunicação">Geral & Comunicação</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            Sigla <strong className="text-slate-900 tabular-nums">{currentIndex + 1}</strong> de <span className="tabular-nums">{pool.length}</span>
          </span>
          <span aria-hidden="true" className="text-slate-200">|</span>
          <span className="text-emerald-700 font-semibold tabular-nums">
            {masteredCount} dominadas ({progressPercent}%)
          </span>
          <button
            onClick={handleResetQuiz}
            title="Reiniciar treino"
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Flashcard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm transition-all duration-300 relative overflow-hidden min-h-[380px] flex flex-col justify-between">
        <div>
          {/* Card Meta */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
            <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-600">
              <Building2 className="w-3.5 h-3.5" />
              {currentTerm.department}
            </span>
            {knownTermIds.has(currentTerm.id) && (
              <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Já dominada
              </span>
            )}
          </div>

          {/* Acronym Prominent Display */}
          <div className="text-center py-6">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2 block">
              Você sabe o que significa esta sigla?
            </span>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">
              {currentTerm.term}
            </h1>
            {currentTerm.pronunciation && (
              <p className="text-xs text-slate-400 mt-2 font-mono">
                Pronúncia comum: {currentTerm.pronunciation}
              </p>
            )}
          </div>

          {/* Revealed Content */}
          {isRevealed ? (
            <div className="mt-4 pt-6 border-t border-slate-100 animate-in fade-in duration-200 space-y-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                  Significado Completo
                </span>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {currentTerm.expansion}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Explicação Descomplicada
                </span>
                <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">
                  {currentTerm.definition}
                </p>
              </div>

              {currentTerm.example && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 text-xs text-slate-700 flex items-start gap-2.5">
                  <MessageSquareQuote className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="italic">
                    "{currentTerm.example}"
                  </p>
                </div>
              )}

              {currentTerm.tip && (
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Dica para novatos:</strong> {currentTerm.tip}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <button
                onClick={() => setIsRevealed(true)}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Revelar Significado</span>
              </button>
            </div>
          )}
        </div>

        {/* Card Actions Footer */}
        {isRevealed && (
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleNext}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ainda decorando (Próxima)</span>
            </button>

            <button
              onClick={handleMarkMastered}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acertei! Já dominei essa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onBackToGlossary}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          ← Voltar para a Lista Completa do Glossário
        </button>
      </div>
    </div>
  );
};
