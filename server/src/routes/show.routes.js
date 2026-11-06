import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../utils/schemas.js";
import { getShow, getSeats } from "../controllers/show.controller.js";

const router = Router();

router.get("/:id", validate({ params: idParams }), getShow);
router.get("/:id/seats", requireAuth, validate({ params: idParams }), getSeats);
export default router;
