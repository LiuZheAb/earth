import React, { Component } from 'react';
import { Table, Button, Tag, Drawer, message, List, Modal } from "antd";
import apiPromise from '../../assets/url.js';
import axios from "axios";
import { getCookie } from '../../utils/cookies';
import "./index.css";

let api = "";
const createCloumns = _this =>
    [
        {
            title: '序号',
            dataIndex: 'key',
            align: "center",
        }, {
            title: '程序名',
            dataIndex: 'name',
            align: "center",
        }, {
            title: '所属模块',
            dataIndex: 'model',
            align: "center",
        }, {
            title: '启动时间',
            dataIndex: 'startTime',
            align: "center",
        }, {
            title: '运行状态',
            dataIndex: 'status',
            align: "center",
            render: status => status === "0"
                ? <Tag color="#2db7f5">运行中</Tag>
                : status === "2" ?
                    <Tag color="#cd201f">错误</Tag>
                    : status === "1"
                        ? <Tag color="#87d068">已完成</Tag>
                        : null
        }, {
            title: '日志或结果',
            dataIndex: 'view',
            align: "center",
            render: (text, info) => <Button type="primary" onClick={() => _this.handleView(info)}>查看</Button>
        }, {
            title: '操作',
            dataIndex: 'action',
            align: "center",
            render: (text, info) => <Button type="danger" onClick={() => _this.handleKill(info)}>停止</Button>
        }
    ];
export default class index extends Component {
    state = {
        username: getCookie("userName") ? getCookie("userName") : "",
        dataSource: [],
        resDrawerVisible: false,
        resFileList: {},
        uri: "",
        logModalVisible: false,
        logInfoArray: []
    }
    logTimer = undefined
    componentDidMount() {
        apiPromise.then(res => {
            api = res.data.api;
            this.getDockerList();
        });
    }
    getDockerList = () => {
        let { username } = this.state;
        axios({
            method: 'post',
            url: api + 'dockercenter',
            data: {
                username,
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            let { data } = res.data;
            let dataSource = data.map((info, i) => {
                let { funcname, modname, starttime, status, docid, hostip, hostport, index, idenMod } = info;
                return {
                    key: i,
                    name: funcname,
                    model: modname,
                    startTime: starttime,
                    status,
                    dockerID: docid,
                    dockerIP: hostip,
                    vport: hostport,
                    index,
                    idenMod
                }
            });
            this.setState({ dataSource });
        }).catch(err => {
        });
    }
    handleView = info => {
        let { dockerID, dockerIP, vport, status, index, idenMod } = info;
        switch (status) {
            case "0":
                this.setState({ logModalVisible: true });
                let times = 0, _this = this;
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
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].toLowerCase().replace(/ +/g, "").indexOf("matlab") >= 0 || data[i].indexOf("r:/status") >= 0) {
                                // data[i] = "\r\n";
                                data.splice(i, 1);
                                i -= 1;
                            }
                        }
                        console.log(data);
                        _this.setState({ logInfoArray: data });
                    }).catch(function () {
                        message.error("服务器无响应");
                        times += 1;
                        if (times > 4) {
                            clearInterval(_this.logTimer);
                        }
                    });
                }, 1000)
                break;
            case "1":
                axios.get("http://" + dockerIP + ":" + vport + "/fileList", { params: { index, idenMod } })
                    .then(res => {
                        this.setState({
                            resDrawerVisible: true,
                            resFileList: res.data.data,
                            uri: "http://" + dockerIP + ":" + vport
                        })
                    })
                    .catch(err => {
                        message.error("获取结果失败");
                    })
                break;
            case "2":
                message.error("运行错误");
                break;
            default:
                break;
        }
    }
    handleClose = () => {
        this.setState({
            resDrawerVisible: false
        })
    }
    handleDownload = path => {
        var elementA = document.createElement('a');
        elementA.style.display = 'none';
        elementA.href = this.state.uri + "/output/" + path;
        document.body.appendChild(elementA);
        elementA.click();
        document.body.removeChild(elementA);
    }
    handleCancleModal = () => {
        clearInterval(this.logTimer);
        this.setState({ logModalVisible: false });
    }
    handleKill = info => {
        let { dockerID, dockerIP } = info;
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
            _this.getDockerList();
        }).catch(function () {
            message.error("服务器无响应");
        });
    }
    render() {
        const { dataSource, resDrawerVisible, resFileList, logModalVisible, logInfoArray } = this.state;
        return (
            <div id="console" className="box-shadow" >
                <Table dataSource={dataSource} columns={createCloumns(this)} />
                <Drawer title="运行结果" placement="right" visible={resDrawerVisible} onClose={this.handleClose} width={500}>
                    <List
                        size="small"
                        bordered
                        dataSource={Object.keys(resFileList)}
                        renderItem={item => <List.Item style={{ display: "flex", justifyContent: "space-between" }}>
                            {item}
                            <Button type="primary" onClick={this.handleDownload.bind(this, resFileList[item][1])}>下载</Button>
                        </List.Item>}
                    />
                </Drawer>
                <Modal className="loginfo-modal" visible={logModalVisible} onCancel={this.handleCancleModal} footer={null}>
                    {logInfoArray.map((item, index) => <p key={index} style={{ marginBottom: 5 }}>{item}</p>)}
                </Modal>
            </div>
        )
    }
}
