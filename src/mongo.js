import mongoose from 'mongoose';
import { bunyan } from 'koa-bunyan-logger';
import './plugins';

const logger = bunyan.createLogger({
  name: 'mongodb',
  level: process.env.LOG_LEVEL,
});
console.log({ db: process.env.MONGO_DB });
mongoose.connect(process.env.MONGO_DB, { useNewUrlParser: true });
mongoose.connection.once('openUri', logger.info.bind(logger, 'mongodb connected'));
mongoose.connection.on('error', () => {
  logger.error.bind(logger);
  process.nextTick(process.exit, 1);
});
mongoose.connection.on('disconnected', () => {
  process.nextTick(process.exit, 1);
});
