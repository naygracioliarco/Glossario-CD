import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Star, 
  Flame, 
  LayoutGrid, 
  Table as TableIcon, 
  Plus, 
  Sparkles, 
  GraduationCap,
  Building2,
  FileQuestion,
  HelpCircle,
  Check
} from 'lucide-react';
import { GlossaryTerm, Department, ViewMode } from './types';
import { loadTerms, saveTerms } from './utils/storage';
import { DEPARTMENTS } from './data/defaultTerms';
import { Header } from './components/Header';
import { TermCard } from './components/TermCard';
import { TermTable } from './components/TermTable';
import { TermDetailModal } from './components/TermDetailModal';
import { TermFormModal } from './components/TermFormModal';
import { ManageDataModal } from './components/ManageDataModal';
import { OnboardingQuiz } from './components/OnboardingQuiz';
import { AlphabetFilter } from './components/AlphabetFilter';
import { OnboardingGuideBanner } from './components/OnboardingGuideBanner';

export default function App() {
  const [terms, setTerms] = useState<GlossaryTerm[]>(() => loadTerms());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('todos');
  const [selectedLetter, setSelectedLetter] = useState<string>('todos');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyEssential, setOnlyEssential] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modals
  const [selectedTermForDetail, setSelectedTermForDetail] = useState<GlossaryTerm | null>(null);
  const [termToEdit, setTermToEdit] = useState<GlossaryTerm | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to local storage
  const updateTermsAndPersist = (newTerms: GlossaryTerm[]) => {
    setTerms(newTerms);
    saveTerms(newTerms);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Term actions
  const handleSaveTerm = (savedTerm: GlossaryTerm) => {
    const existingIndex = terms.findIndex((t) => t.id === savedTerm.id);
    let updated: GlossaryTerm[];
    if (existingIndex >= 0) {
      updated = [...terms];
      updated[existingIndex] = savedTerm;
      showToast(`Sigla "${savedTerm.term}" atualizada!`);
    } else {
      updated = [savedTerm, ...terms];
      showToast(`Nova sigla "${savedTerm.term}" adicionada com sucesso!`);
    }
    updateTermsAndPersist(updated);
    if (selectedTermForDetail && selectedTermForDetail.id === savedTerm.id) {
      setSelectedTermForDetail(savedTerm);
    }
  };

  const handleDeleteTerm = (id: string) => {
    const termToDelete = terms.find((t) => t.id === id);
    const updated = terms.filter((t) => t.id !== id);
    updateTermsAndPersist(updated);
    if (termToDelete) {
      showToast(`Sigla "${termToDelete.term}" excluída.`);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const updated = terms.map((t) => {
      if (t.id === id) {
        return { ...t, isFavorite: !t.isFavorite };
      }
      return t;
    });
    updateTermsAndPersist(updated);
    if (selectedTermForDetail && selectedTermForDetail.id === id) {
      setSelectedTermForDetail({
        ...selectedTermForDetail,
        isFavorite: !selectedTermForDetail.isFavorite,
      });
    }
  };

  // Letter count mapping
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    terms.forEach((t) => {
      const firstChar = t.term.trim().charAt(0).toUpperCase();
      if (firstChar >= 'A' && firstChar <= 'Z') {
        counts[firstChar] = (counts[firstChar] || 0) + 1;
      }
    });
    return counts;
  }, [terms]);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return terms
      .filter((term) => {
        // Search query
        if (query) {
          const inTerm = term.term.toLowerCase().includes(query);
          const inExp = term.expansion.toLowerCase().includes(query);
          const inDef = term.definition.toLowerCase().includes(query);
          const inTags = term.tags && term.tags.some((tag) => tag.toLowerCase().includes(query));
          const inExample = term.example && term.example.toLowerCase().includes(query);
          if (!inTerm && !inExp && !inDef && !inTags && !inExample) {
            return false;
          }
        }

        // Department filter
        if (selectedDepartment !== 'todos' && term.department !== selectedDepartment) {
          return false;
        }

        // Letter filter
        if (selectedLetter !== 'todos') {
          const firstChar = term.term.trim().charAt(0).toUpperCase();
          if (firstChar !== selectedLetter) {
            return false;
          }
        }

        // Only favorites
        if (onlyFavorites && !term.isFavorite) {
          return false;
        }

        // Only essential
        if (onlyEssential && term.importance !== 'essencial') {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.term.localeCompare(b.term, 'pt-BR', { sensitivity: 'base' }));
  }, [terms, searchQuery, selectedDepartment, selectedLetter, onlyFavorites, onlyEssential]);

  // Clear all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('todos');
    setSelectedLetter('todos');
    setOnlyFavorites(false);
    setOnlyEssential(false);
  };

  const hasActiveFilters = searchQuery || selectedDepartment !== 'todos' || selectedLetter !== 'todos' || onlyFavorites || onlyEssential;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Top Bar */}
      <Header
        currentView={viewMode}
        onViewChange={setViewMode}
        onOpenNewTerm={() => {
          setTermToEdit(null);
          setIsFormOpen(true);
        }}
        onOpenManage={() => setIsManageOpen(true)}
        totalTerms={terms.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'quiz' ? (
          <OnboardingQuiz
            terms={terms}
            onBackToGlossary={() => setViewMode('grid')}
          />
        ) : (
          <>
            {/* Guide banner for new employees */}
            <OnboardingGuideBanner />

            {/* Search, Discovery & Controls Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6 space-y-4">
              {/* Row 1: Search Input + View Mode Switcher */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por sigla, tradução, jargão ou conceito (ex: OKR, SLA, deploy, receita...)"
                    className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View mode toggle (Cards vs Table) */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      title="Visualização em Cards"
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      title="Visualização em Tabela Compacta"
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === 'table'
                          ? 'bg-white text-indigo-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <TableIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Fast filter toggles: Favorites & Essential */}
                  <button
                    onClick={() => setOnlyFavorites(!onlyFavorites)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                      onlyFavorites
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-500' : ''}`} />
                    <span>Favoritos</span>
                  </button>

                  <button
                    onClick={() => setOnlyEssential(!onlyEssential)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                      onlyEssential
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${onlyEssential ? 'text-rose-500 fill-rose-500' : ''}`} />
                    <span>Essenciais</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Department Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pt-2 pb-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] mr-2 shrink-0">
                  Área:
                </span>

                <button
                  onClick={() => setSelectedDepartment('todos')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedDepartment === 'todos'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Todas as Áreas
                </button>

                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.name}
                    onClick={() => setSelectedDepartment(dept.name)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedDepartment === dept.name
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>

              {/* Row 3: A-Z Alphabet Filter */}
              <div className="pt-2 border-t border-slate-100">
                <AlphabetFilter
                  selectedLetter={selectedLetter}
                  onSelectLetter={setSelectedLetter}
                  letterCounts={letterCounts}
                />
              </div>
            </div>

            {/* Results bar */}
            <div className="flex items-center justify-between mb-4 px-1 text-xs text-slate-500">
              <span className="tabular-nums">
                Mostrando <strong>{filteredTerms.length}</strong> de {terms.length} siglas
              </span>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>

            {/* List / Cards presentation */}
            {filteredTerms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-6">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <FileQuestion className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Nenhuma sigla encontrada
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
                  Não encontramos nenhum termo correspondente aos seus filtros atuais. Que tal cadastrar esta sigla agora mesmo?
                </p>
                <div className="flex items-center justify-center gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setTermToEdit(null);
                      setIsFormOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar "{searchQuery || 'Nova Sigla'}"</span>
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTerms.map((term) => (
                  <TermCard
                    key={term.id}
                    term={term}
                    onSelect={(t) => setSelectedTermForDetail(t)}
                    onEdit={(t) => {
                      setTermToEdit(t);
                      setIsFormOpen(true);
                    }}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <TermTable
                terms={filteredTerms}
                onSelect={(t) => setSelectedTermForDetail(t)}
                onEdit={(t) => {
                  setTermToEdit(t);
                  setIsFormOpen(true);
                }}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Glossário Corporativo para Onboarding e Desmistificação de Siglas.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsManageOpen(true)}
              className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              Exportar CSV / Importar da Minha Empresa
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setTermToEdit(null);
                setIsFormOpen(true);
              }}
              className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              + Adicionar Nova Sigla
            </button>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      <TermDetailModal
        term={selectedTermForDetail}
        onClose={() => setSelectedTermForDetail(null)}
        onEdit={(term) => {
          setSelectedTermForDetail(null);
          setTermToEdit(term);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteTerm}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Add / Edit Form Modal */}
      <TermFormModal
        isOpen={isFormOpen}
        termToEdit={termToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setTermToEdit(null);
        }}
        onSave={handleSaveTerm}
      />

      {/* Manage / Customization Modal */}
      <ManageDataModal
        isOpen={isManageOpen}
        terms={terms}
        onClose={() => setIsManageOpen(false)}
        onUpdateTerms={(newTerms) => {
          updateTermsAndPersist(newTerms);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
