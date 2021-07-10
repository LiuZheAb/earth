import React, { Component } from 'react';
import "./index.css";
import { Tabs } from 'antd';

const { TabPane } = Tabs;

export default class index extends Component {
    state = {
        imgUrl: ""
    }
    imgZoomIn = item => {
        let zoomInContainer = document.getElementById("zoom-in-container");
        zoomInContainer.style.display = "flex";
        this.setState({ imgUrl: item.src });
    }
    hideMask = () => {
        let zoomInContainer = document.getElementById("zoom-in-container");
        zoomInContainer.style.display = "none";
        this.setState({ imgUrl: "" });
    }
    render() {
        return (
            <div>
                <div id="demos" className="box-shadow">
                    <Tabs defaultActiveKey="1" onChange={this.handleTabChange}>
                        <TabPane tab="面波、主动源地震、人工智能地震 " key="1">
                            <div>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo20.bmp')} alt="IPIG" draggable="false" />
                            </div>
                            <div>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo1.png')} alt="IPIG" draggable="false" />
                            </div>
                            <div>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo2.png')} alt="IPIG" draggable="false" />
                            </div>
                        </TabPane>
                        <TabPane tab="面波与大地电磁联合反演" key="2">
                            <div>
                                <p>电磁反演</p>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo3.png')} alt="IPIG" draggable="false" />
                            </div>
                            <div>
                                <p>面波与大地电磁联合反演</p>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo4.png')} alt="IPIG" draggable="false" />
                            </div>
                        </TabPane>
                        <TabPane tab="WFEM视电阻率剖面" key="3">
                            <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo5.png')} alt="IPIG" draggable="false" />
                        </TabPane>
                        <TabPane tab="MSEM正演" key="4">
                            <p>混合谱元法三个矿体模型正演模拟</p>
                            <div>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo6.png')} alt="IPIG" draggable="false" />
                            </div>
                            <div>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo7.png')} alt="IPIG" draggable="false" />
                            </div>
                            <div>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo8.png')} alt="IPIG" draggable="false" />
                            </div>
                        </TabPane>
                        <TabPane tab="电磁数据反演" key="5">
                            <div>
                                <p>420测线电磁数据WFEM反演结果</p>
                                <div style={{ width: "50%", display: "inline-block" }}>
                                    <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo9.png')} alt="IPIG" draggable="false" style={{ maxWidth: 600 }} />
                                </div>
                                <div style={{ width: "50%", display: "inline-block" }}>
                                    <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo10.png')} alt="IPIG" draggable="false" style={{ maxWidth: 600 }} />
                                </div>
                            </div>
                            <div style={{ width: "50%", display: "inline-block" }}>
                                <p>360测线电磁数据WFEM反演结果</p>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo11.png')} alt="IPIG" draggable="false" style={{ maxWidth: 600 }} />
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo12.png')} alt="IPIG" draggable="false" style={{ maxWidth: 600 }} />
                            </div>
                            <div style={{ width: "50%", display: "inline-block" }}>
                                <p>148测线电磁数据WFEM反演结果</p>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo13.png')} alt="IPIG" draggable="false" style={{ maxWidth: 600 }} />
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo14.png')} alt="IPIG" draggable="false" style={{ maxWidth: 600 }} />
                            </div>
                        </TabPane>
                        <TabPane tab="TEM正演及反演" key="6" style={{ display: "flex" }}>
                            <div style={{ width: "50%" }}>
                                <p>三维非结构网格三个矿体模型正演模拟</p>
                                <div>
                                    <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo15.png')} alt="IPIG" draggable="false" style={{ maxWidth: 500 }} />
                                </div>
                                <div>
                                    <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo16.png')} alt="IPIG" draggable="false" style={{ maxWidth: 500 }} />
                                </div>
                                <div>
                                    <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo17.png')} alt="IPIG" draggable="false" style={{ maxWidth: 500 }} />
                                </div>
                            </div>
                            <div style={{ width: "50%" }}>
                                <p>HSP矿体模型时-频域电磁法联合反演结果</p>
                                <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo18.png')} alt="IPIG" draggable="false" style={{ maxWidth: 600 }} />
                            </div>
                        </TabPane>
                        <TabPane tab="重磁正演及反演" key="7">
                            <p>坪宝实际资料处理—相关分析联合反演</p>
                            <img onClick={e => this.imgZoomIn(e.target)} src={require('../../assets/images/demo19.png')} alt="IPIG" draggable="false" style={{ maxWidth: 1200 }} />
                        </TabPane>
                    </Tabs>,
                </div>
                <div id="zoom-in-container" onClick={this.hideMask}>
                    <div className="img-border">
                        <div className="img-container" style={{ backgroundImage: `url(${this.state.imgUrl})` }}></div>
                    </div>
                </div>
            </div>

        )
    }
}
