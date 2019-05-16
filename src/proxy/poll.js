import PollMQ from '../common/mq';
import redis from '../common/cache';
import pollDetailModel from '../models/pollDetail';
import util from '../common/util';
import errorCode from '../common/errorCode';

const convert2PollDetailDB = (data) => {
  const {
    mail: email, ipAdress: ip, votes, themeId: idOfTheme,
  } = data;
  const pollDetail = { email, ip, idOfTheme };
  pollDetail.vote = votes.map(item => ({ id: item.candidateId, name: item.candidateName }));
  return pollDetail;
};

const convert2PollDetail = (data) => {
  const {
    email: mail, ip: ipAdress, vote, idOfTheme: themeId,
  } = data;
  const pollDetail = { mail, ipAdress, themeId };
  pollDetail.votes = vote.map(item => ({ candidateId: item.id, candidateName: item.name }));
  return pollDetail;
};

const getFilter = (data) => {
  const filter = {};
  const { themeId, candidateId } = data;
  if (themeId) {
    filter.idOfTheme = themeId;
  }
  if (candidateId) {
    filter['vote.id'] = candidateId;
  }
  return filter;
};

export default {
  async create(data) {
    let pollDetail;
    try {
      pollDetail = await pollDetailModel.create(convert2PollDetailDB(data));
    } catch (err) {
      return { err: util.formatDBError(err) };
    }
    return { err: null, candidate: convert2PollDetail(pollDetail) };
  },
  async find(data, selection) {
    const pollDetails = await pollDetailModel.find(getFilter(data)).select(selection);
    return pollDetails.map(item => convert2PollDetail(item));
  },
  async addPoll(params) {
    const {
      mail, themeId, candidateId, ipAdress,
    } = params;
    const flag = 'polled';
    const mailKey = `themeId:${themeId}:mail:${mail}`;
    const ipAdressKey = `themeId:${themeId}:ip:${ipAdress}`;
    const [mailPoll, ipPoll] = await Promise.all([redis.exist(mailKey), redis.exist(ipAdressKey)]);
    if (mailPoll || ipPoll) {
      return { code: errorCode.MULTIPLE_VOTING };
    }
    redis.set(mailKey, flag); // todo 设置有效期为活动时间，活动期间都缓存至数据库
    redis.set(ipAdressKey, flag);
    await Promise.all([candidateId.map(item => redis.inc(`themeId:${themeId}:id:${item}`))]);

    const pollMQ = new PollMQ(process.env.POLLMQNAME, process.env.POLLREGION);
    const { err } = await pollMQ.sendMessage(JSON.stringify(params));
    if (err) {
      return { code: errorCode.SEND_MQ_ERROR };
    }
    return { code: 0 };
  },
};
