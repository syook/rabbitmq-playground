const child_process = require("child_process");

let backgroundJobProcess;
const setupConsumerChildProcess = () => {
  backgroundJobProcess = child_process.fork("./consumer.js");

  backgroundJobProcess.on("error", (err) => {
    console.log("Background job process error", err);
  });

  backgroundJobProcess.on("message", (message) => {
    setupProducer();
  });
};

let producerRabbitInstance;
const setupProducer = async () => {
  producerRabbitInstance = await require("./rabbitmq")();
  simulateJobs();
};

const simulateJobs = () => {
  [...Array(10).keys()].forEach((id, val) => {
    //simulate job queueing between 500ms to 1s
    setTimeout(() => {
      console.log(`Sending job ${id}`);
      producerRabbitInstance.publish(
        "backgroundJob",
        "sometype",
        Buffer.from(JSON.stringify({ value: "PROCESS-LOL", jobId: id })),
        { persistent: true }
      );
    }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
  });
};

process.on("SIGTERM", () => {
  console.log("Gracefully exiting");
  producerRabbitInstance.close();
  process.exit(1);
});

setupConsumerChildProcess();
