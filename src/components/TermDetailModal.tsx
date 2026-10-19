import React, { useState } from 'react';
import { X, Star, Copy, Check, Pencil, Trash2, Volume2, MessageSquareQuote, Lightbulb, Tag, Building2 } from 'lucide-react';
import { GlossaryTerm } from '../types';

interface TermDetailModalProps {
  term: GlossaryTerm | null;
  onClose: () => void;
  onEdit: (term: GlossaryTerm) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const TermDetailModal: React.FC<TermDetailModalProps> = ({
  term,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!term) return null;

  const handleCopy = () => {
    const textToCopy = `*${term.term}* (${term.expansion})\n\n📖 *Significado:* ${term.definition}\n\n💬 *Exemplo:* "${term.example}"${term.tip ? `\n\n💡 *Dica:* ${term.tip}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(term.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {term.term}
              </h2>
              <button
                onClick={() => onToggleFavorite(term.id)}
                className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors"
                title={term.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
              >
                <Star
                  className={`w-5 h-5 ${
                    term.isFavorite ? 'fill-amber-400 text-amber-500' : ''
                  }`}
                />
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {term.expansion}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unboxed Metadata (Zero-pill) */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium py-2 border-y border-slate-100 mb-6">
          <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            {term.department}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Nível: <strong className="font-semibold text-slate-700 capitalize">{term.importance}</strong></span>
          {term.pronunciation && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                Fala-se: <strong className="font-medium text-slate-800">{term.pronunciation}</strong>
              </span>
            </>
          )}
        </div>

        {/* Content sections */}
        <div className="space-y-5">
          {/* Definição */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              O que significa
            </h4>
            <p className="text-base text-slate-800 leading-relaxed font-normal">
              {term.definition}
            </p>
          </div>

          {/* Exemplo no dia a dia */}
          {term.example && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Como usamos nas conversas / reuniões
              </h4>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-sm text-slate-700 flex items-start gap-3">
                <MessageSquareQuote className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="italic leading-relaxed">
                  "{term.example}"
                </p>
              </div>
            </div>
          )}

          {/* Dica para novato */}
          {term.tip && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Dica para quem acabou de chegar
              </h4>
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 text-sm text-amber-900 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {term.tip}
                </p>
              </div>
            </div>
          )}

          {/* Tags */}
          {term.tags && term.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Palavras-chave relacionadas
              </h4>
              <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500 font-mono">
                {term.tags.map((tag, idx) => (
                  <span key={tag}>
                    #{tag}{idx < term.tags.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons at bottom */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(term)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Termo</span>
            </button>

            <button
              onClick={handleDelete}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                confirmDelete
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmDelete ? 'Confirmar Exclusão?' : 'Excluir'}</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm ml-auto"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Explicação Completa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
