"use client";

import { ROTULO_NIVEL, type Nivel } from "@/lib/dominio/constantes";
import { Palheta, SEQUENCIA_NIVEL } from "@/app/componentes/palheta";

/**
 * A célula de nível: uma palheta.
 *
 * O ganho que o Excel não pode oferecer continua intacto — não existem quatro
 * campos independentes, existe um inteiro de 0 a 4, e é impossível marcar o
 * quarto sem os três anteriores. A palheta torna isso visível: ela rola, e um
 * rolo tem ordem.
 *
 * Mouse: clicar avança uma palheta e dá a volta no 4, como a roda do painel
 * real; com Shift, volta. Teclado: 0 a 4 marcam direto, e é o caminho rápido.
 */
export function CelulaNivel({
  valor,
  avaliado,
  editavel,
  rotulo,
  linha,
  coluna,
  pendente,
  onMudar,
}: {
  valor: number;
  avaliado: boolean;
  editavel: boolean;
  rotulo: string;
  linha: number;
  coluna: number;
  /** true enquanto a gravação desta célula ainda está a caminho */
  pendente: boolean;
  onMudar: (novo: Nivel) => void;
}) {
  const estado = avaliado ? ROTULO_NIVEL[valor as Nivel] : "ainda não avaliado";
  const descricao = `${rotulo}: ${estado}`;

  function aoTeclar(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!editavel) return;
    if (e.key >= "0" && e.key <= "4") {
      e.preventDefault();
      onMudar(Number(e.key) as Nivel);
      return;
    }
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      onMudar(Math.min(valor + 1, 4) as Nivel);
    }
    if (e.key === "-") {
      e.preventDefault();
      onMudar(Math.max(valor - 1, 0) as Nivel);
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      avancar(e.shiftKey);
    }
  }

  function avancar(voltar: boolean) {
    if (!editavel) return;
    const base = avaliado ? valor : -1;
    const proximo = voltar
      ? base <= 0
        ? 4
        : base - 1
      : base >= 4
        ? 0
        : base + 1;
    onMudar(proximo as Nivel);
  }

  return (
    <div
      data-celula
      data-linha={linha}
      data-coluna={coluna}
      tabIndex={editavel ? 0 : -1}
      role="spinbutton"
      aria-valuenow={avaliado ? valor : undefined}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuetext={estado}
      aria-label={descricao}
      aria-readonly={!editavel}
      title={
        editavel
          ? `${descricao}\nteclas 0–4 marcam direto · clique avança · shift+clique volta`
          : descricao
      }
      onKeyDown={aoTeclar}
      onClick={(e) => avancar(e.shiftKey)}
      className={`inline-flex rounded-[3px] outline-none ${
        editavel ? "cursor-pointer hover:brightness-[1.35]" : ""
      } ${pendente ? "opacity-55" : ""}`}
    >
      <Palheta
        valor={avaliado ? String(valor) : "–"}
        sequencia={SEQUENCIA_NIVEL}
        largura={28}
        altura={30}
        vazia={!avaliado}
        tom={avaliado ? "tinta" : "aco"}
      />
    </div>
  );
}
