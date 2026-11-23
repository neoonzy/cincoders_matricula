import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPage} from '../src/pagination.mjs';

test('Página inválida não se apresenta como catálogo vazio', () => {
  assert.equal(clampPage(999, 8, 17), 3);
  assert.equal(clampPage(0, 8, 17), 1);
  assert.equal(clampPage(2, 8, 17), 2);
});

test('Catálogos sem resultados retornam página 1', () => {
  assert.equal(clampPage(99, 8, 0), 1);
});
