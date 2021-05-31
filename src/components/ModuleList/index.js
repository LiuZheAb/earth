/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 首页应用列表
 */

import React from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import { Row, Col, Result, Spin, Modal, Drawer, message, Pagination } from 'antd';
import { Document, Page, pdfjs } from 'react-pdf';
import IconFont from '../IconFont';
import { getCookie } from '../../utils/cookies';
import './index.css';

pdfjs.GlobalWorkerOptions.workerSrc = `./js/pdf.worker.js`;

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
        pdfModalVisible: false,
        numPages: null,
        pageNumber: 1,
        currentPdfMenu: null
    };
    componentDidMount() {
        let { data, loading, api } = this.props;
        this.setState({
            loading,
            api
        });
        if (data) {
            let data_copy = JSON.parse(JSON.stringify(data));
            delete data_copy["典型示范 (Demonstration)"];
            this.setState({
                modules: Object.keys(data_copy),
                subModules: data_copy,
            });
        }
    };
    //点击应用时将所点的应用名称保存到sessionStorage中
    setApp(appName, moduleName, idenMod, stepNum) {
        sessionStorage.setItem("appName", appName);
        sessionStorage.setItem("moduleName", this.state.currentMenu2 || this.state.currentMenu || moduleName);
        sessionStorage.setItem("idenMod", idenMod);
        sessionStorage.setItem("stepNum", stepNum);
        sessionStorage.setItem("nowStep", 1);
        this.submitClickedApp(appName);
    };
    // 显示二级菜单
    showModal = (menuName, module) => {
        this.setState({
            secondModules: []
        });
        axios.get(this.state.api + 'subHome', {
            params: {
                subModule: menuName
            }
        }).then(response => {
            this.setState({
                secondModules: response.data
            })
        }).catch(error => {
            message.error("服务器无响应", 2)
        });
        this.setState({
            modalVisible: true,
            currentMenu: menuName,
            currentModule: module
        })
    }
    // 显示pdf菜单
    showPdfModal = menuName => {
        this.setState({
            pdfModalVisible: true,
            currentPdfMenu: menuName,
            pageNumber: 1
        })
    }
    // 显示三级菜单
    showSecondModal = menuName => {
        this.setState({
            thirdModules: []
        });
        axios.get(this.state.api + 'twoSubHome', {
            params: {
                twoSubModule: menuName
            }
        }).then(response => {
            this.setState({
                thirdModules: response.data
            });
        }).catch(error => {
            message.error("服务器错误", 2)
        });
        this.setState({
            modalVisible2: true,
            currentMenu2: menuName,
        });
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
            modalVisible: false,
            currentMenu: null
        });
    };
    // 点击pdf菜单确认按钮
    handlePdfOk = e => {
        this.setState({
            pdfModalVisible: false
        });
    };
    // 点击pdf菜单取消按钮
    handlePdfCancel = e => {
        this.setState({
            pdfModalVisible: false,
            currentPdfMenu: null
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
    // 显示帮助文档抽屉，获取数据
    showDrawer = (index) => {
        this.setState({
            docTitle: "",
            docContent: ""
        });
        axios.get(this.state.api + 'mod/doc', {
            params: {
                modIndex: index + 1
            }
        }).then(response => {
            this.setState({
                docTitle: response.data.data.docTitle,
                docContent: response.data.data.docContent
            });
        }).catch(error => {
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
            url: this.state.api + 'recentvisit',
            responseType: 'json',
            data: {
                userName: getCookie("userName"),
                projectName: appName
            },
            headers: { 'Content-Type': 'application/json' }
        })
    }
    onDocumentLoadSuccess = ({ numPages }) => {
        this.setState({ numPages });
    }
    onChange = page => {
        this.setState({ pageNumber: page });
    };
    runApp(appName, moduleName) {
        axios({
            method: 'post',
            url: this.state.api + 'runContain',
            data: {
                appName,
                moduleName
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
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
        }).catch(error => {
            message.error("服务器无响应");
        });
    }
    static getDerivedStateFromProps(nextProps, prevState) {
        let { loading, api, data } = nextProps;
        if (loading !== prevState.loading) {
            if (data) {
                let data_copy = JSON.parse(JSON.stringify(data));
                delete data_copy["典型示范 (Demonstration)"];
                return {
                    loading,
                    api,
                    modules: Object.keys(data_copy),
                    subModules: data_copy,
                }
            } else {
                return {
                    loading,
                    api,
                }
            }
        }
        return null;
    }
    render() {
        const { modules, subModules, loading, modalVisible, drawerVisible, currentMenu, currentPdfMenu, docTitle, docContent, secondModules, thirdModules, modalVisible2, currentMenu2, pdfModalVisible, pageNumber, numPages } = this.state;
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
                        <Row className="app-row" gutter={10} style={{ flexWrap: "wrap" }}>
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
                                                        {subModules[module].map(({ menuName, url, hasSub, idenMod, stepNum }, index) =>
                                                            <li key={index} title={menuName}>
                                                                {url ?
                                                                    <>
                                                                        <IconFont type="earthlianjie" />
                                                                        <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.setApp.bind(this, menuName, module, idenMod, stepNum)}>{menuName}</a>
                                                                    </>
                                                                    :
                                                                    hasSub ?
                                                                        <>
                                                                            <IconFont type="earthcaidan2" />
                                                                            <span onClick={this.showModal.bind(this, menuName, module)}>{menuName}</span>
                                                                        </>
                                                                        :
                                                                        menuName.indexOf("数据标准") === -1
                                                                            ?
                                                                            <>
                                                                                <IconFont type="earthjinru1" />
                                                                                <Link to={menuName.indexOf("数据库") === -1 ? "/calculate" : "bdcenter"} onClick={this.setApp.bind(this, menuName, module, idenMod, stepNum)}>{menuName}</Link>
                                                                            </>
                                                                            :
                                                                            <>
                                                                                <IconFont type="earthbookresource" />
                                                                                <span onClick={this.showPdfModal.bind(this, menuName)}>{menuName}</span>
                                                                            </>
                                                                }
                                                            </li>
                                                        )}
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
                        <Result status="warning" title="服务器错误,无法获取应用列表,请尝试刷新或联系管理员" />
                }
                <Modal
                    className="pdf-modal"
                    title={currentPdfMenu}
                    visible={pdfModalVisible}
                    onOk={this.handlePdfOk}
                    onCancel={this.handlePdfCancel}
                    footer={null}
                >
                    {currentPdfMenu ?
                        <>
                            <Document
                                file={currentPdfMenu.indexOf("地质数据标准") === -1 ? "./static/pdf/Geophysics.pdf" : "./static/pdf/Geology.pdf"}
                                onLoadSuccess={this.onDocumentLoadSuccess}
                                loading="正在努力加载中"
                                externalLinkTarget="_blank"
                            >
                                <Page pageNumber={pageNumber} />
                            </Document>
                            <Pagination current={pageNumber} total={numPages} pageSize={1} onChange={this.onChange} />
                        </>
                        : null
                    }
                </Modal>
                <Modal
                    className="module-modal"
                    title={currentMenu}
                    visible={modalVisible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    footer={null}
                >
                    {currentMenu &&
                        <ul>
                            {secondModules.map(({ menuName, url, hasSub, hasParam, idenMod, stepNum }, index) =>
                                <li key={index} title={menuName}>
                                    {url ?
                                        <>
                                            <IconFont type="earthlianjie" />
                                            <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.setApp.bind(this, menuName, undefined, idenMod, stepNum)}>{menuName}</a>
                                        </>
                                        : hasSub ?
                                            <>
                                                <IconFont type="earthcaidan2" />
                                                <span onClick={this.showSecondModal.bind(this, menuName)}>{menuName}</span>
                                            </>
                                            :
                                            menuName.indexOf("数据标准") === -1
                                                ?
                                                <>
                                                    <IconFont type="earthjinru1" />
                                                    <Link to={menuName.indexOf("数据库") === -1 ? "/calculate" : "bdcenter"} onClick={this.setApp.bind(this, menuName, module, idenMod, stepNum)}>{menuName}</Link>
                                                </>
                                                :
                                                <>
                                                    <IconFont type="earthbookresource" />
                                                    <span onClick={this.showPdfModal.bind(this, menuName)}>{menuName}</span>
                                                </>
                                    }
                                </li>
                            )}
                        </ul>}
                </Modal>
                <Modal
                    className="module-modal"
                    title={currentMenu2}
                    visible={modalVisible2}
                    onOk={this.handleOk2}
                    onCancel={this.handleCancel2}
                    footer={null}
                    style={{ top: 150, left: 50 }}
                >
                    {currentMenu2 &&
                        thirdModules.map(({ menuName, url, hasParam, idenMod, stepNum }, index) =>
                            <li key={index} title={menuName}>
                                {url ?
                                    <>
                                        <IconFont type="earthlianjie" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.setApp.bind(this, menuName, undefined, idenMod, stepNum)}>{menuName}</a>
                                    </>
                                    :
                                    <>
                                        <IconFont type="earthjinru1" />
                                        <Link to={"/calculate"} onClick={this.setApp.bind(this, menuName, undefined, idenMod, stepNum)}>{menuName}</Link>
                                    </>
                                }
                            </li>
                        )}
                </Modal>
                <Drawer
                    className="doc"
                    title={docTitle}
                    placement="right"
                    closable={false}
                    onClose={this.onClose}
                    visible={drawerVisible}
                    width={500}
                >
                    {docContent.split("\n").map((p, index) => <p key={index}>{p}</p>)}
                </Drawer>
            </div >
        );
    };
};