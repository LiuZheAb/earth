import React, { Component } from 'react';
import Heatmap from 'heatmap.js';
import "./index.css";

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
/**
 * 数据插值
 * @param w 目标矩阵宽度
 * @param h 目标矩阵高度
 * @param data 源数据矩阵（二维数组）
 * @param type 插值方式，1：双线性插值，2：双三次插值法
 */
let scaleData = function (w, h, data, type = 2) {
    let resData = new Array(h);

    for (let j = 0; j < h; j++) {
        let line = new Array(w);
        for (let i = 0; i < w; i++) {
            let v;
            if (type === 2) {
                // 双三次插值法
                v = cubicInterpolation(w, h, i, j, data);
            } else if (type === 1) {
                // 双线性插值
                v = interpolation(w, h, i, j, data);
            } else {
                throw new Error('scale data, type not supported(type must be 1 or 2)');
            }
            line[i] = v;
        }
        resData[j] = line;
    }
    return resData;
}

let interpolation = function (sw, sh, x_, y_, data) {
    let w = data[0].length;
    let h = data.length;

    let x = (x_ + 0.5) * w / sw - 0.5;
    let y = (y_ + 0.5) * h / sh - 0.5;

    let x1 = Math.floor(x);
    let x2 = Math.floor(x + 0.5);
    let y1 = Math.floor(y);
    let y2 = Math.floor(y + 0.5);

    x1 = x1 < 0 ? 0 : x1;
    y1 = y1 < 0 ? 0 : y1;


    x1 = x1 < w - 1 ? x1 : w - 1;
    y1 = y1 < h - 1 ? y1 : h - 1;

    x2 = x2 < w - 1 ? x2 : w - 1;
    y2 = y2 < h - 1 ? y2 : h - 1;

    // 取出原矩阵中对应四个点的值
    let f11 = data[y1][x1];
    let f21 = data[y1][x2];
    let f12 = data[y2][x1];
    let f22 = data[y2][x2];
    // 计算该点的值
    let xm = x - x1;
    let ym = y - y1;
    let r1 = (1 - xm) * f11 + xm * f21;
    let r2 = (1 - xm) * f12 + xm * f22;
    let value = (1 - ym) * r1 + ym * r2;

    return value;
}

let cubicInterpolation = function (sw, sh, x_, y_, data) {
    let w = data[0].length;
    let h = data.length;
    // 计算缩放后坐标对应源数据上的坐标
    let x = x_ * w / sw;
    let y = y_ * h / sh;


    // 计算x和y方向的最近的4*4的坐标和权重
    let wcx = getCubicWeight(x);
    let wcy = getCubicWeight(y);

    // 权重
    let wx = wcx.weight;
    let wy = wcy.weight;

    // 坐标
    let xs = wcx.coordinate;
    let ys = wcy.coordinate;

    let val = 0;
    // 遍历周围4*4的点，根据权重相加
    for (let j = 0; j < 4; j++) {
        let py = ys[j];
        py = py < 0 ? 0 : py;
        py = py > h - 1 ? h - 1 : py;
        for (let i = 0; i < 4; i++) {
            let px = xs[i];
            px = px < 0 ? 0 : px;
            px = px > w - 1 ? w - 1 : px;
            // 该点的值
            let dv = data[py][px];
            // 该点的权重
            let w_x = wx[i];
            let w_y = wy[j];
            // 根据加权加起来
            val += (dv * w_x * w_y);
        }
    }

    return val;
}

