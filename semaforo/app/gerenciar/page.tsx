import Link from "next/link";
import { db } from "@/lib/db";
import { departamento } from "@/lib/db/schema";
import { garantirCicloDoMes } from "@/lib/db/ciclo-vigente";
import { colaboradoresDoDepartamento } from "@/lib/db/consultas/administracao";
import { usuarioAtual } from "@/lib/auth/sessao";
import { podeAdministrar } from "@/lib/auth/permissoes";
import { Painel } from "@/app/componentes/moldura";
import { AvisoDeServico } from "@/app/componentes/aviso";
import { IconeSeta } from "@/app/componentes/icones";
import { referenciaTitulo } from "@/app/componentes/formato";
import {
  alternarDesligamento,
  criarColaborador,
  editarColaborador,
} from "./actions";
import { BotaoDeAcao, Formulario } from "./formularios";
import { Gaveta } from "./gaveta";

export const dynamic = "force-dynamic";

const PAPEIS = [
  { valor: "colaborador", rotulo: "Colaborador" },
  { valor: "gestor", rotulo: "Gestor" },
  { valor: "diretoria", rotulo: "Diretoria" },
] as const;

export default async function Equipe() {
  const [dep] = await db.select().from(departamento).limit(1);
  if (!dep) {
    return (
      <Painel modo="gerenciar" departamento="—">
        <div className="px-5 py-16">
          <p className="conteudo text-aco">
            Rode <code className="dado bg-flap-sombra px-1.5 py-0.5">npm run db:seed</code>.
          </p>
        </div>
      </Painel>
    );
  }

  const ciclo = await garantirCicloDoMes(dep.id);
  const u = await usuarioAtual();
  const podeMexer = podeAdministrar(u, dep.id);
  const pessoas = await colaboradoresDoDepartamento(dep.id, ciclo?.id ?? null);

  const ativos = pessoas.filter((p) => p.ativo);
  const inativos = pessoas.filter((p) => !p.ativo);

  return (
    <Painel
      modo="gerenciar"
      departamento={dep.nome}
      cicloId={ciclo?.id}
      cicloRotulo={ciclo ? referenciaTitulo(ciclo.referencia) : undefined}
      cicloFechado={ciclo?.status === "fechado"}
    >
      {!podeMexer && (
        <AvisoDeServico titulo="Somente leitura">
          Seu papel não permite administrar este departamento. Você vê o cadastro,
          mas não pode alterá-lo.
        </AvisoDeServico>
      )}

      <div className="px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div className="max-w-[64ch]">
            <h1 className="letreiro placa text-[1.375rem] leading-tight">
              Quem está no departamento
            </h1>
            <p className="conteudo mt-3.5 text-[0.9375rem] leading-relaxed text-aco">
              Cadastrar alguém abre o quadro dela no ciclo aberto. Desligar não apaga
              nada: grava a data de saída, a pessoa para de contar no mês corrente na
              hora, e os meses já fechados continuam dizendo o que era verdade neles.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link href="/gerenciar/catalogo" className="botao-fantasma">
              Catálogo de tarefas
              <IconeSeta className="h-3 w-3" />
            </Link>
            <Link href="/gerenciar/ciclos" className="botao-fantasma">
              Ciclos
              <IconeSeta className="h-3 w-3" />
            </Link>
          </nav>
        </div>

        {podeMexer && (
          <div className="mt-8">
            <Gaveta rotulo="Cadastrar colaborador">
              <Formulario acao={criarColaborador} enviar="Cadastrar">
                <div className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr]">
                  <label>
                    <span className="rotulo-campo">Nome</span>
                    <input
                      name="nome"
                      required
                      maxLength={120}
                      className="campo"
                      placeholder="Nome completo"
                    />
                  </label>
                  <label>
                    <span className="rotulo-campo">E-mail (opcional)</span>
                    <input
                      name="email"
                      type="email"
                      maxLength={200}
                      className="campo"
                      placeholder="pessoa@empresa.com.br"
                    />
                  </label>
                  <label>
                    <span className="rotulo-campo">Papel</span>
                    <select name="papel" className="campo" defaultValue="colaborador">
                      {PAPEIS.map((p) => (
                        <option key={p.valor} value={p.valor}>
                          {p.rotulo}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </Formulario>
            </Gaveta>
          </div>
        )}

        <ListaDePessoas
          titulo="No departamento"
          pessoas={ativos}
          podeMexer={podeMexer}
          vazio="Ninguém cadastrado ainda."
        />

        {inativos.length > 0 && (
          <ListaDePessoas
            titulo="Desligados"
            descricao="Continuam no histórico dos ciclos em que estavam, e não contam mais no mês corrente."
            pessoas={inativos}
            podeMexer={podeMexer}
            vazio=""
          />
        )}
      </div>
    </Painel>
  );
}

function ListaDePessoas({
  titulo,
  descricao,
  pessoas,
  podeMexer,
  vazio,
}: {
  titulo: string;
  descricao?: string;
  pessoas: Awaited<ReturnType<typeof colaboradoresDoDepartamento>>;
  podeMexer: boolean;
  vazio: string;
}) {
  return (
    <section className="mt-12">
      <h2 className="placa text-[0.9375rem]">{titulo}</h2>
      {descricao && (
        <p className="conteudo mt-2.5 max-w-[78ch] text-[0.8125rem] leading-relaxed text-aco">
          {descricao}
        </p>
      )}

      {pessoas.length === 0 ? (
        <p className="conteudo mt-5 border-t border-black py-6 text-aco">{vazio}</p>
      ) : (
        <ul className="mt-5 border-t border-black">
          {pessoas.map((p) => (
            <li key={p.id} className="junta py-4">
              <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
                <div className="min-w-[18rem]">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className={`rotulo-forte text-[0.8125rem] ${
                        p.ativo ? "" : "text-aco-escuro line-through"
                      }`}
                    >
                      {p.nome}
                    </span>
                    <span className="rotulo">{p.papel}</span>
                    {!p.ativo && (
                      <span className="rotulo-forte border border-aco-escuro/60 px-1.5 py-0.5 text-[0.5625rem] text-aco">
                        saiu em {p.saidaEm}
                      </span>
                    )}
                  </span>
                  {p.email && (
                    <span className="conteudo mt-1 block text-[0.75rem] text-aco-escuro">
                      {p.email}
                    </span>
                  )}
                </div>

                {p.ativo && (
                  <dl className="flex flex-wrap gap-x-8 gap-y-2">
                    <div>
                      <dt className="rotulo">Executa sozinho</dt>
                      <dd className="dado mt-1 text-[1.0625rem]">{p.executaSozinho}</dd>
                    </div>
                    <div>
                      <dt className="rotulo">Sabe ensinar</dt>
                      <dd className="dado mt-1 text-[1.0625rem]">{p.ensina}</dd>
                    </div>
                    <div>
                      <dt className="rotulo">Sem avaliação</dt>
                      <dd
                        className={`dado mt-1 text-[1.0625rem] ${
                          p.pendentes > 0 ? "text-aco" : ""
                        }`}
                      >
                        {p.pendentes}
                      </dd>
                    </div>
                  </dl>
                )}

                {podeMexer && (
                  <div className="flex flex-wrap items-start gap-2">
                    <Gaveta rotulo="Editar">
                      <Formulario acao={editarColaborador} enviar="Salvar">
                        <input type="hidden" name="id" value={p.id} />
                        <div className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr]">
                          <label>
                            <span className="rotulo-campo">Nome</span>
                            <input
                              name="nome"
                              required
                              defaultValue={p.nome}
                              className="campo"
                            />
                          </label>
                          <label>
                            <span className="rotulo-campo">E-mail</span>
                            <input
                              name="email"
                              type="email"
                              defaultValue={p.email ?? ""}
                              className="campo"
                            />
                          </label>
                          <label>
                            <span className="rotulo-campo">Papel</span>
                            <select name="papel" className="campo" defaultValue={p.papel}>
                              {PAPEIS.map((x) => (
                                <option key={x.valor} value={x.valor}>
                                  {x.rotulo}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </Formulario>
                    </Gaveta>

                    <BotaoDeAcao
                      acao={alternarDesligamento}
                      campos={{ id: p.id, acao: p.ativo ? "desligar" : "readmitir" }}
                      className={
                        p.ativo ? "botao-fantasma botao-perigo" : "botao-fantasma"
                      }
                      confirmar={
                        p.ativo
                          ? `Desligar ${p.nome}? Os indicadores do mês corrente vão recalcular sem essa pessoa. Os ciclos fechados não mudam, e a ação pode ser desfeita.`
                          : undefined
                      }
                    >
                      {p.ativo ? "Desligar" : "Readmitir"}
                    </BotaoDeAcao>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
