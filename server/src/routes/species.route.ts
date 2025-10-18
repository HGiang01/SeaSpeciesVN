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
router.post("/", uploadMemory.single("image"), addSpecies);
router.patch("/:name", uploadMemory.single("image"), updateSpecies);
router.delete("/:name", deleteSpecies);

export default router;
