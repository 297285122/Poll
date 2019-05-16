import errorCode from './errorCode';
import util from './util';

const BUSY_TIME = '服务器正忙，请稍后再试。';
const MULTIPLE_VOTING_MSG = '您已投票，请勿重复提交。';

module.exports = {
  formatModifyCandidateMsg(code) {
    switch (code) {
      case util.THEME_STARTED:
        return '投票活动已开始，候选人信息不能被更改。';
      case util.THEME_ENDED:
        return '投票活动已结束，候选人信息不能被修改。';
      case errorCode.DUPLICATE_KEY:
        return '候选人已存在，请检查信息。';
      case errorCode.DB_UNKNOWN_ERROR:
        return BUSY_TIME;
      default:
        return '投票活动已开始，候选人信息不能被更改。';
    }
  },
  formatModifyThemeMsg(code) {
    switch (code) {
      case util.THEME_STARTED:
        return '投票活动已开始，投票活动信息不能被更改。';
      case util.THEME_ENDED:
        return '投票活动已结束，投票活动信息不能被更改。';
      case errorCode.DUPLICATE_KEY:
        return '投票活动已存在，请检查信息。';
      case errorCode.DB_UNKNOWN_ERROR:
        return BUSY_TIME;
      default:
        return '投票活动已开始，投票活动信息不能被更改。';
    }
  },
  formatPollMsg(code) {
    switch (code) {
      case util.THEME_UNSTARTED:
        return '投票活动还未开始。';
      case util.THEME_ENDED:
        return '投票活动已结束。';
      case errorCode.MULTIPLE_VOTING:
        return MULTIPLE_VOTING_MSG;
      case errorCode.DB_UNKNOWN_ERROR:
        return BUSY_TIME;
      default:
        return BUSY_TIME;
    }
  },
  BUSY_TIME,
  CANDIDATE_IN_THEME_MSG: '候选人已参加投票活动，请先将候选人移出活动。',
  NOT_FOUND_CANDIDATE: '未找到候选人信息，请确认查询条件。',
  DUPLICATE_MAIL: '该邮箱已被注册。',
  DUPLICATE_CANDIDATE: '候选人已存在',
  DUPLICATE_THEME: '投票活动名称已存在',
  MULTIPLE_VOTING_MSG,
  NOT_FOUND_THEME: '未找到投票活动信息，请确认查询条件。',
  CAN_NOT_POLL_TWICE: '您已投票，请勿重复提交',
  VERIFICATION_EXPIRED_MSG: '无效链接',
  LOGIN_FRIST: '请先登录后，再投票',
  CONTENT_TYPE: '目前只接受json格式数据的请求。',
};
