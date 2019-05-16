import validator from 'validator';
import crypto from 'crypto';
import errorCode from './errorCode';


const MAX_CANDIDATE_OF_THEME = 10;
const MIN_CANDIDATE_OF_THEME = 4;


module.exports = {
  MAX_CANDIDATE_OF_THEME,
  MIN_CANDIDATE_OF_THEME,

  THEME_STARTED: 'THEME_STARTED',
  THEME_ENDED: 'THEME_ENDED',
  THEME_UNSTARTED: 'THEME_UNSTARTED',
  getDbErrorStatus(code) {
    return code === errorCode.DUPLICATE_KEY ? 409 : 500;
  },
  formatDBError(err) {
    err.code = err.code === 11000 ? errorCode.DUPLICATE_KEY : errorCode.DB_UNKNOWN_ERROR;
    return err;
  },
  isMongoId(id, name) {
    if (validator.isMongoId(id)) {
      return { code: 0 };
    }
    return { code: errorCode.ERR_PARAMS_PRE, message: `${name} should be a mongoId` };
  },
  md5(str) {
    const md5Crypto = crypto.createHash('md5');
    return md5Crypto.update(str).digest('hex').toLocaleUpperCase();
  },
};
