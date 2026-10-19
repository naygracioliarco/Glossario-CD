import React, { useState } from 'react';
import { Star, Copy, Check, Pencil, ArrowUpRight } from 'lucide-react';
import { GlossaryTerm } from '../types';

interface TermTableProps {
  terms: GlossaryTerm[];
  onSelect: (term: GlossaryTerm) => void;
  onEdit: (term: GlossaryTerm) => void;
  onToggleFavorite: (id: string) => void;
}

export const TermTable: React.FC<TermTableProps> = ({
  terms,
  onSelect,
  onEdit,
  onToggleFavorite,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, term: GlossaryTerm) => {
    e.stopPropagation();
    const textToCopy = `*${term.term}* (${term.expansion}): ${term.definition}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(term.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-10">★</th>
              <th className="py-3 px-4 font-bold text-slate-800">Sigla / Termo</th>
              <th className="py-3 px-4">Significado por Extenso</th>
              <th className="py-3 px-4">Área / Departamento</th>
              <th className="py-3 px-4">O que significa</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {terms.map((term) => (
              <tr
                key={term.id}
                onClick={() => onSelect(term)}
                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
              >
                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleFavorite(term.id)}
                    className="text-slate-300 hover:text-amber-500 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        term.isFavorite ? 'fill-amber-400 text-amber-500' : ''
                      }`}
                    />
                  </button>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                  {term.term}
                </td>
                <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap font-medium">
                  {term.expansion}
                </td>
                <td className="py-3 px-4 text-xs whitespace-nowrap">
                  <span className="text-slate-600 font-medium">{term.department}</span>
                </td>
                <td className="py-3 px-4 text-xs text-slate-600 max-w-md truncate">
                  {term.definition}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={(e) => handleCopy(e, term)}
                      title="Copiar definição"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      {copiedId === term.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onEdit(term)}
                      title="Editar"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelect(term)}
                      title="Ver detalhes"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
