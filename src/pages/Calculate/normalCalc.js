/*
 *文件名 : normalCalc.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 应用详情页
 */

import React from 'react';
import { Layout, Button, Select, Radio, Checkbox, Input, message, Card, Col, Row, Form, Upload, Icon, Empty, Result, Steps, Spin, Tooltip, Modal, Drawer, ConfigProvider, Table, Popconfirm } from 'antd';
import { Link, withRouter } from "react-router-dom";
import zhCN from 'antd/es/locale/zh_CN';
import axios from 'axios';
import IconFont from '../../components/IconFont';
import Listener from "../../components/Listener";
import checkNullvalue from "../../utils/checkNullvalue";
import apiPromise from '../../assets/url.js';
import { getCookie } from '../../utils/cookies';
import GMDataSource from "./G&Mdata.json";
import GMIDataSource from "./G&MinversionData.json";
import Vis from "../../components/Vis";
import './index.css';

let api = "";
const { Content, Header } = Layout;
const { Option } = Select;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const { TextArea } = Input;
const { Step } = Steps;
const fileTableColumns = _this => [{
    title: '序号',
    dataIndex: 'key',
    align: "center",
}, {
    title: '文件名',
    dataIndex: 'name',
    align: "center",
    render: text => <p className="table-item-name" title={text}>{text}</p>
}, {
    title: '查看或下载',
    align: "center",
    render: (text, info) => <Button type="primary" onClick={_this.handleDownload.bind(_this, info.staticPath)}>
        {["txt", "dat", "pdf", "jpg", "png", "jpeg", "tiff", "msh", "field", "rho", "vel"].includes(info.suffix) ? "查看" : "下载"}
    </Button>
}, {
    title: '可视化',
    align: "center",
    className: "file-desc",
    render: (text, info) => ["csv", "msh", "txt"].includes(info.suffix) ?
        (info.size < 100 ?
            <Button type="primary" onClick={_this.handleOpenVisModal.bind(_this, info)}>可视化</Button>
            : "文件过大，请下载后使用专业软件进行可视化")
        : "暂不支持此格式"
}];
class Calculate extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            texts: null,
            selects: null,
            radios: null,
            checkBoxs: null,
            textAreas: null,
            uploadBoxs: null,
            inputFiles: null,
            inputFileList: [],
            uploadFileList: [],
            appName: sessionStorage.getItem("appName") || undefined,
            moduleName: sessionStorage.getItem("moduleName") || undefined,
            idenMod: Number(sessionStorage.getItem("idenMod")) || undefined,
            stepNum: Number(sessionStorage.getItem("stepNum")) || 1,
            nowStep: Number(sessionStorage.getItem("nowStep")) || 1,
            username: getCookie("userName") || "",
            dockerID: sessionStorage.getItem("dockerID") || "",
            dockerIP: sessionStorage.getItem("dockerIP") || "",
            vport: sessionStorage.getItem("vport") || "",
            funcName: sessionStorage.getItem("funcName") || "",
            loading: false,
            listener: sessionStorage.getItem("dockerIP") ? true : false,
            currentStep: 0,
            currentStep2: 0,
            apiData: Number(sessionStorage.getItem("idenMod")) === 311 ? Object.assign(GMDataSource.gravity, GMDataSource.common) :
                Number(sessionStorage.getItem("idenMod")) === 312 ? Object.assign(GMDataSource.magnetic, GMDataSource.common) :
                    Number(sessionStorage.getItem("idenMod")) === 321 ? GMIDataSource.cor :
                        Number(sessionStorage.getItem("idenMod")) === 322 ? GMIDataSource.fcm :
                            Number(sessionStorage.getItem("idenMod")) === 323 ? GMIDataSource.cor_space :
                                Number(sessionStorage.getItem("idenMod")) === 324 ? GMIDataSource.cross :
                                    Number(sessionStorage.getItem("idenMod")) === 325 ? GMIDataSource.fcrm :
                                        Number(sessionStorage.getItem("idenMod")) === 326 ? GMIDataSource.observe : {},
            resultData: [],
            resultFileList: [],
            isComputing: false,
            started: Number(sessionStorage.getItem("nowStep")) > 1 ? true : false,
            uri: sessionStorage.getItem("baseUrl") || "",
            logInfoArray: [],
            modalVisible: false,
            dockerType: Number(sessionStorage.getItem("dockerType")) || undefined,
            computed: false,
            disabled: false,
            proList: [],
            modelIndex: Number(sessionStorage.getItem("modelIndex")) || undefined,
            baseUrl: sessionStorage.getItem("baseUrl") || "",
            calcApi: "",
            apiName: "",
            requestMethod: undefined,
            needVis: false,
            calcResData: {},
            calcStatus: true,
            resType: undefined,
            visVisible: false,
            toggle: true,
            tdataDrawerVisible: false,
            tdataFileListData: [],
            fileListLoading: false,
            dataLoading: false,
            fileModalVisible: false,
            imgModalVisible: false,
            filePath: "",
            dataType: "",
        };
    };
    logTimer = undefined;
    componentDidMount() {
        apiPromise.then(res => {
            api = res.data.api;
            let { dockerType, modelIndex } = this.state;
            if (dockerType === 2) {
                this.getPram(modelIndex);
            }
        });
    };
    /**
     * 获取texts当前输入的值，并把值赋给texts数组
     * @param {*} index input框的序号
     * @param {*} value 输入的值
     */
    changeText(index, e) {
        let { texts } = this.state;
        texts[index].currentValue = texts[index].type === "boolean" ? e.target.value.toLowerCase() : e.target.value;
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
        let { uploadFileList } = this.state;
        let fileList = [...info.fileList];
        fileList = fileList.slice(-1);
        uploadFileList[index] = fileList;
        this.setState({ uploadFileList });
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
    openNewWindow = () => {
        let { uri } = this.state;
        setTimeout(() => {
            let tempwindow = window.open(window.location.origin + '/#/loading');
            setTimeout(() => {
                if (tempwindow) tempwindow.location = uri.split("|")[0]; // 后更改页面地址
            }, 2000)
        }, 1)
    }
    //启动容器
    startDocker = () => {
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
        }).then(response => {
            let { data, status, uri, proList, dockerIP } = response.data;
            this.setState({
                loading: false,
                dockerType: status,
            });
            switch (status) {
                case 0:
                    //未登陆
                    message.error(data, 2);
                    break;
                case 1:
                    //启动docker后返回值为路径
                    this.setState({
                        listener: true,
                        uri,
                        started: true,
                        dockerID: data.dockerID,
                        dockerIP: data.dockerIP,
                        vport: data.vport,
                    });
                    break;
                case 2:
                    //常规docker返回结果
                    if (proList.length === 1) {
                        this.getPram(1);
                        this.setState({ modelIndex: 1 });
                    }
                    this.setState({
                        listener: true,
                        dockerID: data.dockerID,
                        dockerIP: data.dockerIP,
                        vport: data.vport,
                        currentStep: currentStep + 1,
                        proList,
                        started: true
                    });
                    break;
                case 3:
                    message.error(data, 2);
                    break;
                case 4:
                    //资源使用过多
                    message.error(data, 2);
                    this.setState({
                        listener: true,
                        dockerIP,
                    });
                    break;
                case 5:
                    //重&磁docker返回结果
                    this.setState({
                        listener: true,
                        baseUrl: uri,
                        started: true,
                        uri
                    });
                    break;
                default:
                    break;
            }
        }).catch(error => {
            message.error("服务器无响应")
            this.setState({ loading: false });
        });
    }
    //选择模型
    handleSelectModel = value => {
        this.setState({
            modelIndex: value,
            funcName: this.state.proList[value - 1],
            texts: [],
            selects: [],
            radios: [],
            checkBoxs: [],
            textAreas: [],
            uploadBoxs: [],
            inputFiles: [],
            uploadFileList: []
        });
        this.getPram(value);
    }
    //重&磁选择计算接口
    handleSelectApi = value => {
        //深拷贝apiData对象
        let data = JSON.parse(JSON.stringify(this.state.apiData[value]));
        let { calcApi, requestMethod, vis, params } = data;
        let { texts, selects, radios, checkBoxs, textAreas, uploadBoxs, inputFiles } = params;
        this.setState({
            texts: [],
            selects: [],
            radios: [],
            checkBoxs: [],
            textAreas: [],
            uploadBoxs: [],
            inputFiles: [],
        }, () => {
            this.setState({
                loading: false,
                apiName: value,
                calcApi,
                requestMethod,
                needVis: vis,
                texts: texts ? texts : [],
                selects: selects ? selects : [],
                radios: radios ? radios : [],
                checkBoxs: checkBoxs ? checkBoxs : [],
                textAreas: textAreas ? textAreas : [],
                uploadBoxs: uploadBoxs ? uploadBoxs : [],
                inputFiles: inputFiles ? inputFiles : [],
                calcResData: {},
                calcStatus: true,
            });
        })
    }
    //获取参数
    getPram = index => {
        let { idenMod, nowStep } = this.state;
        axios({
            method: 'post',
            url: api + 'render',
            data: {
                idenMod: idenMod * Math.pow(10, nowStep - 1),
                index
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            let { texts, selects, radios, checkBoxs, textAreas, uploadBoxs, inputFiles } = response.data.projectparams;
            this.setState({
                texts: texts ? texts : [],
                selects: selects ? selects : [],
                radios: radios ? radios : [],
                checkBoxs: checkBoxs ? checkBoxs : [],
                textAreas: textAreas ? textAreas : [],
                uploadBoxs: uploadBoxs ? uploadBoxs : [],
                inputFiles: inputFiles ? inputFiles : [],
                uploadFileList: uploadBoxs ? new Array(uploadBoxs.length) : []
            });
        }).catch(error => {
            message.error("服务器无响应");
        });
    }
    //提交参数文件
    createPFile = e => {
        e.preventDefault();
        let { texts, selects, radios, checkBoxs, textAreas, inputFiles, idenMod, uploadBoxs, dockerID, dockerIP, vport, currentStep, moduleName, currentStep2, nowStep, modelIndex, dockerType, baseUrl, calcApi, requestMethod, apiName } = this.state;
        if (dockerType === 5) {
            if (calcApi) {
                // if (checkNullvalue(texts) && checkNullvalue(selects) && checkNullvalue(radios) && checkNullvalue(checkBoxs) && checkNullvalue(textAreas)) {
                this.props.form.validateFields({ force: true }, (err, values) => {
                    if (!err) {
                        // baseUrl = "http://139.217.82.132:5050";
                        baseUrl = "http://192.168.0.161:9999";
                        if (requestMethod === "get") {
                            let params = {};
                            for (let i = 0, len = texts.length; i < len; i++) {
                                params[texts[i].paramName] = isNaN(Number(texts[i].currentValue)) ? texts[i].currentValue : Number(texts[i].currentValue);
                            }
                            this.setState({
                                loading: true,
                                isComputing: true,
                                calcStatus: true
                            });
                            axios.get(baseUrl + calcApi, { params }
                            ).then(res => {
                                this.setState({
                                    loading: false,
                                    isComputing: false,
                                    calcResData: typeof (res.data) === "string" ? { message: res.data } : res.data
                                });
                            }).catch(err => {
                                this.setState({ loading: false, isComputing: false, calcStatus: false });
                                message.error(err.message);
                            });
                        } else if (requestMethod === "post") {
                            let params = new FormData();
                            for (let i = 0; i < texts.length; i++) {
                                params.append(texts[i].paramName, isNaN(Number(texts[i].currentValue)) ? texts[i].currentValue : Number(texts[i].currentValue));
                            }
                            new Promise((resolve, reject) => {
                                let length = inputFiles ? inputFiles.length : 0, num = 0;
                                if (length === 0) {
                                    resolve();
                                } else {
                                    for (let i = 0; i < length; i++) {
                                        if (inputFiles[i].required === false) {
                                            if (inputFiles[i].currentValue) {
                                                params.append(inputFiles[i].paramName, inputFiles[i].currentValue);
                                                num++;
                                                if (num === length) {
                                                    resolve();
                                                }
                                            } else if (inputFiles[i].defaultValue) {
                                                // eslint-disable-next-line 
                                                axios.get("./static/data/" + inputFiles[i].defaultValue.split(",")[0]).then(res => {
                                                    params.append(inputFiles[i].paramName, new Blob([res.data]));
                                                    num++;
                                                    if (num === length) {
                                                        resolve();
                                                    }
                                                });
                                            } else {
                                                num++;
                                                if (num === length) {
                                                    resolve();
                                                }
                                            }
                                        } else {
                                            if (inputFiles[i].currentValue) {
                                                params.append(inputFiles[i].paramName, inputFiles[i].currentValue);
                                                num++;
                                                if (num === length) {
                                                    resolve();
                                                }
                                            } else if (inputFiles[i].defaultValue && apiName !== "计算完全布格异常") {
                                                // eslint-disable-next-line 
                                                axios.get("./static/data/" + inputFiles[i].defaultValue.split(",")[0]).then(res => {
                                                    params.append(inputFiles[i].paramName, new Blob([res.data]));
                                                    num++;
                                                    if (num === length) {
                                                        resolve();
                                                    }
                                                });
                                            } else {
                                                message.error(`请上传${inputFiles[i].paramName}参数对应的文件`);
                                                reject();
                                            }
                                        }
                                    }
                                }
                            }).then(() => {
                                this.setState({
                                    loading: true,
                                    isComputing: true,
                                    calcStatus: true
                                });
                                axios({
                                    method: 'post',
                                    url: baseUrl + calcApi,
                                    data: params,
                                    headers: {
                                        'Content-Type': 'multipart/formdata'
                                    }
                                }).then(res => {
                                    console.log(typeof (res.data));
                                    if (apiName === "最小曲率补空白") {
                                        this.setState({
                                            loading: false,
                                            isComputing: false,
                                            calcResData: typeof (res.data) === "string" ? JSON.parse(res.data.replace(/NaN/g, 0)) : res.data
                                        });
                                    } else {
                                        this.setState({
                                            loading: false,
                                            isComputing: false,
                                            calcResData: typeof (res.data) === "string" ? { message: res.data } : res.data
                                        });
                                    }
                                }).catch(err => {
                                    this.setState({ loading: false, isComputing: false, calcStatus: false });
                                    message.error(err.message);
                                });
                            }
                            )
                        }
                    }
                })
                // }
            } else {
                message.error("请选择模型");
            }
        } else {
            if (modelIndex) {
                if (checkNullvalue(texts) && checkNullvalue(selects) && checkNullvalue(radios) && checkNullvalue(checkBoxs) && checkNullvalue(textAreas)) {
                    this.props.form.validateFields({ force: true }, (err, values) => {
                        if (!err) {
                            this.setState({
                                loading: true,
                            });
                            if (Array.isArray(texts)) {
                                for (let i = 0, len = texts.length; i < len; i++) {
                                    if (texts[i].paramName === "iter_max" || texts[i].paramName === "time_after_earthquake") {
                                        texts[i].currentValue = "+" + texts[i].currentValue;
                                    }
                                }
                            }
                            let makeJson = `{ "texts" :${JSON.stringify(texts)},"selects" :${JSON.stringify(selects)},"radios" :${JSON.stringify(radios)},"checkBoxs" :${JSON.stringify(checkBoxs)},"textAreas" :${JSON.stringify(textAreas)},"uploadBoxs" :${JSON.stringify(uploadBoxs)}}`;
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
                                    index: modelIndex
                                },
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }).then(response => {
                                let { data, status } = response.data;
                                this.setState({ loading: false });
                                if (status === "success") {
                                    message.success(data, 2);
                                    if (nowStep > 1) {
                                        this.setState({
                                            currentStep2: currentStep2 + 1
                                        });
                                    } else {
                                        this.setState({
                                            currentStep: currentStep + 1
                                        });
                                    }
                                } else if (status === "fail") {
                                    message.error(data, 2);
                                }
                            }).catch(error => {
                                this.setState({ loading: false });
                                message.error("服务器无响应");
                            });
                        }
                    })
                }
            } else {
                message.error("请选择模型获取参数列表", 2)
            }
        }
    }
    //运行
    runDocker = () => {
        let { username, idenMod, dockerID, dockerIP, vport, nowStep, stepNum, modelIndex, appName, funcName } = this.state;
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
                index: modelIndex,
                modName: appName,
                stepNum,
                funcName
            },
            headers: {
                'Content-Type': 'application/json',
            }
        }).then(response => {
            let { status, data } = response.data;
            clearInterval(this.logTimer);
            this.setState({
                loading: false,
                computed: true,
                isComputing: false,
                disabled: nowStep === stepNum ? true : false,
                modalVisible: false,
                resType: status
            });
            switch (status) {
                //未登陆
                case 0:
                    message.error(data);
                    break;
                case 1:
                    message.error(data);
                    break;
                //成功
                case 2:
                    if (!Array.isArray(data)) {
                        let resFileList = [];
                        for (let key in data) {
                            resFileList.push({
                                name: key,
                                suffix: key.split(".").pop(),
                                absolutePath: data[key][0],
                                staticPath: data[key][1],
                                size: data[key][2] ? +data[key][2] : "",
                            });
                        }
                        Object.keys(data).map((item, index) => resFileList[index].key = index);
                        this.setState({
                            resultFileList: resFileList
                        });
                    }
                    this.setState({
                        resultData: data
                    });
                    break;
                default:
                    break;
            }
        }).catch(error => {
            message.error("服务器无响应")
            this.setState({
                loading: false,
                isComputing: false,
                computed: false,
            });
        });
    }
    //查看运行状态
    handleViewInfo = () => {
        let { dockerID, dockerIP } = this.state;
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
            }).then(res => {
                let data = res.data.data.split("Calculation begins...");
                // eslint-disable-next-line
                data = data.pop().replace(/\u0008/g, "").split("\r\n");
                for (let i = 0; i < data.length; i++) {
                    let p = data[i];
                    if (p.toLowerCase().replace(/ +/g, "").indexOf("matlab") > -1 || data[i].indexOf("r:/status") > -1 || data[i].indexOf(".go:") > -1) {
                        data.splice(i, 1);
                        i -= 1;
                    }
                }
                this.setState({ logInfoArray: data });
            }).catch(() => {
                times += 1;
                if (times > 4) {
                    message.error("服务器无响应");
                    clearInterval(this.logTimer);
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
        }).then(res => {
            if (res.data.status === 1) {
                message.success("应用已停止");
                sessionStorage.setItem("nowStep", 1);
                this.setState({ isComputing: false });
                setTimeout(() => {
                    window.location.reload()
                }, 1)
            } else if (res.data.status === 0) {
                message.error("应用停止失败");
            }
        }).catch(() => {
            message.error("服务器无响应");
        });
    }
    //下一步
    nextStep = () => {
        let { nowStep, idenMod, modelIndex } = this.state;
        this.setState({
            nowStep: nowStep + 1,
            currentStep2: 0,
            computed: false,
            resType: undefined,
            calcResData: {},
            isComputing: false
        });
        if (nowStep === 2 && idenMod === 222) {
            this.props.history.push("/operateData");
        } else {
            axios({
                method: 'post',
                url: api + 'render',
                data: {
                    idenMod: idenMod * Math.pow(10, nowStep),
                    index: modelIndex
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                let { texts, selects, radios, checkBoxs, textAreas, uploadBoxs } = response.data.projectparams;
                this.setState({
                    texts: texts ? texts : [],
                    selects: selects ? selects : [],
                    radios: radios ? radios : [],
                    checkBoxs: checkBoxs ? checkBoxs : [],
                    textAreas: textAreas ? textAreas : [],
                    uploadBoxs: uploadBoxs ? uploadBoxs : [],
                });
            }).catch(error => {
                message.error("服务器无响应");
            });
        }
    }
    handleDownload = path => {
        let { dockerIP, vport } = this.state;
        switch (path.split(".").pop()) {
            case "txt":
            case "dat":
            case "msh":
            case "field":
            case "rho":
            case "vel":
                window.open("http://" + dockerIP + ":" + vport + "/output/" + path)
                break;
            case "pdf":
                this.setState({ filePath: path, fileModalVisible: true });
                break;
            case "jpg":
            case "png":
            case "jpeg":
            case "tiff":
                this.setState({ filePath: path, imgModalVisible: true });
                break;
            default:
                let elementA = document.createElement('a');
                elementA.style.display = 'none';
                elementA.href = "http://" + dockerIP + ":" + vport + "/output/" + path;
                document.body.appendChild(elementA);
                elementA.click();
                document.body.removeChild(elementA);
                break;
        }
    }
    downloadData = () => {
        let { calcResData, apiName, baseUrl } = this.state;
        // baseUrl = "http://139.217.82.132:5050";
        baseUrl = "http://192.168.0.161:9999";
        if (apiName === "计算完全布格异常") {
            let elementA = document.createElement('a');
            //隐藏dom点不显示x
            elementA.style.display = 'none';
            elementA.href = baseUrl + "/downloadfile?fullfilename=" + calcResData.message;
            document.body.appendChild(elementA);
            elementA.click();
            document.body.removeChild(elementA);
        } else {
            let JSONToCSVConvertor = jsonData => {
                let length = 0;
                let csv = "", row = "";
                for (let key in jsonData) {
                    if (!Array.isArray(jsonData[key])) {
                        jsonData[key] = [jsonData[key]];
                    }
                    length = length < jsonData[key].length ? jsonData[key].length : length;
                    row += key + ",";
                }
                csv += row.substring(0, row.lastIndexOf(',')) + "\r\n";
                for (let i = 0; i < length; i++) {
                    let row = "";
                    for (let key in jsonData) {
                        row += (jsonData[key][i] === undefined ? "" : jsonData[key][i]) + ",";
                    }
                    csv += row.substring(0, row.lastIndexOf(',')) + "\r\n";
                }
                return csv;
            };
            let elementA = document.createElement('a');
            elementA.download = apiName + "_resData_" + +new Date() + ".csv";//文件名
            //隐藏dom点不显示
            elementA.style.display = 'none';
            let blob = new Blob([JSONToCSVConvertor(calcResData)]);//二进制
            elementA.href = URL.createObjectURL(blob);
            document.body.appendChild(elementA);
            elementA.click();
            document.body.removeChild(elementA);
        }
    }
    componentWillUnmount() {
        if (this.props.history.location.pathname !== "/operateData") {
            sessionStorage.removeItem("appName",);
            sessionStorage.removeItem("moduleName");
            sessionStorage.removeItem("dockerType");
            sessionStorage.removeItem("idenMod");
            sessionStorage.removeItem("nowStep");
            sessionStorage.removeItem("stepNum");
            sessionStorage.removeItem("dockerID");
            sessionStorage.removeItem("dockerIP");
            sessionStorage.removeItem("vport");
            sessionStorage.removeItem("modelIndex");
            sessionStorage.removeItem("baseUrl");
            sessionStorage.removeItem("funcName");
        }
        this.setState = () => {
            return;
        }
    }
    handleViewTdata = () => {
        let { dockerIP, vport, modelIndex, idenMod } = this.state;
        this.setState({
            tdataDrawerVisible: true,
            fileListLoading: true,
            tdataFileListData: []
        })
        axios.get("http://" + dockerIP + ":" + vport + "/fileList",
            {
                params: {
                    index: modelIndex,
                    idenMod,
                    tData: 1
                }
            }).then(res => {
                let { data } = res.data;
                let resFileList = [];
                for (let key in data) {
                    resFileList.push({
                        name: key,
                        suffix: key.split(".").pop(),
                        absolutePath: data[key][0],
                        staticPath: data[key][1],
                        size: data[key][2] ? +data[key][2] : "",
                    })
                }
                Object.keys(data).map((item, index) => resFileList[index].key = index)
                this.setState({
                    fileListLoading: false,
                    tdataFileListData: resFileList,
                })
            }).catch(err => {
                message.error("获取结果失败");
            })
    }
    handleOpenVisModal = info => {
        let { absolutePath, name } = info;
        let { dockerIP, vport, idenMod, resultFileList } = this.state;
        if ((idenMod === 411 || idenMod === 412) && absolutePath.split("/").pop() === "mod.csv") {
            message.warn("数据错误，无法可视化");
        } if (idenMod === 421) {
            this.setState({ dataLoading: true });
            if (name.indexOf("xoy") > -1) {
                axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                    params: { path: absolutePath }
                }).then(res => {
                    let { data } = res.data;
                    if (Array.isArray(data) && data.length > 0) {
                        this.setState({
                            visVisible: true,
                            dataLoading: false,
                            calcResData: data,
                            dataType: "2d"
                        })
                    } else {
                        message.warn("无数据");
                        this.setState({
                            dataLoading: false
                        })
                    }
                }).catch(err => {
                    this.setState({
                        dataLoading: false
                    })
                });
            } else {
                let path_25D = "", path_3D = "";
                if (name.indexOf("25D") > -1) {
                    path_25D = absolutePath;
                    for (let i = 0; i < resultFileList.length; i++) {
                        if (resultFileList[i].name === name.replace("25D", "3D")) {
                            path_3D = resultFileList[i].absolutePath;
                        }
                    }
                } else if (name.indexOf("3D") > -1) {
                    path_3D = absolutePath;
                    for (let i = 0; i < resultFileList.length; i++) {
                        if (resultFileList[i].name === name.replace("3D", "25D")) {
                            path_25D = resultFileList[i].absolutePath;
                        }
                    }
                }
                let resTime = 0, calcResData = {};
                let getData = (path, dataName) => {
                    axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                        params: { path }
                    }).then(res => {
                        let { data } = res.data;
                        if (Array.isArray(data) && data.length > 0) {
                            calcResData[dataName] = data;
                            resTime += 1;
                        } else {
                            message.warn("无数据");
                            this.setState({
                                dataLoading: false
                            })
                        }
                        if (resTime === 2) {
                            this.setState({
                                visVisible: true,
                                dataLoading: false,
                                calcResData,
                                dataType: "line"
                            })
                        }
                    }).catch(err => {
                        this.setState({
                            dataLoading: false
                        })
                    });
                }
                getData(path_25D, "data_25D");
                getData(path_3D, "data_3D");
            }
        } if (idenMod === 422) {
            this.setState({ dataLoading: true });
            axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                params: { path: absolutePath }
            }).then(res => {
                let { data } = res.data;
                if (Array.isArray(data) && data.length > 0) {
                    this.setState({
                        calcResData: data,
                        dataType: "single"
                    }, () => {
                        this.setState({
                            visVisible: true,
                            dataLoading: false
                        })
                    });
                } else {
                    this.checkTimer = setInterval(this.pollingData, 5000);
                    message.warn("无数据");
                    this.setState({
                        dataLoading: false
                    })
                }
            }).catch(err => {
                this.checkTimer = setInterval(this.pollingData, 5000);
                this.setState({
                    dataLoading: false
                })
            });
        } else {
            this.setState({ dataLoading: true });
            axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                params: { path: absolutePath }
            }).then(res => {
                let { data } = res.data;
                if (Array.isArray(data) && data.length > 0) {
                    if (idenMod !== 51) {
                        data = data.map(item => item.map(item2 => Number(item2)));
                    }
                    let dataType = "";
                    if (info.suffix === "csv") {
                        if (Array.isArray(data[0])) {
                            if (data[0].length === 1 || data[0].length === 2) {
                                dataType = "1d";
                            } else if (data[0].length === 3) {
                                dataType = "2d";
                            } else if (data[0].length === 4) {
                                dataType = "3d";
                            } else if (data[0].length > 4) {
                                dataType = "matrix";
                            } else {
                                dataType = undefined;
                            }
                        }
                    } else if (info.suffix === "msh") {
                        dataType = "msh";
                    } else if (info.suffix === "txt") {
                        dataType = "txt";
                    }
                    this.setState({
                        calcResData: data,
                        dataType
                    }, () => {
                        this.setState({
                            visVisible: true,
                            dataLoading: false
                        })
                    });
                } else {
                    message.warn("无数据");
                    this.setState({
                        dataLoading: false
                    })
                }
            }).catch(err => {
                this.setState({
                    dataLoading: false
                })
            });
        }
    }
    handleCloseTdataDrawer = () => {
        this.setState({
            tdataDrawerVisible: false,
            customElements: {}
        })
    }
    handleCancleFileModal = () => {
        this.setState({ fileModalVisible: false });
        document.getElementsByTagName("body")[0].style.overflow = "auto";
    }
    handleCancleImgModal = () => {
        this.setState({ imgModalVisible: false });
        document.getElementsByTagName("body")[0].style.overflow = "auto";
    }
    handleCancleLogModal = () => {
        clearInterval(this.logTimer);
        this.setState({ logModalVisible: false });
        document.getElementsByTagName("body")[0].style.overflow = "auto";
    }
    getExampleFile = (paramName) => {
        let { dockerIP, vport, idenMod } = this.state;
        switch (idenMod) {
            case 51:
                if (paramName === "MatrixFile") {
                    window.open("http://" + dockerIP + ":" + vport + "/output/stiff.mtx")
                } else if (paramName === "RightHandFile") {
                    window.open("http://" + dockerIP + ":" + vport + "/output/force.txt");
                }
                break;
            case 52:
                if (paramName === "input_Function_file") {
                    window.open("http://" + dockerIP + ":" + vport + "/output/Fk.m")
                } else if (paramName === "input_Jacobi_file") {
                    window.open("http://" + dockerIP + ":" + vport + "/output/JFk.m");
                }
                break;
            case 311:
            case 312:
            case 321:
            case 322:
            case 323:
            case 324:
            case 325:
                var elementA = document.createElement('a');
                elementA.download = paramName;//文件名
                //隐藏dom点不显示
                elementA.style.display = 'none';
                elementA.href = "./static/data/" + paramName;
                document.body.appendChild(elementA);
                elementA.click();
                document.body.removeChild(elementA);
                break;
            default:
                break;
        }
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
        let { apiData, username, appName, texts, selects, radios, checkBoxs, textAreas, uploadBoxs, inputFiles, uploadFileList, loading, listener, currentStep,
            started, resultData, resultFileList, isComputing, idenMod, dockerID, dockerIP, vport, logInfoArray, modelIndex, modalVisible, uri, dockerType,
            computed, nowStep, stepNum, currentStep2, disabled, proList, calcResData, calcStatus, resType, visVisible, apiName, toggle,
            tdataDrawerVisible, tdataFileListData, fileListLoading, dataLoading, fileModalVisible, imgModalVisible, filePath, dataType, needVis
        } = this.state;
        const { getFieldDecorator } = this.props.form;
        return (
            <div id="calculate">
                <Header className="calculate-header">
                    <Link to="/home">
                        <div className="calculate-logo" title="综合地球物理联合反演与解释一体化平台">
                            <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" />
                        </div>
                    </Link>
                    <span className="calculate-title" title={stepNum > 1 ? `${appName}_${nowStep}` : appName}>{stepNum > 1 ? `${appName}_${nowStep}` : appName}</span>
                    <IconFont className="calculate-quit" onClick={() => this.props.history.goBack()} type="earthfanhui" />
                </Header>
                <Content className="calculate-content">
                    <Row style={{ height: "100%", width: "100%" }}>
                        <Col md={8} sm={24} xs={24} className="calculate-col">
                            <Card title="参数数据" bordered={false} className="params-card">
                                {dockerType === 2 && nowStep !== 3 &&
                                    (
                                        nowStep > 1 ?
                                            <Steps current={currentStep2}>
                                                <Step title="提交参数"></Step>
                                                <Step title="应用服务计算"></Step>
                                            </Steps>
                                            :
                                            <Steps current={currentStep}>
                                                <Step title="启动容器"></Step>
                                                <Step title="提交参数"></Step>
                                                <Step title="应用服务计算"></Step>
                                            </Steps>
                                    )
                                }
                                <div>
                                    {/* {(idenMod === 51 || idenMod === 52) &&
                                         <div style={{ fontSize: 18, textIndent: "2em", lineHeight: 2 }}>
                                             <p>{idenMod === 52 && "非"}线性求解器基于Trilinos软件包集成，采用“MPI+Openmp”的并行框架实现，能够在对称多处理机（SMP，多核、共享内存）、大规模并行处理机（MPP，多处理器、分布内存）以及分布式集群等不同硬件架构上运行。</p>
                                             <p>对快速的解决地质问题，设计并且实现工程常用的大规模稀疏矩阵直接解法和并行化的代数多重网格法，已经实现的算法模块如图包括CG、MINRES、BICGSTAB、GMRES四类基本求解器，以及包括Jacobi、Gauss-Seidel、SSOR超松弛迭代、IC、ILU、ICT等基本预条件和代数多重网格法AMG在内的可扩展预条件算法库，所有的算法正确性已经得到验证。</p>
                                         </div>
                                     } */}
                                    {nowStep === 1 && currentStep === 0 && dockerType !== 5 &&
                                        <div style={{ textAlign: "center", paddingTop: 50 }}>
                                            <Button type="primary" loading={loading} disabled={!idenMod || started} onClick={this.startDocker}>{started ? "已启动" : "启动容器"}</Button>
                                        </div>
                                    }
                                    {(nowStep === 1 && currentStep === 1) || (nowStep > 1 && currentStep2 === 0 && nowStep !== 3) || dockerType === 5 ?
                                        <>
                                            {idenMod === 52 &&
                                                <div className="mod-help">
                                                    <p><span>描述：</span>用高阶信赖域LM方法求解非线性方程组F(x) = 0，其中x和F(x)是n维向量.</p>
                                                    <p><span>输入说明：</span></p>
                                                    <p>x0： 初始点 （默认 0）</p>
                                                    <p>F(x)：定义F(x)函数的octave脚本文件（函数名需和文件名一致）</p>
                                                    <p>J(x): 定义Jacobi矩阵的octave脚本文件（函数名需和文件名一致）</p>
                                                    <p>m：LM修正步数 （默认 1）</p>
                                                    <p>delta: 阻尼参数 [1, 2] （默认 1）</p>
                                                    <p>tol：最小容许误差 （默认 1e-5）</p>
                                                    <p><span>输出说明：</span></p>
                                                    <p>x: 迭代结果</p>
                                                    <p>val: 迭代后F(x)的模量</p>
                                                    <p>NF：F(x)总计算次数</p>
                                                    <p>NJ：J(x)总计算次数</p>
                                                </div>
                                            }
                                            {proList.length > 1 &&
                                                <Row style={{ marginTop: 20 }}>
                                                    <Col xs={24} sm={8} className="ant-form-item-label">
                                                        <label style={{ whiteSpace: "nowrap", fontWeight: 500, lineHeight: "32px" }}>请选择测试模型</label>
                                                    </Col>
                                                    <Col xs={24} sm={16} className="ant-form-item-control-wrapper ant-form-item-control">
                                                        <Select onChange={this.handleSelectModel} placeholder="--请选择测试模型--" style={{ width: "100%" }}>
                                                            {proList.map((value, index) =>
                                                                <Option key={value} value={index + 1}>
                                                                    {value}
                                                                </Option>
                                                            )}
                                                        </Select>
                                                    </Col>
                                                </Row>
                                            }
                                            {dockerType === 5 &&
                                                <Row>
                                                    <Col xs={24} sm={8} className="ant-form-item-label">
                                                        <label style={{ whiteSpace: "nowrap", fontWeight: 500, lineHeight: "32px" }}>请选择模型</label>
                                                    </Col>
                                                    <Col xs={24} sm={16} className="ant-form-item-control-wrapper ant-form-item-control">
                                                        <Select onChange={this.handleSelectApi} placeholder="--请选择模型--" style={{ width: "100%" }}>
                                                            {Object.keys(apiData).map((value, index) =>
                                                                <Option key={value} value={value}>
                                                                    {value}
                                                                </Option>
                                                            )}
                                                        </Select>
                                                    </Col>
                                                </Row>
                                            }
                                            {started &&
                                                <div style={{ paddingTop: 30 }}>
                                                    {(texts === undefined && selects === undefined && uploadBoxs === undefined && radios === undefined && checkBoxs === undefined && textAreas === undefined && inputFiles === undefined) ?
                                                        <Result
                                                            status="warning"
                                                            title="参数列表获取失败!"
                                                            style={{ paddingTop: "80px" }}
                                                        >
                                                        </Result>
                                                        :
                                                        <Form {...formItemLayout} onSubmit={this.createPFile} className="calculate-form">
                                                            {inputFiles === null ? null : inputFiles.map(({ paramName, paramNameCN, tip, currentValue, defaultValue }, index) =>
                                                                <div style={{ position: "relative" }} key={index}>
                                                                    <Form.Item className="input-file-wrapper" label={<label title={paramNameCN}>{paramName}</label>}>
                                                                        <Tooltip title={apiName !== "上传文件" && ((tip || paramNameCN) + (defaultValue && "，若不上传，则使用默认文件" + defaultValue.split(",")[0]))}>
                                                                            <span className="ant-btn ant-btn-default input-file">
                                                                                选择文件
                                                                                <input type="file" id="file" onChange={this.changeInputFile.bind(this, index)} />
                                                                            </span>
                                                                        </Tooltip>
                                                                        <div className="file-name" title={currentValue && currentValue.name}>{currentValue && currentValue.name}</div>
                                                                    </Form.Item>
                                                                    {(idenMod === 311 || idenMod === 312 || idenMod === 321 || idenMod === 322 || idenMod === 323 || idenMod === 324 || idenMod === 325 || apiName === "计算完全布格异常") && apiName !== "上传文件" && defaultValue &&
                                                                        <div className="file-icon file-icon-2" onClick={this.getExampleFile.bind(this, defaultValue.split(",")[0])}>
                                                                            <Icon type="download" title="获取示例文件" />
                                                                            <span className="file-name">示例文件</span>
                                                                        </div>
                                                                    }
                                                                </div>
                                                            )}
                                                            {texts === null ? null : texts.map(({ paramName, paramNameCN, tip, currentValue, type, enumList, max, min, required }, index) =>
                                                                <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <Tooltip title={tip || paramNameCN}>
                                                                        {getFieldDecorator(paramName, {
                                                                            rules: [{
                                                                                validator: (rule, value, callback) => {
                                                                                    switch (type) {
                                                                                        case "string":
                                                                                            if (required === false && !value) {
                                                                                                callback();
                                                                                            } else {
                                                                                                if (!value) {
                                                                                                    callback(`${paramName}的值不能为空!`);
                                                                                                } else {
                                                                                                    callback();
                                                                                                };
                                                                                            }
                                                                                            break;
                                                                                        case "boolean":
                                                                                            if (required === false && !value) {
                                                                                                callback();
                                                                                            } else {
                                                                                                if (!value) {
                                                                                                    callback(`${paramName}的值不能为空!`);
                                                                                                } else if (/\s/.test(value)) {
                                                                                                    callback(`${paramName}的值不能包含空格`);
                                                                                                } else if (!["true", "false"].includes(value.toLowerCase())) {
                                                                                                    callback('请输入布尔类型值true或false');
                                                                                                } else {
                                                                                                    callback();
                                                                                                };
                                                                                            }
                                                                                            break;
                                                                                        case "enum":
                                                                                            if (required === false && !value) {
                                                                                                callback();
                                                                                            } else {
                                                                                                if (!value) {
                                                                                                    callback(`${paramName}的值不能为空!`);
                                                                                                } else if (/\s/.test(value)) {
                                                                                                    callback(`${paramName}的值不能包含空格`);
                                                                                                } else if (!enumList.includes(value)) {
                                                                                                    callback(`${paramName}的值只能为[${enumList}]`);
                                                                                                } else {
                                                                                                    callback();
                                                                                                };
                                                                                            }
                                                                                            break;
                                                                                        case "int":
                                                                                            if (required === false && !value) {
                                                                                                callback();
                                                                                            } else {
                                                                                                if (!value) {
                                                                                                    callback(`${paramName}的值不能为空!`);
                                                                                                } else if (/\s/.test(value)) {
                                                                                                    callback(`${paramName}的值不能包含空格`);
                                                                                                } else if (!/^-?\d*$/.test(value)) {
                                                                                                    callback(`${paramName}的值只能为整型`);
                                                                                                } else if (max && Number(value) > Number(max)) {
                                                                                                    callback(`${paramName}的值不能大于${max}`);
                                                                                                } else if (min && Number(value) < Number(min)) {
                                                                                                    callback(`${paramName}的值不能小于${min}`);
                                                                                                } else {
                                                                                                    callback();
                                                                                                };
                                                                                            }
                                                                                            break;
                                                                                        case "double":
                                                                                            if (required === false && !value) {
                                                                                                callback();
                                                                                            } else {
                                                                                                if (!value) {
                                                                                                    callback(`${paramName}的值不能为空!`);
                                                                                                } else if (/\s/.test(value)) {
                                                                                                    callback(`${paramName}的值不能包含空格`);
                                                                                                } else if (isNaN(Number(value))) {
                                                                                                    callback(`${paramName}的值只能为${idenMod === 311 || idenMod === 312 ? "数字类型" : "浮点型"}`);
                                                                                                } else if (max && Number(value) > Number(max)) {
                                                                                                    callback(`${paramName}的值不能大于${max}`);
                                                                                                } else if (min && Number(value) < Number(min)) {
                                                                                                    callback(`${paramName}的值不能小于${min}`);
                                                                                                } else {
                                                                                                    callback();
                                                                                                };
                                                                                            }
                                                                                            break;
                                                                                        default:
                                                                                            callback();
                                                                                            break;
                                                                                    }
                                                                                }
                                                                            }],
                                                                            initialValue: currentValue
                                                                        })(
                                                                            <Input onChange={this.changeText.bind(this, index)} />
                                                                        )}
                                                                    </Tooltip>
                                                                </Form.Item>
                                                            )}
                                                            {selects === null ? null : selects.map(({ paramName, paramNameCN, defaultValue, currentValue }, index) =>
                                                                <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <Select onChange={this.changeOption.bind(this, index)} value={currentValue}>
                                                                        {defaultValue.map((value, index2) =>
                                                                            <Option key={value} value={value}>
                                                                                {value}
                                                                            </Option>
                                                                        )}
                                                                    </Select>
                                                                </Form.Item>
                                                            )}
                                                            {uploadBoxs === null || uploadBoxs === undefined ? null : uploadBoxs.map(({ paramNameCN, paramName, tip, enumList }, index) =>
                                                                <div style={{ position: "relative" }} key={index}>
                                                                    <Form.Item label={<label title={paramNameCN}>{paramName}</label>}>
                                                                        <Tooltip title={tip || (enumList && `请上传${enumList.join("，")}文件`) || paramNameCN}>
                                                                            <Upload
                                                                                name="uploadParamFile"
                                                                                action={"http://" + dockerIP + ":" + vport + "/upFile"}
                                                                                data={{
                                                                                    username,
                                                                                    idenMod: idenMod * Math.pow(10, nowStep - 1),
                                                                                    dockerID,
                                                                                    dockerIP,
                                                                                    vport,
                                                                                    index: modelIndex,
                                                                                    fileIndex: index + 1
                                                                                }}
                                                                                onChange={this.changeUpload.bind(this, index)}
                                                                                accept={enumList && enumList.join(",")}
                                                                                fileList={uploadFileList[index]}
                                                                            >
                                                                                <Button type="default"><Icon type="upload" />上传文件</Button>
                                                                            </Upload>
                                                                            <></>{/* 加空标签是为了显示tooltip */}
                                                                        </Tooltip>
                                                                    </Form.Item>
                                                                    {(
                                                                        (idenMod === 51 && (paramName === "MatrixFile" || paramName === "RightHandFile")) ||
                                                                        (idenMod === 52 && (paramName === "input_Function_file" || paramName === "input_Jacobi_file"))
                                                                    ) &&
                                                                        <div className="file-icon" onClick={this.getExampleFile.bind(this, paramName)}>
                                                                            <Icon type="download" title="获取示例文件" />
                                                                            <span className="file-name">示例文件</span>
                                                                        </div>
                                                                    }
                                                                </div>
                                                            )}
                                                            {radios === null ? null : radios.map(({ paramName, paramNameCN, defaultValue, currentValue }, index) =>
                                                                <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <RadioGroup onChange={this.changeRadio.bind(this, index)} value={currentValue}>
                                                                        {defaultValue.map((value, index2) => {
                                                                            return (
                                                                                <Radio key={index2} value={value}>
                                                                                    {value}
                                                                                </Radio>
                                                                            );
                                                                        })}
                                                                    </RadioGroup>
                                                                </Form.Item>
                                                            )}
                                                            {checkBoxs === null ? null : checkBoxs.map(({ paramName, paramNameCN, defaultValue, currentValue }, index) =>
                                                                <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <CheckboxGroup options={defaultValue} value={currentValue} onChange={this.changeCheck.bind(this, index)} />
                                                                </Form.Item>
                                                            )}
                                                            {textAreas === null ? null : textAreas.map(({ paramName, paramNameCN, tip, currentValue }, index) =>
                                                                <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <Tooltip title={tip || paramNameCN}>
                                                                        <TextArea autoSize={{ minRows: 4, maxRows: 2000 }} cols={10} value={currentValue} onChange={this.changeTextarea.bind(this, index)} />
                                                                    </Tooltip>
                                                                </Form.Item>
                                                            )}
                                                            <Row className="app-button">
                                                                <Button type="primary" htmlType="submit" loading={loading}>提交参数</Button>
                                                            </Row>
                                                        </Form>
                                                    }
                                                </div>
                                            }
                                        </>
                                        : null
                                    }
                                    {(nowStep === 1 && currentStep === 2) || (nowStep > 1 && currentStep2 === 1 && nowStep !== 3) ?
                                        <div style={{ textAlign: "center", paddingTop: 50, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", alignItems: "center" }}>
                                            {nowStep < stepNum && computed ?
                                                <Button type="primary" onClick={this.nextStep} style={{ marginBottom: 20 }}>下一步</Button>
                                                :
                                                <Button type="primary" loading={loading} onClick={this.runDocker} style={{ marginBottom: 20 }} disabled={disabled && computed}>应用服务计算</Button>
                                            }
                                            {isComputing &&
                                                <div className="btn-area">
                                                    <Button type="default" style={{ marginBottom: 16 }} onClick={this.handleViewInfo}>查看运行日志</Button>
                                                    <Modal className="loginfo-modal" visible={modalVisible} onCancel={this.handleCancleModal} footer={null}>
                                                        {logInfoArray.map((item, index) => <p key={index} style={{ marginBottom: 5 }}>{item}</p>)}
                                                    </Modal>
                                                    <Button type="default" style={{ marginBottom: 16 }} onClick={this.handleViewTdata}>查看模板结果</Button>
                                                    <Button type="default" style={{ marginBottom: 16, width: 128 }} onClick={() => { this.props.history.push("/console") }}>前往控制台</Button>
                                                    <Popconfirm placement="top" title={<div style={{ maxWidth: 160 }}>停止后将清空该程序所有数据,请确认是否停止？</div>} onConfirm={this.handleKillContain} okText="确认" cancelText="取消">
                                                        <Button type="danger" style={{ width: 128 }}>停止</Button>
                                                    </Popconfirm>
                                                </div>
                                            }
                                        </div>
                                        : null
                                    }
                                    {nowStep === 3 &&
                                        <div style={{ textAlign: "center", paddingTop: 50 }}>
                                            <Button type="primary" onClick={() => this.props.history.push("/operateData")}>操作数据</Button>
                                        </div>
                                    }
                                </div>
                            </Card>
                        </Col>
                        <Col md={6} sm={24} xs={24} className="calculate-col listener-col">
                            <Card title="运行监控" bordered={false} className="params-card">
                                <div className="normal-listener">
                                    {listener && (dockerIP || uri) ?
                                        <Listener
                                            ip={(dockerType === 2 || dockerType === 4) && dockerIP}
                                            uri={(dockerType === 1 || dockerType === 5) && uri}
                                            toggle={false}
                                        />
                                        :
                                        <Empty description="容器未启动" />
                                    }
                                </div>
                                <div className="tiny-listener">
                                    {listener && (dockerIP || uri) ?
                                        <>
                                            <Listener
                                                ip={(dockerType === 2 || dockerType === 4) && dockerIP}
                                                uri={(dockerType === 1 || dockerType === 5) && uri}
                                                toggle={true}
                                            />
                                            <p className="listener-btn" onClick={() => { this.setState({ toggle: false }) }}>查看详情</p>
                                        </>
                                        :
                                        <span style={{ color: "#bbb" }}>容器未启动</span>
                                    }
                                    <Modal className="listener-modal" visible={!toggle} onCancel={() => { this.setState({ toggle: true }) }} footer={null}>
                                        <Listener
                                            ip={(dockerType === 2 || dockerType === 4) && dockerIP}
                                            uri={(dockerType === 1 || dockerType === 5) && uri}
                                            toggle={false}
                                        />
                                    </Modal>
                                </div>
                            </Card>
                        </Col>
                        <Col md={10} sm={24} xs={24} className="calculate-col">
                            <Card title="运行结果" bordered={false}>
                                {isComputing || resType || Object.keys(calcResData).length > 0 || !calcStatus || computed || started ? null : <Empty description="容器未启动" />}
                                {isComputing &&
                                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                                        <Spin size="large" tip="正在计算..." />
                                    </div>
                                }
                                {dockerType === 1 && uri &&
                                    <div style={{ paddingTop: 35, display: "flex", justifyContent: "space-around" }}>
                                        <Upload
                                            name="uploadFile"
                                            action={uri.split("|")[1] + "/upFile"}
                                            data={{
                                                username,
                                                idenMod: idenMod * Math.pow(10, nowStep - 1),
                                                dockerID,
                                                dockerIP,
                                                vport: vport.split("|")[1],
                                                index: modelIndex,
                                            }}
                                        >
                                            <Button type="default"><Icon type="upload" />上传数据文件</Button>
                                        </Upload>
                                        <Button type="primary" onClick={this.openNewWindow}>查看可视化</Button>
                                        {/* <p>请在新窗口中查看</p> */}
                                        {/* <p>如未弹出新窗口，请点击此<a href={uri.split("|")[0]} target="_blank" rel="noopener noreferrer">链接</a></p> */}
                                    </div>
                                }
                                {dockerType === 2 &&
                                    <Modal className="vis-modal" visible={visVisible} onCancel={() => { this.setState({ visVisible: false }) }} footer={null} destroyOnClose>
                                        <Vis data={calcResData} appName={appName} datatype={dataType} />
                                    </Modal>
                                }
                                {dockerType === 2 && !isComputing ?
                                    (resType === 2 ? (
                                        Array.isArray(resultData) ?
                                            <div>
                                                {resultData.map((item, index) => <p key={index}>{item}</p>)}
                                            </div>
                                            :
                                            <div>
                                                <p style={{ fontWeight: "bold", marginBottom: 10 }}>计算结果</p>
                                                <Table className="filelist-table"
                                                    dataSource={resultFileList}
                                                    columns={fileTableColumns(this)}
                                                    loading={fileListLoading}
                                                    sticky
                                                    pagination={{
                                                        showQuickJumper: resultFileList.length > 50 && true,
                                                        hideOnSinglePage: true,
                                                        showLessItems: true,
                                                    }}
                                                />
                                            </div>
                                    )
                                        : resType === 4 && <Result status="error" title="计算错误" />
                                    )
                                    : null
                                }
                                {dockerType === 5 && !isComputing ?
                                    calcStatus ?
                                        Object.keys(calcResData).length > 0 &&
                                        <>
                                            {Object.keys(calcResData).map((item, index) =>
                                                <div key={index}>
                                                    {(item === "message" ? "" : item + "：\r\n")}
                                                    <p className="resdata-p">{String(calcResData[item])}</p>
                                                </div>)}
                                            <div style={{ display: "flex", justifyContent: "space-around" }}>
                                                <Button type="primary" onClick={this.downloadData}>下载数据</Button>
                                                {needVis && <Button type="primary" onClick={() => { this.setState({ visVisible: true }) }}>可视化</Button>}
                                            </div>
                                            <Modal className="vis-modal" visible={visVisible} onCancel={() => { this.setState({ visVisible: false }) }} footer={null} destroyOnClose>
                                                <Vis data={calcResData} datatype={apiName} />
                                            </Modal>
                                        </>
                                        : <Result status="error" title="计算错误" />
                                    : null
                                }
                            </Card>
                        </Col>
                    </Row>
                    <Drawer title="模板结果" placement="left" visible={tdataDrawerVisible} onClose={this.handleCloseTdataDrawer} width={550}>
                        <ConfigProvider locale={zhCN}>
                            <Table className="filelist-table"
                                dataSource={tdataFileListData}
                                columns={fileTableColumns(this)}
                                loading={fileListLoading}
                                sticky
                                scroll={{ x: "max-content" }}
                                pagination={{
                                    showQuickJumper: tdataFileListData.length > 50 && true,
                                    hideOnSinglePage: true,
                                    showLessItems: true,
                                }}
                            />
                        </ConfigProvider>
                        <Modal className="file-modal" visible={fileModalVisible} onCancel={this.handleCancleFileModal} footer={null}>
                            <iframe id="file_iframe"
                                src={uri + "/output/" + filePath}
                                title={filePath}
                                scrolling="auto"
                            />
                        </Modal>
                        <Modal className="img-modal" visible={imgModalVisible} onCancel={this.handleCancleImgModal} footer={null}>
                            <img src={uri + "/output/" + filePath} alt={filePath} />
                        </Modal>
                    </Drawer >
                    <div className="data-loading-mask" style={{ display: dataLoading ? "flex" : "none" }}>
                        <Spin spinning={dataLoading} tip={"数据读取中..."} size="large"></Spin>
                    </div>
                </Content >
            </div >
        );
    };
};

export default Form.create({ name: "calculate" })(withRouter(Calculate));