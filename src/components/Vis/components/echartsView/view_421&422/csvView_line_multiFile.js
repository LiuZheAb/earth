import React, { Component } from 'react';
import { Select } from "antd";
import * as echarts from 'echarts';
import "./index.css";

export default class csvView_1d extends Component {
    constructor(props) {
        super(props)

        this.state = {
            yDataMap_25D: {},
            yDataMap_3D: [],
            yDataMap_LGMF: {},
            dataOptions: [],
            dataKey: "",
            fileName: ""
        }
    }
    componentDidMount() {
        this.chart = echarts.init(document.getElementById('chart'));
        this.chartRender();
        let { dataOptions, xData, yDataMap_25D, yDataMap_3D } = this.props.data;
        this.setState({
            dataOptions,
            dataKey: dataOptions[0],
            xData,
            yDataMap_25D,
            yDataMap_3D
        });
        this.chart.setOption({
            xAxis: {
                data: xData
            },
            series: [{
                name: "25D",
                data: yDataMap_25D[dataOptions[0]]
            }]
        })
        this.chart.setOption({
            series: [{
                name: "3D",
                data: yDataMap_3D[dataOptions[0]]
            }]
        })
    }
    chartRender = () => {
        let option = {
            tooltip: {
                trigger: 'axis',
            },
            legend: {
                data: ["25D", "3D"],
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
                name: "25D",
                type: 'line',
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
                symbolSize: 2,
                itemStyle: {
                    color: "#992525"
                },
                showSymbol: false,
                smooth: true,
            }, {
                name: "LGMF",
                type: 'line',
                symbolSize: 2,
                itemStyle: {
                    color: "#3e31e1"
                },
                showSymbol: false,
                smooth: true,
                lineStyle: {
                    type: 'dotted'
                }
            }],
        };
        this.chart.setOption(option);

        window.addEventListener("resize", () => {
            this.chart.resize();
        });
    }
    handleKeyChange = value => {
        let { yDataMap_25D, yDataMap_3D, yDataMap_LGMF } = this.state;
        this.chart.setOption({
            series: [{
                name: "25D",
                data: yDataMap_25D[value],
            },
            {
                name: "3D",
                data: yDataMap_3D[value],
            },
            {
                name: "LGMF",
                data: yDataMap_LGMF[value],
            }]
        });
        this.setState({ dataKey: value });
    }
    handleChange = event => {
        if (event.target.files.length > 0) {
            this.setState({
                fileName: event.target.files[0].name
            });
            let reader = new FileReader();
            reader.readAsText(event.target.files[0]);
            reader.onload = e => {
                let { dataOptions, dataKey, yDataMap_LGMF } = this.state;
                let data = e.target.result.split("\r\n");
                data = data.map(item => item.trim().replace(/\s+/g, " ").split(" "))
                data = data[0].map((col, i) => data.map(row => row[i]));
                if (this.state.fileName.indexOf("E") > -1) {
                    for (let i = 0; i < dataOptions.length / 2; i++) {
                        yDataMap_LGMF[dataOptions[i]] = data[i]
                    }
                } else if (this.state.fileName.indexOf("H") > -1) {
                    for (let i = dataOptions.length / 2; i < dataOptions.length; i++) {
                        yDataMap_LGMF[dataOptions[i]] = data[i - dataOptions.length / 2]
                    }
                }
                this.setState({
                    yDataMap_LGMF,
                });
                let legendData = this.chart.getOption().legend[0].data;
                legendData.push("LGMF")
                this.chart.setOption({
                    legend: {
                        data: legendData
                    },
                    series: [{
                        name: "LGMF",
                        data: yDataMap_LGMF[dataKey]
                    }]
                })
            }
        }
        event.target.value = "";
    }
    render() {
        let { dataOptions, dataKey, fileName } = this.state;
        return (
            <div style={{ padding: 20, width: "100%", height: "100vh" }}>
                <div>
                    <span>请选择数据：</span>
                    <Select onChange={this.handleKeyChange} style={{ width: 200 }} placeholder="请选择数据" value={dataKey}>
                        {dataOptions.map(item =>
                            <Select.Option value={item} key={item}>{item}</Select.Option>
                        )}
                    </Select>
                </div>
                <div className="lgmf-file" style={{ display: "flex", marginTop: 16 }}>
                    <span>解析解数据：</span>
                    <div className="input-file-wrapper">
                        <span className="ant-btn ant-btn-default input-file">
                            点击上传<input type="file" id="file" onChange={this.handleChange} />
                        </span>
                        <span className="file-name" title={fileName}>{fileName}</span>
                    </div>
                </div>
                <div id="chart" style={{ width: "100%", height: "calc(100% - 68px)" }}></div>
            </div>
        )
    }
}