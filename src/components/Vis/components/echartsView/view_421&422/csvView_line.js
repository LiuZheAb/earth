import React, { Component } from 'react';
import { Select } from "antd";
import * as echarts from 'echarts';

export default class csvView_1d extends Component {
    constructor(props) {
        super(props)

        this.state = {
            yDataMap_25D: {},
            yDataMap_3D: {},
            dataOptions: [],
            dataKey: "",
        }
    }
    componentDidMount() {
        this.chart = echarts.init(document.getElementById('chart'));
        let { data_25D, data_3D } = this.props.data;
        let yDataMap_25D = {}, xData = [], yDataMap_3D = {}, dataOptions = [];
        if (data_25D) {
            data_25D = data_25D[0].map((col, i) => data_25D.map(row => row[i]));
            for (let i = 0, len = data_25D.length; i < len; i++) {
                let key = data_25D[i][0].replace(/%| /g, "");
                data_25D[i].shift();
                if (key === "x") {
                    xData = data_25D[i].map(item => Number(item));
                }
                if (!["x", "y", "z"].includes(key)) {
                    yDataMap_25D[key] = data_25D[i].map(item => Number(item));
                }
            }
            dataOptions = Object.keys(yDataMap_25D);
        } else {
            data_25D = [];
        }
        if (data_3D) {
            data_3D = data_3D[0].map((col, i) => data_3D.map(row => row[i]));
            for (let i = 0, len = data_3D.length; i < len; i++) {
                let key = data_3D[i][0].replace(/%| /g, "");
                data_3D[i].shift();
                if (key === "x" && xData.length === 0) {
                    xData = data_3D[i].map(item => Number(item));
                }
                if (!["x", "y", "z"].includes(key)) {
                    yDataMap_3D[key] = data_3D[i].map(item => Number(item));
                }
            }
            dataOptions = Object.keys(yDataMap_3D);
        } else {
            data_3D = [];
        }
        this.setState({
            dataOptions,
            dataKey: dataOptions[0],
            yDataMap_25D,
            yDataMap_3D
        });
        let option = {
            tooltip: {
                trigger: 'axis',
            },
            legend: {
                data: data_25D.length === 0 ? ["3D"] : data_3D.length === 0 ? ["2.5D"] : ["2.5D", "3D"],
                selectedMode: false,
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
                name: "2.5D",
                type: 'line',
                data: yDataMap_25D[dataOptions[0]],
                symbolSize: 2,
                itemStyle: {
                    color: "#060606"
                },
                showSymbol: false,
                smooth: true,
                lineStyle: {
                    type: 'dashed'
                }
            }, {
                name: "3D",
                type: 'line',
                data: yDataMap_3D[dataOptions[0]],
                symbolSize: 2,
                itemStyle: {
                    color: "#992525"
                },
                showSymbol: false,
                smooth: true
            }],
        };
        this.chart.setOption(option);

        window.addEventListener("resize", () => {
            this.chart.resize();
        });
    }
    handleKeyChange = value => {
        let { yDataMap_25D, yDataMap_3D } = this.state;
        this.setState({ dataKey: value });
        this.chart.setOption({
            series: [{
                name: "2.5D",
                data: yDataMap_25D[value],
            }, {
                name: "3D",
                data: yDataMap_3D[value],
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