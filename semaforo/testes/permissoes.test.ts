import { describe, expect, test } from 'vitest';
import {
  podeAdministrar,
  podeAprovarAutoavaliacao,
  podeEditarMatriz,
  podeEnviarAutoavaliacao,
  podeVerDepartamento,
  type CicloParaPermissao,
  type Usuario,
} from '@/lib/auth/permissoes';

const gestor: Usuario = { id: 1, nome: 'Gestor', papel: 'gestor', departamentoId: 10 };
const colega: Usuario = { id: 2, nome: 'Colega', papel: 'colaborador', departamentoId: 10 };
const diretor: Usuario = { id: 3, nome: 'Diretor', papel: 'diretoria', departamentoId: 10 };
const gestorDeOutro: Usuario = { id: 4, nome: 'Outro', papel: 'gestor', departamentoId: 20 };

const aberto: CicloParaPermissao = { id: 100, departamentoId: 10, status: 'aberto' };
const fechado: CicloParaPermissao = { id: 99, departamentoId: 10, status: 'fechado' };

describe('podeEditarMatriz', () => {
  test('o gestor do departamento edita o ciclo aberto', () => {
    expect(podeEditarMatriz(gestor, aberto)).toBe(true);
  });

  test('ciclo fechado é imutável inclusive para o gestor', () => {
    expect(podeEditarMatriz(gestor, fechado)).toBe(false);
  });

  test('colaborador e diretoria não editam a matriz', () => {
    expect(podeEditarMatriz(colega, aberto)).toBe(false);
    expect(podeEditarMatriz(diretor, aberto)).toBe(false);
  });

  test('gestor não alcança o ciclo de outro departamento', () => {
    expect(podeEditarMatriz(gestorDeOutro, aberto)).toBe(false);
  });
});

describe('podeVerDepartamento', () => {
  test('a matriz é aberta à equipe — objetivo 5', () => {
    expect(podeVerDepartamento(colega, 10)).toBe(true);
    expect(podeVerDepartamento(gestor, 10)).toBe(true);
  });

  test('a diretoria vê todos os departamentos', () => {
    expect(podeVerDepartamento(diretor, 10)).toBe(true);
    expect(podeVerDepartamento(diretor, 20)).toBe(true);
  });

  test('colaborador não vê departamento alheio', () => {
    expect(podeVerDepartamento(colega, 20)).toBe(false);
  });
});

describe('podeEnviarAutoavaliacao', () => {
  test('cada um declara apenas a própria', () => {
    expect(podeEnviarAutoavaliacao(colega, aberto, colega.id)).toBe(true);
    expect(podeEnviarAutoavaliacao(colega, aberto, gestor.id)).toBe(false);
  });

  test('o gestor também se autoavalia', () => {
    expect(podeEnviarAutoavaliacao(gestor, aberto, gestor.id)).toBe(true);
  });

  test('ciclo fechado não recebe autoavaliação', () => {
    expect(podeEnviarAutoavaliacao(colega, fechado, colega.id)).toBe(false);
  });

  test('a diretoria não participa da matriz', () => {
    expect(podeEnviarAutoavaliacao(diretor, aberto, diretor.id)).toBe(false);
  });
});

describe('podeAprovarAutoavaliacao e podeAdministrar', () => {
  test('aprovar segue a mesma regra de editar a matriz', () => {
    expect(podeAprovarAutoavaliacao(gestor, aberto)).toBe(true);
    expect(podeAprovarAutoavaliacao(gestor, fechado)).toBe(false);
    expect(podeAprovarAutoavaliacao(colega, aberto)).toBe(false);
  });

  test('só o gestor do departamento administra', () => {
    expect(podeAdministrar(gestor, 10)).toBe(true);
    expect(podeAdministrar(gestor, 20)).toBe(false);
    expect(podeAdministrar(colega, 10)).toBe(false);
    expect(podeAdministrar(diretor, 10)).toBe(false);
  });
});
