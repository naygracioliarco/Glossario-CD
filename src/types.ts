export type Department = 
  | 'Tecnologia & Produto'
  | 'Negócios & Vendas'
  | 'Gente & Gestão (RH)'
  | 'Financeiro & Operações'
  | 'Educação & Pedagógico'
  | 'Marketing'
  | 'Geral & Comunicação';

export type ImportanceLevel = 'essencial' | 'frequente' | 'especifico';

export interface GlossaryTerm {
  id: string;
  term: string; // Ex: "OKR"
  expansion: string; // Ex: "Objectives and Key Results (Objetivos e Resultados-Chave)"
  definition: string; // Definição clara e amigável
  example: string; // Exemplo de frase usada em reunião ou Slack
  department: Department;
  importance: ImportanceLevel;
  tip?: string; // Dica especial para novos colaboradores
  pronunciation?: string; // Como se fala (ex: "O-K-R" ou "Ou-kei-ár")
  tags: string[];
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ViewMode = 'grid' | 'table' | 'quiz';
