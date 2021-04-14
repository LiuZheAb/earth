import React, { Component } from 'react';
import { Row, Col, Card, Tree, Tabs, Icon } from "antd";
import { Link, withRouter } from "react-router-dom";
import IconFont from '../../components/IconFont';
import "./index.css";

const { TabPane } = Tabs;
const { TreeNode, DirectoryTree } = Tree;

class index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            appName: sessionStorage.getItem("appName") ? sessionStorage.getItem("appName") : undefined,
            stepNum: sessionStorage.getItem("stepNum") ? Number(sessionStorage.getItem("stepNum")) : 1,
            nowStep: sessionStorage.getItem("nowStep") ? Number(sessionStorage.getItem("nowStep")) : 1,
            treeData: [
                {
                    title: 'ML2D.mph',
                    key: '0-0',
                    children: [
                        {
                            title: '全局定义',
                            key: '0-0-0',
                            children: [
                                { title: '材料', key: '0-0-0-0' },
                            ],
                        },
                        {
                            title: '组件1',
                            key: '0-0-1',
                            children: [
                                {
                                    title: '定义', key: '0-0-1-0', children: [
                                        { title: '几何 1', key: '0-0-1-0-0' },
                                    ]
                                },
                                {
                                    title: '材料', key: '0-0-1-1', children: [
                                        { title: 'Air', key: '0-0-1-1-0' },
                                        { title: 'Geo', key: '0-0-1-1-1' },
                                        { title: 'Tri', key: '0-0-1-1-2' },
                                        { title: 'Rect', key: '0-0-1-1-3' },
                                        { title: 'Cir', key: '0-0-1-1-4' }
                                    ]
                                },
                                { title: '电磁波,频域', key: '0-0-1-2' },
                                { title: '网格 1', key: '0-0-1-3' },
                            ],
                        },
                        {
                            title: '研究 1',
                            key: '0-0-2',
                            children: [
                                { title: '0-0-2-0', key: '0-0-2-0' },
                                { title: '0-0-2-1', key: '0-0-2-1' },
                                { title: '0-0-2-2', key: '0-0-2-2' },
                            ],
                        },
                        {
                            title: '结果',
                            key: '0-0-3',
                            children: [
                                { title: '数据集', key: '0-0-3-0' },
                                { title: '派生值', key: '0-0-3-1' },
                                { title: '表格', key: '0-0-3-2' },
                                { title: '电场(emw)', key: '0-0-3-3' },
                                {
                                    title: '导出', key: '0-0-3-4', children: [
                                        { title: '数据 1', key: '0-0-3-4-1' }
                                    ]
                                },
                            ],
                        },
                    ],
                }
            ]
        }
    }
    componentDidMount() {
        this.contextMenu = document.getElementById("context-menu");
        let container = document.getElementById("container");
        container.addEventListener("click", () => {
            this.contextMenu.style.display = "none";
        })
        container.addEventListener("contextmenu", () => {
            this.contextMenu.style.display = "none";
        })
    }
    renderTreeNodes = data => {
        return data.map(item => {
            if (item.children) {
                return (
                    <TreeNode title={item.title} key={item.key} dataRef={item} icon={<Icon type="file" />}>
                        {this.renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return <TreeNode key={item.key} {...item} />;
        });
    }
    handleRightClick = p => {
        let { clientX, clientY } = p.event;
        let level = p.node.props.eventKey.split("-").length - 1;
        if (p.node.props.title === "材料" && level > 2 && p.node.props.children) {
            this.contextMenu.style.display = "block";
            this.contextMenu.style.left = clientX + "px";
            this.contextMenu.style.top = clientY + "px";
        }
    }
    handleContextClick = index => {
        console.log("clicked " + index);
        this.contextMenu.style.display = " none";
    }
    render() {
        let { treeData, appName, stepNum, nowStep } = this.state;
        return (
            <div className="comsol">
                <div className="comsol-header">
                    <Link to="/home">
                        <div className="comsol-logo" title="综合地球物理联合反演与解释一体化平台">
                            <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" />
                        </div>
                    </Link>
                    <span className="comsol-title">{stepNum > 1 ? `${appName}_${nowStep}` : appName}</span>
                    <IconFont className="comsol-quit" onClick={() => this.props.history.goBack()} type="earthfanhui" />
                </div>
                <Row id="container">
                    <Col span={5} className="tree-panel">
                        <Card title="模型开发器">
                            <DirectoryTree
                                defaultExpandedKeys={['0-0-0', '0-0-1', '0-0-2']}
                                showIcon
                                onRightClick={this.handleRightClick}
                            >
                                {this.renderTreeNodes(treeData)}
                            </DirectoryTree>
                        </Card>
                    </Col>
                    <Col span={7} className="prop-panel">
                        <Tabs type="card">
                            <TabPane tab="设置" key="1">
                                <span>Content of Tab Pane 1</span>
                            </TabPane>
                            <TabPane tab="属性" key="2">
                                <span>Content of Tab Pane 2</span>
                            </TabPane>
                        </Tabs>
                    </Col>
                    <Col span={12} className="vis-panel">
                        <Card title="图形">

                        </Card>
                    </Col>
                </Row>
                <ul id="context-menu">
                    <li className="context-menu-item" onClick={this.handleContextClick.bind(this, 0)}>添加材料</li>
                    <li className="context-menu-item" onClick={this.handleContextClick.bind(this, 1)}>空材料</li>
                    <li className="context-menu-item" onClick={this.handleContextClick.bind(this, 2)}>3</li>
                    <li className="context-menu-item" onClick={this.handleContextClick.bind(this, 3)}>4</li>
                </ul>
            </div>
        )
    }
}

export default withRouter(index);