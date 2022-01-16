"use strict";

const chalk = require("chalk");
const _ = require("lodash"),
  { mean, std } = require("mathjs");

const methods = {
  convertDayFormat: (array) => {
    var returnArray = [];
    var placeholderArray = [];
    for (let i = 0; i < array.length; i++) {
      placeholderArray.push({ day: array[i].day });
    }

    const uniqueDays = [
      ...new Map(placeholderArray.map((item) => [item["day"], item])).values(),
    ];

    for (let i = 0; i < uniqueDays.length; i++) {
      returnArray.push(uniqueDays[i]);
      returnArray[i].buySellDaysArray = [];
      for (let j = 0; j < array.length; j++) {
        if (uniqueDays[i].day === array[j].day) {
          let pushObj = {
            ...array[j],
          };
          delete pushObj.day;

          returnArray[i].buySellDaysArray.push(pushObj);
        }
      }
    }
    return returnArray;
  },

  checkStopLoss: (currentPoint, trailingArray, trailingStopPercent) => {
    let max = Math.max.apply(
      Math,
      trailingArray.map((object) => {
        return object.close;
      })
    );
    let lossPercent = ((max - currentPoint.close) / currentPoint.close) * 100;

    return lossPercent > trailingStopPercent ? true : false; // Return true if the stop loss is lower than the threshold
  },

  addSMA: (trainingArray, timePeriod) => {
    try {
      var smaArray;
      var placeholderArray;
      var newTrainingArray = trainingArray;

      for (let i = 0; i < trainingArray.length; i++) {
        smaArray = [];
        placeholderArray = [];
        for (let j = 0; j < trainingArray[i].length; j++) {
          placeholderArray.push(trainingArray[i][j][3]);
          if (j < timePeriod) {
            smaArray.push(_.sum(placeholderArray) / (j + 1));
          } else {
            smaArray.push(
              _.sum(_.takeRight(placeholderArray, timePeriod)) / timePeriod
            );
          }
        }

        for (let k = 0; k < trainingArray[i].length; k++) {
          newTrainingArray[i][k].splice(4, 0, smaArray[k]);
        }
      }

      return newTrainingArray;
    } catch (err) {
      console.log(chalk.redBright(err));
    }
  },

  addRSI: (array, timePeriod = 14) => {
    try {
      return array.map((trainingArray) => {
        var rsiArray = [];
        var placeholderArray = [];
        var newTrainingArray = trainingArray;

        // RS = avgUp/avgDown
        // RSI = 100 - 100/(1+RS)
        var avgUt;
        var avgDt;
        var fromRightArray;

        for (let i = 0; i < trainingArray.length; i++) {
          avgUt = 0;
          avgDt = 0;
          placeholderArray.push(trainingArray[i]);
          if (i < timePeriod) {
            for (let j = 1; j < placeholderArray.length; j++) {
              var alpha = 2 / (placeholderArray.length + 1);
              var Ut = placeholderArray[j][3] - placeholderArray[j - 1][3];
              var Dt = placeholderArray[j - 1][3] - placeholderArray[j][3];

              if (placeholderArray[j][3] > placeholderArray[j - 1][3]) {
                avgUt = alpha * Ut + (1 - alpha) * avgUt - 1;
              } else if (placeholderArray[j - 1][3] > placeholderArray[j][3]) {
                avgDt = alpha * Dt + (1 - alpha) * avgDt - 1;
              }
            }
            rsiArray.push(100 - 100 / (1 + avgUt / avgDt));
          } else {
            fromRightArray = _.takeRight(placeholderArray, timePeriod);
            for (let k = 1; k < fromRightArray.length; k++) {
              // avgUt = calcEMA(fromRightArray, timePeriod, k, avgUt, avgDt, "Ut");
              // avgDt = calcEMA(fromRightArray, timePeriod, k, avgUt, avgDt, "Dt");
              avgUt = calcWildersSmoothingMethod(
                fromRightArray,
                timePeriod,
                k,
                avgUt,
                avgDt,
                "Ut"
              );
              avgDt = calcWildersSmoothingMethod(
                fromRightArray,
                timePeriod,
                k,
                avgUt,
                avgDt,
                "Dt"
              );
            }
            rsiArray.push(100 - 100 / (1 + avgUt / avgDt));
          }
        }

        for (let i = 0; i < trainingArray.length; i++) {
          newTrainingArray[i].splice(4, 0, rsiArray[i]);
        }
        return newTrainingArray;
      });
    } catch (err) {
      console.log(chalk.redBright(err));
    }
  },

  matchInOut: (ohlcDays, buySellDays, longBuySellArray = []) => {
    try {
      var placeholderBuySell = [];

      if (!longBuySellArray.length) {
        for (let i = 0; i < buySellDays.length; i++) {
          for (let j = 0; j < buySellDays[i].buySellDaysArray.length; j++) {
            placeholderBuySell.push(buySellDays[i].buySellDaysArray[j]);
          }
        }
      } else {
        placeholderBuySell = longBuySellArray;
      }

      var lastChange = "short"; // defaulting the last change to short... (hold/hasn't been bought yet)
      var returnArray = []; // making the training array the same length as the number of training days
      for (let i = 0; i < ohlcDays.length; i++) {
        returnArray.push([]);
        for (let j = 0; j < ohlcDays[i].ohlcArray.length; j++) {
          var currentInput = ohlcDays[i].ohlcArray[j];
          var inputArray = [
            currentInput.open,
            currentInput.high,
            currentInput.low,
            currentInput.close,
            currentInput.volume,
          ];
          // defaulting to shorting
          var outputArray = [0, 1];
          if (lastChange === "long") {
            outputArray = [1, 0];
          }

          // Checking the long buy/sell array to see if it should switch to long/short
          for (let k = 0; k < placeholderBuySell.length; k++) {
            var currentOutput = placeholderBuySell[k];
            if (currentInput.date === currentOutput.date) {
              if (currentOutput.buy === 1) {
                lastChange = "long";
              } else if (currentOutput.sell === 1) {
                lastChange = "short";
              }
              break;
            }
          }
          returnArray[i].push(_.concat(inputArray, outputArray));
        }
      }
      return returnArray;
    } catch (err) {
      console.log(chalk.redBright(err));
    }
  },

  formatShortLong: (array) => {
    var lastChange = "short"; // setting the default to short
    var placeholderArray = [];
    for (let i = 0; i < array.length; i++) {
      let inputArray = [
        array[i].open,
        array[i].high,
        array[i].low,
        array[i].close,
        array[i].volume,
      ];
      if (array[i].buy === 1) {
        lastChange = "long";
      } else if (array[i].sell === 1) {
        lastChange = "short";
      }

      var outputArray = [0, 1]; // defaulting it to short
      if (lastChange === "long") {
        outputArray = [1, 0];
      }

      placeholderArray.push(_.concat(inputArray, outputArray));
    }
    return placeholderArray;
  },

  formatForTraining: (array, timeSteps, numOfInputs, type, everyMinute) => {
    // This  will return an array with
    // length of array.length - timeSteps

    let returnArray = [];
    let placeholderArray = []; // This array will array.length - 20

    for (let i = 0; i < array.length; i++) {
      placeholderArray.push(array[i]);

      if (i >= timeSteps - 1) {
        var inputArray;
        if (type === "normalize") {
          let maxArray = maxes(placeholderArray, numOfInputs);
          let minArray = mins(placeholderArray, numOfInputs);
          if (everyMinute) {
            inputArray = _.takeRight(
              normalize(placeholderArray, maxArray, minArray),
              timeSteps
            );
          } else {
            inputArray = normalize(placeholderArray, maxArray, minArray)[
              placeholderArray.length - 1
            ];
          }
        } else if (type === "standardize") {
          let meanArray = means(placeholderArray, numOfInputs);
          let stdArray = standardDeviations(placeholderArray, numOfInputs);
          if (everyMinute) {
            let newPlaceholderArray = standardize(
              placeholderArray,
              meanArray,
              stdArray
            );
            let maxArray = maxes(newPlaceholderArray, numOfInputs);
            let minArray = mins(newPlaceholderArray, numOfInputs);
            inputArray = _.takeRight(
              normalize(newPlaceholderArray, maxArray, minArray),
              timeSteps
            );
          } else {
            let newPlaceholderArray = standardize(
              placeholderArray,
              meanArray,
              stdArray
            );
            let maxArray = maxes(newPlaceholderArray, numOfInputs);
            let minArray = mins(newPlaceholderArray, numOfInputs);
            inputArray = normalize(newPlaceholderArray, maxArray, minArray)[
              newPlaceholderArray.length - 1
            ];
          }
        }
        returnArray.push(inputArray);
      }
    }
    return returnArray;
  },

  percentScale: (array, numToPercentScale) => {
    try {
      var returnArray = [];
      var newArray = array;

      for (let i = 0; i < array.length; i++) {
        returnArray.push([]);
        var benchmark = array[i][0][0]; // Setting the benchmark to the first opening price
        returnArray[i] = newArray[i].map((dataPoint) => {
          var placeholderArray = [];
          for (let k = 0; k < numToPercentScale; k++) {
            // console.log(dataPoint[k], benchmark);
            placeholderArray.push(calcPercent(dataPoint[k], benchmark));
          }
          for (let m = numToPercentScale; m < dataPoint.length; m++) {
            placeholderArray.push(dataPoint[m]);
          }
          return placeholderArray;
        });
      }
      return returnArray;
    } catch (err) {
      console.log(chalk.redBright(err));
    }
  },

  depercentScale: (array, numToPercentScale) => {
    var benchmark = array[0][0]; // Setting the benchmark to the first opening price
    return array.map((element) => {
      let placeholderArray = [];
      for (let i = 0; i < numToPercentScale; i++) {
        placeholderArray.push(decalcPercent(element[i], benchmark));
      }
      for (let i = numToPercentScale; i < element.length; i++) {
        placeholderArray.push(element[i]);
      }
      return placeholderArray;
    });
  },

  movingStandardize: (array, timeScale, numOfInputs) => {
    try {
      var lengthArray = [];
      var returnArray = [];
      var lengthCounter = 0;
      for (let i = 0; i < array.length; i++) {
        lengthCounter += array[i].length;
        lengthArray.push(lengthCounter);
        returnArray.push([]);
      }

      var longArray = [];
      for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[i].length; j++) {
          longArray.push(array[i][j]);
        }
      }

      var longReturnArray = [];
      var placeholderArray = [];
      for (let i = 0; i < longArray.length; i++) {
        placeholderArray.push(longArray[i]);
        if (i >= timeScale) {
          let rightArray = _.takeRight(placeholderArray, timeScale);
          let meanArray = means(rightArray, numOfInputs);
          let stdArray = standardDeviations(rightArray, numOfInputs);
          let standardizedPoint = standardize(
            [placeholderArray[i]],
            meanArray,
            stdArray,
            numOfInputs
          )[0];
          longReturnArray.push(standardizedPoint);
        } else {
          longReturnArray.push(longArray[i]);
        }
      }

      for (let i = 0; i < longReturnArray.length; i++) {
        for (let j = 0; j < lengthArray.length; j++) {
          if (i < lengthArray[j]) {
            returnArray[j].push(longReturnArray[i]);
            break;
          }
        }
      }
      returnArray.shift();
      return returnArray;
    } catch (err) {
      console.log(chalk.redBright(err));
    }
  },

  timeStepFormat: (array, timesteps) => {
    try {
      // Array will be of format [[], [], [], [], [], []]
      var longArray = _.flattenDepth(array, 1);
      var placeholderArray = [];
      var featureArray = [];
      var labelArray = [];

      for (let i = 0; i < longArray.length - 1; i++) {
        placeholderArray.push(longArray[i]);
        if (i > timesteps) {
          // labelArray.push(_.takeRight(longArray[i + 1], 2));
          labelArray.push(longArray[i + 1][longArray[i + 1].length - 2]);
          featureArray.push(
            _.takeRight(placeholderArray, timesteps).map((element) => {
              return _.take(element, element.length - 2);
            })
          );
        }
      }

      return { labelArray: labelArray, featureArray: featureArray };
    } catch (err) {
      console.log(chalk.redBright(err));
    }
  },

  minMaxNormalize: (array, numToNormalize) => {
    try {
      var returnArray = [];
      var maxArray = [10, 10, 10, 10, 10, 10, 100, 100000];
      var minArray = [-10, -10, -10, -10, -10, -10, 0, 0];
      for (let i = 0; i < array.length; i++) {
        // maxArray.push(maxes(array[i], numToNormalize));
        // minArray.push(mins(array[i], numToNormalize));
        returnArray.push(
          normalize(
            array[i],
            maxArray,
            minArray
            // maxes(array[i], numToNormalize),
            // mins(array[i], numToNormalize)
          )
        );
      }

      // console.log("maxArray:", maxArray)
      // console.log("minArray:", minArray)
      return returnArray;
    } catch (err) {
      console.log(chalk.redBright(err));
    }
  },


  featureLabelFormat: (array) => {
    var featureArray = [];
    var labelArray = [];
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < array[i].length; j++) {
        featureArray.push(_.take(array[i][j], array[i][j].length - 2));
        labelArray.push(_.takeRight(array[i][j], 2));
      }
    }
    return { featureArray, labelArray };
  },

  autoLoadBuySell: (ohlcArray, movingWindowLength = 20) => {
    var placeholderArray = [];
    for (let i = 0; i < ohlcArray.length; i++) {
      placeholderArray.push(ohlcArray[i]);
      if (i >= movingWindowLength) {
      }
    }
  },

  fixNaN: (array) => {
    try {
      return array.map((element1) => {
        return element1.map((element2) => {
          return element2.map((element3) => {
            if (element3.toString() === "NaN") {
              return 0;
            } else {
              return element3;
            }
          });
        });
      });
    } catch (err) {
      console.log(chalk.redBright(err));
    }
  },

  checkBuySell: (
    ohlcArray,
    predictionArray,
    longDecisionBoundary,
    shortDecisionBoundary,
    resetDecisionBoundary,
    trailingStopPercent,
    productionMode = true
  ) => {
    try {
      // predictionArray and ohlcArray need to be the same length

      var lastPrediction = "sell",
        stopLossTriggered = false,
        currentPoint,
        trailingArray = [],
        buySellArray = [],
        lengthCounter = ohlcArray.length,
        newOhlcArray = ohlcArray,
        newPredictionArray = predictionArray,
        afterStopLoss = false,
        inShortZone = false,
        inLongZone = false;

      if (ohlcArray.length > predictionArray.length) {
        lengthCounter = predictionArray.length;
        newOhlcArray = _.takeRight(ohlcArray, predictionArray.length);
      } else {
        newPredictionArray = _.take(predictionArray, ohlcArray.length);
      }

      for (let i = 0; i < lengthCounter; i++) {
        currentPoint = newOhlcArray[i];
        // Setting if stop loss is true or false
        if (lastPrediction === "buy") {
          trailingArray.push(currentPoint);
          stopLossTriggered = checkStopLoss(
            currentPoint,
            trailingArray,
            trailingStopPercent
          );
        }

        // Checking the date to make sure it can make a buy
        var canMakeBuy;
        if (!productionMode) {
          canMakeBuy = true;
        } else if (
          new Date(currentPoint.date).getUTCHours() >= 14 && // Only buying past 8am (30 mins past market open)
          new Date(currentPoint.date).getUTCHours() < 20
        ) {
          canMakeBuy = true;
        } else {
          canMakeBuy = false;
        }

        // Checking if its the end of the day
        var endOfDay;
        if (!productionMode) {
          endOfDay = false;
        } else if (
          new Date(currentPoint.date).getUTCHours() >= 19 &&
          new Date(currentPoint.date).getUTCMinutes() >= 59
        ) {
          endOfDay = true;
        } else {
          endOfDay = false;
        }

        // Checking if its in the long or short zone
        if (i > 0) {
          if (newPredictionArray[i - 1].prediction >= longDecisionBoundary) {
            inLongZone = true;
          } else {
            inLongZone = false;
          }
          if (newPredictionArray[i - 1].prediction <= shortDecisionBoundary) {
            inShortZone = true;
          } else {
            inShortZone = false;
          }
        }

        // // Checking the after stop loss variable, and resetting it only if it reaches the buy bounds again
        // // This variable is for when the stock is going down consistently, and keeps triggering a buy
        // // then a stop loss, buy, stop loss, buy stop loss, etc. This resets it so that it will only buy again
        // // Once the prediction has reached another peak of where it would usually sell...
        // if (
        //   afterStopLoss &&
        //   predictionArray[i].prediction >= resetDecisionBoundary &&
        //   lastPrediction === "sell"
        // ) {
        //   afterStopLoss = false;
        // }

        // Checking if the bot thinks it should buy
        if (
          newPredictionArray[i].prediction <= shortDecisionBoundary &&
          // newPredictionArray[i].prediction >= shortDecisionBoundary && // Checks if it passes the decision boundary and was in the short zone before, this signals a transition to long
          // inShortZone &&
          lastPrediction === "sell" &&
          canMakeBuy
          // && !afterStopLoss
        ) {
          buySellArray.push({
            date: currentPoint.date,
            longOrShort: "long",
            typeOfDecision: "botsDecision",
          });
          lastPrediction = "buy";
          inShortZone = false;
        }

        // 1. Checking if it's the end of the day, and selling if it is
        // 2. Checking if it should sell based on a trailing stop loss
        // 3. Checking the bots prediction to sell
        if (lastPrediction === "buy" && endOfDay) {
          // 1.
          buySellArray.push({
            date: currentPoint.date,
            longOrShort: "short",
            typeOfDecision: "endOfDay",
          });
          lastPrediction = "sell";
        } else if (lastPrediction === "buy" && stopLossTriggered) {
          // 2.
          buySellArray.push({
            date: currentPoint.date,
            longOrShort: "short",
            typeOfDecision: "stopLoss",
          });
          lastPrediction = "sell";
          // afterStopLoss = true;
          stopLossTriggered = false;
          trailingArray = [];
        } else if (
          newPredictionArray[i].prediction >= longDecisionBoundary &&
          // newPredictionArray[i].prediction <= longDecisionBoundary && // Checks if it passes the decision boundary and was in the short zone before, this signals a transition to long
          // inLongZone &&
          lastPrediction === "buy"
        ) {
          // 3.
          buySellArray.push({
            date: currentPoint.date,
            longOrShort: "short",
            typeOfDecision: "botsDecision",
          });
          lastPrediction = "sell";
          inLongZone = false;
        }
      }

      return buySellArray;
    } catch (err) {
      console.log(chalk.redBright(err));
    }

    // // if (testingArray.length >= timeSteps) {
    // // Calculating the stop loss value, and returning a boolean if it should sell...
    // if (lastPrediction === "buy") {
    //   trailingArray.push(currentPoint);
    //   stopLossTriggered = checkStopLoss(
    //     currentPoint,
    //     trailingArray,
    //     trailingStopPercent
    //   );
    // }
    // // Checking if the bot thinks it should buy
    // if (
    //   predictionArray[index] <= buyConfidenceInterval &&
    //   lastPrediction === "sell" &&
    //   new Date(currentPoint.date).getUTCHours() >= 14 && // Only buying past 8am (30 mins past market open)
    //   new Date(currentPoint.date).getUTCHours() < 20
    // ) {
    //   currentPoint = {
    //     ...currentPoint,
    //     buy: 1,
    //     sell: 0,
    //   };
    //   lastPrediction = "buy";
    //   lastBuyPoint = currentPoint;
    //   console.log("Buy confidence:", predictionArray[index].toFixed(2));
    // }

    // // 1. Checking if it's the end of the day, and selling if it is
    // // 2. Checking if it should sell based on a trailing stop loss
    // // 3. Checking the bots prediction to sell
    // else if (
    //   lastPrediction === "buy" &&
    //   new Date(currentPoint.date).getUTCHours() >= 19 &&
    //   new Date(currentPoint.date).getUTCMinutes() >= 59
    // ) {
    //   // 1.
    //   currentPoint = {
    //     ...currentPoint,
    //     sell: 1,
    //     buy: 0,
    //   };
    //   lastPrediction = "sell";
    //   lastSellPoint = currentPoint;
    //   totalProfitsPlaceholder +=
    //     ((lastSellPoint.open - lastBuyPoint.open) / lastBuyPoint.open) *
    //     100;
    //   console.log("End of day triggered");
    // } else if (lastPrediction === "buy" && stopLossTriggered) {
    //   // 2.
    //   currentPoint = {
    //     ...currentPoint,
    //     sell: 1,
    //     buy: 0,
    //   };
    //   lastPrediction = "sell";
    //   lastSellPoint = currentPoint;
    //   totalProfitsPlaceholder +=
    //     ((lastSellPoint.close - lastBuyPoint.close) /
    //       lastBuyPoint.close) *
    //     100;
    //   console.log(
    //     "Stop loss triggered",
    //     new Date(currentPoint.date).getHours() +
    //       ":" +
    //       new Date(currentPoint.date).getMinutes()
    //   );
    //   stopLossTriggered = false;
    //   trailingArray = [];
    // } else if (
    //   predictionArray[index] >= sellConfidenceInterval &&
    //   lastPrediction === "buy"
    // ) {
    //   // 3.
    //   currentPoint = {
    //     ...currentPoint,
    //     sell: 1,
    //     buy: 0,
    //   };
    //   lastPrediction = "sell";
    //   lastSellPoint = currentPoint;
    //   totalProfitsPlaceholder +=
    //     ((lastSellPoint.open - lastBuyPoint.open) / lastBuyPoint.open) *
    //     100;
    //   console.log(
    //     "Sell confidence:",
    //     predictionArray[index].toFixed(2),
    //     sellConfidenceInterval
    //   );
    // }
  },
};

