import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { departamento } from "@/lib/db/schema";
import { garantirCicloDoMes } from "@/lib/db/ciclo-vigente";
import { tarefaPorId } from "@/lib/db/consultas/administracao";
import { pessoasPorTarefa } from "@/lib/db/consultas/capacidade";
import { usuarioAtual } from "@/lib/auth/sessao";
import { podeAdministrar } from "@/lib/auth/permissoes";
import { Painel } from "@/app/componentes/moldura";
import { AvisoDeServico } from "@/app/componentes/aviso";
import { LegendaNiveis } from "@/app/componentes/farol";
import { IconeSeta } from "@/app/componentes/icones";
import { horarioDaTarefa, referenciaTitulo } from "@/app/componentes/formato";
import { QuadroDaTarefa } from "./quadro";

export const dynamic = "force-dynamic";

export default async function TarefaDetalhe({
  params,
}: {
  params: Promise<{ tarefa: string }>;
}) {
  const { tarefa: param } = await params;
  const t = await tarefaPorId(Number(param));
  if (!t) notFound();

  const [dep] = await db.select().from(departamento).limit(1);
  const ciclo = await garantirCicloDoMes(t.departamentoId);
  const u = await usuarioAtual();
  const editavel =
    podeAdministrar(u, t.departamentoId) && ciclo?.status === "aberto" && t.ativa;

  const porTarefa = ciclo ? await pessoasPorTarefa(ciclo.id) : new Map();
  const pessoas = porTarefa.get(t.id) ?? [];

  return (
    <Painel
      modo="gerenciar"
      departamento={dep?.nome ?? "—"}
      cicloId={ciclo?.id}
      cicloRotulo={ciclo ? referenciaTitulo(ciclo.referencia) : undefined}
      cicloFechado={ciclo?.status === "fechado"}
      rodape={<LegendaNiveis />}
    >
      <div className="border-b border-black px-5 pt-8 pb-6">
        <Link href="/gerenciar/catalogo" className="rotulo hover:text-ambar">
          ← Catálogo de tarefas
        </Link>
        <h1 className="conteudo mt-3 max-w-[70ch] text-[1.25rem] leading-snug text-tinta">
          {t.descricao}
        </h1>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <span className="rotulo-forte text-[0.6875rem]">{t.setor}</span>
          <span className="dado text-[0.6875rem] tracking-widest text-aco uppercase">
            {horarioDaTarefa(t.prazoAncora, t.periodicidade)}
          </span>
          {!t.ativa && (
            <span className="rotulo-forte border border-aco-escuro/60 px-1.5 py-0.5 text-[0.5625rem] text-aco">
              fora do catálogo desde {t.ativaAte}
            </span>
          )}
        </p>
      </div>

      {!t.ativa && (
        <AvisoDeServico titulo="Fora do catálogo">
          Esta tarefa não conta mais nos indicadores do mês corrente e não pode ser
          editada. Ela continua nos ciclos fechados em que existia. Para voltar a
          usá-la, traga-a de volta pelo catálogo.
        </AvisoDeServico>
      )}

      {t.ativa && ciclo?.status !== "aberto" && (
        <AvisoDeServico titulo="Ciclo fechado">
          O mês corrente está fechado, então os níveis não podem ser alterados —
          inclusive pelo gestor.
        </AvisoDeServico>
      )}

      {pessoas.length === 0 ? (
        <div className="px-5 py-14">
          <p className="conteudo max-w-[70ch] leading-relaxed text-aco">
            Ninguém do departamento está associado a esta tarefa no ciclo aberto.
            Cadastre pessoas na equipe e elas aparecem aqui automaticamente.
          </p>
          <Link href="/gerenciar" className="botao-fantasma mt-5">
            Ir para a equipe
            <IconeSeta className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <QuadroDaTarefa tarefaId={t.id} pessoas={pessoas} editavel={!!editavel} />
      )}
    </Painel>
  );
}
