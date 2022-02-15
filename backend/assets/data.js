const chalk = require("chalk"),
    _ = require("lodash"),
    dumpError = require("./logErrors"),
    fs = require("fs"),
    { mean, std } = require("mathjs");



class Data {
    constructor(ohlcDays = [], buySellDays = [], timeSteps = 250) {

        this.buySellDays = buySellDays;
        this.ohlcDays = ohlcDays;
        this.timeSteps = timeSteps;

    }

    optimizeBuySellv1(ohlcDay) {

        var optimizedData1 = { profit: 0, buyArray: [], sellArray: 0 };
        var optimizedData2 = { profit: 0, buyArray: [], sellArray: 0 };
        var newProfit1 = 0;
        var newProfit2 = 0;

        // Getting rid of the first 30 minutes (untradeable, too volatile)
        let ohlcArray = _.takeRight(ohlcDay.ohlcArray, ohlcDay.ohlcArray.length - 30);

        const loopLength = ohlcArray.length;

        // Checking for 1 buy/sell
        for (let i = 0; i < loopLength; i++) { // buy 
            for (let j = i + 1; j < loopLength; j++) { // sell
                // Making sure the buy point comes before the sell point
                if (j < i) {
                    continue;
                }
                newProfit1 = calcProfit(ohlcArray[i], ohlcArray[j]);
                if (newProfit1 > optimizedData1.profit) {
                    optimizedData1 = {
                        profit: newProfit1,
                        buyArray: [ohlcArray[i]],
                        sellArray: [ohlcArray[j]],
                    };

                }
            }
        }

        for (let i = 0; i < loopLength; i++) {
            // console.log("Percentage complete:", (i / loopLength) * 100 + " %   -   time elapsed:", (Date.now() - start) / 1000);
            for (let j = i + 1; j < loopLength; j++) {
                for (let k = j + 1; k < loopLength; k++) {
                    for (let l = k + 1; l < loopLength; l++) {
                        if (l < k) {
                            continue;
                        }
                        newProfit2 = calcProfit(ohlcArray[i], ohlcArray[j]) + calcProfit(ohlcArray[k], ohlcArray[l]);
                        if (newProfit2 > optimizedData2.profit) {
                            optimizedData2 = {
                                profit: newProfit2,
                                buyArray: [ohlcArray[i], ohlcArray[k]],
                                sellArray: [ohlcArray[j], ohlcArray[l]],
                            };

                        }
                    }
                    if (k < j) {
                        continue;
                    }
                }
                if (j < i) {
                    continue;
                }
            }
        }

        var optimized = optimizedData2;

        if (optimizedData1.profit >= optimizedData2.profit) {
            optimized = optimizedData1;
        }

        var returnArray = [];
        for (let i = 0; i < optimized.buyArray.length; i++) {

            returnArray.push({
                open: optimized.buyArray[i].open,
                high: optimized.buyArray[i].high,
                low: optimized.buyArray[i].low,
                close: optimized.buyArray[i].close,
                volume: optimized.buyArray[i].volume,
                date: optimized.buyArray[i].date,
                dateString: new Date(optimized.buyArray[i].date).toLocaleString(),
                buy: 1,
                sell: 0
            }, {
                open: optimized.sellArray[i].open,
                high: optimized.sellArray[i].high,
                low: optimized.sellArray[i].low,
                close: optimized.sellArray[i].close,
                volume: optimized.sellArray[i].volume,
                date: optimized.sellArray[i].date,
                dateString: new Date(optimized.sellArray[i].date).toLocaleString(),
                buy: 0,
                sell: 1
            });

        }

        return { profit: optimized.profit, optimizedArray: returnArray };

    }


