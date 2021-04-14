import React, { Component } from 'react';
import { ConfigProvider, Table, Button, Tag, Drawer, message, Modal, notification, Spin, Popconfirm } from "antd";
import zhCN from 'antd/es/locale/zh_CN';
import apiPromise from '../../assets/url.js';
import axios from "axios";
import { getCookie } from '../../utils/cookies';
import { withRouter } from "react-router-dom";
import Vis from "../Vis";
import "./index.css";

let api = "";
const createColumns = _this =>
    [
        {
            title: '序号',
            dataIndex: 'key',
            align: "center",
        }, {
            title: '程序名',
            dataIndex: 'appName',
            align: "center",
            render: text => <p title={text} className="ellipsis-column">{text}</p>
        },
        // {
        //     title: '程序编号',
        //     dataIndex: 'idenMod',
        //     align: "center",
        //     render: text => <p title={text} className="ellipsis-column">{text}</p>
        // }, 
        {
            title: '测试模型',
            dataIndex: 'funcName',
            align: "center",
            render: text => <p title={text} className="ellipsis-column">{text}</p>
        }, {
            title: '所属模块',
            dataIndex: 'moduleName',
            align: "center",
            render: text => <p title={text} className="ellipsis-column">{text}</p>
        }, {
            title: '启动时间',
            dataIndex: 'startTime',
            align: "center",
            render: text => <p title={text} className="ellipsis-column">{text}</p>
        }, {
            title: '当前步骤',
            dataIndex: 'step',
            align: "center",
        }, {
            title: '运行状态',
            dataIndex: 'status',
            align: "center",
            render: status => status === "0"
                ? <Tag color="#2db7f5">运行中</Tag>
                : status === "2" || status === "fail" ?
                    <Tag color="#cd201f">{status === "2" && "错误"}{status === "fail" && "异常"}</Tag>
                    : status === "1" || status === "3"
                        ? <Tag color="#87d068">已完成</Tag>
                        : null
        }, {
            title: '日志或结果',
            dataIndex: 'view',
            align: "center",
            render: (text, info) => <Button type="primary" onClick={() => _this.handleView(info)}>查看</Button>
        }, {
            title: '下一步',
            align: "center",
            render: (text, info) => {
                let { nowStep, stepNum, status } = info
                if (stepNum === 1) {
                    return "无"
                } else {
                    if (nowStep < stepNum) {
                        if (status === "1") {
                            return <Button type="primary" onClick={() => _this.nextStep(info)}>运行</Button>
                        } else if (status === "0") {
                            return <Button title="上一步未完成" disabled>运行</Button>
                        } else {
                            return "运行异常"
                        }
                    } else {
                        return "无"
                    }
                }
            }
        }, {
            title: '操作',
            align: "center",
            width: 125,
            render: (text, info) =>
                <Popconfirm placement="top" title={<div style={{ maxWidth: 120 }}>停止后将清空该程序所有数据,请确认是否停止？</div>} onConfirm={() => _this.handleKill(info)} okText="确认" cancelText="取消">
                    <Button type="danger" loading={info.loading}>停止</Button>
                </Popconfirm>
        }
    ];
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
    render: (text, info) => ["csv", "msh"].includes(info.suffix) ?
        (info.size < 100 ?
            <Button type="primary" onClick={_this.handleOpenVisModal.bind(_this, info)}>可视化</Button>
            : "文件过大，请下载后使用专业软件进行可视化")
        : "暂不支持此格式"
}];
const noticeContent = item => <ul className="notice-content">
    <li><span>程序名:</span>{item.appname}</li>
    <li><span>测试模型:</span>{item.funcname}</li>
    <li><span>所属模块:</span>{item.modname}</li>
    <li><span>启动时间:</span>{item.starttime}</li>
    <li><span>当前步骤:</span>{item.nowStep}</li>
</ul>;

