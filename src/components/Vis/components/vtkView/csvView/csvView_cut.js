/**
* 文件名：csvView.js
* 作者：鲁杨飞
* 创建时间：2020/8/24
* 文件描述：*.csv类型数据文件渲染逻辑。
*/
import vtk from 'vtk.js/Sources/vtk';
import Draggable from 'react-draggable';
import React, { Component } from 'react';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import * as actions from '../../../redux/actions/index';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
// import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
// import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';
// import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
// import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { Slider, Input, Col, Row, Select } from "antd";
// import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
// import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import colorMode from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';
import { Rendering, Screen, reassignManipulators, changeManipulators, showBoundRuler, scalarBar, gl } from "../common/index"

const InputGroup = Input.Group;
const { Option } = Select;
export default class csvView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            activeScalar: [],
            model: {},
            boxBgColor: "#ccc",
            min: null,
            max: null,
            mode: "jet-re",
            unique: [],
            inputValue: 1,
        }
        this.container = React.createRef();
        this.container1 = React.createRef();
    };

    //修改MapperRange
    InputMapperRangeMin = e => {
        this.setState({
            min: Number(e.target.value)
        });
    };

    InputMapperRangeMax = e => {
        this.setState({
            max: Number(e.target.value)
        });
    };

    //选择色标样式
    onChange = (value) => {
        let name = value.split("--");
        let OpenGlRW = this.state.model.fullScreenRenderer.getOpenGLRenderWindow();
        gl(OpenGlRW);
        this.setState({
            mode: name[0],
        })
    };

    //改变模型透明度
    onChangeAlpha = value => {
        if (isNaN(value)) {
            return;
        }
        this.setState({
            inputValue: value,
        });
        this.state.model.renderWindow.render()
        let OpenGlRW = this.state.model.fullScreenRenderer.getOpenGLRenderWindow();
        gl(OpenGlRW);
    };

    //渲染方法
    result = () => {
        let { data } = this.props;
        let { model } = this.state;
        let [xLength, yLength, zLength] = data[3];
        let [xMin, xMax, yMin, yMax, zMin, zMax] = data[4];
        this.setState({
            xMin, xMax, yMin, yMax, zMin, zMax
        });
        let vtkBox = document.getElementsByClassName('container')[0];
        if (vtkBox) {
            vtkBox.innerHTML = null;
        };
        let yxScale = (yMax - yMin) / (xMax - xMin);
        let zxScale = (zMax - zMin) / (xMax - xMin);
        Rendering(model, this.container);
        reassignManipulators(model);
        //定义平面源
        const planeSourceXY = vtkPlaneSource.newInstance({
            xResolution: yLength - 1,
            yResolution: xLength - 1,
            origin: [0, zLength * zxScale / 2, xLength],
            point1: [yLength * yxScale, zLength * zxScale / 2, xLength],
            point2: [0, zLength * zxScale / 2, 0]
        });

        // planeSourceXY.set({"xResolution":72})
        const planeSourceXZ = vtkPlaneSource.newInstance({
            xResolution: zLength - 1,
            yResolution: xLength - 1,
            origin: [yLength * yxScale / 2, zLength * zxScale, xLength],
            point1: [yLength * yxScale / 2, zLength * zxScale, 0],
            point2: [yLength * yxScale / 2, 0, xLength]
        });

        const planeSourceYZ = vtkPlaneSource.newInstance({
            xResolution: yLength - 1,
            yResolution: zLength - 1,
            origin: [0, zLength * zxScale, xLength / 2],
            point1: [yLength * yxScale, zLength * zxScale, xLength / 2],
            point2: [0, 0, xLength / 2]
        });

        //要显示的三个横截面的数据（一维数组）
        let pointData1 = JSON.parse(JSON.stringify(data[0]));
        let pointData2 = JSON.parse(JSON.stringify(data[1]));
        let pointData3 = JSON.parse(JSON.stringify(data[2]));

        const polydata1 = planeSourceXY.getOutputData().getState();
        polydata1.pointData = {
            vtkClass: 'vtkDataSetAttributes',
            activeScalars: 0,
            arrays: [{
                data: {
                    vtkClass: 'vtkDataArray',
                    name: 'pointScalars',
                    dataType: 'Float32Array',
                    values: pointData3,
                },
            }],
        }
        const polydata2 = planeSourceXZ.getOutputData().getState();
        polydata2.pointData = {
            vtkClass: 'vtkDataSetAttributes',
            activeScalars: 0,
            arrays: [{
                data: {
                    vtkClass: 'vtkDataArray',
                    name: 'pointScalars',
                    dataType: 'Float32Array',
                    values: pointData2,
                },
            }],
        }
        const polydata3 = planeSourceYZ.getOutputData().getState();
        polydata3.pointData = {
            vtkClass: 'vtkDataSetAttributes',
            activeScalars: 0,
            arrays: [{
                data: {
                    vtkClass: 'vtkDataArray',
                    name: 'pointScalars',
                    dataType: 'Float32Array',
                    values: pointData1,
                },
            }],
        }

        //要显示的所有值排序去重，获取min和max,用于设置渲染时颜色的范围
        let newPointDatas = [];
        newPointDatas = newPointDatas.concat(pointData1, pointData2, pointData3);
        newPointDatas.sort(function (a, b) {
            return a - b
        });
        let unique = [...new Set(newPointDatas)];
        if (unique.indexOf("null") !== -1) {
            unique.splice(unique.indexOf("null"), 1);
        } else if (unique.indexOf("NaN") !== -1) {
            unique.splice(unique.indexOf("NaN"), 1);
        } else if (unique.indexOf("nan") !== -1) {
            unique.splice(unique.indexOf("nan"), 1);
        }
        unique.sort(function (a, b) {
            return a - b;
        });
        if (unique.indexOf(null) !== -1) {
            unique.splice(unique.indexOf(null), 1);
        }
        let min = Number(unique[0]);
        let max = Number(unique[unique.length - 1]);

        this.setState({
            min: min,
            max: max,
            unique: unique,
            // OpenGlRW: OpenGlRW,
        });
        const lookupTable = vtkLookupTable.newInstance({
        });
        model.lookupTable = lookupTable;
        model.unique = unique;

        const map = vtkMapper.newInstance({
            useLookupTableScalarRange: true,
        });

        map.setScalarRange(min, max);

        const lut = vtkColorTransferFunction.newInstance();
        const preset = vtkColorMaps.getPresetByName("X Ray");   //预设色标颜色样式
        lut.applyColorMap(preset);  //应用ColorMap
        lut.setMappingRange(min, max)
        lut.updateRange();
        map.setLookupTable(lut)
        const act = vtkActor.newInstance();

        // act.getProperty().setRepresentation(Representation.WIREFRAME);

        //将三个面数据拼接
        const sourceData = vtkAppendPolyData.newInstance();
        sourceData.setInputData(vtk(polydata1));
        sourceData.addInputData(vtk(polydata2));
        sourceData.addInputData(vtk(polydata3));
        map.setInputConnection(sourceData.getOutputPort());
        act.setMapper(map);
        model.actor = act;
        model.mapper = map;
        planeSourceXY.delete();
        planeSourceXZ.delete();
        planeSourceYZ.delete();
        model.data = map.getInputData();
        model.renderer.addActor(act);
        model.interactorStyle.setCenterOfRotation(model.mapper.getCenter())
        model.renderer.resetCamera();
        model.renderWindow.render();
    };

    componentDidMount() {
        this.props.dispatch(actions.setMoveStyle(actions.moveType.ROTATE));
        this.props.dispatch(actions.toggleShitidanyuanButton("command"));
        this.props.dispatch(actions.toggleWanggeButton("command"));
        this.props.dispatch(actions.togglePointButton("command"));
        this.props.dispatch(actions.toggleAxisButton("command"));
        this.props.dispatch(actions.toggleBoundButton("command"));
        this.props.dispatch(actions.toggleResultButton("command"));
        this.props.dispatch(actions.toggleLightButton("command"));
        this.props.dispatch(actions.toggleSebiaoButton("command"));
        this.props.dispatch(actions.toggleCejuButton("command"));
        this.props.dispatch(actions.toggleScaleButton("command"));
        this.props.dispatch(actions.toggleKeduButton("command"));
        this.result()
    };

    componentDidUpdate = (prevProps) => {
        let { screen } = this.props.state
        if (screen !== prevProps.state.screen) {
            if (document.getElementsByTagName("canvas").length > 0) {
                Screen(document.getElementsByTagName("canvas")[0])
            }
        }
    }

    render() {
        let {
            boxBgColor, model, activeScalar, mode, unique, inputValue, min, max, xAxis1, yAxis1, xMin, xMax, yMin, yMax, zMin, zMax
        } = this.state;
        let { show, state, data } = this.props;
        let { moveStyle, screen, ruler, attribute, ranging, theme, scalar, fontSize, modelStyle } = state;

        let scales = [];
        let fontColor, bgColor;
        if (theme === "dark") {
            fontColor = "#fff";
            bgColor = [0, 0, 0]
        } else {
            fontColor = "#000";
            bgColor = [1, 1, 1]
        }
        let modes = mode;
        const lut1 = vtkColorTransferFunction.newInstance();
        const preset = vtkColorMaps.getPresetByName(modes);
        //应用ColorMap
        lut1.applyColorMap(preset);
        lut1.setMappingRange(min, max);
        lut1.updateRange();
        let num = Math.round(unique.length / 3);
        const picker = vtkPointPicker.newInstance();
        if (ranging === true) {
            // Pick on mouse right click
            model.renderWindow.getInteractor().onRightButtonPress((callData) => {
                if (model.renderer !== callData.pokedRenderer) {
                    return;
                }
                let dims = document.querySelector(".vtk-container").getBoundingClientRect();
                picker.setPickFromList(1);
                picker.initializePickList();
                picker.addPickList(model.actor);
                const pos = callData.position;
                const point = [pos.x, pos.y, 0.0];
                picker.pick(point, model.renderer);
                // let pickedPoint = picker.getPickPosition();
                let PointID = picker.getPointId();
                let posX = Math.round(model.points[PointID * 3]), posY = Math.abs(Math.round(model.points[PointID * 3 + 1])), posZ = Math.abs(Math.round(model.points[PointID * 3 + 2]));
                model.textCtx.font = `${14 * window.devicePixelRatio}px serif`;
                model.textCtx.fillStyle = fontColor;
                model.textCtx.textAlign = 'center';
                model.textCtx.textBaseline = 'middle';
                let y = dims.height * window.devicePixelRatio - point[1];
                model.textCtx.fillText(`${data[posY][posX]}-${posZ}`, point[0], y);
            });
        }
        let useScreen = state.screen;
        if (useScreen !== screen) {
            this.setState({
                screen: useScreen
            })
            // model.renderWindow.render();
            this.timer = setTimeout(() => {
            }, 1000);
        }
        if (model.renderer) {
            model.mapper.setLookupTable(lut1);
            model.actor.getProperty().setOpacity(inputValue);
            model.renderWindow.render();
            activeScalar = [Number(model.unique[model.unique.length - 1]).toFixed(5), Number(model.unique[model.unique.length - 1 - num]).toFixed(5), Number(model.unique[num]).toFixed(5), Number(model.unique[0]).toFixed(5)];
            scales = [(model.unique.length * 100) / model.unique.length + "%", ((model.unique.length - num) * 100) / model.unique.length + "%", (num * 100) / model.unique.length + "%", 0 + "%"];
            if (document.querySelector(".scalarMax")) document.querySelector(".scalarMax").innerHTML = max;
            if (document.querySelector(".scalarMin")) document.querySelector(".scalarMin").innerHTML = min;
            if (document.querySelector(".vtk-container1")) {
                document.querySelector(".vtk-container1").style.display = "block";
            }
            //应用ColorMap
            if (this.container1.current.childElementCount < 1) {
                scalarBar(model, model.unique, modes, this.container1);
            } else {
                this.container1.current.innerHTML = null;
                scalarBar(model, model.unique, modes, this.container1);
            }
            model.fullScreenRenderer.setBackground(bgColor);
            let dimensional = 3;
            if (document.querySelector('.textCanvas')) this.container.current.children[0].removeChild(document.querySelector('.textCanvas'))
            showBoundRuler(ruler, model, this.container, vtk(model.actor.getMapper().getInputData().getState()), this.props, dimensional, fontColor, xAxis1, yAxis1, undefined, yMax, yMin, zMax, zMin, xMin, xMax); //刻度标尺
        }
        changeManipulators(model, moveStyle, modelStyle);

        return (
            <div>
                <Draggable handle=".handle"
                    defaultPosition={{ x: 0, y: 0 }}
                    position={null}
                    grid={[1, 1]}
                    scale={1}>
                    <div style={{ display: attribute, position: "absolute", zIndex: "90", top: "20px", left: "20px" }}>
                        <div style={{ width: "250px", background: boxBgColor, padding: "20px", lineHeight: "20px", display: "block" }}>
                            <span className="handle" style={{ display: "inline-block", width: "100%", textAlign: "center" }}>属性栏</span>
                            <InputGroup>
                                <Row >
                                    <Col >ColorMaps</Col >
                                </Row >
                                <Row >
                                    <Col >
                                        <Select
                                            showSearch
                                            style={{ width: 200 }}
                                            placeholder={mode}
                                            optionFilterProp="children"
                                            onChange={this.onChange}
                                            onSearch={this.onSearch}
                                            filterOption={(input, option) =>
                                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }>
                                            {
                                                colorMode.map((item, index) => {
                                                    let modeKeys = item.Name + "--" + index;
                                                    if (item.ColorSpace !== undefined) {
                                                        return (
                                                            <Option key={index} value={modeKeys} >{item.Name}</Option>
                                                        )
                                                    } else {
                                                        return null;
                                                    }
                                                })
                                            }
                                        </Select>
                                    </Col>
                                </Row>
                                <hr />
                                <Row style={{}}>
                                    <Col >Transparency</Col >
                                    <Col>
                                        <Slider
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            // tooltipVisible={true}
                                            style={{ width: 180, marginBottom: "10px" }}
                                            onChange={this.onChangeAlpha}
                                            defaultValue={typeof inputValue === 'number' ? inputValue : 0}
                                        />
                                    </Col>
                                </Row>
                                <Row>
                                    <span>Value Range</span>
                                </Row>
                                <Row>
                                    <Input.Group compact>
                                        <Input style={{ width: 85, textAlign: 'center' }} placeholder={JSON.stringify(Number(min))} onChange={this.InputMapperRangeMin} />
                                        <Input
                                            className="site-input-split"
                                            style={{
                                                width: 30,
                                                borderLeft: 0,
                                                borderRight: 0,
                                                pointerEvents: 'none',
                                            }}
                                            placeholder="-"
                                            disabled
                                        />
                                        <Input
                                            className="site-input-right"
                                            style={{
                                                width: 85,
                                                textAlign: 'center',
                                            }}
                                            onChange={this.InputMapperRangeMax}
                                            placeholder={JSON.stringify(Number(max))}
                                        />
                                    </Input.Group>
                                </Row>
                            </InputGroup>
                        </div>
                    </div>
                </Draggable>
                <div className="vtk-container" ref={this.container} style={{ "minHeight": "100px", "minWidth": "100px", "width": "100%", "height": show }} onMouseDown={(e) => this.onMouseMove}></div>
                <div style={{ width: "8%", height: "20%", position: "absolute", right: "5%", bottom: "5%", opacity: scalar }}>
                    <div ref={this.container1} className="vtk-container1" style={{ width: "15%", height: "calc(100% - 18px)", position: "relative", opacity: scalar, overflow: "hidden", margin: "10px 0 10px", float: "left", borderRight: "0.5px solid " + fontColor }}></div>
                    <div style={{ width: "8%", height: "calc(100% - 19px)", marginTop: "10px", float: "left" }}>
                        <div style={{ height: "100%", position: "relative", listStyle: "none" }}>
                            {scales.map((item, index) =>
                                <div key={index} style={{ position: "absolute", bottom: item, height: 0 }}>
                                    <span style={{ display: "inline-block", width: "10px", color: fontColor, borderTop: "0.5px solid " + fontColor, verticalAlign: "top", transform: "translateX(-50%) scale(" + fontSize + "," + fontSize + ")" }}></span>
                                    <span style={{ position: "absolute", color: fontColor, transform: "translateY(-50%) scale(" + fontSize + "," + fontSize + ")" }}>{activeScalar[index]}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div >
        )
    }
}
