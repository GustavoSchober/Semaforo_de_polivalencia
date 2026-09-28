"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import type { PessoaDaMatriz, TarefaDaMatriz } from "@/lib/db/consultas/matriz";
import type { Nivel } from "@/lib/dominio/constantes";
import { farol } from "@/lib/dominio/farol";
import { cobertura } from "@/lib/dominio/cobertura";
import { Palheta, SEQUENCIA_DIGITO } from "@/app/componentes/palheta";
import { ContadorCobertura } from "@/app/componentes/contador";
import { Lampada, TOM_FAROL, situacao } from "@/app/componentes/farol";
import { horarioDaTarefa } from "@/app/componentes/formato";
import { CelulaNivel } from "./celula-nivel";
import { gravarNivel } from "./actions";

type Celula = { valor: number; avaliado: boolean };
type Estado = Record<string, Celula>;

const chave = (tarefaId: number, pessoaId: number) => `${tarefaId}:${pessoaId}`;

const NIVEIS = [1, 2, 3, 4] as const;

export function Grade({
  cicloId,
  pessoas,
  tarefas,
  editavel,
  avisos,
}: {
  cicloId: number;
  pessoas: PessoaDaMatriz[];
  tarefas: TarefaDaMatriz[];
  editavel: boolean;
  /**
   * Os avisos rolam COM o quadro, e não acima dele. São leitura de uma vez só;
   * fixá-los custava quatro linhas de tarefa em cada tela, todo dia, para
   * repetir um texto que já foi lido.
   */
  avisos?: React.ReactNode;
}) {
  const [estado, setEstado] = useState<Estado>(() => {
    const inicial: Estado = {};
    for (const t of tarefas) {
      for (const p of pessoas) {
        inicial[chave(t.tarefaId, p.id)] = t.celulas[p.id] ?? {
          valor: 0,
          avaliado: false,
        };
      }
    }
    return inicial;
  });

  const [pendentes, setPendentes] = useState<Set<string>>(new Set());
  const [ultimoSalvo, setUltimoSalvo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [, iniciarTransicao] = useTransition();
  const grade = useRef<HTMLDivElement>(null);

  const alterar = useCallback(
    (tarefaId: number, pessoaId: number, novo: Nivel) => {
      const k = chave(tarefaId, pessoaId);
      const anterior = estado[k];
      if (anterior.valor === novo && anterior.avaliado) return;

      // otimista: a palheta vira na hora, a gravação vai atrás
      setEstado((e) => ({ ...e, [k]: { valor: novo, avaliado: true } }));
      setPendentes((p) => new Set(p).add(k));
      setErro(null);

      iniciarTransicao(async () => {
        const r = await gravarNivel(cicloId, tarefaId, pessoaId, novo);
        setPendentes((p) => {
          const n = new Set(p);
          n.delete(k);
          return n;
        });
        if (r.ok) {
          setUltimoSalvo(
            new Date(r.gravadoEm).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        } else {
          // falhou: desfaz visualmente e avisa
          setEstado((e) => ({ ...e, [k]: anterior }));
          setErro(r.erro);
        }
      });
    },
    [cicloId, estado],
  );

  /** Setas movem o foco; o resto o próprio controle trata. */
  function navegar(e: React.KeyboardEvent<HTMLDivElement>) {
    const teclas = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (!teclas.includes(e.key)) return;

    const alvo = e.target as HTMLElement;
    const celula = alvo.closest<HTMLElement>("[data-celula]");
    if (!celula) return;

    e.preventDefault();
    const linha = Number(celula.dataset.linha);
    const coluna = Number(celula.dataset.coluna);

    let l = linha;
    let c = coluna;
    if (e.key === "ArrowUp") l -= 1;
    if (e.key === "ArrowDown") l += 1;
    if (e.key === "ArrowLeft") c -= 1;
    if (e.key === "ArrowRight") c += 1;
    if (e.key === "Home") c = 0;
    if (e.key === "End") c = pessoas.length - 1;

    const destino = grade.current?.querySelector<HTMLElement>(
      `[data-celula][data-linha="${l}"][data-coluna="${c}"]`,
    );
    destino?.focus();
    destino?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  // o semáforo recalculado a partir do estado local: é o que transforma o
  // preenchimento de burocracia em feedback
  const semaforos = useMemo(() => {
    const mapa = new Map<number, [number, number, number, number]>();
    for (const t of tarefas) {
      let n1 = 0, n2 = 0, n3 = 0, n4 = 0;
      for (const p of pessoas) {
        const c = estado[chave(t.tarefaId, p.id)];
        if (!c?.avaliado) continue;
        if (c.valor >= 1) n1 += 1;
        if (c.valor >= 2) n2 += 1;
        if (c.valor >= 3) n3 += 1;
        if (c.valor >= 4) n4 += 1;
      }
      mapa.set(t.tarefaId, [n1, n2, n3, n4]);
    }
    return mapa;
  }, [estado, tarefas, pessoas]);

  const coberturaViva = useMemo(() => {
    const linhas = tarefas.map((t) => {
      const [n1, n2, n3, n4] = semaforos.get(t.tarefaId)!;
      return { nivel_1: n1, nivel_2: n2, nivel_3: n3, nivel_4: n4 };
    });
    return cobertura(linhas);
  }, [semaforos, tarefas]);

  const totaisPorPessoa = useMemo(() => {
    const mapa = new Map<number, { pontos: number; naoAvaliadas: number }>();
    for (const p of pessoas) {
      let pontos = 0;
      let naoAvaliadas = 0;
      for (const t of tarefas) {
        const c = estado[chave(t.tarefaId, p.id)];
        if (c?.avaliado) pontos += c.valor;
        else naoAvaliadas += 1;
      }
      mapa.set(p.id, { pontos, naoAvaliadas });
    }
    return mapa;
  }, [estado, tarefas, pessoas]);

  // agrupa por setor, o que substitui as linhas em branco 37, 53, 59... da
  // planilha. Como o agrupamento vem de setor_id, nunca desalinha.
  const porSetor = useMemo(() => {
    const grupos: { setor: string; tarefas: TarefaDaMatriz[] }[] = [];
    for (const t of tarefas) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.setor === t.setor) ultimo.tarefas.push(t);
      else grupos.push({ setor: t.setor, tarefas: [t] });
    }
    return grupos;
  }, [tarefas]);

  const totalPendentes = useMemo(
    () => [...totaisPorPessoa.values()].reduce((s, t) => s + t.naoAvaliadas, 0),
    [totaisPorPessoa],
  );

  let indiceLinha = -1;

  return (
    <div className="flex flex-col">
      {/* A faixa de indicadores fica FORA da área que rola: a cobertura é a
          razão de a pessoa estar preenchendo — some da vista, some o porquê. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-10 gap-y-3 border-b border-black bg-flap px-5 py-2.5">
        <ContadorCobertura valor={coberturaViva} tamanho="linha" />

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {totalPendentes > 0 && (
            <span
              className="flex items-baseline gap-2.5"
              title="Célula sem avaliação conta como zero na cobertura. Enquanto houver pendência, a cobertura está subestimada."
            >
              <span className="dado text-[1.0625rem] text-aco">{totalPendentes}</span>
              <span className="rotulo whitespace-nowrap">células sem avaliação</span>
            </span>
          )}

          <span
            className="rotulo flex items-center gap-2.5"
            aria-live="polite"
            aria-atomic="true"
          >
            <span
              className={`lampada inline-block h-[7px] w-[7px] ${
                erro
                  ? "lampada-vermelha"
                  : pendentes.size > 0
                    ? "lampada-ambar"
                    : "lampada-verde"
              }`}
              aria-hidden="true"
            />
            {!editavel
              ? "modo leitura"
              : erro
                ? "falha ao gravar"
                : pendentes.size > 0
                  ? "gravando"
                  : ultimoSalvo
                    ? `gravado às ${ultimoSalvo}`
                    : "grava sozinho"}
          </span>
        </div>

        {erro && (
          <p className="conteudo w-full border border-vermelho/60 bg-vermelho/12 px-3 py-2 text-[0.8125rem] text-vermelho-tinta">
            {erro}
          </p>
        )}
      </div>

      <div ref={grade} onKeyDown={navegar} className="overflow-x-auto">
        {avisos}
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left">
          <caption className="sr-only">
            Matriz de polivalência: {tarefas.length} tarefas por {pessoas.length}{" "}
            colaboradores. Cada célula é o nível de domínio, de 0 a 4.
          </caption>

          <thead>
            {/* Duas fileiras de cabeçalho: sem a primeira, as quatro colunas do
                semáforo chegam sem nome — que é exatamente o defeito da tela
                anterior, em que o dado mais importante era o único sem rótulo. */}
            <tr className="aco-escura">
              <td colSpan={2} className="border-b border-black/60" />
              <th
                scope="colgroup"
                colSpan={pessoas.length}
                className="rotulo border-x border-b border-black/60 px-2 py-1.5 text-center"
              >
                Nível de cada colaborador
              </th>
              <th
                scope="colgroup"
                colSpan={4}
                className="rotulo border-b border-black/60 px-2 py-1.5 text-center"
              >
                Semáforo — quantas pessoas
              </th>
              <td className="border-b border-black/60" />
            </tr>

            <tr className="aco-escura">
              <th scope="col" className="rotulo border-b border-black px-4 pt-2 pb-3 align-bottom">
                Prazo
              </th>
              <th scope="col" className="rotulo border-b border-black pt-2 pr-6 pb-3 align-bottom">
                Tarefa
              </th>

              {pessoas.map((p) => {
                const t = totaisPorPessoa.get(p.id)!;
                return (
                  <th
                    key={p.id}
                    scope="col"
                    className="border-b border-l border-black/50 px-2 pt-1.5 pb-2 text-center align-bottom"
                  >
                    <span className="rotulo-forte block text-[0.6875rem] whitespace-nowrap">
                      {p.nome}
                    </span>
                    <span className="dado mt-1 block text-[0.6875rem] whitespace-nowrap text-aco-escuro">
                      {t.pontos} pts
                      {t.naoAvaliadas > 0 && (
                        <span title={`${t.naoAvaliadas} tarefas sem avaliação`}>
                          {" · "}
                          {t.naoAvaliadas} pend.
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}

              {NIVEIS.map((n) => (
                <th
                  key={n}
                  scope="col"
                  className={`border-b border-black px-2 pt-1.5 pb-2 text-center align-bottom ${
                    n === 1 ? "border-l-2 border-l-black" : "border-l border-l-black/50"
                  }`}
                  title={
                    n === 3
                      ? "quantas pessoas operam sozinhas — a cobertura operacional real"
                      : n === 4
                        ? "quantas pessoas sabem ensinar — a capacidade de formar substituto"
                        : `quantas pessoas alcançaram o nível ${n} ou acima`
                  }
                >
                  <span className="rotulo-forte block text-[0.8125rem]">{n}</span>
                  <span className="rotulo mt-1 block text-[0.5625rem] tracking-[0.1em]">
                    {n === 1
                      ? "contato"
                      : n === 2
                        ? "com ajuda"
                        : n === 3
                          ? "sozinho"
                          : "ensina"}
                  </span>
                </th>
              ))}

              <th scope="col" className="border-b border-black px-3 pb-3 align-bottom">
                <span className="sr-only">Situação da tarefa</span>
              </th>
            </tr>
          </thead>

          {porSetor.map((grupo) => (
            <tbody key={grupo.setor}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={pessoas.length + 7}
                  className="aco border-y border-black px-4 py-1.5 text-left"
                >
                  <span className="flex flex-wrap items-baseline gap-x-4">
                    <span className="placa text-[0.6875rem] text-tinta">
                      {grupo.setor}
                    </span>
                    <span className="dado text-[0.625rem] tracking-widest text-aco-escuro uppercase">
                      {grupo.tarefas.length}{" "}
                      {grupo.tarefas.length === 1 ? "tarefa" : "tarefas"}
                    </span>
                  </span>
                </th>
              </tr>

              {grupo.tarefas.map((t) => {
                indiceLinha += 1;
                const linha = indiceLinha;
                const [n1, n2, n3, n4] = semaforos.get(t.tarefaId)!;
                const contagens = [n1, n2, n3, n4];
                const critica = farol(n3) === "vermelho";

                return (
                  <tr
                    key={t.tarefaId}
                    className={`junta group transition-colors hover:bg-flap-alto/45 ${
                      critica ? "bg-vermelho/[0.07]" : ""
                    }`}
                  >
                    <td className="dado px-4 py-0.5 text-[0.6875rem] tracking-widest whitespace-nowrap text-aco-escuro uppercase group-hover:text-aco">
                      {horarioDaTarefa(t.prazoAncora, t.periodicidade)}
                    </td>

                    <th
                      scope="row"
                      className="conteudo max-w-[34rem] py-0.5 pr-6 text-left text-[0.8125rem] leading-snug font-normal text-tinta"
                    >
                      {t.descricao}
                    </th>

                    {pessoas.map((p, coluna) => {
                      const k = chave(t.tarefaId, p.id);
                      const c = estado[k];
                      return (
                        <td
                          key={p.id}
                          className="border-l border-black/40 px-2 py-0.5 text-center"
                        >
                          <CelulaNivel
                            valor={c.valor}
                            avaliado={c.avaliado}
                            editavel={editavel}
                            pendente={pendentes.has(k)}
                            linha={linha}
                            coluna={coluna}
                            rotulo={`${p.nome} — ${t.descricao}`}
                            onMudar={(novo) => alterar(t.tarefaId, p.id, novo)}
                          />
                        </td>
                      );
                    })}

                    {contagens.map((n, i) => (
                      <td
                        key={i}
                        className={`px-2 py-0.5 text-center ${
                          i === 0 ? "border-l-2 border-l-black" : "border-l border-l-black/40"
                        }`}
                      >
                        <Palheta
                          valor={String(n)}
                          sequencia={SEQUENCIA_DIGITO}
                          largura={24}
                          altura={28}
                          tom={TOM_FAROL[farol(n)]}
                          rotulo={`nível ${i + 1}: ${situacao(n)}`}
                        />
                      </td>
                    ))}

                    <td className="px-3 py-0.5">
                      <span
                        className="flex items-center justify-center"
                        title={`Operação sozinha: ${situacao(n3)}`}
                      >
                        <Lampada pessoas={n3} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
