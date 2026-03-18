require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const adminEmails = [
  "lav.vimean25@kit.edu.kh",
  "cheang.srengkoang24@kit.edu.kh",
  "sot.chulsa25@kit.edu.kh",
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await User.updateMany(
      { email: { $in: adminEmails } },
      { $set: { role: "admin" } }
    );

    console.log(`matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
  } catch (error) {
    console.error("Failed to promote admins:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