let getCubicWeight = function (v) {
    let a = -0.5;

    // 取整
    let nv = Math.floor(v);

    // 坐标差值集合
    let xList = new Array(4);
    // 坐标集合
    let xs = new Array(4);

    // 最近的4个坐标差值
    xList[0] = nv - v - 1;
    xList[1] = nv - v
    xList[2] = nv - v + 1;
    xList[3] = nv - v + 2;
    // 
    xs[0] = nv - 1;
    xs[1] = nv;
    xs[2] = nv + 1;
    xs[3] = nv + 2;

    // 计算权重
    let ws = new Array(4);
    for (let i = 0; i < 4; i++) {
        let val = Math.abs(xList[i]);
        let w = 0;
        // 基于BiCubic基函数的双三次插值
        if (val <= 1) {
            w = (a + 2) * val * val * val - (a + 3) * val * val + 1;
        } else if (val < 2) {
            w = a * val * val * val - 5 * a * val * val + 8 * a * val - 4 * a;
        }
        ws[i] = w;
    }

    return {
        weight: ws,
        coordinate: xs
    };
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
            yAxisData: [],
            min: 0,
            max: 580
        }
    }
    componentDidMount() {
        let { min, max } = this.state;
        let data = this.props.data;
        let yData = [], xData = [], dataMap = [];
        data = data[0].map((col, i) => data.map(row => row[i]));
        xData = Array.from(new Set(data[0].map(item => Number(item))));
        yData = Array.from(new Set(data[1].map(item => Number(item))));
        dataMap = data[2].map(item => Number(item));
        let w = xData.length, h = yData.length, m = Math.round(h / w);
        let newDataMap = [];
        for (let i = 0, len = dataMap.length / w; i < len; i++) {
            newDataMap[i] = [];
            for (let j = 0; j < w; j++) {
                newDataMap[i].push(dataMap[i * w + j])
            }
        }
        newDataMap = scaleData(w * m, h, newDataMap, 2);
        dataMap = [];
        for (let i = 0, len = newDataMap.length; i < len; i++) {
            for (let j = 0; j < newDataMap[0].length; j++) {
                dataMap.push(newDataMap[i][j])
            }
        }
        let newXData = [];
        for (let i = 0, len = xData.length; i < len; i++) {
            for (let j = 0; j < m; j++) {
                newXData.push(xData[i] * m - (m - 1 - j))
            }
        }
        xData = newXData;
        let xMin = getMin(xData), xMax = getMax(xData), yMin = getMin(yData), yMax = getMax(yData);
        let xRange = xMax - xMin, yRange = yMax - yMin;
        let dataSource = [], xAxisData = [], yAxisData = [];
        let chart = document.getElementById("matrix_chart");
        for (let i = 0, len = yData.length; i < len; i++) {
            for (let j = 0, len2 = xData.length; j < len2; j++) {
                dataSource.push({
                    x: (xData[j] - xMin) / xRange * chart.clientWidth,
                    y: ((yData[i] - yMin) / yRange) * chart.clientHeight,
                    value: dataMap[i * w * m + j]
                });
            }
        }
        let a = 0;
        if (xRange / (Math.pow(10, String(xRange).length - 1)) > 3) {
            a = Math.pow(10, String(xRange).length - 1);
        } else {
            a = Math.pow(10, String(xRange).length - 2);
        }
        for (let i = xMin; i <= xMax; i++) {
            if (i % a === 0) {
                xAxisData.push({ value: i, offset: (i - xMin) / xRange * 100 });
            }
        }
        yMax *= 1000;
        yRange = yMax - yMin;
        for (let i = yMin; i <= yMax; i += 10) {
            if (i % 500 === 0) {
                yAxisData.push({ value: i, offset: (i - yMin) / yRange * 100 });
            }
        }
        let legendDataSource = [];
        for (let i = min; i <= max; i += (max - min) / 10) {
            legendDataSource.push(i.toFixed(0))
        }
        this.map = Heatmap.create({
            container: chart,
            radius: 1,
            maxOpacity: 1,
            minOpacity: 1,
            blur: 1,
            backgroundColor: "#0000fa",
            gradient: {
                "0": '#0000fa',
                ".1": '#006eff',
                ".2": '#00cfff',
                ".3": '#00ffb0',
                ".4": '#00ff09',
                ".5": '#9bff00',
                ".6": '#ffd000',
                ".7": '#ff6f00',
                ".8": '#ff0f00',
                ".9": '#ff0077',
                "1": '#fb00fa'
            }
        });
        this.map.setData({
            max,
            min,
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
                <div id="chart-container-3">
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
