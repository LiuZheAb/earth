/**
* 文件名：csvView.js
* 作者：鲁杨飞
* 创建时间：2020/8/24
* 文件描述：*.csv类型数据文件渲染逻辑。
*/
import vtk from 'vtk.js/Sources/vtk';
import Draggable from 'react-draggable';
import React, { Component } from 'react';
import { Input, Select, Col, Row } from "antd";
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
// import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
// import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
// import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
// import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
// import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import colorMode from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
// import colorMode from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';
import { Rendering, Screen, reassignManipulators, changeManipulators, showBoundRuler, Sfn, creatPlane, gl } from "../common/index";
import * as actions from '../../../redux/actions/index';
// import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
// import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
// import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
const InputGroup = Input.Group;
const { Option } = Select;
export default class csvViewXy extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            model: { actState: [] },
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
            xAxis: [],
            yAxis: [],
            activeScalar: [],
            xlon: null,
            ylon: null,
            min: null,
            max: null,
            planeCenter: null,
            pointLeft: null,
        }
        this.container = React.createRef();
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
        let { data, datatype, appName } = this.props;
        let { model, mode } = this.state;
        let vtkBox = document.getElementsByClassName('vtk-container')[0];
        let yLength = 0;
        let xLength = 0;
        let _this = this;
        if (vtkBox) {
            vtkBox.innerHTML = null;
        }
        // this.props.dispatch(actions.setMoveStyle(actions.moveType.PAN));
        Rendering(model, this.container);
        reassignManipulators(model);
        if (datatype === "重力数据网格化") {
            let xAxis = data.lat, yAxis = data.lon, arrs = [...data.griddata];
            // 定义actor
            const actor = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            // 定义查找表
            model.lookupTable = lookupTable;

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });

            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.griddata)
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.renderer.addActor(actor);
            model.interactorStyle.setCenterOfRotation(mapper.getCenter());
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.lookupTable = lookupTable;
            model.actor = actor;
            model.mapper = mapper;
        } else if (datatype === "数据去趋势") {
            let xAxis = data.x, yAxis = data.y, arrs = [...data.data], arrs1 = [...data.trend_values], arrs2 = [...data.residuals];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const actor2 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap
            const lookupTable2 = vtkColorTransferFunction.newInstance();
            const preset2 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable2.applyColorMap(preset2);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            const mapper2 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable2,
            });

            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.data);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) / 2, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.trend_values, cen1);
            let boun2 = actor1.getBounds();
            let cen2 = [boun2[1] + (boun2[3] - boun2[2]) / 2, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs2, xLength, yLength, actor2, mapper2, lookupTable2, data.residuals, cen2);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.mapper = mapper;
            model.actor1 = actor1;
            model.mapper1 = mapper1;
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.lookupTable2 = lookupTable2;
            model.actor2 = actor2;
            model.mapper2 = mapper2;
        } else if (datatype === "重力数据投影") {
            let xAxis = data.x, yAxis = data.y, xAxis1 = data.lat, yAxis1 = data.lon, arrs = [...data.elev], arrs1 = [...data.griddata];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.elev);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis1, yAxis1, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.griddata, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.mapper = mapper;
            model.lookupTable = lookupTable;
            model.actor1 = actor1;
            model.lookupTable1 = lookupTable1;
            model.mapper1 = mapper1;
        } else if (datatype === "六面体模型重力异常正演") {
            let xAxis = data.xp.map(item => Number(item.toFixed(2))), yAxis = data.yp.map(item => Number(item.toFixed(2))), arrs = [...data.field_gra], arrs1 = [...data.field_gra1];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.field_gra);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.field_gra1, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.mapper = mapper;
            model.actor1 = actor1;
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.mapper1 = mapper1;
        } else if (datatype === "重力数据求偏导") {
            let xAxis = data.lat, yAxis = data.lon, arrs = [...data.grav_devir];
            // 定义actor
            const actor = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.grav_devir);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.lookupTable = lookupTable;
            model.mapper = mapper;
        } else if (datatype === "球型棱柱体模型重力异常正演") {
            let xAxis = data.xp.map(item => Number(item.toFixed(2))), yAxis = data.yp.map(item => Number(item.toFixed(2))), arrs = [...data.field_gra], arrs1 = [...data.field_gra1];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.field_gra);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.field_gra1, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.mapper = mapper;
            model.mapper1 = mapper1;
            model.actor1 = actor1;
        } else if (datatype === "典型矿区仿真数据反演一（最小模型约束反演）") {
            let xAxis = data.xp.map(item => Number(item.toFixed(2))), yAxis = data.yp.map(item => Number(item.toFixed(2))), arrs = [...data.predicted], arrs1 = [...data.residuals];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.predicted);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.residuals, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.mapper = mapper;
            model.mapper1 = mapper1;
            model.actor1 = actor1;
        } else if (datatype === "典型矿区仿真数据反演二（深度加权约束反演）") {
            let xAxis = data.xp.map(item => Number(item.toFixed(2))), yAxis = data.yp.map(item => Number(item.toFixed(2))), arrs = [...data.predicted], arrs1 = [...data.residuals];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.predicted);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.residuals, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.actor = actor;
            model.mapper = mapper;
            model.mapper1 = mapper1;
            model.actor1 = actor1;
        } else if (datatype === "典型矿区仿真数据反演三（光滑约束反演）") {
            let xAxis = data.xp.map(item => Number(item.toFixed(2))), yAxis = data.yp.map(item => Number(item.toFixed(2))), arrs = [...data.predicted], arrs1 = [...data.residuals];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.predicted);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.residuals, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.mapper = mapper;
            model.mapper1 = mapper1;
            model.actor1 = actor1;
        } else if (datatype === "典型矿区仿真数据反演四（多约束反演）") {
            let xAxis = data.xp.map(item => Number(item.toFixed(2))), yAxis = data.yp.map(item => Number(item.toFixed(2))), arrs = [...data.predicted], arrs1 = [...data.residuals];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.predicted);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.residuals, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.mapper = mapper;
            model.mapper1 = mapper1;
            model.actor1 = actor1;
        } else if (datatype === "典型矿区仿真数据反演五（全变分约束）") {
            let xAxis = data.xp.map(item => Number(item.toFixed(2))), yAxis = data.yp.map(item => Number(item.toFixed(2))), arrs = [...data.predicted], arrs1 = [...data.residuals];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.predicted);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.residuals, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.mapper = mapper;
            model.mapper1 = mapper1;
            model.actor1 = actor1;
        } else if (datatype === "重力数据延拓") {
            let xAxis = data.x, yAxis = data.y, arrs = [...data.data];
            // 定义actor
            const actor = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });

            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.data);

            model.renderer.resetCamera();
            model.renderWindow.render();
            model.lookupTable = lookupTable;
            model.actor = actor;
            model.mapper = mapper;
        } else if (datatype === "重力异常计算") {
            let xAxis = data.lat, yAxis = data.lon, xAxis1 = [...data.lat], yAxis1 = [...data.lon], arrs = [...data.FGA], arrs1 = [...data.BGA_s];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();

            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap
            // 定义查找表
            model.lookupTable = lookupTable;

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.FGA);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis1, yAxis1, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.BGA_s, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.renderer.addActor(actor);
            model.interactorStyle.setCenterOfRotation(mapper.getCenter());
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.lookupTable = lookupTable;
            model.actor = actor;
            model.mapper = mapper;
            model.actor1 = actor1;
            model.lookupTable1 = lookupTable1;
            model.mapper1 = mapper1;
        } else if (datatype === "重力观测数据反演（多约束反演）") {
            let xAxis = data.yp.map(item => Number(item.toFixed(2))), yAxis = data.xp, arrs = [...data.predicted], arrs1 = [...data.residuals];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.predicted);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 1.5, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.residuals, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.mapper = mapper;
            model.mapper1 = mapper1;
            model.actor1 = actor1;
        } else if (datatype === "磁场方向导数求取") {
            let xAxis = data.lat, yAxis = data.lon, arrs = [...data.data];
            // 定义actor
            const actor = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });

            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.data);

            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.lookupTable = lookupTable;
            model.mapper = mapper;
        } else if (datatype === "磁场模型正演") {
            let xAxis = data.xp.map(item => Number(item.toFixed(2))), yAxis = data.yp.map(item => Number(item.toFixed(2))), arrs = [...data.field_mag], arrs1 = [...data.field_mag1];
            // 定义actor
            const actor = vtkActor.newInstance();
            const actor1 = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap
            const lookupTable1 = vtkColorTransferFunction.newInstance();
            const preset1 = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable1.applyColorMap(preset1);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            const mapper1 = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable1,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.field_mag);
            let boun1 = actor.getBounds();
            let cen1 = [boun1[1] + (boun1[3] - boun1[2]) * 0.75, 0, 0];
            creatPlane(model, _this, xAxis, yAxis, datatype, arrs1, xLength, yLength, actor1, mapper1, lookupTable1, data.field_mag1, cen1);
            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.actor1 = actor1;
            model.lookupTable = lookupTable;
            model.lookupTable1 = lookupTable1;
            model.mapper = mapper;
            model.mapper1 = mapper1;
        } else if (datatype === "磁场空间延拓") {
            let xAxis = data.y, yAxis = data.x, arrs = [...data.data];
            // 定义actor
            const actor = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });

            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.data);

            model.renderer.resetCamera();
            model.renderWindow.render();
            model.lookupTable = lookupTable;
            model.actor = actor;
            model.mapper = mapper;
        } else if (datatype === "磁化极") {
            let xAxis = data.y, yAxis = data.x, arrs = [...data.data];
            // 定义actor
            const actor = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });

            creatPlane(model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data.data);

            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.mapper = mapper;
            model.lookupTable = lookupTable;
        } else if (datatype === "2d") {
            let xAxis = [], yAxis = [], arrs = [];
            if (appName === "接收函数反演 (ReceiverFunc Inversion)" || appName === "ERPS USTC") {
                for (let i = 0; i < data.length; i++) {
                    arrs.push(Number(data[i][2]));
                    xAxis.push(Number(data[i][0]));
                    yAxis.push(Number(data[i][1]));
                }
            } else {
                for (let i = 0; i < data.length; i++) {
                    arrs.push(Number(data[i][2]));
                    xAxis.push(Number(data[i][1]));
                    yAxis.push(Number(data[i][0]));
                }
            }
            yLength = Array.from(new Set(yAxis)).length > 1 ? Array.from(new Set(yAxis)).length : 2;

            xLength = Array.from(new Set(xAxis)).length;
            // let xAxis = data.x, yAxis = data.y, arrs = [...data.data];
            // 定义actor
            const actor = vtkActor.newInstance();
            const lookupTable = vtkColorTransferFunction.newInstance();
            const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
            lookupTable.applyColorMap(preset);  //应用ColorMap

            // 定义映射器
            const mapper = vtkMapper.newInstance({
                useLookupTableScalarRange: true,
                lookupTable,
            });
            creatPlane(model, _this, xAxis, yAxis, datatype, [...arrs], xLength, yLength, actor, mapper, lookupTable, arrs, [0, 0, 0], appName);

            model.renderer.resetCamera();
            model.renderWindow.render();
            model.actor = actor;
            model.mapper = mapper;
            model.lookupTable = lookupTable;
        }
        model.activeCamera = model.renderer.getActiveCamera();
        model.activeCameraState = model.renderer.getActiveCamera().getState();
    };

    componentDidMount() {
        this.props.dispatch(actions.setMoveStyle(actions.moveType.PAN));
        this.props.dispatch(actions.toggleDxuanzhuanButton("command-disable"));
        this.props.dispatch(actions.toggleRaogoujianxuanzhuanButton("command-disable"));
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
    };

    componentDidUpdate = (prevProps) => {
        let { screen } = this.props.state;
        if (screen !== prevProps.state.screen) {
            if (document.getElementsByTagName("canvas").length > 0) {
                Screen(document.getElementsByTagName("canvas")[0])
            }
        }
    }

    render() {
        let { boxBgColor, model, mode } = this.state;
        let { show, state, datatype } = this.props;
        let { moveStyle, screen, ruler, attribute,
            //  scale, ranging, 
            theme } = state;
        let fontColor, bgColor;
        if (theme === "dark") {
            fontColor = "#fff";
            bgColor = [0, 0, 0]
        } else {
            fontColor = "#000";
            bgColor = [1, 1, 1]
        }
        if (model.renderWindow) {
            if (model.actState[0]) {
                const lut1 = vtkColorTransferFunction.newInstance();
                const preset1 = vtkColorMaps.getPresetByName(mode);
                //应用ColorMap
                lut1.applyColorMap(preset1);
                let { min, max } = model.actState[0];
                lut1.setMappingRange(min, max);
                lut1.updateRange();
                model.mapper.setLookupTable(lut1);
            }
            if (model.actState[1]) {
                const lut2 = vtkColorTransferFunction.newInstance();
                const preset2 = vtkColorMaps.getPresetByName(mode);
                //应用ColorMap
                lut2.applyColorMap(preset2);
                let { min, max } = model.actState[1];
                lut2.setMappingRange(min, max);
                lut2.updateRange();
                model.mapper1.setLookupTable(lut2);
            }
            if (model.actState[2]) {
                const lut3 = vtkColorTransferFunction.newInstance();
                const preset3 = vtkColorMaps.getPresetByName(mode);
                //应用ColorMap
                lut3.applyColorMap(preset3);
                let { min, max } = model.actState[2];
                lut3.setMappingRange(min, max);
                lut3.updateRange();
                model.mapper2.setLookupTable(lut3);
            }
            let OpenGlRW = model.fullScreenRenderer.getOpenGLRenderWindow();
            gl(OpenGlRW);
            model.fullScreenRenderer.setBackground(bgColor);
            let dimensional = 2;
            model.fullScreenRenderer.setBackground(bgColor);
            for (let i = 0; i < model.actState.length; i++) {
                let { min, max, xlon, ylon, planeCenter, pointLeft, } = model.actState[i];
                Sfn(model, mode, min, max, xlon, ylon, planeCenter, pointLeft, this.container, fontColor, datatype, 'textCanvas' + i);
            }
            if (document.querySelector('.text1')) this.container.current.children[0].removeChild(document.querySelector('.text1'))
            if (document.querySelector('.text2')) this.container.current.children[0].removeChild(document.querySelector('.text2'))
            if (document.querySelector('.text3')) this.container.current.children[0].removeChild(document.querySelector('.text3'))
            showBoundRuler(ruler, model, this.container, vtk(model.actor.getMapper().getInputData().getState()), this.props, dimensional, fontColor, model.actState[0].xAxis, model.actState[0].yAxis, 'text1'); //刻度标尺
            if (model.actor1) showBoundRuler(ruler, model, this.container, vtk(model.actor1.getMapper().getInputData().getState()), this.props, dimensional, fontColor, model.actState[1].xAxis, model.actState[1].yAxis, 'text2'); //刻度标尺
            if (model.actor2) showBoundRuler(ruler, model, this.container, vtk(model.actor2.getMapper().getInputData().getState()), this.props, dimensional, fontColor, model.actState[2].xAxis, model.actState[2].yAxis, 'text3'); //刻度标尺
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

        //改变鼠标事件
        changeManipulators(model, moveStyle);

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
            </div >
        )
    }
}
