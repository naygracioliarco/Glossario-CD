import { GlossaryTerm } from '../types';
import seedTerms from './seedTerms.json';

export const INITIAL_TERMS = seedTerms as GlossaryTerm[];

export const DEPARTMENTS: { name: GlossaryTerm['department']; description: string }[] = [
  { name: 'Tecnologia & Produto', description: 'Desenvolvimento, engenharia, infraestrutura e design de produto' },
  { name: 'Negócios & Vendas', description: 'Estratégia comercial, clientes, receita e indicadores corporativos' },
  { name: 'Gente & Gestão (RH)', description: 'Carreira, cultura, benefícios, contratação e liderança' },
  { name: 'Financeiro & Operações', description: 'Controladoria, planejamento orçamentário e processos internos' },
  { name: 'Educação & Pedagógico', description: 'Termos educacionais, acadêmicos, BNCC e plataformas de ensino' },
  { name: 'Marketing', description: 'Aquisição, posicionamento de marca, mídia e comunicação externa' },
  { name: 'Geral & Comunicação', description: 'Jargões do dia a dia, Slack, e-mails e reuniões' },
];
