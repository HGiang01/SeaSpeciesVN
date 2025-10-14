import { Client } from "pg";
export const conn = async (): Promise<boolean> => {
  try {
    const client = new Client({
      user: process.env.PG_USERNAME,
      password: process.env.PG_PASSWORD,
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      database: process.env.PG_DATABASE,
    });

    client.on("error", (err) => {
      console.error("Database connection error:", err);
    });

    await client.connect();
    console.log("Connected to PostgreSQL");

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
