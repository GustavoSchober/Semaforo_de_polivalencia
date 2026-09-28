import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { departamento } from "@/lib/db/schema";
import { cicloPorId } from "@/lib/db/consultas/ciclos";
import { pessoasDoCiclo, simular } from "@/lib/db/consultas/simulacao";
import { pessoasPorTarefa } from "@/lib/db/consultas/capacidade";
import { referenciaTitulo } from "@/app/componentes/formato";
import { Painel } from "@/app/componentes/moldura";
import { LegendaFarol } from "@/app/componentes/farol";
import { Simulacao } from "./simulacao";

export const dynamic = "force-dynamic";

export default async function Simulador({
  params,
  searchParams,
}: {
  params: Promise<{ ciclo: string }>;
  searchParams: Promise<{ ausentes?: string | string[] }>;
}) {
  const { ciclo: cicloParam } = await params;
  const { ausentes: brutos } = await searchParams;

  const c = await cicloPorId(Number(cicloParam));
  if (!c) notFound();

  const [dep] = await db.select().from(departamento).limit(1);
  const pessoas = await pessoasDoCiclo(c.id);
  const validos = new Set(pessoas.map((p) => p.id));
  const iniciais = (Array.isArray(brutos) ? brutos : brutos ? [brutos] : [])
    .map(Number)
    .filter((n) => validos.has(n));

  const [atual, individuais, porTarefa] = await Promise.all([
    simular(c.id, []),
    Promise.all(
      pessoas.map(async (p) => ({ pessoa: p, cenario: await simular(c.id, [p.id]) })),
    ),
    pessoasPorTarefa(c.id),
  ]);

  // Map não atravessa a fronteira servidor/cliente com garantia; um objeto
  // simples atravessa, e é o que o quadro precisa para nomear quem cobre o quê.
  const elenco = Object.fromEntries(porTarefa);

  return (
    <Painel
      modo="simulador"
      departamento={dep?.nome ?? "—"}
      cicloId={c.id}
      cicloRotulo={referenciaTitulo(c.referencia)}
      cicloFechado={c.status === "fechado"}
      rodape={<LegendaFarol />}
    >
      <div className="border-b border-black px-5 pt-8 pb-6">
        <h1 className="letreiro placa text-[1.375rem] leading-tight">
          E se essa pessoa não estivesse aqui
        </h1>
        <p className="conteudo mt-3 max-w-[74ch] text-[0.9375rem] leading-relaxed text-aco">
          Remova quem quiser da conta e veja quais tarefas ficam descobertas — antes
          de tomar a decisão, não depois. Nada é gravado: esta tela só recalcula.
        </p>
      </div>

      <Simulacao
        cicloId={c.id}
        pessoas={pessoas}
        atual={atual}
        individuais={individuais}
        iniciais={iniciais}
        elenco={elenco}
      />
    </Painel>
  );
}
