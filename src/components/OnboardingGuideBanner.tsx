import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, BookOpen, Share2, Lightbulb } from 'lucide-react';

export const OnboardingGuideBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border border-indigo-100 rounded-2xl p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Novo na empresa? Como sobreviver à "sopa de letrinhas"
            </h3>
            <p className="text-xs text-slate-500">
              Guia rápido para ninguém ficar perdido no primeiro mês
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-indigo-50/50 transition-colors"
        >
          <span>{isOpen ? 'Recolher guia' : 'Ver dicas'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-indigo-100/70 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
              1
            </div>
            <div>
              <strong className="text-slate-800 block mb-0.5">Ouviu uma sigla na reunião?</strong>
              <p className="text-slate-600 leading-relaxed">
                Digite a sigla na busca instantânea acima. O glossário mostra o significado, o que é e exemplos de como usar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
              2
            </div>
            <div>
              <strong className="text-slate-800 block mb-0.5">Copie e ajude colegas</strong>
              <p className="text-slate-600 leading-relaxed">
                Alguém perguntou no Slack ou Teams? Clique no botão de copiar no card para enviar a explicação pronta em 1 clique.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
              3
            </div>
            <div>
              <strong className="text-slate-800 block mb-0.5">Cadastre e publique para o time</strong>
              <p className="text-slate-600 leading-relaxed">
                Use <strong>+ Nova Sigla</strong> e confirme <em>Ok, pode publicar</em> no próprio site. O time inteiro vê a mesma lista.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
