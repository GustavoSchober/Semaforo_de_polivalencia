import { db } from "@/lib/db";
import { departamento } from "@/lib/db/schema";
import {
  evolucaoDaCobertura,
  evolucaoDosColaboradores,
  type SerieColaborador,
} from "@/lib/db/consultas/evolucao";
import { ciclosDoDepartamento } from "@/lib/db/consultas/ciclos";
import { Painel } from "@/app/componentes/moldura";
import { AvisoDeServico } from "@/app/componentes/aviso";
import {
  percentual,
  referenciaCurta,
  referenciaTitulo,
} from "@/app/componentes/formato";
import { IconeTendencia } from "@/app/componentes/icones";

export const dynamic = "force-dynamic";

/* ---------------------------------------------------------------------------
   Os gráficos são acromáticos de propósito.

   A primeira versão marcava crescimento em verde e queda em vermelho. O
   validador de paleta reprovou: verde × vermelho separa ΔE 4,2 em deuteranopia,
   abaixo até do piso de 6 — para quem tem daltonismo vermelho-verde a cor não
   faria trabalho nenhum. E o produto exige que a cor nunca seja o único canal,
   porque este painel é projetado em reunião.

   Então a direção é carregada por três canais que sobrevivem a tudo: a própria
   inclinação da linha, o número com sinal, e a hachura no painel de quem caiu.
   Nenhum deles depende de enxergar cor.
   --------------------------------------------------------------------------- */

/* Os atributos de SVG leem as mesmas variáveis do resto da interface: um valor
   cravado aqui sairia de sincronia com o token no primeiro ajuste de paleta. */
const INK = "var(--color-tinta)";
const INK_FRACA = "var(--color-aco)";
const GRADE = "var(--color-aco-escuro)";
const FUNDO = "var(--color-flap)";

type Ponto = { i: number; v: number };

/** Quebra a série em trechos contíguos: um mês sem avaliação vira lacuna, e não
 *  uma reta atravessando um dado que não existe. */
function trechos(pontos: Ponto[]): Ponto[][] {
  const saida: Ponto[][] = [];
  let atual: Ponto[] = [];
  let anterior: number | null = null;
  for (const p of pontos) {
    if (anterior !== null && p.i !== anterior + 1) {
      if (atual.length) saida.push(atual);
      atual = [];
    }
    atual.push(p);
    anterior = p.i;
  }
  if (atual.length) saida.push(atual);
  return saida;
}

