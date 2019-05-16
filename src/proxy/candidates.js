import candidateModel from '../models/candidates';
import util from '../common/util';

const convert2CandidateDB = (data) => {
  const { candidateName: name, works: entry } = data;
  return { name, entry };
};

const convert2Candidate = (data) => {
  const { name: candidateName, entry: works, id: candidateId } = data;
  return { candidateName, works, candidateId };
};

const getFilter = (data) => {
  const query = {};
  const { candidateName, candidateId } = data;
  if (candidateName) {
    const regex = new RegExp(candidateName); // todo
    query.name = { $regex: regex };
  }
  if (candidateId) {
    query._id = Array.isArray(candidateId) ? { $in: candidateId } : candidateId;
  }
  return query;
};

export default {
  async create(data) {
    let candidate;
    try {
      candidate = await candidateModel.create(convert2CandidateDB(data));
    } catch (err) {
      return { err: util.formatDBError(err) };
    }
    return { err: null, candidate: convert2Candidate(candidate) };
  },
  async updateOne(filter, data) {
    try {
      await candidateModel.updateOne(getFilter(filter), { $set: convert2CandidateDB(data) });
    } catch (err) {
      return { err: util.formatDBError(err) };
    }
    return { err: null };
  },
  async find(data, selection) {
    const candidates = await candidateModel.find(getFilter(data)).select(selection);
    return candidates.map(item => convert2Candidate(item));
  },
  async delete(data) {
    await candidateModel.deleteMany(getFilter(data));
  },
};
