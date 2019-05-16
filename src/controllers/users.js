import joi from 'joi';
import uuid from 'uuid';
import usersProxy from '../proxy/user';
import tokenProxy from '../common/jwt';
import emailProxy from '../common/email';
import util from '../common/util';
import errorCode from '../common/errorCode';
import errorMsg from '../common/errorMsg';
// import email from '../common/email';


export default {
  v: {
    createUser: {
      body: {
        mail: joi.string().email().required(),
        psw: joi.string().required(),
      },
    },
    verifyEmail: {
      query: {
        mail: joi.string().email().required(),
        code: joi.string().required(),
      },
    },
    sendEmail: {
      body: {
        mail: joi.string().email().required(),
        code: joi.string().required(),
      },
    },
  },
  async createUser(ctx) {
    const code = util.md5(uuid.v4());
    const { err, user } = await usersProxy.create({ ...ctx.request.body, code });
    if (err) {
      const message = err.code === errorCode.DUPLICATE_KEY ? errorMsg.DUPLICATE_MAIL : errorMsg.BUSY_TIME;
      ctx.throw(util.getDbErrorStatus(err.code), message);
    }
    const { userId, mail } = user;
    ctx.body = { userId, mail };
    ctx.status = 201;
  },
  async verifyEmail(ctx) {
    const { code } = await usersProxy.verify(ctx.query);
    if (code) {
      ctx.throw(403, errorMsg.VERIFICATION_EXPIRED_MSG);
    }
    const { mail } = ctx.query;
    ctx.body = {
      token: tokenProxy.createToken({ mail }),
    };
    ctx.status = 200;
  },
  async sendEmail(ctx) {
    const { mail, code } = ctx.request.body; // todo 完善邮件内容
    const html = `${process.env.SERVER_URL}/api/:version/poll/users/email?mail=${mail}&&code=${code}`;
    await emailProxy.sendMail({ to: mail, subject: `${process.env.SUBJECT}`, html });
    ctx.status = 200;
  },
};
