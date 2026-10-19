import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { GlossaryTerm, Department, ImportanceLevel } from '../types';
import { DEPARTMENTS } from '../data/defaultTerms';

interface TermFormModalProps {
  isOpen: boolean;
  termToEdit: GlossaryTerm | null;
  onClose: () => void;
  onSave: (term: GlossaryTerm) => void;
}

export const TermFormModal: React.FC<TermFormModalProps> = ({
  isOpen,
  termToEdit,
  onClose,
  onSave,
}) => {
  const [term, setTerm] = useState('');
  const [expansion, setExpansion] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [department, setDepartment] = useState<Department>('Tecnologia & Produto');
  const [importance, setImportance] = useState<ImportanceLevel>('frequente');
  const [tip, setTip] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (termToEdit) {
      setTerm(termToEdit.term);
      setExpansion(termToEdit.expansion);
      setDefinition(termToEdit.definition);
      setExample(termToEdit.example);
      setDepartment(termToEdit.department);
      setImportance(termToEdit.importance);
      setTip(termToEdit.tip || '');
      setPronunciation(termToEdit.pronunciation || '');
      setTagsString(termToEdit.tags ? termToEdit.tags.join(', ') : '');
    } else {
      setTerm('');
      setExpansion('');
      setDefinition('');
      setExample('');
      setDepartment('Geral & Comunicação');
      setImportance('frequente');
      setTip('');
      setPronunciation('');
      setTagsString('');
    }
    setError('');
  }, [termToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) {
      setError('Por favor, informe a sigla ou termo.');
      return;
    }
    if (!definition.trim()) {
      setError('Por favor, descreva o que a sigla significa.');
      return;
    }

    const tags = tagsString
      .split(/[,;]/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const savedItem: GlossaryTerm = {
      id: termToEdit ? termToEdit.id : `term-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      term: term.trim().toUpperCase(),
      expansion: expansion.trim() || term.trim(),
      definition: definition.trim(),
      example: example.trim(),
      department,
      importance,
      tip: tip.trim() || undefined,
      pronunciation: pronunciation.trim() || undefined,
      tags,
      isFavorite: termToEdit ? termToEdit.isFavorite : false,
      updatedAt: new Date().toISOString(),
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {termToEdit ? 'Editar Sigla' : 'Adicionar Nova Sigla à Empresa'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Preencha os campos para orientar os novos colaboradores
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sigla ou Nome Curto <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: OKR, SLA, CAC, LMS"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold uppercase tracking-wide"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Como pronunciar (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Ôu-Kêi-Ár ou O-K-R"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Significado por Extenso (Tradução/Expansão)
            </label>
            <input
              type="text"
              placeholder="Ex: Objectives and Key Results (Objetivos e Resultados-Chave)"
              value={expansion}
              onChange={(e) => setExpansion(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Área / Departamento
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nível de Relevância
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="essencial">🔥 Essencial (todo novo contratado precisa saber)</option>
                <option value="frequente">⚡ Frequente na rotina</option>
                <option value="especifico">📌 Específico da área</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              O que significa (Definição clara e descomplicada) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explique com palavras simples como se estivesse explicando para alguém no primeiro dia de trabalho."
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exemplo de frase usada em reuniões ou Slack
            </label>
            <input
              type="text"
              placeholder='Ex: "Pessoal, vamos fechar os OKRs do Q3 na daily de amanhã."'
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 italic"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dica especial para o novato (opcional)
            </label>
            <input
              type="text"
              placeholder='Ex: "Cuidado: não confunda OKR com KPI. Um mede a meta, o outro a rotina."'
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags / Palavras-chave (separadas por vírgula)
            </label>
            <input
              type="text"
              placeholder="Ex: metas, planejamento, scrum, diretoria"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{termToEdit ? 'Salvar Alterações' : 'Cadastrar Sigla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
