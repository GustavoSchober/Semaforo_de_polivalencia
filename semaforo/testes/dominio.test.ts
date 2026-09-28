import { describe, expect, test } from 'vitest';
import { farol, falsaSeguranca } from '@/lib/dominio/farol';
import { criticidade } from '@/lib/dominio/criticidade';
import { cobertura, pontosDaTarefa, pontosMeta } from '@/lib/dominio/cobertura';
import { ehNivelValido } from '@/lib/dominio/constantes';

describe('farol', () => {
  test('zero e um são ambos vermelhos — a regra do sponsor', () => {
    expect(farol(0)).toBe('vermelho');
    expect(farol(1)).toBe('vermelho');
  });

  test('duas pessoas é amarelo, três ou mais é verde', () => {
    expect(farol(2)).toBe('amarelo');
    expect(farol(3)).toBe('verde');
    expect(farol(5)).toBe('verde');
  });
});

describe('falsaSeguranca', () => {
  test('verde no nível 1 com vermelho no nível 4 é falsa segurança', () => {
    expect(falsaSeguranca({ nivel_1: 3, nivel_4: 1 })).toBe(true);
    expect(falsaSeguranca({ nivel_1: 3, nivel_4: 0 })).toBe(true);
  });

  test('não acusa quando há especialistas suficientes', () => {
    expect(falsaSeguranca({ nivel_1: 3, nivel_4: 3 })).toBe(false);
  });

  test('não acusa quando o próprio nível 1 já está em alerta', () => {
    expect(falsaSeguranca({ nivel_1: 1, nivel_4: 0 })).toBe(false);
  });
});

describe('cobertura', () => {
  test('tarefa dominada por 3 pessoas em todos os níveis vale 100%', () => {
    const plena = { nivel_1: 3, nivel_2: 3, nivel_3: 3, nivel_4: 3 };
    expect(pontosDaTarefa(plena)).toBe(12);
    expect(cobertura([plena])).toBe(1);
  });

  test('excedente acima da meta não passa de 100% (opção A da seção 7.1)', () => {
    const todos = { nivel_1: 5, nivel_2: 5, nivel_3: 5, nivel_4: 5 };
    expect(pontosDaTarefa(todos)).toBe(12);
    expect(cobertura([todos])).toBe(1);
  });

  test('tarefa que ninguém executa vale 0%', () => {
    expect(cobertura([{ nivel_1: 0, nivel_2: 0, nivel_3: 0, nivel_4: 0 }])).toBe(0);
  });

  test('o denominador acompanha a quantidade de tarefas', () => {
    expect(pontosMeta(64)).toBe(768);
    expect(pontosMeta(15)).toBe(180);
  });

  test('conjunto vazio devolve null, não uma divisão por zero', () => {
    expect(cobertura([])).toBeNull();
  });

  test('caso calculado à mão: 2 tarefas, 14 de 24 pontos', () => {
    const t1 = { nivel_1: 3, nivel_2: 2, nivel_3: 2, nivel_4: 1 }; // 8
    const t2 = { nivel_1: 3, nivel_2: 2, nivel_3: 1, nivel_4: 0 }; // 6
    expect(cobertura([t1, t2])).toBeCloseTo(14 / 24, 10);
  });
});

describe('criticidade', () => {
  test('tarefa sem ninguém autônomo e sem especialista é a mais crítica', () => {
    expect(criticidade({ nivel_3: 0, nivel_4: 0 })).toBe(6);
  });

  test('tarefa na meta em ambos os níveis tem criticidade zero', () => {
    expect(criticidade({ nivel_3: 3, nivel_4: 3 })).toBe(0);
    expect(criticidade({ nivel_3: 5, nivel_4: 4 })).toBe(0);
  });

  test('o peso separa obrigação com prazo legal de tarefa diária', () => {
    const semaforo = { nivel_3: 1, nivel_4: 0 };
    const diaria = criticidade(semaforo, 1);
    const prazoLegal = criticidade(semaforo, 2.5);
    expect(diaria).toBe(5);
    expect(prazoLegal).toBe(12.5);
    expect(prazoLegal).toBeGreaterThan(diaria);
  });
});

describe('ehNivelValido', () => {
  test('aceita apenas os cinco estados que existem', () => {
    expect([0, 1, 2, 3, 4].every(ehNivelValido)).toBe(true);
  });

  test('recusa o que a planilha aceitaria em silêncio', () => {
    expect(ehNivelValido(5)).toBe(false);
    expect(ehNivelValido(-1)).toBe(false);
    expect(ehNivelValido(11)).toBe(false);
    expect(ehNivelValido(2.5)).toBe(false);
  });
});
