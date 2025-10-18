import redis from "../cache/redis.js";
import { server } from "../app.js";
import prisma from "../db/client.js";

export async function disconnectAllServices(reason: string, error?: Error) {
  console.log(reason, error?.message ?? "");

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (redis.isOpen) {
      console.log("Disconnecting Redis...");
      await redis.quit();
    }

    console.log("Disconnecting DB...");
    await prisma.$disconnect();

    console.log("Disconnects successful. Exiting...");
    process.exit(error ? 1 : 0);
  } catch (disconnectErr) {
    console.error("Error during disconnect:", disconnectErr);
    process.exit(1);
  }
}

//add all services disconnect like also db and other
