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
import apiPromise from '../../assets/url.js';
import { getCookie } from '../../utils/cookies';
import GMDataSource from "./G&Mdata.json";
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
        (info.size < 80 ?
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
            funcName: sessionStorage.getItem("funcName") || undefined,
            loading: false,
            listener: sessionStorage.getItem("dockerIP") ? true : false,
            currentStep: 0,
            currentStep2: 0,
            apiData: Number(sessionStorage.getItem("idenMod")) === 311 ? GMDataSource.GMDataProcessing :
                Number(sessionStorage.getItem("idenMod")) === 312 ? GMDataSource.Gridding :
                    Number(sessionStorage.getItem("idenMod")) === 313 ? GMDataSource.GMForward :
                        Number(sessionStorage.getItem("idenMod")) === 314 ? GMDataSource.GMInversion :
                            {},
            resultData: [],
            resFileListData: [],
            isComputing: false,
            started: Number(sessionStorage.getItem("nowStep")) > 1 ? true : false,
            uri: sessionStorage.getItem("baseUrl") || "",
            logInfoArray: [],
            modalVisible: false,
            dockerType: Number(sessionStorage.getItem("dockerType")) || undefined,
            computed: false,
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
            tinyListener: false,
            tdataDrawerVisible: false,
            tdataFileListData: [],
            fileListLoading: false,
            dataLoading: false,
            fileModalVisible: false,
            imgModalVisible: false,
            filePath: "",
            dataType: "",
            hasGotInfo: true,
            hideUpload: false,
            dimension: false,
            real: false,
            dimensionValue: "2D",
            realValue: "model",
            hasGotParam: true,
            startTime: 0,
            endTime: 0,
            axisData: {},
            visIndex: 1,
            reStart: sessionStorage.getItem("reStart") || undefined,
            currentFile: "",
            hasStarted: false,
            hasRun: false
        };
    };
    logTimer = undefined;
    componentDidMount() {
        apiPromise.then(res => {
            api = res.data.api;
            let { dockerType, modelIndex, reStart } = this.state;
            if (dockerType === 2) {
                this.getParam(modelIndex);
            }
            if (reStart) {
                this.setState({
                    defaultIndex: Number(sessionStorage.getItem("defaultIndex")),
                    dimension: sessionStorage.getItem("dimension") === "true" ? true : false,
                    dimensionValue: sessionStorage.getItem("dimensionValue"),
                    real: sessionStorage.getItem("real") === "true" ? true : false,
                    realValue: sessionStorage.getItem("realValue")
                }, () => {
                    this.startDocker();
                })
            }
        });
        if (window.innerWidth > 768) {
            this.setState({ tinyListener: false })
        } else {
            this.setState({ tinyListener: true })
        }
        window.addEventListener("resize", () => {
            this.setState({ tinyListener: window.innerWidth > 768 ? false : true })
        })
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
    changeUpload(index, paramName, info) {
        let { uploadFileList, idenMod } = this.state;
        let fileList = [...info.fileList];
        if (idenMod !== 222 || idenMod !== 7221 || ((idenMod === 222 || idenMod === 7221) && paramName !== "sac_file" && paramName !== "input_dir")) {
            fileList = fileList.slice(-1);
        }
        if (info.file.status) {
            uploadFileList[index] = fileList;
            this.setState({ uploadFileList });
        }
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
        let { username, idenMod, currentStep, appName, stepNum, reStart } = this.state;
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
                hasStarted: true
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
                    }, () => {
                        if (reStart) {
                            this.handleSelectModel(Number(sessionStorage.getItem("defaultIndex")))
                            sessionStorage.removeItem("reStart");
                        }
                    });
                    break;
                case 2:
                    let dimension = false, real = false, dimNum = 0, realNum = 0;
                    for (let i = 0; i < proList.length; i++) {
                        if (proList[i].toUpperCase().indexOf("3D") > -1) {
                            dimNum += 1;
                        }
                        if (proList[i].toUpperCase().indexOf("REAL") > -1) {
                            realNum += 1;
                        }
                    }
                    if (dimNum > 0 && dimNum < proList.length) {
                        dimension = true;
                    }
                    if (realNum > 0 && realNum < proList.length && !dimension) {
                        real = true;
                    }
                    if (stepNum === 1 && ![51, 52, 731, 7321, 7322].includes(idenMod)) {
                        proList.unshift("用户自定义计算");
                    }
                    //常规docker返回结果
                    if (proList.length === 1) {
                        this.getParam(1);
                        this.setState({ modelIndex: 1 });
                    }
                    this.setState({
                        listener: true,
                        dockerID: data.dockerID,
                        dockerIP: data.dockerIP,
                        vport: data.vport,
                        currentStep: idenMod === 731 ? currentStep + 2 : currentStep + 1,
                        proList,
                        started: true,
                        dimension,
                        real,
                    }, () => {
                        if (reStart) {
                            this.handleSelectModel(Number(sessionStorage.getItem("defaultIndex")))
                            sessionStorage.removeItem("reStart");
                        }
                    });
                    break;
                case 3:
                    //镜像未找到
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
                    }, () => {
                        if (reStart) {
                            this.handleSelectModel(Number(sessionStorage.getItem("defaultIndex")))
                            sessionStorage.removeItem("reStart");
                        }
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
        let { proList, dimension, dimensionValue, real, realValue } = this.state;
        let modelIndex = value;
        if (value === 0) {
            if (dimension) {
                if (dimensionValue === "2D") {
                    for (let i = 1; i < proList.length; i++) {
                        if (proList[i].toUpperCase().indexOf("3D") === -1) {
                            modelIndex = i;
                            break;
                        }
                    }
                } else {
                    for (let i = 1; i < proList.length; i++) {
                        if (proList[i].toUpperCase().indexOf("3D") > -1) {
                            modelIndex = i;
                            break;
                        }
                    }
                }
            } else if (real) {
                if (realValue === "model") {
                    for (let i = 1; i < proList.length; i++) {
                        if (proList[i].toUpperCase().indexOf("REAL") === -1) {
                            modelIndex = i;
                            break;
                        }
                    }
                } else {
                    for (let i = 1; i < proList.length; i++) {
                        if (proList[i].toUpperCase().indexOf("REAL") > -1) {
                            modelIndex = i;
                            break;
                        }
                    }
                }
            } else {
                modelIndex = 1
            }
        }
        this.setState({
            modelIndex,
            hideUpload: value === 0 ? false : true,
            funcName: proList[value],
            texts: [],
            selects: [],
            radios: [],
            checkBoxs: [],
            textAreas: [],
            uploadBoxs: [],
            inputFiles: [],
            uploadFileList: []
        });
        this.getParam(modelIndex);
        sessionStorage.setItem("defaultIndex", value);
        sessionStorage.setItem("dimension", dimension);
        sessionStorage.setItem("dimensionValue", dimensionValue);
        sessionStorage.setItem("real", real);
        sessionStorage.setItem("realValue", realValue);
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
    getParam = index => {
        let { idenMod, nowStep } = this.state;
        this.setState({ hasGotParam: false });
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
                uploadFileList: uploadBoxs ? new Array(uploadBoxs.length) : [],
                hasGotParam: true
            });
        }).catch(error => {
            message.error("服务器无响应");
        });
    }
    //提交参数文件
    createPFile = e => {
        e.preventDefault();
        let { texts, selects, radios, checkBoxs, textAreas, inputFiles, idenMod, uploadBoxs, dockerID, dockerIP, vport, currentStep,
            moduleName, currentStep2, nowStep, modelIndex, dockerType, baseUrl, calcApi, requestMethod, apiName, hasGotParam } = this.state;
        if (dockerType === 5) {
            if (calcApi) {
                this.props.form.validateFields({ force: true }, (err, values) => {
                    this.setState({ startTime: new Date() })
                    if (!err) {
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
                                    calcResData: typeof (res.data) === "string" ? { message: res.data } : res.data,
                                    endTime: new Date()
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
                                    this.setState({
                                        loading: false,
                                        isComputing: false,
                                        calcResData: typeof (res.data) === "string" ? { message: res.data } : res.data,
                                        endTime: new Date()
                                    });
                                }).catch(err => {
                                    this.setState({ loading: false, isComputing: false, calcStatus: false });
                                    message.error(err.message);
                                });
                            }
                            )
                        }
                        if (["重力观测数据反演（三维正则，参考模型约束）", "重力观测数据反演（多约束反演）", "重力观测数据反演（参考模型-全变分约束）", "MCMC反演", "MCMC反演（参考模型约束）"].includes(apiName)) {
                            let getObjectValue = (objArr, paramName) => {
                                for (let i = 0, len = objArr.length; i < len; i++) {
                                    if (objArr[i].paramName === paramName) {
                                        return objArr[i].currentValue;
                                    }
                                }
                            };
                            let area = getObjectValue(texts, "area").split(",").map(item => Number(item));
                            let shape = getObjectValue(texts, "shape").split(",").map(item => Number(item));
                            let [x1, x2, y1, y2, z1, z2] = area;
                            let [nz, ny, nx] = shape;
                            let axisData = { xp: [], yp: [], zp: [] };
                            for (let i = 0; i < nz; i++) {
                                for (let j = 0; j < ny; j++) {
                                    for (let k = 0; k < nx; k++) {
                                        axisData.xp.push((x2 - x1) / nx * (k + 0.5) + x1);
                                        axisData.yp.push((y2 - y1) / ny * (j + 0.5) + y1);
                                        axisData.zp.push((z2 - z1) / nz * (i + 0.5) + z1);
                                    }
                                }
                            }
                            this.setState({ axisData });
                        }
                    }
                })
            } else {
                message.error("请选择功能");
            }
        } else {
            if (modelIndex >= 0) {
                if (hasGotParam) {
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
                } else {
                    message.warn("参数未获取完成，请稍候", 2)
                }
            } else {
                message.error("请选择模型获取参数列表", 2)
            }
        }
    }
    //运行
    runDocker = () => {
        let { username, idenMod, dockerID, dockerIP, vport, nowStep, stepNum, modelIndex, appName, funcName } = this.state;
        this.setState({ loading: true, isComputing: true, hasRun: true });
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
                modalVisible: false,
                resType: status
            });
            switch (status) {
                //未登陆
                case 0:
                    message.error(data);
                    break;
                case 1:
                    if (data !== "计算异常") {
                        message.error(data);
                    }
                    break;
                //成功
                case 2:
                    if (!Array.isArray(data)) {
                        let resFileList = [];
                        for (let key in data) {
                            if (key.toUpperCase().indexOf("COOR") === -1) {
                                resFileList.push({
                                    name: key,
                                    suffix: key.split(".").pop(),
                                    absolutePath: data[key][0],
                                    staticPath: data[key][1],
                                    size: data[key][2] ? +data[key][2] : "",
                                });
                            }
                        }
                        resFileList.map((item, index) => {
                            item.key = index;
                            return item;
                        });
                        this.setState({
                            resFileListData: resFileList
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
        let { dockerID, dockerIP, hasGotInfo } = this.state;
        this.setState({ modalVisible: true });
        let times = 0;
        this.logTimer = setInterval(() => {
            if (hasGotInfo) {
                this.setState({ hasGotInfo: false });
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
                    this.setState({ hasGotInfo: true });
                    let data = res.data.data.split("Calculation begins...");
                    // eslint-disable-next-line
                    data = data.pop().replace(/[\u0000-\u0008]|[\u0010-\u001f]/g, "");
                    if (data.indexOf("\r\n") > -1) {
                        data = data.split("\r\n");
                    } else if (data.indexOf("\n") > -1) {
                        data = data.split("\n");
                    }
                    for (let i = 0; i < data.length; i++) {
                        let p = data[i];
                        if (p.toLowerCase().replace(/ +/g, "").indexOf("matlab") > -1 || data[i].indexOf("r:/status") > -1 || data[i].indexOf(".go:") > -1) {
                            data.splice(i, 1);
                            i -= 1;
                        }
                    }
                    if (data.length === 0 || (Array.from(new Set(data)).length === 1 && Array.from(new Set(data))[0] === "")) {
                        data.push("暂无日志");
                    }
                    this.setState({ logInfoArray: data });
                }).catch(() => {
                    this.setState({ hasGotInfo: true });
                    times += 1;
                    if (times > 4) {
                        message.error("服务器无响应");
                        clearInterval(this.logTimer);
                    }
                });
            }
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
                sessionStorage.setItem("reStart", 1);
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
        if (nowStep === 2 && (idenMod === 222 || idenMod === 7221)) {
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
    downloadData = file => {
        let { calcResData, apiName, baseUrl, axisData } = this.state;
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
        if (apiName === "计算完全布格异常") {
            let elementA = document.createElement('a');
            elementA.style.display = 'none';
            elementA.href = baseUrl + "/downloadfile?fullfilename=" + file;
            document.body.appendChild(elementA);
            elementA.click();
            document.body.removeChild(elementA);
        } else if (["重力观测数据反演（三维正则，参考模型约束）", "重力观测数据反演（多约束反演）", "重力观测数据反演（参考模型-全变分约束）", "MCMC反演", "MCMC反演（参考模型约束）"].includes(apiName)) {
            if (file === 0) {
                let jsonData = {
                    Density: calcResData.DensityDistribution || calcResData.Density || calcResData.density,
                    xp: axisData.xp,
                    yp: axisData.yp,
                    zp: axisData.zp
                }
                let elementA = document.createElement('a');
                elementA.download = "三维密度分布数据_" + +new Date() + ".csv";
                let str = JSONToCSVConvertor(jsonData)
                elementA.style.display = 'none';
                //unescape("\ufeff" + str)解决excel打开csv文件中文乱码问题
                let blob = new Blob([unescape("\ufeff" + str)], { type: 'text/csv,charset=UTF-8' });
                elementA.href = URL.createObjectURL(blob);
                document.body.appendChild(elementA);
                elementA.click();
                document.body.removeChild(elementA);
            } else if (file === 1) {
                let jsonData = {
                    predicted: calcResData.predicted,
                    residuals: calcResData.residuals,
                    xp: calcResData.xp,
                    yp: calcResData.yp,
                }
                let elementA = document.createElement('a');
                elementA.download = "重力预测值&残差数据_" + +new Date() + ".csv";
                let str = JSONToCSVConvertor(jsonData)
                elementA.style.display = 'none';
                //unescape("\ufeff" + str)解决excel打开csv文件中文乱码问题
                let blob = new Blob([unescape("\ufeff" + str)], { type: 'text/csv,charset=UTF-8' });
                elementA.href = URL.createObjectURL(blob);
                document.body.appendChild(elementA);
                elementA.click();
                document.body.removeChild(elementA);
            }
        } else {
            let elementA = document.createElement('a');
            elementA.download = apiName + "_resData_" + +new Date() + ".csv";
            let str = JSONToCSVConvertor(calcResData)
            elementA.style.display = 'none';
            //unescape("\ufeff" + str)解决excel打开csv文件中文乱码问题
            let blob = new Blob([unescape("\ufeff" + str)], { type: 'text/csv,charset=UTF-8' });
            elementA.href = URL.createObjectURL(blob);
            document.body.appendChild(elementA);
            elementA.click();
            document.body.removeChild(elementA);
        }
    }
    componentWillUnmount() {
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
        sessionStorage.removeItem("reStart");
        sessionStorage.removeItem("dimension");
        sessionStorage.removeItem("dimensionValue");
        sessionStorage.removeItem("real");
        sessionStorage.removeItem("realValue");
        sessionStorage.removeItem("defaultIndex");
        let { hasStarted, hasRun, dockerID, dockerIP } = this.state;
        if (hasStarted && !hasRun && dockerID && dockerIP) {
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
            })
        }
        this.setState = () => {
            return;
        }
    }
    handleViewTdata = () => {
        let { dockerIP, vport, modelIndex, idenMod, funcName } = this.state;
        this.setState({
            tdataDrawerVisible: true,
            fileListLoading: true,
            tdataFileListData: []
        })
        if (funcName !== "用户自定义计算") {
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
                        if (key.toUpperCase().indexOf("COOR") === -1) {
                            resFileList.push({
                                name: key,
                                suffix: key.split(".").pop(),
                                absolutePath: data[key][0],
                                staticPath: data[key][1],
                                size: data[key][2] ? +data[key][2] : "",
                            })
                        }
                    }
                    resFileList.map((item, index) => {
                        item.key = index;
                        return item;
                    });
                    this.setState({
                        fileListLoading: false,
                        tdataFileListData: resFileList,
                    })
                }).catch(err => {
                    message.error("获取结果失败");
                })
        } else {
            this.setState({
                fileListLoading: false,
                tdataFileListData: [],
            })
        }
    }
    handleOpenVisModal = info => {
        let { absolutePath, name } = info;
        let { dockerIP, vport, idenMod, resFileListData, funcName } = this.state;
        this.setState({ currentFile: name });
        if ((idenMod === 411 || idenMod === 412) && absolutePath.split("/").pop() === "mod.csv") {
            message.warn("数据错误，无法可视化");
        } else if (idenMod === 421) {
            let calcResData = {}, sameName = false;
            for (let i = 0; i < resFileListData.length; i++) {
                if (name.indexOf("25D_s") > -1 && (name.replace(/25D_s[0-9]/, "3D_s") === resFileListData[i].name)) {
                    sameName = true;
                } else if (/3D_s_[0-9]/.test(name) && (name === resFileListData[i].name.replace(/25D_s[0-9]/, "3D_s"))) {
                    sameName = true;
                }
            }
            this.setState({ dataLoading: true });
            if (name.indexOf("xoy") !== -1 || name.indexOf("xoz") > -1) {
                axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                    params: { path: absolutePath }
                }).then(res => {
                    let { data } = res.data;
                    if (Array.isArray(data) && data.length > 0) {
                        this.setState({
                            calcResData: data,
                            dataType: "2d_1"
                        }, () => {
                            if (this.state.dataLoading) {
                                this.setState({
                                    visVisible: true,
                                    dataLoading: false,
                                })
                            }
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
            } else if (name.indexOf("_s") > -1 && sameName) {
                let num = 0;
                for (let i = 0; i < resFileListData.length; i++) {
                    if ((/25D_s[1-9]_/).test(resFileListData[i].name)) {
                        num++;
                    }
                }
                let path = absolutePath.replace(/3D_s_|25D_s[0-9]_/, "25D_s1_");
                let time1 = 0, time2 = 0, yDataMap_25D = {}, xData = [], nameObj = {}, fileData = {};
                for (let i = 1; i <= num; i++) {
                    nameObj["file" + i] = path.replace("s1", "s" + i);
                    fileData["file" + i] = {};
                }
                for (let file in nameObj) {
                    axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                        params: { path: nameObj[file] }
                        // eslint-disable-next-line
                    }).then(res => {
                        let { data } = res.data;
                        if (Array.isArray(data) && data.length > 0) {
                            data = data[0].map((col, i) => data.map(row => row[i]));
                            for (let i = 0, len = data.length; i < len; i++) {
                                let key = data[i][0].replace(/%| /g, "");
                                data[i].shift();
                                if (!["x", "y", "z"].includes(key)) {
                                    fileData[file][key] = data[i].map(item => Number(item));
                                }
                            }
                            time1 += 1;
                            if (time1 === num) {
                                let dataOptions = Object.keys(fileData[file]);
                                for (let i = 0; i < dataOptions.length; i++) {
                                    for (let j = 1; j < num + 1; j++) {
                                        yDataMap_25D[dataOptions[i]] = yDataMap_25D[dataOptions[i]] ? yDataMap_25D[dataOptions[i]].concat(fileData["file" + j][dataOptions[i]]) : [...fileData["file" + j][dataOptions[i]]];
                                    }
                                }
                                calcResData.dataOptions = dataOptions;
                                calcResData.yDataMap_25D = yDataMap_25D;
                            }
                        } else {
                            message.warn("无数据");
                            time1 += 1;
                            this.setState({
                                dataLoading: false
                            })
                        }
                        if (time1 === num && time2 === 1) {
                            this.setState({
                                calcResData,
                                dataType: "line_2"
                            }, () => {
                                if (this.state.dataLoading) {
                                    this.setState({
                                        visVisible: true,
                                        dataLoading: false,
                                    })
                                }
                            })
                        }
                    }).catch(err => {
                        this.setState({
                            dataLoading: false
                        })
                    });
                }

                let yDataMap_3D = [];
                axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                    params: { path: absolutePath.replace(/25D_s[0-9]_/, "3D_s_") }
                }).then(res => {
                    let { data } = res.data;
                    if (Array.isArray(data) && data.length > 0) {
                        data = data[0].map((col, i) => data.map(row => row[i]));
                        for (let i = 0, len = data.length; i < len; i++) {
                            let key = data[i][0].replace(/%| /g, "");
                            data[i].shift();
                            if (key === "x") {
                                xData = data[i].map(item => Number(item));
                            }
                            if (!["x", "y", "z"].includes(key)) {
                                yDataMap_3D[key] = data[i].map(item => Number(item));
                            }
                        }
                        calcResData.yDataMap_3D = yDataMap_3D;
                        calcResData.xData = xData;
                        time2 += 1;
                    } else {
                        message.warn("无数据");
                        this.setState({
                            dataLoading: false
                        })
                        time2 += 1;
                    }
                    if (time1 === num && time2 === 1) {
                        this.setState({
                            calcResData,
                            dataType: "line_2"
                        }, () => {
                            if (this.state.dataLoading) {
                                this.setState({
                                    visVisible: true,
                                    dataLoading: false,
                                })
                            }
                        })
                    }
                })
            } else if ((name.indexOf("_f") > -1 && name.indexOf("_o") > -1 && (name.indexOf("25D") > -1 || name.indexOf("3D") > -1)) || (name.indexOf("_s") > -1 && !sameName && (name.indexOf("25D") > -1 || name.indexOf("3D") > -1))) {
                let path_25D = "", path_3D = "";
                if (name.indexOf("25D") > -1) {
                    path_25D = absolutePath;
                    for (let i = 0; i < resFileListData.length; i++) {
                        if (resFileListData[i].name === name.replace("25D", "3D")) {
                            path_3D = resFileListData[i].absolutePath;
                        }
                    }
                } else if (name.indexOf("3D") > -1) {
                    path_3D = absolutePath;
                    for (let i = 0; i < resFileListData.length; i++) {
                        if (resFileListData[i].name === name.replace("3D", "25D")) {
                            path_25D = resFileListData[i].absolutePath;
                        }
                    }
                }
                let resTime = 0, calcResData = {};
                let getData = (path, dataName) => {
                    if (path) {
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
                                    calcResData,
                                    dataType: "line_1"
                                }, () => {
                                    if (this.state.dataLoading) {
                                        this.setState({
                                            visVisible: true,
                                            dataLoading: false,
                                        })
                                    }
                                })
                            }
                        }).catch(err => {
                            this.setState({
                                dataLoading: false
                            })
                        });
                    } else {
                        resTime += 1;
                        if (resTime === 2) {
                            this.setState({
                                calcResData,
                                dataType: "line_1"
                            }, () => {
                                if (this.state.dataLoading) {
                                    this.setState({
                                        visVisible: true,
                                        dataLoading: false,
                                    })
                                }
                            })
                        }
                    }
                }
                getData(path_25D, "data_25D");
                getData(path_3D, "data_3D");
            } else {
                axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                    params: { path: absolutePath }
                }).then(res => {
                    let { data } = res.data;
                    if (Array.isArray(data) && data.length > 0) {
                        this.setState({
                            calcResData: data,
                            dataType: data.length > 1000 ? "2d_1" : "single"
                        }, () => {
                            if (this.state.dataLoading) {
                                this.setState({
                                    visVisible: true,
                                    dataLoading: false
                                })
                            }
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
        } else if (idenMod === 422) {
            this.setState({ dataLoading: true });
            axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                params: { path: absolutePath }
            }).then(res => {
                let { data } = res.data;
                if (Array.isArray(data) && data.length > 0) {
                    this.setState({
                        calcResData: data,
                        dataType: "2d_2"
                    }, () => {
                        if (this.state.dataLoading) {
                            this.setState({
                                visVisible: true,
                                dataLoading: false
                            })
                        }
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
        } else {
            this.setState({ dataLoading: true });
            axios.get("http://" + dockerIP + ":" + vport + '/resInfo', {
                params: { path: absolutePath }
            }).then(res => {
                let { data } = res.data;
                let dataType = "";
                if (Array.isArray(data) && data.length > 0) {
                    if (data[0].length < 6 && data[0].length > 1) {
                        //数组行列调换
                        let new_data = data[0].map((col, i) => data.map(row => row[i]));
                        let deleteIndex = [];
                        //找到值相同的列的序号
                        for (let i = 0; i < new_data.length; i++) {
                            if (Array.from(new Set(new_data[i])).length === 1) {
                                deleteIndex.push(i)
                            }
                        }
                        //删除值相同的列
                        if (deleteIndex.length > 0) {
                            for (let i = 0; i < deleteIndex.length; i++) {
                                data = data.map(item => { item.splice(deleteIndex[i], 1); return item })
                            }
                        }
                    }
                    //带坐标矩阵
                    if (idenMod === 2122) {
                        let xAxis = [], yAxis = [];
                        data.map(item => {
                            yAxis.push(item.splice(0, 1))
                            xAxis.push(item.splice(0, 1))
                            return item;
                        })
                        let yLength = data.length;
                        let xLength = data[0].length;
                        let xmin = Number(xAxis[0]), xrange = xAxis[1] - xAxis[0];
                        let newAxis = [];
                        for (let i = 0; i < xLength; i++) {
                            newAxis.push(xmin + xrange * i);
                        }
                        xAxis = newAxis;
                        let newData = [];
                        for (let i = 0; i < yLength; i++) {
                            for (let j = 0; j < xLength; j++) {
                                newData.push([xAxis[j], yAxis[i], data[i][j]])
                            }
                        }
                        data = newData;
                    }
                    //数组x方向做插值，减少横纵坐标数据长度差异
                    if (idenMod === 2131 || idenMod === 7213) {
                        data = data.map(item => item.map(item2 => Number(item2)));
                        let new_data = data[0].map((col, i) => data.map(row => row[i]));
                        if (data[0].length === 3) {
                            let xData = Array.from(new Set(new_data[0]));
                            let yData = Array.from(new Set(new_data[1]));
                            let xLen = xData.length, yLen = yData.length;
                            let newArr = [];
                            let m = parseInt(yLen / xLen);
                            if (m > 1) {
                                for (let i = 0; i < yLen; i++) {
                                    newArr[i] = [];
                                    for (let j = 0; j < xLen - 1; j++) {
                                        let range = data[i * xLen + j + 1][2] - data[i * xLen + j][2];
                                        for (let k = 0; k < m; k++) {
                                            newArr[i].push(data[i * xLen + j][2] + range / m * k)
                                        }
                                    }
                                }
                                data = newArr;
                            }
                        } else if (data[0].length > 4) {
                            let xLen = data[0].length, yLen = data.length;
                            let m = parseInt(yLen / xLen);
                            let newArr = [];
                            if (m > 1) {
                                for (let i = 0; i < yLen; i++) {
                                    newArr[i] = [];
                                    for (let j = 0; j < xLen - 1; j++) {
                                        let range = data[i][j + 1] - data[i][j];
                                        for (let k = 0; k < m; k++) {
                                            newArr[i].push(data[i][j] + range / m * k)
                                        }
                                    }
                                }
                                data = newArr;
                            }
                        }
                    }
                    if (idenMod === 325) {
                        if ((funcName.indexOf("2D") > -1 && name.indexOf("_voice") > -1) || name.indexOf("residuals") > -1) {
                            data = data.map(item => item[0].trim().replace(/\s+/g, " ").split(" "));
                        }
                    }
                    if (idenMod === 51) {
                        data = data.map(item => String(item).split(" "));
                        data = data[0].map((col, i) => data.map(row => row[i]));
                    }
                    //三个切面
                    if (idenMod === 631 || idenMod === 7214) {
                        let x = [], y = [], z = [];
                        data = data.map(item => item[0].trim().replace(/\s+/g, " ").split(" "));
                        if (data[0].length === 4) {
                            let newArr = [[], [], [], [], []];
                            for (let i = 0, len = data.length; i < len; i++) {
                                x.push(data[i][0]);
                                y.push(data[i][1]);
                                z.push(data[i][2]);
                            }
                            x = Array.from(new Set(x));
                            y = Array.from(new Set(y));
                            z = Array.from(new Set(z));
                            let xNum = x[Math.floor(x.length / 2)], yNum = y[Math.floor(y.length / 2)], zNum = z[Math.floor(z.length / 2)];
                            for (let i = 0, len = data.length; i < len; i++) {
                                if (data[i][0] === xNum) {
                                    newArr[0].push(data[i][3]);
                                }
                                if (data[i][1] === yNum) {
                                    newArr[1].push(data[i][3]);
                                }
                                if (data[i][2] === zNum) {
                                    newArr[2].push(data[i][3]);
                                }
                            }
                            newArr[3].push(x.length, y.length, z.length);
                            newArr[4].push(Math.max(...x), Math.min(...x), Math.max(...y), Math.min(...y), Math.max(...z), Math.min(...z));
                            let max = Math.max(...newArr[0], ...newArr[1], ...newArr[2]), min = Math.min(...newArr[0], ...newArr[1], ...newArr[2]), range = max - min;
                            for (let i = 0; i < 3; i++) {
                                newArr[i] = newArr[i].map(item => parseInt((item - min) / range * 255))
                            }
                            data = newArr;
                            dataType = "cut";
                        }
                    }
                    data = data.map(item => item.map(item2 => Number(item2)));
                    if (!dataType) {
                        if (Array.isArray(data[0])) {
                            if (info.suffix === "csv") {
                                if (data[0].length === 1 || data[0].length === 2) {
                                    dataType = "1d";
                                } else if (data[0].length === 3) {
                                    dataType = "2d";
                                } else if (data[0].length === 4) {
                                    dataType = "3d";
                                } else if (data[0].length > 4) {
                                    dataType = "matrix";
                                }
                            } else if (info.suffix === "msh") {
                                dataType = "msh";
                            } else if (info.suffix === "txt") {
                                dataType = "txt";
                            }
                        } else {
                            dataType = undefined;
                        }
                    }
                    this.setState({
                        calcResData: data,
                        dataType
                    }, () => {
                        if (!dataType) message.error("数据错误,无法可视化");
                        this.setState({
                            visVisible: dataType && true,
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
        let { idenMod } = this.state;
        switch (idenMod) {
            case 51:
                if (paramName === "MatrixFile") {
                    window.open("./static/data/stiff.mtx")
                } else if (paramName === "RightHandFile") {
                    window.open("./static/data/force.txt");
                }
                break;
            case 52:
                if (paramName === "input_Function_file") {
                    window.open("./static/data/Fk.m")
                } else if (paramName === "input_Jacobi_file") {
                    window.open("./static/data/JFk.m");
                }
                break;
            case 311:
            case 312:
            case 313:
            case 314:
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
            started, resultData, resFileListData, isComputing, idenMod, dockerID, dockerIP, vport, logInfoArray, modelIndex, modalVisible, uri, dockerType,
            computed, nowStep, stepNum, currentStep2, proList, calcResData, calcStatus, resType, visVisible, apiName, toggle,
            tdataDrawerVisible, tdataFileListData, fileListLoading, dataLoading, fileModalVisible, imgModalVisible, filePath, dataType, needVis, tinyListener,
            hideUpload, dimension, real, dimensionValue, realValue, startTime, endTime, visIndex, axisData, hasGotParam, defaultIndex, currentFile
        } = this.state;
        const { getFieldDecorator } = this.props.form;
        let getClassName = value => {
            if (value === "用户自定义计算") {
                return "";
            }
            if (dimension) {
                if (dimensionValue === "2D") {
                    if (value.toUpperCase().indexOf("3D") > -1) {
                        return "select-hide";
                    } else {
                        return "";
                    }
                } else {
                    if (value.toUpperCase().indexOf("3D") === -1) {
                        return "select-hide";
                    } else {
                        return "";
                    }
                }
            }
            if (real) {
                if (realValue === "model") {
                    if (value.toUpperCase().indexOf("REAL") > -1) {
                        return "select-hide";
                    } else {
                        return "";
                    }
                } else {
                    if (value.toUpperCase().indexOf("REAL") === -1) {
                        return "select-hide";
                    } else {
                        return "";
                    }
                }
            }
        }
        let during = endTime - startTime;
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
                                {dockerType === 2 && nowStep !== 3 && (
                                    idenMod === 731 ?
                                        <Steps current={currentStep}>
                                            <Step title="启动容器"></Step>
                                            <Step title="应用服务计算"></Step>
                                        </Steps>
                                        :
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
                                            {!idenMod && <p style={{ marginTop: 15 }}>未获取到程序信息，请返回首页重新进入</p>}
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
                                            {dimension &&
                                                <Row style={{ marginTop: 20 }}>
                                                    <Col xs={24} sm={8} className="ant-form-item-label">
                                                        <label style={{ whiteSpace: "nowrap", fontWeight: 500, lineHeight: "32px" }}>维度</label>
                                                    </Col>
                                                    <Col xs={24} sm={16} className="ant-form-item-control-wrapper ant-form-item-control">
                                                        <Radio.Group
                                                            onChange={e => this.setState({
                                                                dimensionValue: e.target.value,
                                                                modelIndex: undefined,
                                                                funcName: undefined,
                                                                texts: [],
                                                                selects: [],
                                                                radios: [],
                                                                checkBoxs: [],
                                                                textAreas: [],
                                                                uploadBoxs: [],
                                                                inputFiles: [],
                                                                uploadFileList: []
                                                            })}
                                                            value={dimensionValue}
                                                        >
                                                            <Radio value={"2D"}>2D</Radio>
                                                            <Radio value={"3D"}>3D</Radio>
                                                        </Radio.Group>
                                                    </Col>
                                                </Row>
                                            }
                                            {real &&
                                                <Row style={{ marginTop: 10 }}>
                                                    <Col xs={24} sm={8} className="ant-form-item-label">
                                                        <label style={{ whiteSpace: "nowrap", fontWeight: 500, lineHeight: "32px" }}>数据类型</label>
                                                    </Col>
                                                    <Col xs={24} sm={16} className="ant-form-item-control-wrapper ant-form-item-control">
                                                        <Radio.Group
                                                            onChange={e => this.setState({
                                                                realValue: e.target.value,
                                                                modelIndex: undefined,
                                                                funcName: undefined,
                                                                texts: [],
                                                                selects: [],
                                                                radios: [],
                                                                checkBoxs: [],
                                                                textAreas: [],
                                                                uploadBoxs: [],
                                                                inputFiles: [],
                                                                uploadFileList: []
                                                            })}
                                                            value={realValue}
                                                        >
                                                            <Radio value={"model"}>模型数据</Radio>
                                                            <Radio value={"real"}>真实数据</Radio>
                                                        </Radio.Group>
                                                    </Col>
                                                </Row>
                                            }
                                            {proList.length > 1 &&
                                                <Row style={{ marginTop: 10 }}>
                                                    <Col xs={24} sm={8} className="ant-form-item-label">
                                                        <label style={{ whiteSpace: "nowrap", fontWeight: 500, lineHeight: "32px" }}>请选择测试模型</label>
                                                    </Col>
                                                    <Col xs={24} sm={16} className="ant-form-item-control-wrapper ant-form-item-control">
                                                        <Select onChange={this.handleSelectModel} defaultValue={proList[defaultIndex]} placeholder="--请选择测试模型--" style={{ width: "100%" }}>
                                                            {proList.map((value, index) =>
                                                                <Option key={value} value={index} className={getClassName(value)}>
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
                                                        <label style={{ whiteSpace: "nowrap", fontWeight: 500, lineHeight: "32px" }}>请选择功能</label>
                                                    </Col>
                                                    <Col xs={24} sm={16} className="ant-form-item-control-wrapper ant-form-item-control">
                                                        <Select onChange={this.handleSelectApi} placeholder="--请选择功能--" style={{ width: "100%" }}>
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
                                                            {!hasGotParam &&
                                                                <div style={{ display: "flex", justifyContent: "center" }}>
                                                                    <Spin spinning={!hasGotParam} tip={"正在获取参数..."} size="large" />
                                                                </div>
                                                            }
                                                            {inputFiles && inputFiles.map(({ paramName, paramNameCN, tip, currentValue, defaultValue }, index) => {
                                                                if (apiName === "计算完全布格异常" && paramName === "topoDetfname") {
                                                                    return null
                                                                }
                                                                return <div style={{ position: "relative" }} key={index}>
                                                                    <Form.Item className="input-file-wrapper" label={<label title={paramNameCN}>{paramName}</label>}>
                                                                        <Tooltip title={apiName !== "上传文件" && ((tip || paramNameCN) + (defaultValue && "，若不上传，则使用默认文件" + defaultValue.split(",")[0]))}>
                                                                            <span className="ant-btn ant-btn-default input-file">
                                                                                选择文件
                                                                                <input type="file" onChange={this.changeInputFile.bind(this, index)} />
                                                                            </span>
                                                                        </Tooltip>
                                                                        <div className="file-name" title={currentValue && currentValue.name}>{currentValue && currentValue.name}</div>
                                                                    </Form.Item>
                                                                    {(idenMod === 311 || idenMod === 312 || idenMod === 313 || idenMod === 314) && apiName !== "上传文件" && defaultValue &&
                                                                        <div className="file-icon file-icon-2" onClick={this.getExampleFile.bind(this, defaultValue.split(",")[0])}>
                                                                            <Icon type="download" title="获取示例文件" />
                                                                            <span className="file-name">示例文件</span>
                                                                        </div>
                                                                    }
                                                                </div>
                                                            }
                                                            )}
                                                            {uploadBoxs && uploadBoxs.map(({ paramNameCN, paramName, defaultValue, tip, enumList }, index) => <div style={{ position: "relative" }} key={index}>
                                                                <Form.Item label={<label title={paramNameCN}>{[321, 322, 323, 324, 325].includes(idenMod) ? paramNameCN : paramName}</label>}>
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
                                                                        beforeUpload={(file, fileList) => {
                                                                            if ((idenMod === 321 || idenMod === 322 || idenMod === 323 || idenMod === 324 || idenMod === 325) && defaultValue) {
                                                                                if (file.name === defaultValue) {
                                                                                    return true
                                                                                } else {
                                                                                    message.error("文件名必须为" + defaultValue, 4)
                                                                                    return false
                                                                                }
                                                                            } else {
                                                                                return true;
                                                                            }
                                                                        }}
                                                                        directory={((idenMod === 222 || idenMod === 7221) && (paramName === "sac_file" || paramName === "input_dir"))}
                                                                        multiple={((idenMod === 222 || idenMod === 7221) && (paramName === "sac_file" || paramName === "input_dir"))}
                                                                        onChange={this.changeUpload.bind(this, index, paramName)}
                                                                        accept={enumList && enumList.join(",")}
                                                                        fileList={uploadFileList[index]}
                                                                    >
                                                                        {hideUpload ?
                                                                            <Button type="default" disabled={hideUpload}><Icon type="upload" />上传文件</Button>
                                                                            :
                                                                            <Tooltip title={(idenMod === 321 || idenMod === 322 || idenMod === 323 || idenMod === 324 || idenMod === 325) && defaultValue ?
                                                                                tip || paramNameCN + ",请上传名称为" + defaultValue + "的文件"
                                                                                :
                                                                                tip || (enumList && `请上传${enumList.join("，")}文件`) || paramNameCN}>
                                                                                <Button type="default" disabled={hideUpload}><Icon type="upload" />上传文件</Button>
                                                                            </Tooltip>
                                                                        }
                                                                    </Upload>
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
                                                            {texts && texts.map(({ paramName, paramNameCN, tip, currentValue, type, enumList, max, min, required }, index) => {
                                                                if (apiName === "计算完全布格异常" && paramName === "det_flag") {
                                                                    return null
                                                                }
                                                                return <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
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
                                                                                                } else if (!/^-?\d*$/.test(Number(value))) {
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
                                                                                                    callback(`${paramName}的值只能为${idenMod === 311 || idenMod === 312 || idenMod === 313 || idenMod === 314 ? "数字类型" : "浮点型"}`);
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
                                                            })}
                                                            {selects && selects.map(({ paramName, paramNameCN, defaultValue, currentValue }, index) =>
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
                                                            {textAreas && textAreas.map(({ paramName, paramNameCN, tip, currentValue }, index) =>
                                                                <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <Tooltip title={tip || paramNameCN}>
                                                                        {getFieldDecorator(paramName, {
                                                                            rules: [{
                                                                                validator: (rule, value, callback) => {
                                                                                    if (!value) {
                                                                                        callback(`${paramName}的值不能为空!`);
                                                                                    } else {
                                                                                        callback();
                                                                                    };
                                                                                }
                                                                            }],
                                                                            initialValue: currentValue
                                                                        })(
                                                                            <TextArea autoSize={{ minRows: 4, maxRows: 2000 }} cols={10} onChange={this.changeTextarea.bind(this, index)} />
                                                                        )}
                                                                    </Tooltip>
                                                                </Form.Item>
                                                            )}
                                                            {radios && radios.map(({ paramName, paramNameCN, defaultValue, currentValue }, index) =>
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
                                                            {checkBoxs && checkBoxs.map(({ paramName, paramNameCN, defaultValue, currentValue }, index) =>
                                                                <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <CheckboxGroup options={defaultValue} value={currentValue} onChange={this.changeCheck.bind(this, index)} />
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
                                                <Button type="primary" loading={loading} onClick={this.runDocker} style={{ marginBottom: 20 }} disabled={computed}>应用服务计算</Button>
                                            }
                                            {(isComputing || computed) &&
                                                <div className="btn-area">
                                                    <Button type="default" style={{ marginBottom: 16 }} onClick={this.handleViewInfo}>查看运行日志</Button>
                                                    <Modal className="loginfo-modal" visible={modalVisible} onCancel={this.handleCancleModal} footer={null}>
                                                        {Array.isArray(logInfoArray) ?
                                                            logInfoArray.map((item, index) => <p key={index} style={{ marginBottom: 5 }}>{item}</p>)
                                                            :
                                                            <p style={{ marginBottom: 5 }}>{logInfoArray}</p>
                                                        }
                                                    </Modal>
                                                    <Button type="default" style={{ marginBottom: 16 }} onClick={this.handleViewTdata}>查看模板结果</Button>
                                                    <Button type="default" style={{ marginBottom: 16, width: 128 }} onClick={() => { this.props.history.push("/console") }}>前往控制台</Button>
                                                    <Popconfirm placement="top" title={<div style={{ maxWidth: 160 }}>停止后将删除该程序并清空所有数据,请确认是否停止？</div>} onConfirm={this.handleKillContain} okText="确认" cancelText="取消">
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
                                    {listener && (dockerIP || uri) && !tinyListener ?
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
                                    {listener && (dockerIP || uri) && tinyListener ?
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
                                    {tinyListener &&
                                        <Modal className="listener-modal" visible={!toggle} onCancel={() => { this.setState({ toggle: true }) }} footer={null}>
                                            <Listener
                                                ip={(dockerType === 2 || dockerType === 4) && dockerIP}
                                                uri={(dockerType === 1 || dockerType === 5) && uri}
                                                toggle={false}
                                            />
                                        </Modal>
                                    }
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
                                    </div>
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
                                                <Table className="calc-filelist-table"
                                                    dataSource={resFileListData}
                                                    columns={fileTableColumns(this)}
                                                    loading={fileListLoading}
                                                    sticky
                                                    pagination={{
                                                        showQuickJumper: resFileListData.length > 50 && true,
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
                                            <p className="calc-time" style={{ fontWeight: "bold", marginBottom: 10 }}>计算时间</p>
                                            <p className="calc-time" style={{ textIndent: "2em", marginBottom: 10 }}>{parseInt(during / 1000 / 60) !== 0 && parseInt(during / 1000 / 60) + "min "}{parseInt(during / 1000) % 60 !== 0 && parseInt(during / 1000) % 60 + "s "}{during % 1000 + "ms"}</p>
                                            {apiName === "计算完全布格异常" ?
                                                <Table className="filelist-table"
                                                    title={() => <span style={{ fontWeight: "bold" }}>计算结果文件</span>}
                                                    dataSource={Object.values(calcResData).map((item, index) => ({ key: index, fileName: item.split("/").pop(), path: item }))}
                                                    columns={[{
                                                        title: '文件名',
                                                        dataIndex: 'fileName',
                                                        align: "center",
                                                        render: text => <p className="table-item-name" title={text}>{text}</p>
                                                    }, {
                                                        title: '下载',
                                                        dataIndex: 'path',
                                                        align: "center",
                                                        render: text => <Button type="primary" onClick={this.downloadData.bind(this, text)}>下载</Button>
                                                    }]}
                                                    footer={null}
                                                    pagination={{
                                                        hideOnSinglePage: true,
                                                        showLessItems: true,
                                                    }}
                                                />
                                                :
                                                <Table className="filelist-table"
                                                    title={() => <span style={{ fontWeight: "bold" }}>计算结果</span>}
                                                    dataSource={
                                                        ["重力观测数据反演（三维正则，参考模型约束）", "重力观测数据反演（多约束反演）", "重力观测数据反演（参考模型-全变分约束）", "MCMC反演", "MCMC反演（参考模型约束）"].includes(apiName) ?
                                                            [{
                                                                key: 0,
                                                                name: "三维密度分布数据.csv",
                                                            }, {
                                                                key: 1,
                                                                name: "重力预测值&残差数据.csv",
                                                            }]
                                                            :
                                                            [{
                                                                key: apiName,
                                                                name: apiName + "_resData.csv",
                                                            }]
                                                    }
                                                    columns={[{
                                                        title: '文件名',
                                                        dataIndex: 'name',
                                                        align: "center",
                                                        render: text => <p className="table-item-name" title={text}>{text}</p>
                                                    }, {
                                                        title: '下载数据',
                                                        align: "center",
                                                        render: record =>
                                                            ["重力观测数据反演（三维正则，参考模型约束）", "重力观测数据反演（多约束反演）", "重力观测数据反演（参考模型-全变分约束）", "MCMC反演", "MCMC反演（参考模型约束）"].includes(apiName) ?
                                                                <Button type="primary" onClick={this.downloadData.bind(this, record.key)}>下载</Button>
                                                                :
                                                                <Button type="primary" onClick={this.downloadData}>下载</Button>
                                                    }, {
                                                        title: '可视化',
                                                        align: "center",
                                                        render: record => needVis ?
                                                            <Button type="primary" onClick={() => { this.setState({ visVisible: true, visIndex: record.key }) }}>可视化</Button>
                                                            : "-"
                                                    }]}
                                                    sticky
                                                    pagination={{
                                                        hideOnSinglePage: true,
                                                    }}
                                                />
                                            }
                                        </>
                                        : <Result status="error" title="计算错误" />
                                    : null
                                }
                            </Card>
                        </Col>
                    </Row>
                    <Drawer title="模板结果" placement="left" visible={tdataDrawerVisible} onClose={this.handleCloseTdataDrawer} width={550}>
                        <ConfigProvider locale={zhCN}>
                            <Table className="calc-filelist-table"
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
                    </Drawer >
                    <Modal className="vis-modal" visible={visVisible} onCancel={() => { this.setState({ visVisible: false }) }} footer={null} destroyOnClose>
                        <Vis
                            data={visIndex === 0 ? [axisData.zp, axisData.yp, axisData.xp, calcResData.DensityDistribution || calcResData.Density || calcResData.density] : calcResData}
                            appName={appName}
                            datatype={dockerType === 2 ? dataType : visIndex === 0 ? apiName + "0" : apiName}
                            fileName={currentFile}
                        />
                    </Modal>
                    <Modal className="file-modal" visible={fileModalVisible} onCancel={this.handleCancleFileModal} footer={null}>
                        <iframe id="file_iframe"
                            src={"http://" + dockerIP + ":" + vport + "/output/" + filePath}
                            title={filePath}
                            scrolling="auto"
                        />
                    </Modal>
                    <Modal className="img-modal" visible={imgModalVisible} onCancel={this.handleCancleImgModal} footer={null}>
                        <img src={"http://" + dockerIP + ":" + vport + "/output/" + filePath} alt={filePath} />
                    </Modal>
                    <div className="data-loading-mask" style={{ display: dataLoading ? "flex" : "none" }}>
                        <div className="close-icon" onClick={() => { this.setState({ dataLoading: false }) }}>
                            <Icon type="close" />
                        </div>
                        <Spin wrapperClassName="data-loading-spin" spinning={dataLoading} tip={"正在获取数据并处理..."} size="large" />
                    </div>
                </Content >
            </div >
        );
    };
};

export default Form.create({ name: "calculate" })(withRouter(Calculate));