import Koa from 'koa';
import koaBunyanLogger, { bunyan } from 'koa-bunyan-logger';
import session from 'koa-session2';
import './env';
import './mongo';
import routes from './routers';


const writeLog = async (ctx, err) => {
  if (ctx.method === 'GET') return;
  console.log(err); // todo
};
// function healthCheck(ctx, next) {
//   if (ctx.request.path === '/' && ctx.method === 'GET') {
//     return (ctx.status = 200);
//   }

//   return next();
// }
const app = new Koa();
const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    await writeLog(ctx, err);
    ctx.status = err.status;
    ctx.body = { code: err.code || -1, message: err.message || 'unknown error' };
  }
};

const successHandler = async (ctx, next) => {
  await next();
  if (ctx.type !== 'text/html') {
    ctx.response.set('X-Server-Request-Id', ctx.reqId);
    if (!ctx.status || (ctx.status >= 200 && ctx.status < 400)) {
      await writeLog(ctx, null);
      if (ctx.formatBody !== false) {
        ctx.body = {
          code: 0,
          message: 'success',
          data: ctx.body,
        };
      }
    }
  }
};

function bindLogger(logger) {
  global.console.log = logger.info.bind(logger);
  global.console.debug = logger.debug.bind(logger);
  global.console.info = logger.info.bind(logger);
  global.console.error = logger.error.bind(logger);
  global.console.warn = logger.warn.bind(logger);
  global.console.fatal = logger.fatal.bind(logger);
  global.logger = logger;
}
app.proxy = true;
const name = 'poll-logs';
const level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
bindLogger(bunyan.createLogger({ name, level, serializers: bunyan.stdSerializers }));

app
  .use(errorHandler)
  .use(successHandler)
  .use(koaBunyanLogger({
    name: 'POLL',
    level: (
      process.env.NODE_ENV === 'test'
        ? 'fatal'
        : process.env.LOG_LEVEL
    ),
  }))
  .use(koaBunyanLogger.requestIdContext())
  .use(koaBunyanLogger.requestLogger())
  .use(session({
    key: 'POLL-SESSIONID',
  }));

routes(app);

export default app;

if (!module.parent) {
  app.listen(process.env.PORT);
}
