/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 应用详情页
 */

import React from 'react';
import { Layout, Button, Select, Radio, Checkbox, Input, message, Card, Col, Row, Form, Upload, Icon, Empty, Result, Steps, Spin, Tooltip, Modal, List, Drawer, ConfigProvider, Table } from 'antd';
import { Link, withRouter } from "react-router-dom";
import zhCN from 'antd/es/locale/zh_CN';
import axios from 'axios';
import IconFont from '../../components/IconFont';
import Listener from "../../components/Listener";
import checkNullvalue from "../../utils/checkNullvalue";
import apiPromise from '../../assets/url.js';
import { getCookie } from '../../utils/cookies';
import apiDataSource from "./data.json";
import Vis from "../../components/Vis";
import './index.css';
// import json from "./json.json";

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
        {["txt", "dat", "pdf", "jpg", "png", "jpeg", "tiff", "msh", "field"].includes(info.suffix) ? "查看" : "下载"}
    </Button>
}, {
    title: '可视化',
    align: "center",
    className: "file-desc",
    render: (text, info) => info.suffix === "csv" ?
        (info.size < 30 ?
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
            apiData: Number(sessionStorage.getItem("idenMod")) === 311 ? apiDataSource.gravity : apiDataSource.magnetic,
            resultData: [],
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
            calcResData: {},
            calcStatus: true,
            resType: undefined,
            visVisible: false,
            loadingData: false,
            toggle: true,
            tdataDrawerVisible: false,
            tdataFileListData: [],
            fileListLoading: false,
            dataLoading: false,
            fileModalVisible: false,
            imgModalVisible: false,
            filePath: "",
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
        let fileList = [...info.fileList];
        fileList = fileList.slice(-1);
        this.setState({ uploadFileList: fileList });
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
        let { username, idenMod, currentStep, appName } = this.state;
        this.setState({ loading: true });
        let tempwindow;
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
                        started: true
                    });
                    setTimeout(() => {
                        tempwindow = window.open(window.location.origin + '/#/loading');
                    }, 1000)
                    setTimeout(() => {
                        tempwindow.location = uri; // 后更改页面地址
                    }, 5000)
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
        this.setState({ modelIndex: value, funcName: this.state.proList[value - 1] });
        this.getPram(value);
    }
    //重&磁选择计算接口
    handleSelectApi = value => {
        //深拷贝apiData对象
        let data = JSON.parse(JSON.stringify(this.state.apiData[value]));
        let { calcApi, params, requestMethod } = data;
        let { texts, selects, radios, checkBoxs, textAreas, uploadBoxs, inputFiles } = params;
        this.setState({
            loading: false,
            apiName: value,
            calcApi,
            requestMethod,
            texts: texts ? texts : [],
            selects: selects ? selects : [],
            radios: radios ? radios : [],
            checkBoxs: checkBoxs ? checkBoxs : [],
            textAreas: textAreas ? textAreas : [],
            uploadBoxs: uploadBoxs ? uploadBoxs : [],
            inputFiles: inputFiles ? inputFiles : [],
            calcResData: {},
            calcStatus: true
        });
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
            // let { texts, selects, radios, checkBoxs, textAreas, uploadBoxs, inputFiles } = json.projectparams;
            this.setState({
                texts: texts ? texts : [],
                selects: selects ? selects : [],
                radios: radios ? radios : [],
                checkBoxs: checkBoxs ? checkBoxs : [],
                textAreas: textAreas ? textAreas : [],
                uploadBoxs: uploadBoxs ? uploadBoxs : [],
                inputFiles: inputFiles ? inputFiles : []
            });
        }).catch(error => {
            message.error("服务器无响应");
        });
    }
    //提交参数文件
    createPFile = e => {
        e.preventDefault();
        let { texts, selects, radios, checkBoxs, textAreas, inputFiles, idenMod, uploadBoxs, dockerID, dockerIP, vport, currentStep, moduleName, currentStep2, nowStep, modelIndex, dockerType, baseUrl, calcApi, requestMethod } = this.state;
        if (dockerType === 5) {
            if (calcApi) {
                if (checkNullvalue(texts) && checkNullvalue(selects) && checkNullvalue(radios) && checkNullvalue(checkBoxs) && checkNullvalue(textAreas)) {
                    this.props.form.validateFields({ force: true }, (err, values) => {
                        if (!err) {
                            // baseUrl = "http://139.217.82.132:5050";
                            if (requestMethod === "get" && Array.isArray(texts)) {
                                let params = {};
                                for (let i = 0, len = texts.length; i < len; i++) {
                                    params[texts[i].paramName] = isNaN(Number(texts[i].currentValue)) ? texts[i].currentValue : Number(texts[i].currentValue);
                                }
                                this.setState({
                                    loading: true,
                                    isComputing: true,
                                    calcStatus: true
                                });
                                axios.get(baseUrl + calcApi, { params })
                                    .then(response => {
                                        this.setState({
                                            loading: false,
                                            isComputing: false
                                        });
                                        if (typeof (response.data) === "string") {
                                            this.setState({
                                                calcResData: { message: response.data }
                                            });
                                        } else if (response.data.result) {
                                            this.setState({
                                                calcResData: { message: response.data.result }
                                            });
                                        } else {
                                            this.setState({ calcResData: response.data });
                                        }

                                    }).catch(error => {
                                        this.setState({ loading: false, isComputing: false, calcStatus: false });
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
                                    this.setState({
                                        loading: false,
                                        isComputing: false
                                    });
                                    if (typeof (res.data) === "string") {
                                        this.setState({
                                            calcResData: { message: res.data }
                                        });
                                    } else if (res.data.result) {
                                        this.setState({
                                            calcResData: { message: res.data.result }
                                        });
                                    } else {
                                        this.setState({ calcResData: res.data });
                                    }

                                }).catch(err => {
                                    this.setState({ loading: false, isComputing: false, calcStatus: false });
                                    message.error(err.message);
                                });
                            }
                        }
                    })
                }
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
                    if (p.toLowerCase().replace(/ +/g, "").indexOf("matlab") >= 0 || data[i].indexOf("r:/status") >= 0) {
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
            computed: false
        });
        if (nowStep !== 2) {
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
        } else if (nowStep === 2) {
            this.props.history.push("/operateData");
        }
    }
    handleDownload = path => {
        let { dockerIP, vport } = this.state;
        switch (path.split(".").pop()) {
            case "txt":
            case "dat":
            case "msh":
            case "field":
                window.open(this.state.uri + "/output/" + path)
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
    openVisModal = path => {
        let { dockerIP, vport } = this.state;
        this.setState({ loadingData: true });
        axios.get("http://" + dockerIP + ":" + vport + "/resInfo", {
            params: {
                path
            }
        }).then(res => {
            let { data } = res.data;
            if (Array.isArray(data) && data.length > 0) {
                data = data.map(item => item.map(item2 => Number(item2)));
                this.setState({ calcResData: data }, () => {
                    this.setState({
                        visVisible: true,
                        loadingData: false
                    })
                });
            } else {
                message.warn("无数据");
                this.setState({
                    loadingData: false
                })
            }
        }).catch(err => {
            this.setState({
                loadingData: false
            })
        });
    }
    downloadData = () => {
        let { calcResData } = this.state;
        let makeJson = JSON.stringify(calcResData);
        //保存到本地
        //虚拟dom实现下载   
        var elementA = document.createElement('a');
        elementA.download = +new Date() + ".json";//文件名
        //隐藏dom点不显示
        elementA.style.display = 'none';
        var blob = new Blob([makeJson]);//二进制
        elementA.href = URL.createObjectURL(blob);
        document.body.appendChild(elementA);
        elementA.click();
        document.body.removeChild(elementA);
    }
    showListenerModal = () => {
        this.setState({ toggle: false })
    }
    hideListenerModal = () => {
        this.setState({ toggle: true })
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
        let { absolutePath } = info;
        let { dockerIP, vport, appName, idenMod } = this.state;
        if ((idenMod === 411 || idenMod === 412) && absolutePath.split("/").pop() === "mod.csv") {
            message.warn("数据错误，无法可视化");
        } else {
            clearInterval(this.checkTimer);
            this.setState({ dataLoading: true });
            axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                params: { path: absolutePath }
            }).then(res => {
                let { data } = res.data;
                if (Array.isArray(data) && data.length > 0) {
                    if (appName !== "混合谱元法 (SEM)") {
                        data = data.map(item => item.map(item2 => Number(item2)));
                    }
                    this.setState({ calcResData: data }, () => {
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
            started, resultData, isComputing, idenMod, dockerID, dockerIP, vport, logInfoArray, modelIndex, modalVisible, uri, dockerType,
            computed, nowStep, stepNum, currentStep2, disabled, proList, calcResData, calcStatus, resType, visVisible, apiName, loadingData, toggle,
            tdataDrawerVisible, tdataFileListData, fileListLoading, dataLoading, fileModalVisible, imgModalVisible, filePath
        } = this.state;
        const { getFieldDecorator } = this.props.form;
        return (
            <div className="calculate">
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
                        <Col sm={(idenMod === 311 || idenMod === 312) ? 10 : 8} xs={24} className="calculate-col">
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
                                            <Button type="primary" loading={loading} disabled={started} onClick={this.startDocker}>{started ? "已启动" : "启动容器"}</Button>
                                        </div>
                                    }
                                    {(nowStep === 1 && currentStep === 1) || (nowStep > 1 && currentStep2 === 0 && nowStep !== 3) || dockerType === 5 ?
                                        <>
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
                                                            {inputFiles === null ? null : inputFiles.map((inputFile, index) =>
                                                                <Form.Item className="input-file-wrapper" label={<label title={inputFile.paramNameCN}>{inputFile.paramName}</label>} key={index}>
                                                                    <Tooltip title={inputFile.tip}>
                                                                        <span className="ant-btn ant-btn-default input-file">选择文件
                                                                    <input type="file" id="file" onChange={this.changeInputFile.bind(this, index)} />
                                                                        </span>
                                                                    </Tooltip>
                                                                    <div style={{ marginLeft: 10 }}>{inputFile.currentValue && inputFile.currentValue.name}</div>
                                                                </Form.Item>
                                                            )}
                                                            {texts === null ? null : texts.map(({ paramName, paramNameCN, tip, defaultValue, currentValue, type, enumList, max, min }, index) =>
                                                                <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <Tooltip title={tip}>
                                                                        {getFieldDecorator(paramName, {
                                                                            rules: [{
                                                                                validator: (rule, value, callback) => {
                                                                                    switch (type) {
                                                                                        case "boolean":
                                                                                            if (!value) {
                                                                                                callback(`${paramName}的值不能为空!`);
                                                                                            } else if (!["true", "false"].includes(value.toLowerCase())) {
                                                                                                callback('请输入布尔类型值true或false');
                                                                                            } else {
                                                                                                callback();
                                                                                            };
                                                                                            break;
                                                                                        case "enum":
                                                                                            if (!value) {
                                                                                                callback(`${paramName}的值不能为空!`);
                                                                                            } else if (!enumList.includes(value)) {
                                                                                                callback(`${paramName}的值只能为[${enumList}]`);
                                                                                            } else {
                                                                                                callback();
                                                                                            };
                                                                                            break;
                                                                                        case "int":
                                                                                            if (!value) {
                                                                                                callback(`${paramName}的值不能为空!`);
                                                                                            } else if (!/^-?\d*$/.test(value)) {
                                                                                                callback(`${paramName}的值只能为整型`);
                                                                                            } else if (max && Number(value) > max) {
                                                                                                callback(`${paramName}的值不能大于${max}`);
                                                                                            } else if (min && Number(value) < min) {
                                                                                                callback(`${paramName}的值不能小于${min}`);
                                                                                            } else {
                                                                                                callback();
                                                                                            };
                                                                                            break;
                                                                                        case "double":
                                                                                            if (!value) {
                                                                                                callback(`${paramName}的值不能为空!`);
                                                                                            } else if (!/^-?[0-9]*\d*\.\d+$|^-?0\.\d+$|^-?\d*$|^0$/.test(value)) {
                                                                                                callback(`${paramName}的值只能为浮点型`);
                                                                                            } else if (max && Number(value) > max) {
                                                                                                callback(`${paramName}的值不能大于${max}`);
                                                                                            } else if (min && Number(value) < min) {
                                                                                                callback(`${paramName}的值不能小于${min}`);
                                                                                            } else {
                                                                                                callback();
                                                                                            };
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
                                                            {selects === null ? null : selects.map((selectBox, index) =>
                                                                <Form.Item label={selectBox.paramName} key={index}>
                                                                    <Select onChange={this.changeOption.bind(this, index)} value={selectBox.currentValue}>
                                                                        {selectBox.defaultValue.map((value, index2) =>
                                                                            <Option key={value} value={value}>
                                                                                {value}
                                                                            </Option>
                                                                        )}
                                                                    </Select>
                                                                </Form.Item>
                                                            )}
                                                            {uploadBoxs === null || uploadBoxs === undefined ? null : uploadBoxs.map((upload, index) =>
                                                                <Form.Item label={<label title={upload.paramNameCN}>{upload.paramName}</label>} key={index}>
                                                                    <Tooltip title={upload.tip}>
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
                                                                            accept={upload.accept}
                                                                            fileList={uploadFileList}
                                                                        >
                                                                            <Button type="default"><Icon type="upload" />上传文件</Button>
                                                                        </Upload>
                                                                        <></>{/* 加空标签是为了显示tooltip */}
                                                                    </Tooltip>
                                                                </Form.Item>
                                                            )}
                                                            {radios === null ? null : radios.map((radioBox, index) =>
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
                                                            )}
                                                            {checkBoxs === null ? null : checkBoxs.map((checkBox, index) =>
                                                                <Form.Item label={checkBox.paramName} key={index}>
                                                                    <CheckboxGroup options={checkBox.defaultValue} value={checkBox.currentValue} onChange={this.changeCheck.bind(this, index)} />
                                                                </Form.Item>
                                                            )}
                                                            {textAreas === null ? null : textAreas.map((textArea, index) =>
                                                                <Form.Item label={textArea.paramName} key={index}>
                                                                    <Tooltip title={textArea.tip}>
                                                                        <TextArea autoSize={{ minRows: 4, maxRows: 2000 }} cols={10} value={textArea.currentValue} onChange={this.changeTextarea.bind(this, index)} />
                                                                    </Tooltip>
                                                                </Form.Item>
                                                            )}
                                                            <Row className="app-button">
                                                                {dockerType === 5 ?
                                                                    <Button type="primary" htmlType="submit" loading={loading}>提交参数</Button>
                                                                    :
                                                                    <Button type="primary" htmlType="submit" loading={loading}>提交参数</Button>
                                                                }
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
                                                <div style={{ margin: "0 auto", display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 380, flexWrap: "wrap" }}>
                                                    <Button type="default" style={{ marginBottom: 16 }} onClick={this.handleViewInfo}>查看运行日志</Button>
                                                    <Modal className="loginfo-modal" visible={modalVisible} onCancel={this.handleCancleModal} footer={null}>
                                                        {logInfoArray.map((item, index) => <p key={index} style={{ marginBottom: 5 }}>{item}</p>)}
                                                    </Modal>
                                                    <Button type="default" style={{ marginBottom: 16 }} onClick={this.handleViewTdata}>查看模板结果</Button>
                                                    <Button type="default" onClick={() => { this.props.history.push("/console") }} style={{ width: 128 }}>前往控制台</Button>
                                                    <Button type="danger" onClick={this.handleKillContain} style={{ width: 128 }}>停止docker</Button>
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
                        {idenMod !== 311 && idenMod !== 312 &&
                            <Col sm={6} xs={24} className="calculate-col">
                                <Card title="运行监控" bordered={false} className="params-card">
                                    {listener && (dockerIP || uri) ?
                                        <Listener
                                            ip={(dockerType === 2 || dockerType === 4) && dockerIP}
                                            uri={(dockerType === 1 || dockerType === 5) && uri}
                                            toggle={false}
                                        />
                                        :
                                        <Empty description="容器未启动" />
                                    }
                                </Card>
                            </Col>
                        }
                        <Col sm={(idenMod === 311 || idenMod === 312) ? 14 : 10} xs={24} className="calculate-col">
                            <Card title="运行结果" bordered={false} bodyStyle={{ paddingBottom: 45 }}>
                                {isComputing || resType || Object.keys(calcResData).length > 0 || !calcStatus || computed ? null : <Empty description="容器未启动" />}
                                {isComputing &&
                                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                                        <Spin size="large" tip="正在计算..."/>
                                    </div>
                                }
                                {dockerType === 1 && uri &&
                                    <div style={{ textAlign: "center", paddingTop: 35 }}>
                                        <p>请在新窗口中查看</p> 
                                        <p>如未弹出新窗口，请点击此<a href={uri} target="_blank" rel="noopener noreferrer">链接</a></p>
                                    </div>
                                }
                                {dockerType === 2 &&
                                    <Modal className="vis-modal" visible={visVisible} onCancel={() => { this.setState({ visVisible: false }) }} footer={null} destroyOnClose>
                                        <Vis data={calcResData} appName={appName} datatype={Array.isArray(calcResData[0]) && (calcResData[0].length === 1 || calcResData[0].length === 2 ? "1d" : (calcResData[0].length === 3 ? "2d" : (calcResData[0].length === 4 ? "3d" : (calcResData[0].length > 4 ? "matrix" : undefined))))} />
                                    </Modal>
                                }
                                {dockerType === 2 && !isComputing ?
                                    (resType === 2 ? <div>
                                        <p style={{ fontWeight: "bold", marginBottom: 10 }}>计算结果</p>
                                        <List
                                            size="small"
                                            bordered
                                            dataSource={Object.keys(resultData)}
                                            renderItem={item =>
                                                <List.Item style={{ display: "flex", justifyContent: "space-between" }}>
                                                    {item}
                                                    <div>
                                                        <Button type="primary" onClick={this.handleDownload.bind(this, resultData[item][1])} style={{ height: 32 }}>
                                                            {item.indexOf(".txt") > 0 || item.indexOf(".dat") > 0 || item.indexOf(".pdf") > 0 || item.indexOf(".jpg") > 0 || item.indexOf(".png") > 0 || item.indexOf(".jpeg") > 0 || item.indexOf(".tiff") > 0 ? "查看" : "下载"}
                                                        </Button>
                                                        {item.indexOf(".csv") > 0 && <Button type="primary" onClick={this.openVisModal.bind(this, resultData[item][0])} style={{ marginLeft: 16, height: 32 }}>可视化</Button>}
                                                    </div>
                                                </List.Item>
                                            }
                                        />
                                    </div>
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
                                                <Button type="primary" onClick={() => { this.setState({ visVisible: true }) }}>可视化</Button>
                                            </div>
                                            <Modal className="vis-modal" visible={visVisible} onCancel={() => { this.setState({ visVisible: false }) }} footer={null} destroyOnClose>
                                                <Vis data={calcResData} datatype={apiName} />
                                            </Modal>
                                        </>
                                        : <Result status="error" title="计算错误" />
                                    : null
                                }
                                <div className="data-loading-mask" style={{ display: loadingData ? "flex" : "none" }}>
                                    <Spin spinning={loadingData} tip={"数据读取中..."} size="large"></Spin>
                                </div>
                                {(idenMod === 311 || idenMod === 312) &&
                                    <div className="listener">
                                        <span style={{ marginRight: 20, fontSize: 16, color: "#000" }}>运行监控</span>
                                        {listener && (dockerIP || uri) ?
                                            <>
                                                <Listener
                                                    ip={(dockerType === 2 || dockerType === 4) && dockerIP}
                                                    uri={(dockerType === 1 || dockerType === 5) && uri}
                                                    toggle={true}
                                                />
                                                <span className="listener-btn" onClick={this.showListenerModal}>查看详情</span>
                                            </>
                                            :
                                            <span style={{ color: "#bbb" }}>容器未启动</span>
                                        }
                                        <Modal className="listener-modal" visible={!toggle} onCancel={this.hideListenerModal} footer={null}>
                                            <Listener
                                                ip={(dockerType === 2 || dockerType === 4) && dockerIP}
                                                uri={(dockerType === 1 || dockerType === 5) && uri}
                                                toggle={false}
                                            />
                                        </Modal>
                                    </div>
                                }
                            </Card>
                        </Col>
                    </Row>
                    <Drawer title="运行结果" placement="left" visible={tdataDrawerVisible} onClose={this.handleCloseTdataDrawer} width={550}>
                        <ConfigProvider locale={zhCN}>
                            <Table className="filelist-table"
                                dataSource={tdataFileListData}
                                columns={fileTableColumns(this)}
                                loading={fileListLoading}
                                sticky
                                pagination={{
                                    showQuickJumper: tdataFileListData.length > 50 && true,
                                    hideOnSinglePage: true,
                                    showLessItems: true,
                                }}
                            />
                        </ConfigProvider>
                        <div className="data-loading-mask" style={{ display: dataLoading ? "flex" : "none" }}>
                            <Spin spinning={dataLoading} tip={"数据读取中..."} size="large"></Spin>
                        </div>
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
                </Content >
            </div >
        );
    };
};

export default Form.create({ name: "calculate" })(withRouter(Calculate));