import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { objectId } from "../utils/schemas.js";
import { MAX_SEATS } from "../config/constants.js";

import {
  createHold,
  cancelHold,
  readHold,
} from "../controllers/hold.controller.js";

const router = Router();

const createBody = z.strictObject({
  showId: objectId,
  seatIds: z
    .array(z.string().regex(/^[A-Z]+\d+$/, "Invalid seat id"))
    .min(1)
    .max(MAX_SEATS),
});
const holdParams = z.object({ holdId: z.uuid() });

// requireAuth comes first, so anonymous users learn nothing about our validation rules
router.post("/", requireAuth, validate({ body: createBody }), createHold);
router.delete(
  "/:holdId",
  requireAuth,
  validate({ params: holdParams }),
  cancelHold,
);
router.get("/:holdId", requireAuth, validate({ params: holdParams }), readHold);

export default router;
