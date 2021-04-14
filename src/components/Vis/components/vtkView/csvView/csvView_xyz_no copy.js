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
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import {
    // Slider, InputNumber, 
    Input, Col, Row,
    // Select, 
    Checkbox
} from "antd";
// import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
// import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
// import colorMode from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json'
import {
    Rendering, Screen,
    gl,
    scalarBar,
    // Axis,
    reassignManipulators, changeManipulators, showBoundRuler,
    // showVector
} from "../common/index";

const InputGroup = Input.Group;
// const { Option } = Select;

export default class csvView_xyz_no extends Component {
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

    //修改MappingRange
    updateMappingRange = () => {
        const min = Number(document.querySelector('.min').value);
        const max = Number(document.querySelector('.max').value);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
            this.state.model.lookupTable.setMappingRange(min, max);
            this.state.model.renderWindow.render();
        }
    };
    //修改HueRange
    updateHueRange = () => {
        const min = Number(document.querySelector('.hueRangemin').value);
        const max = Number(document.querySelector('.hueRangemax').value);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
            this.state.model.lookupTable.setHueRange(min, max);
            this.state.model.renderWindow.render();
        }
    };
    //修改MappingRange
    updateValueRange = () => {
        const min = Number(document.querySelector('.valueRangemin').value);
        const max = Number(document.querySelector('.valueRangemax').value);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
            this.state.model.lookupTable.setValueRange(min, max);
            this.state.model.renderWindow.render();
        }
    };
    //修改ValueRange
    updateAlphaRange = () => {
        const min = Number(document.querySelector('.alphaRangemin').value);
        const max = Number(document.querySelector('.alphaRangemax').value);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
            this.state.model.lookupTable.setAlphaRange(min, max);
            this.state.model.renderWindow.render();
        }
    };
    //修改SaturationRange
    updateSaturationRange = () => {
        const min = Number(document.querySelector('.saturationRangemin').value);
        const max = Number(document.querySelector('.saturationRangemax').value);
        if (!Number.isNaN(min) && !Number.isNaN(max)) {
            this.state.model.lookupTable.setSaturationRange(min, max);
            this.state.model.renderWindow.render();
        }
    };
    //修改NanColor
    updateNanColor = () => {
        const color1 = Number(document.querySelector('.nanColor1').value);
        const color2 = Number(document.querySelector('.nanColor2').value);
        const color3 = Number(document.querySelector('.nanColor3').value);
        const color4 = Number(document.querySelector('.nanColor4').value);
        if (!Number.isNaN(color1) && !Number.isNaN(color2) && !Number.isNaN(color3) && !Number.isNaN(color4)) {
            this.state.model.lookupTable.setNanColor(color1, color2, color3, color4);
            this.state.model.renderWindow.render();
        }
    };
    //修改AboveRangeColor
    updateAboveRangeColor = () => {
        const color1 = Number(document.querySelector('.AboveColor1').value);
        const color2 = Number(document.querySelector('.AboveColor2').value);
        const color3 = Number(document.querySelector('.AboveColor3').value);
        const color4 = Number(document.querySelector('.AboveColor4').value);
        if (!Number.isNaN(color1) && !Number.isNaN(color2) && !Number.isNaN(color3) && !Number.isNaN(color4)) {
            this.state.model.lookupTable.setAboveRangeColor(color1, color2, color3, color4);
            this.state.model.renderWindow.render();
        }
    };
    //修改BelowRangeColor
    updateBelowRangeColor = () => {
        const color1 = Number(document.querySelector('.BelowColor1').value);
        const color2 = Number(document.querySelector('.BelowColor2').value);
        const color3 = Number(document.querySelector('.BelowColor3').value);
        const color4 = Number(document.querySelector('.BelowColor4').value);
        if (!Number.isNaN(color1) && !Number.isNaN(color2) && !Number.isNaN(color3) && !Number.isNaN(color4)) {
            this.state.model.lookupTable.setBelowRangeColor(color1, color2, color3, color4);
            this.state.model.renderWindow.render();
        }
    };
    //修改UseAboveRangeColor
    updateUseAboveRangeColor = () => {
        const value = document.querySelector('.useAboveRangeColorvisibility').checked;
        this.state.model.lookupTable.setUseAboveRangeColor(value);
        this.state.model.renderWindow.render();
    };
    //修改UseBelowRangeColor
    updateUseBelowRangeColor = () => {
        const value = document.querySelector('.useBelowRangeColorvisibility').checked;
        this.state.model.lookupTable.setUseBelowRangeColor(value);
        this.state.model.renderWindow.render();
    };

    //渲染方法
    result = () => {
        let { data } = this.props;

        let { model } = this.state;
        let vtkBox = document.getElementsByClassName('vtk-container')[0];
        if (vtkBox) {
            vtkBox.innerHTML = null;
        }

        // let oldData = data.data;
        // // let reData = [];
        // for (let x = 0; x < oldData.length; x++) {
        //     oldData[x].length = 96;
        // }
        // console.log(oldData)

        let yLength = data.length;
        let zLength = 101;
        let xLength = data[0].length / zLength;
        let arr = data;
        let array = [];
        for (let i = 0; i < zLength; i++) {
            array[i] = [];
            for (let j = 0; j < yLength; j++) {
                array[i].push(arr[j].splice(0, xLength));
            }
        }
        console.log(array);
        let resData = array;
        zLength = resData.length;
        yLength = resData[0].length;
        xLength = resData[0][0].length;
        Rendering(model, this.container);
        const lookupTable = vtkLookupTable.newInstance({
        });
        // 定义查找表
        model.lookupTable = lookupTable;
        // 定义平面源
        const planeSource1 = vtkPlaneSource.newInstance({
            xResolution: xLength - 1,
            yResolution: yLength - 1,
            origin: [0, 0, 0],
            point1: [xLength, 0, 0],
            point2: [0, yLength, 0],
        });
        const planeSource2 = vtkPlaneSource.newInstance({
            xResolution: xLength - 1,
            yResolution: yLength - 1,
            origin: [0, 0, zLength],
            point1: [xLength, 0, zLength],
            point2: [0, yLength, zLength],
        });
        const planeSource3 = vtkPlaneSource.newInstance({
            xResolution: xLength - 1,
            yResolution: zLength - 1,
            origin: [0, 0, 0],
            point1: [xLength, 0, 0],
            point2: [0, 0, zLength],
        });
        const planeSource4 = vtkPlaneSource.newInstance({
            xResolution: xLength - 1,
            yResolution: zLength - 1,
            origin: [0, yLength, 0],
            point1: [xLength, yLength, 0],
            point2: [0, yLength, zLength],
        });
        const planeSource5 = vtkPlaneSource.newInstance({
            xResolution: yLength - 1,
            yResolution: zLength - 1,
            origin: [0, 0, 0],
            point1: [0, yLength, 0],
            point2: [0, 0, zLength],
        });
        const planeSource6 = vtkPlaneSource.newInstance({
            xResolution: yLength - 1,
            yResolution: zLength - 1,
            origin: [xLength, 0, 0],
            point1: [xLength, yLength, 0],
            point2: [xLength, 0, zLength],
        });
        let pointData = [];
        for (let i = 0; i < zLength; i++) {
            for (let j = 0; j < yLength; j++) {
                for (let k = 0; k < xLength; k++) {
                    let index = i * yLength * xLength + j * xLength + k;
                    pointData[index] = resData[i][j][k];
                }
            }
        }
        let pointData1 = [], pointData2 = [], pointData3 = [], pointData4 = [], pointData5 = [], pointData6 = [];
        for (let j = 0; j < yLength; j++) {
            for (let k = 0; k < xLength; k++) {
                let index = j * xLength + k;
                pointData1[index] = resData[0][j][k];
                pointData2[index] = resData[zLength - 1][j][k];
            }
        }
        for (let j = 0; j < zLength; j++) {
            for (let k = 0; k < xLength; k++) {
                let index = j * xLength + k;
                pointData3[index] = resData[j][0][k];
                pointData4[index] = resData[j][yLength - 1][k];
            }
        }
        for (let j = 0; j < zLength; j++) {
            for (let k = 0; k < yLength; k++) {
                let index = j * yLength + k;
                pointData5[index] = resData[j][k][0];
                pointData6[index] = resData[j][k][xLength - 1];
            }
        }
        const polydata1 = planeSource1.getOutputData().getState();
        polydata1.pointData = {
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

        const polydata2 = planeSource2.getOutputData().getState();
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
        const polydata3 = planeSource3.getOutputData().getState();
        polydata3.pointData = {
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
        const polydata4 = planeSource4.getOutputData().getState();
        polydata4.pointData = {
            vtkClass: 'vtkDataSetAttributes',
            activeScalars: 0,
            arrays: [{
                data: {
                    vtkClass: 'vtkDataArray',
                    name: 'pointScalars',
                    dataType: 'Float32Array',
                    values: pointData4,
                },
            }],
        }
        const polydata5 = planeSource5.getOutputData().getState();
        polydata5.pointData = {
            vtkClass: 'vtkDataSetAttributes',
            activeScalars: 0,
            arrays: [{
                data: {
                    vtkClass: 'vtkDataArray',
                    name: 'pointScalars',
                    dataType: 'Float32Array',
                    values: pointData5,
                },
            }],
        }
        const polydata6 = planeSource6.getOutputData().getState();
        polydata6.pointData = {
            vtkClass: 'vtkDataSetAttributes',
            activeScalars: 0,
            arrays: [{
                data: {
                    vtkClass: 'vtkDataArray',
                    name: 'pointScalars',
                    dataType: 'Float32Array',
                    values: pointData6,
                },
            }],
        }
        let pointDatas = pointData;
        pointDatas.sort(function (a, b) {
            return a - b;
        });
        let unique = [...new Set(pointDatas)];
        if (unique[0] === null || unique[0] === "NaN") unique.splice(0, 1);
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
        const map = vtkMapper.newInstance({
            useLookupTableScalarRange: true,
            lookupTable
        });
        const act = vtkActor.newInstance();
        const sourceData = vtkAppendPolyData.newInstance();
        sourceData.setInputData(vtk(polydata1));
        sourceData.addInputData(vtk(polydata2));
        sourceData.addInputData(vtk(polydata3));
        sourceData.addInputData(vtk(polydata4));
        sourceData.addInputData(vtk(polydata5));
        sourceData.addInputData(vtk(polydata6));
        map.setInputConnection(sourceData.getOutputPort());
        act.setMapper(map);
        model.actor = act;
        model.mapper = map;
        planeSource1.delete();
        planeSource2.delete();
        planeSource3.delete();
        planeSource4.delete();
        planeSource5.delete();
        planeSource6.delete();
        model.data = map.getInputData();
        model.renderer.addActor(act)
        model.interactorStyle.setCenterOfRotation(model.mapper.getCenter())
        reassignManipulators(model);
        model.renderer.resetCamera();
        model.renderWindow.render();
        model.activeCamera = model.renderer.getActiveCamera();
        model.activeCameraState = model.renderer.getActiveCamera().getState();
    };

    componentDidMount = () => {
        console.log("xyz_no")
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
        //绑定方法
        ['min', 'max'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('input', this.updateMappingRange);
        });
        ['hueRangemin', 'hueRangemax'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('input', this.updateHueRange);
        });
        ['saturationRangemin', 'saturationRangemax'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('input', this.updateSaturationRange);
        });
        ['valueRangemin', 'valueRangemax'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('input', this.updateValueRange);
        });
        ['alphaRangemin', 'alphaRangemax'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('input', this.updateAlphaRange);
        });
        ['useAboveRangeColorvisibility'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('change', this.updateUseAboveRangeColor);
        });
        ['useBelowRangeColorvisibility'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('change', this.updateUseBelowRangeColor);
        });

        ['nanColor1', 'nanColor2', 'nanColor3', 'nanColor4'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('input', this.updateNanColor);
        });
        ['AboveColor1', 'AboveColor2', 'AboveColor3', 'AboveColor4'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('input', this.updateAboveRangeColor);
        });
        ['BelowColor1', 'BelowColor2', 'BelowColor3', 'BelowColor4'].forEach((selector) => {
            document.querySelector(`.${selector}`)
                .addEventListener('input', this.updateBelowRangeColor);
        });
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
        let {
            boxBgColor, model, activeScalar, unique, min, max,
            // dx, dy, dz
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
                model.textCtx.fillText(`${data[posY][posX]}-${posZ}`, point[0], y);
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
            let mode = model.mapper.getColorModeAsString();
            activeScalar = [unique[unique.length - 1], unique[unique.length - 1 - num], unique[num], unique[0]];
            scales = [(unique.length * 100) / unique.length + "%", ((unique.length - num) * 100) / unique.length + "%", (num * 100) / unique.length + "%", 0 + "%"];
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
            let dimensional = 3;
            if (document.querySelector('.textCanvas')) this.container.current.children[0].removeChild(document.querySelector('.textCanvas'))
            showBoundRuler(ruler, model, this.container, vtk(model.actor.getMapper().getInputData().getState()), this.props, dimensional, fontColor, show); //刻度标尺
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
                                    <Col >MapperRange</Col >
                                </Row>
                                <Row >
                                    <Col >
                                        <Input className="min" type="text" style={{ width: "50%" }} defaultValue="0.0" />
                                        <Input className="max" type="text" style={{ width: "50%" }} defaultValue="1.0" />
                                    </Col >
                                </Row>
                                <Row >
                                    <Col >HueRange</Col >
                                </Row>
                                <Row >
                                    <Col >
                                        <Input className="hueRangemin" type="text" style={{ width: "50%" }} defaultValue="0" />
                                        <Input className="hueRangemax" type="text" style={{ width: "50%" }} defaultValue="0.6" />
                                    </Col >
                                </Row>
                                <Row >
                                    <Col >SaturationRange</Col >
                                </Row>
                                <Row >
                                    <Col >
                                        <Input className="saturationRangemin" type="text" style={{ width: "50%" }} defaultValue="0" />
                                        <Input className="saturationRangemax" type="text" style={{ width: "50%" }} defaultValue="0" />
                                    </Col >
                                </Row>
                                <Row >
                                    <Col >ValueRange</Col >
                                </Row>
                                <Row >
                                    <Col >
                                        <Input className="valueRangemin" type="text" style={{ width: "50%" }} defaultValue="0" />
                                        <Input className="valueRangemax" type="text" style={{ width: "50%" }} defaultValue="1" />
                                    </Col >
                                </Row>
                                <Row >
                                    <Col >AlphaRange</Col >
                                </Row>
                                <Row >
                                    <Col >
                                        <Input className="alphaRangemin" type="text" style={{ width: "50%" }} defaultValue="1" />
                                        <Input className="alphaRangemax" type="text" style={{ width: "50%" }} defaultValue="1" />
                                    </Col >
                                </Row>
                                <Row >
                                    <label >UseAboveRangeColor
                                <Checkbox className="useAboveRangeColorvisibility" type="checkbox" defaultChecked={false} />
                                    </label >
                                </Row>
                                <Row >
                                    <label>UseBelowRangeColor
                                <Checkbox className="useBelowRangeColorvisibility" type="checkbox" defaultChecked={false} />
                                    </label>
                                </Row>
                                <Row >
                                    <Col >NaNColor </Col >
                                </Row>
                                <Row >
                                    <Col >
                                        <Input className="nanColor1" type="text" style={{ width: "25%" }} defaultValue="0.5" />
                                        <Input className="nanColor2" type="text" style={{ width: "25%" }} defaultValue="0.0" />
                                        <Input className="nanColor3" type="text" style={{ width: "25%" }} defaultValue="0.0" />
                                        <Input className="nanColor4" type="text" style={{ width: "25%" }} defaultValue="1.0" />
                                    </Col >
                                </Row>
                                <Row >
                                    <Col >AboveRangeColor </Col >
                                </Row>
                                <Row >
                                    <Col >
                                        <Input className="AboveColor1" type="text" style={{ width: "25%" }} defaultValue="0.0" />
                                        <Input className="AboveColor2" type="text" style={{ width: "25%" }} defaultValue="0.0" />
                                        <Input className="AboveColor3" type="text" style={{ width: "25%" }} defaultValue="0.0" />
                                        <Input className="AboveColor4" type="text" style={{ width: "25%" }} defaultValue="1.0" />
                                    </Col >
                                </Row>
                                <Row >
                                    <Col >BelowRangeColor </Col >
                                </Row>
                                <Row >
                                    <Col >
                                        <Input className="BelowColor1" type="text" style={{ width: "25%" }} defaultValue="1.0" />
                                        <Input className="BelowColor2" type="text" style={{ width: "25%" }} defaultValue="1.0" />
                                        <Input className="BelowColor3" type="text" style={{ width: "25%" }} defaultValue="1.0" />
                                        <Input className="BelowColor4" type="text" style={{ width: "25%" }} defaultValue="1.0" />
                                    </Col >
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
