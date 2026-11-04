import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlaylistList, isSongList } from '../../src/types/guards.ts';

const song = { id: '1', name: 'n', fileUrl: 'blob:x' };

test('isSongList: آرایه‌ی معتبر و خالی', () => {
  assert.equal(isSongList([]), true);
  assert.equal(isSongList([song]), true);
});

test('isSongList: داده‌ی خراب رد می‌شه', () => {
  assert.equal(isSongList(null), false);
  assert.equal(isSongList({}), false);
  assert.equal(isSongList([{ id: 1 }]), false);
  assert.equal(isSongList([song, 'x']), false);
});

test('isPlaylistList: ساختار پلی‌لیست', () => {
  assert.equal(isPlaylistList([{ id: 'p', name: 'P', songs: [song] }]), true);
  assert.equal(isPlaylistList([{ id: 'p', name: 'P' }]), false);
  assert.equal(isPlaylistList('x'), false);
});
