const amqp = require("amqplib");

const CONNECTION_URL = "amqp://localhost";

async function setupRabbit() {
  //creating a connection to rabbitMQ
  let rabbitConnection = await amqp.connect(CONNECTION_URL);

  //create a channel to communicate
  let channel = await rabbitConnection.createChannel();

  //create an exchange (types: direct, topic, fanout,headers,dead letter)
  await channel.assertExchange("backgroundJob", "topic", {
    durable: true,
  });

  //create the queues for that
  // await channel.assertQueue("test_queue", { durable: true });

  //bind the above queue to the exchange
  // await channel.bindQueue("test_queue", "backgroundJob");

  console.log(
    "CONNECTED AND BINDED THE QUEUE TO CHANNEL WITH EXCHANGE TYPE TOPIC"
  );

  //return the newly created channel on which the producer, consumer methods can be called depending on who is initializing them
  return channel;
}

// module.exports = setupRabbit;

class Rabbit {
  async init(){
    return await setupRabbit();
  }
}

module.exports = Rabbit;
