

process.on("message", (message) => {
    console.log(message);
    process.send("testing");
});

let counter = 0;

setInterval(() => {
  process.send({ counter: counter++ });
  console.log(counter);
}, 1000);