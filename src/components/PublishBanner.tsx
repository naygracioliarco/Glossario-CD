import React from 'react';
import {Share2, X} from 'lucide-react';

interface PublishBannerProps {
  isPublishing: boolean;
  onPublish: () => void;
  onDiscard: () => void;
}

export const PublishBanner: React.FC<PublishBannerProps> = ({
  isPublishing,
  onPublish,
  onDiscard,
}) => {
  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-950">
          Você tem alterações ainda não publicadas
        </p>
        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
          Elas já aparecem neste navegador. Confirme a publicação aqui no site para o time inteiro ver.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isPublishing}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          Descartar
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <Share2 className="w-3.5 h-3.5" />
          {isPublishing ? 'Publicando…' : 'Publicar para todos'}
        </button>
      </div>
    </div>
  );
};
