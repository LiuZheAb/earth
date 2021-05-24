import React, { Component } from 'react';
import { Select } from "antd";
import * as echarts from 'echarts';

export default class csvView_1d extends Component {
    constructor(props) {
        super(props)

        this.state = {
            yDataMap: {},
            dataOptions: [],
            dataKey: "",
        }
    }
    componentDidMount() {
        this.chart = echarts.init(document.getElementById('chart'));
        let { data } = this.props;
        console.log(data);
        let yDataMap = {}, xData = [];
        data = data[0].map((col, i) => data.map(row => row[i]));
        for (let i = 0, len = data.length; i < len; i++) {
            let key = data[i][0].replace(/%| /g, "");
            data[i].shift();
            if (key === "x") {
                xData = data[i].map(item => Number(item));
            }
            if (!["x", "y", "z"].includes(key)) {
                yDataMap[key] = data[i].map(item => Number(item));
            }
        }
        let dataOptions = Object.keys(yDataMap);
        this.setState({
            dataOptions,
            dataKey: dataOptions[0],
            yDataMap,
        });
        let option = {
            tooltip: {
                trigger: 'axis',
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                name: "x",
                boundaryGap: false,
                data: xData,
            },
            yAxis: {
                type: 'value',
                name: "y",
                axisLabel: {
                    formatter: value => {
                        let res = value.toString();
                        if (res.indexOf("e") !== -1) {
                            return parseFloat(value);
                        }
                        let numN1 = 0;
                        let numN2 = 1;//绝对值小于1的数,非0数字前0的个数(包含小数点前的0)
                        let num1 = 0;//小数点前字符长度(包含符号)
                        let num2 = 0;//小数点后字符长度
                        let t1 = 1;
                        for (let k = 0; k < res.length; k++) {
                            if (res[k] === ".") {
                                t1 = 0;
                            }
                            if (t1) {
                                num1++;
                            } else {
                                num2++;
                            }
                        }
                        //绝对值小于1的数
                        if (Math.abs(value) < 1) {
                            for (let i = 2; i < res.length; i++) {
                                if (res[i] === "0") {
                                    numN2++;
                                } else if (res[i] === ".") {
                                    continue;
                                } else {
                                    break;
                                }
                            }
                        }
                        //绝对值小于1的数
                        if (Math.abs(value) < 1 && numN2 > 3) {
                            let v = parseFloat(value);
                            v = v * Math.pow(10, numN2);
                            return v.toFixed(0) + "e-" + numN2;
                        } else if (num1 > 3) {//绝对值大于1000的数
                            if (res[0] === "-") {
                                numN1 = num1 - 2;
                            } else {
                                numN1 = num1 - 1;
                            }
                            let v = parseFloat(value);
                            v = v / Math.pow(10, numN1);
                            if (num2 > 4) {
                                v = v.toFixed(4);
                            }
                            return v.toString() + "e" + numN1;
                        } else {
                            return parseFloat(value);
                        }
                    }
                }
            },
            series: [{
                name: "a",
                type: 'line',
                data: yDataMap[dataOptions[0]],
                symbolSize: 2,
                showSymbol: false,
                smooth: true,
            }],
        };
        this.chart.setOption(option);

        window.addEventListener("resize", () => {
            this.chart.resize();
        });
    }
    handleKeyChange = value => {
        let { yDataMap } = this.state;
        this.setState({ dataKey: value });
        this.chart.setOption({
            series: [{
                name: "a",
                data: yDataMap[value],
            }]
        });
    }
    render() {
        let { dataOptions, dataKey } = this.state;
        return (
            <div style={{ padding: 20, width: "100%", height: "100%" }}>
                <span>请选择数据：</span>
                <Select onChange={this.handleKeyChange} style={{ width: 200 }} placeholder="请选择数据" value={dataKey}>
                    {dataOptions.map(item =>
                        <Select.Option value={item} key={item}>{item}</Select.Option>
                    )}
                </Select>
                <div id="chart" style={{ width: "100%", height: "calc(100% - 32px)" }}></div>
            </div>
        )
    }
}