/**
 * Catálogo inicial — opção A da seção 11.4 da arquitetura.
 *
 * Os 7 setores e as 64 tarefas da seção 5 da documentação funcional, digitados
 * uma vez. A planilha é especificação, não fonte de dados: não há importador.
 *
 * Os textos já nascem padronizados, o que resolve a inconsistência 10
 * ("Diario" sem acento, "manuntenção", "Simpificada", "Luis " com espaço).
 *
 * `periodicidade` e `prazoAncora` são campos separados (decisão 7.2): a coluna
 * F da planilha misturava "Diario", "Mensal", "Dia 10", "Junho" — que são dois
 * conceitos, frequência e vencimento.
 */
export type PeriodicidadeCatalogo = 'diaria' | 'semanal' | 'mensal' | 'anual';

export type TarefaCatalogo = {
  descricao: string;
  periodicidade: PeriodicidadeCatalogo;
  prazoAncora?: string;
  /**
   * Peso de criticidade. Obrigação com prazo legal fixo pesa mais que tarefa
   * diária: ECD vermelho em junho é mais grave que uma tarefa diária vermelha.
   * Ver seção 4.3 da arquitetura e sugestão 5 da seção 9.2 da documentação.
   * PENDENTE DE VALIDAÇÃO COM O GESTOR — enquanto isso, serve só para ordenar.
   */
  peso?: number;
};

export type SetorCatalogo = {
  nome: string;
  ordem: number;
  tarefas: TarefaCatalogo[];
};

