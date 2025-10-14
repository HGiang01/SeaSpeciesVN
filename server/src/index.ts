import dotenv from "dotenv";
import path from "path";
import express from "express";

import { conn } from "./config/db.js";
import speciesRouter from "./routes/species.route.js";

// Configs
dotenv.config();
const __dirname = path.resolve();
const PORT = process.env.PORT || 3000;

// Init app
const app = express();

// Middlewares
app.use(express.json());

// Connect database
const isConnectedDB = await conn();

// Routes
app.use("/api/species", speciesRouter);

// Start server
isConnectedDB && app.listen(PORT, () => {
  console.log(`Server is listening in port: ${PORT}`);
});
