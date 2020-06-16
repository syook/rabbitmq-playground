const Rabbit = require("./rabbitmq");
const util = require("util");
const EventEmitter = require("events");

class Producer extends Rabbit {
  constructor() {
    super();
  }

  async initialize() {
    this.channel = await this.init();
    util.inherits(Producer, EventEmitter);
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
        replyTo: "response_queue",
        headers: { retries: 0, jobType },
      }
    );
  }
}

module.exports = Producer;
