import Link from "next/link";
import { db } from "@/lib/db";
import { departamento } from "@/lib/db/schema";
import { ciclosDoDepartamento } from "@/lib/db/consultas/ciclos";
import { coberturaDoDepartamento } from "@/lib/db/consultas/cobertura";
import { celulasHerdadas, garantirCicloDoMes } from "@/lib/db/ciclo-vigente";
import { usuarioAtual } from "@/lib/auth/sessao";
import { podeAdministrar } from "@/lib/auth/permissoes";
import { Painel } from "@/app/componentes/moldura";
import { AvisoDeServico } from "@/app/componentes/aviso";
import { IconeSeta } from "@/app/componentes/icones";
import { percentual, referenciaTitulo } from "@/app/componentes/formato";
import { alternarCiclo } from "../actions";
import { BotaoDeAcao } from "../formularios";

export const dynamic = "force-dynamic";

export default async function Ciclos() {
  const [dep] = await db.select().from(departamento).limit(1);
  if (!dep) {
    return (
      <Painel modo="gerenciar" departamento="—">
        <div className="px-5 py-16">
          <p className="conteudo text-aco">
            Rode <code className="dado bg-flap-sombra px-1.5 py-0.5">npm run db:seed</code>.
          </p>
        </div>
      </Painel>
    );
  }

  const vigente = await garantirCicloDoMes(dep.id);
  const u = await usuarioAtual();
  const podeMexer = podeAdministrar(u, dep.id);

  const ciclos = await ciclosDoDepartamento(dep.id);
  const medidas = await Promise.all(
    ciclos.map(async (c) => {
      const [cob, herdadas] = await Promise.all([
        coberturaDoDepartamento(c.id),
        celulasHerdadas(c.id),
      ]);
      return [c.id, { cob, herdadas }] as const;
    }),
  );
  const porCiclo = new Map(medidas);

  return (
    <Painel
      modo="gerenciar"
      departamento={dep.nome}
      cicloId={vigente?.id}
      cicloRotulo={vigente ? referenciaTitulo(vigente.referencia) : undefined}
      cicloFechado={vigente?.status === "fechado"}
    >
      <div className="px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div className="max-w-[66ch]">
            <h1 className="letreiro placa text-[1.375rem] leading-tight">
              A virada do mês acontece sozinha
            </h1>
            <p className="conteudo mt-3.5 text-[0.9375rem] leading-relaxed text-aco">
              No primeiro acesso depois da meia-noite do dia 1º, o mês anterior é
              fechado e congelado, o novo é aberto, e os níveis são herdados do mês
              que passou — com as mesmas pessoas e as mesmas tarefas. A cobertura não
              despenca a zero, e cada célula herdada fica marcada como herdada até
              alguém confirmar. Nada aqui depende de rodar SQL nem de editar arquivo.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link href="/gerenciar" className="botao-fantasma">
              Equipe
              <IconeSeta className="h-3 w-3" />
            </Link>
            <Link href="/gerenciar/catalogo" className="botao-fantasma">
              Catálogo
              <IconeSeta className="h-3 w-3" />
            </Link>
          </nav>
        </div>

        {vigente?.viradoAgora && (
          <AvisoDeServico className="mt-8 border-t border-black" titulo="Mês virado agora">
            {referenciaTitulo(vigente.referencia)} foi aberto nesta requisição, com os
            níveis herdados do ciclo anterior.
          </AvisoDeServico>
        )}

        <ul className="mt-10 border-t border-black">
          {ciclos.map((c) => {
            const m = porCiclo.get(c.id);
            const aberto = c.status === "aberto";
            const pctHerdado =
              m && m.herdadas.total > 0
                ? Math.round((m.herdadas.herdadas / m.herdadas.total) * 100)
                : 0;

            return (
              <li key={c.id} className="junta py-4">
                <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
                  <span className="flex min-w-[20rem] flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="placa text-[0.9375rem]">
                      {referenciaTitulo(c.referencia)}
                    </span>
                    <span
                      className={`rotulo-forte border px-1.5 py-0.5 text-[0.5625rem] ${
                        aberto
                          ? "border-verde/50 text-verde"
                          : "border-aco-escuro/60 text-aco"
                      }`}
                    >
                      {c.status}
                    </span>
                    {pctHerdado > 0 && (
                      <span
                        className="rotulo"
                        title="células copiadas na virada e ainda não confirmadas neste ciclo"
                      >
                        {pctHerdado}% herdado
                      </span>
                    )}
                  </span>

                  <span className="dado w-24 text-right text-[0.9375rem]">
                    {percentual(m?.cob?.cobertura)}
                  </span>

                  <nav className="flex flex-wrap items-center gap-2">
                    <Link href={`/matriz/${c.id}`} className="rotulo hover:text-ambar">
                      matriz
                    </Link>
                    <Link href={`/painel/${c.id}`} className="rotulo hover:text-ambar">
                      painel
                    </Link>
                    <Link href={`/simulador/${c.id}`} className="rotulo hover:text-ambar">
                      simulador
                    </Link>
                    {podeMexer && (
                      <BotaoDeAcao
                        acao={alternarCiclo}
                        campos={{ id: c.id, acao: aberto ? "fechar" : "reabrir" }}
                        className={aberto ? "botao-fantasma botao-perigo" : "botao-fantasma"}
                        confirmar={
                          aberto
                            ? `Fechar ${referenciaTitulo(c.referencia)} antes do fim do mês? Ninguém mais consegue marcar nada nele, nem o gestor. Dá para reabrir depois.`
                            : `Reabrir ${referenciaTitulo(c.referencia)}? Ele voltará a aceitar alterações, e os números que já foram apresentados a partir dele podem mudar.`
                        }
                      >
                        {aberto ? "Fechar" : "Reabrir"}
                      </BotaoDeAcao>
                    )}
                  </nav>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Painel>
  );
}
