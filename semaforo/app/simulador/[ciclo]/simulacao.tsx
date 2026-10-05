"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type {
  Cenario,
  LinhaSimulada,
  PessoaSimulavel,
} from "@/lib/db/consultas/simulacao";
import { quemRestaria, type PessoaEmTarefa } from "@/lib/dominio/elenco";
import { Explicacao, LinhaDePessoa } from "@/app/componentes/explicacao";
import { ROTULO_NIVEL, type Nivel } from "@/lib/dominio/constantes";
import { farol } from "@/lib/dominio/farol";
import { Palheta, PalhetaNumero, SEQUENCIA_DIGITO } from "@/app/componentes/palheta";
import { ContadorCobertura } from "@/app/componentes/contador";
import { Lampada, TOM_FAROL, situacao } from "@/app/componentes/farol";
import { AvisoDeServico } from "@/app/componentes/aviso";
import { percentual, tarefas as contaTarefas } from "@/app/componentes/formato";
import { IconeSeta } from "@/app/componentes/icones";
import { simularAusencia } from "./actions";

/**
 * A onda de reflape.
 *
 * Marcar alguém como ausente não recarrega a tela: o painel inteiro rola para a
 * nova situação na frente de quem está decidindo. É o momento autoral desta
 * interface, e é a diferença entre ler "12 tarefas ficam descobertas" e ver as
 * doze caírem.
 */
