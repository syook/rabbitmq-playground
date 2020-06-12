const Rabbit = require("./rabbitmq");

class Producer extends Rabbit {
  constructor() {
    super();
  }

  async initialize() {
    this.channel = await this.init();
  }
  /**
   *
   * @param {string} jobType
   * @param {object} jobData
   */
  addJob(jobType, jobData) {
    this.channel.publish(
      "backgroundJob",
      jobType,
      Buffer.from(JSON.stringify(jobData)),
      {
        persistent: true,
        messageId: Date.now().toString(),
        headers: { retries: 0 },
      }
    );
  }
}

module.exports = Producer;
