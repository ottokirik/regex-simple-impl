import { describe, expect, test } from 'vitest';
import { char, EPSILON, concat, or, rep, plusRep, questionRep } from '../src';

describe('single character', () => {
  test('single character', () => {
    const a = char('a');

    expect(a.test('a')).toBe(true);
    expect(a.test('b')).toBe(false);
  });

  test('epsilon', () => {
    const epsilon = char(EPSILON);

    expect(epsilon.test('')).toBe(true);
    expect(epsilon.test('a')).toBe(false);
  });
});

describe('concatenation', () => {
  test('concatenation', () => {
    const re = concat(char('a'), char('b'), char('c'));

    expect(re.test('abc')).toBe(true);
    expect(re.test('aba')).toBe(false);
  });
});

describe('or', () => {
  test('or', () => {
    const re = or(char('a'), char('b'), char('c'));

    expect(re.test('a')).toBe(true);
    expect(re.test('b')).toBe(true);
    expect(re.test('c')).toBe(true);
    expect(re.test('d')).toBe(false);
  });
});

describe('rep', () => {
  test('rep char', () => {
    const re = rep(char('a'));

    expect(re.test('')).toBe(true);
    expect(re.test('a')).toBe(true);
    expect(re.test('aa')).toBe(true);
  });

  test('rep or', () => {
    const re = rep(or(char('a'), char('b')));

    expect(re.test('')).toBe(true);
    expect(re.test('a')).toBe(true);
    expect(re.test('aa')).toBe(true);
    expect(re.test('b')).toBe(true);
    expect(re.test('bb')).toBe(true);
    expect(re.test('c')).toBe(false);
  });
});

describe('composition', () => {
  test('one or more', () => {
    const re = plusRep(char('a'));

    expect(re.test('')).toBe(false);
    expect(re.test('a')).toBe(true);
    expect(re.test('aa')).toBe(true);
    expect(re.test('aaa')).toBe(true);
  });

  test('zero or one', () => {
    const re = questionRep(char('a'));

    expect(re.test('')).toBe(true);
    expect(re.test('a')).toBe(true);
    expect(re.test('aa')).toBe(false);
  });
});
