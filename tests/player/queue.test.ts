import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveItem } from '../../src/utils/array.ts';
import type { Song } from '../../src/types/index.ts';

const makeSong = (id: string): Song => ({
  id,
  name: `Song ${id}`,
  artist: 'Artist',
  cover: '',
  fileUrl: `blob:${id}`,
  playCount: 0,
  addedAt: 0,
});

test('queue: جابه‌جایی آهنگ به جایگاه بعدی (Play Next)', () => {
  const songs = ['a', 'b', 'c', 'd'].map(makeSong);
  // آهنگ index 2 ('c') به ابتدای صف برود (Play Next)
  const reordered = moveItem(songs, 2, 0);
  assert.equal(reordered[0].id, 'c');
  assert.equal(reordered[1].id, 'a');
  assert.equal(reordered[2].id, 'b');
  assert.equal(reordered[3].id, 'd');
});

test('queue: جابه‌جایی تک‌پله‌ای به بالا و پایین', () => {
  const songs = ['a', 'b', 'c'].map(makeSong);
  // Move down from 0 to 1
  const movedDown = moveItem(songs, 0, 1);
  assert.deepEqual(movedDown.map(s => s.id), ['b', 'a', 'c']);

  // Move up from 2 to 1
  const movedUp = moveItem(songs, 2, 1);
  assert.deepEqual(movedUp.map(s => s.id), ['a', 'c', 'b']);
});
