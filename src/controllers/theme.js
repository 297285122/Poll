import joi from 'joi';
import themeProxy from '../proxy/theme';
import util from '../common/util';
import errorCode from '../common/errorCode';
import errorMsg from '../common/errorMsg';

const verifyCandidates = (ctx, { candidates }) => {
  let ret;
  candidates.some((item) => {
    ret = util.isMongoId(item.candidateId, 'candidateId');
    if (ret.code) {
      return true;
    }
    return false;
  });
  if (ret.code) {
    ctx.throw(400, ret.message);
  }
};
const checkThemeId = (ctx, { themeId }) => {
  const { code, message } = util.isMongoId(themeId, 'themeId');
  if (code) {
    ctx.throw(400, message);
  }
};

export default {
  v: {
    createTheme: {
      body: {
        themeName: joi.string().required(),
        descripton: joi.string().optional(),
        candidates: joi.array().required().min(util.MIN_CANDIDATE_OF_THEME).max(util.MAX_CANDIDATE_OF_THEME)
          .unique(),
        start: joi.number().optional().min(Date.now() / 1000),
        end: joi.number().optional().min(joi.ref('start')),
      },
    },
    updateTheme: {
      body: {
        themeName: joi.string().required(),
        descripton: joi.string().optional(),
        candidates: joi.array().required().min(util.MIN_CANDIDATE_OF_THEME).max(util.MAX_CANDIDATE_OF_THEME)
          .unique(),
        start: joi.number().optional().min(Date.now() / 1000),
        end: joi.number().optional().min(joi.ref('start')),
      },
      params: {
        themeId: joi.string().required(),
      },
    },
    getTheme: {
      query: {
        themeId: joi.string().required(),
      },
    },
  },
  async createTheme(ctx) {
    verifyCandidates(ctx, ctx.request.body);
    const { err, theme } = await themeProxy.create(ctx.request.body);
    if (err) {
      const { code } = err;
      const message = code === errorCode.DUPLICATE_KEY ? errorMsg.DUPLICATE_THEME : errorMsg.BUSY_TIME;
      ctx.throw(util.getDbErrorStatus(code), message);
    }
    const { themeId } = theme;
    ctx.body = { themeId };
    ctx.status = 201;
  },
  async updateTheme(ctx) {
    const { themeId } = ctx.params;
    checkThemeId(ctx, { themeId });
    verifyCandidates(ctx, ctx.request.body);
    const status = await themeProxy.getThemeStatus({ themeId });
    if (status !== util.THEME_UNSTARTED) {
      ctx.throw(403, errorMsg.formatModifyThemeMsg(status));
    }
    const { err } = await themeProxy.updateOne({ themeId }, ctx.request.body);
    if (err) {
      ctx.throw(util.getDbErrorStatus(err.code), errorMsg.formatModifyThemeMsg(err.code));
    }
    ctx.status = 200;
  },
  async getTheme(ctx) {
    const { themeId } = ctx.query;
    checkThemeId(ctx, { themeId });
    const theme = await themeProxy.getTheme({ themeId });
    if (!theme) {
      ctx.throw(404, errorMsg.NOT_FOUND_THEME);
    }
    ctx.body = theme;
    ctx.status = 200;
  },
};
