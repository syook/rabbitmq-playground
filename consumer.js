let consumerRabbitInstance;

const processMessage = (message) => {
  console.log(
    " [x] %s: %s",
    message.fields.routingKey,
    message.content.toString()
  );
  //simulate job processing between 500ms to 1s
  setTimeout(() => {
    consumerRabbitInstance.ack(message);
  }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
};

const setupConsumer = async () => {
  consumerRabbitInstance = await require("./rabbitmq")();

  //tell it to fetch 1 job at a time for processing
  consumerRabbitInstance.prefetch(1);

  consumerRabbitInstance.consume("test_queue", processMessage, {
    noAck: false,
  });

  process.send("INITIALIZED CONSUMER");
};

setupConsumer();
