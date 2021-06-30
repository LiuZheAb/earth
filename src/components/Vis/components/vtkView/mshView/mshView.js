/**
* 文件名：mshView.js
* 作者：曾彤
* 创建时间：2021/4/14
* 文件描述：*.msh类型数据文件渲染逻辑。
*/
import vtk from 'vtk.js/Sources/vtk';
import Draggable from 'react-draggable';
import React, { Component } from 'react';
import * as actions from '../../../redux/actions/index';
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';
// import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
// import vtkElevationReader from 'vtk.js/Sources/IO/Misc/ElevationReader';
import { Input, Select, Col, Row, Slider } from "antd";
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
// import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
// import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import colorMode from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
// import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
// import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
// import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
// import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
// import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
// import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import {
    Rendering, Screen, reassignManipulators,
    changeManipulators,
    // showBoundRuler, 
    gl, Axis
} from "../common/index"
const InputGroup = Input.Group;
const { Option } = Select;
// let dimensional = undefined;

export default class mshView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            model: {},
            canvas: {},
            // activeScalar:[],
            boxBgColor: "#ccc",
            position: {
                x: 0,
                y: 0,
                z: 0
            },
            xLength: 0,
            yLength: 0,
            zLength: 0,
            points: [],
            cells: [],
            value: 0,
            mode: "rainbow",
            screen: null,
            // unique: [],
            displayBox: "none",
            inputValue: 1,
            pointData: [0, 1],
            modeBounds: [],
            Material: [],
            checkedList: [],
            indeterminate: true,
            checkAll: false
        }
        this.container = React.createRef();
        this.container1 = React.createRef();
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

    //渲染方法
    result = () => {
        let { data } = this.props;
        // let { state, appName } = this.props;
        let { model } = this.state;
        let vtkBox = document.getElementsByClassName('vtk-container')[0];
        if (vtkBox) {
            vtkBox.innerHTML = null;
        }
        if (data) {
            Rendering(model, this.container);
            let points = JSON.parse(JSON.stringify(data[0]));
            let pointCopy = JSON.parse(JSON.stringify(points));
            let cells = JSON.parse(JSON.stringify(data[1]));
            //判断单元颜色
            let scalarValues = [];
            let valueCopy, scalarValuesCopy, unique, min, max;
            if (data[2]) {
                valueCopy = JSON.parse(JSON.stringify(data[2]));
                for (let i = 0; i < valueCopy.length; i++) {
                    scalarValues.push(Math.log(valueCopy[i]))
                };
                // for(let i=0;i<970712;i++){
                //   scalarValues.push("")
                // }
                scalarValuesCopy = JSON.parse(JSON.stringify(scalarValues));
                //scalarValues排序去重
                scalarValues.sort(function (a, b) {
                    return a - b;
                });
                unique = [...new Set(scalarValues)];
                min = Number(unique[0]);
                max = Number(unique[unique.length - 1]);
                console.log(min, max, "min,max");
                this.setState({
                    min,
                    max
                });
            };
            const lut1 = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName("rainbow");
            lut1.applyColorMap(preset);
            lut1.updateRange();

            //创建polydata数据
            let polydata = null;
            if (data[2]) {
                polydata = vtk({
                    vtkClass: 'vtkPolyData',
                    points: {
                        vtkClass: 'vtkPoints',
                        dataType: 'Float32Array',
                        numberOfComponents: 3,
                        values: points,
                    },
                    polys: {
                        vtkClass: 'vtkCellArray',
                        values: cells,
                    },
                    cellData: {
                        vtkClass: 'vtkDataSetAttributes',
                        activeScalars: 0,
                        arrays: [{
                            data: {
                                vtkClass: 'vtkDataArray',
                                name: 'pointScalars',
                                dataType: 'Float32Array',
                                values: scalarValuesCopy,
                            },
                        }],
                    }
                });
            } else {
                polydata = vtk({
                    vtkClass: 'vtkPolyData',
                    points: {
                        vtkClass: 'vtkPoints',
                        dataType: 'Float32Array',
                        numberOfComponents: 3,
                        values: points,
                    },
                    polys: {
                        vtkClass: 'vtkCellArray',
                        values: cells,
                    }
                });
            };

            this.setState({
                points,
                pointCopy,
                cells,
                scalarValuesCopy
            });

            const outline = vtkOutlineFilter.newInstance();
            outline.setInputData(polydata);
            const mapper = vtkMapper.newInstance({
                interpolateScalarsBeforeMapping: true
            });
            this.setState({
                points: points,
                cells: cells,
                modeBounds: outline.getOutputData().getBounds()
            });
            mapper.setLookupTable(lut1);
            mapper.setInputData(polydata);
            if (data[2]) {
                mapper.setScalarRange(min, max);
            };
            const actor = vtkActor.newInstance();
            model.actor = actor;
            actor.setMapper(mapper);
            model.renderer.addActor(actor);
            // Populate with initial manipulators
            model.interactorStyle.setCenterOfRotation(mapper.getCenter())
            reassignManipulators(model);
        };
        model.renderer.resetCamera();
        model.renderWindow.render();
    };

    componentDidMount() {
        // let { appName } = this.props;
        this.props.dispatch(actions.setMoveStyle(actions.moveType.ROTATE));
        this.props.dispatch(actions.toggleShitidanyuanButton("command"));
        this.props.dispatch(actions.toggleWanggeButton("command"));
        this.props.dispatch(actions.togglePointButton("command"));
        this.props.dispatch(actions.toggleAxisButton("command"));
        this.props.dispatch(actions.toggleBoundButton("command"));
        this.props.dispatch(actions.toggleResultButton("command"));
        this.props.dispatch(actions.toggleKeduButton("command-disable"));
        this.props.dispatch(actions.toggleLightButton("command-disable"));
        this.props.dispatch(actions.toggleSebiaoButton("command-disable"));
        this.props.dispatch(actions.toggleCejuButton("command"));
        this.props.dispatch(actions.toggleScaleButton("command"));
        this.result();
        //绘制坐标
        Axis(this.state.model);
        // let url = global.baseUrl.replace('8002', "6001");
    };

    //更新组件
    componentDidUpdate = (prevProps) => {
        let { screen } = this.props.state
        if (screen !== prevProps.state.screen) {
            if (document.getElementsByTagName("canvas").length > 0) {
                Screen(document.getElementsByTagName("canvas")[0])
            }
        }
    };

    //更该模型边界x
    onChangeBoundsX = (val) => {
        let { model } = this.state;
        let { data } = this.props;
        let newP = JSON.parse(JSON.stringify(data[0]))
        for (let i = 0; i < newP.length; i = i + 3) {
            if (Number(newP[i]) >= val[0] && Number(newP[i]) <= val[1]) {

            } else {
                newP[i] = "null";
                newP[i + 1] = "null";
                newP[i + 2] = "null";
            }
        }
        this.setState({
            points: newP
        })
        model.renderer.resetCameraClippingRange();
        model.renderWindow.render();
    }
    //更改模型边界Y
    onChangeBoundsY = (val) => {
        let { model } = this.state
        let { data } = this.props;
        let newP = JSON.parse(JSON.stringify(data[0]))
        for (let i = 1; i < newP.length; i = i + 3) {
            if (Number(newP[i]) >= val[0] && Number(newP[i]) <= val[1]) {

            } else {
                newP[i - 1] = "null";
                newP[i] = "null";
                newP[i + 1] = "null";
            }
        }
        this.setState({
            points: newP
        })
        model.renderer.resetCameraClippingRange();
        model.renderWindow.render();
    }
    //更该模型边界z
    onChangeBoundsZ = (val) => {
        let { model } = this.state
        let { data } = this.props;
        let newP = JSON.parse(JSON.stringify(data[0]))
        for (let i = 2; i < newP.length; i = i + 3) {
            if (Number(newP[i]) >= val[0] && Number(newP[i]) <= val[1]) {

            } else {
                newP[i] = "null";
                newP[i - 1] = "null";
                newP[i - 2] = "null";
            }
        }
        this.setState({
            points: newP
        })
        model.renderWindow.render();
    }

    //改变模型透明度
    onChangeAlpha = value => {
        if (isNaN(value)) {
            return;
        }
        let OpenGlRW = this.state.model.fullScreenRenderer.getOpenGLRenderWindow();
        gl(OpenGlRW);
        this.setState({
            inputValue: value,
        });

    };

    render() {
        let { boxBgColor, model, mode, modeBounds, points, cells, scalarValuesCopy, min, max,
            light, axis
        } = this.state;
        let { show, state } = this.props;
        let { moveStyle, screen,
            // ruler,
            theme, attribute, ranging, modelStyle, inputValue } = state;
        // let scaleOpc = 0;
        // let scales = [];

        // if (scale === true) {
        //     scaleOpc = 1;
        // } else {
        //     scaleOpc = 0;
        // }
        let fontColor, bgColor;
        if (theme === "dark") {
            fontColor = "#fff";
            bgColor = [0, 0, 0]
        } else {
            fontColor = "#000";
            bgColor = [1, 1, 1]
        }

        // let num = Math.round(unique.length / 3);
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
                // let posX = Math.round(points[PointID * 3]), posY = Math.abs(Math.round(points[PointID * 3 + 1])), posZ = Math.abs(Math.round(points[PointID * 3 + 2]));
                model.textCtx.font = '14px serif';
                model.textCtx.fillStyle = fontColor;
                model.textCtx.textAlign = 'center';
                model.textCtx.textBaseline = 'middle';
                let y = dims.height * window.devicePixelRatio - point[1];
                model.textCtx.fillText(`${PointID}`, point[0], y);
            });
        } else {
            if (model.renderWindow) {
                // model.renderWindow.getInteractor().onRightButtonPress((callData) => {
                //     console.log("请打开测距功能以进行下一步。。。")
                // })
            }
        }
        if (model.renderer) {
            let OpenGlRW = this.state.model.fullScreenRenderer.getOpenGLRenderWindow();
            gl(OpenGlRW);
            let polydata1 = null;
            if (scalarValuesCopy) {
                polydata1 = vtk({
                    vtkClass: 'vtkPolyData',
                    points: {
                        vtkClass: 'vtkPoints',
                        dataType: 'Float32Array',
                        numberOfComponents: 3,
                        values: points,
                    },
                    polys: {
                        vtkClass: 'vtkCellArray',
                        dataType: 'Float32Array',
                        values: cells,
                    },
                    cellData: {
                        vtkClass: 'vtkDataSetAttributes',
                        activeScalars: 0,
                        arrays: [{
                            data: {
                                vtkClass: 'vtkDataArray',
                                name: 'pointScalars',
                                dataType: 'Float32Array',
                                values: scalarValuesCopy,
                            },
                        }],
                    }
                });
            } else {
                polydata1 = vtk({
                    vtkClass: 'vtkPolyData',
                    points: {
                        vtkClass: 'vtkPoints',
                        dataType: 'Float32Array',
                        numberOfComponents: 3,
                        values: points,
                    },
                    polys: {
                        vtkClass: 'vtkCellArray',
                        dataType: 'Float32Array',
                        values: cells,
                    }
                });
            };
            //绘制轮廓线
            const outline1 = vtkOutlineFilter.newInstance();
            outline1.setInputData(polydata1);
            const mapper1 = vtkMapper.newInstance({
                //设置颜色差值开关
                interpolateScalarBeforeMapping: true
            });

            const lut1 = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName("rainbow");
            lut1.applyColorMap(preset);
            lut1.updateRange();

            mapper1.setLookupTable(lut1);
            mapper1.setInputData(polydata1);

            if (scalarValuesCopy) {
                mapper1.setScalarRange(min, max);
            }

            const actor1 = vtkActor.newInstance();
            model.renderer.removeActor(model.actor);
            model.actor = actor1;
            actor1.setMapper(mapper1);
            model.renderer.addActor(actor1);

            model.renderer.resetCamera();
            model.renderWindow.render();
            //清除textCanvas
            model.fullScreenRenderer.setBackground(bgColor);
            // let dimensional = 3;
            // if (document.querySelector('.textCanvas')) this.container.current.children[0].removeChild(document.querySelector('.textCanvas'))
            // showBoundRuler(ruler, model, this.container, vtk(model.actor.getMapper().getInputData().getState()), this.props, dimensional, fontColor, show); //刻度标尺
            // model.renderer.removeActor(model.bounds);
            // const outline = vtkOutlineFilter.newInstance();
            // outline.setInputData(polydata1);
            // const mapper = vtkMapper.newInstance();
            // mapper.setInputConnection(outline.getOutputPort());
            // const actor = vtkActor.newInstance();
            // actor.setMapper(mapper);
            // actor.getProperty().set({ lineWidth: 1 });
            // showBounds(bounds, model, this.container, polydata1); //边框
            // const mapper1 = vtkMapper.newInstance({
            //     interpolateScalarsBeforeMapping: true
            // });
            // const actor1 = vtkActor.newInstance();

            // // mapper1.setLookupTable(lut1);
            // mapper1.setInputData(polydata1);

            // actor1.getProperty().setOpacity(inputValue);
            // actor1.setMapper(mapper1);
            // model.renderer.removeActor(model.actor);
            // model.actor = actor1
            // model.renderer.addActor(actor1);
        };

        //改变显示样式
        changeManipulators(model, moveStyle, modelStyle, light, axis);
        //截屏
        let useScreen = screen;
        if (useScreen !== screen) {
            this.setState({
                screen: useScreen
            })
            // model.renderWindow.render();
            this.timer = setTimeout(() => {
            }, 1000);
        }
        // if (useScreen !== null) {
        //     model.renderWindow.render();
        //     this.timer = setTimeout(() => {
        //     }, 1000);
        // }
        //改变鼠标事件
        reassignManipulators(model);
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
                                <Row>
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
                                <hr />
                                {
                                    modeBounds.length > 0 ? (<Row >
                                        <Col span={24}>ModeBounds</Col >
                                        <Col span={8} style={{ lineHeight: "36px" }}>xBounds:</Col >
                                        <Col span={16}>
                                            <Slider
                                                range={true}
                                                step={0.1}
                                                // disabled={!bounds}
                                                defaultValue={[modeBounds[0], modeBounds[1]]}
                                                min={modeBounds[0]}
                                                max={modeBounds[1]}
                                                onChange={this.onChangeBoundsX}
                                            />
                                        </Col>
                                        <Col span={8} style={{ lineHeight: "36px" }}>yBounds:</Col >
                                        <Col span={16}>
                                            <Slider
                                                range
                                                step={0.1}
                                                min={modeBounds[2]}
                                                max={modeBounds[3]}
                                                // disabled={!bounds}
                                                defaultValue={[Number(modeBounds[2]), Number(modeBounds[3])]}
                                                onChange={this.onChangeBoundsY}
                                            />
                                        </Col>
                                        <Col span={8} style={{ lineHeight: "36px" }}>zBounds:</Col >
                                        <Col span={16}>
                                            <Slider
                                                range
                                                step={0.1}
                                                min={modeBounds[4]}
                                                max={modeBounds[5]}
                                                // disabled={!bounds}
                                                defaultValue={[Number(modeBounds[4]), Number(modeBounds[5])]}
                                                onChange={this.onChangeBoundsZ}
                                            />
                                        </Col>
                                    </Row >) : (null)
                                }

                            </InputGroup>

                        </div>
                    </div>
                </Draggable>
                <div className="vtk-container" ref={this.container} style={{ "minHeight": "100px", "minWidth": "100px", "width": "100%", "height": show }} onMouseDown={(e) => this.onMouseMove}></div>
            </div>
        )
    }
}