function checkStopLoss(currentPoint, trailingArray, trailingStopPercent) {
  let max = Math.max.apply(
    Math,
    trailingArray.map((object) => {
      return object.close;
    })
  );
  let lossPercent = ((max - currentPoint.close) / currentPoint.close) * 100;
  return lossPercent > trailingStopPercent ? true : false; // Return true if the stop loss is lower than the threshold
}

function calcWildersSmoothingMethod(
  array,
  timePeriod,
  index,
  avgUt,
  avgDt,
  upOrDown
) {
  var Ut = array[index][3] - array[index - 1][3];
  var Dt = array[index - 1][3] - array[index][3];

  if (array[index][3] > array[index - 1][3] && upOrDown === "Ut") {
    avgUt = (1 / timePeriod) * Ut + (13 / timePeriod) * avgUt - 1;
  } else if (array[index - 1][3] > array[index][3] && upOrDown === "Dt") {
    avgDt = (1 / timePeriod) * Dt + (13 / timePeriod) * avgDt - 1;
  }

  if (upOrDown === "Ut") {
    return avgUt;
  } else if (upOrDown === "Dt") {
    return avgDt;
  }
}

function calcEMA(array, timePeriod, index, avgUt, avgDt, upOrDown) {
  var alpha = 2 / (timePeriod + 1);
  var Ut = array[index][3] - array[index - 1][3];
  var Dt = array[index - 1][3] - array[index][3];

  if (array[index][3] > array[index - 1][3] && upOrDown === "Ut") {
    avgUt = alpha * Ut + (1 - alpha) * avgUt - 1;
  } else if (array[index - 1][3] > array[index][3] && upOrDown === "Dt") {
    avgDt = alpha * Dt + (1 - alpha) * avgDt - 1;
  }

  if (upOrDown === "Ut") {
    return avgUt;
  } else if (upOrDown === "Dt") {
    return avgDt;
  }
}

