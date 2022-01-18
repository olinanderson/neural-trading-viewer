import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import _ from "lodash";

import Spinner from "../Spinner/Spinner";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
  BarSeries,
  CandlestickSeries,
  LineSeries,
  RSISeries,
} from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
  EdgeIndicator,
  CurrentCoordinate,
  MouseCoordinateX,
  MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import {
  OHLCTooltip,
  MovingAverageTooltip,
  RSITooltip,
  SingleValueTooltip,
} from "react-stockcharts/lib/tooltip";
import { ema, rsi, sma } from "react-stockcharts/lib/indicator";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";
import {
  Annotate,
  SvgPathAnnotation,
  buyPath,
  sellPath,
} from "react-stockcharts/lib/annotation";

var Charts = ({
  ohlc,
  buySell,
  bot,
  width,
  ratio,
}) => {


  if (ohlc.isLoading) {
    return <Spinner />;
  }

  if (!ohlc.isLoading && !ohlc.ohlcDay.ohlcArray.length) {
    return <Fragment>
      There is no data yet.
    </Fragment>;
  }

  // Checks the buySell arrays to add it to the current object (buy: 1, sell: 0) etc
  // Once it adds the buy/sell object attribute, the graph will show it if buy is 1, or if sell is 1
  const check = (isLoading, objectArrayLength, objectArray, ohlcDate, obj) => {

    var newObj = obj;

    if (!isLoading && objectArrayLength) {
      for (let j = 0; j < objectArrayLength; j++) {
        if (objectArray[j].date === ohlcDate) {
          // Check if long
          if (objectArray[j].buy) {
            newObj.buy = 1;
            // Check if short
          } else if (objectArray[j].sell) {
            newObj.sell = 1;
          }
        }
      }
    }
    return newObj;
  };

  const combineData = (ohlc, buySell, bot) => {
    let longArray = [];

    const { ohlcDay } = ohlc;


    for (let i = 0; i < ohlcDay.ohlcArray.length; i++) {
      var newObj = {
        date: new Date(ohlcDay.ohlcArray[i].date),
        open: ohlcDay.ohlcArray[i].open,
        high: ohlcDay.ohlcArray[i].high,
        low: ohlcDay.ohlcArray[i].low,
        close: ohlcDay.ohlcArray[i].close,
        volume: ohlcDay.ohlcArray[i].volume,
        split: "",
        dividend: "",
        botBuy: 0,
        botSell: 0,
        buy: 0,
        sell: 0,
        prediction: 0.5,
      };

      // Optimized buy/sell 
      newObj = check(buySell.isLoading, buySell.buySellDay.buySellDaysArray.length, buySell.buySellDay.buySellDaysArray, ohlcDay.ohlcArray[i].date, newObj);

      // Bots prediction buy/sell
      newObj = check(bot.buySell.isLoading, bot.buySell.buySellDay.botBuySellDaysArray.length, bot.buySell.buySellDay.botBuySellDaysArray, ohlcDay.ohlcArray[i].date, newObj);

      longArray.push(newObj);
    }
    return longArray;
  };


  var dataArray = combineData(ohlc, buySell, bot);

  const sma20 = sma()
    .id(0)
    .options({ windowSize: 20 })
    .merge((d, c) => {
      d.sma20 = c;
    })
    .accessor((d) => d.sma20);

  const sma45 = sma()
    .id(1)
    .options({ windowSize: 45 })
    .merge((d, c) => {
      d.sma45 = c;
    })
    .accessor((d) => d.sma45);

  const predictionSma10 = sma()
    .id(2)
    .options({ windowSize: 10, sourcePath: "prediction" })
    .merge((d, c) => {
      d.predictionSma10 = c;
    })
    .accessor((d) => d.predictionSma10)
    .stroke("red");

  const smaVolume50 = sma()
    .id(3)
    .options({ windowSize: 50, sourcePath: "volume" })
    .merge((d, c) => {
      d.smaVolume50 = c;
    })
    .accessor((d) => d.smaVolume50);

  const rsiCalculator = rsi()
    .options({ windowSize: 14 })
    .merge((d, c) => {
      d.rsi = c;
    })
    .accessor((d) => d.rsi);

  const initialData = dataArray;

  const calculatedData = sma20(sma45(smaVolume50(rsiCalculator(initialData))));
  const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(
    (d) => d.date
  );
  const { data, xScale, xAccessor, displayXAccessor } =
    xScaleProvider(calculatedData);

  const start = xAccessor(last(data));
  const end = xAccessor(data[Math.max(0, data.length - 150)]);
  const xExtents = [start, end];

  const longAnnotationProps = {
    y: ({ yScale, datum }) => yScale(datum.low),
    fill: "#006517",
    path: buyPath,
    tooltip: "Go long",
  };

  const shortAnnotationProps = {
    y: ({ yScale, datum }) => yScale(datum.high),
    fill: "#FF0000",
    path: sellPath,
    tooltip: "Go short",
  };

  var totalHeight = 600;
  var showPredictionChart = false;

  var candleStickHeight = 0.4 * totalHeight;
  var volumeHeight = 0.4 * candleStickHeight;
  var rsiHeight = 0.3 * totalHeight;
  var predictionHeight = 0.3 * totalHeight;

  if (!bot.prediction.isLoading && bot.prediction.predictionDay.predictionDaysArray.length) {
    showPredictionChart = true;
  }

  showPredictionChart = true;

  var margin = { left: 70, right: 70, top: 20, bottom: 30 };

  const checkShowPrediction = (bot, predictionHeight, sma45, predictionSma10, showPredictionChart) => {
    if (showPredictionChart) {
      return (
        <Chart
          id={4}
          yExtents={[0, 1]}
          xAccessor={(d) => d.date}
          height={predictionHeight}
          origin={(w, h) => [0, h - predictionHeight]}
          padding={{ top: 10, bottom: 10 }}
        >
          <XAxis axisAt="bottom" orient="bottom" showTicks={true} />
          <YAxis axisAt="right" orient="right" tickValues={[0, 0.5, 1]} />

          <MouseCoordinateX
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat("%I:%M %p")}
          />
          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format(".2f")}
          />

          <CurrentCoordinate yAccessor={(d) => d.prediction} fill={"#2ca02c"} />
          <CurrentCoordinate yAccessor={sma45.accessor()} fill={sma45.stroke()} />

          <LineSeries yAccessor={(d) => d.prediction} stroke="#2ca02c" />
          <LineSeries
            yAccessor={predictionSma10.accessor()}
            stroke={predictionSma10.stroke()}
          />

          <SingleValueTooltip
            yAccessor={(d) => d.prediction}
            yLabel={"Prediction"}
            yDisplayFormat={format(".2f")}
            origin={[-40, 15]}
          />
          {/* 
          <SingleValueTooltip
            yAccessor={(d) => d.predictionSma10}
            yLabel={"SMA10"}
            yDisplayFormat={format(".2f")}
            origin={[-40, 15]}
          /> */}
        </Chart>
      );
    }
  };

  return (
    <ChartCanvas
      height={totalHeight + 50} // Adding the 50 because of the margin of 20 and 30
      width={width}
      ratio={ratio}
      margin={margin}
      type={"svg"}
      seriesName="MSFT"
      data={data}
      xScale={xScale}
      xAccessor={xAccessor}
      displayXAccessor={displayXAccessor}
      xExtents={xExtents}
    >

      {/* Candlestick and RSI chart */}
      <Chart
        id={1}
        height={candleStickHeight}
        yExtents={[(d) => [d.high, d.low], sma20.accessor()]}
        padding={{ top: 40, bottom: 20 }}
      >
        <XAxis
          axisAt="bottom"
          orient="bottom"
          showTicks={false}
          outerTickSize={0}
        />
        <YAxis axisAt="right" orient="right" ticks={5} />

        <MouseCoordinateY
          at="right"
          orient="right"
          displayFormat={format(".2f")}
        />
        {/* 
        <MouseCoordinateX
          at="bottom"
          orient="bottom"
          displayFormat={timeFormat("%I:%M %p")}
        /> */}

        <CandlestickSeries />
        <LineSeries yAccessor={sma20.accessor()} stroke={sma20.stroke()} />
        <LineSeries yAccessor={sma45.accessor()} stroke={sma45.stroke()} />
        <Annotate
          with={SvgPathAnnotation}
          when={(d) => d.buy === 1}
          usingProps={longAnnotationProps}
        />
        <Annotate
          with={SvgPathAnnotation}
          when={(d) => d.sell === 1}
          usingProps={shortAnnotationProps}
        />
        <CurrentCoordinate yAccessor={sma20.accessor()} fill={sma20.stroke()} />
        <CurrentCoordinate yAccessor={sma45.accessor()} fill={sma45.stroke()} />

        <EdgeIndicator
          itemType="last"
          orient="right"
          edgeAt="right"
          yAccessor={(d) => d.close}
          fill={(d) => (d.close > d.open ? "#6BA583" : "#FF0000")}
        />

        <OHLCTooltip origin={[-40, 0]} />

        <MovingAverageTooltip
          onClick={(e) => console.log(e)}
          origin={[-38, 15]}
          options={[
            {
              yAccessor: sma20.accessor(),
              type: "SMA",
              stroke: sma20.stroke(),
              windowSize: sma20.options().windowSize,
            },
            {
              yAccessor: sma45.accessor(),
              type: "SMA",
              stroke: sma45.stroke(),
              windowSize: sma45.options().windowSize,
            },
          ]}
        />
      </Chart>
      <Chart
        id={2}
        height={volumeHeight}
        yExtents={[(d) => d.volume]}
        origin={(w, h) => [0, candleStickHeight - volumeHeight]}
      >
        <YAxis
          axisAt="left"
          orient="left"
          ticks={5}
          tickFormat={format(".2s")}
        />

        <MouseCoordinateY
          at="left"
          orient="left"
          displayFormat={format(".4s")}
        />

        <BarSeries
          yAccessor={(d) => d.volume}
          fill={(d) => (d.close > d.open ? "#a3ccb4" : "#d18888")}
        />
      </Chart>
      <Chart
        id={3}
        yExtents={[0, 100]}
        height={rsiHeight}
        // padding={{ top: 10, bottom: 10 }}
        origin={(w, h) => [0, h - rsiHeight - predictionHeight]}
      >
        <XAxis
          axisAt="bottom"
          orient="bottom"
          showTicks={false}
          outerTickSize={0}
        />
        <YAxis axisAt="right" orient="right" tickValues={[30, 50, 70]} />
        <MouseCoordinateY
          at="right"
          orient="right"
          displayFormat={format(".2f")}
        />

        <CurrentCoordinate
          yAccessor={rsiCalculator.accessor()}
          fill={rsiCalculator.stroke()}
        />

        <RSISeries yAccessor={(d) => d.rsi} />

        <RSITooltip
          origin={[-40, 15]}
          yAccessor={(d) => d.rsi}
          options={rsiCalculator.options()}
        />
      </Chart>

      {/* Prediction Chart */}
      {checkShowPrediction(bot, predictionHeight, sma45, predictionSma10, showPredictionChart)}

    </ChartCanvas>
  );
};

Charts.propTypes = {
  ohlc: PropTypes.object.isRequired,
  buySell: PropTypes.object.isRequired,
  bot: PropTypes.object.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
};

Charts = fitWidth(Charts);

const mapStateToProps = (state) => ({
  ohlc: state.ohlc,
  buySell: state.buySell,
  bot: state.bot,
});

export default connect(mapStateToProps, {})(Charts);
