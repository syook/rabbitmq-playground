let consumerRabbitInstance;

const processMessage = (message) => {
  message.fields.retries = message.fields.retries
    ? (message.fields.retries += 1)
    : 0;
  console.log(" [x] %s: %s", message.fields, message.content.toString());
  let json = JSON.parse(message.content.toString());
  //simulate job processing between 500ms to 1s
  // setTimeout(() => {
  //   consumerRabbitInstance.ack(message, false, true);
  // }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
  if (json.jobId % 2 === 0) {
    setTimeout(() => {
      consumerRabbitInstance.ack(message);
    }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
  } else {
    setTimeout(() => {
      consumerRabbitInstance.nack(message, false, false);
    }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
  }
};

const setupConsumer = async () => {
  consumerRabbitInstance = await require("./rabbitmq")();

  //tell it to fetch 1 job at a time for processing (kind of like concurrency)
  consumerRabbitInstance.prefetch(10);
  await consumerRabbitInstance.assertQueue("some_queue", {
    durable: true,
  });
  await consumerRabbitInstance.assertQueue("another_queue", { durable: true });

  await consumerRabbitInstance.bindQueue(
    "some_queue",
    "backgroundJob",
    "sometype"
  );

  await consumerRabbitInstance.bindQueue(
    "another_queue",
    "backgroundJob",
    "anothertype"
  );

  consumerRabbitInstance.consume("some_queue", processMessage, {
    noAck: false,
  });

  consumerRabbitInstance.consume("another_queue", processMessage, {
    noAck: false,
  });

  process.send("INITIALIZED CONSUMER");
};

setupConsumer();
