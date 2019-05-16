// import { Account, MQBatch } from 'ali-mns'; todo


export default class PollMQ {
  constructor(name, region) {
    this.name = name;
    this.region = region;
    // const account = new Account(process.env.ALI_MNS_ACCOUNT, // todo 为啥测试用例不能替换
    //   process.env.ALI_MNS_KEY, process.env.ALI_MNS_SECRET);
    // this.mqBatch = new MQBatch(name, account, region);
  }

  async sendMessage(dataFormed) {
    try {
      const res = await this.mqBatch.sendP(JSON.stringify(dataFormed));
      if (res.Error) {
        // logger; todo
        return { err: new Error() };
      }
      return { err: null };
    } catch (err) {
      // logger; todo
      return { err };
    }
  }

  async receiveMessage(waitSeconds, numOfMessages) {
    let res;
    try {
      res = this.mqBatch.recvP(waitSeconds, numOfMessages);
    } catch (err) {
      // logger; todo
      return { err, message: null };
    }
    return { err: null, message: res.Messages };
  }

  async deleteMessage(rhsToDel) {
    try {
      await this.mqBatch.deleteP(rhsToDel);
    } catch (err) {
      // logger; todo
      return { err };
    }
    return { err: null };
  }
}
