import themeModel from '../models/theme';
import redis from '../common/cache';
import util from '../common/util';

const convert2ThemeDB = (data) => {
  const {
    themeName: name, descripton: content, candidates: candidate, start: startTime, end: endTime,
  } = data;
  const theme = {
    name, content, startTime, endTime,
  };
  theme.candidate = candidate.map(item => ({ id: item.candidateId }));
  return theme;
};

const convert2Theme = (data) => {
  const {
    id: themeId, name: themeName, content: descripton, candidate, startTime: start, endTime: end,
  } = data;
  const theme = {
    themeId, themeName, descripton, start, end,
  };
  theme.candidates = candidate.map(item => ({ candidateId: item.id }));
  return theme;
};

const convertKeys = keys => keys.map((item) => {
  switch (item) {
    case 'themeName': return 'name';
    case 'descripton': return 'content';
    case 'themeId': return '_id';
    case 'candidates': return 'candidate';
    case 'candidateId': return 'id';
    case 'start': return 'startTime';
    case 'end': return 'endTime';
    default: return '';
  }
});

const getFilter = (data) => {
  const query = {};
  const { themeName, themeId, candidateId } = data;
  if (themeName) {
    const regex = new RegExp(themeName); // todo
    query.name = { $regex: regex };
  }
  if (themeId) {
    query._id = themeId;
  }
  if (candidateId) {
    query['candidate.id'] = candidateId;
  }
  return query;
};
const findOne = async (filter, selection) => {
  const theme = await themeModel.findOne(getFilter(filter)).select(convertKeys(selection));
  return theme ? convert2Theme(theme) : theme;
};
export default {
  async create(data) {
    let theme;
    try {
      theme = await themeModel.create(convert2ThemeDB(data));
    } catch (err) {
      return { err: util.formatDBError(err) };
    }
    return { err: null, theme: convert2Theme(theme) };
  },
  findOne,
  async updateOne(filter, data) {
    try {
      await themeModel.updateOne(getFilter(filter), { $set: convert2ThemeDB(data) });
    } catch (err) {
      return { err: util.formatDBError(err) };
    }
    return { err: null };
  },
  async getThemeStatus(filter) {
    const theme = await themeModel.findOne(getFilter(filter)).select(['startTime', 'endTime']);
    let status = util.THEME_UNSTARTED;
    if (!theme) {
      status = util.THEME_UNSTARTED; // todo 是否额外定义一个状态
    } else if (theme.endTime < Date.now() / 1000) {
      status = util.THEME_ENDED;
    } else if (theme.startTime < Date.now() / 1000) {
      status = util.THEME_STARTED;
    }
    return status;
  },
  async increaseVote({ themeId, candidateId }) {
    await themeModel.update(
      { _id: themeId },
      { $inc: { 'candidate.$[elem].vote': 1 } },
      {
        multi: true,
        arrayFilters: [{ 'elem.id': { $in: candidateId } }],
      },
    );
  },
  async getTheme({ themeId }) {
    const cacheKey = `poll:Theme:ThemeId:${themeId}`;
    let theme = await redis.get(cacheKey);
    if (!theme) {
      theme = await findOne({ themeId }, ['themeName', 'descripton', 'candidates', 'start', 'end']);
      if (theme) {
        await redis.set(cacheKey, theme);
      }
    }
    if (theme) { // 投票期间 从缓存中读取投票结果
      const keys = theme.candidates.map(item => `themeId:${themeId}:id:${item.candidateId}`);
      const values = redis.mget(keys);
      if (values && Array.isArray(values) && values.some(item => item !== 'nil')) { // todo
        theme.candidates.map((item, index) => {
          item.votes = values[index] === 'nil' ? 0 : values[index];
          return item;
        });
      }
    }
    return theme;
  },
};
