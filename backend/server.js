// Initializing App
const express = require("express"),
  app = express();

// Dependencies
const axios = require("axios"),
  mongoose = require("mongoose"),
  dotenv = require("dotenv"),
  schedule = require("node-schedule-tz"),
  path = require("path"),
  fs = require("fs"),
  // tf = require("@tensorflow/tfjs-node-gpu"),
  chalk = require("chalk");

dotenv.config();

// Local functions
const connectDB = require("./config/db"),
  holidays = require("./assets/holidays").getHolidays(),
  { checkMarketOpen } = require("./assets/functions"),
  {
    matchInOut,
    addRSI,
    addSMA,
    percentScale,
    movingStandardize,
    timeStepFormat,
    minMaxNormalize,
    fixNaN,
    checkBuySell,
  } = require("./assets/methods");

// Mongoose Schemas
const ohlcDay = require("./models/ohlcDay"),
  buySellDay = require("./models/buySellDay"),
  botBuySellDay = require("./models/botBuySellDay"),
  predictionDay = require("./models/predictionDay");

// Environmental Variables
const apiKey = process.env.FINNHUB_API_KEY,
  port = process.env.PORT || 5000;

var productionMode;

// Global Variables
var changeStream = ohlcDay.watch(), // Changestream that's watching the database for changes,
  longDecisionBoundary = 0.7,
  shortDecisionBoundary = 0.3,
  resetDecisionBoundary = 0.7,
  trailingStopPercent = 0.15, // (%)
  MSFT = { o: [0], h: [0], l: [0], c: [0], v: [0], t: [0] };

// Development Variables
var devCounter = 1;

// Connect Database
connectDB();

// Middleware
app.use((req, res, next) => {
  console.log(
    chalk.magenta(`${new Date()} - ${req.method} request for ${req.url}`)
  );
  next();
});

// API Routes
app.use("/api/ohlc", require("./routes/api/ohlc"));
app.use("/api/bot", require("./routes/api/bot"));
app.use("/api/buySell", require("./routes/api/buySell"));

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  productionMode = true;
  // Set static folder
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build"));
  });
} else {
  productionMode = false;
}

// Scheduled items

// Occurrence: every week day at midnight
schedule.scheduleJob("0 0 0 * * 1-5", () => {
  if (checkMarketOpen(new Date(), holidays)) {
    checkAndCreateDailyDocuments("MSFT");
    checkAll(ohlcDay);
  }
});

// Occurrence: Every minute
schedule.scheduleJob("*/1 * * * *", async () => {
  try {
    if (!productionMode) {
      MSFT = await getMinuteData("MSFT");
      ohlcSave("MSFT", MSFT);
    } else if (checkMarketOpen(new Date(), holidays)) {
      MSFT = await getMinuteData("MSFT");
      ohlcSave("MSFT", MSFT);
    }
  } catch (err) {
    console.error(err.name, err.message, err.lineNumber);
  }
});

// External API Requests
const getMinuteData = async (ticker) => {
  try {
    let today = new Date();

    let fromDate = +new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      7,
      30
    );
    let toDate = +new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      14
    );

    if (productionMode) {
      const response = await axios.get(
        `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=1&from=${fromDate / 1000
        }&to=${toDate / 1000}&token=${apiKey}`
      );

      // If the response object isn't empty
      if (response.data.s === "ok") {
        // fs.writeFileSync(
        //   "./assets/responseData.json",
        //   JSON.stringify(response.data)
        // );
        return response.data;
      } else {
        console.log("No data was returned from the API.");
      }
      // Else use the artificial data stream for every minute
    } else {
      let data = JSON.parse(fs.readFileSync("./assets/json/responseData.json"));

      placeholder = { c: [], h: [], l: [], o: [], t: [], v: [] };

      for (let i = 0; i < devCounter; i++) {
        placeholder.c.push(data.c[i]);
        placeholder.h.push(data.h[i]);
        placeholder.l.push(data.l[i]);
        placeholder.o.push(data.o[i]);
        placeholder.t.push(data.t[i]);
        placeholder.v.push(data.v[i]);
      }

      devCounter++;
      if (
        devCounter ===
        JSON.parse(fs.readFileSync("./assets/json/responseData.json")).t.length
      ) {
        devCounter = 0;
      }

      return placeholder;
    }
  } catch (err) {
    console.error(err.name, err.message, err.lineNumber);
  }
};

