import "dotenv/config";
import path from "path";
import express from "express";

import { conn } from "./lib/db.js";
import speciesRouter from "./routes/species.route.js";
import pointRouter from "./routes/point.route.js";

// Configs
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Init app
const app = express();

// Middlewares
app.use(express.json());

// Connect database
const isConnectedDB = await conn();

// Routes
app.use("/api/species", speciesRouter);
app.use("/api/points", pointRouter);

// Start server
isConnectedDB &&
  app.listen(PORT, () => {
    console.log(`💻 Server is listening in port: ${PORT}`);
  });
