import React, { Component } from 'react';
import * as echarts from 'echarts';

//获取最大值
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

export default class csvView_malti_line extends Component {
    componentDidMount() {
        this.chart = echarts.init(document.getElementById('chart'));
        let { data, appName } = this.props;
        data = data.map(item => String(item).split(" ").map(item => Number(item)));
        data = data[0].map((col, i) => data.map(row => row[i]));
        let dataSource = data.map(dataArray => dataArray.map((item, index) => [index, item]));
        let yMax = getMax(data[0]), yMin = getMin(data[0]), max = undefined;
        if (yMax > 0 && yMax > Math.abs(yMin)) {
            max = yMax;
        } else if (yMin < 0 && Math.abs(yMax) < Math.abs(yMin)) {
            max = Math.abs(yMin);
        }
        if (max < 1) {
            max = Number("1e" + Math.ceil(Math.log10(max)));
        }
        let option = {
            xAxis: {
                name: "x",
                nameTextStyle: {
                    fontSize: 16,
                    fontWeight: "bold"
                },
            },
            yAxis: {
                name: "y",
                nameTextStyle: {
                    fontSize: 16,
                    fontWeight: "bold"
                },
                max: appName === "线性求解器(实/复) (Linear Solver)" ? max * 2 : max,
                min: appName === "线性求解器(实/复) (Linear Solver)" ? -max * 2 : -max
            },
            legend: {
                data: data.length === 1 ? ['实部'] : ['实部', '虚部']
            },
            tooltip: {
                show: true,
                trigger: "axis",
                formatter: params => 'x: ' + params[0].data[0] + '<br>y: ' + params[0].data[1]
            },
            series: data.length === 1 ?
                [{
                    name: '实部',
                    symbolSize: 4,
                    data: dataSource[0],
                    smooth: true,
                    type: 'line',
                    itemStyle: {
                        color: "#5c7bd9"
                    },
                    zlevel: 9
                }]
                :
                [{
                    name: '实部',
                    symbolSize: 4,
                    data: dataSource[0],
                    smooth: true,
                    type: 'line',
                    itemStyle: {
                        color: "#5c7bd9"
                    },
                    zlevel: 9
                }, {
                    name: '虚部',
                    symbolSize: 4,
                    data: dataSource[1],
                    smooth: true,
                    type: 'line',
                    itemStyle: {
                        color: "#ffdc60"
                    },
                    zlevel: 0
                }]
        };
        this.chart.setOption(option);
        window.addEventListener("resize", () => {
            this.chart.resize();
        });
    }
    render() {
        return (
            <div id="chart" style={{ width: "100%", height: "100%" }} />
        )
    }
}
