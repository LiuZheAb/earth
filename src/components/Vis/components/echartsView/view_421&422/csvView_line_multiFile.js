import React, { Component } from 'react';
import { Select, Icon } from "antd";
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
            fileNameList: []
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
        let files = event.target.files, len = files.length;
        let { dataOptions, dataKey, yDataMap_LGMF, fileNameList } = this.state;
        if (len > 0) {
            for (let j = 0; j < len; j++) {
                let reader = new FileReader();
                reader.readAsText(files[j]);
                let fileName = files[j].name;
                fileNameList.push(fileName);
                // eslint-disable-next-line
                reader.onload = e => {
                    let data = e.target.result.split("\r\n");
                    data = data.map(item => item.trim().replace(/\s+/g, " ").split(" "))
                    data = data[0].map((col, i) => data.map(row => row[i]));
                    if (fileName.indexOf("E_") > -1) {
                        for (let i = 0; i < dataOptions.length; i++) {
                            if (dataOptions[i].indexOf("E") > -1) {
                                yDataMap_LGMF[dataOptions[i]] = data[i]
                            }
                        }
                    } else if (fileName.indexOf("H_") > -1) {
                        for (let i = 0; i < dataOptions.length; i++) {
                            if (dataOptions[i].indexOf("H") > -1) {
                                yDataMap_LGMF[dataOptions[i]] = data[i - 6]
                            }
                        }
                    }
                    if (j === len - 1) {
                        this.setState({
                            yDataMap_LGMF,
                            fileNameList: Array.from(new Set(fileNameList))
                        });
                        let legendData = this.chart.getOption().legend[0].data;
                        legendData.push("LGMF");
                        this.chart.setOption({
                            legend: {
                                data: Array.from(new Set(legendData))
                            },
                            series: [{
                                name: "LGMF",
                                data: yDataMap_LGMF[dataKey]
                            }]
                        })
                    }
                }
            }
        }
        event.target.value = "";
    }
    getExampleFile = () => {
        let fileList = ["E_field.txt", "H_field.txt"];
        for (let i = 0; i < fileList.length; i++) {
            var elementA = document.createElement('a');
            elementA.download = fileList[i];//文件名
            //隐藏dom点不显示
            elementA.style.display = 'none';
            elementA.href = "./static/data/" + fileList[i];
            document.body.appendChild(elementA);
            elementA.click();
            document.body.removeChild(elementA);
        }
    }
    render() {
        let { dataOptions, dataKey, fileNameList } = this.state;
        return (
            <div style={{ padding: 20, width: "100%", height: "100vh" }} id="multiFile">
                <div>
                    <span>请选择数据：</span>
                    <Select onChange={this.handleKeyChange} style={{ width: 200 }} placeholder="请选择数据" value={dataKey}>
                        {dataOptions.map(item =>
                            <Select.Option value={item} key={item}>{item}</Select.Option>
                        )}
                    </Select>
                </div>
                <div className="lgmf-file" style={{ display: "flex", marginTop: 16, lineHeight: "32px" }}>
                    <span>解析解数据：</span>
                    <div className="input-file-wrapper">
                        <span className="ant-btn ant-btn-default input-file">
                            点击上传<input type="file" id="file" onChange={this.handleChange} multiple={true} title="请上传文件名为E_field或H_field的文件" />
                        </span>
                        <span className="file-name" title={fileNameList.join(" ; ")}>{fileNameList.join(" ; ")}</span>
                    </div>
                </div>
                <div className="file-icon" onClick={this.getExampleFile}>
                    <Icon type="download" title="获取示例文件" />
                    <span className="file-name">示例文件</span>
                </div>
                <div id="chart" style={{ width: "100%", height: "calc(100% - 100px)" }}></div>
            </div>
        )
    }
}