export const CATALOGO: SetorCatalogo[] = [
  {
    nome: 'Faturamento',
    ordem: 1,
    tarefas: [
      { descricao: 'Emissão de NF de venda (NF-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF de exportação (NF-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF de importação (NF-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF de comodato (NF-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF de bonificação ou brinde (NF-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF de demonstração (NF-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF de troca em garantia (NF-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF de industrialização (NF-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF de serviço (NFS-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF de débito (ND)', periodicidade: 'diaria' },
      { descricao: 'Emissão de NF complementar de ICMS (NF-e)', periodicidade: 'diaria' },
      { descricao: 'Emissão e/ou lançamento de NF de devolução de venda', periodicidade: 'diaria' },
      { descricao: 'Emissão e/ou lançamento de NF de retorno de comodato', periodicidade: 'diaria' },
      { descricao: 'Emissão e/ou lançamento de NF de retorno de demonstração', periodicidade: 'diaria' },
      { descricao: 'Emissão e/ou lançamento de NF de retorno de industrialização', periodicidade: 'diaria' },
      { descricao: 'Emissão e/ou lançamento de NF de troca em garantia', periodicidade: 'diaria' },
      { descricao: 'Análise e/ou criação de cadastros de clientes e fornecedores no sistema SAP', periodicidade: 'diaria' },
      { descricao: 'Análise de possível emissão de guia DIFAL (diferencial de alíquotas)', periodicidade: 'diaria' },
      { descricao: 'Confirmação de pagamento dos pedidos de venda com acesso ao banco Itaú', periodicidade: 'diaria' },
      { descricao: 'Emissão de fatura de adiantamento no pedido de venda', periodicidade: 'diaria' },
      { descricao: 'Controle das mensalidades de locação na planilha Excel junto com o sistema SAP', periodicidade: 'diaria' },
      { descricao: 'Envio manual via e-mail das notas de débito e boletos para os respectivos clientes', periodicidade: 'diaria' },
      { descricao: 'Análise e controle das mensalidades de manutenção de equipamentos, para posterior emissão de NFS-e', periodicidade: 'diaria' },
      { descricao: 'Análise de novos contratos de locação / planilhamento / cadastro no SAP / emissão das notas de débito (ND)', periodicidade: 'diaria' },
      { descricao: 'Análise de contratos de locação em andamento', periodicidade: 'diaria' },
      { descricao: 'Análise de possíveis reajustes contratuais nas parcelas dos contratos de locação/manutenção', periodicidade: 'diaria' },
      { descricao: 'Controle de retorno de comodato da Geneslab / emissão de NF de venda', periodicidade: 'diaria' },
      { descricao: 'Suporte e orientações aos setores (help desk, comercial, adequação, almoxarifado)', periodicidade: 'diaria' },
      { descricao: 'Resolução de problemas e/ou dúvidas de clientes via e-mail, telefone e WhatsApp', periodicidade: 'diaria' },
      { descricao: 'Análise de impostos e tributações das operações em geral', periodicidade: 'diaria' },
    ],
  },
  {
    nome: 'Recebimento',
    ordem: 2,
    tarefas: [
      { descricao: 'Lançamento de notas com pedido de compra', periodicidade: 'diaria' },
      { descricao: 'Lançamento de notas recorrentes', periodicidade: 'diaria' },
      { descricao: 'Lançamentos de guias e impostos (LCM)', periodicidade: 'diaria' },
      { descricao: 'Lançamento da folha de pagamento', periodicidade: 'mensal' },
      { descricao: 'Controle de notas de entrada', periodicidade: 'diaria' },
      { descricao: 'Lançamento de fatura de cartão de crédito', periodicidade: 'mensal' },
      { descricao: 'Abertura de pedidos recorrentes', periodicidade: 'diaria' },
      { descricao: 'Fatura de adiantamento para fornecedor', periodicidade: 'diaria' },
      { descricao: 'Importar arquivos XML de saídas para o Arquivei', periodicidade: 'diaria' },
      { descricao: 'Envio de documentos à contabilidade externa', periodicidade: 'mensal' },
      { descricao: 'Efetivar lançamentos de impostos em débito automático', periodicidade: 'mensal' },
      { descricao: 'Lançamento de CT-e', periodicidade: 'diaria' },
      { descricao: 'Lançamento de multas de trânsito', periodicidade: 'diaria' },
      { descricao: 'Lançamentos de Importação Simplificada (Courrier)', periodicidade: 'diaria' },
      { descricao: 'Emissão de nota fiscal de Importação Simplificada (Courrier)', periodicidade: 'diaria' },
    ],
  },
  {
    nome: 'Apuração Tributária',
    ordem: 3,
    tarefas: [
      { descricao: 'Conferência das notas fiscais de serviços e cálculo do ISS', periodicidade: 'mensal' },
      { descricao: 'Emissão da Guia de ISS', periodicidade: 'mensal', peso: 2 },
      { descricao: 'Cálculo do PIS e COFINS', periodicidade: 'mensal' },
      { descricao: 'Emissão de DARF através do SicalcWeb', periodicidade: 'mensal', peso: 2 },
      { descricao: 'Cálculo do ICMS com base nos relatórios do SAP B1', periodicidade: 'mensal' },
    ],
  },
  {
    nome: 'Obrigações Acessórias',
    ordem: 4,
    tarefas: [
      { descricao: 'EFD Contribuições', periodicidade: 'mensal', prazoAncora: 'dia 10', peso: 3 },
      { descricao: 'EFD IPI e ICMS', periodicidade: 'mensal', prazoAncora: 'dia 10', peso: 3 },
      { descricao: 'DCTFWeb / MIT', periodicidade: 'mensal', prazoAncora: 'dia 20', peso: 3 },
      { descricao: 'ECD — Escrituração Contábil Digital', periodicidade: 'anual', prazoAncora: 'junho', peso: 3 },
      { descricao: 'ECF — Escrituração Contábil Fiscal', periodicidade: 'anual', prazoAncora: 'julho', peso: 3 },
      { descricao: 'Pesquisa IBGE — Empresas e Produtos', periodicidade: 'anual', prazoAncora: 'julho', peso: 2 },
    ],
  },
  {
    nome: 'Fiscal',
    ordem: 5,
    tarefas: [
      { descricao: 'Identificar retenção de tributos em serviços tomados', periodicidade: 'mensal' },
      { descricao: 'Gerar guias de impostos mensais', periodicidade: 'mensal', peso: 2 },
    ],
  },
  {
    nome: 'Sistema Domínio',
    ordem: 6,
    tarefas: [
      { descricao: 'Importar notas de débito por planilha / arquivo TXT', periodicidade: 'mensal' },
      { descricao: 'Importar documentos de saída para o Domínio', periodicidade: 'mensal' },
      { descricao: 'Importar documentos de entrada para o Domínio', periodicidade: 'mensal' },
      { descricao: 'Importar extratos bancários para o Domínio', periodicidade: 'mensal' },
      { descricao: 'Lançamento de ajustes de créditos e débitos de ICMS no livro ICMS', periodicidade: 'mensal' },
    ],
  },
  {
    nome: 'Financeiro',
    ordem: 7,
    tarefas: [
      { descricao: 'Solicitação de pagamentos no ASTER', periodicidade: 'diaria' },
    ],
  },
];

export const TOTAL_TAREFAS = CATALOGO.reduce((n, s) => n + s.tarefas.length, 0);
