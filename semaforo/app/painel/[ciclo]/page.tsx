import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { departamento } from "@/lib/db/schema";
import { semaforoDoCiclo, type LinhaSemaforo } from "@/lib/db/consultas/semaforo";
import {
  celulasPendentes,
  coberturaDoDepartamento,
  coberturaPorSetor,
} from "@/lib/db/consultas/cobertura";
import { cicloAnterior, cicloPorId } from "@/lib/db/consultas/ciclos";
import { pessoasPorTarefa, type PessoaNaTarefa } from "@/lib/db/consultas/capacidade";
import { quemAlcanca } from "@/lib/dominio/elenco";
import { ROTULO_NIVEL, type Nivel } from "@/lib/dominio/constantes";
import { Explicacao, LinhaDePessoa } from "@/app/componentes/explicacao";
import { farol, falsaSeguranca } from "@/lib/dominio/farol";
import { criticidade } from "@/lib/dominio/criticidade";
import { Painel } from "@/app/componentes/moldura";
import { AvisoDeServico } from "@/app/componentes/aviso";
import { ContadorCobertura } from "@/app/componentes/contador";
import {
  CelulaFarol,
  Lampada,
  LegendaFarol,
  LegendaNiveis,
  PlacaSituacao,
} from "@/app/componentes/farol";
import {
  horarioDaTarefa,
  percentual,
  referenciaLegivel,
  referenciaTitulo,
  tarefas as contaTarefas,
  variacaoPercentual,
} from "@/app/componentes/formato";

export const dynamic = "force-dynamic";

/**
 * Uma fileira do painel: lâmpada, valor, destino, nota.
 *
 * É deliberadamente a gramática de uma linha de partida — e não rótulo em cima,
 * número grande embaixo, lado a lado. Essa segunda forma é exatamente o arranjo
 * que a tese desta direção recusa pelo nome: transforma risco operacional em
 * relatório. Aqui cada número é uma linha viva com situação.
 */
