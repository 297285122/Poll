import test from 'ava';
import req from '../helpers/request';
import candidateModel from '../../src/models/candidates';
import themeModel from '../../src/models/theme';

// const candidateName = `cindy_${Math.random().toString(32).substr(3)}`;
const conflictName = `theme_${Math.random().toString(32).substr(3)}`;

let candidates;
let validTheme;
let theme;
const oneDay = 24 * 60 * 60;
const entry = 'a nice day';
let themeCandidates;
test.before(async () => {
  candidates = await Promise.all([candidateModel.create({
    name: `candy_${Math.random().toString(32).substr(3)}`,
    entry: 'i am a bunny',
  }),
  candidateModel.create({
    name: `candy_${Math.random().toString(32).substr(3)}`,
    entry,
  }),
  candidateModel.create({
    name: `candy_${Math.random().toString(32).substr(3)}`,
    entry,
  }),
  candidateModel.create({
    name: `candy${Math.random().toString(32).substr(3)}`,
    entry,
  })]);
  validTheme = await themeModel.create({
    name: conflictName,
    candidate: [{ id: candidates[0]._doc._id.toString() }],
    startTime: Date.now() / 1000 - oneDay,
    endTime: Date.now() / 1000 + oneDay,
  });
  theme = await themeModel.create({
    name: `theme_${Math.random().toString(32).substr(3)}`,
    candidate: [{ id: candidates[0]._doc._id.toString() }],
    startTime: Date.now() / 1000 + oneDay,
    endTime: Date.now() / 1000 + 2 * oneDay,
  });
  const [c1, c2, c3, c4] = candidates;
  themeCandidates = [{
    candidateId: c1._doc._id.toString(),
  }, {
    candidateId: c2._doc._id.toString(),
  }, {
    candidateId: c3._doc._id.toString(),
  }, {
    candidateId: c4._doc._id.toString(),
  }];
});

test('create theme ok', async (t) => {
  const res = await req.post('/api/v1/poll/themes').send({
    themeName: `candy_${Math.random().toString(32).substr(3)}`,
    descripton: '123456',
    candidates: themeCandidates,
    start: Date.now() / 1000 + oneDay,
    end: Date.now() / 1000 + 2 * oneDay,
  });
  t.is(res.status, 201);
  t.true(res.body.data.themeId !== undefined);
});
test('create theme 400', async (t) => {
  const res = await req.post('/api/v1/poll/themes').send({
    themeName: `candy_${Math.random().toString(32).substr(3)}`,
    descripton: '123456',
    candidates: themeCandidates[0],
    start: Date.now() / 1000 + oneDay,
    end: Date.now() / 1000 + 2 * oneDay,
  });
  t.is(res.status, 400);
});
test('create theme 409', async (t) => {
  const res = await req.post('/api/v1/poll/themes').send({
    themeName: conflictName,
    descripton: '123456',
    candidates: themeCandidates,
    start: Date.now() / 1000 + oneDay,
    end: Date.now() / 1000 + 2 * oneDay,
  });
  t.is(res.status, 409);
});
test('get theme 200', async (t) => {
  const res = await req.get(`/api/v1/poll/themes?themeId=${validTheme._doc._id.toString()}`);
  t.is(res.status, 200);
  t.is(res.body.data.themeName, conflictName);
});
test('get theme 404', async (t) => {
  const id = validTheme._doc._id.toString();
  const wrongId = `${id.substr(0, id.length - 3)}000`;
  const res = await req.get(`/api/v1/poll/themes?themeId=${wrongId}`);
  t.is(res.status, 404);
});
test('get theme 400', async (t) => {
  const res = await req.get('/api/v1/poll/themes?themeId=5959595959494}');
  t.is(res.status, 400);
});
test('update theme 200', async (t) => {
  const res = await req.put(`/api/v1/poll/themes/${theme._doc._id.toString()}`).send({
    themeName: `theme_${Math.random().toString(32).substr(3)}`,
    descripton: 'a fantastic pictrue',
    candidates: themeCandidates,
    start: Date.now() / 1000 + oneDay,
    end: Date.now() / 1000 + 2 * oneDay,
  });
  t.is(res.status, 200);
});
test('update theme 409', async (t) => {
  const res = await req.put(`/api/v1/poll/themes/${theme._doc._id.toString()}`).send({
    themeName: conflictName,
    descripton: 'a fantastic pictrue',
    candidates: themeCandidates,
    start: Date.now() / 1000 + oneDay,
    end: Date.now() / 1000 + 2 * oneDay,
  });
  t.is(res.status, 409);
});
test('update theme 400', async (t) => {
  const res = await req.put(`/api/v1/poll/themes/${theme._doc._id.toString()}`).send({
    themeName: `theme_${Math.random().toString(32).substr(3)}`,
    descripton: 'a fantastic pictrue',
    candidates: themeCandidates[0],
  });
  t.is(res.status, 400);
});
test('update theme 403', async (t) => {
  const res = await req.put(`/api/v1/poll/themes/${validTheme._doc._id.toString()}`).send({
    themeName: `theme_${Math.random().toString(32).substr(3)}`,
    descripton: 'a fantastic pictrue',
    candidates: themeCandidates,
    start: Date.now() / 1000 + oneDay,
    end: Date.now() / 1000 + 2 * oneDay,
  });
  t.is(res.status, 403);
});
