import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import _ from "lodash";

import Candlestick from "./Candlestick";
import Prediction from "./Prediction";
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

var RealtimeChart = ({
  ohlc,
  buySell,
  bot,
  width,
  ratio,
}) => {


  if (ohlc.dayLoading) {
    return <Spinner />;
  }

  var dataArray = [];

  var { ohlcDay } = ohlc;
  var { buySellDay } = buySell;
  var { botBuySellDay } = bot.buySell;
  var { predictionDay } = bot.prediction;

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
      buy: 0,
      sell: 0,
      prediction: 0,
    };
    if (botBuySellDay.botBuySellArray !== undefined || botBuySellDay.botBuySellArray.length !== 0) {
      for (let j = 0; j < botBuySellDay.botBuySellArray.length; j++) {
        if (botBuySellDay.botBuySellArray[j].date === ohlcDay.ohlcArray[i].date) {
          // Check if long
          if (botBuySellDay.botBuySellArray[j].longOrShort === "long") {
            newObj.buy = 1;
          } else if (
            // else it's short
            bot.botBuySellArray[j].longOrShort === "short"
          ) {
            newObj.sell = 1;
          }
        }
      }
    }
    for (let k = 0; k < predictionDay.predictionArray.length; k++) {
      if (predictionDay.predictionArray[k].date === ohlcDay.ohlcArray[i].date) {
        newObj.prediction = predictionDay.predictionArray[k].prediction;
      }
    }
    dataArray.push(newObj);
  }

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
    y: ({ yScale, datum }) => yScale(datum.close),
    fill: "#006517",
    path: buyPath,
    tooltip: "Go long",
  };

  const shortAnnotationProps = {
    y: ({ yScale, datum }) => yScale(datum.close),
    fill: "#FF0000",
    path: sellPath,
    tooltip: "Go short",
  };


  var totalHeight = 600;
  var candleStickHeight = 0.4 * totalHeight;
  var volumeHeight = 0.4 * candleStickHeight;
  var rsiHeight = 0.3 * totalHeight;
  var predictionHeight = 0.3 * totalHeight;

  var margin = { left: 70, right: 70, top: 20, bottom: 30 };


  const checkCharts = (ohlc, bot) => {
    if (ohlc.dayLoading) {
      return <Spinner />;
    } else {

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
      <Candlestick
        sma20={sma20}
        sma45={sma45}
        longAnnotationProps={longAnnotationProps}
        shortAnnotationProps={shortAnnotationProps}
        candleStickHeight={candleStickHeight}
        volumeHeight={volumeHeight}
        rsiHeight={rsiHeight}
        predictionHeight={predictionHeight}
        rsiCalculator={rsiCalculator}
      />

      {/* Prediction Chart */}
      <Prediction
        predictionHeight={predictionHeight}
        sma45={sma45}
        predictionSma10={predictionSma10}
      />


    </ChartCanvas>
  );
};

RealtimeChart.propTypes = {
  ohlc: PropTypes.object.isRequired,
  buySell: PropTypes.object.isRequired,
  bot: PropTypes.object.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
};

RealtimeChart = fitWidth(RealtimeChart);

const mapStateToProps = (state) => ({
  ohlc: state.ohlc,
  buySell: state.buySell,
  bot: state.bot,
});

export default connect(mapStateToProps, {})(RealtimeChart);
