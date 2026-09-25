create type periodicidade as enum ('diaria','semanal','mensal','anual');
create type status_ciclo  as enum ('aberto','fechado');
create type papel         as enum ('colaborador','gestor','diretoria');

create table departamento (
  id   bigint generated always as identity primary key,
  nome text not null
);

create table setor (
  id              bigint generated always as identity primary key,
  departamento_id bigint not null references departamento,
  nome            text not null,
  ordem           int  not null default 0,
  unique (departamento_id, nome)
);

create table colaborador (
  id              bigint generated always as identity primary key,
  departamento_id bigint not null references departamento,
  auth_user_id    uuid unique,          -- liga ao Supabase Auth
  nome            text not null,
  email           text unique,
  papel           papel not null default 'colaborador',
  entrada_em      date,
  saida_em        date                  -- saiu ≠ sumiu do histórico
);

create table tarefa (
  id               bigint generated always as identity primary key,
  setor_id         bigint not null references setor,
  descricao        text not null,
  periodicidade    periodicidade not null,
  prazo_ancora     text,                -- 'dia 10', 'junho'  (separado da periodicidade)
  peso_criticidade numeric(3,1) not null default 1.0,
  ativa_desde      date not null default current_date,
  ativa_ate        date                 -- soft delete: o histórico continua válido
);

create table ciclo (
  id              bigint generated always as identity primary key,
  departamento_id bigint not null references departamento,
  referencia      date   not null,      -- sempre dia 1 do mês
  status          status_ciclo not null default 'aberto',
  fechado_em      timestamptz,
  unique (departamento_id, referencia)
);

create table nivel (
  ciclo_id       bigint not null references ciclo,
  tarefa_id      bigint not null references tarefa,
  colaborador_id bigint not null references colaborador,
  valor          smallint not null check (valor between 0 and 4),
  avaliado       boolean not null default true,   -- distingue "é zero" de "ninguém avaliou"
  atualizado_por bigint references colaborador,
  atualizado_em  timestamptz not null default now(),
  primary key (ciclo_id, tarefa_id, colaborador_id)
);

create table autoavaliacao (
  id             bigint generated always as identity primary key,
  ciclo_id       bigint not null references ciclo,
  colaborador_id bigint not null references colaborador,
  tarefa_id      bigint not null references tarefa,
  valor          smallint not null check (valor between 0 and 4),
  observacao     text,
  status         text not null default 'pendente',
  criado_em      timestamptz not null default now(),
  unique (ciclo_id, colaborador_id, tarefa_id)
);

