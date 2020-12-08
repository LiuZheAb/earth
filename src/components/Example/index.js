import React, { Component } from 'react';
import axios from 'axios';
import { Col, Modal, message } from 'antd';
import { Link } from "react-router-dom";
import IconFont from '../IconFont';
import apiPromise from '../../assets/url.js';
import { getCookie } from "../../utils/cookies";
import "./index.css";
let api = "";

export default class index extends Component {
    constructor(props) {
        super(props)

        this.state = {
            data: [],
            modalVisible: false,
            currentMenu: null,
            secondModules: [],
            thirdModules: [],
            modalVisible2: false,
            currentMenu2: null,
        }
    }
    componentDidMount() {
        const _this = this;
        //获取模块名和应用列表数组
        apiPromise.then(res => {
            api = res.data.api;
            axios.get(api + 'home')
                .then(function (response) {
                    _this.setState({
                        data: response.data["典型示范 (Decomonstration)"],
                    });
                }).catch(function (error) {
                });
        });
    }
    // 显示二级菜单
    showModal = (menuName, module) => {
        this.setState({
            secondModules: []
        });
        let _this = this;
        axios.get(api + 'subHome', {
            params: {
                subModule: menuName
            }
        }).then(function (response) {
            _this.setState({
                secondModules: response.data
            })
        }).catch(function (error) {
            message.error("服务器无响应", 2)
        });
        this.setState({
            modalVisible: true,
            currentMenu: menuName,
            currentModule: module
        })
    }
    runApp(appName, moduleName) {
        axios({
            method: 'post',
            url: api + 'runContain',
            data: {
                appName,
                moduleName
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            let { uri } = response.data;
            let msg = response.data.message;
            if (uri) {
                message.loading("应用启动中", 2);
                setTimeout(() => {
                    window.open(uri);
                }, 2000);
            } else if (msg) {
                message.info(msg, 2)
            }
        }).catch(function (error) {
            message.error("服务器无响应");
        });
    }
    //点击应用时将所点的应用名称保存到sessionStorage中
    setApp(appName, moduleName, idenMod) {
        sessionStorage.setItem("appName", appName);
        sessionStorage.setItem("moduleName", this.state.currentMenu2 || this.state.currentMenu || moduleName);
        sessionStorage.setItem("idenMod", idenMod);
        this.submitClickedApp(appName);
    };
    // 点击二级菜单确认按钮
    handleOk = e => {
        this.setState({
            modalVisible: false
        });
    };
    // 点击二级菜单取消按钮
    handleCancel = e => {
        this.setState({
            modalVisible: false,
            currentMenu: null
        });
    };
    // 点击三级菜单确认按钮
    handleOk2 = e => {
        this.setState({
            modalVisible2: false
        });
    };
    // 点击三级菜单取消按钮
    handleCancel2 = e => {
        this.setState({
            modalVisible2: false,
            currentMenu2: null
        });
    };
    // 点击应用时将点击记录提交
    submitClickedApp = appName => {
        axios({
            method: 'post',
            url: api + 'recentvisit',
            responseType: 'json',
            data: {
                userName: getCookie("userName"),
                projectName: appName
            },
            headers: { 'Content-Type': 'application/json' }
        })
    }
    render() {
        const { data, modalVisible, currentMenu, secondModules, thirdModules, modalVisible2, currentMenu2 } = this.state;
        return (
            <Col lg={12} xs={24} style={{ display: "flex", alignItems: "stretch",marginTop:10 }}>
                <div className="box-shadow example-area" style={{ height: "100%", width: "100%" }}>
                    <div className="app-icon">
                        <IconFont type="earthcase" />
                    </div>
                    <div className="app-des">
                        <span className="module-name" style={{ cursor: "default" }}>
                            典型示范 (Decomonstration)
                        </span>
                        <div className="app-list">
                            <ul>
                                {data.map(({ menuName, url, hasSub, hasParam, idenMod }, index) =>
                                    <li key={index} title={menuName}>
                                        {url ?
                                            <>
                                                <IconFont type="earthlianjie" />
                                                <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.setApp.bind(this, menuName, undefined, idenMod)}>{menuName}</a>
                                            </>
                                            :
                                            hasSub ?
                                                <>
                                                    <IconFont type="earthcaidan2" />
                                                    <span onClick={this.showModal.bind(this, menuName, undefined)}>{menuName}</span>
                                                </>
                                                :
                                                menuName.indexOf("参数库") === -1
                                                    ?
                                                    hasParam ?
                                                        <>
                                                            <IconFont type="earthjinru1" />
                                                            <Link to="/details" onClick={this.setApp.bind(this, menuName, undefined, idenMod)}>{menuName}</Link>
                                                        </>
                                                        :
                                                        <>
                                                            <IconFont type="earthyunhang" />
                                                            <span onClick={() => { this.runApp(menuName); this.setApp(menuName, undefined, idenMod) }}>{menuName}</span>
                                                        </>
                                                    :
                                                    <>
                                                        <IconFont type="earthjinru1" />
                                                        <span>{menuName}</span>
                                                    </>
                                        }
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
                <Modal
                    className="module-modal"
                    title={currentMenu}
                    visible={modalVisible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    footer={null}
                >
                    {currentMenu ?
                        <ul>
                            {secondModules.map(({ menuName, url, hasSub, hasParam, idenMod }, index) =>
                                <li key={index} title={menuName}>
                                    {url ?
                                        <>
                                            <IconFont type="earthlianjie" />
                                            <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.setApp.bind(this, menuName, undefined, idenMod)}>{menuName}</a>
                                        </>
                                        : hasSub ?
                                            <>
                                                <IconFont type="earthcaidan2" />
                                                <span onClick={this.showSecondModal.bind(this, menuName)}>{menuName}</span>
                                            </>
                                            :
                                            hasParam ?
                                                <>
                                                    <IconFont type="earthjinru1" />
                                                    <Link to="/details" onClick={this.setApp.bind(this, menuName, undefined, idenMod)}>{menuName}</Link>
                                                </>
                                                :
                                                <>
                                                    <IconFont type="earthyunhang" />
                                                    <span onClick={() => { this.runApp(menuName, currentMenu); this.setApp(menuName, undefined, idenMod) }}>{menuName}</span>
                                                </>
                                    }
                                </li>
                            )}
                        </ul>
                        : null}
                </Modal>
                <Modal
                    className="module-modal"
                    title={currentMenu2}
                    visible={modalVisible2}
                    onOk={this.handleOk2}
                    onCancel={this.handleCancel2}
                    footer={null}
                    style={{ top: 150 }}
                >
                    {currentMenu2 ?
                        thirdModules.map(({ menuName, url, hasParam, idenMod }, index) =>
                            <li key={index} title={menuName}>
                                {url ?
                                    <>
                                        <IconFont type="earthlianjie" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.setApp.bind(this, menuName, undefined, idenMod)}>{menuName}</a>
                                    </>
                                    :
                                    hasParam ?
                                        <>
                                            <IconFont type="earthjinru1" />
                                            <Link to="/details" onClick={this.setApp.bind(this, menuName, undefined, idenMod)}>{menuName}</Link>
                                        </>
                                        :
                                        <>
                                            <IconFont type="earthyunhang" />
                                            <span onClick={() => { this.runApp(menuName, currentMenu2); this.setApp(menuName, undefined, idenMod) }}>{menuName}</span>
                                        </>
                                }
                            </li>
                        )
                        : null}
                </Modal>
            </Col>
        )
    }
}
