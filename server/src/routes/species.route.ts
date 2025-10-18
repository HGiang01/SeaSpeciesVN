import { Router } from "express";

import { uploadMemory } from "../config/multer.js";
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
router.post("/add", uploadMemory.single("image"), addSpecies);
router.patch("/update/:name", uploadMemory.single("image"), updateSpecies);
router.delete("/delete/:name", deleteSpecies);

export default router;
