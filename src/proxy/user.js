import usersModel from '../models/users';
import redis from '../common/cache';
import PollMQ from '../common/mq';
import util from '../common/util';
import errorCode from '../common/errorCode';

const convert2UserDB = (data) => {
  const { mail: email, psw: password } = data;
  return { email, password: util.md5(password) };
};

const convert2User = (data) => {
  const {
    email: mail, password: psw, id: userId, verified: verfiy,
  } = data;
  return {
    userId, mail, verfiy, psw,
  };
};

export default {
  async create(data) {
    let user;
    try {
      user = await usersModel.create(convert2UserDB(data));
    } catch (err) {
      return { err: util.formatDBError(err), user: null };
    }
    const { mail, code } = data;
    const cacheKey = `poll:operators:createUser:authcode:${mail}`;
    await redis.set(cacheKey, { code, mail }, 24 * 60 * 60); // 有效期1天
    const userMQ = new PollMQ(process.env.USERMQNAME, process.env.USERREGION);
    const { err: mqErr } = await userMQ.sendMessage({ mail, code });
    if (mqErr) {
      mqErr.code = errorCode.SEND_MQ_ERROR;
      return { err: mqErr, user: null };
    }
    return { err: null, user: convert2User(user) };
  },
  async verify(params) {
    const { mail, code } = params;
    const cacheKey = `poll:operators:createUser:authcode:${mail}`;
    const userInfo = await redis.get(cacheKey);
    if (!userInfo || mail !== userInfo.mail || code !== userInfo.code) {
      return { code: errorCode.VERIFICATION_EXPIRED };
    }
    await usersModel.updateOne({ email: mail }, { $set: { verified: true } });
    return { code: 0 };
  },
};