class index extends Component {
    state = {
        seconds: 0,
        username: getCookie("userName") || "",
        resData: "",
        dataSource: [],
        listLoading: false,
        resDrawerVisible: false,
        resFileListData: [],
        uri: "",
        logModalVisible: false,
        logInfoArray: [],
        appName: "",
        funcName: "",
        fileModalVisible: false,
        fileListLoading: false,
        imgModalVisible: false,
        filePath: "",
        visVisible: false,
        idenMod: undefined,
        dockerIP: undefined,
        vport: undefined,
        calcResData: [],
        dataType: "",
        dataLoading: false,
        pollingErrTimes: 0,
        currentItemInfo: {}
    }
    componentDidMount() {
        let { username } = this.state;
        apiPromise.then(res => {
            api = res.data.api;
            if (username) {
                this.getDockerList();
                this.setState({ listLoading: true });
            }
        });
    }
    updateDataSource = data => {
        if (data !== null) {
            let dataSource = [];
            dataSource = data.map((info, i) => {
                let { appname, modname, starttime, status, docid, hostip, hostport, index, funcname, idenMod, nowStep, stepNum, hasUrl, runStatus } = info;
                return {
                    key: i,
                    appName: appname,
                    funcName: funcname ? funcname : "无",
                    moduleName: modname,
                    startTime: starttime,
                    status: runStatus === 1 ? String(runStatus) : status,
                    dockerID: docid,
                    dockerIP: hostip,
                    vport: hostport,
                    modelIndex: index,
                    idenMod,
                    nowStep,
                    stepNum,
                    step: nowStep + "/" + stepNum,
                    hasUrl,
                    loading: false
                }
            });
            this.setState({ dataSource, resData: data });
        } else {
            this.setState({ dataSource: [], resData: [] });
        }
    }
    getDockerList = () => {
        let { username } = this.state;
        axios({
            method: 'post',
            url: api + 'dockercenter',
            data: {
                username
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            this.updateDataSource(res.data.data);
            this.setState({ listLoading: false });
            this.checkTimer = setInterval(() => {
                this.pollingData();
            }, 5000)
        }).catch(err => {
        });
    }
    pollingData = () => {
        let { username, pollingErrTimes } = this.state;
        axios({
            method: 'post',
            url: api + 'dockercenter',
            data: {
                username
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            let { resData } = this.state;
            let { data } = response.data;
            if (data.length > resData.length) {
                this.updateDataSource(data);
                let newApp = JSON.parse(JSON.stringify(data)).splice(resData.length, data.length - resData.length);
                for (let i = 0, len = newApp.length; i < len; i++) {
                    notification.info({
                        message: '有新程序开始运行',
                        description: noticeContent(newApp[i])
                    });
                }
            }
            for (let i = 0, len = resData.length; i < len; i++) {
                if (JSON.stringify(resData[i]) !== JSON.stringify(data[i])) {
                    this.updateDataSource(data);
                    if (resData[i].status === "0" && data[i].status === "1") {
                        notification.success({
                            message: `程序 ${i} 运行成功`,
                            description:
                                <>
                                    {noticeContent(data[i])}
                                    <div style={{ textAlign: "right" }}>
                                        <Button type="primary" onClick={() => this.handleView(this.state.dataSource[i])}>查看结果</Button>
                                    </div>
                                </>
                        });
                    }
                    if (resData[i].status === "0" && data[i].status === "2") {
                        notification.error({
                            message: `程序 ${i} 运行失败`,
                            description: noticeContent(data[i])
                        });
                    }
                    if (resData[i].status === "1" && data[i].status === "0") {
                        notification.info({
                            message: '有新程序开始运行',
                            description: noticeContent(data[i])
                        });
                    }
                }
            }
        }).catch(error => {
            pollingErrTimes += 1;
            if (pollingErrTimes > 3) {
                message.error("服务器无响应");
                clearInterval(this.checkTimer);
            }
        });
    }
    handleView = info => {
        let { dockerID, dockerIP, vport, status, modelIndex, idenMod, nowStep, stepNum, hasUrl, appName, funcName, moduleName } = info;
        this.setState({ currentItemInfo: info })
        switch (status) {
            case "0":
                this.setState({
                    logModalVisible: true,
                    logInfoArray: []
                });
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
                break;
            case "1":
                if (hasUrl === "0") {
                    if (nowStep < stepNum) {
                        message.info("当前步骤无可查询结果，请点击下一步运行")
                    } else {
                        this.setState({
                            resDrawerVisible: true,
                            fileListLoading: true,
                            appName,
                            funcName,
                            uri: "http://" + dockerIP + ":" + vport,
                            idenMod,
                            dockerIP,
                            vport,
                            resFileListData: []
                        })
                        axios.get("http://" + dockerIP + ":" + vport + "/fileList",
                            {
                                params: {
                                    index: modelIndex,
                                    idenMod,
                                    tData: 0
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
                                    resFileListData: resFileList,
                                })
                            }).catch(err => {
                                message.error("获取结果失败");
                            })
                    }
                } else if (hasUrl === "1") {
                    window.open("http://" + dockerIP + ":" + vport);
                }
                break;
            case "2":
                message.error("运行错误");
                break;
            case "3":
                sessionStorage.setItem("appName", appName);
                sessionStorage.setItem("funcName", funcName);
                sessionStorage.setItem("moduleName", moduleName);
                sessionStorage.setItem("dockerType", 5);
                sessionStorage.setItem("idenMod", idenMod / Math.pow(10, nowStep - 1));
                sessionStorage.setItem("nowStep", nowStep + 1);
                sessionStorage.setItem("stepNum", stepNum);
                sessionStorage.setItem("dockerID", dockerID);
                sessionStorage.setItem("dockerIP", dockerIP);
                sessionStorage.setItem("baseUrl", "http://" + dockerIP + ":" + vport);
                sessionStorage.setItem("vport", vport);
                sessionStorage.setItem("modelIndex", modelIndex);
                this.props.history.push("/calculate");
                break;
            case "fail":
                message.error("异常");
                break;
            default:
                break;
        }
    }
    nextStep = info => {
        let { idenMod, nowStep, stepNum, appName, moduleName, dockerID, dockerIP, vport, modelIndex, funcName } = info;
        sessionStorage.setItem("appName", appName);
        sessionStorage.setItem("funcName", funcName);
        sessionStorage.setItem("moduleName", moduleName);
        sessionStorage.setItem("dockerType", 2);
        sessionStorage.setItem("idenMod", idenMod / Math.pow(10, nowStep - 1));
        sessionStorage.setItem("nowStep", nowStep + 1);
        sessionStorage.setItem("stepNum", stepNum);
        sessionStorage.setItem("dockerID", dockerID);
        sessionStorage.setItem("dockerIP", dockerIP);
        sessionStorage.setItem("vport", vport);
        sessionStorage.setItem("modelIndex", modelIndex);
        if (nowStep === 2 && info.appName === "ERPS USTC") {
            this.props.history.push("/operateData");
        } else {
            this.props.history.push("/calculate");
        }
    }
    handleCloseDrawer = () => {
        this.setState({
            resDrawerVisible: false,
        })
    }
    handleDownload = path => {
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
                elementA.href = this.state.uri + "/output/" + path;
                document.body.appendChild(elementA);
                elementA.click();
                document.body.removeChild(elementA);
                break;
        }
    }
    handleOpenVisModal = info => {
        let { absolutePath } = info;
        console.log(info);
        let { dockerIP, vport, appName, currentItemInfo } = this.state;
        if ((currentItemInfo.idenMod === 411 || currentItemInfo.idenMod === 412) && absolutePath.split("/").pop() === "mod.csv") {
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
    handleCancleVisModal = () => {
        this.setState({ visVisible: false })
        this.checkTimer = setInterval(() => {
            this.pollingData();
        }, 5000);
        document.getElementsByTagName("body")[0].style.overflow = "auto";
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
    handleKill = info => {
        let { dockerID, dockerIP } = info;
        let { dataSource, username } = this.state;
        dataSource[info.key].loading = true;
        this.setState({ dataSource });
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
        }).then(() => {
            axios({
                method: 'post',
                url: api + 'dockercenter',
                data: {
                    username
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => {
                this.updateDataSource(res.data.data);
            }).catch(err => {
            });
        }).catch(() => {
            message.error("服务器无响应");
        });
    }
    componentWillUnmount() {
        clearInterval(this.logTimer);
        clearInterval(this.checkTimer);
        this.setState({
            visVisible: false,
            resDrawerVisible: false
        })
        this.setState = () => {
            return;
        }
    }
    render() {
        const { dataSource, listLoading, resDrawerVisible, resFileListData, logModalVisible, logInfoArray, fileModalVisible,
            imgModalVisible, uri, filePath, visVisible, calcResData, dataLoading, appName, funcName, fileListLoading, dataType
        } = this.state;
        return (
            <div id="console" className="box-shadow">
                <ConfigProvider locale={zhCN}>
                    <Table
                        title={() => <span style={{ fontWeight: "bold" }}>控制台</span>}
                        dataSource={dataSource}
                        columns={createColumns(this)}
                        loading={listLoading}
                        pagination={{
                            showQuickJumper: dataSource.length > 50 && true,
                            hideOnSinglePage: true,
                            showLessItems: true,
                        }}
                        scroll={{ x: "max-content" }}
                    />
                </ConfigProvider>
                <Drawer title="运行结果" placement="left" visible={resDrawerVisible} onClose={this.handleCloseDrawer} width={550}>
                    <ConfigProvider locale={zhCN}>
                        <Table className="filelist-table"
                            title={() => <span style={{ fontSize: 18, margin: 0 }}>{appName}{funcName !== "无" && `【${funcName}】`}</span>}
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
                    <Modal className="vis-modal" visible={visVisible} onCancel={this.handleCancleVisModal} footer={null} destroyOnClose>
                        <Vis data={calcResData} appName={appName} datatype={dataType} />
                    </Modal>
                </Drawer >
                <Modal className="log-modal" visible={logModalVisible} onCancel={this.handleCancleLogModal} footer={null}>
                    {logInfoArray.map((item, index) => <p key={index} style={{ marginBottom: 5 }}>{item}</p>)}
                </Modal>
            </div >
        )
    }
}

export default withRouter(index);