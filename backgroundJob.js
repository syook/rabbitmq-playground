const Consumer = require("./consumer");
let consumerRabbitInstance;

const processMessage = (message) => {
  // console.log("[x] %s: %s", message.properties, message.content.toString());
  let json = JSON.parse(message.content.toString());
  //simulate job processing between 500ms to 1s
  let forwardData = {
    messageId: message.properties.messageId,
    replyTo: message.properties.replyTo,
    headers: {
      retries: message.properties.headers.retries,
      jobType: message.properties.headers.jobType,
    },
  };
  if (json.jobId % 2 === 0) {
    setTimeout(() => {
      // console.log("->", consumerRabbitInstance);
      consumerRabbitInstance.channel.sendToQueue(
        message.properties.replyTo,
        Buffer.from(JSON.stringify(json)),
        forwardData
      );
      consumerRabbitInstance.channel.ack(message);
    }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
  } else {
    //simulating some error which occurred by setting the error block which will be checked when sent back
    json.error = "LOL TESTING";
    setTimeout(() => {
      // console.log("->", consumerRabbitInstance);
      //trying to simulate a failure kind of thing, send it to be requeue and tried again
      //currently this is always leading to infinite times being requeued since there is no way to keep track of retires in this setup
      consumerRabbitInstance.channel.sendToQueue(
        message.properties.replyTo,
        Buffer.from(JSON.stringify(json)),
        forwardData
      );
      consumerRabbitInstance.channel.nack(message, false, false);
    }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
  }
};

const setupConsumer = async () => {
  consumerRabbitInstance = new Consumer();
  const jobTypes = ["some_queue", "another_queue"];
  await consumerRabbitInstance.initialize(jobTypes);
  //tell it to fetch 1 job at a time for processing (kind of like concurrency)
  consumerRabbitInstance.channel.prefetch(10);
  // await consumerRabbitInstance.channel.assertQueue("some_queue", {
  //   durable: true,
  // });
  // await consumerRabbitInstance.channel.assertQueue("another_queue", {
  //   durable: true,
  // });
  // await consumerRabbitInstance.channel.assertQueue("response_queue", {
  //   durable: true,
  // });

  // await consumerRabbitInstance.channel.bindQueue(
  //   "some_queue",
  //   "backgroundJob",
  //   "sometype"
  // );
  //
  // await consumerRabbitInstance.channel.bindQueue(
  //   "another_queue",
  //   "backgroundJob",
  //   "anothertype"
  // );
  //
  // await consumerRabbitInstance.channel.bindQueue(
  //   "response_queue",
  //   "backgroundJob"
  // );

  consumerRabbitInstance.on("error", (err, job) => {
    console.log("ERROR: ", err);
  });

  consumerRabbitInstance.on("failed", (err, job) => {
    console.log("ERROR(on failed): ", err);
  });

  consumerRabbitInstance.channel.consume("some_queue", processMessage, {
    noAck: false,
  });

  consumerRabbitInstance.channel.consume("another_queue", processMessage, {
    noAck: false,
  });

  // consumerRabbitInstance.channel.consume("response_queue", processResponse, {
  //   noAck: true,
  // });
  // await consumerRabbitInstance.addResponseHandler(processResponse);

  process.send("INITIALIZED CONSUMER");
};

setupConsumer();
