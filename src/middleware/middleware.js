import rawBody from 'raw-body';
// import tokenProxy from '../common/jwt';
import util from '../common/util';

const getBody = async (ctx, next) => {
  let body = await rawBody(ctx.req);
  if (ctx.request.type !== 'application/json') {
    ctx.throw(400, util.CONTENT_TYPE);
  }
  try {
    body = JSON.parse(body);
  } catch (err) {
    ctx.throw(400, util.CONTENT_TYPE);
  }
  ctx.request.body = body;
  await next();
};

const userAuth = async (ctx, next) => {
  // const { authorization } = ctx.request.headers;
  // if (!authorization) {
  //   ctx.throw(302, util.LOGIN_FRIST); // todo 401?
  // }
  // const { err, user } = await tokenProxy.getUserInfo(authorization);
  // if (err || !user) {
  //   ctx.throw(302, util.LOGIN_FRIST);
  // }
  // ctx.loginUser = user;
  await next();
};

const adminAuth = async (ctx, next) => {
  ctx.loginAdmin = {}; // todo 工作人员鉴权
  await next();
};

module.exports = {
  getBody,
  userAuth,
  adminAuth,
};
