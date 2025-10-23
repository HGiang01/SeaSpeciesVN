import { Router } from "express";
import {
  createPoint,
  deletePoint,
  getPoints,
  updatePoint,
} from "../controllers/point.controller.js";

const router = Router();

router.get("/:speciesId", getPoints);
router.post("/:speciesId", createPoint);
router.patch("/:id", updatePoint);
router.delete("/:id", deletePoint);

export default router;
