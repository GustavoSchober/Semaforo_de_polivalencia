import Link from "next/link";
import { db } from "@/lib/db";
import { departamento } from "@/lib/db/schema";
import { garantirCicloDoMes } from "@/lib/db/ciclo-vigente";
import {
  setoresDoDepartamento,
  tarefasDoDepartamento,
  type TarefaAdmin,
} from "@/lib/db/consultas/administracao";
import { usuarioAtual } from "@/lib/auth/sessao";
import { podeAdministrar } from "@/lib/auth/permissoes";
import { farol } from "@/lib/dominio/farol";
import { Painel } from "@/app/componentes/moldura";
import { AvisoDeServico } from "@/app/componentes/aviso";
import { Lampada, TOM_FAROL, situacao } from "@/app/componentes/farol";
import { PalhetaFixa } from "@/app/componentes/palheta-fixa";
import { IconeSeta } from "@/app/componentes/icones";
import {
  horarioDaTarefa,
  referenciaTitulo,
  tarefas as contaTarefas,
} from "@/app/componentes/formato";
import { alternarVigenciaTarefa, criarTarefa, editarTarefa } from "../actions";
import { BotaoDeAcao, Formulario } from "../formularios";
import { Gaveta } from "../gaveta";

export const dynamic = "force-dynamic";

const PERIODICIDADES = [
  { valor: "diaria", rotulo: "Diária" },
  { valor: "semanal", rotulo: "Semanal" },
  { valor: "mensal", rotulo: "Mensal" },
  { valor: "anual", rotulo: "Anual" },
] as const;

