import joi from 'joi';
import themeProxy from '../proxy/theme';
import pollProxy from '../proxy/poll';
import util from '../common/util';
import errorMsg from '../common/errorMsg';
import errorCode from '../common/errorCode';

function checkThemeId(ctx, themeId) {
  const { code, message } = util.isMongoId(themeId, 'themeId');
  if (code) {
    ctx.throw(400, message);
  }
}

export default {
  v: {
    submitPoll: {
      body: {
        themeId: joi.string().required(),
        mail: joi.string().email(),
        candidateId: joi.array().min(util.MIN_CANDIDATE_OF_THEME / 2).max(util.MAX_CANDIDATE_OF_THEME / 2)
          .unique(),
      },
    },
    persistence: {
      body: {
        ipAdress: joi.string().ip(),
        themeId: joi.string().required(),
        mail: joi.string().email(),
        candidateId: joi.array().min(util.MIN_CANDIDATE_OF_THEME / 2).max(util.MAX_CANDIDATE_OF_THEME / 2)
          .unique(),
      },
    },
    getPoll: {

    },
  },
  async submitPoll(ctx) {
    const { themeId } = ctx.request.body;
    checkThemeId(ctx, themeId);
    const status = await themeProxy.getThemeStatus({ themeId });
    if (status !== util.THEME_STARTED) {
      ctx.throw(403, errorMsg.formatPollMsg(status));
    }
    const ipAdress = ctx.request.ip;
    const { code } = await pollProxy.addPoll({ ...ctx.request.body, ipAdress });
    if (code) {
      ctx.throw(403, errorMsg.formatPollMsg(code));
    }
    ctx.status = 200;
  },
  async persistence(ctx) {
    const { themeId, candidateId } = ctx.request.body;
    checkThemeId(ctx, themeId);
    const votes = candidateId.map(item => ({ id: item }));
    const [pollDetail] = await Promise.all([pollProxy.create({ ...ctx.request.body, votes }), themeProxy.increaseVote({ themeId, candidateId })]);
    if (pollDetail.err) {
      const { code } = pollDetail.err;
      const message = code === errorCode.DUPLICATE_KEY ? errorMsg.MULTIPLE_VOTING_MSG : errorMsg.BUSY_TIME;
      ctx.throw(403, message);
    }
    ctx.status = 201;
  },
};
