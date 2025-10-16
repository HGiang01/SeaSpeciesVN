import { Client, type ClientConfig } from "pg";

// Cache client instance
let cachedClient: Client | null = null;

export const conn = async (): Promise<boolean> => {
  try {
    if (!cachedClient) {
      const pgConfig: ClientConfig = {
        user: process.env.PG_USERNAME,
        password: process.env.PG_PASSWORD,
        host: process.env.PG_HOST,
        port: Number(process.env.PG_PORT),
        database: process.env.PG_DATABASE,
      };

      cachedClient = new Client(pgConfig);

      cachedClient.on("error", (err) => {
        console.error("Database connection error:", err);
      });
    }

    await cachedClient.connect();
    console.log("🐘 Connected to PostgreSQL");

    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        "An error occurred while connecting to the database: ",
        error.message
      );
    } else {
      console.log(
        "An error occurred while connecting to the database: ",
        error
      );
    }
    return false;
  }
};

// getter function client
export const getClient = (): Client => {
  if (!cachedClient) {
    throw new Error("Database not connected. Call conn() first!");
  }
  return cachedClient;
};
