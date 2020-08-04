//首页应用列表
import React from 'react';
import { Row, Col, Result, Spin, Modal, Drawer, message } from 'antd';
import { apiurl } from '../../assets/urls';
import { Link } from "react-router-dom";
import axios from 'axios';
import { getCookie } from '../../utils/cookies';
import './index.css';
import IconFont from '../../assets/IconFont';

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
    handleOk = e => {
        this.setState({
            modalVisible: false
        });
    };

    handleCancel = e => {
        this.setState({
            modalVisible: false
        });
    };
    handleOk2 = e => {
        this.setState({
            modalVisible2: false
        });
    };

    handleCancel2 = e => {
        this.setState({
            modalVisible2: false
        });
    };
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
    onClose = () => {
        this.setState({
            drawerVisible: false
        });
    };
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
                    return "anticondatabase";
                case 1:
                    return "anticondiqiu-";
                case 2:
                    return "anticonIconfont_field";
                case 3:
                    return "anticonmagneton";
                case 4:
                    return "anticoncomputer1";
                case 5:
                    return "anticonAIzhineng";
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
                                                                    <li>
                                                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" onClick={this.submitClickedApp.bind(this, menuName)}>{menuName}</a>
                                                                        <IconFont className="icon-link" type="anticonlianjie" />
                                                                    </li>
                                                                    :
                                                                    hasSub ?
                                                                        <li key={index}>
                                                                            <span onClick={this.showModal.bind(this, menuName, module)}>{menuName}</span>
                                                                            <IconFont className="icon-menu" type="anticoncaidan2" />
                                                                        </li>
                                                                        :
                                                                        <li key={index}>
                                                                            <Link to="/details" onClick={this.setApp.bind(this, menuName)}>{menuName}</Link>
                                                                            <IconFont className="icon-enter" type="anticonjinru1" />
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
                                    <li key={index}>
                                        <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.submitClickedApp.bind(this, menuName)}>{menuName}</a>
                                        <IconFont className="icon-link" type="anticonlianjie" />
                                    </li>
                                    : hasSub ?
                                        <li key={index}>
                                            <span onClick={this.showSecondModal.bind(this, menuName)}>{menuName}</span>
                                            <IconFont className="icon-menu" type="anticoncaidan2" />
                                        </li>
                                        :
                                        <li key={index}>
                                            <Link to="/details" onClick={this.setApp.bind(this, menuName)}>{menuName}</Link>
                                            <IconFont className="icon-enter" type="anticonjinru1" />
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
                                <li key={index}>
                                    <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.submitClickedApp.bind(this, menuName)}>{menuName}</a>
                                    <IconFont className="icon-link" type="anticonlianjie" />
                                </li>
                                :
                                <li key={index}>
                                    <Link to="/details" onClick={this.setApp.bind(this, menuName)}>{menuName}</Link>
                                    <IconFont className="icon-enter" type="anticonjinru1" />
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