function normalize(
  array,
  maxArray,
  minArray,
  upperBound = 0.9,
  lowerBound = 0.1
) {
  return array.map((element) => {
    let placeholderArray = [];
    for (let i = 0; i < element.length - 2; i++) {
      if (element[i] >= maxArray[i]) {
        placeholderArray.push(maxArray[i]);
      } else if (element[i] <= minArray[i]) {
        placeholderArray.push(minArray[i]);
      } else {
        placeholderArray.push(
          (element[i] - minArray[i]) / (maxArray[i] - minArray[i])
        );
      }
    }
    return _.concat(placeholderArray, _.takeRight(element, 2));
  });
}

function convertRange(value, r1, r2) {
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}

function maxes(array, numToCalcMaxes) {
  let returnArray = [];
  for (let i = 0; i < numToCalcMaxes; i++) {
    let placeholderArray = [];
    for (let j = 0; j < array.length; j++) {
      placeholderArray.push(array[j][i]);
    }
    returnArray.push(_.max(placeholderArray));
  }
  return returnArray;
}

function mins(array, numToCalcMins) {
  let returnArray = [];
  for (let i = 0; i < numToCalcMins; i++) {
    let placeholderArray = [];
    for (let j = 0; j < array.length; j++) {
      placeholderArray.push(array[j][i]);
    }
    returnArray.push(_.min(placeholderArray));
  }
  return returnArray;
}

