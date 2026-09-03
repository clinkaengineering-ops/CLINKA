import { Router } from "express";
import {
  getDisciplinesHandler,
  getSkillsHandler,
  getServiceAreasHandler,
  getLanguagesHandler,
} from "./taxonomy.controller";
import { t5PublicListingLimiter } from "../../middlewares/rateLimit";

const router = Router();

router.get("/disciplines", t5PublicListingLimiter, getDisciplinesHandler);
router.get("/skills", t5PublicListingLimiter, getSkillsHandler);
router.get("/service-areas", t5PublicListingLimiter, getServiceAreasHandler);
router.get("/languages", t5PublicListingLimiter, getLanguagesHandler);

export default router;
