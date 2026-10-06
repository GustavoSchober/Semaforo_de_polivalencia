import Link from "next/link";
import { db } from "@/lib/db";
import { departamento } from "@/lib/db/schema";
import { ciclosDoDepartamento } from "@/lib/db/consultas/ciclos";
import { coberturaDoDepartamento } from "@/lib/db/consultas/cobertura";
import { semaforoDoCiclo } from "@/lib/db/consultas/semaforo";
import { farol } from "@/lib/dominio/farol";
import { percentual, referenciaTitulo, tarefas } from "@/app/componentes/formato";
import { Painel } from "@/app/componentes/moldura";
import { PalhetaFixa } from "@/app/componentes/palheta-fixa";
import { Lampada, LegendaFarol } from "@/app/componentes/farol";
import { IconeSeta } from "@/app/componentes/icones";

// lê o banco a cada requisição: sem isto o Next prerenderiza a lista de ciclos
// no momento do build e ela nunca mais muda
export const dynamic = "force-dynamic";

/** A cobertura de um ciclo, em palhetas, do tamanho de uma linha de painel. */
function CoberturaEmPalhetas({ valor }: { valor: number | null | undefined }) {
  if (valor === null || valor === undefined) {
    return <span className="dado text-[0.75rem] text-aco-escuro">sem medida</span>;
  }
  const centesimos = Math.round(valor * 10000);
  const texto = String(centesimos).padStart(4, "0");
  const glifos = texto.split("");

  return (
    <span
      className="flex items-end gap-px"
      role="img"
      aria-label={`cobertura ${percentual(valor)}`}
    >
      {glifos.map((g, i) => (
        <span key={i} className="flex items-end gap-px">
          <PalhetaFixa largura={20} altura={28}>
            {g}
          </PalhetaFixa>
          {i === glifos.length - 3 && (
            <span aria-hidden="true" className="dado pb-1 text-tinta-fraca">
              ,
            </span>
          )}
        </span>
      ))}
      <span aria-hidden="true" className="dado pb-1 pl-1 text-[0.6875rem] text-tinta-fraca">
        %
      </span>
    </span>
  );
}

