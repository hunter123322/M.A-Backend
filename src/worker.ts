// worker.ts
self.onmessage = (event) => {
  console.log("👷 Worker received data:", event.data);
};
