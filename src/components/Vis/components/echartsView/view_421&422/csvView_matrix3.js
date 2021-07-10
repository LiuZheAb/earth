import React, { Component } from 'react';
import Heatmap from 'heatmap.js';
import "./index3.css";

let getMax = arr => {
    var max = arr[0];
    for (var i = 0; i < arr.length; i++) {
        if (max < arr[i]) {
            max = arr[i];
        }
    }
    return max;
}
//获取最小值
let getMin = arr => {
    var min = arr[0];
    for (var i = 0; i < arr.length; i++) {
        if (min > arr[i]) {
            min = arr[i];
        }
    }
    return min;
}
export default class csvView_matrix extends Component {
    constructor(props) {
        super(props)

        this.state = {
            data: [],
            dataMap: [],
            dataKey: "",
            legendMap: [],
            xAxisData: [],
            yAxisData: []
        }
    }
    componentDidMount() {
        let { data } = this.props;
        let yData = [], xData = [], dataMap = [];
        data = data[0].map((col, i) => data.map(row => row[i]));
        for (let i = 0, len = data.length; i < len; i++) {
            let key = data[i][0].replace(/%| /g, "");
            data[i].shift();
            if (key === "xcent") {
                xData = data[i].map(item => Number(item));
            } else if (key === "ycent") {
                yData = data[i].map(item => Number(item));
            } else if (key === "sigma_inv") {
                dataMap = data[i].map(item => Number(item));
            }
        }
        let xMin = getMin(xData), xMax = getMax(xData), yMin = getMin(yData), yMax = getMax(yData), max = getMax(dataMap), min = getMin(dataMap), range = max - min;
        console.log({ max, min });
        let xRange = xMax - xMin, yRange = yMax - yMin;
        let dataSource = [], xAxisData = [], yAxisData = [];
        let chart = document.getElementById("matrix_chart");
        for (let i = 0, len = dataMap.length; i < len; i++) {
            dataSource.push({
                x: (xData[i] - xMin) / xRange * chart.clientWidth,
                y: ((yMax - yData[i]) / yRange) * chart.clientHeight,
                value: dataMap[i]
            });
        }
        for (let i = xMin; i <= xMax; i++) {
            if (i % 400 === 0) {
                xAxisData.push({ value: i, offset: (i - xMin) / xRange * 100 });
            }
        }
        for (let i = Number(yMax.toFixed(0)); i >= yMin; i--) {
            if (i % 400 === 0) {
                yAxisData.push({ value: i, offset: (yMax - i) / yRange * 100 });
            }
        }
        let legendDataSource = [];
        for (let i = -3.0111; i > -4.0689; i -= (-3.0111 - -4.0689) / 7) {
            legendDataSource.push(i.toFixed(4))
        }
        legendDataSource.push(-4.0689)
        let maxPercent = 1 - (max - -3.0111) / range, minPercent = (-4.0689 - min) / range;
        let gradient = {
            "1": "#f8fa0d",
            "0": "#352a86"
        };
        gradient[String(maxPercent + 0.00000001)] = "#f8fa0d";
        gradient[String(minPercent)] = "#352a86";
        let corlorMap = ["#0262e0", "#1484d3", "#05a6c6", "#37b89d", "#91be72", "#d8ba55", "#fbcd2d"];
        for (let i = 0; i < 7; i++) {
            gradient[String((maxPercent - minPercent) / 7 * i + minPercent + 0.00000001)] = corlorMap[i];
            gradient[String((maxPercent - minPercent) / 7 * (i + 1) + minPercent)] = corlorMap[i];
        }
        this.map = Heatmap.create({
            container: chart,
            radius: 4.5,
            maxOpacity: 1,
            minOpacity: 1,
            blur: 1,
            backgroundColor: "#fff",
            gradient: gradient
            // {
            // "1": "#f2ef18",
            // "0.96666667": "#f4e41f",
            // "0.93333333": "#f5d727",
            // "0.9": "#f9cc31",
            // "0.86666667": "#fbc13b",
            // "0.83333333": "#f5bd42",
            // "0.8": "#f0d840",
            // "0.76666667": "#e1e93b",
            // "0.73333333": "#bbe836",
            // "0.7": "#94e332",
            // "0.66666667": "#6cdd2b",
            // "0.63333333": "#43d826",
            // "0.6": "#23d42c",
            // "0.56666667": "#1fcf48",
            // "0.53333333": "#18cb67",
            // "0.5": "#16c485",
            // "0.46666667": "#12c1a2",
            // "0.43333333": "#0eb6b9",
            // "0.4": "#0aa5c1",
            // "0.36666667": "#08a0c7",
            // "0.33333333": "#0b98ce",
            // "0.3": "#108dcf",
            // "0.26666667": "#1585cf",
            // "0.23333333": "#127cd4",
            // "0.2": "#0c73d8",
            // "0.16666667": "#066bdd",
            // "0.13333333": "#0760db",
            // "0.1": "#224fcc",
            // "0.06666667": "#3242b1",
            // "0.03333333": "#343198",
            // "0": "#39307f",

            // "1": "#f8fa0d",
            // "0.95": "#fbcd2d",
            // "0.85714286": "#fbcd2d",
            // "0.85714285": "#d8ba55",
            // "0.71428572": "#d8ba55",
            // "0.71428571": "#91be72",
            // "0.57142858": "#91be72",
            // "0.57142857": "#37b89d",
            // "0.42857143": "#37b89d",
            // "0.42857142": "#05a6c6",
            // "0.28571429": "#05a6c6",
            // "0.28571428": "#1484d3",
            // "0.14285715": "#1484d3",
            // "0.14285714": "#0262e0",
            // "0.05": "#0262e0",
            // "0": "#352a86",


            // "1": "#ffffff",
            // "0.85714286": "#ffffff",
            // "0.85714285": "#cacaca",
            // "0.71428571": "#cacaca",
            // "0.71428570": "#a1a1a1",
            // "0.57142857": "#a1a1a1",
            // "0.57142856": "#797979",
            // "0.42857143": "#797979",
            // "0.42857142": "#515151",
            // "0.28571429": "#515151",
            // "0.28571428": "#282828",
            // "0.14285714": "#282828",
            // "0.14285713": "#000000",
            // "0": "#000000",
            // }
        });
        this.map.setData({
            max: -3.0111,
            min: -4.0689,
            data: dataSource
        });
        this.setState({
            dataMap,
            xAxisData,
            yAxisData,
            dataSource,
            legendMap: legendDataSource,
        });
    }
    render() {
        let { legendMap, xAxisData, yAxisData } = this.state;
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div id="chart-container-2">
                    <div id="matrix_chart"></div>
                    <div id="legend">
                        <div className="color-bar"></div>
                        <div className="color-num">
                            {legendMap.map(item => <span key={item}>{item}</span>)}
                        </div>
                    </div>
                    <div id="x-axis">
                        {xAxisData.map(item => <span key={item.value} style={{ left: item.offset + "%" }}>{item.value}</span>)}
                    </div>
                    <div id="y-axis">
                        {yAxisData.map(item => <span key={item.value} style={{ top: item.offset + "%" }}>{item.value}</span>)}
                    </div>
                </div>
            </div>
        )
    }
}
