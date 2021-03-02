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
        if (max < arr[i]) {
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
        if (min > arr[i]) {
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
        whiteLineData: [],
        leftIndex: undefined,
        rightIndex: undefined,
        pinkLineData: [],
        blackLineData: [],
        blackLineXData: [],
        blackLineYData: [],
        disper_map_stack_A2B: undefined,
        disper_map_stack_B2A: undefined,
        disper_map_stack_SYM: undefined,
        f0: undefined,
        v: undefined,
        nf0: undefined,
        nv: undefined,
        pshift: undefined,
        disp: undefined,
        fminIndex: undefined,
        fmaxIndex: undefined,
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
        smooth: 5,
        fmin: 0.1,
        fmax: 5,
        Tout_min: 0.2,
        dTout: 0.05,
        Tout_max: 2.0,
        mode: "Extract",
        dataType: "A2B"
    }
    componentDidMount() {
        this.chart_1 = echarts.init(document.getElementById('chart1'));
        this.chart_2 = echarts.init(document.getElementById('chart2'));
        this.chart_3 = echarts.init(document.getElementById('chart3'));
        this.chart_4 = echarts.init(document.getElementById('chart4'));
        this.chart_5 = echarts.init(document.getElementById('chart5'));
        this.chart_6 = echarts.init(document.getElementById('chart6'));
        this.chart_7 = echarts.init(document.getElementById('chart7'));
        this.chart_8 = echarts.init(document.getElementById('chart8'));
        this.chart_9 = echarts.init(document.getElementById('chart9'));
        this.chart_10 = echarts.init(document.getElementById('chart10'));
        this.handleClear();
        window.addEventListener("resize", () => {
            this.chart_1.resize();
            this.chart_2.resize();
            this.chart_3.resize();
            this.chart_4.resize();
            this.chart_5.resize();
            this.chart_6.resize();
            this.chart_7.resize();
            this.chart_8.resize();
            this.chart_9.resize();
            this.chart_10.resize();
            this.updateDragableCircle(this.chart_3);
            this.updateDragableCircle(this.chart_6);
            this.updateDragableCircle(this.chart_9);
        });
    }
    updateDragableCircle = (line) => {
        line.setOption({
            graphic: this.state.pinkLineData.map(function (item, dataIndex) {
                if (Array.isArray(item)) {
                    return {
                        position: line.convertToPixel('grid', item),
                    };
                } else {
                    return {
                        ignore: true
                    }
                }
            })
        });
    }
    heatmapRender = (chart, line1, line2, dataSource, chartOption) => {
        let { f0, v, nf0, nv, fminIndex, fmaxIndex, dataType, disper_map_stack_A2B, disper_map_stack_B2A, disper_map_stack_SYM, disp } = this.state;
        let data = [], xData = [], yData = [];
        let dataSource_copy = dataSource[0].map((col, i) => dataSource.map(row => row[i]));
        for (let i = 0; i < nf0; i++) {
            for (let j = 0; j < nv; j++) {
                data.push([i, j, dataSource[j][i]]);
            }
            xData.push(formatDecimal(f0[i], 2));
        }
        for (let j = 0; j < nv; j++) {
            yData.push(formatDecimal(v[j], 2));
        }
        let option = {
            tooltip: {},
            grid: {
                right: 20,
                left: 60,
                top: 20,
                bottom: 40
            },
            xAxis: {
                type: 'category',
                data: xData
            },
            yAxis: {
                type: 'category',
                data: yData,
                name: "Phase velocity (km/s)",
                nameLocation: "middle",
                nameGap: 30
            },
            visualMap: {
                type: 'continuous',
                show: false,
                min: getMin(dataSource_copy.map((arr, i) => getMin(arr))),
                max: getMax(dataSource_copy.map((arr, i) => getMax(arr))),
                left: 'right',
                top: 'center',
                calculable: true,
                realtime: false,
                splitNumber: 10,
                inRange: {
                    color: ['#00008d', '#102ff0', '#059afa', '#5dff9a', '#fded02', '#ff9109', '#df0300', '#7c0100', '#830100', '#810000']
                },
            },
            series: [{
                type: 'heatmap',
                data: data,
                progressive: 5000,
                animation: false
            }]
        };
        let pinkLineData = [];
        for (let i = 0, len = disp.f.length; i < len; i++) {
            if (disp.f[i] && disp.v[i]) {
                pinkLineData.push([disp.f[i], disp.v[i]]);
            }
        }
        this.setState({ pinkLineData });
        let pinkLineOption = {
            tooltip: {
                triggerOn: 'none',
                formatter: function (params) {
                    return 'f: ' + params.data[0] + '<br>v: ' + params.data[1];
                }
            },
            grid: {
                right: 20,
                left: 60,
                top: 20,
                bottom: 40
            },
            xAxis: {
                type: 'value',
                data: xData,
                show: false,
                max: Math.max(...xData),
                min: Math.min(...xData)
            },
            yAxis: {
                type: 'value',
                data: yData,
                show: false,
                max: Math.max(...yData),
                min: Math.min(...yData)
            },
            series: [
                {
                    id: "a",
                    type: 'line',
                    symbol: 'circle',
                    smooth: true,
                    symbolSize: 8,
                    data: this.state.pinkLineData,
                    itemStyle: {
                        color: "#ff00ff"
                    }
                }
            ]
        };
        chart.setOption(option);
        if (chartOption) chart.setOption(chartOption);
        let whiteLineDataSource = [];
        switch (dataType) {
            case "A2B":
                whiteLineDataSource = disper_map_stack_A2B[0].map((col, i) => disper_map_stack_A2B.map(row => row[i]));
                break;
            case "B2A":
                whiteLineDataSource = disper_map_stack_B2A[0].map((col, i) => disper_map_stack_B2A.map(row => row[i]));
                break;
            case "SYM":
                whiteLineDataSource = disper_map_stack_SYM[0].map((col, i) => disper_map_stack_SYM.map(row => row[i]));
                break;
            default:
                break;
        }
        let whiteLineData = whiteLineDataSource.map((arr, i) => [i, getMaxIndex(arr)]);
        for (let i = 0, len = whiteLineData.length; i < len; i++) {
            if (i < fminIndex) {
                whiteLineData[i] = NaN;
            } else if (i > fmaxIndex) {
                whiteLineData[i] = NaN;
            }
        }
        this.setState({ whiteLineData });
        let whiteLineOption = {
            tooltip: {},
            grid: {
                right: 20,
                left: 60,
                top: 20,
                bottom: 40
            },
            xAxis: {
                type: 'value',
                show: false,
                max: 98,
                min: 0
            },
            yAxis: {
                type: 'value',
                show: false,
                max: 300,
                min: 0
            },
            series: [
                {
                    id: "a",
                    type: 'line',
                    symbol: 'circle',
                    smooth: true,
                    symbolSize: 5,
                    data: whiteLineData,
                    itemStyle: {
                        color: "#fff"
                    }
                }
            ]
        };
        line1.setOption(whiteLineOption);
        line2.setOption(pinkLineOption);
        let showTooltip = dataIndex => {
            line2.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: dataIndex
            });
        }
        let hideTooltip = dataIndex => {
            line2.dispatchAction({
                type: 'hideTip'
            });
        }
        let onPointDragging = (dataIndex, pos) => {
            let { pinkLineData, blackLineData, blackLineXData, blackLineYData } = this.state;
            pinkLineData[dataIndex][1] = line2.convertFromPixel('grid', pos)[1];
            blackLineData[dataIndex][0] = line2.convertFromPixel('grid', pos)[1];
            blackLineData[dataIndex][1] = line2.convertFromPixel('grid', pos)[1] / pinkLineData[dataIndex][0] / 2;
            blackLineXData[dataIndex] = line2.convertFromPixel('grid', pos)[1]
            blackLineYData[dataIndex] = line2.convertFromPixel('grid', pos)[1] / pinkLineData[dataIndex][0] / 2;
            this.chart_3.setOption({
                series: [{
                    id: 'a',
                    data: pinkLineData
                }]
            });
            this.chart_6.setOption({
                series: [{
                    id: 'a',
                    data: pinkLineData
                }]
            });
            this.chart_9.setOption({
                series: [{
                    id: 'a',
                    data: pinkLineData
                }]
            });
            switch (line2._dom.id) {
                case "chart3":
                    this.updateDragableCircle(this.chart_6);
                    this.updateDragableCircle(this.chart_9);
                    break;
                case "chart6":
                    this.updateDragableCircle(this.chart_3);
                    this.updateDragableCircle(this.chart_9);
                    break;
                case "chart9":
                    this.updateDragableCircle(this.chart_3);
                    this.updateDragableCircle(this.chart_6);
                    break;
                default:
                    break;
            }
            this.chart_10.setOption({
                xAxis: {
                    data: blackLineXData,
                    max: formatDecimal(Math.max(...blackLineXData), 1) + 0.1,
                    min: formatDecimal(Math.min(...blackLineXData), 1)
                },
                yAxis: {
                    data: blackLineYData,
                    max: formatDecimal(Math.max(...blackLineYData), 1) + 0.1,
                    min: formatDecimal(Math.min(...blackLineYData), 1)
                },
                series: [{
                    id: 'a',
                    data: blackLineData
                }]
            });
            this.setState({ pinkLineData, blackLineData, blackLineXData, blackLineYData });
        }
        let handleClickPoint = (e, dataIndex) => {
            if (e.event.button === 0) {
                let { pinkLineData, blackLineData, whiteLineData } = this.state;
                if (e.event.shiftKey) {
                    for (let i = 0; i < dataIndex; i++) {
                        pinkLineData[i] = NaN;
                        blackLineData[i] = NaN;
                    }
                    let rightIndex;
                    for (let i = 0, len = f0.length; i < len; i++) {
                        if (f0[i] > pinkLineData[dataIndex][0]) {
                            rightIndex = i;
                            break;
                        }
                    }
                    this.setState({ rightIndex });
                    for (let i = 0, len = whiteLineData.length; i < len; i++) {
                        if (i >= rightIndex) {
                            whiteLineData[i] = NaN;
                        }
                    }
                    this.chart_2.setOption({ series: { data: whiteLineData } });
                    this.chart_5.setOption({ series: { data: whiteLineData } });
                    this.chart_8.setOption({ series: { data: whiteLineData } });
                } else if (e.event.ctrlKey) {
                    for (let i = dataIndex + 1, len = pinkLineData.length; i < len; i++) {
                        pinkLineData[i] = NaN;
                        blackLineData[i] = NaN;
                    }
                    let leftIndex;
                    for (let i = f0.length; i > 0; i--) {
                        if (f0[i] < pinkLineData[dataIndex][0]) {
                            leftIndex = i;
                            break;
                        }
                    }
                    this.setState({ leftIndex });
                    for (let i = 0, len = whiteLineData.length; i < len; i++) {
                        if (i <= leftIndex) {
                            whiteLineData[i] = NaN;
                        }
                    }
                    this.chart_2.setOption({ series: { data: whiteLineData } });
                    this.chart_5.setOption({ series: { data: whiteLineData } });
                    this.chart_8.setOption({ series: { data: whiteLineData } });
                }
                this.chart_3.setOption({
                    series: [{
                        id: 'a',
                        data: pinkLineData
                    }]
                })
                this.chart_6.setOption({
                    series: [{
                        id: 'a',
                        data: pinkLineData
                    }]
                })
                this.chart_9.setOption({
                    series: [{
                        id: 'a',
                        data: pinkLineData
                    }]
                })
                this.chart_10.setOption({
                    series: [{
                        id: 'a',
                        data: blackLineData
                    }]
                });
                this.updateDragableCircle(this.chart_3);
                this.updateDragableCircle(this.chart_6);
                this.updateDragableCircle(this.chart_9);
                this.setState({ pinkLineData, blackLineData, whiteLineData });
            }
        }
        setTimeout(() => {
            let positionX = undefined;
            line2.setOption({
                graphic: pinkLineData.map(function (item, dataIndex) {
                    return {
                        type: 'circle',
                        position: line2.convertToPixel('grid', item),
                        shape: {
                            cx: 0,
                            cy: 0,
                            r: 4
                        },
                        invisible: true,
                        draggable: true,
                        ondrag: function (dx, dy) {
                            onPointDragging(dataIndex, this.position);
                        },
                        onmousemove: function () {
                            showTooltip(dataIndex);
                        },
                        onmouseout: function () {
                            hideTooltip(dataIndex);
                        },
                        onclick: function (e) {
                            handleClickPoint(e, dataIndex);
                        },
                        ondragstart: function () {
                            positionX = this.position[0];
                        },
                        ondragend: function () {
                            this.invTransform[4] = 0 - positionX;
                            this.transform[4] = positionX;
                            this.position[0] = positionX;
                        },
                        z: 100
                    };
                })
            });
        }, 0);
    }
    lineRender = chart => {
        let { pinkLineData, blackLineData, blackLineXData, blackLineYData, disp } = this.state;
        for (let i = 0, len = pinkLineData.length; i < len; i++) {
            if (Array.isArray(pinkLineData[i])) {
                blackLineData.push([disp.v[i], disp.v[i] / disp.f[i] / 2]);
                blackLineXData.push(disp.v[i]);
                blackLineYData.push(disp.v[i] / disp.f[i] / 2);
            }
        }
        this.setState({ blackLineData, blackLineXData, blackLineYData });
        let blackLineOption = {
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
                data: blackLineXData,
                show: true,
                max: formatDecimal(Math.max(...blackLineXData), 1) + 0.1,
                min: formatDecimal(Math.min(...blackLineXData), 1)
            },
            yAxis: {
                type: 'value',
                name: "wavelength/2 (km)",
                nameLocation: "middle",
                nameGap: 25,
                data: blackLineYData,
                inverse: true,
                show: true,
                max: formatDecimal(Math.max(...blackLineYData), 1) + 0.1,
                min: formatDecimal(Math.min(...blackLineYData), 1)
            },
            series: [
                {
                    id: "a",
                    type: 'line',
                    symbol: 'circle',
                    smooth: true,
                    symbolSize: 2,
                    data: blackLineData,
                    itemStyle: {
                        color: "#000"
                    }
                }
            ]
        };
        chart.setOption(blackLineOption);
    }
    getDisp = (firstRender) => {
        let { dataType, disper_map_stack_A2B, disper_map_stack_B2A, disper_map_stack_SYM, pshift, fmin, fmax } = this.state;
        let fminArr = [], fmaxArr = [];
        for (let i = 0, len = pshift.f0.length; i < len; i++) {
            fminArr.push(Math.abs(fmin - pshift.f0[i]));
            fmaxArr.push(Math.abs(fmax - pshift.f0[i]));
        }

        let { Tout_min, dTout, Tout_max } = this.state;
        let vout = [];
        for (let i = Tout_min; i <= Tout_max; i = Number((i + dTout).toFixed(2))) {
            vout.push(1 / i);
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

        let whiteLineDataSource = [];
        switch (dataType) {
            case "A2B":
                whiteLineDataSource = disper_map_stack_A2B[0].map((col, i) => disper_map_stack_A2B.map(row => row[i]));
                break;
            case "B2A":
                whiteLineDataSource = disper_map_stack_B2A[0].map((col, i) => disper_map_stack_B2A.map(row => row[i]));
                break;
            case "SYM":
                whiteLineDataSource = disper_map_stack_SYM[0].map((col, i) => disper_map_stack_SYM.map(row => row[i]));
                break;
            default:
                break;
        }
        proc_V = whiteLineDataSource.map(arr => getMaxIndex(arr) / arr.length);
        let range = getMax(pshift.v) - getMin(pshift.v);
        proc_V = proc_V.map(item => item * range + getMin(pshift.v))
        let fval = new Array(vout.length);
        let disp = {
            f: vout,
            v: interp_multiPoint(proc_F, proc_V, proc_F.length, vout, fval, vout.length)
        }
        let pinkLineData = [];
        for (let i = 0, len = disp.f.length; i < len; i++) {
            if (disp.f[i] && disp.v[i]) {
                pinkLineData.push([disp.f[i], disp.v[i]]);
            }
        }
        this.chart_3.setOption({ series: { data: pinkLineData } });
        this.chart_6.setOption({ series: { data: pinkLineData } });
        this.chart_9.setOption({ series: { data: pinkLineData } });

        this.setState({
            disp,
            fminIndex: getMinIndex(fminArr),
            fmaxIndex: getMinIndex(fmaxArr),
            pinkLineData
        }, () => {
            if (!firstRender) {
                this.updateDragableCircle(this.chart_3);
                this.updateDragableCircle(this.chart_6);
                this.updateDragableCircle(this.chart_9);
                let blackLineData = [], blackLineXData = [], blackLineYData = [];
                for (let i = 0, len = pinkLineData.length; i < len; i++) {
                    if (Array.isArray(pinkLineData[i])) {
                        blackLineData.push([disp.v[i], disp.v[i] / disp.f[i] / 2]);
                        blackLineXData.push(disp.v[i]);
                        blackLineYData.push(disp.v[i] / disp.f[i] / 2);
                    }
                }
                this.chart_10.setOption({
                    xAxis: {
                        data: blackLineXData,
                        max: formatDecimal(Math.max(...blackLineXData), 1) + 0.1,
                        min: formatDecimal(Math.min(...blackLineXData), 1)
                    },
                    yAxis: {
                        data: blackLineYData,
                        max: formatDecimal(Math.max(...blackLineYData), 1) + 0.1,
                        min: formatDecimal(Math.min(...blackLineYData), 1)
                    },
                    series: {
                        type: 'line',
                        id: "a",
                        data: blackLineData
                    }
                });
                this.setState({
                    blackLineData,
                    blackLineXData,
                    blackLineYData
                })
            }
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
                f0: pshift.f0,
                v: pshift.v,
                nf0: pshift.f0.length,
                nv: pshift.v.length,
            });
            this.getDisp(true);
            this.heatmapRender(this.chart_1, this.chart_2, this.chart_3, disper_map_stack_A2B);
            this.heatmapRender(this.chart_4, this.chart_5, this.chart_6, disper_map_stack_B2A);
            this.heatmapRender(this.chart_7, this.chart_8, this.chart_9, disper_map_stack_SYM,
                {
                    xAxis: {
                        name: "Frequency (Hz)",
                        nameLocation: "middle",
                        nameGap: 25
                    },
                });
            this.lineRender(this.chart_10);
        };
        e.target.value = "";
    }
    handleSelect = (selectedKeys, info) => {
        console.log(info.node.props.title);
    }
    handleChangeInput = (key, e) => {
        this.setState({ [key]: Number(e.target.value) });
    }
    handleChangeMode = e => {
        this.setState({ mode: e.target.value });
    }
    handleChangeData = e => {
        let { loaded } = this.state;
        this.setState({
            dataType: e.target.value
        }, () => {
            if (loaded) {
                let { disper_map_stack_A2B, disper_map_stack_B2A, disper_map_stack_SYM, fminIndex, fmaxIndex, leftIndex, rightIndex } = this.state;
                let whiteLineDataSource = [];
                switch (e.target.value) {
                    case "A2B":
                        whiteLineDataSource = disper_map_stack_A2B[0].map((col, i) => disper_map_stack_A2B.map(row => row[i]));
                        break;
                    case "B2A":
                        whiteLineDataSource = disper_map_stack_B2A[0].map((col, i) => disper_map_stack_B2A.map(row => row[i]));
                        break;
                    case "SYM":
                        whiteLineDataSource = disper_map_stack_SYM[0].map((col, i) => disper_map_stack_SYM.map(row => row[i]));
                        break;
                    default:
                        break;
                }

                let whiteLineData = whiteLineDataSource.map((arr, i) => [i, getMaxIndex(arr)]);
                for (let i = 0, len = whiteLineData.length; i < len; i++) {
                    if (i < fminIndex) {
                        whiteLineData[i] = NaN;
                    } else if (i > fmaxIndex) {
                        whiteLineData[i] = NaN;
                    }
                }
                for (let i = 0, len = whiteLineData.length; i < len; i++) {
                    if (i >= rightIndex) {
                        whiteLineData[i] = NaN;
                    }
                }
                for (let i = 0, len = whiteLineData.length; i < len; i++) {
                    if (i <= leftIndex) {
                        whiteLineData[i] = NaN;
                    }
                }
                this.getDisp(false);
                this.setState({ whiteLineData });
                this.chart_2.setOption({ series: { data: whiteLineData } });
                this.chart_5.setOption({ series: { data: whiteLineData } });
                this.chart_8.setOption({ series: { data: whiteLineData } });

            }
        });
    }
    handleCalculate = () => {
        console.log("calculate");
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
            whiteLineData: [],
            leftIndex: undefined,
            rightIndex: undefined,
            pinkLineData: [],
            blackLineData: [],
            blackLineXData: [],
            blackLineYData: [],
        }, () => {
            clearHeatmap(this.chart_1);
            clearLine(this.chart_2);
            clearLine(this.chart_3);
            clearHeatmap(this.chart_4);
            clearLine(this.chart_5);
            clearLine(this.chart_6);
            clearHeatmap(this.chart_7);
            clearLine(this.chart_8);
            clearLine(this.chart_9);
            clearHeatmap(this.chart_10);
        })
    }
    handleLoad = () => {
        console.log("load");
        if (this.state.loaded) {
            this.handleClear();
            this.setState({ loaded: true });
            let { disper_map_stack_A2B, disper_map_stack_B2A, disper_map_stack_SYM, disp } = this.state;
            this.heatmapRender(this.chart_1, this.chart_2, this.chart_3, disper_map_stack_A2B, disp);
            this.heatmapRender(this.chart_4, this.chart_5, this.chart_6, disper_map_stack_B2A, disp);
            this.heatmapRender(this.chart_7, this.chart_8, this.chart_9, disper_map_stack_SYM, disp,
                {
                    xAxis: {
                        name: "Frequency (Hz)",
                        nameLocation: "middle",
                        nameGap: 25
                    },
                });
            this.lineRender(this.chart_10, disp);
        } else {
            message.error("清先选择文件");
        }
    }
    render() {
        const { treeData, smooth, fmin, fmax, Tout_min, dTout, Tout_max, mode, dataType } = this.state;
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
                                        <label>smooth</label><Input defaultValue={smooth} onChange={this.handleChangeInput.bind(this, "smooth")} />
                                    </div>
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
                                    <Radio defaultChecked>Phase Shift Method</Radio>
                                    <div className="child-box">
                                        <div className="box-title">Mode</div>
                                        <Radio.Group onChange={this.handleChangeMode} defaultValue={mode}>
                                            <Radio value={"Extract"}>Extract</Radio>
                                            <br />
                                            <Radio value={"QC"}>QC</Radio>
                                        </Radio.Group>
                                    </div>
                                </div>
                                <div className="column">
                                    <Button style={{ width: "100%", height: 42 }} onClick={this.handleCalculate}>Calculate</Button>
                                    <Radio.Group onChange={this.handleChangeData} defaultValue={dataType}>
                                        <Radio value={"A2B"}>A-&gt;B</Radio>
                                        <br />
                                        <Radio value={"B2A"}>B-&gt;A</Radio>
                                        <br />
                                        <Radio value={"SYM"}>SYM</Radio>
                                    </Radio.Group>
                                </div>
                            </div>
                        </div>
                        <div className="box">
                            <div className="box-title">Dispersion</div>
                            <div className="box-content" style={{ display: "flex", justifyContent: "space-around" }}>
                                <Button style={{ width: "33%", height: 42 }} onClick={this.handleClear}>Clear</Button>
                                <Button style={{ width: "33%", height: 42 }} onClick={this.handleLoad}>Load</Button>
                            </div>
                        </div>
                    </div>
                    <div style={{ position: "relative", height: "100%", width: "calc((100% - 310px) / 3 * 2)" }}>
                        <div className="chart-container" style={{ top: 0 }}>
                            <div id="chart1" className="chart" />
                            <div id="chart2" className="chart" />
                            <div id="chart3" className="chart" />
                        </div>
                        <div className="chart-container">
                            <div id="chart4" className="chart" />
                            <div id="chart5" className="chart" />
                            <div id="chart6" className="chart" />
                        </div>
                        <div className="chart-container">
                            <div id="chart7" className="chart" />
                            <div id="chart8" className="chart" />
                            <div id="chart9" className="chart" />
                        </div>
                    </div>
                    <div id="chart10" style={{ width: "calc((100% - 310px) / 3)", height: "100%" }} />
                </div>
            </div>
        )
    }
}