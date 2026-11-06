import "dotenv/config";
import mongoose from "mongoose";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Booking } from "../models/Booking.js";

const uri = process.env.MONGODB_URI_TEST;

// Skipped (not failed) when no test database is configured
describe.skipIf(!uri)("Booking unique index", () => {
  const showA = new mongoose.Types.ObjectId();
  const showB = new mongoose.Types.ObjectId();

  // const make = (overrides = {}) => ({
  //   userId: new mongoose.Types.ObjectId(),
  //   showId: showA,
  //   seats: ["A1", "A2"],
  //   amount: 400,
  //   paymentRef: "mock_1",
  //   ...overrides,
  // });
  let refCounter = 0;
  const make = (overrides = {}) => ({
    userId: new mongoose.Types.ObjectId(),
    showId: showA,
    seats: ["A1", "A2"],
    amount: 400,
    paymentRef: `mock_${++refCounter}`,
    ...overrides,
  });

  beforeAll(async () => {
    await mongoose.connect(uri);
    // Safety net: never wipe a database that isn't clearly a test one
    if (!mongoose.connection.name.includes("test")) {
      throw new Error("Refusing to run: database name must contain 'test'");
    }
    await Booking.init(); // wait until the indexes actually exist
  });

  beforeEach(async () => {
    await Booking.deleteMany({});
  });

  afterAll(async () => {
    await Booking.deleteMany({});
    await mongoose.disconnect();
  });

  it("rejects a second booking that shares a seat on the same show", async () => {
    await Booking.create(make({ seats: ["A1", "A2"] }));
    await expect(
      // Booking.create(make({ seats: ["A2", "A3"], paymentRef: "mock_2" })),
      Booking.create(make({ seats: ["A2", "A3"], paymentRef: "explicit_2" })),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("allows the same seat on a different show", async () => {
    await Booking.create(make({ showId: showA }));
    await expect(
      Booking.create(make({ showId: showB })),
    ).resolves.toBeDefined();
  });

  it("lets a seat be rebooked after the first booking is cancelled", async () => {
    await Booking.create(make({ status: "cancelled" }));
    await expect(
      // Booking.create(make({ paymentRef: "mock_2" })),
      Booking.create(make({ paymentRef: "explicit_2" })),
    ).resolves.toBeDefined();
  });
  it("rejects two bookings with the same paymentRef", async () => {
    await Booking.create(make({ paymentRef: "same_ref" }));
    await expect(
      Booking.create(make({ showId: showB, paymentRef: "same_ref" })),
    ).rejects.toMatchObject({ code: 11000 });
  });
});
