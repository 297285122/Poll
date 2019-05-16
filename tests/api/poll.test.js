import test from 'ava';
import rewire from 'rewire';
import req from '../helpers/request';
import themeModel from '../../src/models/theme';
import candidateModel from '../../src/models/candidates';
import pollProxy from '../../src/proxy/poll';
import errorCode from '../../src/common/errorCode';

const mailVerfiy = `verfiy_${Math.random().toString(32).substr(3)}@163.com`;

let candidates;
let validTheme;
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
  const [c1, c2, c3, c4] = candidates;
  themeCandidates = [{
    id: c1._doc._id.toString(),
  }, {
    id: c2._doc._id.toString(),
  }, {
    id: c3._doc._id.toString(),
  }, {
    id: c4._doc._id.toString(),
  }];
  validTheme = await themeModel.create({
    name: `theme${Math.random().toString(32).substr(3)}`,
    candidate: themeCandidates,
    startTime: Date.now() / 1000 - oneDay,
    endTime: Date.now() / 1000 + oneDay,
  });
});
test.serial('submit poll ok', async (t) => {
  const pollModule = rewire('../../src/controllers/poll.js');
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const addPoll = () => ({ code: 0 });
  const pro = pollProxy.addPoll;
  pollProxy.addPoll = addPoll;
  const request = pollModule.default.submitPoll;
  const data = {
    request: {
      body: { mail, themeId: validTheme._doc._id.toString(), candidateId: [themeCandidates[0].id, themeCandidates[1].id] },
    },
  };
  await request(data);
  pollProxy.addPoll = pro;
  // t.is(validTheme._doc._id.toString(), 1);
  t.is(data.status, 200);
});
test.serial('submit poll 403', async (t) => {
  const pollModule = rewire('../../src/controllers/poll.js');
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const addPoll = () => ({ code: errorCode.MULTIPLE_VOTING });
  const pro = pollProxy.addPoll;
  pollProxy.addPoll = addPoll;
  const request = pollModule.default.submitPoll;
  const data = {
    request: {
      body: { mail, themeId: validTheme._doc._id.toString(), candidateId: [themeCandidates[0].id, themeCandidates[1].id] },
    },
    throw(status, message) {
      const err = new Error(message);
      err.status = status;
      throw err;
    },
  };
  try {
    await request(data);
  } catch (err) {
    t.is(err.status, 403);
  }
  pollProxy.addPoll = pro;
});
test('submit poll 400, params error', async (t) => {
  const res = await req.put('/api/v1/poll/results').send({ mail: mailVerfiy });
  t.is(res.status, 400);
});
test('save poll ok', async (t) => {
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const ipAdress = '192.168.2.15';
  const res = await req.post('/api/v1/poll/results').send({
    mail,
    ipAdress,
    themeId: validTheme._doc._id.toString(),
    candidateId: [themeCandidates[0].id, themeCandidates[1].id],
  });
  t.is(res.status, 201);
});
