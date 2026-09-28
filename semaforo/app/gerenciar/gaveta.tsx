/**
 * A gaveta de cadastro.
 *
 * `<details>` nativo: abre e fecha sem uma linha de JavaScript, funciona com
 * teclado por definição e é anunciado corretamente por leitor de tela. O
 * formulário lá dentro fecha a gaveta sozinho quando grava com sucesso.
 *
 * Componente de servidor de propósito — nada aqui precisa de estado no cliente.
 */
export function Gaveta({
  rotulo,
  children,
  className = "",
}: {
  rotulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details className={`group ${className}`}>
      <summary className="botao-fantasma list-none group-open:border-ambar group-open:text-ambar [&::-webkit-details-marker]:hidden">
        {rotulo}
      </summary>
      <div className="mt-3 border border-aco-escuro/45 bg-flap-sombra p-5">
        {children}
      </div>
    </details>
  );
}
