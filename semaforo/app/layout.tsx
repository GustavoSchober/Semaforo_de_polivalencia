import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

/**
 * Uma família, dois eixos de largura.
 *
 * O painel de estação usa um único sistema de lettering em larguras diferentes,
 * e não duas fontes. O eixo `wdth` do Archivo entrega isso com um arquivo só:
 * 70 para a cromagem e os dados, 100 para as descrições de tarefa.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--fonte-archivo",
  display: "swap",
});

// Toda tela lê o banco na hora. Sem isto o build tenta prerenderizar as rotas
// que não declaram `dynamic` sozinhas — e falha onde não há banco.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Semáforo de Polivalência",
  description:
    "Quantas pessoas sabem fazer cada tarefa do departamento — e o que acontece se uma delas sair amanhã.",
};

/**
 * Aplica o tema salvo antes da primeira pintura.
 *
 * Sem isto a página nasce no painel escuro e salta para o papel um quadro
 * depois — o piscar branco que todo tema persistido produz quando a decisão
 * espera a hidratação. O script é minúsculo, síncrono e roda antes do body.
 */
const APLICAR_TEMA = `(function(){try{var t=localStorage.getItem("semaforo:tema");document.documentElement.dataset.tema=t==="claro"?"claro":"escuro"}catch(e){document.documentElement.dataset.tema="escuro"}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `suppressHydrationWarning` cobre exatamente um atributo: `data-tema`, que
    // o script acima reescreve antes da hidratação. Sem ele o React reclama de
    // um descompasso que é deliberado — o servidor não tem como saber o que
    // está no localStorage de quem abriu. Não suprime nada abaixo do <html>.
    <html
      lang="pt-BR"
      data-tema="escuro"
      suppressHydrationWarning
      className={`${archivo.variable} h-full`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        {/* Primeiro filho do body, e não do head: no App Router o `<head>`
            é montado pelo Next, e enfiar um script ali pelo JSX desalinha a
            árvore que o React espera ao hidratar. Aqui ele roda durante o
            parse, antes de qualquer pintura, que é tudo o que precisa. */}
        <script dangerouslySetInnerHTML={{ __html: APLICAR_TEMA }} />
        {children}
      </body>
    </html>
  );
}
