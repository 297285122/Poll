import test from 'ava';
import rewire from 'rewire';
import PollMQ from '../../src/common/mq';
import req from '../helpers/request';
import userModel from '../../src/models/users';
import errorCode from '../../src/common/errorCode';
import util from '../../src/common/util';

const mailVerfiy = `verfiy_${Math.random().toString(32).substr(3)}@163.com`;

test.before(async () => {
  await userModel.create({
    email: mailVerfiy,
    password: util.md5('123456'),
    verified: false,
  });
});
test.serial('proxy create user ok', async (t) => {
  const userModule = rewire('../../src/proxy/user.js');
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
  const data = { mail, psw: '123456' };
  const { user } = await userModule.default.create(data);
  PollMQ.prototype.sendMessage = pro;
  t.is(user.mail, mail);
  t.true(user.userId !== undefined);
});
test.serial('proxy create user errorCode.DUPLICATE_KEY', async (t) => {
  const userModule = rewire('../../src/proxy/user.js');
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
  const data = { mailVerfiy, psw: '123456' };
  const { err } = await userModule.default.create(data);
  PollMQ.prototype.sendMessage = pro;
  t.is(err.code, errorCode.DUPLICATE_KEY);
});
test.serial('proxy create user errorCode.SEND_MQ_ERROR', async (t) => {
  const userModule = rewire('../../src/proxy/user.js');
  const sendMessage = async (msg) => {
    return { err: new Error() };
  };
  const pro = PollMQ.prototype.sendMessage;
  PollMQ.prototype.sendMessage = sendMessage;
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const data = { mail, psw: '123456' };
  const { err } = await userModule.default.create(data);
  PollMQ.prototype.sendMessage = pro;
  t.is(err.code, errorCode.SEND_MQ_ERROR);
});