export function Simulacao({
  cicloId,
  pessoas,
  atual,
  individuais,
  iniciais,
  elenco,
}: {
  cicloId: number;
  pessoas: PessoaSimulavel[];
  atual: Cenario;
  individuais: { pessoa: PessoaSimulavel; cenario: Cenario }[];
  iniciais: number[];
  /** quem está em cada tarefa, para o painel dizer QUEM e não só quantos */
  elenco: Record<number, PessoaEmTarefa[]>;
}) {
  const [ausentes, setAusentes] = useState<number[]>(iniciais);
  const [cenario, setCenario] = useState<Cenario>(atual);
  const [carregando, iniciarTransicao] = useTransition();
  const [falha, setFalha] = useState<string | null>(null);

  // o cenário inicial vindo de um link compartilhado
  useEffect(() => {
    if (iniciais.length === 0) return;
    iniciarTransicao(async () => {
      try {
        setCenario(await simularAusencia(cicloId, iniciais));
      } catch {
        setFalha("Não foi possível calcular a simulação.");
      }
    });
    // roda só na montagem: depois disso quem manda é o clique
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function alternar(id: number) {
    const proximos = ausentes.includes(id)
      ? ausentes.filter((x) => x !== id)
      : [...ausentes, id];

    setAusentes(proximos);
    setFalha(null);

    // mantém o link compartilhável sem custar um re-render do servidor
    const url = new URL(window.location.href);
    url.searchParams.delete("ausentes");
    proximos.forEach((p) => url.searchParams.append("ausentes", String(p)));
    window.history.replaceState(null, "", url);

    iniciarTransicao(async () => {
      try {
        setCenario(await simularAusencia(cicloId, proximos));
      } catch {
        setFalha("Não foi possível calcular a simulação. Tente de novo.");
      }
    });
  }

  function limpar() {
    setAusentes([]);
    setFalha(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("ausentes");
    window.history.replaceState(null, "", url);
    iniciarTransicao(async () => {
      setCenario(await simularAusencia(cicloId, []));
    });
  }

  const selecionadas = pessoas.filter((p) => ausentes.includes(p.id));
  const naoConfiaveis = selecionadas.filter((p) => p.pendentes > 0);

  const base = useMemo(
    () => new Map(atual.linhas.map((l) => [l.tarefaId, l])),
    [atual.linhas],
  );

  // tarefas que estavam cobertas e deixam de estar
  const novasVermelhas = useMemo(
    () =>
      cenario.linhas.filter((l) => {
        const antes = base.get(l.tarefaId);
        if (!antes) return false;
        return farol(antes.nivel3) !== "vermelho" && farol(l.nivel3) === "vermelho";
      }),
    [cenario.linhas, base],
  );

  const porSetor = useMemo(() => {
    const grupos: { setor: string; linhas: LinhaSimulada[] }[] = [];
    for (const l of cenario.linhas) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.setor === l.setor) ultimo.linhas.push(l);
      else grupos.push({ setor: l.setor, linhas: [l] });
    }
    return grupos;
  }, [cenario.linhas]);

  const simulando = ausentes.length > 0;

  return (
    <>
      {/* Quem está fora. Placas do painel, não caixinhas de formulário. */}
      <div className="border-b border-black bg-flap px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <fieldset className="min-w-0">
            <legend className="rotulo mb-3">
              Quem está fora — clique para remover da conta
            </legend>
            <div className="flex flex-wrap gap-2">
              {pessoas.map((p) => {
                const fora = ausentes.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => alternar(p.id)}
                    aria-pressed={fora}
                    className={`flex items-center gap-3 border px-3.5 py-2.5 transition-colors ${
                      fora
                        ? "border-vermelho bg-vermelho/18 text-vermelho-tinta"
                        : "border-aco-escuro/45 text-tinta hover:border-aco hover:bg-flap-sombra"
                    }`}
                  >
                    <span className="rotulo-forte text-[0.6875rem]">{p.nome}</span>
                    {fora ? (
                      <span className="dado text-[0.625rem] tracking-widest text-vermelho-tinta uppercase">
                        fora
                      </span>
                    ) : p.pendentes > 0 ? (
                      <span
                        className="dado text-[0.625rem] tracking-widest text-aco-escuro uppercase"
                        title={`${p.pendentes} de ${p.totalCelulas} células sem avaliação`}
                      >
                        {p.pendentes} pend.
                      </span>
                    ) : null}
                  </button>
                );
              })}

              {simulando && (
                <button
                  type="button"
                  onClick={limpar}
                  className="rotulo border border-transparent px-3 py-2.5 hover:text-ambar"
                >
                  limpar
                </button>
              )}
            </div>
          </fieldset>

          <span
            className="rotulo flex items-center gap-2.5 pb-1"
            aria-live="polite"
          >
            <span
              className={`lampada inline-block h-[7px] w-[7px] ${
                falha
                  ? "lampada-vermelha"
                  : carregando
                    ? "lampada-ambar"
                    : simulando
                      ? "lampada-vermelha"
                      : "lampada-verde"
              }`}
              aria-hidden="true"
            />
            {falha
              ? "falha no cálculo"
              : carregando
                ? "recalculando"
                : simulando
                  ? `simulando sem ${selecionadas.map((p) => p.nome).join(" e ")}`
                  : "situação atual do ciclo"}
          </span>
        </div>
      </div>

      {falha && (
        <AvisoDeServico tom="alerta" titulo="Erro">
          {falha} Os números abaixo são do último cálculo que deu certo.
        </AvisoDeServico>
      )}

      {naoConfiaveis.length > 0 && (
        <AvisoDeServico tom="alerta" titulo="Esta simulação não é confiável">
          {naoConfiaveis.map((p) => p.nome).join(" e ")}{" "}
          {naoConfiaveis.length === 1 ? "tem" : "têm"} células sem avaliação neste
          ciclo. Quem já conta como zero não tem o que ser removido — o impacto real
          dessa ausência só aparece depois que a matriz estiver preenchida.
        </AvisoDeServico>
      )}

      <div className="px-5 py-10">
        <div className="flex flex-wrap items-end gap-x-14 gap-y-8">
          <ContadorCobertura
            valor={cenario.cobertura}
            rotulo={simulando ? "Cobertura sem essas pessoas" : "Cobertura do departamento"}
          />

          <Comparacao
            rotulo="Tarefas que param se uma pessoa faltar"
            antes={atual.vermelhas}
            depois={cenario.vermelhas}
          />
          <Comparacao
            rotulo="Tarefas que ninguém executa"
            antes={atual.semNinguem}
            depois={cenario.semNinguem}
          />
          <Comparacao
            rotulo="Tarefas sem ninguém que ensine"
            antes={atual.semEspecialista}
            depois={cenario.semEspecialista}
          />
        </div>

        <section className="mt-14">
          <h2 className="placa text-[0.9375rem]">
            O que fica descoberto
            {novasVermelhas.length > 0 && (
              <span className="ml-3 text-vermelho-tinta">{novasVermelhas.length}</span>
            )}
          </h2>
          <p className="conteudo mt-2.5 max-w-[78ch] text-[0.8125rem] leading-relaxed text-aco">
            Tarefas que tinham duas ou mais pessoas capazes de operar sozinhas e passam
            a ter no máximo uma. É esta lista que vai junto da decisão, não a
            porcentagem.
          </p>

          <div className="mt-5">
            {!simulando ? (
              <p className="conteudo border-t border-black py-6 text-aco">
                Nenhuma pessoa marcada ainda. Clique num nome acima e o painel inteiro
                rola para a situação sem ela.
              </p>
            ) : novasVermelhas.length === 0 ? (
              <p className="conteudo border-t border-black py-6 text-aco">
                Nenhuma tarefa muda de situação com essa ausência. Ou o departamento
                está bem coberto nessas frentes, ou quem saiu já contava como zero —
                confira as pendências antes de concluir a primeira hipótese.
              </p>
            ) : (
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
                      Operavam sozinhas
                    </th>
                    <th scope="col" className="rotulo border-b border-black px-3 py-2.5 text-center">
                      Passam a operar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {novasVermelhas.map((l) => {
                    const antes = base.get(l.tarefaId)!;
                    return (
                      <tr key={l.tarefaId} className="junta bg-vermelho/[0.07]">
                        <td className="rotulo px-4 py-2 whitespace-nowrap">{l.setor}</td>
                        <td className="conteudo max-w-[40rem] py-2 pr-6 text-[0.8125rem] leading-snug">
                          {l.descricao}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="dado text-[0.9375rem] text-tinta-fraca">
                            {antes.nivel3}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="dado text-[0.9375rem] text-vermelho-tinta">
                            {l.nivel3}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* O painel inteiro, rolando. Não é redundante com a lista acima: a lista
            diz o que mudou, e o painel mostra onde isso cai dentro do departamento. */}
        <section className="mt-14">
          <h2 className="placa text-[0.9375rem]">O painel sob essa ausência</h2>
          <p className="conteudo mt-2.5 max-w-[78ch] text-[0.8125rem] leading-relaxed text-aco">
            As duas colunas que medem risco: quem opera sozinho e quem sabe ensinar. As
            palhetas rolam para a nova situação a cada nome marcado.
          </p>

          <div className="mt-5 space-y-8">
            {porSetor.map((grupo) => (
              <div key={grupo.setor}>
                <div className="aco flex flex-wrap items-baseline gap-x-4 border-y border-black px-4 py-1.5">
                  <span className="placa text-[0.6875rem] text-tinta">
                    {grupo.setor}
                  </span>
                  <span className="dado text-[0.625rem] tracking-widest text-aco-escuro uppercase">
                    {contaTarefas(grupo.linhas.length)}
                  </span>
                </div>
                <table className="w-full border-separate border-spacing-0 text-left">
                  <thead>
                    <tr>
                      <td />
                      <th scope="col" className="rotulo w-20 py-2 text-center align-bottom">
                        Operam
                        <br />
                        sozinhas
                      </th>
                      <th scope="col" className="rotulo w-20 py-2 text-center align-bottom">
                        Sabem
                        <br />
                        ensinar
                      </th>
                      <td className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.linhas.map((l) => {
                      const antes = base.get(l.tarefaId);
                      const caiu =
                        antes &&
                        farol(antes.nivel3) !== "vermelho" &&
                        farol(l.nivel3) === "vermelho";
                      return (
                        <tr
                          key={l.tarefaId}
                          className={`junta ${caiu ? "bg-vermelho/[0.09]" : ""}`}
                        >
                          <th
                            scope="row"
                            className="conteudo max-w-[46rem] py-1.5 pr-6 pl-4 text-left text-[0.8125rem] leading-snug font-normal text-tinta"
                          >
                            {l.descricao}
                          </th>
                          <td className="w-24 py-1.5 text-center">
                            <QuemCobre
                              elenco={elenco[l.tarefaId]}
                              nivel={3}
                              ausentes={ausentes}
                              quantidade={l.nivel3}
                              titulo="Operam sozinhas, sem quem está fora"
                              tarefa={l.descricao}
                            />
                          </td>
                          <td className="w-24 py-1.5 text-center">
                            <QuemCobre
                              elenco={elenco[l.tarefaId]}
                              nivel={4}
                              ausentes={ausentes}
                              quantidade={l.nivel4}
                              titulo="Sabem ensinar, sem quem está fora"
                              tarefa={l.descricao}
                            />
                          </td>
                          <td className="w-10 py-1.5 pr-4">
                            <span className="flex justify-center">
                              <Lampada pessoas={l.nivel3} />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="placa text-[0.9375rem]">E se cada um sair sozinho</h2>
          <p className="conteudo mt-2.5 max-w-[78ch] text-[0.8125rem] leading-relaxed text-aco">
            A tabela que hoje se faz à mão, zerando uma coluna da planilha por vez.
            Ordenada pelo tamanho do estrago.
          </p>

          <table className="mt-5 w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="aco-escura">
                <th scope="col" className="rotulo border-b border-black px-4 py-2.5">
                  Se sair
                </th>
                <th scope="col" className="rotulo border-b border-black px-4 py-2.5 text-right">
                  Cobertura
                </th>
                <th scope="col" className="rotulo border-b border-black px-4 py-2.5 text-right">
                  Tarefas que param
                </th>
                <th scope="col" className="rotulo border-b border-black px-4 py-2.5 text-right">
                  Ninguém executa
                </th>
                <th scope="col" className="rotulo border-b border-black px-4 py-2.5 text-right">
                  <span className="sr-only">Simular</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="junta">
                <td className="rotulo px-4 py-2.5">situação atual</td>
                <td className="dado px-4 py-2.5 text-right text-tinta-fraca">
                  {percentual(atual.cobertura)}
                </td>
                <td className="dado px-4 py-2.5 text-right text-tinta-fraca">
                  {atual.vermelhas}
                </td>
                <td className="dado px-4 py-2.5 text-right text-tinta-fraca">
                  {atual.semNinguem}
                </td>
                <td />
              </tr>
              {individuais
                .slice()
                .sort((a, b) => b.cenario.vermelhas - a.cenario.vermelhas)
                .map(({ pessoa, cenario: cen }) => {
                  const piora = cen.vermelhas - atual.vermelhas;
                  const soEssa = ausentes.length === 1 && ausentes[0] === pessoa.id;
                  return (
                    <tr
                      key={pessoa.id}
                      className={`junta ${soEssa ? "bg-vermelho/[0.09]" : ""}`}
                    >
                      <th
                        scope="row"
                        className="rotulo-forte px-4 py-2.5 text-left text-[0.6875rem]"
                      >
                        {pessoa.nome}
                        {pessoa.pendentes > 0 && (
                          <span className="rotulo ml-3 normal-case">
                            não confiável — {pessoa.pendentes} pendências
                          </span>
                        )}
                      </th>
                      <td className="dado px-4 py-2.5 text-right">
                        {percentual(cen.cobertura)}
                      </td>
                      <td className="dado px-4 py-2.5 text-right">
                        {cen.vermelhas}
                        {piora > 0 && (
                          <span className="dado ml-2 text-[0.75rem] text-vermelho-tinta">
                            +{piora}
                          </span>
                        )}
                      </td>
                      <td className="dado px-4 py-2.5 text-right">{cen.semNinguem}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => alternar(pessoa.id)}
                          className="rotulo hover:text-ambar"
                        >
                          {ausentes.includes(pessoa.id) ? "tirar da conta" : "simular"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

/** Antes → depois, com o depois em destaque quando piora. */
function Comparacao({
  rotulo,
  antes,
  depois,
}: {
  rotulo: string;
  antes: number;
  depois: number;
}) {
  const piorou = depois > antes;
  return (
    <div className="border-l border-aco-escuro/35 pl-5">
      <p className="rotulo max-w-[26ch] leading-snug">{rotulo}</p>
      <p className="mt-2.5 flex items-baseline gap-2.5">
        <span className="dado text-[1.0625rem] text-aco-escuro">{antes}</span>
        <span className="self-center text-aco-escuro" aria-label="passa a">
          <IconeSeta className="h-3.5 w-3.5" />
        </span>
        <PalhetaNumero
          valor={depois}
          largura={26}
          altura={36}
          tom={piorou ? "vermelho" : "tinta"}
        />
      </p>
    </div>
  );
}

/**
 * O número, e quem ele representa.
 *
 * "3 operam sozinhas" sem os nomes não sustenta decisão nenhuma: não dá para
 * pedir ajuda, planejar treinamento nem escolher substituto. A lista já vem
 * descontando quem está marcado como fora, que é a pergunta do simulador.
 */
function QuemCobre({
  elenco,
  nivel,
  ausentes,
  quantidade,
  titulo,
  tarefa,
}: {
  elenco: PessoaEmTarefa[] | undefined;
  nivel: number;
  ausentes: number[];
  quantidade: number;
  titulo: string;
  tarefa: string;
}) {
  const restam = quemRestaria(elenco, nivel, ausentes);

  return (
    <Explicacao
      titulo={`${titulo} — ${tarefa}`}
      alinhar="direita"
      vazio="Ninguém. Se essa tarefa aparecer, ela para."
      rotulo={
        <Palheta
          valor={String(quantidade)}
          sequencia={SEQUENCIA_DIGITO}
          largura={26}
          altura={30}
          tom={TOM_FAROL[farol(quantidade)]}
          rotulo={`${situacao(quantidade)} — ver quem`}
        />
      }
    >
      {restam.map((p) => (
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
