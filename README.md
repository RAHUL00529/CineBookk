# CineBook

A real-time movie ticket booking system. Two users can never book the same seat, even when requests arrive at the same instant.

**Live demo:** https://cinebook-h5dc.onrender.com
(Free hosting: the first load after idle can take up to a minute.)
**Demo video:** <add link after R4>

## Features

- Browse movies and shows by date (India time)
- Email OTP login (no passwords), delivered through Brevo
- Seat map with live updates: seats held by others appear within about a second
- 5-minute seat hold with a server-driven countdown
- Mock payment and booking history (no real money is taken)

## Tech stack

React, Vite, Tailwind CSS, Node.js, Express, MongoDB (Mongoose), Redis (ioredis), Socket.IO, Zod, Vitest

## The hard problem: double booking

When many users click the same seat at once, a normal "check, then set" lets several of them win. This project uses three layers:

1. **Redis + Lua script:** the check and the lock happen as one atomic step. Locking several seats is all-or-nothing.
2. **TTL on every lock:** a hold expires by itself after 5 minutes. No cleanup job is needed.
3. **MongoDB unique index** on (show, seat) for confirmed bookings, as the final safety net.

### Test results

| Test                                         | Result                           |
| -------------------------------------------- | -------------------------------- |
| 100 parallel lock requests for one seat      | exactly 1 wins, 99 rejected      |
| 50 separate Redis connections, one seat      | exactly 1 wins                   |
| 20 parallel booking inserts, same seat       | exactly 1 succeeds               |
| Same test without Lua (naive check-then-set) | 100 of 100 "won" (shows the bug) |

The concurrency test was run 10 times in a row with identical results. See `docs/concurrency-results.txt`.

## Architecture

- **Redis** holds temporary state only: seat locks, hold records, OTP hashes, rate limits. If it is wiped, no confirmed booking is lost.
- **MongoDB** holds users, movies, theaters, shows and confirmed bookings.
- **Booking order:** insert into MongoDB first, then release Redis locks. A crash in between leaves only a stale lock that expires.
- **Socket.IO** rooms per show broadcast `seat-locked`, `seat-released` and `seat-booked`. Broadcasts carry no user ids. A full snapshot is sent on join and on every reconnect.
- **Prices** are always calculated on the server from seat tiers.
- **Idempotent payment:** retrying with the same payment reference returns the same booking.
- **Deployment:** one Render service serves the API, sockets and the built React app from a single origin, which avoids CORS and cross-site cookie problems.

## Security

httpOnly JWT cookie, hashed OTPs with attempt limits and resend cooldown, Zod validation on every request body, Helmet, rate limiting, identity taken only from the cookie (never from request bodies).

## Known limitations

- Payment is mocked.
- Free hosting sleeps when idle, and the free Redis tier limits operations per second.
- Show dates are generated for 7 days ahead and refreshed with a script.
- Email is sent from a personal address, so it may land in spam.
- Not tested with multiple server instances (Socket.IO would need the Redis adapter).

## Run locally

Requirements: Node 22+, Docker.

```bash
docker compose up -d
cd server
cp .env.example .env      # then set JWT_SECRET (32+ characters)
npm install
npm run seed
npm run dev
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. With `OTP_DEV_LOG=true`, the login code is printed in the server console.

Run tests (needs Docker running):

```bash
cd server
npm test
```

## Project structure

```
server/src  config, models, routes, controllers, services, sockets, lua, tests
client/src  pages, components, hooks, api
```