function CamposDaTarefa({
  setores,
  tarefa,
}: {
  setores: { id: number; nome: string }[];
  tarefa?: TarefaAdmin;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="rotulo-campo">Descrição</span>
          <input
            name="descricao"
            required
            maxLength={300}
            defaultValue={tarefa?.descricao}
            className="campo"
            placeholder="O que é feito, na linguagem do departamento"
          />
        </label>
        <label>
          <span className="rotulo-campo">Setor</span>
          <select name="setorId" className="campo" defaultValue={tarefa?.setorId}>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rotulo-campo">Periodicidade</span>
          <select
            name="periodicidade"
            className="campo"
            defaultValue={tarefa?.periodicidade ?? "mensal"}
          >
            {PERIODICIDADES.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="rotulo-campo">Prazo (opcional)</span>
          <input
            name="prazoAncora"
            maxLength={60}
            defaultValue={tarefa?.prazoAncora ?? ""}
            className="campo"
            placeholder="dia 10, dia 20, junho…"
          />
        </label>
        <label>
          <span className="rotulo-campo">Peso de criticidade</span>
          <input
            name="peso"
            type="number"
            step="0.5"
            min="0.5"
            max="9.5"
            defaultValue={tarefa?.peso ?? 1}
            className="campo"
          />
        </label>
      </div>
      <p className="conteudo mt-3 max-w-[70ch] text-[0.75rem] leading-relaxed text-aco-escuro">
        O peso só ordena o plano de ação — obrigação com prazo legal sobe na frente
        de tarefa diária. Ele não entra em nenhum indicador publicado.
      </p>
    </>
  );
}

export default async function Catalogo() {
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
  const [setores, todas] = await Promise.all([
    setoresDoDepartamento(dep.id),
    tarefasDoDepartamento(dep.id, ciclo?.id ?? null),
  ]);

  const ativas = todas.filter((t) => t.ativa);
  const inativas = todas.filter((t) => !t.ativa);

  const porSetor: { setor: string; tarefas: TarefaAdmin[] }[] = [];
  for (const t of ativas) {
    const ultimo = porSetor[porSetor.length - 1];
    if (ultimo && ultimo.setor === t.setor) ultimo.tarefas.push(t);
    else porSetor.push({ setor: t.setor, tarefas: [t] });
  }

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
          Seu papel não permite administrar este departamento.
        </AvisoDeServico>
      )}

      <div className="px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div className="max-w-[64ch]">
            <h1 className="letreiro placa text-[1.375rem] leading-tight">
              O catálogo de tarefas
            </h1>
            <p className="conteudo mt-3.5 text-[0.9375rem] leading-relaxed text-aco">
              Tudo o que o departamento faz. Criar uma tarefa abre a linha dela para
              todo mundo no ciclo aberto. Tirar do catálogo não apaga histórico: a
              tarefa para de contar do mês corrente em diante e continua nos meses
              fechados.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link href="/gerenciar" className="botao-fantasma">
              Equipe
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
            <Gaveta rotulo="Cadastrar tarefa">
              <Formulario acao={criarTarefa} enviar="Cadastrar tarefa">
                <CamposDaTarefa setores={setores} />
              </Formulario>
            </Gaveta>
          </div>
        )}

        <p className="rotulo mt-10">
          {contaTarefas(ativas.length)} no catálogo
          {inativas.length > 0 && ` · ${inativas.length} fora`}
        </p>

        <div className="mt-4 space-y-8">
          {porSetor.map((grupo) => (
            <div key={grupo.setor}>
              <div className="aco flex flex-wrap items-baseline gap-x-4 border-y border-black px-4 py-1.5">
                <span className="placa text-[0.6875rem] text-tinta">{grupo.setor}</span>
                <span className="dado text-[0.625rem] tracking-widest text-aco-escuro uppercase">
                  {contaTarefas(grupo.tarefas.length)}
                </span>
              </div>
              <ul>
                {grupo.tarefas.map((t) => (
                  <LinhaDeTarefa
                    key={t.id}
                    tarefa={t}
                    setores={setores}
                    podeMexer={podeMexer}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>

        {inativas.length > 0 && (
          <section className="mt-14">
            <h2 className="placa text-[0.9375rem]">Fora do catálogo</h2>
            <p className="conteudo mt-2.5 max-w-[78ch] text-[0.8125rem] leading-relaxed text-aco">
              Não contam mais no mês corrente. Continuam nos ciclos fechados em que
              existiam, e podem voltar.
            </p>
            <ul className="mt-5 border-t border-black">
              {inativas.map((t) => (
                <LinhaDeTarefa
                  key={t.id}
                  tarefa={t}
                  setores={setores}
                  podeMexer={podeMexer}
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </Painel>
  );
}

function LinhaDeTarefa({
  tarefa,
  setores,
  podeMexer,
}: {
  tarefa: TarefaAdmin;
  setores: { id: number; nome: string }[];
  podeMexer: boolean;
}) {
  return (
    <li className="junta py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-[24rem] flex-1 items-baseline gap-4">
          <span className="dado w-24 shrink-0 text-[0.6875rem] tracking-widest text-aco-escuro uppercase">
            {horarioDaTarefa(tarefa.prazoAncora, tarefa.periodicidade)}
          </span>
          <Link
            href={`/gerenciar/catalogo/${tarefa.id}`}
            className={`conteudo text-[0.8125rem] leading-snug hover:text-ambar ${
              tarefa.ativa ? "text-tinta" : "text-aco-escuro line-through"
            }`}
          >
            {tarefa.descricao}
          </Link>
        </div>

        {tarefa.ativa && (
          <div className="flex shrink-0 items-center gap-5">
            <span className="flex items-center gap-2" title="pessoas que operam sozinhas">
              <PalhetaFixa
                largura={24}
                altura={28}
                tom={TOM_FAROL[farol(tarefa.executam)]}
              >
                {tarefa.executam}
              </PalhetaFixa>
              <span className="rotulo">executam</span>
            </span>
            <span className="flex items-center gap-2" title="pessoas que sabem ensinar">
              <PalhetaFixa
                largura={24}
                altura={28}
                tom={TOM_FAROL[farol(tarefa.ensinam)]}
              >
                {tarefa.ensinam}
              </PalhetaFixa>
              <span className="rotulo">ensinam</span>
            </span>
            <span title={`Operação sozinha: ${situacao(tarefa.executam)}`}>
              <Lampada pessoas={tarefa.executam} />
            </span>
          </div>
        )}

        <div className="flex shrink-0 flex-wrap items-start gap-2">
          <Link href={`/gerenciar/catalogo/${tarefa.id}`} className="botao-fantasma">
            Quem faz
          </Link>
          {podeMexer && (
            <>
              <Gaveta rotulo="Editar">
                <Formulario acao={editarTarefa} enviar="Salvar">
                  <input type="hidden" name="id" value={tarefa.id} />
                  <CamposDaTarefa setores={setores} tarefa={tarefa} />
                </Formulario>
              </Gaveta>
              <BotaoDeAcao
                acao={alternarVigenciaTarefa}
                campos={{ id: tarefa.id, acao: tarefa.ativa ? "desativar" : "reativar" }}
                className={tarefa.ativa ? "botao-fantasma botao-perigo" : "botao-fantasma"}
                confirmar={
                  tarefa.ativa
                    ? `Tirar "${tarefa.descricao}" do catálogo? Ela para de contar nos indicadores do mês corrente. Os ciclos fechados não mudam, e dá para trazer de volta.`
                    : undefined
                }
              >
                {tarefa.ativa ? "Tirar do catálogo" : "Trazer de volta"}
              </BotaoDeAcao>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
