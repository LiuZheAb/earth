import React, { Component } from 'react';
import axios from 'axios';
import { Col, Modal, message, Select, Button, Pagination } from 'antd';
import { Document, Page, pdfjs } from 'react-pdf';
import { Link, withRouter } from "react-router-dom";
import IconFont from '../IconFont';
import { getCookie } from "../../utils/cookies";
import "./index.css";

const { Option } = Select;
pdfjs.GlobalWorkerOptions.workerSrc = `./js/pdf.worker.js`;

class index extends Component {
    constructor(props) {
        super(props)

        this.state = {
            data: [],
            api: "",
            modalVisible: false,
            currentMenu: null,
            secondModules: [],
            thirdModules: [],
            modalVisible2: false,
            currentMenu2: null,
            geoModalVisible: false,
            geoModalData1: {},
            geoModalData2: [],
            geoModalData3: [],
            geoModalData4: [],
            select1: undefined,
            select2: undefined,
            select3: undefined,
            select4: undefined,
            currentItem: undefined,
            pdfModalVisible: false,
            numPages: null,
            pageNumber: 1
        }
    }
    componentDidMount() {
        let { data, api } = this.props;
        if (data && api) {
            let geoModalData1 = {
                "高分辨率地震成像": data["高分辨率地震成像"],
                "位场正反演": data["位场正反演"],
                "电磁场正反演": data["电磁场正反演"],
                "人工智能综合地球物理": data["人工智能综合地球物理"],
            };
            this.setState({
                data: data["典型示范 (Demonstration)"],
                api,
                geoModalData1
            });
        }
    }
    // 显示pdf菜单
    showPdfModal = menuName => {
        this.setState({
            pdfModalVisible: true,
            currentMenu: menuName,
            pageNumber: 1
        })
    }
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
            currentMenu: null
        });
    };
    onDocumentLoadSuccess = ({ numPages }) => {
        this.setState({ numPages });
    }
    onPageChange = page => {
        this.setState({ pageNumber: page });
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
    //点击应用时将所点的应用名称保存到sessionStorage中
    setApp(appName, moduleName, idenMod, stepNum) {
        sessionStorage.setItem("appName", appName);
        sessionStorage.setItem("moduleName", this.state.currentMenu2 || this.state.currentMenu || moduleName);
        sessionStorage.setItem("idenMod", idenMod);
        sessionStorage.setItem("stepNum", stepNum);
        sessionStorage.setItem("nowStep", 1);
        this.submitClickedApp(appName);
    };
    // 点击二级菜单确认按钮
    handleOk = () => {
        this.setState({
            modalVisible: false
        });
    };
    // 点击二级菜单取消按钮
    handleCancel = () => {
        this.setState({
            modalVisible: false,
            currentMenu: null,
        });
    };
    // 点击三级菜单确认按钮
    handleOk2 = () => {
        this.setState({
            modalVisible2: false
        });
    };
    // 点击三级菜单取消按钮
    handleCancel2 = () => {
        this.setState({
            modalVisible2: false,
            currentMenu2: null
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
    static getDerivedStateFromProps(nextProps, prevState) {
        let { data, api } = nextProps;
        if (data && data !== prevState.data) {
            let geoModalData1 = {
                "高分辨率地震成像": data["高分辨率地震成像"],
                "位场正反演": data["位场正反演"],
                "电磁场正反演": data["电磁场正反演"],
                "人工智能综合地球物理": data["人工智能综合地球物理"],
            };
            return {
                data: data["典型示范 (Demonstration)"],
                api,
                geoModalData1,
            };
        }
        return null;
    }
    showGeoModal = menuName => {
        this.setState({
            geoModalVisible: true,
            currentMenu: menuName,
        })
    }
    hideGeoModal = () => {
        this.setState({
            geoModalVisible: false,
            currentMenu: null,
            select1: undefined,
            select2: undefined,
            select3: undefined,
            select4: undefined,
            currentItem: undefined
        });
    }
    handleChange1 = value => {
        let { geoModalData1 } = this.state;
        this.setState({
            select1: value,
            select2: undefined,
            select3: undefined,
            select4: undefined,
            geoModalData2: geoModalData1[value],
            currentItem: undefined
        });
    }
    handleChange2 = value => {
        let { geoModalData2 } = this.state;
        this.setState({
            select2: value,
            select3: undefined,
            select4: undefined,
            currentItem: undefined
        })
        if (geoModalData2[value].hasSub) {
            axios.get(this.state.api + 'subHome', {
                params: {
                    subModule: geoModalData2[value].menuName
                }
            }).then(response => {
                this.setState({
                    geoModalData3: response.data
                })
            }).catch(error => {
                message.error("服务器无响应", 2)
            });
        } else {
            this.setState({
                geoModalData3: [],
                currentItem: geoModalData2[value]
            })
        }
    }
    handleChange3 = value => {
        let { geoModalData3 } = this.state;
        this.setState({
            select3: value,
            select4: undefined,
            currentItem: undefined
        })
        if (geoModalData3[value].hasSub) {
            axios.get(this.state.api + 'twoSubHome', {
                params: {
                    twoSubModule: geoModalData3[value].menuName
                }
            }).then(response => {
                this.setState({
                    geoModalData4: response.data
                })
            }).catch(error => {
                message.error("服务器无响应", 2)
            });
        } else {
            this.setState({
                geoModalData4: [],
                currentItem: geoModalData3[value]
            })
        }
    }
    handleChange4 = value => {
        let { geoModalData4 } = this.state;
        this.setState({
            select4: value,
            currentItem: geoModalData4[value]
        })
    }
    linkToCalculate = () => {
        let { menuName, idenMod, stepNum } = this.state.currentItem;
        this.setApp(menuName, undefined, idenMod, stepNum);
        this.props.history.push("/calculate");
    }
    render() {
        const { data, modalVisible, currentMenu, secondModules, thirdModules, modalVisible2, currentMenu2,
            geoModalVisible, geoModalData1, geoModalData2, geoModalData3, geoModalData4, select1, select2, select3, select4,
            pdfModalVisible, pageNumber, numPages, currentItem
        } = this.state;
        return (
            <Col lg={12} xs={24} style={{ display: "flex", alignItems: "stretch", marginTop: 10 }}>
                <div className="box-shadow example-area" style={{ height: "100%", width: "100%" }}>
                    <div className="app-icon">
                        <IconFont type="earthcase" />
                    </div>
                    <div className="app-des">
                        <span className="module-name" style={{ cursor: "default" }}>
                            典型示范 (Demonstration)
                        </span>
                        <div className="app-list">
                            <ul>
                                {Array.isArray(data) && data.map(({ menuName, url, hasSub, hasParam, idenMod, stepNum }, index) =>
                                    <li key={index} title={menuName}>
                                        {url ?
                                            <>
                                                <IconFont type="earthlianjie" />
                                                <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.setApp.bind(this, menuName, undefined, idenMod, stepNum)}>{menuName}</a>
                                            </>
                                            :
                                            hasSub ?
                                                <>
                                                    <IconFont type="earthcaidan2" />
                                                    <span onClick={menuName === "地质模型 (Geological models)" ? this.showGeoModal.bind(this, menuName) : this.showModal.bind(this, menuName, undefined)}>{menuName}</span>
                                                </>
                                                :
                                                menuName.indexOf("应用示范图例") === -1
                                                    ?
                                                    <>
                                                        <IconFont type="earthjinru1" />
                                                        <Link to="/calculate" onClick={this.setApp.bind(this, menuName, undefined, idenMod, stepNum)}>{menuName}</Link>
                                                    </>
                                                    :
                                                    <>
                                                        <IconFont type="earthtupian" />
                                                        <Link to="/demos" onClick={this.setApp.bind(this, menuName, undefined, idenMod, stepNum)}>{menuName}</Link>
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
                                            hasParam ?
                                                <>
                                                    <IconFont type="earthjinru1" />
                                                    <Link to="/calculate" onClick={this.setApp.bind(this, menuName, undefined, idenMod, stepNum)}>{menuName}</Link>
                                                </>
                                                :
                                                <>
                                                    <IconFont type="earthyunhang" />
                                                    <span onClick={() => { this.runApp(menuName, currentMenu); this.setApp(menuName, undefined, idenMod, stepNum) }}>{menuName}</span>
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
                        thirdModules.map(({ menuName, url, hasParam, idenMod, stepNum }, index) =>
                            <li key={index} title={menuName}>
                                {url ?
                                    <>
                                        <IconFont type="earthlianjie" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" onClick={this.setApp.bind(this, menuName, undefined, idenMod, stepNum)}>{menuName}</a>
                                    </>
                                    :
                                    hasParam ?
                                        <>
                                            <IconFont type="earthjinru1" />
                                            <Link to="/calculate" onClick={this.setApp.bind(this, menuName, undefined, idenMod, stepNum)}>{menuName}</Link>
                                        </>
                                        :
                                        <>
                                            <IconFont type="earthyunhang" />
                                            <span onClick={() => { this.runApp(menuName, currentMenu2); this.setApp(menuName, undefined, idenMod, stepNum) }}>{menuName}</span>
                                        </>
                                }
                            </li>
                        )
                        : null}
                </Modal>
                <Modal
                    className="pdf-modal"
                    title={currentMenu}
                    visible={pdfModalVisible}
                    onOk={this.handlePdfOk}
                    onCancel={this.handlePdfCancel}
                    footer={null}
                >
                    {currentMenu ?
                        <>
                            <Document
                                file={currentMenu.indexOf("地质参数库") === -1 ? "./static/pdf/Geophysics.pdf" : "./static/pdf/Geology.pdf"}
                                onLoadSuccess={this.onDocumentLoadSuccess}
                                loading="正在努力加载中"
                                externalLinkTarget="_blank"
                            >
                                <Page pageNumber={pageNumber} />
                            </Document>
                            <Pagination current={pageNumber} total={numPages} pageSize={1} onChange={this.onPageChange} />
                        </>
                        : null
                    }
                </Modal>
                <Modal
                    title={currentMenu}
                    className="module-modal"
                    visible={geoModalVisible}
                    footer={<Button type="primary" onClick={this.linkToCalculate} disabled={currentItem ? false : true} title={currentItem ? "" : "请选择子模块"}>前往计算</Button>}
                    onCancel={this.hideGeoModal}
                >
                    <div className="module-modal-item">
                        <span className="module-modal-item-label">模块：</span>
                        <Select onChange={this.handleChange1} placeholder="请选择模块" value={select1}>
                            {Object.keys(geoModalData1).map(item =>
                                <Option value={item} key={item}>{item}</Option>
                            )}
                        </Select>
                    </div>
                    {select1 && <div className="module-modal-item">
                        <span className="module-modal-item-label">子模块1：</span>
                        <Select onChange={this.handleChange2} placeholder="请选择子模块1" value={select2}>
                            {geoModalData2.map((item, index) =>
                                <Option value={index} key={item.idenMod}>{item.menuName}</Option>
                            )}
                        </Select>
                    </div>}
                    {select2 !== undefined && geoModalData3.length > 0 && <div className="module-modal-item">
                        <span className="module-modal-item-label">子模块2：</span>
                        <Select onChange={this.handleChange3} placeholder="请选择子模块2" value={select3}>
                            {geoModalData3.map((item, index) =>
                                <Option value={index} key={item.idenMod}>{item.menuName}</Option>
                            )}
                        </Select>
                    </div>}
                    {select3 !== undefined && geoModalData4.length > 0 && <div className="module-modal-item">
                        <span className="module-modal-item-label">子模块3：</span>
                        <Select onChange={this.handleChange4} placeholder="请选择子模块3" value={select4}>
                            {geoModalData4.map((item, index) =>
                                <Option value={index} key={item.idenMod}>{item.menuName}</Option>
                            )}
                        </Select>
                    </div>}
                </Modal>
            </Col>
        )
    }
}

export default withRouter(index);