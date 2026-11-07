import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isEqualizerSettings, isPlaylistList, isSongList } from '../../src/types/guards.ts';

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

test('isEqualizerSettings: اعتبارسنجی تنظیمات اکولایزر', () => {
  const valid = {
    enabled: true,
    preset: 'flat',
    bands: [0, 2, -1, 3, 0],
    bassBoost: 4,
  };
  assert.equal(isEqualizerSettings(valid), true);
  assert.equal(isEqualizerSettings({ ...valid, bands: [0, 1] }), false);
  assert.equal(isEqualizerSettings({ ...valid, enabled: 'yes' }), false);
  assert.equal(isEqualizerSettings(null), false);
});