// APP listening
app.listen(port, function () {
  console.log("App is running on port", port);
});

// Changestream watching the rawdata stream and sending it to socket.io, so it can be updated on the page in real time
// ===============================================
changeStream.on("change", async (change) => {
  try {
    console.log(
      chalk.blueBright(
        "changestream detected changes to the database, type:",
        change.operationType
      )
    );
    if (change.operationType == "update") {
      let DayOhlc = await ohlcDay.findById(change.documentKey._id);
      if (DayOhlc.ticker == "MSFT") {
        MSFT = DayOhlc;
      }
    }

    // console.log(MSFT);
    // io.emit("changeOHLC", MSFT); // lastNumOfData is an array of the most recently inserted 10 objects in the mongoDB
    // predictAndSave("MSFT");
    // buySellAndSave("MSFT"); // This one is the collection that the broker will soon listen to..
  } catch (err) {
    console.error(err.name, err.message, err.lineNumber);
  }
});

// Functions ------------------------------------------------------
const ohlcSave = async (ticker, dataObj) => {
  try {
    // Finding the document with the current day and ticker
    await ohlcDay
      .findOne(
        { ticker: ticker, day: new Date().toDateString() },
        function (err, DayOhlc) {
          if (err) {
            console.error(err.name, err.message, err.lineNumber);
          } else {
            if (DayOhlc !== null) {
              let newArray = [];

              if (MSFT) {
                for (let i = 0; i < MSFT.t.length; i++) {
                  newArray.push({
                    open: MSFT.o[i],
                    high: MSFT.h[i],
                    low: MSFT.l[i],
                    close: MSFT.c[i],
                    volume: MSFT.v[i],
                    date: MSFT.t[i] * 1000,
                  });
                }

                if (!productionMode) {
                  DayOhlc.ohlcArray.push(newArray[newArray.length - 1]);

                  DayOhlc.ohlcArray[DayOhlc.ohlcArray.length - 1].date =
                    Math.round(Date.now() / 60000) * 60000;

                  DayOhlc.save();
                } else if (DayOhlc.ohlcArray.length) {
                  // Checking if data has changed
                  if (
                    newArray[newArray.length - 1].date !==
                    DayOhlc.ohlcArray[DayOhlc.ohlcArray.length - 1].date
                  ) {
                    DayOhlc.ohlcArray = newArray;
                    DayOhlc.save();

                    console.log(
                      chalk.blueBright(
                        "Updating ohlcDay document for " +
                        DayOhlc.ticker +
                        ", " +
                        DayOhlc.day
                      )
                    );
                  } else {
                    console.log(
                      chalk.greenBright(
                        "Daily data hasn't changed since last update"
                      )
                    );
                  }
                } else {
                  DayOhlc.ohlcArray = newArray;
                  DayOhlc.save();
                }
              }
            } else {
              console.log("No DayOhlc found");
            }
          }
        }
      )
      .clone();
  } catch (err) {
    console.error(err.name, err.message, err.lineNumber);
  }
};



