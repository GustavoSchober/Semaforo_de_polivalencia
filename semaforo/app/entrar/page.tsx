import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Lampada } from "@/app/componentes/farol";
import { Trilho } from "@/app/componentes/moldura";
import { COOKIE_ACESSO, acessoConfigurado, sessaoValida } from "@/lib/auth/acesso";
import { FormularioEntrada } from "./formulario";

export const metadata = { title: "Entrar · Semáforo de Polivalência" };

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { volta } = await searchParams;
  const destino = typeof volta === "string" ? volta : undefined;

  // quem já tem sessão não precisa ver a porta
  if (await sessaoValida((await cookies()).get(COOKIE_ACESSO)?.value)) {
    redirect(destino?.startsWith("/") && !destino.startsWith("//") ? destino : "/");
  }

  const configurado = await acessoConfigurado();

  return (
    <div className="flex min-h-dvh flex-col bg-flap">
      <Trilho />
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-4">
            <span className="caixa-semaforo" aria-hidden="true">
              <Lampada pessoas={0} tamanho={12} />
              <Lampada pessoas={2} tamanho={12} />
              <Lampada pessoas={3} tamanho={12} />
            </span>
            <div className="flex flex-col gap-1">
              <span className="placa text-[1.125rem] text-tinta">Semáforo</span>
              <span className="rotulo">de Polivalência</span>
            </div>
          </div>

          {configurado ? (
            <FormularioEntrada volta={destino} />
          ) : (
            <p className="conteudo mt-8 text-[0.9375rem] leading-relaxed text-aco">
              O acesso ainda não foi configurado. Peça ao responsável pelo sistema
              para cadastrar a senha.
            </p>
          )}
        </div>
      </main>
      <Trilho />
    </div>
  );
}
