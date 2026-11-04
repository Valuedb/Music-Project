import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextInOrder, pickNextShuffled, prevInOrder } from '../../src/player/navigation.ts';
import type { Song } from '../../src/types/index.ts';

const makeSong = (id: string): Song => ({
  id,
  name: id,
  artist: 'x',
  cover: '',
  fileUrl: `blob:${id}`,
  playCount: 0,
  addedAt: 0,
});
const list = ['a', 'b', 'c'].map(makeSong);

test('nextInOrder: وسط لیست، آهنگ بعدی', () => {
  assert.equal(nextInOrder(list, 'a', false)?.id, 'b');
});

test('nextInOrder: آخر لیست بدون loop => null، با loop => اولی', () => {
  assert.equal(nextInOrder(list, 'c', false), null);
  assert.equal(nextInOrder(list, 'c', true)?.id, 'a');
});

test('nextInOrder: آهنگ فعلی توی لیست نیست => اولی؛ لیست خالی => null', () => {
  assert.equal(nextInOrder(list, 'zzz', false)?.id, 'a');
  assert.equal(nextInOrder(list, null, false)?.id, 'a');
  assert.equal(nextInOrder([], 'a', true), null);
});

test('prevInOrder: وسط لیست، آهنگ قبلی', () => {
  assert.equal(prevInOrder(list, 'c', false)?.id, 'b');
});

test('prevInOrder: ابتدای لیست بدون loop => null، با loop => آخری', () => {
  assert.equal(prevInOrder(list, 'a', false), null);
  assert.equal(prevInOrder(list, 'a', true)?.id, 'c');
});

test('pickNextShuffled: در یک دور هر آهنگ دقیقاً یک بار، بعد null (بدون loop)', () => {
  for (let run = 0; run < 100; run++) {
    let played = new Set<string>(['a']);
    let current: string | null = 'a';
    const seen = ['a'];

    for (;;) {
      const pick = pickNextShuffled(list, current, played, false);
      played = pick.played;
      if (!pick.song) break;
      seen.push(pick.song.id);
      current = pick.song.id;
    }

    assert.deepEqual([...seen].sort(), ['a', 'b', 'c']);
  }
});

test('pickNextShuffled: با loop دور بعد شروع می‌شه و آهنگ فعلی پشت سر هم نمی‌آد', () => {
  let played = new Set<string>(['a']);
  let current: string | null = 'a';
  for (let step = 0; step < 300; step++) {
    const pick = pickNextShuffled(list, current, played, true);
    assert.ok(pick.song, 'با loop باید همیشه آهنگی انتخاب بشه');
    assert.notEqual(pick.song.id, current);
    played = pick.played;
    current = pick.song.id;
  }
});

test('pickNextShuffled: لیست تک‌آهنگی با loop => همون آهنگ، بدون loop => null', () => {
  const single = [makeSong('a')];
  assert.equal(pickNextShuffled(single, 'a', new Set(['a']), true).song?.id, 'a');
  assert.equal(pickNextShuffled(single, 'a', new Set(['a']), false).song, null);
});

test('pickNextShuffled: ورودی (played) تغییر نمی‌کنه', () => {
  const played = new Set(['a']);
  pickNextShuffled(list, 'a', played, false);
  assert.deepEqual([...played], ['a']);
});

test('pickNextShuffled: لیست خالی => null', () => {
  assert.equal(pickNextShuffled([], null, new Set(), true).song, null);
});