function Fileira({
  valor,
  destino,
  nota,
  alerta = false,
}: {
  valor: React.ReactNode;
  destino: string;
  nota: string;
  alerta?: boolean;
}) {
  return (
    <div className="junta flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2 last:border-b-0">
      <span className="flex w-4 shrink-0 translate-y-[-2px] justify-center">
        <Lampada pessoas={alerta ? 0 : 3} tamanho={6} />
      </span>
      <span
        className={`dado w-24 shrink-0 text-[1.25rem] leading-none ${
          alerta ? "text-vermelho-tinta" : "text-tinta"
        }`}
      >
        {valor}
      </span>
      <span className="rotulo-forte w-[22ch] shrink-0 text-[0.6875rem]">
        {destino}
      </span>
      <span className="rotulo normal-case">{nota}</span>
    </div>
  );
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 first:mt-0">
      <h2 className="placa text-[0.9375rem] text-tinta">{titulo}</h2>
      {descricao && (
        <p className="conteudo mt-2.5 max-w-[78ch] text-[0.8125rem] leading-relaxed text-aco">
          {descricao}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function PainelDeRisco({
  params,
}: {
  params: Promise<{ ciclo: string }>;
}) {
  const { ciclo: cicloParam } = await params;
  const c = await cicloPorId(Number(cicloParam));
  if (!c) notFound();

  const [dep] = await db.select().from(departamento).limit(1);
  const anterior = await cicloAnterior(c);
  const [linhas, setores, global, pendentes, globalAnterior, elenco] =
    await Promise.all([
      semaforoDoCiclo(c.id),
      coberturaPorSetor(c.id),
      coberturaDoDepartamento(c.id),
      celulasPendentes(c.id),
      anterior ? coberturaDoDepartamento(anterior.id) : Promise.resolve(null),
      pessoasPorTarefa(c.id),
    ]);

  const delta =
    global && globalAnterior ? global.cobertura - globalAnterior.cobertura : null;

  // Plano de ação: tarefas com semáforo 0 ou 1 no nível que mais importa para
  // risco — quem opera sozinho. Ordenadas por criticidade ponderada, que serve
  // APENAS para ordenar enquanto a fórmula não for validada com o gestor.
  const planoDeAcao = linhas
    .filter((l) => farol(l.nivel3) === "vermelho")
    .map((l) => ({
      ...l,
      score: criticidade({ nivel_3: l.nivel3, nivel_4: l.nivel4 }, l.peso),
    }))
    .sort((a, b) => b.score - a.score);

  const semEspecialista = linhas.filter((l) => l.nivel4 === 0);
  const semNinguem = linhas.filter((l) => l.nivel1 === 0);
  const falsasSegurancas = linhas.filter((l) =>
    falsaSeguranca({ nivel_1: l.nivel1, nivel_4: l.nivel4 }),
  );

  // quantas tarefas em vermelho por setor: é o que dá cor à lista de setores
  // sem inventar um farol que a regra não define para agregados
  const vermelhasPorSetor = new Map<string, number>();
  for (const l of linhas) {
    if (farol(l.nivel3) === "vermelho") {
      vermelhasPorSetor.set(l.setor, (vermelhasPorSetor.get(l.setor) ?? 0) + 1);
    }
  }

  const porSetor = Object.entries(Object.groupBy(linhas, (l) => l.setor)) as [
    string,
    LinhaSemaforo[],
  ][];

  return (
    <Painel
      modo="painel"
      departamento={dep?.nome ?? "—"}
      cicloId={c.id}
      cicloRotulo={referenciaTitulo(c.referencia)}
      cicloFechado={c.status === "fechado"}
      direita={
        <div className="flex flex-col gap-5">
          <ContadorCobertura valor={global?.cobertura} tamanho="linha" />
          <div className="border-t border-black">
            <Fileira
              valor={delta === null ? "—" : variacaoPercentual(delta)}
              destino="Contra o ciclo anterior"
              nota={
                anterior
                  ? referenciaLegivel(anterior.referencia)
                  : "primeiro ciclo medido"
              }
              alerta={delta !== null && delta < 0}
            />
            <Fileira
              valor={planoDeAcao.length}
              destino="Um erro derruba a tarefa"
              nota="no máximo 1 pessoa opera sozinha"
              alerta={planoDeAcao.length > 0}
            />
            <Fileira
              valor={semEspecialista.length}
              destino="Ninguém sabe ensinar"
              nota="nenhuma pessoa chegou ao nível 4"
              alerta={semEspecialista.length > 0}
            />
            <Fileira
              valor={semNinguem.length}
              destino="Ninguém executa"
              nota="nem no nível 1"
              alerta={semNinguem.length > 0}
            />
          </div>
        </div>
      }
      rodape={<LegendaFarol />}
    >
      {pendentes.pendentes > 0 && (
        <AvisoDeServico tom="alerta" titulo="Cobertura subestimada">
          <strong className="text-tinta">{pendentes.pendentes}</strong> de{" "}
          {pendentes.total} células ainda não foram avaliadas neste ciclo. Elas contam
          como zero em todos os percentuais desta tela, então a situação real do
          departamento é melhor do que o painel mostra. Terminar o preenchimento é o
          que torna estes números apresentáveis.
        </AvisoDeServico>
      )}

      <div className="px-5 py-10">
        <Secao
          titulo="Cobertura por setor"
          descricao="Do pior para o melhor — o setor mais exposto aparece primeiro, e não no meio de uma lista posicional. A contagem à direita é o que exige ação: tarefas em que no máximo uma pessoa opera sozinha."
        >
          <ul className="border-t border-black">
            {setores.map((s) => {
              const vermelhas = vermelhasPorSetor.get(s.setor) ?? 0;
              return (
                <li
                  key={s.setor}
                  className="junta flex flex-wrap items-center gap-x-6 gap-y-3 py-3.5"
                >
                  <span className="placa min-w-[16rem] text-[0.75rem] text-tinta">
                    {s.setor}
                  </span>
                  <span className="rotulo w-24">{contaTarefas(s.tarefas)}</span>

                  <span className="flex min-w-[14rem] grow items-center gap-4">
                    <span
                      className="relative h-[5px] w-full overflow-hidden bg-flap-borda"
                      aria-hidden="true"
                    >
                      {/* recessiva de propósito: a cobertura do setor é
                          contexto, e o número de tarefas que exigem ação é a
                          notícia. Uma barra branca grossa invertia essa ordem. */}
                      <span
                        className="absolute inset-y-0 left-0 bg-aco-escuro"
                        style={{ width: `${Math.min(s.cobertura * 100, 100)}%` }}
                      />
                    </span>
                    <span className="dado w-20 shrink-0 text-right text-[0.8125rem]">
                      {percentual(s.cobertura)}
                    </span>
                  </span>

                  <span className="flex w-52 shrink-0 items-center justify-end gap-2.5">
                    {vermelhas > 0 ? (
                      <>
                        <Lampada pessoas={0} />
                        <span className="rotulo-forte text-[0.6875rem] text-vermelho-tinta">
                          {vermelhas} exigem ação
                        </span>
                      </>
                    ) : (
                      <>
                        <Lampada pessoas={3} />
                        <span className="dado text-[0.75rem] tracking-wider text-tinta-fraca uppercase">
                          nenhuma em vermelho
                        </span>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Secao>

        <Secao
          titulo="Plano de ação"
          descricao="Tarefas em que no máximo uma pessoa opera sozinha — se ela faltar, a tarefa para. A ordem pondera o prazo legal da obrigação: uma entrega com data fixa sobe na frente de uma tarefa diária."
        >
          {planoDeAcao.length === 0 ? (
            <p className="conteudo max-w-[70ch] border-t border-black py-6 leading-relaxed text-aco">
              Nenhuma tarefa do catálogo depende de uma pessoa só. Isso é raro e vale
              conferir se o preenchimento está completo antes de comemorar.
            </p>
          ) : (
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr className="aco-escura">
                  <th scope="col" className="rotulo border-b border-black px-4 py-2.5">
                    Prazo
                  </th>
                  <th scope="col" className="rotulo border-b border-black py-2.5 pr-6">
                    Tarefa
                  </th>
                  <th scope="col" className="rotulo border-b border-black py-2.5 pr-6">
                    Setor
                  </th>
                  <th
                    scope="col"
                    className="rotulo border-b border-black px-2 py-2.5 text-center"
                    title="quantas pessoas operam sozinhas"
                  >
                    Sozinho
                  </th>
                  <th
                    scope="col"
                    className="rotulo border-b border-black px-2 py-2.5 text-center"
                    title="quantas pessoas sabem ensinar"
                  >
                    Ensina
                  </th>
                  <th scope="col" className="rotulo border-b border-black px-4 py-2.5 text-right">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {planoDeAcao.map((l) => (
                  <tr key={l.tarefaId} className="junta">
                    <td className="dado px-4 py-2 text-[0.6875rem] tracking-widest whitespace-nowrap text-aco uppercase">
                      {horarioDaTarefa(l.prazoAncora, l.periodicidade)}
                    </td>
                    <td className="conteudo max-w-[38rem] py-2 pr-6 text-[0.8125rem] leading-snug">
                      {l.descricao}
                    </td>
                    <td className="rotulo py-2 pr-6 whitespace-nowrap">{l.setor}</td>
                    <td className="px-2 py-2 text-center">
                      <QuemFaz
                        elenco={elenco.get(l.tarefaId)}
                        nivel={3}
                        quantidade={l.nivel3}
                        titulo={`Operam sozinhas — ${l.descricao}`}
                        vazio="Ninguém opera esta tarefa sozinho."
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <QuemFaz
                        elenco={elenco.get(l.tarefaId)}
                        nivel={4}
                        quantidade={l.nivel4}
                        titulo={`Sabem ensinar — ${l.descricao}`}
                        vazio="Ninguém sabe ensinar esta tarefa."
                        alinhar="direita"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <PlacaSituacao pessoas={l.nivel3} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="conteudo mt-4 max-w-[78ch] text-[0.75rem] leading-relaxed text-aco-escuro">
            A fórmula de criticidade que define esta ordem é proposta da arquitetura e
            ainda não foi validada com o gestor. Ela ordena a lista e nada mais — não é
            indicador publicável enquanto não for validada.
          </p>
        </Secao>

        {falsasSegurancas.length > 0 && (
          <Secao
            titulo="Falsa sensação de segurança"
            descricao={`${falsasSegurancas.length} tarefas parecem cobertas — três ou mais pessoas têm contato com elas — mas no máximo uma sabe ensinar. A operação do dia a dia está de pé; a capacidade de formar substituto, não. É o risco que só aparece quando alguém sai.`}
          >
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr className="aco-escura">
                  <th scope="col" className="rotulo border-b border-black px-4 py-2.5">
                    Setor
                  </th>
                  <th scope="col" className="rotulo border-b border-black py-2.5 pr-6">
                    Tarefa
                  </th>
                  <th scope="col" className="rotulo border-b border-black px-3 py-2.5 text-center">
                    Têm contato
                  </th>
                  <th scope="col" className="rotulo border-b border-black px-3 py-2.5 text-center">
                    Sabem ensinar
                  </th>
                </tr>
              </thead>
              <tbody>
                {falsasSegurancas.map((l) => (
                  <tr key={l.tarefaId} className="junta">
                    <td className="rotulo px-4 py-2 whitespace-nowrap">{l.setor}</td>
                    <td className="conteudo max-w-[42rem] py-2 pr-6 text-[0.8125rem] leading-snug">
                      {l.descricao}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <QuemFaz
                        elenco={elenco.get(l.tarefaId)}
                        nivel={1}
                        quantidade={l.nivel1}
                        titulo={`Têm contato — ${l.descricao}`}
                        vazio="Ninguém tem contato com esta tarefa."
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <QuemFaz
                        elenco={elenco.get(l.tarefaId)}
                        nivel={4}
                        quantidade={l.nivel4}
                        titulo={`Sabem ensinar — ${l.descricao}`}
                        vazio="Ninguém sabe ensinar esta tarefa."
                        alinhar="direita"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Secao>
        )}

        <Secao
          titulo="Semáforo completo"
          descricao="O catálogo inteiro, setor a setor. As quatro colunas contam PESSOAS, não níveis, e são cumulativas: quem sabe ensinar (4) também é contado em 3, 2 e 1. Por isso três pessoas no nível 4 imprimem 3 · 3 · 3 · 3 — é a mesma trinca contada quatro vezes, e não doze pessoas. A lâmpada e a lista de nomes acompanham o nível 3."
        >
          <LegendaNiveis className="mb-6" />
          <div className="space-y-10">
            {porSetor.map(([setor, linhasDoSetor]) => (
              <div key={setor}>
                <div className="aco flex flex-wrap items-baseline gap-x-4 border-y border-black px-4 py-1.5">
                  <span className="placa text-[0.6875rem] text-tinta">{setor}</span>
                  <span className="dado text-[0.625rem] tracking-widest text-aco-escuro uppercase">
                    {contaTarefas(linhasDoSetor.length)}
                  </span>
                </div>
                <table className="w-full border-separate border-spacing-0 text-left">
                  <caption className="sr-only">
                    Semáforo do setor {setor}: quantas pessoas atingem cada nível ou
                    acima, em cada tarefa.
                  </caption>
                  {/* Sem este cabeçalho as quatro células eram quatro números sem
                      dono. É o que fazia "3 3 3 3" ser lido como quatro pessoas em
                      vez de uma mesma trinca contada em quatro níveis. */}
                  <thead>
                    <tr>
                      <td className="w-28" />
                      <td />
                      <td className="w-44 pb-1">
                        <span className="flex items-center justify-end gap-1">
                          {([1, 2, 3, 4] as const).map((n) => (
                            <span
                              key={n}
                              className="dado w-[26px] shrink-0 text-center text-[0.5625rem] tracking-wider text-aco-escuro uppercase"
                              title={`Pessoas em nível ${n} ou acima — ${ROTULO_NIVEL[n].toLowerCase()}`}
                            >
                              N{n}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="w-14" />
                    </tr>
                  </thead>
                  <tbody>
                    {linhasDoSetor.map((l) => (
                      <tr key={l.tarefaId} className="junta">
                        <td className="dado w-28 px-4 py-1.5 text-[0.6875rem] tracking-widest whitespace-nowrap text-aco-escuro uppercase">
                          {horarioDaTarefa(l.prazoAncora, l.periodicidade)}
                        </td>
                        <th
                          scope="row"
                          className="conteudo py-1.5 pr-6 text-left text-[0.8125rem] leading-snug font-normal text-tinta"
                        >
                          {l.descricao}
                        </th>
                        <td className="w-44 py-1.5">
                          <span className="flex items-center justify-end gap-1">
                            <CelulaFarol pessoas={l.nivel1} nivel={1} largura={26} altura={30} />
                            <CelulaFarol pessoas={l.nivel2} nivel={2} largura={26} altura={30} />
                            <CelulaFarol pessoas={l.nivel3} nivel={3} largura={26} altura={30} />
                            <CelulaFarol pessoas={l.nivel4} nivel={4} largura={26} altura={30} />
                          </span>
                        </td>
                        <td className="w-14 py-1.5 pr-4">
                          <span className="flex justify-end">
                            <Explicacao
                              alinhar="direita"
                              titulo={`Quem está nesta tarefa, com o nível de cada um — ${l.descricao}`}
                              vazio="Ninguém foi avaliado nesta tarefa."
                              rotulo={<Lampada pessoas={l.nivel3} />}
                            >
                              {(elenco.get(l.tarefaId) ?? [])
                                .filter((p) => p.avaliado && p.valor > 0)
                                .map((p) => (
                                  <LinhaDePessoa
                                    key={p.colaboradorId}
                                    nome={p.nome}
                                    nivel={p.valor}
                                    nota={ROTULO_NIVEL[p.valor as Nivel]}
                                    herdado={p.herdado}
                                  />
                                ))}
                            </Explicacao>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Secao>
      </div>
    </Painel>
  );
}

/**
 * O número do semáforo, com os nomes por trás.
 *
 * O painel dizia "1" e o gestor tinha de ir à matriz descobrir quem era esse 1.
 * Agora a lista está no próprio número — que é o que transforma o indicador em
 * decisão: dá para pedir ajuda, marcar treinamento ou escolher substituto sem
 * sair da tela.
 */
function QuemFaz({
  elenco,
  nivel,
  quantidade,
  titulo,
  vazio,
  alinhar = "esquerda",
}: {
  elenco: PessoaNaTarefa[] | undefined;
  nivel: number;
  quantidade: number;
  titulo: string;
  vazio: string;
  alinhar?: "esquerda" | "direita";
}) {
  const pessoas = quemAlcanca(elenco, nivel);
  return (
    <Explicacao
      titulo={titulo}
      vazio={vazio}
      alinhar={alinhar}
      rotulo={<CelulaFarol pessoas={quantidade} nivel={nivel as Nivel} largura={26} altura={30} />}
    >
      {pessoas.map((p) => (
        <LinhaDePessoa
          key={p.colaboradorId}
          nome={p.nome}
          nivel={p.valor}
          nota={ROTULO_NIVEL[p.valor as Nivel]}
          herdado={p.herdado}
        />
      ))}
    </Explicacao>
  );
}
