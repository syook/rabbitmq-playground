const Rabbit = require("./rabbitmq");

class Consumer extends Rabbit {
  constructor() {
    super()
  }

  async initialize(){
    this.channel = await this.init()
  }
}

module.exports = Consumer;
