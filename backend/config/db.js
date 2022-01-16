const mongoose = require("mongoose"),
  config = require("config"),
  db = config.get("mongoURI"),
  chalk = require("chalk");

const connectDB = async () => {
  try {
    await mongoose.connect(db);

    if (process.env.NODE_ENV === "production") {
      console.log(
        chalk.blueBright("MongoDB connected to"),
        chalk.yellow("NeuralTrading-Production")
      );
    } else {
      console.log(
        chalk.blueBright("MongoDB connected to"),
        chalk.yellow("NeuralTrading-Development")
      );
    }
  } catch (err) {
    console.log(err.message);
    // Exit process with failure
    // process.exit(1);
  }
};

module.exports = connectDB;
