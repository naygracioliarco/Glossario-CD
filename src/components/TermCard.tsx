import React, { useState } from 'react';
import { Star, Copy, Check, Pencil, MessageSquareQuote, Volume2, ArrowUpRight } from 'lucide-react';
import { GlossaryTerm } from '../types';

interface TermCardProps {
  term: GlossaryTerm;
  onSelect: (term: GlossaryTerm) => void;
  onEdit: (term: GlossaryTerm) => void;
  onToggleFavorite: (id: string) => void;
}

export const TermCard: React.FC<TermCardProps> = ({
  term,
  onSelect,
  onEdit,
  onToggleFavorite,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `*${term.term}* (${term.expansion}):\n${term.definition}\nExemplo: "${term.example}"`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const importanceLabel: Record<string, string> = {
    essencial: 'Essencial',
    frequente: 'Frequente',
    especifico: 'Específico',
  };

  return (
    <article
      onClick={() => onSelect(term)}
      className="group relative bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top row: Acronym + Fast Actions */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              {term.term}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">
              {term.expansion}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCopy}
              title={copied ? 'Copiado!' : 'Copiar significado'}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onToggleFavorite(term.id)}
              title={term.isFavorite ? 'Remover dos favoritos' : 'Favoritar sigla'}
              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  term.isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                }`}
              />
            </button>
            <button
              onClick={() => onEdit(term)}
              title="Editar termo"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Unboxed Metadata Separated with Typographic dots (Zero-Pill discipline) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-3 font-medium">
          <span className="text-indigo-600 font-medium">{term.department}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{importanceLabel[term.importance] || term.importance}</span>
          {term.pronunciation && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Volume2 className="w-3 h-3" />
                {term.pronunciation}
              </span>
            </>
          )}
        </div>

        {/* Definition */}
        <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
          {term.definition}
        </p>

        {/* Daily Example Quote */}
        {term.example && (
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 mb-3 border border-slate-100">
            <div className="flex items-start gap-2">
              <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="italic leading-normal">
                "{term.example}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Card Bottom */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate max-w-[200px]">
          {term.tip ? `💡 ${term.tip}` : 'Clique para ver detalhes'}
        </span>
        <span className="inline-flex items-center gap-1 text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform shrink-0">
          Ver mais <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
};
