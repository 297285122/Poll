import joi from 'joi';
import candidatesProxy from '../proxy/candidates';
import themeProxy from '../proxy/theme';
import util from '../common/util';
import errorMsg from '../common/errorMsg';

function checkCandidateId(ctx, { candidateId }) {
  const { code, message } = util.isMongoId(candidateId, 'candidateId');
  if (code) {
    ctx.throw(400, message);
  }
}

export default {
  v: {
    createCandidate: {
      body: {
        candidateName: joi.string().required(),
        works: joi.string().required(),
      },
    },
    updateCandidate: {
      body: {
        candidateName: joi.string().required(),
        works: joi.string().required(),
      },
      params: {
        candidateId: joi.string().required(),
      },
    },
    getCandidate: {
      query: {
        candidateId: joi.string().required(),
      },
    },
    deleteCandidate: {
      body: {
        candidateId: joi.string().required(),
      },
    },
  },
  async createCandidate(ctx) {
    const { err, candidate } = await candidatesProxy.create(ctx.request.body);
    if (err) {
      ctx.throw(util.getDbErrorStatus(err.code), errorMsg.formatModifyCandidateMsg(err.code));
    }
    const { candidateId } = candidate;
    ctx.body = { candidateId };
    ctx.status = 201;
  },
  async updateCandidate(ctx) {
    const { candidateId } = ctx.params;
    checkCandidateId(ctx, { candidateId });
    const status = await themeProxy.getThemeStatus({ candidateId });
    if (status !== util.THEME_UNSTARTED) {
      ctx.throw(403, errorMsg.formatModifyCandidateMsg(status));
    }
    const { err } = await candidatesProxy.updateOne({ candidateId }, ctx.request.body);
    if (err) {
      ctx.throw(util.getDbErrorStatus(err.code), errorMsg.formatModifyCandidateMsg(err.code));
    }
    ctx.status = 200;
  },
  async getCandidate(ctx) {
    checkCandidateId(ctx, ctx.query);
    const candidate = await candidatesProxy.find(ctx.query);
    if (candidate.length === 0) {
      ctx.throw(404, errorMsg.NOT_FOUND_CANDIDATE);
    }
    [ctx.body] = candidate;
    ctx.status = 200;
  },
  async deleteCandidate(ctx) {
    const { candidateId } = ctx.request.body;
    checkCandidateId(ctx, { candidateId });
    const theme = await themeProxy.findOne({ candidateId }, ['themeId']);
    if (theme) {
      ctx.throw(403, errorMsg.CANDIDATE_IN_THEME_MSG);
    }
    await candidatesProxy.delete({ candidateId });
    ctx.status = 200;
  },
};
