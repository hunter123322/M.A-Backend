// main.ts
const worker = new Worker(new URL("./worker.ts", import.meta.url).href);

worker.postMessage({ message: "Hello from the main thread!", time: Date.now() });
