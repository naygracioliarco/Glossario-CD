import React, { useState } from 'react';
import { X, Download, Upload, RefreshCw, Trash2, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { GlossaryTerm } from '../types';
import { exportToCSV, exportToJSON, parseCSVInput, resetToDefaults } from '../utils/storage';

interface ManageDataModalProps {
  isOpen: boolean;
  terms: GlossaryTerm[];
  onClose: () => void;
  onUpdateTerms: (terms: GlossaryTerm[]) => void;
}

export const ManageDataModal: React.FC<ManageDataModalProps> = ({
  isOpen,
  terms,
  onClose,
  onUpdateTerms,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'reset'>('export');
  const [csvPasteText, setCsvPasteText] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    exportToCSV(terms);
    setFeedbackMessage({ type: 'success', text: 'Planilha CSV gerada com sucesso!' });
  };

  const handleDownloadJSON = () => {
    exportToJSON(terms);
    setFeedbackMessage({ type: 'success', text: 'Arquivo de backup JSON gerado com sucesso!' });
  };

  const handleDownloadTemplate = () => {
    const templateHeaders = 'Sigla;Significado Completo;Definição;Exemplo de Uso;Departamento;Importância;Dica;Como Falar\r\n' +
      'SIGLA_EXEMPLO;Nome por Extenso;Explicação do que significa;Exemplo numa frase;Geral & Comunicação;essencial;Dica útil;Pronúncia';
    const blob = new Blob(['\uFEFF' + templateHeaders], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-glossario-empresa.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setFeedbackMessage({ type: 'success', text: 'Modelo CSV em branco baixado! Preencha no Excel/Sheets e importe aqui.' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            onUpdateTerms(parsed);
            setFeedbackMessage({ type: 'success', text: `${parsed.length} termos importados do JSON com sucesso!` });
          } else {
            setFeedbackMessage({ type: 'error', text: 'Formato JSON inválido. Esperava-se uma lista de termos.' });
          }
        } else {
          // Assume CSV
          const imported = parseCSVInput(content) as GlossaryTerm[];
          if (imported.length > 0) {
            onUpdateTerms([...terms, ...imported]);
            setFeedbackMessage({ type: 'success', text: `${imported.length} siglas importadas da planilha com sucesso!` });
          } else {
            setFeedbackMessage({ type: 'error', text: 'Nenhuma sigla válida encontrada no CSV. Verifique o cabeçalho.' });
          }
        }
      } catch (err) {
        setFeedbackMessage({ type: 'error', text: 'Erro ao processar arquivo. Verifique o formato.' });
      }
    };
    reader.readAsText(file);
  };

  const handleImportPastedCSV = () => {
    if (!csvPasteText.trim()) return;
    const imported = parseCSVInput(csvPasteText) as GlossaryTerm[];
    if (imported.length > 0) {
      onUpdateTerms([...terms, ...imported]);
      setCsvPasteText('');
      setFeedbackMessage({ type: 'success', text: `${imported.length} novas siglas adicionadas com sucesso!` });
    } else {
      setFeedbackMessage({ type: 'error', text: 'Nenhum termo reconhecido. Use o formato: Sigla;Significado;Definição' });
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar as mais de 40 siglas de exemplo padrão?')) {
      const def = resetToDefaults();
      onUpdateTerms(def);
      setFeedbackMessage({ type: 'success', text: 'Glossário restaurado para os termos de demonstração padrão.' });
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Tem certeza de que deseja apagar todas as siglas atuais e começar com o glossário 100% limpo?')) {
      onUpdateTerms([]);
      setFeedbackMessage({ type: 'success', text: 'Todas as siglas foram removidas. Agora você pode cadastrar as da sua empresa!' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Personalizar com as Siglas da sua Empresa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Exporte, importe planilhas do Excel ou gerencie os dados salvos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedbackMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mt-5">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'export'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exportar & Backup
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Importar Planilha (CSV)
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'reset'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Limpar / Restaurar
          </button>
        </div>

        {/* TAB 1: EXPORT */}
        {activeTab === 'export' && (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Você pode baixar todas as <strong>{terms.length} siglas</strong> atualmente salvas para compartilhar com sua equipe ou editar offline no Excel ou Google Sheets:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadCSV}
                className="p-4 border border-slate-200 hover:border-indigo-400 rounded-xl bg-slate-50/50 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                      Baixar Planilha (CSV)
                    </h5>
                    <span className="text-xs text-slate-500">Compatível com Excel & Sheets</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Ideal para preencher em massa com as siglas do seu time.
                </p>
              </button>

              <button
                onClick={handleDownloadJSON}
                className="p-4 border border-slate-200 hover:border-indigo-400 rounded-xl bg-slate-50/50 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                      Backup Completo (JSON)
                    </h5>
                    <span className="text-xs text-slate-500">Arquivo estruturado</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Perfeito para salvar uma cópia exata de segurança.
                </p>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleDownloadTemplate}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar apenas o modelo de planilha em branco (sem siglas preenchidas)
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: IMPORT */}
        {activeTab === 'import' && (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Carregue uma planilha CSV existente ou cole linhas de texto para adicionar as siglas da sua empresa em lote:
            </p>

            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center bg-slate-50/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="w-8 h-8 text-indigo-600 mb-2" />
                <span className="text-sm font-semibold text-slate-800">
                  Clique para selecionar arquivo .CSV ou .JSON
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Arquivos exportados do Excel ou do próprio glossário
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ou cole linhas de CSV manualmente:
              </label>
              <textarea
                rows={3}
                value={csvPasteText}
                onChange={(e) => setCsvPasteText(e.target.value)}
                placeholder={'Sigla;Significado;Definição;Exemplo;Departamento\nOKR;Objectives and Key Results;Metas trimestrais;Alinhar os OKRs;Negócios & Vendas'}
                className="w-full font-mono text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleImportPastedCSV}
                  disabled={!csvPasteText.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Processar Linhas Coladas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESET / CLEAR */}
        {activeTab === 'reset' && (
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h5 className="text-sm font-bold text-amber-900 mb-1">
                Começar do zero com as siglas da sua empresa?
              </h5>
              <p className="text-xs text-amber-800 leading-relaxed mb-3">
                Se você não quiser manter os 40 termos de exemplo e preferir um catálogo 100% limpo com apenas os termos internos da sua organização, clique abaixo:
              </p>
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Todos os Termos Atuais
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h5 className="text-sm font-bold text-slate-900 mb-1">
                Restaurar termos de exemplo
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Se quiser voltar a ter a biblioteca com os termos corporativos mais populares (OKR, SLA, CAC, MVP, PR, BNCC, LMS, EBITDA, etc.):
              </p>
              <button
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar 40+ Siglas Padrão
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