// Checks if the ohlcDay, buySellDay, botBuySellDay documents are created for the current day
const checkAndCreateDailyDocuments = async (ticker) => {
  try {
    let item = { ticker: ticker, day: new Date().toDateString() };

    let query = await ohlcDay.findOne(item);

    if (!query) {
      createOhlc(ticker);
    } else {
      console.log(
        chalk.blueBright(
          "There is already a",
          chalk.yellowBright("ohlcDay"),
          " document in the database with ticker:",
          chalk.redBright(query.ticker),
          "and day:",
          chalk.greenBright(query.day)
        )
      );
    }

    query = await buySellDay.findOne(item);

    if (!query) {
      createBuySellDay(ticker);
    } else {
      console.log(
        chalk.blueBright(
          "There is already a",
          chalk.yellowBright("buySellDay"),
          " document in the database with ticker:",
          chalk.redBright(query.ticker),
          "and day:",
          chalk.greenBright(query.day)
        )
      );
    }

    query = await botBuySellDay.findOne(item);

    if (!query) {
      createBotBuySell(ticker);
    } else {
      console.log(
        chalk.blueBright(
          "There is already a",
          chalk.yellowBright("botBuySellDay"),
          "document in the database with ticker:",
          chalk.redBright(query.ticker),
          "and day:",
          chalk.greenBright(query.day)
        )
      );
    }

    query = await predictionDay.findOne(item);

    if (!query) {
      createPredictionDay(ticker);
    } else {
      console.log(
        chalk.blueBright(
          "There is already a",
          chalk.yellowBright("predictionDay"),
          "document in the database with ticker:",
          chalk.redBright(query.ticker),
          "and day:",
          chalk.greenBright(query.day)
        )
      );
    }
  } catch (err) {
    console.error(err.name, err.message, err.lineNumber);
  }
};

// This function goes and saves a json object that contains a list of all days in database 
// Which will then be queried by the get request, as it's much quicker than doing this query every time
const checkAll = async (ohlcDay) => {

  var query = await ohlcDay.find({ ticker: "MSFT" });

  let payload = [];

  for (let i = 0; i < query.length; i++) {
    payload.push(query[i].day);
  }

  // Getting rid of duplicates 
  let uniquePayload = [...new Set(payload)];

  // Converting to ms to organize into ascending order 
  uniquePayload = uniquePayload.map((element) => {
    return Date.parse(element);
  });

  // Sorting in ascending order 
  uniquePayload = uniquePayload.sort((a, b) => {
    return a - b;
  });

  // Converting back to date string
  uniquePayload = uniquePayload.map((element) => {
    return new Date(element).toDateString();
  });

  fs.writeFileSync("./assets/json/allOhlc.json", JSON.stringify(uniquePayload));

};

const formatData = (ohlcDays, buySellDays, timeSteps) => {
  var trainingArray = matchInOut(ohlcDays, buySellDays);
  trainingArray = addRSI(trainingArray); // Adding rsi to the data
  trainingArray = addSMA(trainingArray, 20); // Adding SMA20 to the data
  trainingArray = addSMA(trainingArray, 45); // Adding SMA45 to the data
  trainingArray = percentScale(trainingArray, 6); // Scaling all the data to a percent scale (open, high, low, close, SMA20, SMA45)
  trainingArray = movingStandardize(trainingArray, 180, 4); // Standardizing all of the data with a moving standard deviation of 180
  trainingArray = minMaxNormalize(trainingArray, 8); // Converting all the values of the array between 0 and 1
  var { featureArray, labelArray } = timeStepFormat(trainingArray, timeSteps);
  featureArray = fixNaN(featureArray);
  return { featureArray, labelArray };
};

// const predictAndSave = (ticker) => {
//   try {
//     ohlcDay
//       .find({ ticker: ticker })
//       .sort({ _id: -1 })
//       .limit(2)
//       .exec(async (err, NumOfDays) => {
//         if (err) {
//           console.error(err.name, err.message, err.lineNumber);
//         } else {
//           try {
//             let ohlcDays = NumOfDays.reverse();
//             let buySellDays = [];

//             for (let i = 0; i < NumOfDays.length; i++) {
//               buySellDays.push({
//                 ticker: ohlcDays[i].ticker,
//                 day: ohlcDays[i].day,
//                 buySellDaysArray: [],
//               });
//             }

//             var { featureArray } = formatData(ohlcDays, buySellDays, 10);

//             tf.engine().startScope();

