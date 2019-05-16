import jwt from 'jsonwebtoken';

class PollToken {
  constructor() {
    this.secret = process.env.TOKENSECRET;
  }

  createToken(data) {
    const token = jwt.sign(data, this.secret);
    return token;
  }

  getUserInfo(token) {
    let user;
    try {
      user = jwt.verify(token, this.secret);
    } catch (err) {
      // todo logger
      return { err, user: null };
    }
    return { err: null, user };
  }
}
const pollToken = new PollToken();
export default pollToken;