    // Time: O(MN)
    // Space: O(2N) => O(N)
    optimizeBuySell(ohlcDay, k, skipMins = 30) {

        let price = [];


        for (let i = skipMins - 1; i < ohlcDay.ohlcArray.length; i++) {
            price.push(ohlcDay.ohlcArray[i].close);
        }


        var n = price.length;

        // table to store results
        // of subproblems
        // profit[t][i] stores
        // maximum profit using
        // atmost t transactions up
        // to day i (including day i)

        if (k > n / 2) {
            k = Math.floor(n / 2);
        }

        var profit = Array(k + 1).fill(0).map
            (x => Array(n + 1).fill(0));

        var indice = Array(k + 1).fill(0).map
            (x => Array(n + 1).fill({ buy: null, sell: null, previousProfit: null, currentProfit: null }));

        // For day 0, you can't
        // earn money irrespective
        // of how many times you trade
        for (let i = 0; i <= k; i++) {
            profit[i][0] = 0;
            indice[i][0] = { buy: null, sell: null, previousProfit: null, currentProfit: null };
        }

        // profit is 0 if we don't
        // do any transaction
        // (i.e. k =0)
        for (let j = 0; j <= n; j++) {
            profit[0][j] = 0;
            indice[0][j] = { buy: null, sell: null, previousProfit: null, currentProfit: null };
        }

        // fill the table in
        // bottom-up fashion
        for (let i = 1; i <= k; i++) {
            for (let j = 1; j < n; j++) {
                var max_so_far = 0;
                var currentProfit = 0;

                for (let m = 0; m < j; m++) {

                    currentProfit = calcPercentProfit(price[m], price[j]);

                    if (currentProfit + profit[i - 1][m] > max_so_far) {
                        max_so_far = currentProfit + profit[i - 1][m];
                        indice[i][j] = { buyIndice: m, sellIndice: j, previousProfit: profit[i - 1][m], currentProfit: currentProfit };
                    }
                }

                profit[i][j] = Math.max(profit[i][j - 1],
                    max_so_far);
            }
        }


        indice = indice[indice.length - 1];

        // Getting rid of the first and last entries as they are null
        indice.pop();
        indice.shift();

        // Sorting array into descending order
        indice = indice.sort((a, b) => {
            return -a.currentProfit + b.currentProfit;
        });

        let newIndice = [indice[0]];

        let buyIndiceArray = [indice[0].buyIndice];

        for (let i = 1; i < indice.length - 1; i++) {

            let push = true;
            for (let j = 0; j < buyIndiceArray.length; j++) {

                // Checking if the buy is the same as any of the previous buy indices
                if (buyIndiceArray[j] === indice[i].buyIndice) {
                    push = false;
                }
            }

            if (push) {
                newIndice.push(indice[i]);
                buyIndiceArray.push(indice[i].buyIndice);
            }

            if (newIndice.length === k) {
                break;
            }
        }



        let returnArray = [];

        for (let i = 0; i < newIndice.length; i++) {

            returnArray.push({
                open: ohlcDay.ohlcArray[newIndice[i].buyIndice + skipMins - 1].open,
                high: ohlcDay.ohlcArray[newIndice[i].buyIndice + skipMins - 1].high,
                low: ohlcDay.ohlcArray[newIndice[i].buyIndice + skipMins - 1].low,
                close: ohlcDay.ohlcArray[newIndice[i].buyIndice + skipMins - 1].close,
                volume: ohlcDay.ohlcArray[newIndice[i].buyIndice + skipMins - 1].volume,
                date: ohlcDay.ohlcArray[newIndice[i].buyIndice + skipMins - 1].date,
                dateString: new Date(ohlcDay.ohlcArray[newIndice[i].buyIndice + skipMins - 1].date).toLocaleString(),
                buy: 1,
                sell: 0
            }, {
                open: ohlcDay.ohlcArray[newIndice[i].sellIndice + skipMins - 1].open,
                high: ohlcDay.ohlcArray[newIndice[i].sellIndice + skipMins - 1].high,
                low: ohlcDay.ohlcArray[newIndice[i].sellIndice + skipMins - 1].low,
                close: ohlcDay.ohlcArray[newIndice[i].sellIndice + skipMins - 1].close,
                volume: ohlcDay.ohlcArray[newIndice[i].sellIndice + skipMins - 1].volume,
                date: ohlcDay.ohlcArray[newIndice[i].sellIndice + skipMins - 1].date,
                dateString: new Date(ohlcDay.ohlcArray[newIndice[i].sellIndice + skipMins - 1].date).toLocaleString(),
                buy: 0,
                sell: 1
            });
        }


        return { profit: profit[k][n - 1], optimizedArray: returnArray };

    }


    checkDateOrder(schema) {
        return schema.sort((a, b) => {

            let A = Date.parse(a.day);
            let B = Date.parse(b.day);

            return A - B;
        });
    }

    checkEmptyDays(array) {
        // The first array callback returns undefined for any days with no data in them 

        return array.map(element => {
            if (element.ohlcArray.length !== 0) {
                return element;
            }
        })
            // The second array callback gets rid of undefined entries in the array 
            .filter(x => {
                return x !== undefined;
            });


    }

