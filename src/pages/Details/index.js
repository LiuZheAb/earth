/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 应用详情页
 */

import React from 'react';
import { Layout, Button, Select, Radio, Checkbox, Input, message, Card, Col, Row, Form, Upload, Icon, Empty, Result, Steps, Spin, Tooltip, Modal } from 'antd';
import { Link, withRouter } from "react-router-dom";
import axios from 'axios';
import IconFont from '../../components/IconFont';
import Listener from "../../components/Listener";
import checkNullvalue from "../../utils/checkNullvalue";
import apiPromise from '../../assets/url.js';
import { getCookie } from '../../utils/cookies';
import apiData from "./data.json";
import Vis from "./vis";
import './index.css';

let api = "";
const { Content, Header } = Layout;
const { Option } = Select;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const { TextArea } = Input;
const { Step } = Steps;

class Details extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true,// 值为true隐藏，false为显示。默认值为true。
            texts: null,
            selects: null,
            radios: null,
            checkBoxs: null,
            textAreas: null,
            uploadBoxs: null,
            inputFiles: null,
            appName: sessionStorage.getItem("appName") ? sessionStorage.getItem("appName") : undefined,
            moduleName: sessionStorage.getItem("moduleName") ? sessionStorage.getItem("moduleName") : undefined,
            idenMod: sessionStorage.getItem("idenMod") ? Number(sessionStorage.getItem("idenMod")) : undefined,
            stepNum: sessionStorage.getItem("stepNum") ? Number(sessionStorage.getItem("stepNum")) : undefined,
            nowStep: sessionStorage.getItem("nowStep") ? Number(sessionStorage.getItem("nowStep")) : undefined,
            username: getCookie("userName") ? getCookie("userName") : "",
            dockerID: "",
            dockerIP: "",
            vport: "",
            resMessage: "",
            loading: false,
            listener: <Empty description="容器未启动" />,
            currentStep: 0,
            currentStep2: 0,
            resultData: [],
            staticURL: [],
            isComputing: false,
            uri: undefined,
            logInfoArray: [],
            modalVisible: false,
            dockerType: undefined,
            started: false,
            computed: false,
            disabled: false,
            proList: [],
            proIndex: undefined,
            baseUrl: "",
            calcApi: "",
            requestMethod: undefined,
            calcResData: {},
            calcStatus: true,
            resType: undefined
        };
    };
    logTimer = undefined;
    componentDidMount() {
        apiPromise.then(res => {
            api = res.data.api;
        });
    };
    /**
     * 获取texts当前输入的值，并把值赋给texts数组
     * @param {*} index input框的序号
     * @param {*} value 输入的值
     */
    changeText(index, e) {
        let { texts } = this.state;
        texts[index].currentValue = e.target.value;
        this.setState({ texts });
    };
    //获取selects当前所选项的值，并把值赋给selects数组
    changeOption(index, value) {
        let { selects } = this.state;
        selects[index].currentValue = value;
        this.setState({ selects });
    };
    //获取radios当前所选项的值，并把值赋给radios数组
    changeRadio(index, e) {
        let { radios } = this.state;
        radios[index].currentValue = e.target.value;
        this.setState({ radios });
    };
    //获取checkBoxs当前所选项的值，并把值赋给checkBoxs数组
    changeCheck(index, checkedValues) {
        let { checkBoxs } = this.state;
        checkBoxs[index].currentValue = checkedValues;
        this.setState({ checkBoxs });
    };
    //获取textAreas当前所选项的值，并把值赋给textAreas数组
    changeTextarea(index, e) {
        let { textAreas } = this.state;
        textAreas[index].currentValue = e.target.value;
        this.setState({ textAreas });
    };
    // 上传文件调用
    changeUpload(index, info) {
        if (info.file.status === "done") {
            let { uploadBoxs } = this.state;
            uploadBoxs[index].currentValue = info.file.name;
            this.setState({ uploaded: true, uploadBoxs });
            message.success(`${info.file.name} 上传成功`);
        } else if (info.file.status === "error") {
            message.error(`${info.file.name} 上传失败`);
            this.setState({ uploaded: false });
        };
    };
    changeInputFile(index, e) {
        let { inputFiles } = this.state;
        inputFiles[index].currentValue = e.target.files[0];
        this.setState({ inputFiles });
        //将value置空，避免不能重复读取同一文件
        e.target.value = "";
    };
    //启动容器
    startDocker = () => {
        let _this = this;
        let { username, idenMod, currentStep, appName } = this.state;
        this.setState({ loading: true });
        axios({
            method: 'post',
            url: api + 'runContain',
            data: {
                username,
                idenMod,
                modName: appName
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            let { data, status, uri, proList } = response.data;
            _this.setState({
                loading: false,
                dockerType: status,
                started: true,
            });
            switch (status) {
                case 0:
                    //未登陆
                    message.error(data, 2);
                    break;
                case 1:
                    //启动docker后返回值为路径
                    _this.setState({
                        listener: <Listener uri={uri} />,
                        uri
                    });
                    window.open(uri);
                    break;
                case 2:
                    //常规docker返回结果
                    if (proList.length === 1) {
                        _this.getPram(1);
                        _this.setState({ proIndex: 1 });
                    }
                    _this.setState({
                        listener: <Listener ip={data.dockerIP} />,
                        dockerID: data.dockerID,
                        dockerIP: data.dockerIP,
                        vport: data.vport,
                        currentStep: currentStep + 1,
                        proList
                    });
                    break;
                case 3:
                    message.error(data, 2);
                    break;
                case 4:
                    //getPort错误
                    message.error(data, 2);
                    break;
                case 5:
                    //重&磁docker返回结果
                    _this.setState({
                        listener: <Listener uri={uri} />,
                        baseUrl: uri
                    });
                    break;
                default:
                    break;
            }
        }).catch(function (error) {
            message.error("服务器无响应")
            _this.setState({ loading: false });
        });
    }
    //选择程序
    handleSelectPro = value => {
        this.setState({ proIndex: value });
        this.getPram(value);
    }
    //重&磁选择计算接口
    handleSelectApi = value => {
        //深拷贝apiData对象
        let data = JSON.parse(JSON.stringify(apiData[value]));
        let { calcApi, params, requestMethod } = data;
        let { texts, selects, radios, checkBoxs, textAreas, uploadBoxs, inputFiles } = params;
        this.setState({
            loading: false,
            calcApi,
            requestMethod,
            texts: texts ? texts : [],
            selects: selects ? selects : [],
            radios: radios ? radios : [],
            checkBoxs: checkBoxs ? checkBoxs : [],
            textAreas: textAreas ? textAreas : [],
            uploadBoxs: uploadBoxs ? uploadBoxs : [],
            inputFiles: inputFiles ? inputFiles : []
        });
    }
    //获取参数
    getPram = index => {
        let _this = this;
        let { idenMod } = this.state;
        axios({
            method: 'post',
            url: api + 'render',
            data: {
                idenMod,
                index
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            let { texts, selects, radios, checkBoxs, textAreas, uploadBoxs, inputFiles } = response.data.projectparams;
            _this.setState({
                texts: texts ? texts : [],
                selects: selects ? selects : [],
                radios: radios ? radios : [],
                checkBoxs: checkBoxs ? checkBoxs : [],
                textAreas: textAreas ? textAreas : [],
                uploadBoxs: uploadBoxs ? uploadBoxs : [],
                inputFiles: inputFiles ? inputFiles : []
            });
        }).catch(function (error) {
            message.error("服务器无响应");
        });
    }
    //提交参数文件
    createPFile = e => {
        e.preventDefault();
        let { texts, selects, radios, checkBoxs, textAreas, inputFiles, idenMod, uploadBoxs, dockerID, dockerIP, vport, currentStep, moduleName, currentStep2, nowStep, proIndex, dockerType, baseUrl, calcApi, requestMethod } = this.state;
        let _this = this;
        if (dockerType === 5) {
            if (calcApi) {
                if (checkNullvalue(texts) && checkNullvalue(selects) && checkNullvalue(radios) && checkNullvalue(checkBoxs) && checkNullvalue(textAreas)) {
                    baseUrl = "http://139.217.82.132:5050";
                    if (requestMethod === "get" && Array.isArray(texts)) {
                        let params = {};
                        for (let i = 0, len = texts.length; i < len; i++) {
                            params[texts[i].paramName] = isNaN(Number(texts[i].currentValue)) ? texts[i].currentValue : Number(texts[i].currentValue);
                        }
                        _this.setState({
                            loading: true,
                            isComputing: true
                        });
                        axios.get(baseUrl + calcApi, { params })
                            .then(function (response) {
                                _this.setState({
                                    loading: false,
                                    isComputing: false
                                });
                                if (typeof (response.data) === "string") {
                                    _this.setState({
                                        calcResData: { message: response.data }
                                    });
                                } else if (response.data.result) {
                                    _this.setState({
                                        calcResData: { message: response.data.result }
                                    });
                                } else {
                                    _this.setState({ calcResData: response.data });
                                }

                            }).catch(function (error) {
                                _this.setState({ loading: false, isComputing: false, calcStatus: false });
                                message.error(error.message);
                            });
                    } else if (requestMethod === "post" && Array.isArray(texts)) {
                        let params = new FormData();
                        for (let i = 0, len = texts.length; i < len; i++) {
                            params.append(texts[i].paramName, isNaN(Number(texts[i].currentValue)) ? texts[i].currentValue : Number(texts[i].currentValue));
                        }
                        for (let i = 0, len = inputFiles.length; i < len; i++) {
                            params.append(inputFiles[i].paramName, inputFiles[i].currentValue);
                        }
                        _this.setState({
                            loading: true,
                            isComputing: true
                        });
                        axios({
                            method: 'post',
                            url: baseUrl + calcApi,
                            data: params,
                            headers: {
                                'Content-Type': 'multipart/formdata'
                            }
                        }).then(function (response) {
                            _this.setState({
                                loading: false,
                                isComputing: false
                            });
                            if (typeof (response.data) === "string") {
                                _this.setState({
                                    calcResData: { message: response.data }
                                });
                            } else if (response.data.result) {
                                _this.setState({
                                    calcResData: { message: response.data.result }
                                });
                            } else {
                                _this.setState({ calcResData: response.data });
                            }

                        }).catch(function (error) {
                            _this.setState({ loading: false, isComputing: false, calcStatus: false });
                            console.log(error);
                            message.error(error.message);
                        });
                    }
                }
            } else {
                message.error("请选择程序");
            }
        } else {
            if (proIndex) {
                if (checkNullvalue(texts) && checkNullvalue(selects) && checkNullvalue(radios) && checkNullvalue(checkBoxs) && checkNullvalue(textAreas)) {
                    if (Array.isArray(texts)) {
                        for (let i = 0, len = texts.length; i < len; i++) {
                            if (texts[i].paramName === "iter_max" || texts[i].paramName === "time_after_earthquake") {
                                texts[i].currentValue = "+" + texts[i].currentValue;
                            }
                        }
                    }
                    let makeJson = `{ "texts" :${JSON.stringify(texts)}
                        ,"selects" :${JSON.stringify(selects)}
                        ,"radios" :${JSON.stringify(radios)}
                        ,"checkBoxs" :${JSON.stringify(checkBoxs)}
                        ,"textAreas" :${JSON.stringify(textAreas)}
                        ,"uploadBoxs" :${JSON.stringify(uploadBoxs)}}`;
                    axios({
                        method: 'post',
                        url: api + 'createPFile',
                        data: {
                            idenMod: idenMod * Math.pow(10, nowStep - 1),
                            params: makeJson,
                            dockerID,
                            dockerIP,
                            vport,
                            moduleName,
                            index: proIndex
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function (response) {
                        let { data, status } = response.data;
                        _this.setState({ loading: false });
                        if (status === "success") {
                            message.success(data, 2);
                            if (nowStep > 1) {
                                _this.setState({
                                    currentStep2: currentStep2 + 1
                                });
                            } else {
                                _this.setState({
                                    currentStep: currentStep + 1
                                });
                            }
                        } else if (status === "fail") {
                            message.error(data, 2);
                        }
                    }).catch(function (error) {
                        _this.setState({ loading: false });
                        message.error("服务器无响应");
                    });
                }
            } else {
                message.error("请选择程序获取参数列表", 2)
            }
        }
    }
    //运行
    runDocker = () => {
        let _this = this;
        let { username, idenMod, dockerID, dockerIP, vport, nowStep, stepNum, proIndex, appName } = this.state;
        this.setState({ loading: true, isComputing: true });
        axios({
            method: 'post',
            url: api + 'computeContain',
            data: {
                username,
                idenMod: idenMod * Math.pow(10, nowStep - 1),
                dockerID,
                dockerIP,
                vport,
                index: proIndex,
                modName: appName
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            let { status, data, staticURL } = response.data;
            clearInterval(_this.logTimer);
            _this.setState({
                loading: false,
                computed: true,
                isComputing: false,
                nowStep: nowStep < stepNum ? nowStep + 1 : nowStep,
                disabled: nowStep === stepNum ? true : false,
                modalVisible: false,
                resType: status
            });
            switch (status) {
                case 0:
                    message.error(data);
                    break;
                case 1:
                    message.success("计算完成");
                    _this.setState({
                        resultData: data,
                        staticURL
                    });
                    break;
                case 2:
                    message.success("计算完成");
                    _this.setState({
                        resultData: data
                    });
                    break;
                default:
                    break;
            }
        }).catch(function (error) {
            message.error("服务器无响应")
            _this.setState({
                loading: false,
                isComputing: false,
            });
        });
    }
    //查看运行状态
    handleViewInfo = () => {
        let { dockerID, dockerIP } = this.state;
        let _this = this;
        this.setState({ modalVisible: true });
        let times = 0;
        this.logTimer = setInterval(() => {
            axios({
                method: 'post',
                url: api + 'logInfo',
                data: {
                    dockerID,
                    dockerIP,
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (res) {
                let data = res.data.data.split("Calculation begins...")[1].split("\r\n");
                for (let i = 0, len = data.length; i < len; i++) {
                    if (data[i].toLowerCase().replace(/ +/g, "").indexOf("matlab") >= 0) {
                        data[i] = "\r\n";
                    }
                }
                _this.setState({ logInfoArray: data });
            }).catch(function () {
                message.error("服务器无响应");
                times += 1;
                if (times > 4) {
                    clearInterval(_this.logTimer);
                }
            });
        }, 1000)
    }
    //关闭运行状态模态框
    handleCancleModal = () => {
        clearInterval(this.logTimer);
        this.setState({ modalVisible: false });
    }
    //停止docker
    handleKillContain = () => {
        let { dockerID, dockerIP } = this.state;
        let _this = this;
        axios({
            method: 'post',
            url: api + 'killcontain',
            data: {
                dockerID,
                dockerIP,
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function () {
            message.success("应用已停止");
            _this.setState({ isComputing: false });
        }).catch(function () {
            message.error("服务器无响应");
        });
    }
    //下一步
    nextStep = () => {
        let { nowStep, idenMod } = this.state;
        let _this = this;
        axios({
            method: 'post',
            url: api + 'render',
            data: {
                idenMod: idenMod * Math.pow(10, nowStep),
                index: 1
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            let { texts, selects, radios, checkBoxs, textAreas, uploadBoxs } = response.data.projectparams;
            _this.setState({
                texts: texts ? texts : [],
                selects: selects ? selects : [],
                radios: radios ? radios : [],
                checkBoxs: checkBoxs ? checkBoxs : [],
                textAreas: textAreas ? textAreas : [],
                uploadBoxs: uploadBoxs ? uploadBoxs : [],
                nowStep: nowStep + 1,
                currentStep2: 0
            });
        }).catch(function (error) {
            message.error("服务器无响应");
        });
    }
    getCsvData = path => {
        let { dockerIP, vport } = this.state;
        axios.get("http://" + dockerIP + ":" + vport + "/resInfo", {
            params: {
                path
            }
        }).then(function (response) {
            console.log(response.data)
        }).catch(function (error) {
            message.error("服务器错误");
        });

        // axios({
        //     method: "post",
        //     url: "http://" + dockerIP + ":" + vport + "/resInfo",
        //     data: {
        //         path
        //     },
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // }).then(function (response) {
        //     console.log(response.data)
        // }).catch(function (error) {
        //     message.error("服务器错误");
        // });
    }
    render() {
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 8 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 16 },
            },
        };
        const { username, appName, texts, selects, radios, checkBoxs, textAreas, uploadBoxs, inputFiles, loading, listener, currentStep,
            resultData, staticURL, isComputing, idenMod, dockerID, dockerIP, vport, logInfoArray, proIndex, modalVisible, uri,
            dockerType, started, computed, nowStep, stepNum, currentStep2, disabled, proList, calcResData, calcStatus, resType } = this.state;
        const uploadProps = {
            name: "uploadParamFile",
            action: "http://" + dockerIP + ":" + vport + "/upFile",
            data: {
                username,
                idenMod: idenMod * Math.pow(10, nowStep - 1),
                dockerID,
                dockerIP,
                vport,
                index: proIndex
            }
        };
        return (
            <div className="details">
                <Header className="details-header">
                    <Link to="/home">
                        <div className="details-logo" title="综合地球物理联合反演与解释一体化平台">
                            <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" />
                            {/* <span>综合地球物理联合反演与解释一体化平台</span> */}
                        </div>
                    </Link>
                    <span className="details-title">{appName}</span>
                    <IconFont className="details-quit" onClick={this.props.history.goBack} type="earthfanhui" />
                </Header>
                <Content className="details-content">
                    <Row style={{ height: "100%", width: "100%" }}>
                        <Col sm={8} xs={24} className="details-card">
                            <Card title="参数数据" bordered={false} className="params-card">
                                {dockerType === 2 &&
                                    (
                                        nowStep > 1 && started ?
                                            <Steps current={currentStep2}>
                                                <Step title="生成参数文件"></Step>
                                                <Step title="应用服务计算"></Step>
                                            </Steps>
                                            :
                                            <Steps current={currentStep}>
                                                <Step title="启动容器"></Step>
                                                <Step title="生成参数文件"></Step>
                                                <Step title="应用服务计算"></Step>
                                            </Steps>
                                    )
                                }
                                <div style={{ height: "calc(100% - 32px)" }}>
                                    {nowStep === 1 && currentStep === 0 && dockerType !== 5 ?
                                        <div style={{ textAlign: "center", paddingTop: 50 }}>
                                            <Button type="primary" loading={loading} onClick={this.startDocker}>启动容器</Button>
                                        </div>
                                        : null
                                    }
                                    {(nowStep === 1 && currentStep === 1) || (nowStep > 1 && currentStep2 === 0) || dockerType === 5 ?
                                        <>
                                            {proList.length > 1 &&
                                                <Row style={{ margin: "20px 0 10px" }}>
                                                    <Col xs={24} sm={8} className="ant-form-item-label">
                                                        <label style={{ whiteSpace: "nowrap", fontWeight: 500, lineHeight: "32px" }}>请选择测试模型</label>
                                                    </Col>
                                                    <Col xs={24} sm={16} className="ant-form-item-control-wrapper ant-form-item-control">
                                                        <Select onChange={this.handleSelectPro} placeholder="--请选择测试模型--" style={{ width: "100%" }}>
                                                            {proList.map((value, index) => {
                                                                return (
                                                                    <Option key={index} value={index + 1}>
                                                                        {value}
                                                                    </Option>
                                                                );
                                                            }
                                                            )}
                                                        </Select>
                                                    </Col>
                                                </Row>
                                            }
                                            {dockerType === 5 &&
                                                <Row style={{ marginBottom: 10 }}>
                                                    <Col xs={24} sm={8} className="ant-form-item-label">
                                                        <label style={{ whiteSpace: "nowrap", fontWeight: 500, lineHeight: "32px" }}>请选择模型</label>
                                                    </Col>
                                                    <Col xs={24} sm={16} className="ant-form-item-control-wrapper ant-form-item-control">
                                                        <Select onChange={this.handleSelectApi} placeholder="--请选择模型--" style={{ width: "100%" }}>
                                                            {Object.keys(apiData).map((value, index) => {
                                                                return (
                                                                    <Option key={index} value={value}>
                                                                        {value}
                                                                    </Option>
                                                                );
                                                            }
                                                            )}
                                                        </Select>
                                                    </Col>
                                                </Row>
                                            }
                                            <div style={{ paddingTop: 30 }}>
                                                {texts === undefined && selects === undefined && uploadBoxs === undefined && radios === undefined && checkBoxs === undefined && textAreas === undefined && inputFiles === undefined ?
                                                    <Result
                                                        status="warning"
                                                        title="参数列表获取失败!"
                                                        style={{ paddingTop: "80px" }}
                                                    >
                                                    </Result>
                                                    :
                                                    <Form {...formItemLayout} onSubmit={this.createPFile} className="details-form">
                                                        {inputFiles === null ? null : inputFiles.map((inputFile, index) => {
                                                            return (
                                                                <Form.Item className="input-file-wrapper" label={<label title={inputFile.paramNameCN}>{inputFile.paramName}</label>} key={index}>
                                                                    <Tooltip title={inputFile.tip}>
                                                                        <span className="ant-btn ant-btn-default input-file">选择文件
                                                                        <input type="file" id="file" onChange={this.changeInputFile.bind(this, index)} />
                                                                        </span>
                                                                    </Tooltip>
                                                                    <div style={{ marginLeft: 10 }}>{inputFile.currentValue && inputFile.currentValue.name}</div>
                                                                </Form.Item>
                                                            );
                                                        })}
                                                        {texts === null ? null : texts.map((textBox, index) => {
                                                            return (
                                                                <Form.Item label={<label title={textBox.paramNameCN}>{textBox.paramName}</label>} key={index}>
                                                                    <Tooltip title={textBox.tip}>
                                                                        <Input min={0} step={1} value={textBox.currentValue} onChange={this.changeText.bind(this, index)} />
                                                                    </Tooltip>
                                                                </Form.Item>
                                                            );
                                                        })}
                                                        {selects === null ? null : selects.map((selectBox, index) => {
                                                            return (
                                                                <Form.Item label={selectBox.paramName} key={index}>
                                                                    <Select onChange={this.changeOption.bind(this, index)} value={selectBox.currentValue}>
                                                                        {selectBox.defaultValue.map((value, index2) => {
                                                                            return (
                                                                                <Option key={index2} value={value}>
                                                                                    {value}
                                                                                </Option>
                                                                            );
                                                                        }
                                                                        )}
                                                                    </Select>
                                                                </Form.Item>
                                                            );
                                                        })}
                                                        {uploadBoxs === null || uploadBoxs === undefined ? null : uploadBoxs.map((upload, index) => {
                                                            return (
                                                                <Form.Item label={<label title={upload.paramNameCN}>{upload.paramName}</label>} key={index}>
                                                                    <Upload {...uploadProps}
                                                                        onChange={this.changeUpload.bind(this, index)}
                                                                    >
                                                                        <Button type="default"><Icon type="upload" />上传文件</Button>
                                                                    </Upload>
                                                                </Form.Item>
                                                            );
                                                        })}
                                                        {radios === null ? null : radios.map((radioBox, index) => {
                                                            return (
                                                                <Form.Item label={radioBox.paramName} key={index}>
                                                                    <RadioGroup onChange={this.changeRadio.bind(this, index)} value={radioBox.currentValue}>
                                                                        {radioBox.defaultValue.map((value, index2) => {
                                                                            return (
                                                                                <Radio key={index2} value={value}>
                                                                                    {value}
                                                                                </Radio>
                                                                            );
                                                                        })}
                                                                    </RadioGroup>
                                                                </Form.Item>
                                                            );
                                                        })}
                                                        {checkBoxs === null ? null : checkBoxs.map((checkBox, index) => {
                                                            return (
                                                                <Form.Item label={checkBox.paramName} key={index}>
                                                                    <CheckboxGroup options={checkBox.defaultValue} value={checkBox.currentValue} onChange={this.changeCheck.bind(this, index)} />
                                                                </Form.Item>
                                                            );
                                                        })}
                                                        {textAreas === null ? null : textAreas.map((textArea, index) => {
                                                            return (
                                                                <Form.Item label={textArea.paramName} key={index}>
                                                                    <TextArea autoSize={{ minRows: 4, maxRows: 2000 }} cols={10} value={textArea.currentValue} onChange={this.changeTextarea.bind(this, index)} />
                                                                </Form.Item>
                                                            );
                                                        })}
                                                        <Row className="app-button">
                                                            {dockerType === 5 ?
                                                                <Button type="primary" htmlType="submit" loading={loading}>提交参数</Button>
                                                                :
                                                                <Button type="primary" htmlType="submit">提交参数</Button>
                                                            }
                                                        </Row>
                                                    </Form>
                                                }
                                            </div>
                                        </>
                                        : null
                                    }
                                    {(nowStep === 1 && currentStep === 2) || (nowStep > 1 && currentStep2 === 1) ?
                                        <div style={{ textAlign: "center", paddingTop: 50, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", alignItems: "center" }}>
                                            {nowStep < stepNum && computed && !isComputing ?
                                                <Button type="primary" onClick={this.nextStep} style={{ width: 140, marginBottom: 20 }}>下一步</Button>
                                                :
                                                <Button type="primary" loading={loading} onClick={this.runDocker} style={{ width: 140, marginBottom: 20 }} disabled={disabled}>应用服务计算</Button>
                                            }
                                            {isComputing &&
                                                <div style={{ margin: "0 auto", display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 380, flexWrap: "wrap" }}>
                                                    <Button type="default" style={{ marginBottom: 16 }} onClick={this.handleViewInfo}>查看运行状态</Button>
                                                    <Modal className="loginfo-modal" visible={modalVisible} onCancel={this.handleCancleModal} footer={null}
                                                    // bodyStyle={{ backgroundColor: "#000" }}
                                                    >
                                                        {logInfoArray.map((item, index) => <p key={index} style={{ marginBottom: 5 }}>{item}</p>)}
                                                    </Modal>
                                                    <Button type="default" style={{ marginBottom: 16 }}>查看模板结果</Button>
                                                    <Button type="danger" onClick={this.handleKillContain} style={{ width: 116 }}>停止docker</Button>
                                                </div>
                                            }
                                        </div>
                                        : null
                                    }
                                </div>
                            </Card>
                        </Col>
                        <Col sm={8} xs={24} className="details-card">
                            <Card title="运行监控" bordered={false}>
                                {listener}
                            </Card>
                        </Col>
                        <Col sm={8} xs={24} className="details-card">
                            <Card title="运行结果" bordered={false}>
                                {isComputing || resType || Object.keys(calcResData).length > 0 || !calcStatus || computed ? null : <Empty description="程序未运行" />}
                                {isComputing &&
                                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                                        <p>正在计算...</p>
                                        <Spin size="large" />
                                    </div>
                                }
                                {dockerType === 1 && uri &&
                                    <div style={{ textAlign: "center", paddingTop: 35 }}>
                                        <p>请在新窗口中查看</p>
                                        <p>如未弹出新窗口，请点击此<a href={uri} target="_blank" rel="noopener noreferrer">链接</a></p>
                                    </div>
                                }
                                {dockerType === 2 && !isComputing ?
                                    resType === 1 ?
                                        <>
                                            <div style={{ borderBottom: "1px solid #eee" }}>
                                                <p style={{ fontWeight: "bold", marginBottom: 10 }}>数据文件目录</p>
                                                {Array.isArray(staticURL) && staticURL.map((item, index) =>
                                                    <p key={index} style={{ marginBottom: 4 }}>
                                                        <a href={item} target="_blank" rel="noopener noreferrer">{item.split("/").pop()}</a>
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: "bold", marginBottom: 10 }}>计算日志</p>
                                                {resultData.map((item, index) => <p key={index} style={{ marginBottom: 2 }}>{item}</p>)}
                                            </div>
                                        </>
                                        : resType === 2 && <div>
                                            <p style={{ fontWeight: "bold", marginBottom: 10 }}>数据文件（点击进行可视化）</p>
                                            {Object.keys(resultData).map((item, i) => <p key={i} onClick={this.getCsvData.bind(this, resultData[item])}>{item}</p>)}
                                        </div>
                                    : null
                                }
                                {dockerType === 5 && !isComputing ?
                                    calcStatus ?
                                        Object.keys(calcResData).length > 0 &&
                                        <>
                                            {Object.keys(calcResData).map((item, index) => <p key={index}>{(item === "message" ? "" : item + "：") + calcResData[item]}</p>)}
                                            <Vis shouldReq dockerID dockerIP vport idenMod index data dataType />
                                        </>
                                        : <Result status="error" title="计算错误" />
                                    : null
                                }
                            </Card>
                        </Col>
                    </Row>
                </Content >
            </div >
        );
    };
};

export default Form.create({ name: "details" })(withRouter(Details));