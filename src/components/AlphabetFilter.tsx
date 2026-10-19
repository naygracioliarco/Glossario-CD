import React from 'react';

interface AlphabetFilterProps {
  selectedLetter: string;
  onSelectLetter: (letter: string) => void;
  letterCounts: Record<string, number>;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const AlphabetFilter: React.FC<AlphabetFilterProps> = ({
  selectedLetter,
  onSelectLetter,
  letterCounts,
}) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2 px-1 text-xs">
      <button
        onClick={() => onSelectLetter('todos')}
        className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
          selectedLetter === 'todos'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        Todas (A-Z)
      </button>

      {ALPHABET.map((char) => {
        const count = letterCounts[char] || 0;
        const isSelected = selectedLetter === char;
        const isDisabled = count === 0;

        return (
          <button
            key={char}
            disabled={isDisabled}
            onClick={() => onSelectLetter(char)}
            className={`w-7 h-7 flex items-center justify-center rounded-md font-bold transition-colors shrink-0 ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDisabled
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
            title={isDisabled ? `Nenhuma sigla com ${char}` : `${count} sigla(s) com ${char}`}
          >
            {char}
          </button>
        );
      })}
    </div>
  );
};
