import { IconeAviso } from "./icones";

export type TomDoAviso = "servico" | "alerta";

/**
 * O aviso — um componente, dois tons, e nenhum terceiro sistema visual.
 *
 * `servico` é o canal de CONFIANÇA: aço, nunca âmbar nem vermelho. Diz "este
 * número existe, e eis o quanto dá para confiar nele". É o tom de célula não
 * avaliada, de nível herdado da virada e de fórmula ainda não validada.
 *
 * `alerta` sobe o mesmo componente para o canal de RISCO quando a leitura pode
 * levar alguém a decidir errado — uma simulação sobre matriz incompleta, um
 * painel calculado sobre dados que faltam. Usa o mesmo vermelho das pessoas
 * marcadas como fora, porque é a mesma classe de informação: isto aqui está
 * quebrado, olhe antes de concluir.
 *
 * Os dois tons vivem aqui, e não em cada tela, para que o Painel de Risco e o
 * Simulador nunca inventem dialetos diferentes para a mesma coisa.
 */
export function AvisoDeServico({
  titulo,
  tom = "servico",
  children,
  className = "",
}: {
  titulo?: string;
  tom?: TomDoAviso;
  children: React.ReactNode;
  className?: string;
}) {
  const alerta = tom === "alerta";

  return (
    <div
      role={alerta ? "alert" : "status"}
      className={`flex shrink-0 items-baseline gap-3 border-b border-black px-5 py-2.5 ${
        alerta
          ? "border-l-2 border-l-vermelho bg-vermelho/12"
          : "aco-escura"
      } ${className}`}
    >
      <span
        className={`translate-y-0.5 self-start ${
          alerta ? "text-vermelho-tinta" : "text-aco-escuro"
        }`}
      >
        <IconeAviso />
      </span>
      <p
        className={`conteudo max-w-[110ch] text-[0.8125rem] leading-relaxed ${
          alerta ? "text-vermelho-tinta" : "text-aco"
        }`}
      >
        {titulo && (
          <strong
            className={`rotulo-forte mr-2.5 text-[0.6875rem] ${
              alerta ? "text-vermelho-tinta" : ""
            }`}
          >
            {titulo}
          </strong>
        )}
        {children}
      </p>
    </div>
  );
}