//             // Load model for ticker
//             const model = await tf.loadLayersModel(
//               "file://assets/Models/" + ticker + "/model.json"
//             );

//             if (featureArray.length) {
//               // Make prediction
//               // Starting scope, fixing memory issues?
//               prediction = model
//                 .predict(tf.tensor([featureArray[featureArray.length - 1]]))
//                 .dataSync()[0];

//               console.log(
//                 chalk.white.bold("Bots Prediction for " + ticker + ":"),
//                 chalk.yellowBright(prediction)
//               );

//               let pushSaveObj = {
//                 date: Math.floor(new Date().getTime() / 60000) * 60000, // divided by 100 000 because it will round the
//                 prediction: prediction, // minute down because it's about 3 seconds behind
//                 buy: false,
//                 sell: false,
//               };

//               await predictionDay
//                 .findOne(
//                   { ticker: ticker, day: new Date().toDateString() },
//                   (err, predictionDay) => {
//                     if (err) {
//                       console.error(err.name, err.message, err.lineNumber);
//                     } else if (predictionDay !== null) {
//                       predictionDay.predictionDaysArray.push(pushSaveObj);
//                       predictionDay.save();

//                       console.log(
//                         chalk.blueBright(
//                           "Updating predictionDay document for " +
//                           predictionDay.ticker +
//                           ", " +
//                           predictionDay.day
//                         )
//                       );
//                     } else {
//                       console.log("PredictionDay not found");
//                     }
//                   }
//                 )
//                 .clone();
//             } else {
//               console.log(
//                 chalk.green("Not enough daily data to make a prediction")
//               );
//             }
//             tf.engine().endScope();
//             tf.disposeVariables();
//           } catch (err) {
//             console.error(chalk.red(err.name, err.message, err.lineNumber));
//           }
//         }
//       });
//   } catch (err) {
//     console.error(chalk.red(err.name, err.message, err.lineNumber));
//   }
// };

// Database functions ----------------------------------------------
const buySellAndSave = async (ticker) => {
  try {
    await predictionDay
      .findOne(
        { ticker: ticker, day: new Date().toDateString() },
        async (err, predictionDay) => {
          if (err) {
            console.log(err);
          } else {
            ohlcDay
              .find({ ticker: ticker })
              .sort({ _id: -1 })
              .limit(1)
              .exec(async (err, ohlcDays) => {
                if (err) {
                  console.error(err.name, err.message, err.lineNumber);
                } else {
                  try {
                    var buySellArray = checkBuySell(
                      ohlcDays[0].ohlcArray,
                      predictionDay.predictionDaysArray,
                      longDecisionBoundary,
                      shortDecisionBoundary,
                      resetDecisionBoundary,
                      trailingStopPercent,
                      productionMode
                    );

                    await botBuySellDay
                      .findOne(
                        { ticker: ticker, day: new Date().toDateString() },
                        (err, foundBotBuySellDay) => {
                          if (err) {
                            console.log(err);

                            console.error(
                              err.name,
                              err.message,
                              err.lineNumber
                            );
                          } else {
                            if (foundBotBuySellDay !== null) {
                              if (
                                (buySellArray &&
                                  !foundBotBuySellDay.botBuySellDaysArray
                                    .length) ||
                                !buySellArray.length
                              ) {
                                // If the buyselldays array in the document is empty
                                // Initial population

                                if (buySellArray && buySellArray.length) {
                                  // If the array is empty, populate with the buy sell array
                                  foundBotBuySellDay.botBuySellDaysArray =
                                    buySellArray;
                                  foundBotBuySellDay.save();
                                } else {
                                  console.log(
                                    "No predictions for",
                                    foundBotBuySellDay.ticker,
                                    "yet"
                                  );
                                }
                              } else {
                                if (
                                  foundBotBuySellDay.botBuySellDaysArray[
                                    foundBotBuySellDay.botBuySellDaysArray
                                      .length - 1
                                  ].date !==
                                  buySellArray[buySellArray.length - 1].date
                                ) {
                                  foundBotBuySellDay.botBuySellDaysArray.push(
                                    buySellArray[buySellArray.length - 1]
                                  ); // pushing the most recent point into it
                                  foundBotBuySellDay.save();
                                  console.log(
                                    chalk.greenBright.bold(
                                      "Updating botBuySellDay document for " +
                                      foundBotBuySellDay.ticker +
                                      ", " +
                                      foundBotBuySellDay.day
                                    )
                                  );
                                } else {
                                  console.log(
                                    chalk.white.bold(
                                      chalk.red.bold(
                                        "No new long/short decision from the bot for "
                                      ) + foundBotBuySellDay.ticker
                                    )
                                  );
                                }
                              }
                            } else {
                              console.log("botBuySellDay not found");
                            }
                          }
                        }
                      )
                      .clone();
                  } catch (err) {
                    console.error(
                      chalk.red(err.name, err.message, err.lineNumber)
                    );
                  }
                }
              });
          }
        }
      )
      .clone();
  } catch (err) {
    console.error(chalk.red(err.name, err.message, err.lineNumber));
  }
};

