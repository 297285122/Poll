import test from 'ava';
import req from '../helpers/request';
import candidateModel from '../../src/models/candidates';
import themeModel from '../../src/models/theme';

const candidateName = `cindy_${Math.random().toString(32).substr(3)}`;
const conflictName = `conflict_${Math.random().toString(32).substr(3)}`;

let existCandidate;
let validCandidate;
let deleteCandidate;
const oneDay = 24 * 60 * 60;
const entry = 'a nice day';
test.before(async () => {
  existCandidate = await candidateModel.create({
    name: candidateName,
    entry: 'i am a bunny',
  });
  validCandidate = await candidateModel.create({
    name: conflictName,
    entry,
  });
  deleteCandidate = await candidateModel.create({
    name: `delete_${Math.random().toString(32).substr(3)}`,
    entry,
  });
  await themeModel.create({
    name: `theme${Math.random().toString(32).substr(3)}`,
    candidate: [{ id: validCandidate._doc._id.toString() }],
    startTime: Date.now() / 1000 - oneDay,
    endTime: Date.now() / 1000 + oneDay,
  });
});

test('create candidate ok', async (t) => {
  const res = await req.post('/api/v1/poll/candidates').send({
    candidateName: `candy_${Math.random().toString(32).substr(3)}`,
    works: '123456',
  });
  t.is(res.status, 201);
  t.true(res.body.data.candidateId !== undefined);
});
test('create candidate 409', async (t) => {
  const res = await req.post('/api/v1/poll/candidates').send({
    candidateName,
    works: '123456',
  });
  t.is(res.status, 409);
});
test('create candidate 400', async (t) => {
  const res = await req.post('/api/v1/poll/candidates').send({
    candidateName,
  });
  t.is(res.status, 400);
});
test('update candidate 200', async (t) => {
  const res = await req.put(`/api/v1/poll/candidates/${existCandidate._doc._id.toString()}`).send({
    candidateName,
    works: 'i am happy',
  });
  t.is(res.status, 200);
});
test('update candidate 409', async (t) => {
  const res = await req.put(`/api/v1/poll/candidates/${existCandidate._doc._id.toString()}`).send({
    candidateName: conflictName,
    works: 'i am happy',
  });
  t.is(res.status, 409);
});
test('update candidate 400', async (t) => {
  const res = await req.put(`/api/v1/poll/candidates/${existCandidate._doc._id.toString()}`).send({
    works: 'i am happy',
  });
  t.is(res.status, 400);
});
test('update candidate 403', async (t) => {
  const res = await req.put(`/api/v1/poll/candidates/${validCandidate._doc._id.toString()}`).send({
    candidateName,
    works: 'fantastic food',
  });
  t.is(res.status, 403);
});
test('get candidate 200', async (t) => {
  const res = await req.get(`/api/v1/poll/candidates?candidateId=${validCandidate._doc._id.toString()}`);
  t.is(res.body.data.candidateName, conflictName);
  t.is(res.body.data.works, entry);
  t.is(res.status, 200);
});
test('get candidate 404', async (t) => {
  const id = validCandidate._doc._id.toString();
  const wrongId = `${id.substr(0, id.length - 3)}000`;
  const res = await req.get(`/api/v1/poll/candidates?candidateId=${wrongId}`);
  t.is(res.status, 404);
});
test('get candidate 400', async (t) => {
  const res = await req.get('/api/v1/poll/candidates?id=5959595959494}');
  t.is(res.status, 400);
});
test('delete candidate 200', async (t) => {
  const res = await req.delete('/api/v1/poll/candidates').send({
    candidateId: deleteCandidate._doc._id.toString(),
  });
  t.is(res.status, 200);
});
test('delete candidate 400', async (t) => {
  const res = await req.delete('/api/v1/poll/candidates').send({
    deleteCandidate,
  });
  t.is(res.status, 400);
});
