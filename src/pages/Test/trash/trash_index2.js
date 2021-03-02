import React, { Component } from 'react';
import { Tree, Input, Radio, Button, message } from "antd";
import * as echarts from 'echarts';
import { interp_multiPoint } from "./utils"
import "./index.css";
//获取最大值
let getMax = arr => {
    //假设最大值max 为arr[0]
    var max = arr[0];
    //遍历对比
    for (var i = 0; i < arr.length; i++) {
        //若max小于当前项 说明不是最大值 将当前项的值赋予max 
        // 继续遍历对比找到最大的值
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
//获取最大值的下标
let getMaxIndex = arr => {
    let max = arr[0];
    //声明了个变量 保存下标值
    let index = 0;
    for (let i = 0; i < arr.length; i++) {
        if (isNaN(max)) {
            max = arr[i];
            index = i;
        } else if (max < arr[i]) {
            max = arr[i];
            index = i;
        }
    }
    return index;
}
//获取最小值的下标
let getMinIndex = arr => {
    var min = arr[0];
    //声明了个变量 保存下标值
    var index = 0;
    for (var i = 0; i < arr.length; i++) {
        if (isNaN(min)) {
            min = arr[i];
            index = i;
        } else if (min > arr[i]) {
            min = arr[i];
            index = i;
        }
    }
    return index;
}
//格式化小数
let formatDecimal = (num, decimal) => {
    num = num.toString()
    let index = num.indexOf('.')
    if (index !== -1) {
        num = num.substring(0, decimal + index + 1)
    } else {
        num = num.substring(0)
    }
    return Number(parseFloat(num).toFixed(decimal))
}

export default class index extends Component {
    state = {
        loaded: false,
        treeData: [
            {
                title: 'pshift_group_0',
                key: '0',
            },
            {
                title: 'pshift_group_1',
                key: '1',
            },
            {
                title: 'pshift_group_2',
                key: '2',
            },
            {
                title: 'pshift_group_3',
                key: '3',
            },
            {
                title: 'pshift_group_4',
                key: '4',
            },
            {
                title: 'pshift_group_5',
                key: '5',
            },
            {
                title: 'pshift_group_6',
                key: '6',
            },
            {
                title: 'pshift_group_7',
                key: '7',
            },
            {
                title: 'pshift_group_8',
                key: '8',
            },
            {
                title: 'pshift_group_9',
                key: '9',
            },
            {
                title: 'pshift_group_10',
                key: '10',
            },
            {
                title: 'pshift_group_11',
                key: '11',
            },
            {
                title: 'pshift_group_12',
                key: '12',
            }
        ],
        fmin: 0.1,
        fmax: 5,
        Tout_min: 0.2,
        dTout: 0.05,
        Tout_max: 2.0,
        dataType: "A2B",
        disper_map_stack_A2B: undefined,
        disper_map_stack_B2A: undefined,
        disper_map_stack_SYM: undefined,
        pshift: undefined,
        fminIndex: undefined,
        fmaxIndex: undefined,
        disp: undefined,
        proc_F: undefined,
        proc_V: undefined,
        vout: undefined,
        fval: undefined,
        white_data: [],
        pink_data: [],
        black_data: [],
        black_xData: [],
        black_yData: [],
        resultV: [],
        resultF: []
    }
    componentDidMount() {
        this.chart1_heatmap = echarts.init(document.getElementById('chart1_heatmap'));
        this.chart1_line = echarts.init(document.getElementById('chart1_line'));
        this.chart2_heatmap = echarts.init(document.getElementById('chart2_heatmap'));
        this.chart2_line = echarts.init(document.getElementById('chart2_line'));
        this.chart3_heatmap = echarts.init(document.getElementById('chart3_heatmap'));
        this.chart3_line = echarts.init(document.getElementById('chart3_line'));
        this.chart4 = echarts.init(document.getElementById('chart4'));
        this.handleClear();
        window.addEventListener("resize", () => {
            this.chart1_heatmap.resize();
            this.chart1_line.resize();
            this.chart2_heatmap.resize();
            this.chart2_line.resize();
            this.chart3_heatmap.resize();
            this.chart3_line.resize();
            this.chart4.resize();
        });
    }
    openFile = e => {
        let file = document.getElementById('file').files[0];
        let reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            this.handleClear();
            let { disper_map_stack_A2B, disper_map_stack_B2A, disper_map_stack_SYM, pshift } = JSON.parse(reader.result);
            this.setState({
                loaded: true,
                disper_map_stack_A2B,
                disper_map_stack_B2A,
                disper_map_stack_SYM,
                pshift,
            });
            this.getDisp(0);
            this.chartRender(this.chart1_heatmap, this.chart1_line, disper_map_stack_A2B);
            this.chartRender(this.chart2_heatmap, this.chart2_line, disper_map_stack_B2A);
            this.chartRender(this.chart3_heatmap, this.chart3_line, disper_map_stack_SYM,
                {
                    xAxis: {
                        name: "Frequency (Hz)",
                        nameLocation: "middle",
                        nameGap: 25
                    },
                });
            this.lineRender();
        };
        e.target.value = "";
    }
    getDisp = (status) => {
        let { dataType, disper_map_stack_A2B, disper_map_stack_B2A, disper_map_stack_SYM, pshift, fmin, fmax, Tout_min, dTout, Tout_max } = this.state;
        let fminArr = [], fmaxArr = [];
        for (let i = 0, len = pshift.f0.length; i < len; i++) {
            fminArr.push(Math.abs(fmin - pshift.f0[i]));
            fmaxArr.push(Math.abs(fmax - pshift.f0[i]));
        }
        let vout = [], resultV = [];
        for (let i = Tout_min; i <= Tout_max; i = Number((i + dTout).toFixed(2))) {
            vout.push(1 / i);
            resultV.push(i)
        }
        let proc_F = [], proc_V = []
        for (let i = 0, len = pshift.f0.length; i < len; i++) {
            proc_F.push(pshift.f0[i]);
            if (i < getMinIndex(fminArr)) {
                proc_F[i] = NaN;
            } else if (i > getMinIndex(fmaxArr)) {
                proc_F[i] = NaN;
            }
        }

        let white_DataSource = [];
        switch (dataType) {
            case "A2B":
                white_DataSource = disper_map_stack_A2B[0].map((col, i) => disper_map_stack_A2B.map(row => row[i]));
                break;
            case "B2A":
                white_DataSource = disper_map_stack_B2A[0].map((col, i) => disper_map_stack_B2A.map(row => row[i]));
                break;
            case "SYM":
                white_DataSource = disper_map_stack_SYM[0].map((col, i) => disper_map_stack_SYM.map(row => row[i]));
                break;
            default:
                break;
        }
        proc_V = white_DataSource.map(arr => getMaxIndex(arr) / arr.length);
        let range_v = getMax(pshift.v) - getMin(pshift.v);
        proc_V = proc_V.map(item => item * range_v + getMin(pshift.v))
        let fval = new Array(vout.length);
        let disp = {
            f: vout,
            v: interp_multiPoint(proc_F, proc_V, proc_F.length, vout, fval, vout.length)
        }

        this.setState({
            disp,
            fminIndex: getMinIndex(fminArr),
            fmaxIndex: getMinIndex(fmaxArr),
            proc_F,
            proc_V,
            vout,
            fval,
            resultV
        }, () => {
            if (status) {
                let pink_data = [], resultF = [];
                for (let i = 0, len = disp.f.length; i < len; i++) {
                    if (disp.f[i] && disp.v[i]) {
                        pink_data.push([disp.f[i], disp.v[i]]);
                        resultF.push(disp.v[i])
                    }
                }
                let black_data = [], black_xData = [], black_yData = [];
                for (let i = 0, len = pink_data.length; i < len; i++) {
                    if (Array.isArray(pink_data[i])) {
                        black_data.push([disp.v[i], disp.v[i] / disp.f[i] / 2]);
                        black_xData.push(disp.v[i]);
                        black_yData.push(disp.v[i] / disp.f[i] / 2);
                    }
                }
                this.setState({ pink_data, resultF, black_data, black_xData, black_yData });
                this.chart1_line.setOption({
                    series: [{
                        id: "b",
                        type: "line",
                        data: pink_data
                    }]
                });
                this.chart2_line.setOption({
                    series: [{
                        id: "b",
                        type: "line",
                        data: pink_data
                    }]
                });
                this.chart3_line.setOption({
                    series: [{
                        id: "b",
                        type: "line",
                        data: pink_data
                    }]
                });
                this.chart4.setOption({
                    xAxis: {
                        max: formatDecimal(Math.max(...black_xData), 1) + 0.1,
                        min: formatDecimal(Math.min(...black_xData), 1)
                    },
                    yAxis: {
                        max: formatDecimal(Math.max(...black_yData), 1) + 0.1,
                        min: formatDecimal(Math.min(...black_yData), 1)
                    },
                    series: [{
                        id: "a",
                        type: "line",
                        data: black_data
                    }]
                });
            }
            if (status === 2) {
                let { xUnit, yUnit, heatmap_xData, heatmap_yData, fminIndex, fmaxIndex } = this.state;
                let white_data = white_DataSource.map((arr, i) => [i * xUnit + getMin(heatmap_xData), getMaxIndex(arr) * yUnit + getMin(heatmap_yData)]);
                for (let i = 0, len = white_data.length; i < len; i++) {
                    if (i < fminIndex) {
                        white_data[i] = NaN;
                    } else if (i > fmaxIndex) {
                        white_data[i] = NaN;
                    }
                }
                this.setState({ white_data });
                this.chart1_line.setOption({
                    series: [{
                        id: "a",
                        type: "line",
                        data: white_data
                    }]
                });
                this.chart2_line.setOption({
                    series: [{
                        id: "a",
                        type: "line",
                        data: white_data
                    }]
                });
                this.chart3_line.setOption({
                    series: [{
                        id: "a",
                        type: "line",
                        data: white_data
                    }]
                });
            }
        });
    }
    chartRender = (heatmap, line, dataSource, heatmap_expandOption) => {
        let { dataType, disper_map_stack_A2B, disper_map_stack_B2A, disper_map_stack_SYM, pshift, fminIndex, fmaxIndex, disp } = this.state;
        let { f0, nf0, v, nv } = pshift;
        /**绘制热力图背景 */
        let heatmap_data = [], heatmap_xData = [], heatmap_yData = [];
        for (let i = 0; i < nf0; i++) {
            for (let j = 0; j < nv; j++) {
                heatmap_data.push([i, j, dataSource[j][i]]);
            }
            heatmap_xData.push(formatDecimal(f0[i], 2));
        }
        for (let j = 0; j < nv; j++) {
            heatmap_yData.push(formatDecimal(v[j], 2));
        }
        let grid = {
            right: 20,
            left: 60,
            top: 20,
            bottom: 40
        }
        let headtmap_option = {
            tooltip: {},
            grid,
            xAxis: {
                type: 'category',
                data: heatmap_xData
            },
            yAxis: {
                type: 'category',
                data: heatmap_yData,
                name: "Phase velocity (km/s)",
                nameLocation: "middle",
                nameGap: 30
            },
            visualMap: {
                type: 'continuous',
                show: false,
                left: 'right',
                top: 'center',
                calculable: true,
                realtime: false,
                splitNumber: 10,
                inRange: {
                    color: ['#00008d', '#102ff0', '#059afa', '#5dff9a', '#fded02', '#ff9109', '#df0300', '#7c0100', '#830100', '#810000']
                },
                min: 0.95,
                max: 1
            },
            series: [{
                type: 'heatmap',
                data: heatmap_data,
                progressive: 5000,
                animation: false
            }]
        };
        heatmap.setOption(headtmap_option);
        if (heatmap_expandOption) {
            heatmap.setOption(heatmap_expandOption);
        }


        /**绘制线 */
        let white_DataSource = [];
        //转换数组行列，方便找列的最大值
        switch (dataType) {
            case "A2B":
                white_DataSource = disper_map_stack_A2B[0].map((col, i) => disper_map_stack_A2B.map(row => row[i]));
                break;
            case "B2A":
                white_DataSource = disper_map_stack_B2A[0].map((col, i) => disper_map_stack_B2A.map(row => row[i]));
                break;
            case "SYM":
                white_DataSource = disper_map_stack_SYM[0].map((col, i) => disper_map_stack_SYM.map(row => row[i]));
                break;
            default:
                break;
        }
        let xUnit = (getMax(heatmap_xData) - getMin(heatmap_xData)) / (nf0 - 1);
        let yUnit = (getMax(heatmap_yData) - getMin(heatmap_yData)) / (nv - 1);
        let white_data = white_DataSource.map((arr, i) => [i * xUnit + getMin(heatmap_xData), getMaxIndex(arr) * yUnit + getMin(heatmap_yData)]);
        for (let i = 0, len = white_data.length; i < len; i++) {
            if (i < fminIndex) {
                white_data[i] = NaN;
            } else if (i > fmaxIndex) {
                white_data[i] = NaN;
            }
        }
        let pink_data = [], resultF = [];
        for (let i = 0, len = disp.f.length; i < len; i++) {
            if (disp.f[i] && disp.v[i]) {
                pink_data.push([disp.f[i], disp.v[i]]);
                resultF.push(disp.v[i]);
            }
        }
        this.setState({ white_data, pink_data, xUnit, yUnit, heatmap_xData, heatmap_yData, resultF });
        let line_option = {
            grid,
            xAxis: {
                type: 'value',
                show: false,
                max: getMax(heatmap_xData),
                min: getMin(heatmap_xData)
            },
            yAxis: {
                type: 'value',
                show: false,
                max: getMax(heatmap_yData),
                min: getMin(heatmap_yData)
            },
            series: [
                {
                    id: "a",
                    type: 'line',
                    symbol: 'circle',
                    smooth: true,
                    symbolSize: 5,
                    data: white_data,
                    itemStyle: {
                        color: "#fff"
                    },
                    hoverAnimation: false,
                    cursor: "default"
                },
                {
                    id: "b",
                    type: 'line',
                    symbol: 'circle',
                    smooth: true,
                    symbolSize: 8,
                    data: pink_data,
                    itemStyle: {
                        color: "#ff00ff"
                    },
                    hoverAnimation: false,
                }
            ]
        };
        line.setOption(line_option);
        line.getZr().on(
            'mousemove', params => {
                if (params.event.button === 0 && params.event.buttons === 1) {
                    let { offsetWidth, offsetHeight } = params.event.target;
                    let currentPosition = {
                        x: (params.offsetX - grid.left) / (offsetWidth - grid.left - grid.right) * (getMax(heatmap_xData) - getMin(heatmap_xData)) + getMin(heatmap_xData),
                        y: (offsetHeight - grid.bottom - params.offsetY) / (offsetHeight - grid.top - grid.bottom) * (getMax(heatmap_yData) - getMin(heatmap_yData)) + getMin(heatmap_yData),
                    }
                    let { white_data, white_data_copy } = this.state;
                    let distenceArr = white_data.map((position, i) => Math.abs(currentPosition.x - position[0]));
                    if (Array.isArray(white_data[getMinIndex(distenceArr)])) {
                        white_data[getMinIndex(distenceArr)][1] = currentPosition.y;
                        if (white_data_copy) white_data_copy[getMinIndex(distenceArr)][1] = currentPosition.y;
                    }
                    let { proc_F, vout, disp } = this.state;
                    let proc_V = white_data_copy ? white_data_copy.map(arr => Array.isArray(arr) ? arr[1] : NaN) : white_data.map(arr => arr[1] ? arr[1] : NaN);
                    disp.v = interp_multiPoint(proc_F, proc_V, proc_F.length, vout, new Array(vout.length), vout.length)
                    let pink_data = [], resultF = [];
                    for (let i = 0, len = disp.f.length; i < len; i++) {
                        if (disp.f[i] && disp.v[i]) {
                            pink_data.push([disp.f[i], disp.v[i]]);
                            resultF.push(disp.v[i])
                        } else {
                            pink_data.push(NaN);
                            resultF.push(NaN)
                        }
                    }
                    this.chart1_line.setOption({
                        series: [{
                            id: "a",
                            type: "line",
                            data: white_data,
                        }, {
                            id: "b",
                            type: "line",
                            data: pink_data
                        }]
                    });
                    this.chart2_line.setOption({
                        series: [{
                            id: "a",
                            type: "line",
                            data: white_data,
                        }, {
                            id: "b",
                            type: "line",
                            data: pink_data
                        }]
                    });
                    this.chart3_line.setOption({
                        series: [{
                            id: "a",
                            type: "line",
                            data: white_data,
                        }, {
                            id: "b",
                            type: "line",
                            data: pink_data
                        }]
                    });

                    let black_data = [], black_xData = [], black_yData = [];
                    for (let i = 0, len = pink_data.length; i < len; i++) {
                        if (Array.isArray(pink_data[i])) {
                            black_data.push([disp.v[i], disp.v[i] / disp.f[i] / 2]);
                            black_xData.push(disp.v[i]);
                            black_yData.push(disp.v[i] / disp.f[i] / 2);
                        }
                    }
                    this.chart4.setOption({
                        xAxis: {
                            max: formatDecimal(Math.max(...black_xData), 1) + 0.1,
                            min: formatDecimal(Math.min(...black_xData), 1)
                        },
                        yAxis: {
                            max: formatDecimal(Math.max(...black_yData), 1) + 0.1,
                            min: formatDecimal(Math.min(...black_yData), 1)
                        },
                        series: {
                            data: black_data
                        }
                    })
                    this.setState({ white_data, disp, pink_data, black_data, black_xData, black_yData, resultF });
                }
            }
        )
        let _this = this;
        line.on(
            'click', function (params) {
                let { event, dataIndex, seriesId } = params;
                if (seriesId === "b" && event.event.button === 0) {
                    let { pink_data, black_data, white_data } = _this.state;
                    let white_data_copy = _this.state.white_data_copy ? _this.state.white_data_copy : JSON.parse(JSON.stringify(white_data));
                    if (event.event.shiftKey || event.event.ctrlKey) {
                        if (event.event.shiftKey) {
                            for (let i = 0; i < dataIndex; i++) {
                                black_data[i] = NaN;
                            }
                            let rightIndex;
                            for (let i = 0, len = f0.length; i < len; i++) {
                                if (f0[i] >= pink_data[dataIndex][0]) {
                                    rightIndex = i;
                                    break;
                                }
                            }
                            _this.setState({ rightIndex });
                            for (let i = 0, len = white_data.length; i < len; i++) {
                                if (i > rightIndex) {
                                    white_data[i] = NaN;
                                }
                                if (i > rightIndex + 3) {
                                    white_data_copy[i] = NaN;
                                }
                            }
                        } else if (event.event.ctrlKey) {
                            for (let i = dataIndex + 1, len = pink_data.length; i < len; i++) {
                                black_data[i] = NaN;
                            }
                            let leftIndex;
                            for (let i = f0.length; i > 0; i--) {
                                if (f0[i] <= pink_data[dataIndex][0]) {
                                    leftIndex = i;
                                    break;
                                }
                            }
                            _this.setState({ leftIndex });
                            for (let i = 0, len = white_data.length; i < len; i++) {
                                if (i < leftIndex) {
                                    white_data[i] = NaN;
                                }
                                if (i < leftIndex - 2) {
                                    white_data_copy[i] = NaN;
                                }
                            }
                        }
                        let { proc_F, vout, disp } = _this.state;
                        console.log(white_data_copy);
                        let proc_V = white_data_copy.map(arr => Array.isArray(arr) ? arr[1] : NaN);
                        disp.v = interp_multiPoint(proc_F, proc_V, proc_F.length, vout, new Array(vout.length), vout.length)
                        let pink_data_new = [], resultF = [];
                        for (let i = 0, len = disp.f.length; i < len; i++) {
                            if (disp.f[i] && disp.v[i]) {
                                pink_data_new.push([disp.f[i], disp.v[i]]);
                                resultF.push(disp.v[i])
                            } else {
                                pink_data_new.push(NaN);
                                resultF.push(NaN)
                            }
                        }
                        _this.chart1_line.setOption({
                            series: [
                                {
                                    id: "a",
                                    data: white_data
                                },
                                {
                                    id: 'b',
                                    data: pink_data_new
                                }]
                        })
                        _this.chart2_line.setOption({
                            series: [
                                {
                                    id: "a",
                                    data: white_data
                                },
                                {
                                    id: 'b',
                                    data: pink_data_new
                                }]
                        })
                        _this.chart3_line.setOption({
                            series: [
                                {
                                    id: "a",
                                    data: white_data
                                },
                                {
                                    id: 'b',
                                    data: pink_data_new
                                }]
                        })
                        _this.chart4.setOption({
                            series: [{
                                id: 'a',
                                data: black_data
                            }]
                        });

                        // this.updateDragableCircle(this.chart_3);
                        // this.updateDragableCircle(this.chart_6);
                        // this.updateDragableCircle(this.chart_9);
                        _this.setState({ pink_data, black_data, white_data, resultF, white_data_copy });
                    }
                }
            }
        )
    }
    lineRender = () => {
        let { pink_data, disp } = this.state;
        let black_data = [], black_xData = [], black_yData = [];
        for (let i = 0, len = pink_data.length; i < len; i++) {
            if (Array.isArray(pink_data[i])) {
                black_data.push([disp.v[i], disp.v[i] / disp.f[i] / 2]);
                black_xData.push(disp.v[i]);
                black_yData.push(disp.v[i] / disp.f[i] / 2);
            }
        }
        this.setState({ black_data, black_xData, black_yData });
        let black_option = {
            tooltip: {},
            grid: {
                right: 20,
                left: 60,
                top: 20,
                bottom: 40
            },
            xAxis: {
                type: 'value',
                name: "Phase velocity (km/s)",
                nameLocation: "middle",
                nameGap: 25,
                data: black_xData,
                show: true,
                max: formatDecimal(Math.max(...black_xData), 1) + 0.1,
                min: formatDecimal(Math.min(...black_xData), 1)
            },
            yAxis: {
                type: 'value',
                name: "wavelength/2 (km)",
                nameLocation: "middle",
                nameGap: 25,
                data: black_yData,
                inverse: true,
                show: true,
                max: formatDecimal(Math.max(...black_yData), 1) + 0.1,
                min: formatDecimal(Math.min(...black_yData), 1)
            },
            series: [
                {
                    id: "a",
                    type: 'line',
                    symbol: 'circle',
                    smooth: true,
                    symbolSize: 2,
                    data: black_data,
                    itemStyle: {
                        color: "#000"
                    }
                }
            ]
        };
        this.chart4.setOption(black_option);
    }
    handleSelect = (selectedKeys, info) => {
        console.log(info.node.props.title);
    }
    handleChangeInput = (key, e) => {
        this.setState({ [key]: Number(e.target.value) });
    }
    handleChangeData = e => {
        let { loaded } = this.state;
        this.setState({
            dataType: e.target.value
        }, () => {
            if (loaded) {
                let { disper_map_stack_A2B, disper_map_stack_B2A, disper_map_stack_SYM, fminIndex, fmaxIndex, leftIndex, rightIndex, xUnit, yUnit, heatmap_xData, heatmap_yData } = this.state;
                let white_dataSource = [];
                switch (e.target.value) {
                    case "A2B":
                        white_dataSource = disper_map_stack_A2B[0].map((col, i) => disper_map_stack_A2B.map(row => row[i]));
                        break;
                    case "B2A":
                        white_dataSource = disper_map_stack_B2A[0].map((col, i) => disper_map_stack_B2A.map(row => row[i]));
                        break;
                    case "SYM":
                        white_dataSource = disper_map_stack_SYM[0].map((col, i) => disper_map_stack_SYM.map(row => row[i]));
                        break;
                    default:
                        break;
                }

                let white_data = white_dataSource.map((arr, i) => [i * xUnit + getMin(heatmap_xData), getMaxIndex(arr) * yUnit + getMin(heatmap_yData)]);
                for (let i = 0, len = white_data.length; i < len; i++) {
                    if (i < fminIndex) {
                        white_data[i] = NaN;
                    } else if (i > fmaxIndex) {
                        white_data[i] = NaN;
                    }
                }
                for (let i = 0, len = white_data.length; i < len; i++) {
                    if (i > rightIndex) {
                        white_data[i] = NaN;
                    }
                }
                for (let i = 0, len = white_data.length; i < len; i++) {
                    if (i < leftIndex) {
                        white_data[i] = NaN;
                    }
                }
                this.getDisp(1);
                this.setState({ white_data });
                this.chart1_line.setOption({
                    series: [{
                        id: "a",
                        type: "line",
                        data: white_data,
                    }]
                });
                this.chart2_line.setOption({
                    series: [{
                        id: "a",
                        type: "line",
                        data: white_data,
                    }]
                });
                this.chart3_line.setOption({
                    series: [{
                        id: "a",
                        type: "line",
                        data: white_data,
                    }]
                });
            }
        });
    }
    handleCalculate = () => {
        this.getDisp(2);
    }
    handleClear = () => {
        let clearHeatmap = (chart) => {
            chart.clear();
            chart.setOption({
                grid: {
                    right: 20,
                    left: 60,
                    top: 20,
                    bottom: 40,
                },
                xAxis: {
                    type: 'value',
                    name: "",
                    splitNumber: 10,
                    min: 0,
                    max: 1
                },
                yAxis: {
                    type: 'value',
                    name: "",
                    splitNumber: 10,
                    min: 0,
                    max: 1,
                    inverse: false
                },
                series: {
                    id: "a",
                    type: 'line',
                    data: []
                }
            })
        }
        let clearLine = (chart) => {
            chart.clear();
            chart.setOption({
                grid: {
                    right: 20,
                    left: 60,
                    top: 20,
                    bottom: 40
                },
                xAxis: {
                    name: "",
                    show: false
                },
                yAxis: {
                    name: "",
                    show: false
                },
                series: {
                    id: "a",
                    type: 'line',
                    data: []
                }
            })
        }
        this.setState({
            loaded: false,
            white_data: [],
            leftIndex: undefined,
            rightIndex: undefined,
            pink_data: [],
            black_data: [],
            black_xData: [],
            black_yData: [],
        }, () => {
            clearHeatmap(this.chart1_heatmap);
            clearLine(this.chart1_line);
            clearHeatmap(this.chart2_heatmap);
            clearLine(this.chart2_line);
            clearHeatmap(this.chart3_heatmap);
            clearLine(this.chart3_line);
            clearHeatmap(this.chart4);
        });
    }
    handleSave = () => {
        let { resultV, resultF, treeData } = this.state
        resultF = resultF.map(item => item.toFixed(4))
        var elementA = document.createElement('a');
        elementA.download = treeData[0].title + ".disper";//文件名
        //隐藏dom点不显示
        elementA.style.display = 'none';
        var blob = new Blob([`${resultV}\r\n${resultF}`]);//二进制
        elementA.href = URL.createObjectURL(blob);
        document.body.appendChild(elementA);
        elementA.click();
        document.body.removeChild(elementA);
    }
    render() {
        const { treeData, fmin, fmax, Tout_min, dTout, Tout_max, dataType } = this.state;
        return (
            <div id="main" style={{ width: "100vw", height: "100vh", padding: 16, fontSize: 14 }}>
                <div style={{ height: "100%", display: "flex", alignItems: "flex-start" }}>
                    <div className="param-panel" style={{ width: 310, height: "100%" }} >
                        <input id="file" type="file" onChange={this.openFile} accept=".json" />
                        <Tree treeData={treeData} onSelect={this.handleSelect} blockNode={true} checkable={false} />
                        <div className="box">
                            <div className="box-title">Analysis Parameters</div>
                            <div className="box-content">
                                <div className="column">
                                    <div className="row">
                                        <label>fmin</label><Input defaultValue={fmin} onChange={this.handleChangeInput.bind(this, "fmin")} />
                                    </div>
                                    <div className="row">
                                        <label>fmax</label><Input defaultValue={fmax} onChange={this.handleChangeInput.bind(this, "fmax")} />
                                    </div>
                                </div>
                                <div className="column">
                                    <div className="row">
                                        <label>Tout_min</label><Input defaultValue={Tout_min} onChange={this.handleChangeInput.bind(this, "Tout_min")} />
                                    </div>
                                    <div className="row">
                                        <label>dTout</label><Input defaultValue={dTout} onChange={this.handleChangeInput.bind(this, "dTout")} />
                                    </div>
                                    <div className="row">
                                        <label>Tout_max</label><Input defaultValue={Tout_max} onChange={this.handleChangeInput.bind(this, "Tout_max")} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="box">
                            <div className="box-title">Select a method</div>
                            <div className="box-content">
                                <div className="column">
                                    <Radio.Group onChange={this.handleChangeData} defaultValue={dataType}>
                                        <Radio value={"A2B"}>A-&gt;B</Radio>
                                        <br />
                                        <Radio value={"B2A"}>B-&gt;A</Radio>
                                        <br />
                                        <Radio value={"SYM"}>SYM</Radio>
                                    </Radio.Group>
                                </div>
                                <div className="column">
                                    <Button onClick={this.handleCalculate}>Calculate</Button>
                                </div>
                            </div>
                        </div>
                        <div className="box">
                            <div className="box-title">Dispersion</div>
                            <div className="box-content" style={{ display: "flex", justifyContent: "space-around" }}>
                                <Button style={{ width: "33%", height: 42 }} onClick={this.handleClear}>Clear</Button>
                                <Button style={{ width: "33%", height: 42 }} onClick={this.handleSave}>Save</Button>
                            </div>
                        </div>
                    </div>
                    <div style={{ position: "relative", height: "100%", width: "calc((100% - 310px) / 3 * 2)" }}>
                        <div className="chart-container" style={{ top: 0 }}>
                            <div id="chart1_heatmap" className="chart" />
                            <div id="chart1_line" className="chart" />
                        </div>
                        <div className="chart-container">
                            <div id="chart2_heatmap" className="chart" />
                            <div id="chart2_line" className="chart" />
                        </div>
                        <div className="chart-container">
                            <div id="chart3_heatmap" className="chart" />
                            <div id="chart3_line" className="chart" />
                        </div>
                    </div>
                    <div id="chart4" style={{ width: "calc((100% - 310px) / 3)", height: "100%" }} />
                </div>
            </div>
        )
    }
} 