    matchInOut(ohlcDays, buySellDays, useMinData) {
        try {

            var newBuySellDays = this.checkDateOrder(buySellDays).reverse();
            var newOhlcDays = ohlcDays.reverse();

            if (useMinData) {
                newBuySellDays = _.take(newBuySellDays, 25);
                newOhlcDays = _.take(ohlcDays, 25);
            }


            // Populating one array for all the buy/sell points
            let longBuySellArray = [];
            for (let i = 0; i < newBuySellDays.length; i++) {
                for (let j = 0; j < newBuySellDays[i].buySellDaysArray.length; j++) {
                    longBuySellArray.push(newBuySellDays[i].buySellDaysArray[j]);
                }
            }

            var lastChange = "short"; // defaulting the last change to short... (hold/hasn't been bought yet)
            var returnArray = []; // making the training array the same length as the number of training days
            var inputArray = [0, 0, 0, 0, 0, 0];
            var outputArray = [0, 1];


            for (let i = 0; i < newOhlcDays.length; i++) {

                returnArray.push([]);

                for (let j = 0; j < newOhlcDays[i].ohlcArray.length; j++) {

                    inputArray = [
                        newOhlcDays[i].ohlcArray[j].open,
                        newOhlcDays[i].ohlcArray[j].high,
                        newOhlcDays[i].ohlcArray[j].low,
                        newOhlcDays[i].ohlcArray[j].close,
                        newOhlcDays[i].ohlcArray[j].volume,
                        newOhlcDays[i].ohlcArray[j].date,
                    ];

                    outputArray = [0, 1];
                    if (lastChange === "long") {
                        outputArray = [1, 0];
                    }

                    for (let k = 0; k < longBuySellArray.length; k++) {
                        if (newOhlcDays[i].ohlcArray[j].date === longBuySellArray[k].date) {
                            if (longBuySellArray[k].buy) {
                                lastChange = "long";
                            } else {
                                lastChange = "short";
                            }
                            longBuySellArray.splice(k, 1);
                            k--;
                            break;
                        }
                    }
                    returnArray[i].push([...inputArray, ...outputArray]);
                }

            }



            return returnArray;
        } catch (err) {
            dumpError(err);
            process.exit();
        }
    }

