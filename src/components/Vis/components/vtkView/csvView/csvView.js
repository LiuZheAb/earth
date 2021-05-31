/**
* 文件名：csvView.js
* 作者：鲁杨飞
* 创建时间：2020/8/24
* 文件描述：*.csv类型3d数据文件渲染逻辑。
*/
import vtk from 'vtk.js/Sources/vtk';
import Draggable from 'react-draggable';
import React, { Component } from 'react';
import * as actions from '../../../redux/actions/index';
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';
import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
// import vtkElevationReader from 'vtk.js/Sources/IO/Misc/ElevationReader';
import { Input, Select, Col, Row } from "antd";
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
// import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import colorMode from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
// import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
// import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
// import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import { Rendering, Screen, reassignManipulators, changeManipulators, showBoundRuler, scalarBar, gl } from "../common/index"
const InputGroup = Input.Group;
const { Option } = Select;
let dimensional = undefined;
let xAxis = [], yAxis = [];

export default class csvView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            model: {},
            canvas: {},
            boxBgColor: "#ccc",
            position: {
                x: 0,
                y: 0,
                z: 0
            },
            xLength: 0,
            yLength: 0,
            zLength: 0,
            cells: [],
            value: 0,
            mode: "rainbow",
            screen: null,
            min: null,
            max: null,
            unique: [],
            activeScalar: [],
            dx: 200,
            dy: 500,
            dz: 100
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
        let { data, state, appName } = this.props;
        let data_c = JSON.parse(JSON.stringify(data));
        console.log(this.props);

        // let name = fileName;
        // let file = fileName.split('.')[0];
        let { model } = this.state;
        let vtkBox = document.getElementsByClassName('vtk-container')[0];
        if (vtkBox) {
            vtkBox.innerHTML = null;
        }
        if (appName === "最小二乘逆时偏移 (LSRTM)") {
            for (let i = 0; i < data_c.length; i++) {
                xAxis.push(...data_c[i].splice(0, 1))
                yAxis.push(...data_c[i].splice(0, 1))
            }
        }
        if (["Super Resolution ITSMF", "超分辨率反演", "保幅超分辨率反演(Super Resolution ITSMF)"].includes(appName)) {
            dimensional = 2;
            for (let i = 0; i < data_c.length; i++) {
                xAxis.push(...data_c[i].splice(0, 1))
                yAxis.push(...data_c[i].splice(0, 1))
            }
            let yLength = data_c.length;
            let xLength = data_c[0].length;
            // let zLength = xLength;

            let arr = data;
            let array = [];
            for (let i = 0; i < arr.length - 1; i++) {
                array.push(arr[i])
            }
            array.push(arr[arr.length - 1]);
            yLength = array.length;
            xLength = array[0].length;
            Rendering(model, this.container, state.theme);

            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName("rainbow");   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            // 定义查找表
            model.lookupTable = lookupTable;

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            // 定义平面源
            const planeSource = vtkPlaneSource.newInstance({
                XResolution: xLength - 1,
                YResolution: yLength - 1,
            });

            const simpleFilter = vtkCalculator.newInstance();
            model.simpleFilter = simpleFilter;

            // 生成的“z”数组将成为默认标量，因此平面映射器将按“z”着色：
            simpleFilter.setInputConnection(planeSource.getOutputPort());
            mapper.setInputConnection(simpleFilter.getOutputPort());

            // 更新VTK场景
            model.renderer.resetCamera();
            model.renderer.resetCameraClippingRange();

            model.simpleFilter.setFormula({
                getArrays: (inputDataSets) => ({
                    input: [
                        { location: FieldDataTypes.COORDINATE }], // 需要点坐标作为输入
                    output: [
                        {
                            location: FieldDataTypes.POINT,   // 这个数组将是点数据。。。
                            name: 'z',                // ... 有了名字。。。
                            dataType: 'Float64Array',         // ... 这种类型的。。。
                            attribute: AttributeTypes.SCALARS // ... 将被标记为默认标量。
                        },
                    ]
                }),
                evaluate: (arraysIn, arraysOut) => {
                    const [z] = arraysOut.map(d => d.getData());
                    for (let i = 0; i < yLength; i++) {
                        for (let j = 0; j < xLength; j++) {
                            let index = i * xLength + j;
                            z[index] = array[i][j];
                        }
                    }
                    arraysOut.forEach(x => x.modified());
                }
            });
            planeSource.set({ "xResolution": xLength - 1 });
            planeSource.set({ "yResolution": yLength - 1 });
            planeSource.set({ "Origin": [0, 0, 0] });
            planeSource.set({ "Point1": [xLength, 0, 0] });
            planeSource.set({ "Point2": [0, -yLength, 0] });
            // let cen = planeSource.getCenter();
            // 定义actor
            const actor = vtkActor.newInstance();
            // 将定义的映射器设置为定义的参与者
            // pl2.
            actor.setMapper(mapper);
            let data1 = actor.getMapper().getInputData().getState();
            let datas = vtk(data1);
            // 改变模型中心（自动旋转）
            // vtkMatrixBuilder
            //     .buildFromDegree()
            //     .translate(-xLength / 2, 0, -zLength / 2)
            //     .apply(datas.getPoints().getData());
            model.data = datas;
            model.points = data1.points.values;
            // Populate with initial manipulators
            let pointDatas = JSON.parse(JSON.stringify(data1.pointData.arrays[2].data.values))
            pointDatas.sort(function (a, b) {
                return a - b;
            });
            let unique = [...new Set(pointDatas)];
            if (unique[0] === "null") unique.splice(0, 1);
            unique.sort(function (a, b) {
                return a - b;
            });
            let min = Number(unique[0]);
            let max = Number(unique[unique.length - 1]);
            this.setState({
                min: min,
                max: max,
                unique: unique,
                // OpenGlRW: OpenGlRW,
            })
            lookupTable.setMappingRange(min, max);
            // lookupTable.setHueRange(-1, 1);
            // lookupTable.setSaturationRange(0, 0);
            // lookupTable.setValueRange(-1, 0.5);
            let map = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            ///////////////////////////////////////////////////////////////////////////////////////////////////
            // const lut1 = vtkColorTransferFunction.newInstance();
            // //预设色标颜色样式
            // const preset = vtkColorMaps.getPresetByName("X Ray");
            // //应用ColorMap
            // lut1.applyColorMap(preset);
            // lut1.updateRange();
            //////////////////////////////////////////////////////////////////////////////////////////////////////
            let act = vtkActor.newInstance();
            map.setInputData(model.data);
            // map.setLookupTable(lut1);
            act.setMapper(map);
            model.actor = act;
            model.mapper = map;
            model.renderer.addActor(act);
            model.interactorStyle.setCenterOfRotation(map.getCenter());
            reassignManipulators(model);
        } else {
            dimensional = 3;
            let yLength = data.length;
            let xLength = data[0].length;
            // let zLength = xLength;
            let arr = data;
            let array = [];
            for (let i = 0; i < arr.length - 1; i++) {
                array.push(arr[i])
            }
            array.push(arr[arr.length - 1]);
            yLength = array.length;
            xLength = array[0].length;
            Rendering(model, this.container, state.theme);

            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName("rainbow");   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            // 定义查找表
            model.lookupTable = lookupTable;

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            // 定义平面源
            const planeSource = vtkPlaneSource.newInstance({
                XResolution: xLength - 1,
                YResolution: yLength - 1,
            });

            const simpleFilter = vtkCalculator.newInstance();
            model.simpleFilter = simpleFilter;

            // 生成的“z”数组将成为默认标量，因此平面映射器将按“z”着色：
            simpleFilter.setInputConnection(planeSource.getOutputPort());
            mapper.setInputConnection(simpleFilter.getOutputPort());

            // 更新VTK场景
            model.renderer.resetCamera();
            model.renderer.resetCameraClippingRange();

            model.simpleFilter.setFormula({
                getArrays: (inputDataSets) => ({
                    input: [
                        { location: FieldDataTypes.COORDINATE }], // 需要点坐标作为输入
                    output: [
                        {
                            location: FieldDataTypes.POINT,   // 这个数组将是点数据。。。
                            name: 'z',                // ... 有了名字。。。
                            dataType: 'Float64Array',         // ... 这种类型的。。。
                            attribute: AttributeTypes.SCALARS // ... 将被标记为默认标量。
                        },
                    ]
                }),
                evaluate: (arraysIn, arraysOut) => {
                    const [z] = arraysOut.map(d => d.getData());
                    for (let i = 0; i < yLength; i++) {
                        for (let j = 0; j < xLength; j++) {
                            let index = i * xLength + j;
                            z[index] = array[i][j];
                        }
                    }
                    arraysOut.forEach(x => x.modified());
                }
            });
            planeSource.set({ "xResolution": xLength - 1 });
            planeSource.set({ "yResolution": yLength - 1 });
            planeSource.set({ "Origin": [0, 0, 0] });
            planeSource.set({ "Point1": [xLength, 0, 0] });
            planeSource.set({ "Point2": [0, -yLength, 0] });
            // let cen = planeSource.getCenter();
            // 定义actor
            const actor = vtkActor.newInstance();
            // 将定义的映射器设置为定义的参与者
            // pl2.
            actor.setMapper(mapper);
            let polydata = actor.getMapper().getInputData().getState();
            let polydata2 = JSON.parse(JSON.stringify(polydata))

            const mapper2 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            let point2 = [];
            let topPoint = [], leftPoint = [], rightPoint = [], bottomPoint = [];
            let source = polydata.points.values;
            for (let i = 0; i < xLength * 3; i += 3) {
                topPoint.push(source[i], source[i + 1], source[i + 2]);
            }
            for (let i = 0; i < xLength * 3; i += 3) {
                topPoint.push(source[i], source[i + 1], yLength);
            }
            for (let i = 0; i < xLength * yLength * 3; i += 3 * xLength) {
                leftPoint.push(source[i], source[i + 1], source[i + 2]);
            }
            for (let i = 0; i < xLength * yLength * 3; i += 3 * xLength) {
                leftPoint.push(source[i], source[i + 1], yLength);
            }
            for (let i = (xLength - 1) * 3; i < xLength * yLength * 3; i += 3 * xLength) {
                rightPoint.push(source[i], source[i + 1], source[i + 2]);
            }
            for (let i = (xLength - 1) * 3; i < xLength * yLength * 3; i += 3 * xLength) {
                rightPoint.push(source[i], source[i + 1], yLength);
            }
            for (let i = (yLength - 1) * xLength * 3; i < xLength * yLength * 3; i += 3) {
                bottomPoint.push(source[i], source[i + 1], source[i + 2]);
            }
            for (let i = (yLength - 1) * xLength * 3; i < xLength * yLength * 3; i += 3) {
                bottomPoint.push(source[i], source[i + 1], yLength);
            }
            for (let i = 0; i < source.length; i += 3) {
                point2.push(source[i], source[i + 1], yLength);
            }
            polydata2.points.values = point2;
            let topCell = [], leftCell = [], rightCell = [], bottomCell = [];
            for (let i = 0; i < xLength - 1; i++) {
                topCell.push("3", i, i + 1, i + xLength + 1)
                topCell.push("3", i, i + xLength + 1, i + xLength)
                bottomCell.push("3", i, i + 1, i + xLength + 1)
                bottomCell.push("3", i, i + xLength + 1, i + xLength)

            }
            for (let i = 0; i < yLength - 1; i++) {
                leftCell.push("3", i, i + 1, i + yLength + 1)
                leftCell.push("3", i, i + yLength + 1, i + yLength)
                rightCell.push("3", i, i + 1, i + yLength + 1)
                rightCell.push("3", i, i + yLength + 1, i + yLength)
            }
            let topData = [], leftData = [], rightData = [], bottomData = [];
            topData = topData.concat(array[0], array[0]);
            for (let i = 0; i < yLength; i++) {
                leftData.push(array[i][0])
                rightData.push(array[i][xLength - 1])
            }
            for (let i = 0; i < yLength; i++) {
                leftData.push(array[i][0])
                rightData.push(array[i][xLength - 1])
            }
            bottomData = bottomData.concat(array[yLength - 1], array[yLength - 1]);
            let topPlane = vtk({
                vtkClass: 'vtkPolyData',
                points: {
                    vtkClass: 'vtkPoints',
                    dataType: 'Float32Array',
                    numberOfComponents: 3,
                    values: topPoint,
                },
                polys: {
                    vtkClass: 'vtkCellArray',
                    dataType: 'Float32Array',
                    values: topCell,
                },
                pointData: {
                    vtkClass: 'vtkDataSetAttributes',
                    activeScalars: 0,
                    arrays: [{
                        data: {
                            vtkClass: 'vtkDataArray',
                            name: 'pointScalars',
                            dataType: 'Float32Array',
                            values: topData,
                        },
                    }],
                }
            })

            let leftPlane = vtk({
                vtkClass: 'vtkPolyData',
                points: {
                    vtkClass: 'vtkPoints',
                    dataType: 'Float32Array',
                    numberOfComponents: 3,
                    values: leftPoint,
                },
                polys: {
                    vtkClass: 'vtkCellArray',
                    dataType: 'Float32Array',
                    values: leftCell,
                },
                pointData: {
                    vtkClass: 'vtkDataSetAttributes',
                    activeScalars: 0,
                    arrays: [{
                        data: {
                            vtkClass: 'vtkDataArray',
                            name: 'pointScalars',
                            dataType: 'Float32Array',
                            values: leftData,
                        },
                    }],
                }
            })
            let rightPlane = vtk({
                vtkClass: 'vtkPolyData',
                points: {
                    vtkClass: 'vtkPoints',
                    dataType: 'Float32Array',
                    numberOfComponents: 3,
                    values: rightPoint,
                },
                polys: {
                    vtkClass: 'vtkCellArray',
                    dataType: 'Float32Array',
                    values: rightCell,
                },
                pointData: {
                    vtkClass: 'vtkDataSetAttributes',
                    activeScalars: 0,
                    arrays: [{
                        data: {
                            vtkClass: 'vtkDataArray',
                            name: 'pointScalars',
                            dataType: 'Float32Array',
                            values: rightData,
                        },
                    }],
                }
            })
            let bottomPlane = vtk({
                vtkClass: 'vtkPolyData',
                points: {
                    vtkClass: 'vtkPoints',
                    dataType: 'Float32Array',
                    numberOfComponents: 3,
                    values: bottomPoint,
                },
                polys: {
                    vtkClass: 'vtkCellArray',
                    dataType: 'Float32Array',
                    values: bottomCell,
                },
                pointData: {
                    vtkClass: 'vtkDataSetAttributes',
                    activeScalars: 0,
                    arrays: [{
                        data: {
                            vtkClass: 'vtkDataArray',
                            name: 'pointScalars',
                            dataType: 'Float32Array',
                            values: bottomData,
                        },
                    }],
                }
            })

            const sourceData = vtkAppendPolyData.newInstance();
            sourceData.setInputData(vtk(polydata));
            sourceData.addInputData(vtk(polydata2));
            sourceData.addInputData(vtk(topPlane));
            sourceData.addInputData(vtk(leftPlane));
            sourceData.addInputData(vtk(rightPlane));
            sourceData.addInputData(vtk(bottomPlane));
            mapper2.setInputConnection(sourceData.getOutputPort());
            const actor2 = vtkActor.newInstance();
            actor2.setMapper(mapper2);
            // 将actor添加到渲染器
            // 创建第二个平面
            let data1 = actor2.getMapper().getInputData().getState();
            let datas = vtk(data1);
            // 改变模型中心（自动旋转）
            // vtkMatrixBuilder
            //     .buildFromDegree()
            //     .translate(-xLength / 2, 0, -zLength / 2)
            //     .apply(datas.getPoints().getData());
            model.data = datas;
            model.points = data1.points.values;
            // Populate with initial manipulators
            let pointDatas = JSON.parse(JSON.stringify(data1.pointData.arrays[0].data.values))
            pointDatas.sort(function (a, b) {
                return a - b;
            });
            let unique = [...new Set(pointDatas)];
            if (unique[0] === "null") unique.splice(0, 1);
            unique.sort(function (a, b) {
                return a - b;
            });
            let min = Number(unique[0]);
            let max = Number(unique[unique.length - 1]);
            this.setState({
                min: min,
                max: max,
                unique: unique,
                // OpenGlRW: OpenGlRW,
            })
            lookupTable.setMappingRange(min, max);
            // lookupTable.setHueRange(-1, 1);
            // lookupTable.setSaturationRange(0, 0);
            // lookupTable.setValueRange(-1, 0.5);
            let map = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            ///////////////////////////////////////////////////////////////////////////////////////////////////
            // const lut1 = vtkColorTransferFunction.newInstance();
            // //预设色标颜色样式
            // const preset = vtkColorMaps.getPresetByName("X Ray");
            // //应用ColorMap
            // lut1.applyColorMap(preset);
            // lut1.updateRange();
            //////////////////////////////////////////////////////////////////////////////////////////////////////
            let act = vtkActor.newInstance();
            map.setInputData(model.data);
            // map.setLookupTable(lut1);
            act.setMapper(map);
            model.actor = act;
            model.mapper = map;
            model.renderer.addActor(act);
            model.interactorStyle.setCenterOfRotation(map.getCenter());
            reassignManipulators(model);
        }

        model.renderer.resetCamera();
        model.renderWindow.render();
        model.activeCamera = model.renderer.getActiveCamera();
        model.activeCameraState = model.renderer.getActiveCamera().getState();
    };

    componentDidMount() {
        let { appName } = this.props;
        if (appName === "Super Resolution ITSMF" || appName === "超分辨率反演" || appName === "保幅超分辨率反演(Super Resolution ITSMF)") {
            this.props.dispatch(actions.setMoveStyle(actions.moveType.PAN));
            this.setState({
                mode: "X Ray"
            })
        } else {
            this.props.dispatch(actions.setMoveStyle(actions.moveType.ROTATE));
            this.setState({
                mode: "X Ray"
            })
        }
        this.props.dispatch(actions.toggleShitidanyuanButton("command-disable"));
        this.props.dispatch(actions.toggleWanggeButton("command-disable"));
        this.props.dispatch(actions.togglePointButton("command-disable"));
        this.props.dispatch(actions.toggleAxisButton("command-disable"));
        this.props.dispatch(actions.toggleBoundButton("command-disable"));
        this.props.dispatch(actions.toggleResultButton("command-disable"));
        this.props.dispatch(actions.toggleLightButton("command-disable"));
        this.props.dispatch(actions.toggleSebiaoButton("command-disable"));
        this.props.dispatch(actions.toggleCejuButton("command-disable"));
        this.props.dispatch(actions.toggleScaleButton("command-disable"));
        this.result();
        // let url = global.baseUrl.replace('8002', "6001");
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
        let { boxBgColor, model, mode, unique, min, max, activeScalar, dx, dy, dz } = this.state;
        let { show, state, data } = this.props;
        let { moveStyle, screen, ruler, attribute, scale, ranging, theme, scalar, fontSize, modelStyle } = state;
        let scaleOpc = 0;
        let scales = [];

        if (scale === true) {
            scaleOpc = 1;
        } else {
            scaleOpc = 0;
        }
        let fontColor, bgColor;
        if (theme === "dark") {
            fontColor = "#fff";
            bgColor = [0, 0, 0]
        } else {
            fontColor = "#000";
            bgColor = [1, 1, 1]
        }
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
                model.textCtx.font = '14px serif';
                model.textCtx.fillStyle = fontColor;
                model.textCtx.textAlign = 'center';
                model.textCtx.textBaseline = 'middle';
                let y = dims.height * window.devicePixelRatio - point[1];
                model.textCtx.fillText(`${data.data[posY][posX]}-${posZ}`, point[0], y);
            });
        } else {
            if (model.renderWindow) {
                // model.renderWindow.getInteractor().onRightButtonPress((callData) => {
                //     console.log("请打开测距功能以进行下一步。。。")
                // })
            }
        }
        if (model.renderWindow) {
            const lut1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);
            lut1.applyColorMap(preset1);
            lut1.setMappingRange(min, max);
            lut1.updateRange();
            model.mapper.setLookupTable(lut1);
            let OpenGlRW = model.fullScreenRenderer.getOpenGLRenderWindow();
            gl(OpenGlRW);
            let r = max - min, p = String(r).length > 2 ? 0 : 2;
            // activeScalar = [(unique[unique.length - 1]), (unique[unique.length - 1 - num]), (unique[num]), (unique[0])];
            activeScalar = [Number(max.toFixed(p)), Number((r / 3 * 2 + min).toFixed(p)), Number((r / 3 + min).toFixed(p)), Number(min.toFixed(p))];
            scales = ["100%", ((unique.length - num) * 100) / unique.length + "%", (num * 100) / unique.length + "%", "0%"];
            if (document.querySelector(".scalarMax")) document.querySelector(".scalarMax").innerHTML = max;
            if (document.querySelector(".scalarMin")) document.querySelector(".scalarMin").innerHTML = min;
            if (document.querySelector(".vtk-container1")) {
                document.querySelector(".vtk-container1").style.display = "block";
            }
            //应用ColorMap
            if (this.container1.current.childElementCount < 1) {
                scalarBar(model, unique, mode, this.container1);
            } else {
                this.container1.current.innerHTML = null;
                scalarBar(model, unique, mode, this.container1);
            }
            model.fullScreenRenderer.setBackground(bgColor);

            if (document.querySelector('.textCanvas')) this.container.current.children[0].removeChild(document.querySelector('.textCanvas'))
            if (dimensional === 2) {
                console.log(model);
                showBoundRuler(ruler, model, this.container, vtk(model.actor.getMapper().getInputData().getState()), this.props, dimensional, fontColor, xAxis, yAxis, 'text1'); //刻度标尺
                // showBoundRuler(ruler, model, this.container, vtk(model.actor.getMapper().getInputData().getState()), this.props, dimensional, fontColor, xAxis, yAxis, 'text1', xMin, xMax, yMin, yMax, zMin, zMax); //刻度标尺
            } else {
                showBoundRuler(ruler, model, this.container, vtk(model.actor.getMapper().getInputData().getState()), this.props, dimensional, fontColor, show); //刻度标尺
                // showBoundRuler(ruler, model, this.container, vtk(model.actor.getMapper().getInputData().getState()), this.props, dimensional, fontColor, show, undefined, undefined, xMin, xMax, yMin, yMax, zMin, zMax); //刻度标尺

            }
        }
        //model自动旋转///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // if (model.fullScreenRenderer) {
        //     const camera = model.renderer.getActiveCamera();
        //     console.log(camera.getClippingRange())
        //     camera.setClippingRange(0.1,600);
        //     const fn = () => {
        //         let cameraPosition = camera.getPosition();
        //         // let cameraFocalPoint = camera.getFocalPoint();
        //         console.log(camera);
        //         // let polydata = JSON.parse(JSON.stringify(model.actor.getMapper().getInputData().getState()));
        //         // let data = vtk(polydata);
        //         vtkMatrixBuilder
        //             .buildFromDegree()
        //             .rotateY(1)
        //             .apply(cameraPosition);
        //         // console.log(cameraPosition);
        //         camera.setPosition(...cameraPosition);
        //         model.renderWindow.render();
        //         window.requestAnimationFrame(fn);
        //         // model.mapper.setInputData(data);
        //         // model.renderer.removeActor(model.actor);
        //         // model.actor.setMapper(model.mapper)
        //         // model.renderer.addActor(model.actor);
        //     }
        //     window.requestAnimationFrame(fn);
        // }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
        changeManipulators(model, moveStyle, modelStyle);

        return (
            <div>
                <Draggable handle=".handle"
                    defaultPosition={{ x: 0, y: 0 }}
                    position={null}
                    grid={[1, 1]}
                    scale={1}>
                    <div style={{ display: attribute, position: "absolute", zIndex: "999", padding: "20px" }}>
                        <div style={{ width: "250px", position: "absolute", background: boxBgColor, padding: "20px", lineHeight: "20px", display: "block" }}>
                            <span className="handle" style={{ display: "inline-block", width: "100%", textAlign: "center" }}>属性</span>
                            <InputGroup>
                                <Row >
                                    <Col >ColorThemes</Col >
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
                            </InputGroup>
                        </div>
                    </div>
                </Draggable>
                <div className="vtk-container" style={{ "height": show, "minHeight": "100px", "minWidth": "100px" }} ref={this.container}></div>
                <div style={{ width: "80px", position: "absolute", left: "8%", bottom: "15%", opacity: scaleOpc, borderBottom: "0.5px solid " + fontColor, color: fontColor, transform: "scale(" + fontSize + "," + fontSize + ")" }}>
                    <div style={{ height: "1vh", position: "relative", fontSize: 'larger' }}>
                        <div style={{ position: "absolute", left: "-20%", bottom: "0" }}>
                            <span style={{ position: "absolute", color: fontColor, bottom: "0", transform: "translateX(-50%)", lineHeight: "50%" }}>dx：</span>
                        </div>
                        <div style={{ position: "absolute", left: "0", borderLeft: "0.5px solid " + fontColor, height: '100%' }}>
                        </div>
                        <div style={{ position: "absolute", left: "50%", height: '100%' }}>
                            <span style={{ position: "absolute", color: fontColor, display: "inline-block", bottom: "0", transform: "translateX(-50%)" }}>{dx}m</span>
                        </div>
                        <div style={{ position: "absolute", right: "0", borderRight: "0.5px solid " + fontColor, height: '100%' }}>
                        </div>
                    </div>
                </div>
                <div style={{ width: "80px", position: "absolute", left: "8%", bottom: "10%", opacity: scaleOpc, borderBottom: "0.5px solid " + fontColor, color: fontColor, transform: "scale(" + fontSize + "," + fontSize + ")" }}>
                    <div style={{ height: "1vh", position: "relative", fontSize: 'larger' }}>
                        <div style={{ position: "absolute", left: "-20%", bottom: "0" }}>
                            <span style={{ position: "absolute", color: fontColor, bottom: "0", transform: "translateX(-50%)", lineHeight: "50%" }}>dy：</span>
                        </div>
                        <div style={{ position: "absolute", left: "0", borderLeft: "0.5px solid " + fontColor, height: '100%' }}>
                        </div>
                        <div style={{ position: "absolute", left: "50%", height: '100%' }}>
                            <span style={{ position: "absolute", color: fontColor, display: "inline-block", bottom: "0", transform: "translateX(-50%)" }}>{dy}m</span>
                        </div>
                        <div style={{ position: "absolute", right: "0", borderRight: "0.5px solid " + fontColor, height: '100%' }}>
                        </div>
                    </div>
                </div>
                <div style={{ width: "80px", position: "absolute", left: "8%", bottom: "5%", opacity: scaleOpc, borderBottom: "0.5px solid " + fontColor, color: fontColor, transform: "scale(" + fontSize + "," + fontSize + ")" }}>
                    <div style={{ height: "1vh", position: "relative", fontSize: 'larger' }}>
                        <div style={{ position: "absolute", left: "-20%", bottom: "0" }}>
                            <span style={{ position: "absolute", color: fontColor, bottom: "0", transform: "translateX(-50%)", lineHeight: "50%" }}>dz：</span>
                        </div>
                        <div style={{ position: "absolute", left: "0", borderLeft: "0.5px solid " + fontColor, height: '100%' }}>
                        </div>
                        <div style={{ position: "absolute", left: "50%", height: '100%' }}>
                            <span style={{ position: "absolute", color: fontColor, display: "inline-block", bottom: "0", transform: "translateX(-50%)" }}>{dz}m</span>
                        </div>
                        <div style={{ position: "absolute", right: "0", borderRight: "0.5px solid " + fontColor, height: '100%' }}>
                        </div>
                    </div>
                </div>
                <div style={{ width: "8%", height: "20%", position: "absolute", right: "5%", bottom: "5%", opacity: scalar }}>
                    <div ref={this.container1} className="vtk-container1" style={{ width: "15%", height: "calc(100% - 18px)", position: "relative", opacity: scalar, overflow: "hidden", margin: "10px 0 10px", float: "left", borderRight: "0.5px solid " + fontColor }}></div>
                    <div style={{ width: "8%", height: "calc(100% - 19px)", marginTop: "10px", float: "left" }}>
                        <div style={{ height: "100%", position: "relative", listStyle: "none" }}>
                            {scales.map((item, index) =>
                                <div key={index} style={{ position: "absolute", bottom: item, height: 0 }}>
                                    <span style={{ display: "inline-block", width: "10px", color: fontColor, borderTop: "0.5px solid " + fontColor, verticalAlign: "top", transform: "translateX(-50%) scale(" + fontSize + "," + fontSize + ")" }}></span>
                                    <span style={{ width: "120px", position: "absolute", display: "inline-block", wordWrap: "break-word", whiteSpace: "nowrap", color: fontColor, transform: "translateY(-50%) scale(" + fontSize + "," + fontSize + ")" }}>{activeScalar[index]}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div >
        )
    }
}
