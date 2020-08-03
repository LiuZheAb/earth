//首页应用列表
import React from 'react';
import { Row, Col, Result, Spin, Modal, Drawer, message } from 'antd';
import { apiurl } from '../../assets/urls';
import { Link } from "react-router-dom";
import axios from 'axios';
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
            message.error("服务器错误", 2)
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
            <div id="app-service-anchor">
                {loading === "loading" ?
                    <div style={{ width: "100%", height: "400px", lineHeight: "400px", textAlign: "center" }}>
                        <Spin tip="应用列表加载中，请稍候..." />
                    </div>
                    :
                    loading === "done" ?
                        <Row gutter={10} className="app-row" style={{ flexWrap: "wrap" }}>
                            {modules.map((module, index) => {
                                return (
                                    <Col span={12} key={index}>
                                        <div className="box-shadow app">
                                            <div className="app-icon">
                                                <IconFont type={type(index)} />
                                            </div>
                                            <div className="app-des">
                                                <p className="module-name" onClick={this.showDrawer.bind(this, index)}>{module}</p>
                                                <div className="app-list">
                                                    <Row gutter={10}>
                                                        {subModules[module].map(({ menuName, url }, menuIndex) =>
                                                            <Col span={24} key={menuIndex} style={{ marginBottom: "10px" }}>
                                                                {url ?
                                                                    <a href={url} target="_blank" rel="noopener noreferrer">{menuName}</a> :
                                                                    <p className="app-name" onClick={this.showModal.bind(this, menuName, module)}>{menuName}</p>}
                                                            </Col>
                                                        )}
                                                    </Row>
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
                    title={currentMenu}
                    visible={modalVisible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    footer={null}
                >
                    {currentMenu && currentModule ?
                        secondModules.map(({ menuName, url, hasSub }, index) =>
                            url ?
                                <p><a href={url} target="_blank" rel="noopener noreferrer">{menuName}</a></p>
                                : hasSub ?
                                    <p style={{ cursor: "pointer" }} onClick={this.showSecondModal.bind(this, menuName)}>{menuName}</p>
                                    : <p><Link to="/details" onClick={this.setApp.bind(this, menuName)}>{menuName}</Link></p>
                        )
                        : null}
                </Modal>
                <Modal
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
                                <p><a href={url} target="_blank" rel="noopener noreferrer">{menuName}</a></p>
                                : <p><Link to="/details" onClick={this.setApp.bind(this, menuName)}>{menuName}</Link></p>
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