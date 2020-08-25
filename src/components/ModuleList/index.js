/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 首页应用列表
 */

import React from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import { Row, Col, Result, Spin, Modal, Drawer, message } from 'antd';
import IconFont from '../../assets/IconFont';
import { apiurl } from '../../assets/url.js';
import { getCookie } from '../../utils/cookies';
import './index.css';

export default class ModuleList extends React.Component {
    state = {
        modules: [],
        subModules: {},
        loading: "loading",
        modalVisible: false,
        drawerVisible: false,
        currentMenu: null,
        currentModule: null,
        docTitle: "",
        docContent: "",
        secondModules: [],
        thirdModules: [],
        modalVisible2: false,
        currentMenu2: null,
    };
    componentDidMount() {
        const _this = this;
        //获取模块名和应用列表数组
        axios.get(apiurl + 'home')
            .then(function (response) {
                _this.setState({
                    modules: Object.keys(response.data),
                    subModules: response.data,
                    loading: "done"
                });
            }).catch(function (error) {
                _this.setState({
                    loading: "error"
                });
            });
    };
    //点击应用时将所点的应用名称保存到sessionStorage中
    setApp(appName) {
        sessionStorage.setItem("appName", appName);
        this.submitClickedApp(appName);
    };
    // 显示二级菜单
    showModal = (menuName, module) => {
        let _this = this;
        axios.get(apiurl + 'subHome', {
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
    // 显示三级菜单
    showSecondModal = menuName => {
        let _this = this;
        axios.get(apiurl + 'twoSubHome', {
            params: {
                twoSubModule: menuName
            }
        }).then(function (response) {
            _this.setState({
                thirdModules: response.data
            })
        }).catch(function (error) {
            message.error("服务器错误", 2)
        });
        this.setState({
            modalVisible2: true,
            currentMenu2: menuName,
        })
    }
    // 点击二级菜单确认按钮
    handleOk = e => {
        this.setState({
            modalVisible: false
        });
    };
    // 点击二级菜单取消按钮
    handleCancel = e => {
        this.setState({
            modalVisible: false
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
            modalVisible2: false
        });
    };
    // 显示帮助文档抽屉，获取数据
    showDrawer = (index) => {
        let _this = this;
        axios.get(apiurl + 'mod/doc', {
            params: {
                modIndex: index + 1
            }
        }).then(function (response) {
            _this.setState({
                docTitle: response.data.data.docTitle,
                docContent: response.data.data.docContent
            });
        }).catch(function (error) {
            message.error("服务器错误", 2)
        });
        this.setState({
            drawerVisible: true
        });
    };
    // 关闭帮助文档抽屉
    onClose = () => {
        this.setState({
            drawerVisible: false
        });
    };
    // 点击应用时将点击记录提交
    submitClickedApp = appName => {
        axios({
            method: 'post',
            url: apiurl + 'recentvisit',
            responseType: 'json',
            data: {
                userName: getCookie("userName"),
                projectName: appName
            },
            headers: { 'Content-Type': 'application/json' }
        })
    }
    render() {
        const { modules, subModules, loading, modalVisible, drawerVisible, currentMenu, currentModule, docTitle, docContent, secondModules, thirdModules, modalVisible2, currentMenu2 } = this.state;
        function type(index) {
            switch (index) {
                case 0:
                    return "earthdatabase";
                case 1:
                    return "earthdiqiu-";
                case 2:
                    return "earthIconfont_field";
                case 3:
                    return "earthmagneton";
                case 4:
                    return "earthcomputer1";
                case 5:
                    return "earthAIzhineng";
                default:
                    break;
            };
        };
        return (
            <div id="moudule-list">
                {loading === "loading" ?
                    <div style={{ width: "100%", height: "400px", lineHeight: "400px", textAlign: "center" }}>
                        <Spin tip="应用列表加载中，请稍候..." />
                    </div>
                    :
                    loading === "done" ?
                        <Row gutter={10} className="app-row" style={{ flexWrap: "wrap" }}>
                            {modules.map((module, moduleIndex) => {
                                return (
                                    <Col xs={24} sm={24} md={12} key={moduleIndex}>
                                        <div className="box-shadow app">
                                            <div className="app-icon">
                                                <IconFont type={type(moduleIndex)} />
                                            </div>
                                            <div className="app-des">
                                                <div>
                                                    <span onClick={this.showDrawer.bind(this, moduleIndex)} className="module-name">{module}</span>
                                                </div>
                                                <div className="app-list">
                                                    <ul>
                                                        {
                                                            subModules[module].map(({ menuName, url, hasSub }, index) =>
                                                                url ?
                                                                    <li key={index} title={menuName}>
                                                                        <IconFont type="earthlianjie" />
                                                                        <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.submitClickedApp.bind(this, menuName)}>{menuName}</a>
                                                                    </li>
                                                                    :
                                                                    hasSub ?
                                                                        <li key={index} title={menuName}>
                                                                            <IconFont type="earthcaidan2" />
                                                                            <span onClick={this.showModal.bind(this, menuName, module)}>{menuName}</span>
                                                                        </li>
                                                                        :
                                                                        <li key={index} title={menuName}>
                                                                            <IconFont type="earthjinru1" />
                                                                            <Link to="/details" onClick={this.setApp.bind(this, menuName)}>{menuName}</Link>
                                                                        </li>
                                                            )
                                                        }
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                )
                            }
                            )}
                        </Row>
                        :
                        <Result
                            status="warning"
                            title="服务器错误,无法获取应用列表,请尝试刷新或联系管理员"
                        />
                }
                <Modal
                    className="module-modal"
                    title={currentMenu}
                    visible={modalVisible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    footer={null}
                >
                    {currentMenu && currentModule ?
                        <ul>
                            {secondModules.map(({ menuName, url, hasSub }, index) =>
                                url ?
                                    <li key={index} title={menuName}>
                                        <IconFont type="earthlianjie" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.submitClickedApp.bind(this, menuName)}>{menuName}</a>
                                    </li>
                                    : hasSub ?
                                        <li key={index} title={menuName}>
                                            <IconFont type="earthcaidan2" />
                                            <span onClick={this.showSecondModal.bind(this, menuName)}>{menuName}</span>
                                        </li>
                                        :
                                        <li key={index} title={menuName}>
                                            <IconFont type="earthjinru1" />
                                            <Link to="/details" onClick={this.setApp.bind(this, menuName)}>{menuName}</Link>
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
                        thirdModules.map(({ menuName, url, hasSub }, index) =>
                            url ?
                                <li key={index} title={menuName}>
                                    <IconFont type="earthlianjie" />
                                    <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.submitClickedApp.bind(this, menuName)}>{menuName}</a>
                                </li>
                                :
                                <li key={index} title={menuName}>
                                    <IconFont type="earthjinru1" />
                                    <Link to="/details" onClick={this.setApp.bind(this, menuName)}>{menuName}</Link>
                                </li>
                        )
                        : null}
                </Modal>
                <Drawer
                    title={docTitle}
                    placement="right"
                    closable={false}
                    onClose={this.onClose}
                    visible={drawerVisible}
                    width={500}
                >
                    <p>{docContent}</p>
                </Drawer>
            </div>
        );
    };
};