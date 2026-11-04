import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveItem } from '../../src/utils/array.ts';

test('moveItem: جابه‌جایی به جلو و عقب', () => {
  assert.deepEqual(moveItem([1, 2, 3, 4], 0, 2), [2, 3, 1, 4]);
  assert.deepEqual(moveItem([1, 2, 3, 4], 3, 1), [1, 4, 2, 3]);
});

test('moveItem: ورودی را تغییر نمی‌دهد', () => {
  const input = [1, 2, 3];
  moveItem(input, 0, 2);
  assert.deepEqual(input, [1, 2, 3]);
});

test('moveItem: اندیس نامعتبر یا برابر => همان آرایه', () => {
  const input = [1, 2, 3];
  assert.equal(moveItem(input, 1, 1), input);
  assert.equal(moveItem(input, -1, 1), input);
  assert.equal(moveItem(input, 0, 9), input);
  assert.equal(moveItem(input, Number.NaN, 1), input);
});
