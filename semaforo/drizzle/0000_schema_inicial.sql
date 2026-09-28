CREATE TYPE "public"."origem_nivel" AS ENUM('importacao', 'gestor', 'autoavaliacao_aprovada');--> statement-breakpoint
CREATE TYPE "public"."papel" AS ENUM('colaborador', 'gestor', 'diretoria');--> statement-breakpoint
CREATE TYPE "public"."periodicidade" AS ENUM('diaria', 'semanal', 'mensal', 'anual');--> statement-breakpoint
CREATE TYPE "public"."status_autoav" AS ENUM('pendente', 'aprovada', 'rejeitada');--> statement-breakpoint
CREATE TYPE "public"."status_ciclo" AS ENUM('aberto', 'fechado');--> statement-breakpoint
CREATE TABLE "autoavaliacao" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "autoavaliacao_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"ciclo_id" bigint NOT NULL,
	"colaborador_id" bigint NOT NULL,
	"tarefa_id" bigint NOT NULL,
	"valor" smallint NOT NULL,
	"observacao" text,
	"status" "status_autoav" DEFAULT 'pendente' NOT NULL,
	"decidido_por" bigint,
	"decidido_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "autoavaliacao_ciclo_colaborador_tarefa_key" UNIQUE("ciclo_id","colaborador_id","tarefa_id"),
	CONSTRAINT "autoavaliacao_escala_valida" CHECK ("autoavaliacao"."valor" between 0 and 4)
);
--> statement-breakpoint
CREATE TABLE "ciclo" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ciclo_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"departamento_id" bigint NOT NULL,
	"referencia" date NOT NULL,
	"status" "status_ciclo" DEFAULT 'aberto' NOT NULL,
	"fechado_em" timestamp with time zone,
	"fechado_por" bigint,
	CONSTRAINT "ciclo_departamento_referencia_key" UNIQUE("departamento_id","referencia"),
	CONSTRAINT "ciclo_referencia_primeiro_dia" CHECK ("ciclo"."referencia" = date_trunc('month', "ciclo"."referencia")::date),
	CONSTRAINT "ciclo_fechamento_coerente" CHECK (("ciclo"."status" = 'fechado') = ("ciclo"."fechado_em" is not null))
);
--> statement-breakpoint
CREATE TABLE "colaborador" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "colaborador_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"departamento_id" bigint NOT NULL,
	"auth_user_id" uuid,
	"nome" text NOT NULL,
	"email" text,
	"papel" "papel" DEFAULT 'colaborador' NOT NULL,
	"entrada_em" date,
	"saida_em" date,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "colaborador_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "colaborador_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "departamento" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "departamento_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"nome" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departamento_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "nivel" (
	"ciclo_id" bigint NOT NULL,
	"tarefa_id" bigint NOT NULL,
	"colaborador_id" bigint NOT NULL,
	"valor" smallint DEFAULT 0 NOT NULL,
	"avaliado" boolean DEFAULT false NOT NULL,
	"origem" "origem_nivel" DEFAULT 'gestor' NOT NULL,
	"atualizado_por" bigint,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nivel_ciclo_id_tarefa_id_colaborador_id_pk" PRIMARY KEY("ciclo_id","tarefa_id","colaborador_id"),
	CONSTRAINT "nivel_escala_valida" CHECK ("nivel"."valor" between 0 and 4)
);
--> statement-breakpoint
CREATE TABLE "setor" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "setor_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"departamento_id" bigint NOT NULL,
	"nome" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "setor_departamento_nome_key" UNIQUE("departamento_id","nome")
);
--> statement-breakpoint
CREATE TABLE "tarefa" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tarefa_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"setor_id" bigint NOT NULL,
	"descricao" text NOT NULL,
	"periodicidade" "periodicidade" NOT NULL,
	"prazo_ancora" text,
	"peso_criticidade" numeric(3, 1) DEFAULT '1.0' NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"ativa_desde" date DEFAULT current_date NOT NULL,
	"ativa_ate" date,
	CONSTRAINT "tarefa_peso_positivo" CHECK ("tarefa"."peso_criticidade" > 0),
	CONSTRAINT "tarefa_vigencia_coerente" CHECK ("tarefa"."ativa_ate" is null or "tarefa"."ativa_ate" >= "tarefa"."ativa_desde")
);
--> statement-breakpoint
ALTER TABLE "autoavaliacao" ADD CONSTRAINT "autoavaliacao_ciclo_id_ciclo_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autoavaliacao" ADD CONSTRAINT "autoavaliacao_colaborador_id_colaborador_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaborador"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autoavaliacao" ADD CONSTRAINT "autoavaliacao_tarefa_id_tarefa_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autoavaliacao" ADD CONSTRAINT "autoavaliacao_decidido_por_colaborador_id_fk" FOREIGN KEY ("decidido_por") REFERENCES "public"."colaborador"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ciclo" ADD CONSTRAINT "ciclo_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ciclo" ADD CONSTRAINT "ciclo_fechado_por_colaborador_id_fk" FOREIGN KEY ("fechado_por") REFERENCES "public"."colaborador"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colaborador" ADD CONSTRAINT "colaborador_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nivel" ADD CONSTRAINT "nivel_ciclo_id_ciclo_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nivel" ADD CONSTRAINT "nivel_tarefa_id_tarefa_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefa"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nivel" ADD CONSTRAINT "nivel_colaborador_id_colaborador_id_fk" FOREIGN KEY ("colaborador_id") REFERENCES "public"."colaborador"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nivel" ADD CONSTRAINT "nivel_atualizado_por_colaborador_id_fk" FOREIGN KEY ("atualizado_por") REFERENCES "public"."colaborador"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setor" ADD CONSTRAINT "setor_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_setor_id_setor_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "nivel_ciclo_colaborador_idx" ON "nivel" USING btree ("ciclo_id","colaborador_id");--> statement-breakpoint
CREATE INDEX "nivel_ciclo_tarefa_idx" ON "nivel" USING btree ("ciclo_id","tarefa_id");--> statement-breakpoint
CREATE INDEX "tarefa_setor_vigente_idx" ON "tarefa" USING btree ("setor_id") WHERE "tarefa"."ativa_ate" is null;