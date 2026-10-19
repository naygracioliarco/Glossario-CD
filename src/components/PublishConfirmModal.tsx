import React, { useState } from 'react';
import { Share2, X, KeyRound } from 'lucide-react';
import { getGithubToken, hasGithubToken, saveGithubToken, TOKEN_SETUP_URL } from '../utils/publish';

interface PublishConfirmModalProps {
  isOpen: boolean;
  termCount: number;
  isPublishing: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (token: string) => void;
}

export const PublishConfirmModal: React.FC<PublishConfirmModalProps> = ({
  isOpen,
  termCount,
  isPublishing,
  errorMessage,
  onClose,
  onConfirm,
}) => {
  const [token, setToken] = useState('');
  const alreadyConfigured = hasGithubToken();

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    const nextToken = token.trim() || getGithubToken();
    if (token.trim()) {
      saveGithubToken(token);
    }
    onConfirm(nextToken);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Publicar para o time?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              As <strong>{termCount} siglas</strong> deste glossário vão ficar visíveis para
              qualquer pessoa que abrir o site. Confirme aqui — sem sair desta página.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {alreadyConfigured ? (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            A publicação já está configurada neste navegador. Basta confirmar.
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Primeira vez: cole o token de publicação
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Isso é feito só uma vez neste navegador. Crie um token fine-grained no GitHub com
              acesso ao repositório <strong>Glossario-CD</strong> e permissão <strong>Contents: Read and write</strong>.
            </p>
            <a
              href={TOKEN_SETUP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Abrir a tela de criar token
            </a>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Cole o token aqui"
              autoComplete="off"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              O token fica só no seu navegador. Ele não é enviado para outras pessoas nem salvo no site.
            </p>
          </div>
        )}

        {errorMessage && (
          <p className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {errorMessage}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPublishing || (!alreadyConfigured && !token.trim())}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Share2 className="w-3.5 h-3.5" />
            {isPublishing ? 'Publicando…' : 'Ok, pode publicar'}
          </button>
        </div>
      </div>
    </div>
  );
};
