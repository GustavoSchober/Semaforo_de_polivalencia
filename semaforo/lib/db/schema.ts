import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------
// tipos
// ---------------------------------------------------------------
export const periodicidade = pgEnum('periodicidade', [
  'diaria',
  'semanal',
  'mensal',
  'anual',
]);
export const statusCiclo = pgEnum('status_ciclo', ['aberto', 'fechado']);
export const papel = pgEnum('papel', ['colaborador', 'gestor', 'diretoria']);
// A ordem espelha `enumsortorder` no banco: 'herdado' entrou depois, pela
// migration 0002, e é o último rótulo.
export const origemNivel = pgEnum('origem_nivel', [
  'importacao',
  'gestor',
  'autoavaliacao_aprovada',
  // copiado do ciclo anterior na virada do mês: conta no cálculo, mas a
  // interface declara que ainda não foi confirmado neste ciclo
  'herdado',
]);
export const statusAutoav = pgEnum('status_autoav', [
  'pendente',
  'aprovada',
  'rejeitada',
]);

// ---------------------------------------------------------------
// estrutura organizacional
// ---------------------------------------------------------------
export const departamento = pgTable('departamento', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  nome: text('nome').notNull().unique(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

export const setor = pgTable(
  'setor',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    departamentoId: bigint('departamento_id', { mode: 'number' })
      .notNull()
      .references(() => departamento.id, { onDelete: 'restrict' }),
    nome: text('nome').notNull(),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => [unique('setor_departamento_nome_key').on(t.departamentoId, t.nome)],
);

export const colaborador = pgTable('colaborador', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  departamentoId: bigint('departamento_id', { mode: 'number' })
    .notNull()
    .references(() => departamento.id, { onDelete: 'restrict' }),
  // vínculo com o provedor de identidade — trocar Credentials por LDAP não
  // deve tocar em nenhuma tela (ADR-005 / ADR-011)
  authUserId: uuid('auth_user_id').unique(),
  nome: text('nome').notNull(),
  email: text('email').unique(),
  papel: papel('papel').notNull().default('colaborador'),
  entradaEm: date('entrada_em'),
  // quem saiu continua no histórico: saiu != sumiu
  saidaEm: date('saida_em'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------
// catálogo de tarefas
// ---------------------------------------------------------------
export const tarefa = pgTable(
  'tarefa',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    setorId: bigint('setor_id', { mode: 'number' })
      .notNull()
      .references(() => setor.id, { onDelete: 'restrict' }),
    descricao: text('descricao').notNull(),
    periodicidade: periodicidade('periodicidade').notNull(),
    // separado da periodicidade: 'dia 10', 'dia 20', 'junho' (decisão 7.2)
    prazoAncora: text('prazo_ancora'),
    pesoCriticidade: numeric('peso_criticidade', { precision: 3, scale: 1 })
      .notNull()
      .default('1.0'),
    ordem: integer('ordem').notNull().default(0),
    // vigência: nada é removido fisicamente (ADR-009)
    ativaDesde: date('ativa_desde').notNull().default(sql`current_date`),
    ativaAte: date('ativa_ate'),
  },
  (t) => [
    check('tarefa_peso_positivo', sql`${t.pesoCriticidade} > 0`),
    check(
      'tarefa_vigencia_coerente',
      sql`${t.ativaAte} is null or ${t.ativaAte} >= ${t.ativaDesde}`,
    ),
    index('tarefa_setor_vigente_idx')
      .on(t.setorId)
      .where(sql`${t.ativaAte} is null`),
  ],
);

// ---------------------------------------------------------------
// ciclos e níveis
// ---------------------------------------------------------------
export const ciclo = pgTable(
  'ciclo',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    departamentoId: bigint('departamento_id', { mode: 'number' })
      .notNull()
      .references(() => departamento.id, { onDelete: 'restrict' }),
    // sempre o dia 1 do mês: uma data ordena, subtrai e formata sozinha
    referencia: date('referencia').notNull(),
    status: statusCiclo('status').notNull().default('aberto'),
    fechadoEm: timestamp('fechado_em', { withTimezone: true }),
    fechadoPor: bigint('fechado_por', { mode: 'number' }).references(
      () => colaborador.id,
    ),
  },
  (t) => [
    unique('ciclo_departamento_referencia_key').on(t.departamentoId, t.referencia),
    check(
      'ciclo_referencia_primeiro_dia',
      sql`${t.referencia} = date_trunc('month', ${t.referencia})::date`,
    ),
    check(
      'ciclo_fechamento_coerente',
      sql`(${t.status} = 'fechado') = (${t.fechadoEm} is not null)`,
    ),
  ],
);

/**
 * O único dado de verdade do sistema. Tudo o mais é derivado.
 *
 * `valor` é um inteiro de 0 a 4, não quatro booleanos: como o preenchimento é
 * cumulativo e contíguo, existem só cinco estados possíveis. Quatro booleanos
 * comportariam 16 combinações, 12 delas inválidas. O CHECK abaixo torna o
 * estado inválido irrepresentável em vez de apenas improvável (seção 2.1).
 */
export const nivel = pgTable(
  'nivel',
  {
    cicloId: bigint('ciclo_id', { mode: 'number' })
      .notNull()
      .references(() => ciclo.id, { onDelete: 'cascade' }),
    tarefaId: bigint('tarefa_id', { mode: 'number' })
      .notNull()
      .references(() => tarefa.id, { onDelete: 'restrict' }),
    colaboradorId: bigint('colaborador_id', { mode: 'number' })
      .notNull()
      .references(() => colaborador.id, { onDelete: 'restrict' }),
    valor: smallint('valor').notNull().default(0),
    // distingue "é zero" de "ninguém avaliou" — resolve a inconsistência 7
    avaliado: boolean('avaliado').notNull().default(false),
    origem: origemNivel('origem').notNull().default('gestor'),
    atualizadoPor: bigint('atualizado_por', { mode: 'number' }).references(
      () => colaborador.id,
    ),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // não existe "um nível" como entidade independente: existe o nível daquela
    // pessoa, naquela tarefa, naquele ciclo. A chave composta impede duplicata
    // por construção.
    primaryKey({ columns: [t.cicloId, t.tarefaId, t.colaboradorId] }),
    check('nivel_escala_valida', sql`${t.valor} between 0 and 4`),
    index('nivel_ciclo_colaborador_idx').on(t.cicloId, t.colaboradorId),
    index('nivel_ciclo_tarefa_idx').on(t.cicloId, t.tarefaId),
  ],
);

// ---------------------------------------------------------------
// fila de autoavaliação
// ---------------------------------------------------------------
export const autoavaliacao = pgTable(
  'autoavaliacao',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    cicloId: bigint('ciclo_id', { mode: 'number' })
      .notNull()
      .references(() => ciclo.id, { onDelete: 'cascade' }),
    colaboradorId: bigint('colaborador_id', { mode: 'number' })
      .notNull()
      .references(() => colaborador.id, { onDelete: 'cascade' }),
    tarefaId: bigint('tarefa_id', { mode: 'number' })
      .notNull()
      .references(() => tarefa.id, { onDelete: 'cascade' }),
    valor: smallint('valor').notNull(),
    observacao: text('observacao'),
    status: statusAutoav('status').notNull().default('pendente'),
    decididoPor: bigint('decidido_por', { mode: 'number' }).references(
      () => colaborador.id,
    ),
    decididoEm: timestamp('decidido_em', { withTimezone: true }),
    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('autoavaliacao_ciclo_colaborador_tarefa_key').on(
      t.cicloId,
      t.colaboradorId,
      t.tarefaId,
    ),
    check('autoavaliacao_escala_valida', sql`${t.valor} between 0 and 4`),
  ],
);
