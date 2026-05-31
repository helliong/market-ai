const delayMs = Number(process.env.DEV_LINKS_DELAY_MS ?? 3500);

setTimeout(() => {
  console.log("");
  console.log("MarketAI dev is starting:");
  console.log("  Site:        http://127.0.0.1:3000");
  console.log("  Admin:       http://127.0.0.1:5173");
  console.log("  Moderation:  http://127.0.0.1:5174");
  console.log("  Auth API:    http://127.0.0.1:4001");
  console.log("  Cart API:    http://127.0.0.1:4002");
  console.log("");
}, delayMs);
