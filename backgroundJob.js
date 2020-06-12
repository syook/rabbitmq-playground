const Consumer = require("./consumer");
let consumerRabbitInstance;

const processMessage = (message) => {
  console.log("[x] %s: %s", message.properties, message.content.toString());
  let json = JSON.parse(message.content.toString());
  //simulate job processing between 500ms to 1s
  if (json.jobId % 2 === 0) {
    setTimeout(() => {
      consumerRabbitInstance.channel.ack(message);
    }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
  } else {
    setTimeout(() => {
      //trying to simulate a failure kind of thing, send it to be requeue and tried again
      //currently this is always leading to infinite times being requeued since there is no way to keep track of retires in this setup
      consumerRabbitInstance.channel.nack(message, false, true);
    }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
  }
};

const setupConsumer = async () => {
  consumerRabbitInstance = new Consumer();
  await consumerRabbitInstance.initialize();
  //tell it to fetch 1 job at a time for processing (kind of like concurrency)
  consumerRabbitInstance.channel.prefetch(10);
  await consumerRabbitInstance.channel.assertQueue("some_queue", {
    durable: true,
  });
  await consumerRabbitInstance.channel.assertQueue("another_queue", {
    durable: true,
  });

  await consumerRabbitInstance.channel.bindQueue(
    "some_queue",
    "backgroundJob",
    "sometype"
  );

  await consumerRabbitInstance.channel.bindQueue(
    "another_queue",
    "backgroundJob",
    "anothertype"
  );

  consumerRabbitInstance.channel.consume("some_queue", processMessage, {
    noAck: false,
  });

  consumerRabbitInstance.channel.consume("another_queue", processMessage, {
    noAck: false,
  });

  process.send("INITIALIZED CONSUMER");
};

setupConsumer();