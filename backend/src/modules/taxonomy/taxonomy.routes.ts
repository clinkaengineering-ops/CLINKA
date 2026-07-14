import { Router } from "express";
import {
  getDisciplinesHandler,
  getSkillsHandler,
  getServiceAreasHandler,
  getLanguagesHandler,
} from "./taxonomy.controller";

const router = Router();

router.get("/disciplines", getDisciplinesHandler);
router.get("/skills", getSkillsHandler);
router.get("/service-areas", getServiceAreasHandler);
router.get("/languages", getLanguagesHandler);

export default router;
