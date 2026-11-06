import mongoose from "mongoose";
import { env } from "../config/env.js";
import { connectDb } from "../config/db.js";
import { Movie } from "../models/Movie.js";
import { Theater } from "../models/Theater.js";
import { Show } from "../models/Show.js";
import { Booking } from "../models/Booking.js";
import { buildSeats } from "../services/seatLayoutService.js";

const force = process.argv.includes("--force");

if (env.NODE_ENV === "production" && !force) {
  console.error("Refusing to seed in production without --force");
  process.exit(1);
}

const movies = [
  {
    title: "Midnight Express Lane",
    language: "English",
    durationMin: 112,
    genres: ["Thriller"],
    description:
      "A night-shift courier discovers what is really inside the packages.",
  },
  {
    title: "Monsoon Letters",
    language: "Hindi",
    durationMin: 128,
    genres: ["Drama", "Romance"],
    description: "Two strangers exchange letters during one long rainy season.",
  },
  {
    title: "Rooftop Cricket Club",
    language: "Hindi",
    durationMin: 118,
    genres: ["Comedy", "Family"],
    description: "A neighbourhood team takes on the city champions.",
  },
  {
    title: "Signal Lost",
    language: "English",
    durationMin: 105,
    genres: ["Sci-Fi"],
    description:
      "A research crew loses contact with Earth and with each other.",
  },
  {
    title: "The Last Chai Stall",
    language: "Hindi",
    durationMin: 121,
    genres: ["Drama"],
    description:
      "A family stall refuses to close as the market is rebuilt around it.",
  },
  {
    title: "Paper Tigers",
    language: "English",
    durationMin: 99,
    genres: ["Animation", "Family"],
    description: "Origami animals come alive in a lonely child's bedroom.",
  },
  {
    title: "Echoes of Kaveri",
    language: "Tamil",
    durationMin: 134,
    genres: ["Action", "Drama"],
    description:
      "A river guide protects his village from a powerful developer.",
  },
].map((m) => ({ ...m, releaseDate: new Date("2026-09-01") }));

const standardTier = (rows, price) => ({ name: "Standard", rows, price });
const premiumTier = (rows, price) => ({ name: "Premium", rows, price });

const theaters = [
  {
    name: "Aurora Cinemas",
    city: "Delhi",
    screens: [
      {
        name: "Screen 1",
        rows: ["A", "B", "C", "D", "E", "F"],
        seatsPerRow: 12,
        aisleAfter: [4, 8],
        missingSeats: [],
        tiers: [
          premiumTier(["E", "F"], 350),
          standardTier(["A", "B", "C", "D"], 200),
        ],
      },
      {
        name: "Screen 2",
        rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
        seatsPerRow: 10,
        aisleAfter: [5],
        missingSeats: ["A1", "A10"],
        tiers: [
          premiumTier(["G", "H"], 400),
          standardTier(["A", "B", "C", "D", "E", "F"], 220),
        ],
      },
    ],
  },
  {
    name: "Nova Multiplex",
    city: "Delhi",
    screens: [
      {
        name: "Screen 1",
        rows: ["A", "B", "C", "D", "E"],
        seatsPerRow: 14,
        aisleAfter: [3, 11],
        missingSeats: [],
        tiers: [
          premiumTier(["D", "E"], 300),
          standardTier(["A", "B", "C"], 180),
        ],
      },
    ],
  },
];

// Fail fast if any layout is broken
for (const theater of theaters) {
  for (const screen of theater.screens) buildSeats(screen);
}

// --- show time generation (IST in, UTC stored) ---
const IST_OFFSET_MIN = 330;
const DAYS = 7;
const SLOTS = [
  [9, 30],
  [12, 45],
  [16, 0],
  [19, 15],
  [22, 30],
];

const istToUtc = (y, m, d, h, min) =>
  new Date(Date.UTC(y, m, d, h, min) - IST_OFFSET_MIN * 60_000);

function buildShows(movieDocs, theaterDocs) {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  const y = istNow.getUTCFullYear();
  const m = istNow.getUTCMonth();
  const d = istNow.getUTCDate();

  const shows = [];
  let screenIndex = 0;

  for (const theater of theaterDocs) {
    for (const screen of theater.screens) {
      for (let day = 0; day < DAYS; day++) {
        SLOTS.forEach(([h, min], slot) => {
          const startTime = istToUtc(y, m, d + day, h, min);
          if (startTime <= now) return; // skip shows already started today

          shows.push({
            movieId:
              movieDocs[(day + slot + screenIndex) % movieDocs.length]._id,
            theaterId: theater._id,
            screenName: screen.name,
            startTime,
            priceMultiplier: slot >= 3 ? 1.2 : 1, // evening shows cost 20% more
          });
        });
      }
      screenIndex++;
    }
  }
  return shows;
}

async function seed() {
  await connectDb();
  console.log("Database:", mongoose.connection.name);

  const bookingCount = await Booking.countDocuments();
  if (bookingCount > 0 && !force) {
    console.error(
      `Found ${bookingCount} bookings. Re-seeding would orphan them. ` +
        "Run the reset script first, or pass --force.",
    );
    process.exit(1);
  }

  await Show.deleteMany({});
  await Theater.deleteMany({});
  await Movie.deleteMany({});

  const movieDocs = await Movie.insertMany(movies);
  const theaterDocs = await Theater.insertMany(theaters);
  const showDocs = await Show.insertMany(buildShows(movieDocs, theaterDocs));

  console.log(
    `Seeded ${movieDocs.length} movies, ${theaterDocs.length} theaters, ${showDocs.length} shows`,
  );
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
