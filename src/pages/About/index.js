/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 关于我们页面
 */

import React from 'react';
import { Layout, Menu, Pagination } from 'antd';
import { Link, withRouter } from "react-router-dom";
import IconFont from '../../components/IconFont';
import { pdfjs, Document, Page } from 'react-pdf';
import "./index.css";
const { Header, Sider, Content } = Layout;
pdfjs.GlobalWorkerOptions.workerSrc = `./js/pdf.worker.js`;

class About extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            aboutSiderKey: sessionStorage.getItem("aboutSiderKey") ? sessionStorage.getItem("aboutSiderKey") : "1",
            numPages: null,
            pageNumber: 1
        };
    };
    // 点击侧边栏调用
    changeSider = ({ key }) => {
        sessionStorage.setItem("aboutSiderKey", key);
        this.setState({
            aboutSiderKey: key
        });
    };
    onDocumentLoadSuccess = ({ numPages }) => {
        this.setState({ numPages });
    }
    onChange = page => {
        this.setState({
            pageNumber: page,
        });
    };
    render() {
        const { aboutSiderKey, pageNumber, numPages } = this.state;
        let content = null;
        switch (aboutSiderKey) {
            case "1":
                content =
                    <>
                        <p>向地球深部进军，实现“1500 米采矿新空间、进军2000-3000 米勘查新深度、开辟覆盖区找矿‘新大陆’、加快实现找矿突破”的国家战略，是我国的一项重要战略任务。由于缺少具有国际领先水平自主知识产权的多种、多类型数据联合反演、评价和综合解释一体化平台，极大地制约着我国深部金属矿产资源的勘查能力。本项目从不同尺度对地下资源的多个参数进行联合反演与解释，研发综合地球物理一体化平台并进行找矿示范。</p>
                        <p>研究3000 米以浅多种、多类型数据联合反演解释技术，多元信息评价与预测技术，研发重磁、电磁、地震处理、解释可视化及一体化平台。发展大数据人工智能理论方法，提高大规模数据处理、解释的高性能计算能力，开展岩浆热液型和中低温热液型典型矿集区应用示范，实现中深部金属矿产资源评价与预测。</p>
                        <img src={require('../../assets/images/IPIG_3000m.jpg')} alt="湘南3000米科学钻探工程" style={{ maxWidth: 600, width: "100%", margin: "0 auto 1em", display: "block" }} />
                        <p>针对上述研究内容，本项目建立一套多种、多类型数据协同作业的可视化综合地球物理反演解释一体化平台，具体开发内容如下：</p>
                        <p>(1) 主动源和被动源联合地震高/超分辨率成像新技术，表征深部矿体的精细结构、空间展布及物性特征。</p>
                        <p>(2) 高精度三维地质建模方法和基于结构耦合思想的重磁联合三维体素反演新算法，有效降低反演结果的不确定性。</p>
                        <p>(3) 多种电磁法测量数据的时间域与频率域联合反演新技术，准确圈定金属矿(化)体靶位。</p>
                        <p>(4) 分布式异构数据的智能化存储、快速访问、高效处理与分析，进行正、反演算法的并行化，建立专业化的高性能计算工具包和算法库。</p>
                        <p>(5) 重、磁、电、震综合地球物理联合反演新技术，搭建基于分布式网格技术的数据库系统；实现基于大数据分析的矿集区多元信息智能评价与预测；建立综合地球物理处理解释一体化平台；构建高分辨率显示集群，实现三维可视化。</p>
                        <p>(6) 开展湘南(W-Sn)、湘中(Sb-Au)典型矿集区综合示范研究，验证综合地球物理联合反演解释技术、多元信息评价与预测技术的有效性、实用性，检验软件平台的中深部探测功能，总结深部资源找矿模式和多元信息预测新方法，形成专家智库</p>
                        <img src={require('../../assets/images/IPIG_ore.jpg')} alt="湘南3000米科学钻探工程" style={{ maxWidth: 600, width: "100%", margin: "0 auto 1em", display: "block" }} />
                    </>;
                break;
            case "2":
                content =
                    <>
                        <Document
                            file="./static/pdf/document.pdf"
                            onLoadSuccess={this.onDocumentLoadSuccess}
                            loading="正在努力加载中"
                            externalLinkTarget="_blank"
                        >
                            <Page pageNumber={pageNumber} />
                        </Document>
                        <Pagination current={pageNumber} total={numPages} pageSize={1} onChange={this.onChange} />
                    </>;
                break;
            case "3":
                content =
                    <>
                        <p>请遵守本专项<span style={{ fontWeight: 600 }}>《综合地球物理联合反演与解释一体化平台建设》</span>的<span style={{ fontWeight: 600 }}>《法律声明及隐私权政策》</span>：</p>
                        <div style={{ paddingLeft: "2em" }}>
                            <p>(1) 非法获取、持有国家秘密载体的；</p>
                            <p>(2) 买卖、转送或者私自销毁国家秘密载体的；</p>
                            <p>(3) 通过普通邮政、快递等无保密措施的渠道传递国家秘密载体的；</p>
                            <p>(4) 邮寄、托运国家秘密载体出境，或者未经有关主管部门批准，携带、传递国家秘密载体出境的；</p>
                            <p>(5) 非法复制、记录、存储国家秘密的；</p>
                            <p>(6) 在私人交往和通信中涉及国家秘密的；</p>
                            <p>(7) 在互联网及其他公共信息网络或者未采取保密措施的有线和无线通信中传递国家秘密的；</p>
                            <p>(8) 将涉密计算机、涉密存储设备接入互联网及其他公共信息网络的；</p>
                            <p>(9) 在未采取防护措施的情况下，在涉密信息系统与互联网及其他公共信息网络之间进行信息交换的；</p>
                            <p>(10) 使用非涉密计算机、非涉密存储设备存储、处理国家秘密信息的；</p>
                            <p>(11) 擅自卸载、修改涉密信息系统的安全技术程序、管理程序的；</p>
                            <p>(12) 将未经安全技术处理的退出使用的涉密计算机、涉密存储设备赠送、出售、丢弃或者改作其他用途的。</p>
                            <p>有上述行为尚不构成犯罪，且不适用处分的人员，由保密行政管理部门督促其所在机关、单位予以处理。 </p>
                        </div>
                    </>;
                break;
            case "4":
                content =
                    <>
                        <p style={{ fontWeight: 600 }}>有关平台的意见及建议，请与项目负责人王彦飞联系：</p>
                        <p>姓名：王彦飞</p>
                        <p>职称：研究员</p>
                        <p>学位：博士</p>
                        <p>电话：010-82998132</p>
                        <p>邮箱：yfwang@mail.iggcas.ac.cn</p>
                        <p>传真：010-62010846</p>
                        <p>邮编：100029</p>
                        <p>地址：北京市朝阳区北土城西路19号，中科院地质与地球物理研究所</p>
                        <img src={require('../../assets/images/IPIG.jpg')} alt="项目启动" />
                    </>;
                break;
            default:
                break;
        }
        return (
            <Layout className="about">
                <Header className="about-header">
                    <div className="header-content">
                        <Link to="/home" className="about-logo" title="综合地球物理联合反演与解释一体化平台">
                            <img src={require("../../assets/images/logo.png")} alt="IPIG" flowgable="false" />
                            <span>综合地球物理联合反演与解释一体化平台</span>
                        </Link>
                        <IconFont className="about-quit" onClick={this.props.history.goBack} type="earthfanhui" title="返回上一页" />
                    </div>
                </Header>
                <Layout className="about-contentarea">
                    <Sider className="about-sider">
                        <Menu
                            className="about-menu-v"
                            theme="light"
                            mode="vertical"
                            defaultSelectedKeys={[aboutSiderKey]}
                            style={{ lineHeight: '64px', marginTop: "20px" }}
                        >
                            <Menu.Item key="1" onClick={this.changeSider}>关于我们</Menu.Item>
                            <Menu.Item key="2" onClick={this.changeSider}>软件平台说明书</Menu.Item>
                            <Menu.Item key="3" onClick={this.changeSider}>法律声明及隐私权政策</Menu.Item>
                            <Menu.Item key="4" onClick={this.changeSider}>联系我们</Menu.Item>
                        </Menu>
                    </Sider>
                    <Content className="about-content">
                        <div className="about-container box-shadow">
                            <Menu
                                className="about-menu-h"
                                theme="light"
                                mode="horizontal"
                                defaultSelectedKeys={[aboutSiderKey]}
                            >
                                <Menu.Item key="1" onClick={this.changeSider}>关于我们</Menu.Item>
                                <Menu.Item key="2" onClick={this.changeSider}>软件平台说明书</Menu.Item>
                                <Menu.Item key="3" onClick={this.changeSider}>法律声明及隐私权政策</Menu.Item>
                                <Menu.Item key="4" onClick={this.changeSider}>联系我们</Menu.Item>
                            </Menu>
                            <div className="textarea">
                                <img src={require('../../assets/images/about.png')} alt="关于我们" />
                                {content}
                            </div>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        );
    };
};

export default withRouter(About);