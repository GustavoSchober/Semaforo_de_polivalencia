"use client";

import { useActionState } from "react";
import { entrar, type EstadoEntrada } from "./actions";

export function FormularioEntrada({ volta }: { volta?: string }) {
  const [estado, acao, enviando] = useActionState<EstadoEntrada, FormData>(entrar, {
    erro: null,
  });

  return (
    <form action={acao} className="mt-8">
      {volta && <input type="hidden" name="volta" value={volta} />}
      <label htmlFor="senha" className="rotulo-campo">
        Senha de acesso
      </label>
      <input
        id="senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        className="campo"
        aria-invalid={estado.erro ? true : undefined}
        aria-describedby={estado.erro ? "erro-senha" : undefined}
      />
      {estado.erro && (
        <p id="erro-senha" role="alert" className="dado mt-3 text-[0.8125rem] text-vermelho-tinta">
          {estado.erro}
        </p>
      )}
      <button type="submit" className="botao mt-6" disabled={enviando}>
        {enviando ? "Conferindo…" : "Entrar"}
      </button>
    </form>
  );
}