function Trajetoria({
  serie,
  rotulos,
  maximo,
  referencia,
}: {
  serie: SerieColaborador;
  rotulos: string[];
  maximo: number;
  /** A média do departamento em cada ciclo — a linha contra a qual cada um se
   *  lê, para que a comparação não seja com o colega de cima da lista. */
  referencia: number[];
}) {
  const W = 240, H = 104, L = 6, R = 6, T = 12, B = 20;
  const passo = rotulos.length > 1 ? (W - L - R) / (rotulos.length - 1) : 0;
  const x = (i: number) => L + i * passo;
  const y = (v: number) => T + (H - T - B) * (1 - v / maximo);

  const pontos: Ponto[] = serie.pontos
    .map((p) => ({ i: rotulos.indexOf(p.referencia), v: p.pontos }))
    .filter((p) => p.i >= 0)
    .sort((a, b) => a.i - b.i);

  const primeiro = pontos[0]?.v ?? 0;
  const ultimo = pontos[pontos.length - 1]?.v ?? 0;
  const total = ultimo - primeiro;
  const caiu = total < 0;

  const idHachura = `hachura-${serie.colaboradorId}`;

  return (
    <figure>
      <figcaption className="palheta junta flex items-baseline justify-between gap-4 !rounded-none px-3.5 py-2.5">
        <span className="rotulo-forte text-[0.6875rem]">{serie.nome}</span>
        <span className="flex items-baseline gap-1.5">
          <span aria-hidden="true" className="text-tinta-fraca">
            <IconeTendencia
              className="h-3.5 w-3.5"
              direcao={total > 0 ? "sobe" : total < 0 ? "cai" : "parado"}
            />
          </span>
          <span className="dado text-[1.0625rem] text-tinta">
            {total > 0 ? "+" : ""}
            {total}
          </span>
          <span className="rotulo">pts no período</span>
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full bg-flap-sombra"
        role="img"
        aria-label={`${serie.nome}: ${serie.pontos
          .map((p) => `${referenciaTitulo(p.referencia)}, ${p.pontos} pontos`)
          .join("; ")}. Variação no período: ${total > 0 ? "+" : ""}${total} pontos.`}
      >
        <defs>
          <pattern
            id={idHachura}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke={GRADE} strokeWidth="1" opacity="0.28" />
          </pattern>
        </defs>

        {/* quem perdeu pontos recebe hachura: o canal que sobrevive ao daltonismo,
            ao projetor e à impressão em preto e branco */}
        {caiu && (
          <rect
            x={L}
            y={T}
            width={W - L - R}
            height={H - T - B}
            fill={`url(#${idHachura})`}
          />
        )}

        {/* grade recessiva: hairline sólida, um tom acima da superfície */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={L}
            x2={W - R}
            y1={y(maximo * f)}
            y2={y(maximo * f)}
            stroke={GRADE}
            strokeWidth={1}
            opacity={f === 0 ? 0.55 : 0.22}
          />
        ))}

        {/* a média do departamento, recessiva */}
        <path
          d={referencia
            .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`)
            .join(" ")}
          fill="none"
          stroke={INK_FRACA}
          strokeWidth={1}
          opacity={0.42}
        />

        {trechos(pontos).map((t, k) => (
          <path
            key={k}
            d={t.map((p, j) => `${j === 0 ? "M" : "L"} ${x(p.i)} ${y(p.v)}`).join(" ")}
            fill="none"
            stroke={INK}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {pontos.map((p, i) => {
          const extremo = i === 0 || i === pontos.length - 1;
          return (
            <g key={p.i}>
              {/* anel na cor da superfície, em vez de borda desenhada */}
              <circle
                cx={x(p.i)}
                cy={y(p.v)}
                r={extremo ? 4.5 : 3}
                fill={INK}
                stroke={FUNDO}
                strokeWidth={2}
              />
              {/* alvo de toque maior que a marca, com o valor no título nativo */}
              <circle cx={x(p.i)} cy={y(p.v)} r={11} fill="transparent">
                <title>{`${referenciaTitulo(rotulos[p.i])}: ${p.v} pontos`}</title>
              </circle>
            </g>
          );
        })}

        {/* rótulo direto só nos extremos — um número em cada ponto não se lê */}
        {pontos.length > 0 && (
          <>
            <text
              x={x(pontos[0].i)}
              y={H - 6}
              textAnchor="start"
              fill={INK_FRACA}
              className="dado"
              fontSize="9"
            >
              {referenciaCurta(rotulos[pontos[0].i])} · {pontos[0].v}
            </text>
            {pontos.length > 1 && (
              <text
                x={x(pontos[pontos.length - 1].i)}
                y={H - 6}
                textAnchor="end"
                fill={INK}
                className="dado"
                fontSize="9"
              >
                {referenciaCurta(rotulos[pontos[pontos.length - 1].i])} ·{" "}
                {pontos[pontos.length - 1].v}
              </text>
            )}
          </>
        )}
      </svg>
    </figure>
  );
}

function Cobertura({
  dados,
}: {
  dados: { referencia: string; cobertura: number }[];
}) {
  const W = 860, H = 200, L = 46, R = 16, T = 16, B = 30;
  const passo = dados.length > 1 ? (W - L - R) / (dados.length - 1) : 0;
  const x = (i: number) => L + i * passo;
  const y = (v: number) => T + (H - T - B) * (1 - v);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Cobertura do departamento por ciclo: ${dados
        .map((d) => `${referenciaTitulo(d.referencia)}, ${percentual(d.cobertura)}`)
        .join("; ")}`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line
            x1={L}
            x2={W - R}
            y1={y(f)}
            y2={y(f)}
            stroke={GRADE}
            strokeWidth={1}
            opacity={f === 0 ? 0.55 : 0.2}
          />
          <text
            x={L - 10}
            y={y(f) + 3.5}
            textAnchor="end"
            fill={GRADE}
            className="dado"
            fontSize="10"
          >
            {f * 100}%
          </text>
        </g>
      ))}

      <path
        d={dados
          .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.cobertura)}`)
          .join(" ")}
        fill="none"
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {dados.map((d, i) => (
        <g key={d.referencia}>
          <circle
            cx={x(i)}
            cy={y(d.cobertura)}
            r={4.5}
            fill={INK}
            stroke={FUNDO}
            strokeWidth={2}
          />
          <circle cx={x(i)} cy={y(d.cobertura)} r={13} fill="transparent">
            <title>{`${referenciaTitulo(d.referencia)}: ${percentual(d.cobertura)}`}</title>
          </circle>
          <text
            x={x(i)}
            y={H - 9}
            textAnchor={i === 0 ? "start" : i === dados.length - 1 ? "end" : "middle"}
            fill={INK_FRACA}
            className="dado"
            fontSize="10"
          >
            {referenciaCurta(d.referencia)}
          </text>
        </g>
      ))}

      {dados.length > 0 && (
        <text
          x={x(dados.length - 1)}
          y={y(dados[dados.length - 1].cobertura) - 12}
          textAnchor="end"
          fill={INK}
          className="dado"
          fontSize="13"
        >
          {percentual(dados[dados.length - 1].cobertura)}
        </text>
      )}
    </svg>
  );
}

export default async function Evolucao() {
  const [dep] = await db.select().from(departamento).limit(1);
  if (!dep) {
    return (
      <Painel modo="evolucao" departamento="—">
        <div className="mx-auto max-w-[70ch] px-5 py-20">
          <p className="conteudo text-aco">
            Rode <code className="dado bg-flap-sombra px-1.5 py-0.5">npm run db:seed</code>.
          </p>
        </div>
      </Painel>
    );
  }

  const [series, coberturas, ciclos] = await Promise.all([
    evolucaoDosColaboradores(dep.id),
    evolucaoDaCobertura(dep.id),
    ciclosDoDepartamento(dep.id),
  ]);

  const aberto = ciclos.find((c) => c.status === "aberto") ?? ciclos[0];
  const rotulos = [
    ...new Set(series.flatMap((s) => s.pontos.map((p) => p.referencia))),
  ].sort();

  const maximo = Math.max(10, ...series.flatMap((s) => s.pontos.map((p) => p.pontos)));

  // a média do departamento em cada ciclo, para a linha de referência
  const media = rotulos.map((r) => {
    const valores = series
      .map((s) => s.pontos.find((p) => p.referencia === r)?.pontos)
      .filter((v): v is number => v !== undefined);
    return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
  });

  return (
    <Painel
      modo="evolucao"
      departamento={dep.nome}
      cicloId={aberto?.id}
      rodape={
        <p className="conteudo max-w-[92ch] text-[0.75rem] leading-relaxed text-aco-escuro">
          Os gráficos não usam cor para indicar crescimento ou queda. A direção vem da
          inclinação da linha, do número com sinal e da hachura no painel de quem
          recuou — três canais que sobrevivem ao daltonismo, ao projetor da sala de
          reunião e à impressão em preto e branco.
        </p>
      }
    >
      <div className="px-5 py-10">
        <div className="max-w-[72ch]">
          <h1 className="letreiro placa text-[1.375rem] leading-tight">
            Quem cresceu, e não quem está na frente
          </h1>
          <p className="conteudo mt-3.5 text-[0.9375rem] leading-relaxed text-aco">
            A leitura decisiva não é a posição, é a inclinação. Quem lidera em pontos
            pode estar parado há seis meses; quem está atrás pode ser quem mais
            aprendeu. Por isso cada pessoa tem o próprio quadro, na mesma escala, com a
            média do departamento ao fundo — e não uma lista ordenada, que seria um
            ranking disfarçado de evolução.
          </p>
        </div>

        {rotulos.length < 2 && (
          <AvisoDeServico className="mt-8 border-t border-black" titulo="Um ciclo só">
            Há apenas um ciclo com avaliação, então ainda não existe inclinação para
            ler. A curva de evolução começa a valer a partir do segundo fechamento.
          </AvisoDeServico>
        )}

        <AvisoDeServico className="mt-8 border-t border-black" titulo="Antes de concluir">
          Os pontos de uma pessoa somam apenas as células avaliadas. Um ciclo em que
          o preenchimento dela ficou pela metade aparece aqui como queda — e queda de
          preenchimento não é queda de conhecimento. Confira as pendências do ciclo no
          painel de risco antes de ler uma inclinação para baixo como regressão.
        </AvisoDeServico>

        <section className="mt-10">
          <h2 className="rotulo">Pontos por colaborador</h2>
          <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(16.5rem,1fr))]">
            {series.map((s) => (
              <Trajetoria
                key={s.colaboradorId}
                serie={s}
                rotulos={rotulos}
                maximo={maximo}
                referencia={media}
              />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="placa text-[0.9375rem]">Cobertura do departamento</h2>
          <p className="conteudo mt-2.5 max-w-[78ch] text-[0.8125rem] leading-relaxed text-aco">
            O gráfico da planilha acompanha pessoas. Este acompanha o risco: quanto do
            catálogo está coberto na meta de três pessoas por nível.
          </p>
          <div className="mt-5 bg-flap-sombra p-4 pt-5">
            <Cobertura dados={coberturas} />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="placa text-[0.9375rem]">Os números</h2>
          <p className="conteudo mt-2.5 max-w-[78ch] text-[0.8125rem] leading-relaxed text-aco">
            Um travessão significa que a pessoa não foi avaliada naquele ciclo — não
            que ela tenha zerado. A distinção é de propósito, e é o que a planilha não
            sabia fazer.
          </p>
          <table className="mt-5 w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="aco-escura">
                <th scope="col" className="rotulo border-b border-black px-4 py-2.5">
                  Colaborador
                </th>
                {rotulos.map((r) => (
                  <th
                    key={r}
                    scope="col"
                    className="rotulo border-b border-black px-4 py-2.5 text-right"
                  >
                    {referenciaCurta(r)}
                  </th>
                ))}
                <th
                  scope="col"
                  className="rotulo-forte border-b border-black px-4 py-2.5 text-right text-[0.6875rem]"
                >
                  No período
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => {
                const primeiro = s.pontos[0]?.pontos ?? 0;
                const ultimo = s.pontos[s.pontos.length - 1]?.pontos ?? 0;
                const total = ultimo - primeiro;
                return (
                  <tr key={s.colaboradorId} className="junta">
                    <th
                      scope="row"
                      className="rotulo-forte px-4 py-2.5 text-left text-[0.6875rem]"
                    >
                      {s.nome}
                    </th>
                    {rotulos.map((r) => {
                      const p = s.pontos.find((x) => x.referencia === r);
                      return (
                        <td key={r} className="dado px-4 py-2.5 text-right">
                          {p ? (
                            <>
                              {p.pontos}
                              {p.variacao !== null && p.variacao !== 0 && (
                                <span className="dado ml-2 text-[0.8125rem] text-tinta">
                                  {p.variacao > 0 ? "+" : ""}
                                  {p.variacao}
                                </span>
                              )}
                            </>
                          ) : (
                            <span
                              className="text-aco-escuro"
                              title="sem avaliação neste ciclo"
                            >
                              –
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {/* a variação tem peso visual maior que o valor absoluto:
                        senão o quadro volta a ser um ranking */}
                    <td className="dado px-4 py-2.5 text-right text-[1.0625rem] text-tinta">
                      {total > 0 ? "+" : ""}
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </Painel>
  );
}
