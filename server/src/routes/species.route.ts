import { Router } from "express";

import {
  getAllSpecies,
  filterSpecies,
  getSpecies,
  addSpecies,
  updateSpecies,
  deleteSpecies,
} from "../controllers/species.controller.js";

const router = Router();

// Get species
router.get("/", getAllSpecies);
router.get("/filter", filterSpecies);
router.get("/:name", getSpecies);

// Manage species
router.post("/add/:name", addSpecies);
router.patch("/update/:name", updateSpecies);
router.delete("/delete/:name", deleteSpecies);

export default router;
