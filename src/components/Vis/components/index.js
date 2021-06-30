/**
* 文件名：/components/Vis/components/index.js
* 作者：鲁杨飞
* 创建时间：2020/8/24
* 文件描述：主体文件，负责数据文件渲染和菜单栏之间参数传递，在侧边栏选择要显示的数据文件。
*/
import React from "react";
import MenuBar from './MenuBar/MenuContainer';
import { Col, Layout } from "antd";
import * as actions from '../redux/actions';
import { CsvViewContainer, CsvViewXyContainer, CsvViewXyzContainer, CsvViewXyzNoContainer } from './vtkView/csvView/index';
import { MshViewContainer } from './vtkView/mshView';

const { Content } = Layout;
export default class Vtk extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            fileName: "",
            data: {
                data: {},
                type: ''
            }
        }
    };
    componentDidMount() {
        let _this = this;
        _this.props.dispatch(actions.fontSize(1 / window.devicePixelRatio));
        if (window.attachEvent) {//判断是不是IE
            window.onresize = function () {
                _this.props.dispatch(actions.fontSize(1 / window.devicePixelRatio));
            }
            // window.attachEvent("onresize",_this.iegbck() );
        } else if (window.addEventListener) {//如果非IE执行以下方法
            window.addEventListener("resize", () => {
                _this.props.dispatch(actions.fontSize(1 / window.devicePixelRatio));
                if (document.querySelector(".textCanvas")) {
                    document.querySelector(".textCanvas").setAttribute("height", document.querySelector(".vtk-container").getBoundingClientRect().height * window.devicePixelRatio);
                    document.querySelector(".textCanvas").setAttribute("width", document.querySelector(".vtk-container").getBoundingClientRect().width * window.devicePixelRatio);
                }
                if (document.querySelector(".textCanvas0")) {
                    document.querySelector(".textCanvas0").setAttribute("height", document.querySelector(".vtk-container").getBoundingClientRect().height * window.devicePixelRatio);
                    document.querySelector(".textCanvas0").setAttribute("width", document.querySelector(".vtk-container").getBoundingClientRect().width * window.devicePixelRatio);
                }
                if (document.querySelector(".textCanvas1")) {
                    document.querySelector(".textCanvas1").setAttribute("height", document.querySelector(".vtk-container").getBoundingClientRect().height * window.devicePixelRatio);
                    document.querySelector(".textCanvas1").setAttribute("width", document.querySelector(".vtk-container").getBoundingClientRect().width * window.devicePixelRatio);
                }
                if (document.querySelector(".textCanvas2")) {
                    document.querySelector(".textCanvas2").setAttribute("height", document.querySelector(".vtk-container").getBoundingClientRect().height * window.devicePixelRatio);
                    document.querySelector(".textCanvas2").setAttribute("width", document.querySelector(".vtk-container").getBoundingClientRect().width * window.devicePixelRatio);
                }
                if (document.querySelector(".text1")) {
                    document.querySelector(".text1").setAttribute("height", document.querySelector(".vtk-container").getBoundingClientRect().height * window.devicePixelRatio);
                    document.querySelector(".text1").setAttribute("width", document.querySelector(".vtk-container").getBoundingClientRect().width * window.devicePixelRatio);
                }
                if (document.querySelector(".text2")) {
                    document.querySelector(".text2").setAttribute("height", document.querySelector(".vtk-container").getBoundingClientRect().height * window.devicePixelRatio);
                    document.querySelector(".text2").setAttribute("width", document.querySelector(".vtk-container").getBoundingClientRect().width * window.devicePixelRatio);
                }
                if (document.querySelector(".text3")) {
                    document.querySelector(".text3").setAttribute("height", document.querySelector(".vtk-container").getBoundingClientRect().height * window.devicePixelRatio);
                    document.querySelector(".text3").setAttribute("width", document.querySelector(".vtk-container").getBoundingClientRect().width * window.devicePixelRatio);
                }
            });
        }
        // {
        //     let xhr = new XMLHttpRequest()
        //     // xhr.open('GET', '/data/dicom/response_数据网格化.json', true);
        //     // xhr.open('GET', '/data/dicom/response_数据去趋势.json', true);
        //     // xhr.open('GET', '/data/dicom/response_坐标投影.json', true); //---------------------------------------------
        //     // xhr.open('GET', '/data/dicom/response_​六面体模型重力异常正演.json', true);
        //     // xhr.open('GET', '/data/dicom/response_重力数据求偏导.json', true);
        //     // xhr.open('GET', '/data/dicom/response_球型棱柱体模型重力异常正演.json', true);
        //     // xhr.open('GET', '/data/dicom/response_典型矿区仿真数据反演一（最小模型约束反演）.json', true);
        //     // xhr.open('GET', '/data/dicom/response_​典型矿区仿真数据反演二（深度加权约束反演）.json', true);
        //     // xhr.open('GET', '/data/dicom/response_典型矿区仿真数据反演三（光滑约束反演）.json', true);
        //     // xhr.open('GET', '/data/dicom/response_典型矿区仿真数据反演四（多约束反演）.json', true);
        //     // xhr.open('GET', '/data/dicom/response_典型矿区仿真数据反演五（全变分约束）.json', true);
        //     // xhr.open('GET', '/data/dicom/response_重力数据延拓.json', true);
        //     // xhr.open('GET', '/data/dicom/response_重力异常计算.json', true);   //-----------------------------------------------
        //     // xhr.open('GET', '/data/dicom/response_重力观测数据反演（多约束反演）.json', true);
        //     // xhr.open('GET', '/data/dicom/response_磁场方向导数求取.json', true);
        //     // xhr.open('GET', '/data/dicom/response_磁场模型正演.json', true);
        //     // xhr.open('GET', '/data/dicom/response_磁场空间延拓.json', true);
        //     // xhr.open('GET', '/data/dicom/response_磁化极.json', true);
        //     xhr.responseType = 'json';
        //     xhr.send();
        //     xhr.onreadystatechange = (e) => {
        //         if (xhr.readyState === 2) {
        //             var dom = document.createElement('div');
        //             dom.setAttribute('id', 'loading');
        //             // console.log(document.getElementsByClassName('views'))
        //             // document.getElementsByClassName('views')[0].appendChild(dom);
        //             ReactDOM.render(<Spin tip="加载中..." size="large" />, dom);
        //         }
        //         if (xhr.readyState === 4) {
        //             let data = xhr.response;
        //             _this.props.dispatch(actions.getData(data));
        //             // _this.props.dispatch(actions.getDataType('数据网格化'));
        //             // _this.props.dispatch(actions.getDataType('数据去趋势'));
        //             // _this.props.dispatch(actions.getDataType('坐标投影'));   //--------------------------------------------------
        //             // _this.props.dispatch(actions.getDataType('​六面体模型重力异常正演'));
        //             // _this.props.dispatch(actions.getDataType('重力数据求偏导'));
        //             // _this.props.dispatch(actions.getDataType('球型棱柱体模型重力异常正演'));
        //             // _this.props.dispatch(actions.getDataType("典型矿区仿真数据反演一（最小模型约束反演）"));
        //             // _this.props.dispatch(actions.getDataType("​典型矿区仿真数据反演二（深度加权约束反演）"));
        //             // _this.props.dispatch(actions.getDataType("典型矿区仿真数据反演三（光滑约束反演）"));
        //             // _this.props.dispatch(actions.getDataType("典型矿区仿真数据反演四（多约束反演）"));
        //             // _this.props.dispatch(actions.getDataType("典型矿区仿真数据反演五（全变分约束）"));
        //             // _this.props.dispatch(actions.getDataType("重力数据延拓"));
        //             // _this.props.dispatch(actions.getDataType("重力异常计算"));     //-----------------------------------------------------
        //             // _this.props.dispatch(actions.getDataType("重力观测数据反演（多约束反演）"));
        //             // _this.props.dispatch(actions.getDataType("磁场方向导数求取"));
        //             // _this.props.dispatch(actions.getDataType("磁场模型正演"));
        //             // _this.props.dispatch(actions.getDataType("磁场空间延拓"));
        //             // _this.props.dispatch(actions.getDataType("磁化极"));
        //             document.getElementsByClassName('views')[0].removeChild(document.getElementById('loading'));
        //         }
        //     };
        // }
        // {
        //     let id = { "fileName": "modelx768x384xiter10.csv" };
        //     Axios.post('http://127.0.0.1:8002/process/proUpTwo', id).then(function (response) {
        //         if (response.data.data) {
        //             let data = response.data;
        //             _this.props.dispatch(actions.getData(data));
        //             _this.props.dispatch(actions.getDataType("612"));
        //             _this.setState({
        //                 fileName: id["fileName"],
        //                 data: response.data
        //             });

        //         }
        //     })
        // }
        // {
        //     let id = { "fileName": "modelx768x384xiter10.csv" };
        //     Axios.get('http://192.168.0.182:46637/resInfo?path=/home/crrelation_analysis_joint_inversion/crrelation_2D_inversion/model_csv_2D/model1/density.csv').then(function (response) {
        //         if (response.data.data) {
        //             let data = response.data;
        //             console.log(data)
        //             _this.props.dispatch(actions.getData(data.data));
        //             _this.props.dispatch(actions.getDataType("211"));
        //             _this.setState({
        //                 fileName: id["fileName"],
        //                 data: data.data
        //             });

        //         }
        //     })
        // }
    };

    render() {
        let show = "calc(100vh - 64px)";
        let { data, datatype, appName } = this.props;
        console.log(this.props);
        return (
            <Layout>
                <Layout className="site-layout" onMouseEnter={this.SiderOut} >
                    <MenuBar style={{ paddingLeft: "100px", backgroundColor: "#E8E8E8", zIndex: "999", overflow: "hidden", border: "1px solid #ccc" }} />
                    <Content className="site-layout-background"
                        style={{ height: "calc(100vh - 64px)", display: "flex", width: "100%", backgroundColor: "#FFF" }} >
                        <Col className="visual-view views">
                            {(() => {
                                switch (datatype) {
                                    case "数据网格化":
                                    case "数据去趋势":
                                    case "坐标投影":
                                    case "六面体模型重力异常正演":
                                    case "六面体复杂模型构建及重力异常正演":
                                    case "重力数据求偏导":
                                    case "球型棱柱体模型重力异常正演":
                                    case "球型棱柱体模型构建及重力异常正演":
                                    case "典型矿区仿真数据反演一（最小模型约束反演）":
                                    case "典型矿区仿真数据反演二（深度加权约束反演）":
                                    case "典型矿区仿真数据反演三（光滑约束反演）":
                                    case "典型矿区仿真数据反演四（多约束反演）":
                                    case "典型矿区仿真数据反演五（全变分约束）":
                                    case "重力数据延拓":
                                    case "重力异常计算":
                                    case "重力观测数据反演（多约束反演）":
                                    case "重力观测数据反演（三维正则，参考模型约束）":
                                    case "重力观测数据反演（参考模型-全变分约束）":
                                    case "MCMC反演":
                                    case "MCMC反演（参考模型约束）":
                                    case "三维断层模型正演":
                                    case "四面体模型单元正演":
                                    case "磁场方向导数求取":
                                    case "磁场模型正演":
                                    case "磁场空间延拓":
                                    case "磁化极":
                                    case "欧拉反演(扩展窗)":
                                    case "欧拉反演(移动窗)":
                                    case "边缘识别":
                                    case "曲化平":
                                    case "数据扩边":
                                    case "最小曲率补空白":
                                    case "重磁2D数据模糊聚类联合反演":
                                    case "重磁3D数据模糊聚类联合反演":
                                    case "重磁2D数据模糊c回归聚类联合反演":
                                    case "重磁3D数据模糊c回归聚类联合反演":
                                    case "重磁2D数据相关分析联合反演":
                                    case "重磁3D数据相关分析联合反演":
                                    case "重磁2D数据基于数据空间的相关分析联合反演":
                                    case "重磁3D数据基于数据空间的相关分析联合反演":
                                    case "重磁2D数据交叉梯度联合反演":
                                    case "重磁3D数据交叉梯度联合反演":
                                    case "2d":
                                        return <CsvViewXyContainer data={data} datatype={datatype} show={show} appName={appName} />;
                                    case "3d":
                                        return <CsvViewXyzContainer data={data} datatype={datatype} show={show} />;
                                    case "matrix":
                                        if (data.length / data[0].length > 10 || data[0].length / data.length > 10) {
                                            return <CsvViewXyzNoContainer data={data} datatype={datatype} appName={appName} show={show} />
                                        } else {
                                            return <CsvViewContainer data={data} datatype={datatype} appName={appName} show={show} />
                                        }
                                    case "msh":
                                        return <MshViewContainer data={data} datatype={datatype} appName={appName} show={show} />
                                    default:
                                        return null;
                                }
                            })()}
                        </Col>
                    </Content>
                </Layout>
            </Layout>)
    };
};