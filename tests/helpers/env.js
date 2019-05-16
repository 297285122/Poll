Object.assign(process.env = {
  MONGO_DB: 'mongodb://localhost:27017/poll-test',
  LOG_LEVEL: 'fatal',
  PORT: 3000,
  REDIS_DB: 'redis://127.0.0.1:6379/1',
  TOKENSECRET: 'token',
});
