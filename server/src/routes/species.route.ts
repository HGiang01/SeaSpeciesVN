import { Router } from "express";

import { uploadMemory } from "../config/multer.js";
import {
  getAllSpecies,
  filterSpecies,
  getSpecies,
  addSpecies,
  updateSpecies,
  deleteSpecies,
  countTaxonomy
} from "../controllers/species.controller.js";

const router = Router();

// Get species
router.get("/", getAllSpecies);
router.get("/filter", filterSpecies);
router.get("/:id", getSpecies);

// Manage species
router.post("/", uploadMemory.single("image"), addSpecies);
router.patch("/:id", uploadMemory.single("image"), updateSpecies);
router.delete("/:id", deleteSpecies);

router.get("/taxonomy/count", countTaxonomy)

export default router;
