import test from 'ava';
import rewire from 'rewire';
import req from '../helpers/request';
import PollMQ from '../../src/common/mq';
import candidateModel from '../../src/models/candidates';
import themeModel from '../../src/models/theme';
import errorCode from '../../src/common/errorCode';

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

test.serial('proxy add poll ok', async (t) => {
  const pollModule = rewire('../../src/proxy/poll.js');
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const sendMessage = async (msg) => {
    return Promise.resolve({
      Message: {
        MessageId: '5F290C926D472878-2-14D9529A8FA-200000001',
        MessageBodyMD5: 'C5DD56A39F5F7BB8B3337C6D11B6D8C7',
        ReceiptHandle: '1-ODU4OTkzNDU5My0xNDM1MTk3NjAwLTItNg==',
      },
    });
  };
  const pro = PollMQ.prototype.sendMessage;
  PollMQ.prototype.sendMessage = sendMessage;
  const data = {
    mail,
    themeId: validTheme._doc._id.toString(),
    candidateId: [themeCandidates[0].id, themeCandidates[1].id],
    ipAdress: '192.168.0.1',
  };
  const { code } = await pollModule.default.addPoll(data);
  PollMQ.prototype.sendMessage = pro;
  t.is(code, 0);
});

test.serial('proxy add poll errorCode.MULTIPLE_VOTING', async (t) => {
  const pollModule = rewire('../../src/proxy/poll.js');
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const sendMessage = async (msg) => {
    return Promise.resolve({
      Message: {
        MessageId: '5F290C926D472878-2-14D9529A8FA-200000001',
        MessageBodyMD5: 'C5DD56A39F5F7BB8B3337C6D11B6D8C7',
        ReceiptHandle: '1-ODU4OTkzNDU5My0xNDM1MTk3NjAwLTItNg==',
      },
    });
  };
  const pro = PollMQ.prototype.sendMessage;
  PollMQ.prototype.sendMessage = sendMessage;
  const data = {
    mail,
    themeId: validTheme._doc._id.toString(),
    candidateId: [themeCandidates[0].id, themeCandidates[1].id],
    ipAdress: '192.168.0.1',
  };
  const { code } = await pollModule.default.addPoll(data);
  PollMQ.prototype.sendMessage = pro;
  t.is(code, errorCode.MULTIPLE_VOTING);
});

test.serial('proxy add poll errorCode.SEND_MQ_ERROR', async (t) => {
  const pollModule = rewire('../../src/proxy/poll.js');
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const sendMessage = async (msg) => {
    return { err: new Error() };
  };
  const pro = PollMQ.prototype.sendMessage;
  PollMQ.prototype.sendMessage = sendMessage;
  const data = {
    mail,
    themeId: validTheme._doc._id.toString(),
    candidateId: [themeCandidates[0].id, themeCandidates[1].id],
    ipAdress: '192.168.0.2',
  };
  const { code } = await pollModule.default.addPoll(data);
  PollMQ.prototype.sendMessage = pro;
  t.is(code, errorCode.SEND_MQ_ERROR);
});
