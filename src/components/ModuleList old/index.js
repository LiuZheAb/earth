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
        modules: {},
        parentModules: [],
        dataTab: 2,
        appIndex: 0,
        loading: "loading",
        modalVisible: false,
        drawerVisible: false,
        currentApp: null,
        currentModule: null,
        docTitle: "",
        docContent: ""
    };
    componentDidMount() {
        const _this = this;
        //获取模块名和应用列表数组
        axios.get(apiurl + 'home')
            .then(function (response) {
                _this.setState({
                    modules: response.data,
                    parentModules: Object.keys(response.data),
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
    showModal = (app, module) => {
        this.setState({
            modalVisible: true,
            currentApp: app,
            currentModule: module
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
        const { modules, parentModules, loading, modalVisible, drawerVisible, currentApp, currentModule, docTitle, docContent } = this.state;
        function type(index) {
            switch (index) {
                case 0:
                    return "anticondatabase";
                case 1:
                    return "anticonrelitu";
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
                            {parentModules.map((module, index) =>
                                <Col span={12} key={index}>
                                    <div className="box-shadow app">
                                        <div className="app-icon">
                                            <IconFont type={type(index)} />
                                        </div>
                                        <div className="app-des">
                                            <p className="module-name" onClick={this.showDrawer.bind(this, index)}>{module}</p>
                                            <div className="app-list">
                                                <Row gutter={10}>
                                                    {Object.keys(modules[module]).map((app, appIndex) =>
                                                        <Col span={6} key={appIndex} style={{ marginBottom: "10px" }}>
                                                            <p className="app-name" onClick={this.showModal.bind(this, app, module)}>{app}</p>
                                                        </Col>
                                                    )}
                                                </Row>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            )}
                        </Row>
                        :
                        <Result
                            status="warning"
                            title="服务器错误,无法获取应用列表,请尝试刷新或联系管理员"
                        />
                }
                <Modal
                    title={currentApp}
                    visible={modalVisible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    footer={null}
                >
                    {currentApp && currentModule ?
                        modules[currentModule][currentApp].map(
                            (app, index) =>
                                <p key={index}>
                                    <Link to="/details" onClick={this.setApp.bind(this, app)}>{app}</Link>
                                </p>)
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