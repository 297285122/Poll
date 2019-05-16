import test from 'ava';
import cache from '../../src/common/cache';

test('set and get ok', async (t) => {
  const key = `poll:cache:id:${Math.random().toString(32).substr(3)}`;
  const value = {
    name: 'candy',
    works: 'a nice day',
  };
  await cache.set(key, value);
  const cacheValue = await cache.get(key);
  t.is(value.name, cacheValue.name);
  t.is(value.works, cacheValue.works);
});

test('set and del ok', async (t) => {
  const key = `poll:cache:id:${Math.random().toString(32).substr(3)}`;
  const value = {
    name: 'happy',
    works: 'a nice day',
  };
  await cache.set(key, value);
  await cache.del(key);
  const cacheValue = await cache.get(key);
  t.is(cacheValue, false);
});

test('set and mget ok', async (t) => {
  const keys = [];
  for (let i = 0; i < 4; i += 1) {
    keys.push(`poll:cache:id:${Math.random().toString(32).substr(3)}`);
  }
  await Promise.all(keys.map((item, index) => cache.set(item, index)));
  const values = await cache.mget(keys);
  for (let i = 0; i < 4; i += 1) {
    t.is(values[i], String(i));
  }
});

test('set and incr ok', async (t) => {
  const times = [1, 1, 1, 1];
  const key = `poll:cache:id:${Math.random().toString(32).substr(3)}`;
  await Promise.all(times.map(item => cache.inc(key)));
  const value = await cache.get(key);
  t.is(value, times.length);
});

test('set and exist ok', async (t) => {
  const key = `poll:cache:id:${Math.random().toString(32).substr(3)}`;
  const value = {
    name: 'happy',
    works: 'a nice day',
  };
  await cache.set(key, value);
  const res = await cache.exist(key);
  t.is(res, 1);
});
