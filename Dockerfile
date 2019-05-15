FROM registry-internal.cn-hangzhou.aliyuncs.com/utu-service/base:node
MAINTAINER yangxia.22@163.com

COPY package.tgz /tmp
RUN tar -xzf /tmp/package.tgz -C /tmp \
  && mkdir /app \
  && cp /tmp/package.json /app \
  && cd /app \
  && cnpm install --production \
  && cp -r /tmp/dist /app/dist

WORKDIR /app

EXPOSE 3000
CMD ["npm", "start"]