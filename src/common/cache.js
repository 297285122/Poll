import Redis from 'ioredis';

class RedisCache {
  constructor(url, options) {
    this.options = options;
    this.redis = new Redis(url);
  }

  async get(key) {
    let result = await this.redis.get(key);
    if (result && result != null && result !== '') {
      try {
        result = JSON.parse(result);
      } catch (err) {
        // todo logger or do something
        result = false;
      }
    } else {
      result = false;
    }
    return result;
  }

  async mget(keys) {
    const values = await this.redis.mget(keys);
    return values;
  }

  async exist(key) {
    const value = await this.redis.exists(key);
    return value;
  }

  async inc(key) {
    await this.redis.incr(key);
  }

  async set(key, data, ttl) {
    ttl = parseInt(ttl, 10) || this.options.ttl;
    const dataStr = JSON.stringify(data);
    const multi = this.redis.multi();
    multi.set(key, dataStr);
    multi.expire(key, ttl);
    const ret = await multi.exec();
    return ret;
  }

  async del(key) {
    const ret = await this.redis.del(key);
    return ret;
  }
}

const redis = new RedisCache(process.env.REDIS_DB, { ttl: 60 });
export default redis;
// const code = util.md5(uuid.v4());
// const cache_key = `brand:operators:invite:authcode:${code}`;
// await ctx.cache.set(cache_key, reqParams, 7 * 24 * 60 * 60); // 有效期7天
// const cache_key = `brand:operators:invite:authcode:${reqParams.Code}`;
// const cache_data = await ctx.cache.get(cache_key);
// if (!cache_data) {
//   return util.response(-1, 'ERR_INVITE_CODE_EXPIRE');
// }


//       // 获取商品信息
//       const cache_key = `product:ProductVO:BarCode:${row.BarCode}`;
//       let product_row = await ctx.cache.get(cache_key);
//       if (!product_row) {
//         const resp = await ctx.service.product.actAsync({
//           role: 'product.product',
//           cmd: 'find.one',
//         }, {
//           params: {
//             criteria: { BarCode: row.BarCode },
//             options: { ReadOnly: true },
//           },
//         });
//         if (resp.error_code === 0 && resp.data) {
//           product_row = resp.data;
//           await ctx.cache.set(cache_key, resp.data);
//         }
//       }
// 你查询数据库缓存， 用这种