const createPredictionDay = async (ticker) => {
  try {
    predictionDay.create(
      {
        ticker: ticker,
        day: new Date().toDateString(),
        ohlcArray: [],
      },
      function (err) {
        if (err) {
          console.error(err.name, err.message, err.lineNumber);
        } else {
          console.log(
            chalk.magentaBright(
              "Creating a new predictionDay document for ",
              ticker,
              new Date().toDateString()
            )
          );
        }
      }
    );
  } catch (err) {
    console.error(chalk.red(err.name, err.message, err.lineNumber));
  }
};

const createOhlc = async (ticker) => {
  try {
    ohlcDay.create(
      {
        ticker: ticker,
        day: new Date().toDateString(),
        ohlcArray: [],
      },
      function (err) {
        if (err) {
          console.error(err.name, err.message, err.lineNumber);
        } else {
          console.log(
            chalk.magentaBright(
              "Creating a new ohlcDay document for ",
              ticker,
              new Date().toDateString()
            )
          );
        }
      }
    );
  } catch (err) {
    console.error(chalk.red(err.name, err.message, err.lineNumber));
  }
};

//

const createBuySellDay = async (ticker) => {
  try {
    buySellDay.create(
      {
        ticker: ticker,
        day: new Date().toDateString(),
        profit: 0,
        buySellDaysArray: [],
      },
      function (err, createdDoc) {
        if (err) {
          console.log("Error creating buySellDay");
        } else {
          console.log(
            chalk.magentaBright(
              "Creating a new buySellDay document for ",
              ticker,
              new Date().toDateString()
            )
          );
        }
      }
    );
  } catch (err) {
    console.error(chalk.red(err.name, err.message, err.lineNumber));
  }
};

const createBotBuySell = async (ticker) => {
  try {
    botBuySellDay.create(
      {
        ticker: ticker,
        day: new Date().toDateString(),
        trailingStopPercent: trailingStopPercent,
        longDecisionBoundary: longDecisionBoundary,
        shortDecisionBoundary: shortDecisionBoundary,
        resetDecisionBoundary: resetDecisionBoundary,
        botBuySellDaysArray: [],
      },
      function (err) {
        if (err) {
          console.error(err.name, err.message, err.lineNumber);
        } else {
          console.log(
            chalk.magentaBright(
              "Creating a new botBuySellDay document for ",
              ticker,
              new Date().toDateString()
            )
          );
        }
      }
    );
  } catch (err) {
    console.error(chalk.red(err.name, err.message, err.lineNumber));
  }
};

// Start-up functions
if (!productionMode) {
  checkAndCreateDailyDocuments("MSFT");
} else if (checkMarketOpen(new Date(), holidays)) {
  checkAndCreateDailyDocuments("MSFT");
}
checkAll(ohlcDay);

module.exports.checkMarketOpen = checkMarketOpen;