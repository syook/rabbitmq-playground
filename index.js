const child_process = require("child_process");
const Producer = require("./producer");

let backgroundJobProcess;
const setupConsumerChildProcess = () => {
  backgroundJobProcess = child_process.fork("./backgroundJob.js");

  backgroundJobProcess.on("error", (err) => {
    console.log("Background job process error", err);
  });

  backgroundJobProcess.on("message", (message) => {
    setupProducer();
  });
};

let producerRabbitInstance;
const setupProducer = async () => {
  producerRabbitInstance = new Producer();
  await producerRabbitInstance.initialize();
  simulateJobs();
};

const simulateJobs = () => {
  [...Array(2).keys()].forEach((id, val) => {
    //simulate job queueing between 500ms to 1s
    setTimeout(() => {
      console.log(`Sending some queue job ${id}`);
      producerRabbitInstance.addJob("some_queue", {
        value: "PROCESS-some type",
        jobId: id,
      });
    }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
    // setTimeout(() => {
    //   console.log(`Sending sometype job ${id}`);
    //   producerRabbitInstance.publish(
    //     "backgroundJob",
    //     "sometype",
    //     Buffer.from(JSON.stringify({ value: "PROCESS-sometype", jobId: id })),
    //     { persistent: true },
    //     (err, ok) => {
    //       if (err !== null) {
    //         console.log(id, "sometype error");
    //       } else {
    //         console.log(id, "sometype success");
    //       }
    //     }
    //   );
    // }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
    setTimeout(() => {
      console.log(`Sending another queue job ${id}`);
      producerRabbitInstance.addJob("another_queue", {
        value: "PROCESS-another type",
        jobId: id,
      });
    }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
    // setTimeout(() => {
    //   console.log(`Sending job ${id}`);
    //   producerRabbitInstance.publish(
    //     "backgroundJob",
    //     "anothertype",
    //     Buffer.from(
    //       JSON.stringify({ value: "PROCESS-anothertype", jobId: id })
    //     ),
    //     { persistent: true },
    //     (err, ok) => {
    //       if (err !== null) {
    //         console.log(id, "anothertype error");
    //       } else {
    //         console.log(id, "anothertype success");
    //       }
    //     }
    //   );
    // }, Math.ceil(Math.random() * (1000 - 500 + 1) + 500));
  });
};

process.on("SIGTERM", () => {
  console.log("Gracefully exiting");
  producerRabbitInstance.close();
  process.exit(1);
});

setupConsumerChildProcess();
