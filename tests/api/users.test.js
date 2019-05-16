import test from 'ava';
import rewire from 'rewire';
// import { MQ } from 'ali-mns';
import req from '../helpers/request';
import usersProxy from '../../src/proxy/user';
import userModel from '../../src/models/users';
import redis from '../../src/common/cache';
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
test('create user ok', async (t) => {
  const userModule = rewire('../../src/controllers/users.js');
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const create = () => ({ err: null, user: { mail, userId: Math.random().toString(32).substr(24) } });
  const pro = usersProxy.create;
  usersProxy.create = create;
  const request = userModule.default.createUser;
  const data = {
    request: {
      body: { mail, psw: '123456' },
    },
  };
  await request(data);
  usersProxy.create = pro;
  t.is(data.status, 201);
  t.true(data.body.userId !== undefined);
});
test('create user 409', async (t) => {
  const userModule = rewire('../../src/controllers/users.js');
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const create = () => {
    const err = new Error();
    err.code = errorCode.DUPLICATE_KEY;
    return { err, user: null };
  };
  const pro = usersProxy.create;
  usersProxy.create = create;
  const request = userModule.default.createUser;
  const data = {
    request: {
      body: { mail, psw: '123456' },
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
    t.is(err.status, 409);
  }
  usersProxy.create = pro;
});
test('create user 500', async (t) => {
  const userModule = rewire('../../src/controllers/users.js');
  const mail = `cindy_${Math.random().toString(32).substr(3)}@163.com`;
  const create = () => {
    const err = new Error();
    err.code = 'unknown';
    return { err, user: null };
  };
  const pro = usersProxy.create;
  usersProxy.create = create;
  const request = userModule.default.createUser;
  const data = {
    request: {
      body: { mail, psw: '123456' },
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
    t.is(err.status, 500);
  }
  usersProxy.create = pro;
});
test('create user 400, params error', async (t) => {
  const res = await req.post('/api/v1/poll/users').send({ mail: mailVerfiy });
  t.is(res.status, 400);
});
test('verify email 200', async (t) => {
  const code = 'i8iuuiii';
  const cacheKey = `poll:operators:createUser:authcode:${mailVerfiy}`;
  await redis.set(cacheKey, { mail: mailVerfiy, code }, 24 * 60 * 60);
  const res = await req.get(`/api/v1/poll/users/email?mail=${mailVerfiy}&&code=${code}`);
  t.is(res.status, 200);
});
test('verify email 403, can not found the code', async (t) => {
  const res = await req.get(`/api/v1/poll/users/email?mail=${mailVerfiy}&&code=859622`);
  t.is(res.status, 403);
});
test('verify email 400, params error', async (t) => {
  const res = await req.get(`/api/v1/poll/users/email?mail=${mailVerfiy}`);
  t.is(res.status, 400);
});