    addRSI(array, timePeriod = 14) {
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
            dumpError(err);
            process.exit();
        }
    }


    addSMA(trainingArray, timePeriod) {
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
            dumpError(err);
            process.exit();
        }
    }


    percentScale(array, numToPercentScale) {
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
            dumpError(err);
            process.exit();
        }
    }

    delete(array, amountOfDays) {
        return array.map((dayArray) => {
            if (dayArray.length > amountOfDays) {
                return _.takeRight(dayArray, dayArray.length - amountOfDays);
            } else {
                return dayArray;
            }
        });
    }

    movingStandardize(array, timeScale, numOfInputs) {
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
            dumpError(err);
            process.exit();
        }
    }


    minMaxNormalize(array, numToNormalize) {
        try {

            var maxArray = [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 100, 1000000];
            var minArray = [-2.5, -2.5, -2.5, -2.5, -2.5, -2.5, 0, 0];


            let newArray = _.flattenDepth(array, 1);




            for (let i = 0; i < newArray.length; i++) {
                for (let j = 0; j < newArray[i].length - 3; j++) { // length of 11 ... 
                    if (newArray[i][j] !== null) {
                        maxArray[j] = Math.max(maxArray[j], newArray[i][j]);
                        minArray[j] = Math.min(minArray[j], newArray[i][j]);
                    }

                }
            }

            for (let i = 0; i < numToNormalize; i++) { // length of 11 ... 
                let longArray = [];
                for (let j = 0; j < array.length; j++) { // day
                    for (let k = 0; k < array[j].length; k++) { // data point 
                        longArray.push(array[j][k][i]);
                    }
                }

                if (i !== 6) {
                    maxArray[i] = Math.max(...longArray);
                    minArray[i] = Math.min(...longArray);
                }
            }


            // Fixing some of the min and max array indices
            minArray[7] = 0;

            var returnArray = [];
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
            dumpError(err);
            process.exit();
            process.exit();
        }
    }


    timeStepFormat(array, timesteps) {
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


            return { featureArray: featureArray, labelArray: labelArray };
        } catch (err) {
            dumpError(err);
            process.exit();
        }
    }

    deleteDate(featureArray) {
        return featureArray.map((timeStep) => {
            return timeStep.map((array) => {
                // Getting rid of the last entry (date)
                return array.filter((element, index) => index < array.length - 1);
            });
        });
    }


    format(useMinData = false, writeLogs = false, readTimes = false) {

        var start = Date.now();
        // Checking the data is in ascending order
        let formattedData = this.checkDateOrder(this.ohlcDays);
        readTimes && console.log("Execution time for checkDateOrder", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute.");
        writeLogs && fs.writeFileSync("./assets/saved/1checkDateOrder.json", JSON.stringify(formattedData));

        start = Date.now();
        // Checking if there's any empty days in the data and deleting if so 
        formattedData = this.checkEmptyDays(formattedData);
        readTimes && console.log("Execution time for checkEmptyDays", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute.");
        writeLogs && fs.writeFileSync("./assets/saved/2checkEmptyDays.json", JSON.stringify(formattedData));

        start = Date.now();
        // Matching the buy/sell data with the ohlcDays into one long array
        formattedData = this.matchInOut(formattedData, this.buySellDays, useMinData);
        readTimes && console.log("Execution time for matchInOut", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute.");
        writeLogs && fs.writeFileSync("./assets/saved/3matchInOut.json", JSON.stringify(formattedData));

        // start = Date.now();
        // // Adding RSI to the data 
        // formattedData = this.addRSI(formattedData);
        // readTimes && console.log("Execution time for addRSI", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute."): console.log("");
        // writeLogs && fs.writeFileSync("./assets/saved/4addRSI.json", JSON.stringify(formattedData));

        // start = Date.now();
        // // Adding SMA20 to the data
        // formattedData = this.addSMA(formattedData, 20);
        //readTimes &&  console.log("Execution time for addSMA20", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute."): console.log("");
        // writeLogs && fs.writeFileSync("./assets/saved/5addSMA20.json", JSON.stringify(formattedData));

        // start = Date.now();
        // // Adding SMA45 to the data
        // formattedData = this.addSMA(formattedData, 45);
        //readTimes &&  console.log("Execution time for addSMA40", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute."): console.log("");
        // writeLogs && fs.writeFileSync("./assets/saved/6addSMA45.json", JSON.stringify(formattedData));

        start = Date.now();
        // Scaling all the data to a percent scale (open, high, low, close, SMA20, SMA45)
        formattedData = this.percentScale(formattedData, 4);
        readTimes && console.log("Execution time for percentScale", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute.");
        writeLogs && fs.writeFileSync("./assets/saved/7percentScale.json", JSON.stringify(formattedData));

        start = Date.now();
        // Standardizing all of the data with a moving standard deviation of 2000
        formattedData = this.movingStandardize(formattedData, 2000, 4);
        readTimes && console.log("Execution time for movingStandardize", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute.");
        writeLogs && fs.writeFileSync("./assets/saved/8movingStandardize.json", JSON.stringify(formattedData));


        start = Date.now();
        // This function gets rid of the first 30 minutes of the day (as it's unpredictable, and RSI calculations are not 100%)
        formattedData = this.delete(formattedData, 30);
        readTimes && console.log("Execution time for delete", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute.");
        writeLogs && fs.writeFileSync("./assets/saved/9delete.json", JSON.stringify(formattedData));


        start = Date.now();
        // Converting all the values of the array between 0 and 1
        formattedData = this.minMaxNormalize(formattedData, 8);
        readTimes && console.log("Execution time for minMaxNormalize", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute.");
        writeLogs && fs.writeFileSync("./assets/saved/10minMaxNormalize.json", JSON.stringify(formattedData));

        // Converting values to separate feature and label arrays
        start = Date.now();
        var { featureArray, labelArray } = this.timeStepFormat(formattedData, this.timeSteps);
        readTimes && console.log("Execution time for timeStepFormat", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute.");
        writeLogs && fs.writeFileSync("./assets/saved/11timeStepFormat.json", JSON.stringify({ featureArray: featureArray, labelArray: labelArray }));

        start = Date.now();
        // Deleting the date form the featureArray for training purposes
        featureArray = this.deleteDate(featureArray);
        readTimes && console.log("Execution time for deleteDate", chalk.greenBright((Date.now() - start) / 1000), "seconds to execute.");
        writeLogs && fs.writeFileSync("./assets/saved/12deleteDate.json", JSON.stringify({ featureArray: featureArray, labelArray: labelArray }));

        return { featureArray: featureArray, labelArray: labelArray };

    };

}

// Functions
function calcProfit(buyPoint, sellPoint, BC = 1, SC = 1) {
    // Returns the % profit, with commissions factored in. 
    var numOfShares = 25;

    var SPP = buyPoint * numOfShares;
    var SSP = sellPoint * numOfShares;
    // BC = buying commission price
    // SC = selling commission price


    return ((SSP - SC) - (SPP + BC)) / (SPP + BC) * 100;

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

function calcPercent(dataPoint, benchmark) {
    return ((dataPoint - benchmark) / benchmark) * 100;
}


// Functions
function calcPercentProfit(buyPoint, sellPoint, BC = 1, SC = 1, shares = 20) {

    // Returns the % profit, with commissions factored in. 
    return ((sellPoint - buyPoint) * shares - BC - SC) / (buyPoint * shares) * 100;
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

function zScore(element, index, meanArray, stdArray) {
    return (element[index] - meanArray[index]) / stdArray[index];
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
        for (let i = 0; i < element.length - 3; i++) {
            placeholderArray.push(
                (element[i] - minArray[i]) / (maxArray[i] - minArray[i])
            );
        }
        return _.concat(placeholderArray, _.takeRight(element, 3));
    });
}

const removeIncrements = (array) => {
    let newArray = [];
    for (let i = 0; i < array.length; i++) {
        if (array[i] + 1 !== array[i + 1]) {
            newArray.push(array[i]);
        }
    }
    return newArray;
};

module.exports = Data;