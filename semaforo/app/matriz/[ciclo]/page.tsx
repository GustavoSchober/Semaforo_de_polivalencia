import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { departamento } from "@/lib/db/schema";
import { matrizDoCiclo } from "@/lib/db/consultas/matriz";
import { cicloPorId } from "@/lib/db/consultas/ciclos";
import { usuarioAtual, semAutenticacao } from "@/lib/auth/sessao";
import { podeEditarMatriz } from "@/lib/auth/permissoes";
import { referenciaTitulo } from "@/app/componentes/formato";
import { Painel } from "@/app/componentes/moldura";
import { AvisoDeServico } from "@/app/componentes/aviso";
import { LegendaFarol, LegendaNiveis } from "@/app/componentes/farol";
import { Grade } from "./grade";

export const dynamic = "force-dynamic";

export default async function Matriz({
  params,
}: {
  params: Promise<{ ciclo: string }>;
}) {
  const { ciclo: cicloParam } = await params;
  const c = await cicloPorId(Number(cicloParam));
  if (!c) notFound();

  const [dep] = await db.select().from(departamento).limit(1);
  const u = await usuarioAtual();
  const editavel = podeEditarMatriz(u, c);
  const { pessoas, tarefas } = await matrizDoCiclo(c.id);

  return (
    <Painel
      modo="matriz"
      departamento={dep?.nome ?? "—"}
      cicloId={c.id}
      cicloRotulo={referenciaTitulo(c.referencia)}
      cicloFechado={c.status === "fechado"}
      rodape={
        /* Uma linha só. A régua tem que ficar junto do resultado, mas cada
           pixel de rodapé fixo custa uma tarefa fora da vista. */
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <LegendaNiveis />
          <LegendaFarol />
          <p className="conteudo text-[0.75rem] text-aco">
            <span className="rotulo mr-2">Teclado</span>
            setas movem · 0 a 4 marcam direto
            <span className="rotulo mx-2">Mouse</span>
            clique avança · shift volta
            <span className="rotulo mx-2">Gravação</span>
            não há botão salvar
          </p>
        </div>
      }
    >
      <Grade
        cicloId={c.id}
        pessoas={pessoas}
        tarefas={tarefas}
        editavel={editavel}
        avisos={
          <>
            {c.status === "fechado" && (
              <AvisoDeServico titulo="Ciclo fechado">
          Este ciclo está congelado e é imutável, inclusive para o gestor. Ele é a
          fonte da curva de evolução de cada pessoa — reescrevê-lo apagaria o
          histórico que dá sentido à comparação. Para corrigir, o ciclo precisa ser
                reaberto, e a reabertura fica registrada.
              </AvisoDeServico>
            )}

            {semAutenticacao && (
              <AvisoDeServico titulo="Sem autenticação">
                A sessão está fixa em{" "}
                <strong className="text-tinta">{u.nome}</strong> ({u.papel}).
                Qualquer pessoa que alcance este servidor escreve na matriz com esse
                papel. Os dados aqui embasam promoção e desligamento: não sirva esta
                aplicação fora de localhost até o ADR-005 estar implementado.
              </AvisoDeServico>
            )}
          </>
        }
      />
    </Painel>
  );
}
