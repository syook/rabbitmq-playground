const Rabbit = require("./rabbitmq");
const util = require("util");
const EventEmitter = require("events");

class Consumer extends Rabbit {
  constructor() {
    super();
  }

  /**
   *
   * @param {Array.<string>} jobTypes
   * @returns {Promise<void>}
   */
  async initialize(jobTypes) {
    this.channel = await this.init();

    //extend from the EventEmitter Object also to enable events
    util.inherits(Consumer, EventEmitter);

    //setup all the queues that are in the jobTypes and ensure the queue exists
    for (const jobType of jobTypes) {
      await this.channel.assertQueue(jobType, { durable: true });
      await this.channel.bindQueue(jobType, "backgroundJob", jobType);
    }
    //setup responseHandler
    await this.channel.assertQueue("response_queue", { durable: true });

    this.channel.consume("response_queue", this._processResponse.bind(this), {
      noAck: true,
    });
  }

  /**
   *
   * @param {Object} message
   * @returns {*}
   * @private
   */
  _processResponse(message) {
    console.log("_________________________________");
    // console.log(message.content.toString());
    const response = JSON.parse(message.content.toString());
    console.log(message.properties.headers.retries);
    if (response.error) {
      this.emit("error", response.error, message.properties.headers);
      if (message.properties.headers.retries >= 3) {
        //fail the job and do not requeue it
        return this.emit("failed", response.error, message.properties.headers);
      }
      let messageContent = response;
      let retries = (message.properties.headers.retries += 1);
      let jobType = message.properties.headers.jobType;
      console.log(retries, jobType);
      this.channel.sendToQueue(
        jobType,
        Buffer.from(JSON.stringify(messageContent)),
        {
          replyTo: message.properties.replyTo,
          headers: { retries, jobType: jobType },
        }
      );
    }

    console.log(".......................................");
  }

  /**
   *
   * @param {function} callback
   * @returns {Promise<void>}
   */
  // async addResponseHandler(callback) {
  //   await this.channel.assertQueue("response_queue", { durable: true });
  //   this.channel.consume("response_queue", this._processResponse.bind(this), {
  //     noAck: true,
  //   });
  // }
}

module.exports = Consumer;