export default async function Home() {
  const [dep] = await db.select().from(departamento).limit(1);

  if (!dep) {
    return (
      <Painel modo="ciclos" departamento="—">
        <div className="mx-auto max-w-[70ch] px-5 py-20">
          <h1 className="placa text-xl">Painel sem departamento</h1>
          <p className="conteudo mt-4 leading-relaxed text-aco">
            Nenhum departamento cadastrado, então não há catálogo de tarefas para
            medir. Rode{" "}
            <code className="dado bg-flap-sombra px-1.5 py-0.5 text-tinta">
              npm run db:seed
            </code>{" "}
            para carregar os 7 setores e as 64 tarefas reais.
          </p>
        </div>
      </Painel>
    );
  }

  const ciclos = await ciclosDoDepartamento(dep.id);
  const medidas = await Promise.all(
    ciclos.map(async (c) => {
      const [cobertura, linhas] = await Promise.all([
        coberturaDoDepartamento(c.id),
        semaforoDoCiclo(c.id),
      ]);
      return [
        c.id,
        {
          cobertura,
          // tarefas em que no máximo uma pessoa opera sozinha: é o que o índice
          // precisa dizer, senão ele é só uma lista de meses
          exigemAcao: linhas.filter((l) => farol(l.nivel3) === "vermelho").length,
        },
      ] as const;
    }),
  );
  const porCiclo = new Map(medidas);
  const aberto = ciclos.find((c) => c.status === "aberto") ?? ciclos[0];

  return (
    <Painel
      modo="ciclos"
      departamento={dep.nome}
      cicloId={aberto?.id}
      rodape={<LegendaFarol />}
    >
      <div className="px-5 py-10">
        <div className="max-w-[68ch]">
          {/* `w-max` deixa o semáforo passar da coluna de 68ch e ficar ao lado
              do título; em tela estreita ele quebra para baixo. */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:w-max lg:flex-nowrap">
            <h1 className="letreiro placa text-[1.75rem] leading-[1.15]">
              Quantas pessoas sabem fazer cada tarefa
            </h1>
            <span className="caixa-semaforo" aria-hidden="true">
              <Lampada pessoas={0} tamanho={16} />
              <Lampada pessoas={2} tamanho={16} />
              <Lampada pessoas={3} tamanho={16} />
            </span>
          </div>
          <p className="conteudo mt-5 text-[0.9375rem] leading-relaxed text-aco">
            E o que acontece se uma delas sair amanhã. Cada ciclo abaixo é um mês
            congelado do departamento: a matriz que foi preenchida, o risco que ela
            revelou e a simulação de quem não estava lá. Ciclo fechado não se
            reescreve — é dele que sai a curva de evolução de cada pessoa.
          </p>
        </div>

        <h2 className="rotulo mt-12 mb-0">Ciclos</h2>

        <ul className="mt-3 border-t border-black">
          {ciclos.map((c) => {
            const cob = porCiclo.get(c.id);
            return (
              <li key={c.id} className="junta">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-4">
                  <div className="flex min-w-[15rem] items-center gap-4">
                    <span className="placa text-[0.9375rem] text-tinta">
                      {referenciaTitulo(c.referencia)}
                    </span>
                    <span
                      className={`rotulo-forte border px-1.5 py-0.5 text-[0.5625rem] ${
                        c.status === "fechado"
                          ? "border-aco-escuro/60 text-aco"
                          : "border-verde/50 text-verde"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="flex items-end gap-4">
                    <CoberturaEmPalhetas valor={cob?.cobertura?.cobertura} />
                    <span className="rotulo pb-1">
                      de cobertura
                      {cob?.cobertura ? ` · ${tarefas(cob.cobertura.tarefas)}` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Lampada pessoas={cob && cob.exigemAcao > 0 ? 0 : 3} />
                    {cob && cob.exigemAcao > 0 ? (
                      <span className="rotulo-forte text-[0.6875rem] text-vermelho-tinta">
                        {cob.exigemAcao}{" "}
                        {cob.exigemAcao === 1 ? "tarefa exige" : "tarefas exigem"} ação
                      </span>
                    ) : (
                      <span className="rotulo">nenhuma tarefa em vermelho</span>
                    )}
                  </div>

                  <nav
                    className="ml-auto flex flex-wrap items-center gap-2"
                    aria-label={`Modos do ciclo ${referenciaTitulo(c.referencia)}`}
                  >
                    {[
                      { rotulo: "Painel de risco", href: `/painel/${c.id}` },
                      { rotulo: "Matriz", href: `/matriz/${c.id}` },
                      { rotulo: "Simulador", href: `/simulador/${c.id}` },
                    ].map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="rotulo flex items-center gap-2 border border-aco-escuro/45 px-3 py-2 transition-colors hover:border-ambar hover:text-ambar"
                      >
                        {l.rotulo}
                        <IconeSeta className="h-3 w-3" />
                      </Link>
                    ))}
                  </nav>
                </div>
              </li>
            );
          })}
        </ul>

        {ciclos.length === 0 && (
          <p className="conteudo mt-4 max-w-[70ch] leading-relaxed text-aco">
            Nenhum ciclo aberto ainda. Abrir e fechar ciclo pela interface é a
            próxima etapa; hoje isso é feito por SQL.
          </p>
        )}

        <h2 className="rotulo mt-14">Entre ciclos</h2>
        <Link
          href="/evolucao"
          className="junta mt-3 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-black py-4 transition-colors hover:bg-flap-sombra"
        >
          <span className="placa min-w-[15rem] text-[0.9375rem] text-tinta">
            Evolução
          </span>
          <span className="conteudo max-w-[58ch] text-[0.8125rem] leading-relaxed text-aco">
            Pontos por colaborador e cobertura do departamento ao longo dos meses. A
            leitura decisiva não é a posição, é a inclinação.
          </span>
          <IconeSeta className="ml-auto text-aco-escuro" />
        </Link>
      </div>
    </Painel>
  );
}
