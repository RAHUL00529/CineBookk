import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../utils/schemas.js";
import {
  createBooking,
  listMyBookings,
  getBooking,
} from "../controllers/booking.controller.js";

const router = Router();

const createBody = z.strictObject({
  holdId: z.uuid(),
  paymentRef: z
    .string()
    .regex(/^mock_[A-Za-z0-9-]{8,64}$/, "Invalid payment reference"),
});

router.post("/", requireAuth, validate({ body: createBody }), createBooking);
// "/me" must be registered BEFORE "/:id", or "me" is treated as an id
router.get("/me", requireAuth, listMyBookings);
router.get("/:id", requireAuth, validate({ params: idParams }), getBooking);

export default router;