function calcPercent(dataPoint, benchmark) {
  return ((dataPoint - benchmark) / benchmark) * 100;
}

function decalcPercent(dataPoint, benchmark) {
  return (dataPoint / 100) * benchmark + benchmark;
}

function standardDeviations(array, numOfInputs) {
  // Will return an array with the standard deviations for the inputs, and will look like this
  // [[], [], [], [], []] <= for 5 inputs, each array will have a list of the inputs
  var placeholderArray = [];
  var stdArray = [];

  for (let i = 0; i < numOfInputs; i++) {
    placeholderArray.push([]);
    for (let j = 0; j < array.length; j++) {
      placeholderArray[i].push(array[j][i]);
    }
    stdArray.push(std(placeholderArray[i]));
  }

  return stdArray;
}

function means(array, numOfInputs) {
  // Will return an array with the standard deviations for the inputs, and will look like this
  // [[], [], [], [], []] <= for 5 inputs, each array will have a list of the inputs
  var placeholderArray = [];
  var meanArray = [];

  for (let i = 0; i < numOfInputs; i++) {
    placeholderArray.push([]);
    for (let j = 0; j < array.length; j++) {
      placeholderArray[i].push(array[j][i]);
    }
    meanArray.push(mean(placeholderArray[i]));
  }
  return meanArray;
}

function standardize(array, meanArray, stdArray, numToStandardize) {
  return array.map((element) => {
    let placeholderArray = [];
    for (let i = 0; i < numToStandardize; i++) {
      placeholderArray.push(zScore(element, i, meanArray, stdArray));
    }
    for (let i = numToStandardize; i < element.length; i++) {
      placeholderArray.push(element[i]);
    }
    return placeholderArray;
  });
}

function destandardize(array, meanArray, stdArray) {
  return array.map((element) => {
    let placeholderArray = [];
    for (let i = 0; i < element.length - 2; i++) {
      placeholderArray.push(dezScore(element, i, meanArray, stdArray));
    }
    for (let i = element.length - 2; i < element.length; i++) {
      placeholderArray.push(element[i]);
    }
    return placeholderArray;
  });
}

function zScore(element, index, meanArray, stdArray) {
  return (element[index] - meanArray[index]) / stdArray[index];
}

function dezScore(element, index, meanArray, stdArray) {
  return element[index] * stdArray[index] + meanArray[index];
}

module.exports = methods;
