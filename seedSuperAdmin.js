const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = "superadmin@ems.com";
    const exists = await User.findOne({ email });
    if (exists) {
      console.log("SuperAdmin already exists");
      process.exit(0);
    }
    const password = await bcrypt.hash("superadmin123", 10);
    await User.create({
      name: "Super Admin",
      email,
      password,
      role: "SuperAdmin",
    });
    console.log("✅ SuperAdmin seeded: ", email);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();