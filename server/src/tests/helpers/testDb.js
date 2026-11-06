import "dotenv/config";
import mongoose from "mongoose";

export async function connectTestDb() {
  const uri = process.env.MONGODB_URI_TEST;
  if (!uri) throw new Error("MONGODB_URI_TEST is not set");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  // Safety net: tests delete data, so refuse anything not named *_test.
  const name = mongoose.connection.name;
  if (!name.endsWith("_test")) {
    await mongoose.disconnect();
    throw new Error(`Refusing to run tests on database "${name}"`);
  }

  // Index builds are async. Wait for them so index tests are reliable.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function clearTestDb() {
  await Promise.all(
    Object.values(mongoose.models).map((m) => m.deleteMany({})),
  );
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
}
