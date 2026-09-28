"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { PessoaNaTarefa } from "@/lib/db/consultas/capacidade";
import { ROTULO_NIVEL, type Nivel } from "@/lib/dominio/constantes";
import { farol } from "@/lib/dominio/farol";
import { Palheta, SEQUENCIA_DIGITO, SEQUENCIA_NIVEL } from "@/app/componentes/palheta";
import { Lampada, TOM_FAROL, situacao } from "@/app/componentes/farol";
import { definirNivelNaTarefa } from "@/app/gerenciar/actions";

/**
 * A matriz vista de lado: uma tarefa, todas as pessoas.
 *
 * É a mesma célula de `nivel` que a matriz edita, pela outra face. Não existe
 * vínculo "capaz/não capaz" em lugar nenhum — "quantas pessoas executam" e
 * "quantas ensinam" são contados a partir daqui, na hora, e por isso nunca
 * podem discordar do resto do sistema.
 */
export function QuadroDaTarefa({
  tarefaId,
  pessoas: iniciais,
  editavel,
}: {
  tarefaId: number;
  pessoas: PessoaNaTarefa[];
  editavel: boolean;
}) {
  const [pessoas, setPessoas] = useState(iniciais);
  const [pendente, setPendente] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const router = useRouter();

  const executam = useMemo(
    () => pessoas.filter((p) => p.avaliado && p.valor >= 3),
    [pessoas],
  );
  const ensinam = useMemo(
    () => pessoas.filter((p) => p.avaliado && p.valor === 4),
    [pessoas],
  );

  function definir(colaboradorId: number, valor: Nivel) {
    if (!editavel) return;
    const antes = pessoas;
    setPessoas((ps) =>
      ps.map((p) =>
        p.colaboradorId === colaboradorId
          ? { ...p, valor, avaliado: true, herdado: false }
          : p,
      ),
    );
    setPendente(colaboradorId);
    setErro(null);

    iniciar(async () => {
      const r = await definirNivelNaTarefa(tarefaId, colaboradorId, valor);
      setPendente(null);
      if (r.ok) {
        // os outros quadros — matriz, painel, simulador — leem a mesma célula
        router.refresh();
      } else {
        setPessoas(antes);
        setErro(r.erro);
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-10 gap-y-4 border-y border-black bg-flap-sombra px-5 py-4">
        <Resumo
          rotulo="Executam sozinhas"
          quantidade={executam.length}
          nomes={executam.map((p) => p.nome)}
        />
        <Resumo
          rotulo="Sabem ensinar"
          quantidade={ensinam.length}
          nomes={ensinam.map((p) => p.nome)}
        />
        <p className="conteudo max-w-[46ch] text-[0.75rem] leading-relaxed text-aco-escuro">
          Os dois números são contados a partir dos níveis abaixo. Não existe
          nenhum lugar onde eles possam ser digitados.
        </p>
      </div>

      {erro && (
        <p
          role="alert"
          className="conteudo border-b border-black border-l-2 border-l-vermelho bg-vermelho/12 px-5 py-2.5 text-[0.8125rem] text-vermelho-tinta"
        >
          {erro}
        </p>
      )}

      <ul className="px-5">
        {pessoas.map((p) => (
          <li key={p.colaboradorId} className="junta py-3">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <span className="flex min-w-[16rem] items-baseline gap-3">
                <span className="rotulo-forte text-[0.8125rem]">{p.nome}</span>
                {p.herdado && p.avaliado && (
                  <span
                    className="rotulo"
                    title="copiado na virada do mês, ainda não confirmado neste ciclo"
                  >
                    herdado
                  </span>
                )}
              </span>

              <span
                className={`flex items-center gap-1.5 ${pendente === p.colaboradorId ? "opacity-55" : ""}`}
                role="group"
                aria-label={`Nível de ${p.nome}`}
              >
                {([0, 1, 2, 3, 4] as const).map((n) => {
                  const marcado = p.avaliado && p.valor === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={!editavel}
                      aria-pressed={marcado}
                      title={`${n} — ${ROTULO_NIVEL[n]}`}
                      onClick={() => definir(p.colaboradorId, n)}
                      className={`dado h-8 min-w-8 rounded-[2px] border px-2 text-[0.8125rem] transition-colors ${
                        marcado
                          ? "border-ambar bg-ambar text-flap"
                          : "border-aco-escuro/40 text-aco hover:border-aco hover:text-tinta"
                      } ${editavel ? "" : "cursor-default"}`}
                    >
                      {n}
                    </button>
                  );
                })}
                <span className="rotulo ml-3 w-[22ch]">
                  {p.avaliado ? ROTULO_NIVEL[p.valor as Nivel] : "ainda não avaliado"}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Resumo({
  rotulo,
  quantidade,
  nomes,
}: {
  rotulo: string;
  quantidade: number;
  nomes: string[];
}) {
  return (
    <div className="flex items-center gap-3">
      <Palheta
        valor={String(quantidade)}
        sequencia={SEQUENCIA_DIGITO}
        largura={28}
        altura={34}
        tom={TOM_FAROL[farol(quantidade)]}
      />
      <span>
        <span className="rotulo block">{rotulo}</span>
        <span className="conteudo mt-1 block max-w-[30ch] text-[0.75rem] text-aco">
          {nomes.length > 0 ? nomes.join(", ") : situacao(quantidade)}
        </span>
      </span>
      <Lampada pessoas={quantidade} />
    </div>
  );
}

/** A sequência do nível, reexportada para manter o import único nesta tela. */
export { SEQUENCIA_NIVEL };
