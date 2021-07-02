/*
 *文件名 : 421Calc.js
 *作者 : 刘哲
 *创建时间 : 2021/4/24
 *文件描述 : 混合谱元法应用详情页
 */

import React, { Fragment } from 'react';
import { Layout, Button, Select, Radio, Checkbox, Input, message, Card, Col, Row, Form, Upload, Icon, Empty, Result, Steps, Spin, Tooltip, Modal, Drawer, ConfigProvider, Table, Popconfirm } from 'antd';
import { Link, withRouter } from "react-router-dom";
import zhCN from 'antd/es/locale/zh_CN';
import axios from 'axios';
import IconFont from '../../components/IconFont';
import Listener from "../../components/Listener";
import checkNullvalue from "../../utils/checkNullvalue";
import apiPromise from '../../assets/url.js';
import { getCookie } from '../../utils/cookies';
import Vis from "../../components/Vis";
import './index.css';

let api = "";
const { Content, Header } = Layout;
const { Option } = Select;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const { TextArea } = Input;
const { Step } = Steps;
const fileTableColumns = (_this, isTData) => [{
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
            <Button type="primary" onClick={_this.handleOpenVisModal.bind(_this, info, isTData)}>可视化</Button>
            : "文件过大，请下载后使用专业软件进行可视化")
        : "暂不支持此格式"
}];
let getObjectValue = (objArr, paramName) => {
    for (let i = 0, len = objArr.length; i < len; i++) {
        if (objArr[i].paramName === paramName) {
            return objArr[i].currentValue;
        }
    }
};
let getObjectIndex = (objArr, paramName) => {
    for (let i = 0, len = objArr.length; i < len; i++) {
        if (objArr[i].paramName === paramName) {
            return i;
        }
    }
};

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
            resultData: [],
            resFileListData: [],
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
            initialMaterialNum: undefined,
            changedMaterialNum: undefined,
            sourceParamType: "点源",
            materialIndex: 1,
            materialModalVisible: false,
            materialName: undefined,
            materialValue: undefined,
            currentParamIndex: undefined,
            nullParam: undefined,
            hasGotInfo: true,
            dimension: false,
            real: false,
            dimensionValue: "2D",
            realValue: "model",
            hasGotParam: true,
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
        texts[index].currentValue = e.target ? e.target.value : e;
        if (index === getObjectIndex(texts, "Dimension")) {
            texts[getObjectIndex(texts, "Nbds")].currentValue = e === "3D" ? "6" : "4";
        }
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
    //启动容器
    startDocker = () => {
        let { username, idenMod, currentStep, appName, stepNum } = this.state;
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
            let { data, status, proList, dockerIP } = response.data;
            this.setState({
                loading: false,
                dockerType: status,
            });
            switch (status) {
                case 0:
                    //未登陆
                    message.error(data, 2);
                    break;
                case 2:
                    if (stepNum === 1 && proList.length > 1) {
                        proList.unshift("用户自定义计算");
                    }
                    let dimension = false, real = false;
                    for (let i = 0; i < proList.length; i++) {
                        let name = proList[i];
                        if (name.toUpperCase().indexOf("3D") > -1) {
                            dimension = true;
                            break;
                        }
                        if (name.toUpperCase().indexOf("REAL") > -1) {
                            real = true;
                            break;
                        }
                    }
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
                        started: true,
                        dimension,
                        real,
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
                modelIndex = 1;
            }
        }
        this.setState({
            modelIndex,
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
        this.getPram(modelIndex);
    }
    //获取参数
    getPram = index => {
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
                initialMaterialNum: Number(getObjectValue(texts, "Nblks")),
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
        let { selects, radios, checkBoxs, textAreas, idenMod, uploadBoxs, dockerID, dockerIP,
            vport, currentStep, moduleName, modelIndex, initialMaterialNum, hasGotParam } = this.state;
        let texts = JSON.parse(JSON.stringify(this.state.texts));
        if (modelIndex >= 0) {
            if (checkNullvalue(texts) && checkNullvalue(selects) && checkNullvalue(radios) && checkNullvalue(checkBoxs) && checkNullvalue(textAreas)) {
                if (hasGotParam) {
                    this.props.form.validateFields({ force: true }, (err, values) => {
                        if (!err) {
                            this.setState({
                                loading: true,
                            });
                            if (Number(getObjectValue(texts, "Nblks")) < initialMaterialNum) {
                                for (let i = 0; i < texts.length; i++) {
                                    let paramName = texts[i].paramName;
                                    if (paramName.indexOf("epsilon") === 0 || paramName.indexOf("sigma_e") === 0 || paramName.indexOf("mu") === 0 || paramName.indexOf("sigma_m") === 0) {
                                        if (Number(paramName.split(" ")[1]) > Number(getObjectValue(texts, "Nblks"))) {
                                            texts.splice(i, 1);
                                            i -= 1;
                                        }
                                    }
                                }
                            }
                            let BC_type = [], value = getObjectValue(texts, "BC_type");
                            for (let i = 0; i < Number(getObjectValue(texts, "Nbds")); i++) {
                                BC_type.push(value)
                            }
                            BC_type = BC_type.join(" ");
                            texts[getObjectIndex(texts, "BC_type")].currentValue = BC_type;
                            let makeJson = `{ "texts" :${JSON.stringify(texts)},"selects" :${JSON.stringify(selects)},"radios" :${JSON.stringify(radios)},"checkBoxs" :${JSON.stringify(checkBoxs)},"textAreas" :${JSON.stringify(textAreas)},"uploadBoxs" :${JSON.stringify(uploadBoxs)}}`;
                            axios({
                                method: 'post',
                                url: api + 'createPFile',
                                data: {
                                    idenMod: idenMod,
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
                                    this.setState({
                                        currentStep: currentStep + 1
                                    });
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
            }
        } else {
            message.error("请选择模型获取参数列表", 2);
        }
    }
    //运行
    runDocker = () => {
        let { username, idenMod, dockerID, dockerIP, vport, stepNum, modelIndex, appName, funcName } = this.state;
        this.setState({ loading: true, isComputing: true });
        axios({
            method: 'post',
            url: api + 'computeContain',
            data: {
                username,
                idenMod,
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
                disabled: true,
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
    handleOpenVisModal = (info, isTData) => {
        let { absolutePath, name } = info;
        let { dockerIP, vport } = this.state;
        let resFileListData = isTData ? this.state.tdataFileListData : this.state.resFileListData
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
                if (/25D_s[1-9]_1/.test(resFileListData[i].name)) {
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
    handleChangeMaterialNum = (index, e) => {
        let { initialMaterialNum, changedMaterialNum, texts, materialIndex } = this.state;
        let diff = changedMaterialNum ? Number(e.target.value) - changedMaterialNum : Number(e.target.value) - initialMaterialNum;
        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                texts.splice(getObjectIndex(texts, "Nbds") - 1, 0, ...[
                    {
                        "paramName": `epsilon ${initialMaterialNum + 1 + i}`,
                        "paramNameCN": `区域${initialMaterialNum + 1 + i}相对介电常数`,
                        "tip": "",
                        "defaultValue": null,
                        "currentValue": "0 0 0 0 0 0 0 0 0"
                    }, {
                        "paramName": `sigma_e ${initialMaterialNum + 1 + i}`,
                        "paramNameCN": `区域${initialMaterialNum + 1 + i}电导率`,
                        "tip": "",
                        "defaultValue": null,
                        "currentValue": "0 0 0 0 0 0 0 0 0"
                    }, {
                        "paramName": `mu ${initialMaterialNum + 1 + i}`,
                        "paramNameCN": `区域${initialMaterialNum + 1 + i}相对介电常数`,
                        "tip": "",
                        "defaultValue": null,
                        "currentValue": "0 0 0 0 0 0 0 0 0"
                    }, {
                        "paramName": `sigma_m ${initialMaterialNum + 1 + i}`,
                        "paramNameCN": `区域${initialMaterialNum + 1 + i}磁导率`,
                        "tip": "",
                        "defaultValue": null,
                        "currentValue": "0 0 0 0 0 0 0 0 0"
                    }
                ]);
            }
            this.setState({ changedMaterialNum: Number(e.target.value) });
        }
        if (materialIndex > Number(e.target.value)) {
            materialIndex = undefined;
        }
        texts[getObjectIndex(texts, "Nblks")].currentValue = e.target.value;
        this.setState({ texts, materialIndex });
    }
    showMaterialModel = (materialName, materialValue, index) => {
        let valueList = materialValue.split(" ");
        let arr = [];
        for (let i = 0; i < valueList.length / 3; i++) {
            arr.push([valueList[i * 3], valueList[i * 3 + 1], valueList[i * 3 + 2]]);
        }
        this.setState({
            materialValue: arr,
            materialName,
            currentParamIndex: index,
            materialModalVisible: true
        });
    }
    hideMaterialModel = () => {
        let { nullParam } = this.state;
        if (nullParam) {
            message.error(`请设置${nullParam}的值！`)
        } else {
            this.setState({ materialModalVisible: false })
        }
    }
    handleChangeMaterialValue = (matrixIndex, e) => {
        let { texts, currentParamIndex } = this.state;
        let arr = texts[currentParamIndex].currentValue.split(" ");
        arr[matrixIndex] = e.target.value;
        texts[currentParamIndex].currentValue = arr.join(" ");
        this.setState({ texts });
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
        let { username, appName, texts, selects, radios, checkBoxs, textAreas, uploadBoxs, inputFiles, uploadFileList, loading, listener, currentStep,
            started, resultData, resFileListData, isComputing, idenMod, dockerID, dockerIP, vport, logInfoArray, modelIndex, modalVisible, uri, dockerType,
            computed, nowStep, stepNum, disabled, proList, calcResData, calcStatus, resType, visVisible, toggle,
            tdataDrawerVisible, tdataFileListData, fileListLoading, dataLoading, fileModalVisible, imgModalVisible, filePath,
            sourceParamType, materialIndex, materialModalVisible, materialName, materialValue, dataType, tinyListener,
            dimension, real, dimensionValue, realValue, funcName
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
                                {dockerType === 2 &&
                                    <Steps current={currentStep}>
                                        <Step title="启动容器"></Step>
                                        <Step title="提交参数"></Step>
                                        <Step title="应用服务计算"></Step>
                                    </Steps>
                                }
                                <div>
                                    {nowStep === 1 && currentStep === 0 &&
                                        <div style={{ textAlign: "center", paddingTop: 50 }}>
                                            <Button type="primary" loading={loading} disabled={started} onClick={this.startDocker}>{started ? "已启动" : "启动容器"}</Button>
                                        </div>
                                    }
                                    {(nowStep === 1 && currentStep === 1) ?
                                        <>
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
                                                <Row style={{ marginTop: 20 }}>
                                                    <Col xs={24} sm={8} className="ant-form-item-label">
                                                        <label style={{ whiteSpace: "nowrap", fontWeight: 500, lineHeight: "32px" }}>请选择测试模型</label>
                                                    </Col>
                                                    <Col xs={24} sm={16} className="ant-form-item-control-wrapper ant-form-item-control">
                                                        <Select onChange={this.handleSelectModel} value={funcName} placeholder="--请选择测试模型--" style={{ width: "100%" }}>
                                                            {proList.map((value, index) =>
                                                                <Option key={value} value={index} className={getClassName(value)}>
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
                                                        />
                                                        :
                                                        <Form {...formItemLayout} onSubmit={this.createPFile} className="calculate-form">
                                                            {inputFiles === null ? null : inputFiles.map(({ paramName, paramNameCN, tip, currentValue }, index) =>
                                                                <Form.Item className="input-file-wrapper" label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <Tooltip title={tip || paramNameCN}>
                                                                        <span className="ant-btn ant-btn-default input-file">选择文件
                                                                            <input type="file" id="file" onChange={this.changeInputFile.bind(this, index)} />
                                                                        </span>
                                                                    </Tooltip>
                                                                    <div style={{ marginLeft: 10 }}>{currentValue && currentValue.name}</div>
                                                                </Form.Item>
                                                            )}
                                                            {texts === null ? null : texts.map(({ paramName, paramNameCN, tip, defaultValue, currentValue, type, enumList, max, min }, index) => {
                                                                let textItem = newHandler => <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <Tooltip title={tip || paramNameCN}>
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
                                                                                            } else if (/\s/.test(value)) {
                                                                                                callback(`${paramName}的值不能包含空格`);
                                                                                            } else if (!enumList.includes(value)) {
                                                                                                callback(`${paramName}的值只能为[${enumList}]`);
                                                                                            } else {
                                                                                                callback();
                                                                                            };
                                                                                            break;
                                                                                        case "int":
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
                                                                                            break;
                                                                                        case "double":
                                                                                            if (!value) {
                                                                                                callback(`${paramName}的值不能为空!`);
                                                                                            } else if (/\s/.test(value)) {
                                                                                                callback(`${paramName}的值不能包含空格`);
                                                                                            } else if (isNaN(Number(value))) {
                                                                                                callback(`${paramName}的值只能为浮点型`);
                                                                                            } else if (max && Number(value) > Number(max)) {
                                                                                                callback(`${paramName}的值不能大于${max}`);
                                                                                            } else if (min && Number(value) < Number(min)) {
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
                                                                            <Input onChange={newHandler ? newHandler : this.changeText.bind(this, index)} disabled={paramName === "Recvs_file"} />
                                                                        )}
                                                                    </Tooltip>
                                                                </Form.Item>;
                                                                let selectItem = type === "enum" && <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <Tooltip title={tip || paramNameCN}>
                                                                        <Select onChange={this.changeText.bind(this, index)} placeholder={paramNameCN} defaultValue={currentValue}>
                                                                            {enumList.map(item => <Option value={item} key={item}>{item}</Option>)}
                                                                        </Select>
                                                                    </Tooltip>
                                                                </Form.Item>;
                                                                let radioItem = type === "boolean" && <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                    <RadioGroup onChange={this.changeText.bind(this, index)} defaultValue={currentValue}>
                                                                        <Radio value={"true"}>true</Radio>
                                                                        <Radio value={"false"}>false</Radio>
                                                                    </RadioGroup>
                                                                </Form.Item>;
                                                                let uploadItem = (upload, i) => <Form.Item label={<label title={upload.paramNameCN}>{upload.paramName}</label>} key={i}>
                                                                    <Tooltip title={upload.tip || (upload.enumList && `请上传${upload.enumList.join("，")}文件`) || upload.paramNameCN}>
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
                                                                                fileIndex: i + 1
                                                                            }}
                                                                            className="upload-btn"
                                                                            onChange={this.changeUpload.bind(this, i)}
                                                                            accept={upload.enumList && upload.enumList.join(",")}
                                                                            fileList={uploadFileList[i]}
                                                                        >
                                                                            <Button type="default"><Icon type="upload" />上传文件</Button>
                                                                        </Upload>
                                                                        <></>{/* 加空标签是为了显示tooltip */}
                                                                    </Tooltip>
                                                                </Form.Item>
                                                                if (paramName.indexOf("epsilon") === 0 || paramName.indexOf("sigma_e") === 0 || paramName.indexOf("mu") === 0 || paramName.indexOf("sigma_m") === 0) {
                                                                    if (Number(paramName.split(" ")[1]) === materialIndex) {
                                                                        return <Form.Item label={<label title={paramNameCN}>{paramName}</label>} key={index}>
                                                                            <Tooltip title={tip || paramNameCN}>
                                                                                <Button onClick={this.showMaterialModel.bind(this, paramName, currentValue, index)} style={{ height: 32, fontSize: 14 }}>设置</Button>
                                                                                <></>{/* 加空标签是为了显示tooltip */}
                                                                            </Tooltip>
                                                                        </Form.Item>;
                                                                    } else {
                                                                        return null;
                                                                    }
                                                                } else {
                                                                    switch (paramName) {
                                                                        case "Recvs_file":
                                                                            return <Fragment key={index}>
                                                                                <div className="devide-line">
                                                                                    <div className="devide-line-title">工作路径参数</div>
                                                                                </div>
                                                                                {/* {textItem()} */}
                                                                                {uploadBoxs === null || uploadBoxs === undefined ? null : uploadBoxs.map((upload, i) =>
                                                                                    upload.paramName === "Meshfile" && uploadItem(upload, i)
                                                                                )}
                                                                            </Fragment>;
                                                                        case "Nth":
                                                                            return <Fragment key={index}>
                                                                                <div className="devide-line">
                                                                                    <div className="devide-line-title">基本参数</div>
                                                                                </div>
                                                                                {textItem()}
                                                                            </Fragment>;
                                                                        case "Unit":
                                                                        case "Mixed_type":
                                                                        case "EM_type":
                                                                            return selectItem;
                                                                        case "Save_field":
                                                                            return <Fragment key={index}>
                                                                                <div className="devide-line">
                                                                                    <div className="devide-line-title">场数据</div>
                                                                                </div>
                                                                                {radioItem}
                                                                            </Fragment>;
                                                                        case "Field_file":
                                                                            return getObjectValue(texts, "Save_field") === "true" && textItem();
                                                                        case "Flag_read_recvs":
                                                                            return <Fragment key={index}>
                                                                                <div className="devide-line">
                                                                                    <div className="devide-line-title">接收点数据</div>
                                                                                </div>
                                                                                {radioItem}
                                                                                {getObjectValue(texts, "Flag_read_recvs") === "true" && uploadBoxs && uploadBoxs.map((upload, i) =>
                                                                                    upload.paramName === "Recvs_xyz" && uploadItem(upload, i)
                                                                                )}
                                                                            </Fragment>;
                                                                        case "Dimension":
                                                                            return <Fragment key={index}>
                                                                                <div className="devide-line">
                                                                                    <div className="devide-line-title">模型参数</div>
                                                                                </div>
                                                                                {selectItem}
                                                                            </Fragment>;
                                                                        case "Nkz":
                                                                            return getObjectValue(texts, "Dimension") === "2.5D" && selectItem;
                                                                        case "Flag_sweep":
                                                                            return getObjectValue(texts, "Dimension") === "3D" && radioItem;
                                                                        case "Sweep_distance":
                                                                            return getObjectValue(texts, "Dimension") === "3D" && getObjectValue(texts, "Flag_sweep") === "true" && textItem();
                                                                        case "Sweep_elems":
                                                                            return getObjectValue(texts, "Dimension") === "3D" && getObjectValue(texts, "Flag_sweep") === "true" && textItem();
                                                                        case "Frequency":
                                                                            return <Fragment key={index}>
                                                                                <div className="devide-line">
                                                                                    <div className="devide-line-title">源参数设置</div>
                                                                                </div>
                                                                                {textItem()}
                                                                                <Form.Item label="源参数类型">
                                                                                    <Select
                                                                                        onChange={value => this.setState({ sourceParamType: value })}
                                                                                        placeholder="请选择源参数类型"
                                                                                        defaultValue={sourceParamType}
                                                                                    >
                                                                                        <Option value="点源">点源</Option>
                                                                                        {getObjectValue(texts, "Dimension") === "2.5D" && <Option value="线源">线源</Option>}
                                                                                    </Select>
                                                                                </Form.Item>
                                                                            </Fragment>
                                                                        case "Src_type":
                                                                            return sourceParamType === "点源" && selectItem;
                                                                        case "Nsrcs":
                                                                        case "Src_amp":
                                                                        case "Src_locx":
                                                                        case "Src_locy":
                                                                        case "Src_locz":
                                                                        case "Src_px":
                                                                        case "Src_py":
                                                                        case "Src_pz":
                                                                            return sourceParamType === "点源" && textItem();
                                                                        case "Line_dir":
                                                                        case "Line_I_dir":
                                                                            return sourceParamType === "线源" && selectItem;
                                                                        case "Line_srcs":
                                                                        case "Line_blks":
                                                                        case "Line_amp":
                                                                        case "Line_start":
                                                                        case "Line_end":
                                                                            return sourceParamType === "线源" && getObjectValue(texts, "Dimension") === "2.5D" && textItem();
                                                                        case "Nblks":
                                                                            let materialList = [];
                                                                            for (let i = 0; i < currentValue; i++) {
                                                                                materialList.push(i + 1);
                                                                            }
                                                                            return <Fragment key={index}>
                                                                                <div className="devide-line">
                                                                                    <div className="devide-line-title">材料参数设置</div>
                                                                                </div>
                                                                                {textItem(this.handleChangeMaterialNum.bind(this, index))}
                                                                                <Form.Item label="材料编号">
                                                                                    <Select
                                                                                        onChange={value => this.setState({ materialIndex: value })}
                                                                                        placeholder="请选择材料编号"
                                                                                        value={materialIndex}
                                                                                    >
                                                                                        {materialList.map((item) =>
                                                                                            <Option value={item} key={item}>材料 {item}</Option>
                                                                                        )}
                                                                                    </Select>
                                                                                </Form.Item>
                                                                            </Fragment>;
                                                                        case "Nbds":
                                                                            return <Fragment key={index}>
                                                                                <div className="devide-line">
                                                                                    <div className="devide-line-title">边界条件</div>
                                                                                </div>
                                                                                <Form.Item label={<label title={paramNameCN}>{paramName}</label>}>
                                                                                    <Tooltip title={tip || paramNameCN}>
                                                                                        <Input value={currentValue} disabled />
                                                                                        <></>{/* 加空标签是为了显示tooltip */}
                                                                                    </Tooltip>
                                                                                </Form.Item>
                                                                            </Fragment>;
                                                                        case "BC_type":
                                                                            return selectItem;
                                                                        case "PML_order":
                                                                            return getObjectValue(texts, "BC_type") === "0" && selectItem;
                                                                        case "NPML":
                                                                        case "PML_d":
                                                                        case "PML_real":
                                                                        case "PML_imag":
                                                                            return getObjectValue(texts, "BC_type") === "0" && textItem();
                                                                        default:
                                                                            return textItem();
                                                                    }
                                                                }
                                                            }
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
                                                            <Modal
                                                                className="material-modal"
                                                                visible={materialModalVisible}
                                                                onCancel={this.hideMaterialModel}
                                                                footer={null}
                                                                title={materialName}
                                                                destroyOnClose
                                                            >
                                                                <Form>
                                                                    {materialValue && materialValue.map((item, i) =>
                                                                        <Row key={i}>
                                                                            {item.map((item2, j) =>
                                                                                <Col span={8} key={j}>
                                                                                    <Form.Item>
                                                                                        {getFieldDecorator(String(i * 3 + j), {
                                                                                            rules: [{
                                                                                                validator: (rule, value, callback) => {
                                                                                                    if (!value) {
                                                                                                        callback(`参数${materialName}[${j},${i}]的值不能为空!`);
                                                                                                        this.setState({ nullParam: `参数${materialName}[${j},${i}]` });
                                                                                                    } else {
                                                                                                        callback();
                                                                                                        this.setState({ nullParam: undefined });
                                                                                                    };
                                                                                                }
                                                                                            }],
                                                                                            initialValue: item2,
                                                                                            getValueFromEvent: e => {
                                                                                                return e.target.value.replace(/\s+/g, "")
                                                                                            },
                                                                                        })(
                                                                                            <Input onChange={this.handleChangeMaterialValue.bind(this, i * 3 + j)}></Input>
                                                                                        )}
                                                                                    </Form.Item>
                                                                                </Col>
                                                                            )}
                                                                        </Row>
                                                                    )}
                                                                </Form>
                                                            </Modal>
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
                                    {(nowStep === 1 && currentStep === 2) ?
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
                                {isComputing || resType || Object.keys(calcResData).length > 0 || !calcStatus || computed ? null : <Empty description="容器未启动" />}
                                {isComputing &&
                                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                                        <Spin size="large" tip="正在计算..." />
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
                                                    columns={fileTableColumns(this, false)}
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
                            </Card>
                        </Col>
                    </Row>
                    <Drawer title="模板结果" placement="left" visible={tdataDrawerVisible} onClose={this.handleCloseTdataDrawer} width={550}>
                        <ConfigProvider locale={zhCN}>
                            <Table className="calc-filelist-table"
                                dataSource={tdataFileListData}
                                columns={fileTableColumns(this, true)}
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
                        <Vis data={calcResData} appName={appName} datatype={dataType} />
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
                        <Spin wrapperClassName="data-loading-spin" spinning={dataLoading} tip={"正在获取数据并处理..."} size="large"></Spin>
                    </div>
                </Content >
            </div >
        );
    };
};

export default Form.create({ name: "calculate" })(withRouter(Calculate));