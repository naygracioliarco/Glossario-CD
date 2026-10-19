import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { unlockTeam } from '../utils/teamAccess';

interface TeamPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export const TeamPasswordModal: React.FC<TeamPasswordModalProps> = ({
  isOpen,
  onClose,
  onUnlocked,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (unlockTeam(password)) {
      setPassword('');
      setError('');
      onUnlocked();
      return;
    }
    setError('Senha incorreta. Peça a senha do time para quem já cadastra siglas.');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Senha do time</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Qualquer pessoa do time pode cadastrar. Digite a senha compartilhada uma vez neste navegador.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <KeyRound className="w-4 h-4 text-indigo-600" />
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
          className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Digite a senha do time"
        />
        {error && (
          <p className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </div>
      </form>
    </div>
  );
};
