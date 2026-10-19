import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { listsEqual, loadPendingState, loadSharedTerms, persistTerms, reconcilePending, savePendingTerms, takeSharedWithLocalIntent } from './utils/storage';
import { getWriteToken } from './utils/publish';
import { isTeamUnlocked } from './utils/teamAccess';
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
import { TeamPasswordModal } from './components/TeamPasswordModal';

export default function App() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [sharedTerms, setSharedTerms] = useState<GlossaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [isTeamGateOpen, setIsTeamGateOpen] = useState(false);
  const [pendingEditorAction, setPendingEditorAction] = useState<(() => void) | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const sharedTermsRef = useRef<GlossaryTerm[]>([]);
  const termsRef = useRef<GlossaryTerm[]>([]);
  const persistInFlightRef = useRef(false);
  const deletedIdsRef = useRef(new Set<string>());
  const persistChainRef = useRef(Promise.resolve());
  const persistTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    sharedTermsRef.current = sharedTerms;
  }, [sharedTerms]);

  useEffect(() => {
    termsRef.current = terms;
  }, [terms]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const shared = await loadSharedTerms();
      if (cancelled) {
        return;
      }

      const pending = loadPendingState();
      const visible = takeSharedWithLocalIntent(
        shared,
        pending?.terms ?? null,
        pending?.deletedIds ?? [],
      );
      setSharedTerms(shared);
      setTerms(visible);
      sharedTermsRef.current = shared;
      termsRef.current = visible;
      if (pending?.deletedIds.length) {
        pending.deletedIds.forEach((id) => deletedIdsRef.current.add(id));
      }

      if (pending && listsEqual(visible, shared)) {
        savePendingTerms(null);
        deletedIdsRef.current.clear();
      } else if (pending && getWriteToken()) {
        savePendingTerms(visible, [...deletedIdsRef.current]);
      }

      setIsLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isFormOpen || isManageOpen) {
      return;
    }

    const refreshShared = async () => {
      if (persistInFlightRef.current || persistTimerRef.current) {
        return;
      }

      try {
        const shared = await loadSharedTerms();
        const pending = loadPendingState();
        const visible = reconcilePending(
          shared,
          pending?.terms ?? termsRef.current,
          [...deletedIdsRef.current, ...(pending?.deletedIds ?? [])],
          sharedTermsRef.current,
        );
        setSharedTerms(shared);
        sharedTermsRef.current = shared;
        if (!persistInFlightRef.current) {
          setTerms(visible);
          termsRef.current = visible;
        }
        if (pending && listsEqual(visible, shared)) {
          savePendingTerms(null);
        }
      } catch {
        // keep the current list if a refresh fails
      }
    };

    const timer = window.setInterval(() => {
      void refreshShared();
    }, 20000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshShared();
      }
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isFormOpen, isManageOpen]);

  const runAsEditor = (action: () => void) => {
    if (isTeamUnlocked()) {
      action();
      return;
    }
    setPendingEditorAction(() => action);
    setIsTeamGateOpen(true);
  };

  const flushPersist = async () => {
    persistInFlightRef.current = true;
    const snapshot = termsRef.current;
    const deleted = [...deletedIdsRef.current];
    const previousShared = sharedTermsRef.current;
    try {
      const merged = await persistTerms(snapshot, previousShared, deleted);
      sharedTermsRef.current = merged;
      setSharedTerms(merged);

      const localChanged = !listsEqual(snapshot, termsRef.current);
      if (localChanged) {
        const latest = reconcilePending(
          merged,
          termsRef.current,
          [...deletedIdsRef.current],
          previousShared,
        );
        setTerms(latest);
        termsRef.current = latest;
        savePendingTerms(latest, [...deletedIdsRef.current]);
        schedulePersist();
        return;
      }

      deleted.forEach((id) => deletedIdsRef.current.delete(id));
      setTerms(merged);
      termsRef.current = merged;
      savePendingTerms(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível salvar.';
      showToast(message);
    } finally {
      persistInFlightRef.current = false;
    }
  };

  const schedulePersist = () => {
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(() => {
      persistTimerRef.current = null;
      persistChainRef.current = persistChainRef.current.catch(() => undefined).then(flushPersist);
    }, 800);
  };

  const updateTermsAndPersist = (newTerms: GlossaryTerm[], deletedIds: string[] = []) => {
    setTerms(newTerms);
    termsRef.current = newTerms;
    deletedIds.forEach((id) => deletedIdsRef.current.add(id));
    savePendingTerms(newTerms, [...deletedIdsRef.current]);
    schedulePersist();
  };

  // Term actions
  const handleSaveTerm = (savedTerm: GlossaryTerm) => {
    const current = termsRef.current;
    const existingIndex = current.findIndex((t) => t.id === savedTerm.id);
    let updated: GlossaryTerm[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = savedTerm;
      showToast(`Sigla "${savedTerm.term}" atualizada para o time.`);
    } else {
      updated = [savedTerm, ...current];
      showToast(`Nova sigla "${savedTerm.term}" publicada para o time.`);
    }
    updateTermsAndPersist(updated);
    if (selectedTermForDetail && selectedTermForDetail.id === savedTerm.id) {
      setSelectedTermForDetail(savedTerm);
    }
  };

  const handleDeleteTerm = (id: string) => {
    const termToDelete = termsRef.current.find((t) => t.id === id);
    const updated = termsRef.current.filter((t) => t.id !== id);
    if (selectedTermForDetail?.id === id) {
      setSelectedTermForDetail(null);
    }
    updateTermsAndPersist(updated, [id]);
    if (termToDelete) {
      showToast(`Sigla "${termToDelete.term}" removida do glossário compartilhado.`);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const updated = termsRef.current.map((t) => {
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
          runAsEditor(() => {
            setTermToEdit(null);
            setIsFormOpen(true);
          });
        }}
        onOpenManage={() => {
          runAsEditor(() => setIsManageOpen(true));
        }}
        totalTerms={terms.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
            Carregando o glossário compartilhado...
          </div>
        ) : viewMode === 'quiz' ? (
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
                      runAsEditor(() => {
                        setTermToEdit(null);
                        setIsFormOpen(true);
                      });
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
                      runAsEditor(() => {
                        setTermToEdit(t);
                        setIsFormOpen(true);
                      });
                    }}
                    onToggleFavorite={(id) => runAsEditor(() => handleToggleFavorite(id))}
                    onDelete={(id) => runAsEditor(() => handleDeleteTerm(id))}
                  />
                ))}
              </div>
            ) : (
              <TermTable
                terms={filteredTerms}
                onSelect={(t) => setSelectedTermForDetail(t)}
                onEdit={(t) => {
                  runAsEditor(() => {
                    setTermToEdit(t);
                    setIsFormOpen(true);
                  });
                }}
                onToggleFavorite={(id) => runAsEditor(() => handleToggleFavorite(id))}
                onDelete={(id) => runAsEditor(() => handleDeleteTerm(id))}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Glossário compartilhado do time. As siglas publicadas aparecem para todo mundo.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => runAsEditor(() => setIsManageOpen(true))}
              className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              Exportar CSV / Importar da Minha Empresa
            </button>
            <span>·</span>
            <button
              onClick={() => {
                runAsEditor(() => {
                  setTermToEdit(null);
                  setIsFormOpen(true);
                });
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
          runAsEditor(() => {
            setSelectedTermForDetail(null);
            setTermToEdit(term);
            setIsFormOpen(true);
          });
        }}
        onDelete={(id) => runAsEditor(() => handleDeleteTerm(id))}
        onToggleFavorite={(id) => runAsEditor(() => handleToggleFavorite(id))}
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
          const deletedIds = termsRef.current
            .filter((term) => !newTerms.some((item) => item.id === term.id))
            .map((term) => term.id);
          updateTermsAndPersist(newTerms, deletedIds);
        }}
      />

      <TeamPasswordModal
        isOpen={isTeamGateOpen}
        onClose={() => {
          setIsTeamGateOpen(false);
          setPendingEditorAction(null);
        }}
        onUnlocked={() => {
          setIsTeamGateOpen(false);
          const action = pendingEditorAction;
          setPendingEditorAction(null);
          action?.();
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
