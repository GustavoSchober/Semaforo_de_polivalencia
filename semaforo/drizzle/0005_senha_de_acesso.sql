-- ---------------------------------------------------------------------------
-- Senha única de acesso.
--
-- Enquanto não existe login individual (gestor × colaborador — ADR-005), o app
-- inteiro fica atrás de UMA senha compartilhada. Ela mora aqui, como hash
-- bcrypt, e é administrada só por SQL:
--
--   cadastrar (primeira vez):
--     insert into acesso (senha_hash) values (crypt('a senha', gen_salt('bf', 10)));
--
--   trocar (derruba todas as sessões abertas, porque o cookie é assinado
--   com o hash):
--     update acesso set senha_hash = crypt('nova senha', gen_salt('bf', 10)),
--                       atualizado_em = now();
--
--   derrubar todas as sessões sem trocar a senha:
--     update acesso set segredo_sessao = encode(gen_random_bytes(32), 'hex');
--
-- Sem linha nesta tabela, ninguém entra: a tela de entrada avisa que o acesso
-- não foi configurado.
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE acesso (
  -- uma linha só: é UMA senha para o app
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  senha_hash text NOT NULL,
  segredo_sessao text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
