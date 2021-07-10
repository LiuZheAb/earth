/**
* 文件名：/common/index.js
* 作者：鲁杨飞
* 创建时间：2020/8/24
* 文件描述：模型渲染公共方法。
*/
import React from "react";
import { Spin } from "antd";
import ReactDOM from 'react-dom';
import vtk from 'vtk.js/Sources/vtk';
import html2canvas from 'html2canvas';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import ArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';
// import vtkLabelWidget from 'vtk.js/Sources/Interaction/Widgets/LabelWidget';
// import TextAlign from 'vtk.js/Sources/Interaction/Widgets/LabelRepresentation/Constants';
// import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
// import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
// import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
import style from 'vtk.js/Examples/Geometry/SpheresAndLabels/style.module.css';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkInteractorStyleManipulator from 'vtk.js/Sources/Interaction/Style/InteractorStyleManipulator';
import vtkGestureCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/GestureCameraManipulator';
// import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkMouseCameraTrackballPanManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballPanManipulator';
import vtkMouseCameraTrackballRollManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballRollManipulator';
import vtkMouseCameraTrackballZoomManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballZoomManipulator';
import vtkMouseCameraTrackballRotateManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballRotateManipulator';
import vtkMouseCameraTrackballZoomToMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballZoomToMouseManipulator';
import vtkMouseCameraTrackballMultiRotateManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraTrackballMultiRotateManipulator';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import * as actions from '../../../redux/actions/index';
// import { setCookie } from "../../../../../utils/cookies"

// 渲染准备
export const Rendering = (model, container) => {
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        background: [0, 0, 0],
        rootContainer: container.current,
        listenWindowResize: true,
        containerStyle: { "border": null, "width": "100%", "height": "100%", "minHeight": "100px", "minWidth": "100px" },
    });
    let renderer = fullScreenRenderer.getRenderer();
    //关闭双面照明
    renderer.setTwoSidedLighting(false);
    renderer.setLightFollowCamera(true);
    let renderWindow = fullScreenRenderer.getRenderWindow();
    const interactorStyle = vtkInteractorStyleManipulator.newInstance();
    model.interactorStyle = interactorStyle;
    model.interactor = fullScreenRenderer.getInteractor()
    model.interactor.setInteractorStyle(interactorStyle);

    // -----------------------------------------------------------
    // UI control handling
    // -----------------------------------------------------------

    const uiComponents = {};
    const selectMap = {
        leftButton: { button: 1 },
        // middleButton: { button: 2 },
        // rightButton: { button: 3 },
        scrollMiddleButton: { scrollEnabled: true, dragEnabled: false },
    };

    const manipulatorFactory = {
        None: null,
        Pan: vtkMouseCameraTrackballPanManipulator,
        Zoom: vtkMouseCameraTrackballZoomManipulator,
        Roll: vtkMouseCameraTrackballRollManipulator,
        Rotate: vtkMouseCameraTrackballRotateManipulator,
        MultiRotate: vtkMouseCameraTrackballMultiRotateManipulator,
        ZoomToMouse: vtkMouseCameraTrackballZoomToMouseManipulator,
    };

    uiComponents["leftButton"] = { manipName: "Rotate" }
    uiComponents["scrollMiddleButton"] = { manipName: "Zoom" }

    model.uiComponents = uiComponents;
    model.selectMap = selectMap;
    model.manipulatorFactory = manipulatorFactory;
    model.fullScreenRenderer = fullScreenRenderer;
    model.renderer = renderer;
    model.renderWindow = renderWindow;
};

// 截图功能
export function Screen(element) {
    const newCanvas = document.createElement("canvas");
    const dom_width = parseInt(window.getComputedStyle(element).width);
    const dom_height = parseInt(window.getComputedStyle(element).height);
    //将canvas画布放大若干倍，然后盛放在较小的容器内，就显得不模糊了
    newCanvas.width = dom_width;
    newCanvas.height = dom_height;
    newCanvas.style.width = dom_width + "px";
    newCanvas.style.height = dom_height + "px";
    html2canvas(element, {
        canvas: newCanvas,
        useCORS: true,
        imageTimeout: 1000,
    }).then((canvas) => {
        const imgUri = canvas.toDataURL("image/png") // 获取生成的图片的url
        const base64ToBlob = (code) => {
            let parts = code.split(';base64,');
            let contentType = parts[0].split(':')[1];
            let raw = window.atob(parts[1]);
            let uInt8Array = new Uint8Array(raw.length);

            for (let i = 0; i < raw.length; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }
            return new Blob([uInt8Array], { type: contentType });
        };
        const blob = base64ToBlob(imgUri);
        // window.location.href = imgUri; // 下载图片
        // 利用createObjectURL，模拟文件下载
        var today = new Date();
        const pngName = today.getDate() + '-' + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds() + '.png';
        if (window.navigator.msSaveOrOpenBlob) {
            navigator.msSaveBlob(blob, pngName);
        } else {
            const blobURL = window.URL.createObjectURL(blob)
            const vlink = document.createElement('a');
            vlink.style.display = 'none';
            vlink.href = blobURL;
            vlink.setAttribute('download', pngName);

            if (typeof vlink.download === 'undefined') {
                vlink.setAttribute('target', '_blank');
            }

            document.body.appendChild(vlink);

            var evt = document.createEvent("MouseEvents");
            evt.initEvent("click", false, false);
            vlink.dispatchEvent(evt);

            document.body.removeChild(vlink);
            window.URL.revokeObjectURL(blobURL);
        }
    });
}

// gl上下文
export const gl = (OpenGlRW) => {
    OpenGlRW.initialize();
    let gl = OpenGlRW.getShaderCache().getContext();
    gl.flush();
}

// ScalsrBar
export const scalarBar = (model, scalar, mode, container1) => {
    const fullScreenRenderer1 = vtkFullScreenRenderWindow.newInstance({
        background: [0, 0, 0],
        rootContainer: container1.current,
        containerStyle: { "border": null, "width": "500px", "height": "150%", "position": "absolute", "transform": "translateY(-17%) translateX(48%)", right: 0 },
    });
    let renderer1 = fullScreenRenderer1.getRenderer();
    let renderWindow1 = fullScreenRenderer1.getRenderWindow();
    const planeSource = vtkPlaneSource.newInstance({
        xResolution: 1,
        yResolution: scalar.length - 1,
    });
    const mapper1 = vtkMapper.newInstance();
    const scalarBars = vtkActor.newInstance();
    mapper1.setInputConnection(planeSource.getOutputPort());
    scalarBars.setMapper(mapper1);
    let polydata = mapper1.getInputData().getState()
    let pointScalar = [];
    for (let i = 0; i < scalar.length; i++) {
        pointScalar.push(scalar[i], scalar[i]);
    }
    polydata.pointData = {
        vtkClass: 'vtkDataSetAttributes',
        activeScalars: 0,
        arrays: [{
            data: {
                vtkClass: 'vtkDataArray',
                name: 'pointScalars',
                dataType: 'Float32Array',
                values: pointScalar,
            },
        }],
    }
    mapper1.setInputData(vtk(polydata));
    mapper1.setScalarRange(scalar[0], scalar[scalar.length - 1])
    if (mode !== "DEFAULT") {
        const lut = vtkColorTransferFunction.newInstance();
        const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
        lut.applyColorMap(preset);  //应用ColorMap
        lut.updateRange();
        mapper1.setLookupTable(lut)
        model.lookupTable1 = lut;
    }
    renderer1.addActor(scalarBars);
    model.renderWindow1 = renderWindow1;
    const interactorStyle1 = vtkInteractorStyleManipulator.newInstance();
    fullScreenRenderer1.getInteractor().setInteractorStyle(interactorStyle1);
    renderer1.resetCamera();
    renderWindow1.render();
}

// 坐标
export const Axis = (model) => {

    function addColor(ds, r, g, b) {
        const size = ds.getPoints().getData().length;
        const rgbArray = new Uint8Array(size);
        let offset = 0;

        while (offset < size) {
            rgbArray[offset++] = r;
            rgbArray[offset++] = g;
            rgbArray[offset++] = b;
        }

        ds.getPointData().setScalars(
            vtkDataArray.newInstance({
                name: 'color',
                numberOfComponents: 3,
                values: rgbArray,
            })
        );
    }
    const axisX = ArrowSource.newInstance(
        {
            direction: [1.0, 0.0, 0.0],
            tipResolution: 50,
            tipRadius: 0.1,
            tipLength: 0.2,
            shaftResolution: 60,
            shaftRadius: 0.03,
            invert: false,
        }).getOutputData();;
    const Xbounds = axisX.getPoints().getBounds();
    const Xcenter = [
        -Xbounds[0],
        -(Xbounds[2] + Xbounds[3]) * 0.5,
        -(Xbounds[4] + Xbounds[5]) * 0.5,
    ];
    vtkMatrixBuilder
        .buildFromDegree()
        .translate(...Xcenter)
        .apply(axisX.getPoints().getData());
    addColor(axisX, 255, 0, 0);
    const axisY = ArrowSource.newInstance(
        {
            direction: [0.0, 1.0, 0.0],
            tipResolution: 50,
            tipRadius: 0.1,
            tipLength: 0.2,
            shaftResolution: 60,
            shaftRadius: 0.03,
            invert: false,
        }).getOutputData();;
    const Ybounds = axisY.getPoints().getBounds();
    const Ycenter = [
        -(Ybounds[0] + Ybounds[1]) * 0.5,
        -Ybounds[2],
        -(Ybounds[4] + Ybounds[5]) * 0.5,
    ];
    vtkMatrixBuilder
        .buildFromDegree()
        .translate(...Ycenter)
        .apply(axisY.getPoints().getData());
    addColor(axisY, 255, 255, 0);
    const axisZ = ArrowSource.newInstance({
        direction: [0.0, 0.0, 1.0],
        tipResolution: 50,
        tipRadius: 0.1,
        tipLength: 0.2,
        shaftResolution: 60,
        shaftRadius: 0.03,
        invert: false,
    }).getOutputData();;
    const Zbounds = axisZ.getPoints().getBounds();
    const Zcenter = [
        -(Zbounds[0] + Zbounds[1]) * 0.5,
        -(Zbounds[2] + Zbounds[3]) * 0.5,
        -Zbounds[4],
    ];
    vtkMatrixBuilder
        .buildFromDegree()
        .translate(...Zcenter)
        .apply(axisZ.getPoints().getData());
    addColor(axisZ, 0, 128, 0);
    const source = vtkAppendPolyData.newInstance();
    source.setInputData(axisX);
    source.addInputData(axisY);
    source.addInputData(axisZ);
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(source.getOutputPort());
    const axis = vtkActor.newInstance();
    axis.setMapper(mapper);
    const orientationWidget = vtkOrientationMarkerWidget.newInstance({
        actor: axis,
        interactor: model.renderWindow.getInteractor(),
    });
    model.orientationWidget = orientationWidget;
    orientationWidget.setViewportCorner(
        vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
    );
    orientationWidget.setViewportSize(0.15);
    orientationWidget.setMinPixelSize(100);
    orientationWidget.setMaxPixelSize(300);
};

// 修改鼠标默认事件
export const reassignManipulators = (model) => {
    if (model.interactorStyle) {
        model.interactorStyle.removeAllMouseManipulators();
        Object.keys(model.uiComponents).forEach((keyName) => {
            const klass = model.manipulatorFactory[model.uiComponents[keyName].manipName];
            if (klass) {
                const manipulator = klass.newInstance();
                manipulator.setButton(model.selectMap[keyName].button);
                if (model.selectMap[keyName].scrollEnabled !== undefined) {
                    manipulator.setScrollEnabled(model.selectMap[keyName].scrollEnabled);
                }
                if (model.selectMap[keyName].dragEnabled !== undefined) {
                    manipulator.setDragEnabled(model.selectMap[keyName].dragEnabled);
                }
                model.interactorStyle.addMouseManipulator(manipulator);
            }
        });
        // Always add gesture
        model.interactorStyle.addGestureManipulator(
            vtkGestureCameraManipulator.newInstance()
        );
    }
};

// 改变显示模式
export const changeManipulators = (model, opt, keydown, useLight, useAxis, scalar, mode, container1, lut, inputValue, polydata1, polydata2, min, max, Scalar) => {
    // 显示实体单元、网格或点
    if (keydown === "RESET") {
        if (model.renderer) {
            model.renderer.resetCamera();
            model.renderWindow.render();
        }
    } else if (keydown === "LINE") {
        if (model.renderer) {
            let ac = model.renderer.getActors();
            ac.forEach((anActor) => {
                anActor.getProperty().setRepresentationToWireframe();
            });
            model.renderWindow.render();
        }
    } else if (keydown === "POLY") {
        if (model.renderer) {
            let ac = model.renderer.getActors();
            ac.forEach((anActor) => {
                anActor.getProperty().setRepresentationToSurface();
            });
            model.renderWindow.render();
        }
    } else if (keydown === "POINT") {
        if (model.renderer) {
            let ac = model.renderer.getActors();
            ac.forEach((anActor) => {
                anActor.getProperty().setRepresentationToPoints();
            });
            model.renderWindow.render();
        }
    };
    if (Scalar === true || Scalar === null) {
        if (container1.current.childElementCount >= 1) {
            container1.current.innerHTML = null;
            scalarBar(model, scalar, mode, container1);

        } else {
            scalarBar(model, scalar, mode, container1);
        }

    } else if (Scalar === false) {

    }

    // 灯光
    if (useLight) {
        if (model.renderer) {
            const openGLRenderWindow = model.interactor.getView();
            const hardwareSelector = vtkOpenGLHardwareSelector.newInstance({
                captureZValues: true,
            });
            hardwareSelector.setFieldAssociation(
                FieldAssociations.FIELD_ASSOCIATION_POINTS
            );
            hardwareSelector.attach(openGLRenderWindow, model.renderer);
            // ----------------------------------------------------------------------------
            // Create Picking pointer
            // ----------------------------------------------------------------------------
            let container = document.querySelectorAll(".vtk-container")[0];
            const Light = vtkLight.newInstance({
                color: [1, 1, 1],
                focalPoint: [0, 0, 0],
                positional: false,
                exponent: 1,
                coneAngle: 30,
                attenuationValues: [1, 0, 0],
                transformMatrix: null,
                lightType: 'HeadLight',
                shadowAttenuation: 1,
                direction: [0, 0, 0],
            })
            model.renderer.addLight(Light);
            model.Light = Light;
            // ----------------------------------------------------------------------------
            // Create Mouse listener for picking on mouse move
            // ----------------------------------------------------------------------------
            function eventToWindowXY(event) {
                // We know we are full screen => window.innerXXX
                // Otherwise we can use pixel device ratio or else...
                const { clientX, clientY } = event;
                let rec = container.getBoundingClientRect();
                const [width, height] = openGLRenderWindow.getSize();
                const x = Math.round((width * clientX) / container.clientWidth - rec.left);
                const y = Math.round(height * (1 - clientY / container.clientHeight) + rec.top);
                // Need to flip Y
                return [x, y];
            }
            // ----------------------------------------------------------------------------
            // const WHITE = [1, 1, 1];
            // const GREEN = [0.1, 0.8, 0.1];
            let needGlyphCleanup = false;
            let lastProcessedActor = null;
            const updateWorldPosition = (worldPosition) => {
                Light.setPosition(worldPosition);
                model.renderWindow.render();
            };
            function processSelections(selections) {
                if (!selections || selections.length === 0) {
                    lastProcessedActor = null;
                    return;
                }
                const { worldPosition, prop } = selections[0].getProperties();
                if (lastProcessedActor === prop) {
                    // Skip render call when nothing change
                    updateWorldPosition(worldPosition);
                    return;
                }
                lastProcessedActor = prop;
                // Make the picked actor green
                // prop.getProperty().setColor(...GREEN);
                // We hit the glyph, let's ruler the picked glyph
                if (needGlyphCleanup) {
                    needGlyphCleanup = false;
                }
                // Update picture for the user so we can see the green one
                updateWorldPosition(worldPosition);
            }
            // ----------------------------------------------------------------------------
            function pickOnMouseEvent(event) {
                if (model.interactor.isAnimating()) {
                    // We should not do picking when interacting with the scene
                    return;
                }
                const [x, y] = eventToWindowXY(event);
                hardwareSelector.setArea(x, y, x, y);
                hardwareSelector.releasePixBuffers();

                if (hardwareSelector.captureBuffers()) {
                    processSelections(hardwareSelector.generateSelection(x, y, x, y));
                } else {
                    processSelections(null);
                }
            }
            function throttle(callback, delay) {
                let isThrottled = false;
                let argsToUse = null;
                function next() {
                    isThrottled = false;
                    if (argsToUse !== null) {
                        wrapper(...argsToUse); // eslint-disable-line
                        argsToUse = null;
                    }
                }
                function wrapper(...args) {
                    if (isThrottled) {
                        argsToUse = args;
                        return;
                    }
                    isThrottled = true;
                    callback(...args);
                    setTimeout(next, delay);
                }
                return wrapper;
            }
            const throttleMouseHandler = throttle(pickOnMouseEvent, 100);
            container.addEventListener('mousemove', throttleMouseHandler);
        }
    } else {
        if (model.renderer) {
            model.renderer.removeLight(model.Light);
            model.renderWindow.render();
            model.Light = null;
        }
    }

    // 显示坐标系
    if (useAxis === true) {
        if (model.orientationWidget) {
            model.orientationWidget.setEnabled(true);
            model.renderWindow.render();
        }
    } else {
        if (model.orientationWidget) {
            model.orientationWidget.setEnabled(false);
            model.renderWindow.render();
        }
    };
    // 改变鼠标事件
    if (opt === "ROTATE") {
        if (model.uiComponents) {
            model.uiComponents["leftButton"] = { manipName: "Rotate" };
            model.uiComponents["scrollMiddleButton"] = { manipName: "Zoom" };
        }
    } else if (opt === "ROLL") {
        if (model.uiComponents) {
            model.uiComponents["leftButton"] = { manipName: "Roll" };
            model.uiComponents["scrollMiddleButton"] = { manipName: "Zoom" };
        }
    } else if (opt === "PAN") {
        if (model.uiComponents) {
            model.uiComponents["leftButton"] = { manipName: "Pan" };
            model.uiComponents["scrollMiddleButton"] = { manipName: "Zoom" };
        }
    } else if (opt === "ZOOM") {
        if (model.uiComponents) {
            model.uiComponents["scrollMiddleButton"] = { manipName: "Zoom" };
        }
    } else {
        if (model.uiComponents) {
            model.uiComponents["leftButton"] = { manipName: "None" };
            model.uiComponents["scrollMiddleButton"] = { manipName: "Zoom" };
        }
    };
    reassignManipulators(model);
    // model.renderWindow.render();
}

// 显示边框
export const showBounds = (bounds, model, container, polydata, theme) => {
    if (bounds === true) {
        if (document.querySelector('.textCanvas')) {
            container.current.children[0].removeChild(document.querySelector('.textCanvas'))
            model.renderer.removeActor(model.bounds);
        }
        // model.interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
        const textCanvas = document.createElement('canvas');
        textCanvas.style.position = "absuloat";
        textCanvas.classList.add(style.container, 'textCanvas');
        container.current.children[0].appendChild(textCanvas);
        let dims = document.querySelector(".vtk-container").getBoundingClientRect();
        textCanvas.setAttribute('width', dims.width * window.devicePixelRatio);
        textCanvas.setAttribute('height', dims.height * window.devicePixelRatio);
        let textCtx = textCanvas.getContext('2d');
        const outline = vtkOutlineFilter.newInstance();
        outline.setInputData(polydata);
        const mapper = vtkMapper.newInstance();
        mapper.setInputConnection(outline.getOutputPort());
        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);
        actor.getProperty().set({ lineWidth: 1 });
        model.bounds = actor;
        const psMapper = vtkPixelSpaceCallbackMapper.newInstance();
        psMapper.setInputConnection(outline.getOutputPort());
        psMapper.setCallback((coordsList) => {
            textCtx.clearRect(0, 0, dims.width * window.devicePixelRatio, dims.height * window.devicePixelRatio);
            coordsList.forEach((xy, idx) => {
                textCtx.font = `${12 * window.pixelRatio}px serif`;
                textCtx.fillStyle = theme
                textCtx.textAlign = 'center';
                textCtx.textBaseline = 'middle';
                textCtx.fillText(`(${xy})`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
            });
        });

        const textActor = vtkActor.newInstance();
        textActor.setMapper(psMapper);
        model.renderer.addActor(textActor);
        model.renderer.addActor(actor);
    } else {
        if (document.querySelector('.textCanvas')) {
            container.current.children[0].removeChild(document.querySelector('.textCanvas'))
            model.renderer.removeActor(model.bounds);
        }
    }
}

// 显示坐标刻度
export const showBoundRuler = (ruler, model, container, polydata, props, dimensional, theme, xAxis, yAxis, className, xMin, xMax, yMin, yMax, zMin, zMax, imgIndex) => {
    let actColor;
    if (theme === "#fff") {
        actColor = [1.0, 1.0, 1.0]
    } else {
        actColor = [0, 0, 0]
    }
    if (ruler === true && dimensional === 2) {
        model.activeCamera.set(model.activeCameraState);
        // model.interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
        const textCanvas = document.createElement('canvas');
        textCanvas.style.position = "absuloat";
        textCanvas.classList.add(className);
        container.current.children[0].appendChild(textCanvas);
        let dims = document.querySelector(".vtk-container").getBoundingClientRect();
        model.dims = dims;
        textCanvas.setAttribute('width', dims.width * window.devicePixelRatio);
        textCanvas.setAttribute('height', dims.height * window.devicePixelRatio);
        let textCtx = textCanvas.getContext('2d');
        model.textCtx = textCtx;
        const outline = vtkOutlineFilter.newInstance();
        outline.setInputData(polydata);
        let bound = outline.getOutputData().getState().points.values;
        let num, len;
        if (props.datatype === "数据去趋势") {
            num = 6;
            len = Math.abs(bound[3] - bound[0])
        } else {
            if (yAxis.length > 5 * xAxis.length) {
                num = 2;
                len = Math.abs(bound[7] - bound[1])
            } else {
                num = 11;
                len = Math.abs(bound[3] - bound[0])
            }
        }
        let ratio = Math.round(yAxis.length / xAxis.length * (num - 1));
        const cubeSource1 = vtkCubeSource.newInstance({
            xLength: Math.abs(bound[3] - bound[0]),
            yLength: len * 0.002,
            zLength: len * 0.002,
            center: [(bound[3] + bound[0]) / 2, bound[1], 0.0],
        });
        const lineX = cubeSource1.getOutputData();
        const map1 = vtkMapper.newInstance();
        const act1 = vtkActor.newInstance();
        const sourceData1 = vtkAppendPolyData.newInstance();
        sourceData1.setInputData(lineX);
        // sourceData1.addInputData(coneX);
        map1.setInputConnection(sourceData1.getOutputPort());
        act1.setMapper(map1);
        model.ruler1 = act1;
        const cubeSource2 = vtkCubeSource.newInstance({
            xLength: len * 0.002,
            yLength: bound[7] - bound[1],
            zLength: len * 0.002,
            center: [bound[0], (bound[7] + bound[1]) / 2, 0.0],
        });
        const lineY = cubeSource2.getOutputData();
        const map2 = vtkMapper.newInstance();
        const act2 = vtkActor.newInstance();
        const sourceData2 = vtkAppendPolyData.newInstance();
        sourceData2.setInputData(lineY);
        map2.setInputConnection(sourceData2.getOutputPort());
        act2.setMapper(map2);
        model.ruler2 = act2;

        // ruler
        let rulerPoints = [];
        const rulerX = [];
        for (let i = 0; i < num; i++) {
            rulerX.push({
                xLength: len * 0.001,
                yLength: len * 0.025,
                zLength: len * 0.001,
                center: [bound[0] + (bound[3] - bound[0]) * i / (num - 1), bound[4] - len * 0.0125, 0],
            });
            rulerPoints.push(bound[0] + (bound[3] - bound[0]) * i / (num - 1), bound[4] - len * 0.08, 0);
        }
        const sourceDataRulerX = vtkAppendPolyData.newInstance();
        sourceDataRulerX.setInputData(vtk({
            vtkClass: 'vtkPolyData',
        }));
        for (let i = 0; i < rulerX.length; i++) {
            const cubeSourceRulerX = vtkCubeSource.newInstance(rulerX[i]);
            const x_ruler = cubeSourceRulerX.getOutputData();
            sourceDataRulerX.addInputData(x_ruler);
        }
        const rulerXmapper = vtkMapper.newInstance();
        const rulerXactor = vtkActor.newInstance();
        rulerXmapper.setInputConnection(sourceDataRulerX.getOutputPort());
        rulerXactor.setMapper(rulerXmapper);
        model.rulerXactor = rulerXactor;
        model.rulerPoints = rulerPoints;
        model.rulerX = rulerX;
        model.renderer.addActor(model.rulerXactor);

        const rulerY = [];
        for (let i = 0; i <= ratio; i++) {
            rulerY.push({
                xLength: len * 0.025,
                yLength: len * 0.001,
                zLength: len * 0.001,
                center: [bound[0] - len * 0.0125, bound[1] + (bound[7] - bound[1]) * i / ratio, 0],
            })
            model.rulerPoints.push(bound[0] - len * 0.08, bound[1] + (bound[7] - bound[1]) * i / ratio, 0);
        }
        const sourceDataRulerY = vtkAppendPolyData.newInstance();
        sourceDataRulerY.setInputData(vtk({
            vtkClass: 'vtkPolyData',
        }));
        for (let i = 0; i < rulerY.length; i++) {
            const cubeSourceRulerY = vtkCubeSource.newInstance(rulerY[i]);
            const x_ruler = cubeSourceRulerY.getOutputData();
            sourceDataRulerY.addInputData(x_ruler);
        }
        const rulerYmapper = vtkMapper.newInstance();
        const rulerYactor = vtkActor.newInstance();
        rulerYmapper.setInputConnection(sourceDataRulerY.getOutputPort());
        rulerYactor.setMapper(rulerYmapper);
        model.rulerYactor = rulerYactor;
        model.rulerY = rulerY;

        model.renderer.addActor(model.rulerYactor);
        const psMapper = vtkPixelSpaceCallbackMapper.newInstance();
        psMapper.setInputData(vtk({
            vtkClass: 'vtkPolyData',
            points: {
                vtkClass: 'vtkPoints',
                dataType: 'Float32Array',
                numberOfComponents: 3,
                values: model.rulerPoints,
            },
        }));
        model.ruler1.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler2.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.rulerXactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.rulerYactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        let yAxisRe = JSON.parse(JSON.stringify(yAxis)).reverse();
        let fixed = (num) => {
            num = Number(num);
            let num_c = Math.abs(num);
            if (String(num).indexOf("e-") > -1) {
                let d = String(num);
                let s = d.split("e-");
                let suffix = s[1];
                return Number(s[0]).toFixed(1) + "e-" + suffix
            } else if (String(num).indexOf("e") > -1) {
                let d = String(num);
                let s = d.split("e");
                let suffix = s[1];
                return Number(s[0]).toFixed(1) + "e" + suffix
            } else {
                let str = String(num_c);
                if (str.indexOf(".") > -1) {
                    let len = str.split(".")[1].length;
                    if (len > 6 && num_c < 0.00001) {
                        return num.toFixed(6)
                    } else if (len > 5 && num_c >= 0.00001 && num_c < 0.0001) {
                        return num.toFixed(5)
                    } else if (len > 4 && num_c >= 0.0001 && num_c < 0.001) {
                        return num.toFixed(4)
                    } else if (len > 3 && num_c >= 0.001 && num_c < 0.01) {
                        return num.toFixed(3)
                    } else if (len > 2 && num_c >= 0.01 && num_c < 0.1) {
                        return num.toFixed(2)
                    } else if (len > 1 && num_c >= 0.1) {
                        return num.toFixed(1)
                    } else {
                        return num
                    }
                } else {
                    return num
                }
            }
        };
        psMapper.setCallback((coordsList) => {
            if (document.querySelector(".vtk-container")) {
                let dims = document.querySelector(".vtk-container").getBoundingClientRect();
                textCtx.clearRect(0, 0, dims.width * window.devicePixelRatio, dims.height * window.devicePixelRatio);
                coordsList.forEach((xy, idx) => {
                    textCtx.font = `${14 * window.pixelRatio}px serif`;
                    textCtx.fillStyle = theme
                    textCtx.textAlign = 'center';
                    textCtx.textBaseline = 'middle';
                    if (["坐标投影", "重力异常计算", "重力数据求偏导", "重力数据延拓", "三维断层模型正演", "边缘识别", "曲化平", "数据扩边", "最小曲率补空白",
                        "六面体模型重力异常正演", "六面体复杂模型构建及重力异常正演", "球型棱柱体模型重力异常正演", "球型棱柱体模型构建及重力异常正演", "四面体模型单元正演",
                        "数据去趋势", "数据网格化", "磁场方向导数求取", "磁场空间延拓", "磁化极", "磁场模型正演"].includes(props.datatype)) {
                        if (idx < num) {
                            //x
                            textCtx.fillText(`${fixed(xAxis[(idx * (xAxis.length - 1) / (num - 1)).toFixed(0)])}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                            //图片名位置
                            let middleX, textY;
                            if (num === 6) {
                                middleX = (coordsList[2][0] + coordsList[3][0]) / 2;
                                textY = (coordsList[11][1] - coordsList[6][1]) * 0.1;
                            } else if (num === 2) {
                                middleX = (coordsList[0][0] + coordsList[1][0]) / 2;
                                textY = (coordsList[3][1] - coordsList[2][1]) * 0.1;
                            } else if (num === 11) {
                                middleX = coordsList[5][0];
                                textY = (coordsList[21][1] - coordsList[12][1]) * 0.1;
                            };
                            if (props.datatype === "数据去趋势") {
                                textCtx.fillText(imgIndex === 0 ? "原始数据" : (imgIndex === 1 ? "区域异常" : "局部异常"), middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "重力数据求偏导") {
                                textCtx.fillText("重力梯度等值线分布图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "重力数据延拓") {
                                textCtx.fillText("重力数据延拓效果图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "重力异常计算") {
                                textCtx.fillText(imgIndex === 0 ? "自由空间异常" : "布格异常", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "边缘识别") {
                                textCtx.fillText("边缘识别效果图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "磁场方向导数求取") {
                                textCtx.fillText("磁场导数等值线分布图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "磁场空间延拓") {
                                textCtx.fillText("此数据延拓效果图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "磁化极") {
                                textCtx.fillText("化级结果图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "曲化平") {
                                textCtx.fillText("曲化平效果图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "三维断层模型正演") {
                                textCtx.fillText("三维断层模型重力异常正演", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "六面体模型重力异常正演") {
                                textCtx.fillText(imgIndex === 0 ? "重力异常等值线图" : "带噪声的重力异常", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "六面体复杂模型构建及重力异常正演") {
                                textCtx.fillText("重力异常等值线图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "球型棱柱体模型重力异常正演") {
                                textCtx.fillText(imgIndex === 0 ? "重力异常等值线图" : "带噪声的重力异常", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "球型棱柱体模型构建及重力异常正演") {
                                textCtx.fillText("重力异常等值线图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "磁场模型正演") {
                                textCtx.fillText("磁异常等值线图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "四面体模型单元正演") {
                                textCtx.fillText("重力异常等值线图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "数据网格化") {
                                textCtx.fillText("网格化数据", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "数据扩边") {
                                textCtx.fillText("数据扩边效果图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "最小曲率补空白") {
                                textCtx.fillText("数据补空白效果图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            }
                        } else {
                            //y
                            textCtx.fillText(`${fixed(yAxis[((idx - num) * (yAxis.length - 1) / ratio).toFixed(0)])}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    } else {
                        if (idx < num) {
                            textCtx.fillText(`${fixed(xAxis[(idx * (xAxis.length - 1) / (num - 1)).toFixed(0)])}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else {
                            textCtx.fillText(`${fixed(yAxisRe[((idx - num) * (yAxis.length - 1) / ratio).toFixed(0)])}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        };
                        if (["重力观测数据反演（多约束反演）", "重力观测数据反演（三维正则，参考模型约束）", "重力观测数据反演（参考模型-全变分约束）", "MCMC反演", "MCMC反演（参考模型约束）", "欧拉反演(移动窗)", "欧拉反演(扩展窗)"].includes(props.datatype)) {
                            let middleX, textY;
                            if (num === 6) {
                                middleX = (coordsList[2][0] + coordsList[3][0]) / 2;
                                textY = (coordsList[11][1] - coordsList[6][1]) * 0.1;
                            } else if (num === 2) {
                                middleX = (coordsList[0][0] + coordsList[1][0]) / 2;
                                textY = (coordsList[3][1] - coordsList[2][1]) * 0.1;
                            } else if (num === 11) {
                                middleX = coordsList[5][0];
                                textY = (coordsList[21][1] - coordsList[12][1]) * 0.1;
                            };
                            if (props.datatype === "重力观测数据反演（多约束反演）" || props.datatype === "重力观测数据反演（三维正则，参考模型约束）" || props.datatype === "重力观测数据反演（参考模型-全变分约束）" || props.datatype === "MCMC反演" || props.datatype === "MCMC反演（参考模型约束）") {
                                textCtx.fillText(imgIndex === 0 ? "重力预测值" : (imgIndex === 1 ? "数据残差" : ""), middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "欧拉反演(移动窗)") {
                                textCtx.fillText("欧拉反演(移动窗)效果图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            } else if (props.datatype === "欧拉反演(扩展窗)") {
                                textCtx.fillText("欧拉反演(扩展窗)效果图", middleX, dims.height * window.devicePixelRatio - coordsList[0][1] + textY);
                            }
                        }
                    };
                });
            }
        });
        const textActor = vtkActor.newInstance();
        textActor.setMapper(psMapper);
        model.textActor = textActor;
        model.renderer.addActor(model.textActor);
        model.renderer.addActor(model.ruler1);
        model.renderer.addActor(model.ruler2);
    } else if (ruler === true && dimensional === 3) {
        // model.activeCamera.set(model.activeCameraState);
        if (document.querySelector('.textCanvas')) {
            container.current.children[0].removeChild(document.querySelector('.textCanvas'))
        }
        // model.interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
        const textCanvas = document.createElement('canvas');
        textCanvas.style.position = "absuloat";
        textCanvas.classList.add('textCanvas');
        let dims = document.querySelector(".vtk-container").getBoundingClientRect();
        // window.devicePixelRatio=1.5;
        textCanvas.setAttribute('width', dims.width * window.devicePixelRatio);
        textCanvas.setAttribute('height', dims.height * window.devicePixelRatio);
        container.current.children[0].appendChild(textCanvas);
        let textCtx = textCanvas.getContext('2d');
        model.textCtx = textCtx;
        const outline = vtkOutlineFilter.newInstance();
        outline.setInputData(polydata);
        let bound = outline.getOutputData().getState().points.values;
        let ratioy = Math.round((bound[7] - bound[1]) / (bound[3] - bound[0]) * 10);
        let ratioz = Math.round((bound[14] - bound[2]) / (bound[3] - bound[0]) * 10);
        let linewX = Math.abs(bound[3] - bound[0]);
        let linewY = Math.abs(bound[7] - bound[1]);
        let linewZ = Math.abs(bound[14] - bound[2]);
        let xMulti = xMax && xMin ? (xMax - xMin) / linewX : undefined;
        let yMulti = yMax && yMin ? (yMax - yMin) / linewY : undefined;
        let zMulti = zMax && zMin ? (zMax - zMin) / linewZ : undefined;
        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        if (model.axis1x === undefined) {
            const cubeSourceXL1 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [(bound[15] - bound[12]) * 0.55 + bound[12], bound[1], bound[14] + (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineXL1 = cubeSourceXL1.getOutputData();
            const cubeSourceXL3 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [(bound[15] - bound[12]) * 0.55 + bound[12], bound[7] + ((bound[7] - bound[1]) * 1 / ratioy), bound[8]],
            });
            const lineXL3 = cubeSourceXL3.getOutputData();
            const map1 = vtkMapper.newInstance();
            const act1 = vtkActor.newInstance();
            const sourceData1 = vtkAppendPolyData.newInstance();
            sourceData1.setInputData(lineXL1);
            sourceData1.addInputData(lineXL3);
            map1.setInputConnection(sourceData1.getOutputPort());
            act1.setMapper(map1);
            model.axis1x = act1;
        }
        if (model.axis1y === undefined) {
            const cubeSource2s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[0], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[14] + (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineYs = cubeSource2s.getOutputData();
            const cubeSource2c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[3] + (bound[3] - bound[0]) * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[2]],
            });
            const lineYc = cubeSource2c.getOutputData();

            const map2 = vtkMapper.newInstance();
            const act2 = vtkActor.newInstance();
            const sourceData2 = vtkAppendPolyData.newInstance();
            // sourceData2.setInputData(lineY);
            sourceData2.setInputData(lineYs);
            sourceData2.addInputData(lineYc);
            // sourceData2.addInputData(coneY);
            map2.setInputConnection(sourceData2.getOutputPort());
            act2.setMapper(map2);
            model.axis1y = act2;
        }
        if (model.axis1z === undefined) {
            const cubeSource3s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[0], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2],
            });
            const lineZs = cubeSource3s.getOutputData();
            const cubeSource3c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[3] + (bound[3] - bound[0]) * 0.1, bound[1], bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2],
            });
            const lineZc = cubeSource3c.getOutputData();
            const map3 = vtkMapper.newInstance();
            const act3 = vtkActor.newInstance();
            const sourceData3 = vtkAppendPolyData.newInstance();
            // sourceData3.setInputData(lineZ);
            sourceData3.setInputData(lineZs);
            sourceData3.addInputData(lineZc);
            // sourceData3.addInputData(coneZ);
            map3.setInputConnection(sourceData3.getOutputPort());
            act3.setMapper(map3);
            model.axis1z = act3;
        }
        if (model.axis2x === undefined) {
            const cubeSourceXL1 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.55, bound[1], bound[14] + (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineXL1 = cubeSourceXL1.getOutputData();
            const cubeSourceXL3 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.55, bound[7] + ((bound[7] - bound[1]) * 1 / ratioy), bound[8]],
            });
            const lineXL3 = cubeSourceXL3.getOutputData();
            const map1 = vtkMapper.newInstance();
            const act1 = vtkActor.newInstance();
            const sourceData1 = vtkAppendPolyData.newInstance();
            sourceData1.setInputData(lineXL1);
            sourceData1.addInputData(lineXL3);
            map1.setInputConnection(sourceData1.getOutputPort());
            act1.setMapper(map1);
            model.axis2x = act1;
        }
        if (model.axis2y === undefined) {
            const cubeSource2s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[3], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[14] + (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineYs = cubeSource2s.getOutputData();
            const cubeSource2c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[0] - (bound[3] - bound[0]) * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[2]],
            });
            const lineYc = cubeSource2c.getOutputData();
            const map2 = vtkMapper.newInstance();
            const act2 = vtkActor.newInstance();
            const sourceData2 = vtkAppendPolyData.newInstance();
            // sourceData2.setInputData(lineY);
            sourceData2.setInputData(lineYs);
            sourceData2.addInputData(lineYc);
            // sourceData2.addInputData(coneY);
            map2.setInputConnection(sourceData2.getOutputPort());
            act2.setMapper(map2);
            model.axis2y = act2;
        }
        if (model.axis2z === undefined) {
            const cubeSource3s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[3], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2],
            });
            const lineZs = cubeSource3s.getOutputData();
            const cubeSource3c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[0] - (bound[3] - bound[0]) * 0.1, bound[1], bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2],
            });
            const lineZc = cubeSource3c.getOutputData();
            const map3 = vtkMapper.newInstance();
            const act3 = vtkActor.newInstance();
            const sourceData3 = vtkAppendPolyData.newInstance();
            // sourceData3.setInputData(lineZ);
            sourceData3.setInputData(lineZs);
            sourceData3.addInputData(lineZc);
            // sourceData3.addInputData(coneZ);
            map3.setInputConnection(sourceData3.getOutputPort());
            act3.setMapper(map3);
            model.axis2z = act3;
        }
        if (model.axis3x === undefined) {
            const cubeSourceXL1 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.55, bound[1], bound[2] - (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineXL1 = cubeSourceXL1.getOutputData();
            const cubeSourceXL3 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.55, bound[7] + ((bound[7] - bound[1]) * 1 / ratioy), bound[14]],
            });
            const lineXL3 = cubeSourceXL3.getOutputData();
            const map1 = vtkMapper.newInstance();
            const act1 = vtkActor.newInstance();
            const sourceData1 = vtkAppendPolyData.newInstance();
            sourceData1.setInputData(lineXL1);
            sourceData1.addInputData(lineXL3);
            map1.setInputConnection(sourceData1.getOutputPort());
            act1.setMapper(map1);
            model.axis3x = act1;
        }
        if (model.axis3y === undefined) {
            const cubeSource2s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[3], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[2] - (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineYs = cubeSource2s.getOutputData();
            const cubeSource2c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[0] - (bound[3] - bound[0]) * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[14]],
            });
            const lineYc = cubeSource2c.getOutputData();
            const map2 = vtkMapper.newInstance();
            const act2 = vtkActor.newInstance();
            const sourceData2 = vtkAppendPolyData.newInstance();
            // sourceData2.setInputData(lineY);
            sourceData2.setInputData(lineYs);
            sourceData2.addInputData(lineYc);
            // sourceData2.addInputData(coneY);
            map2.setInputConnection(sourceData2.getOutputPort());
            act2.setMapper(map2);
            model.axis3y = act2;
        }
        if (model.axis3z === undefined) {
            const cubeSource3s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[3], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy), bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2],
            });
            const lineZs = cubeSource3s.getOutputData();
            const cubeSource3c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[0] - (bound[3] - bound[0]) * 0.1, bound[1], bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2],
            });
            const lineZc = cubeSource3c.getOutputData();
            const map3 = vtkMapper.newInstance();
            const act3 = vtkActor.newInstance();
            const sourceData3 = vtkAppendPolyData.newInstance();
            // sourceData3.setInputData(lineZ);
            sourceData3.setInputData(lineZs);
            sourceData3.addInputData(lineZc);
            // sourceData3.addInputData(coneZ);
            map3.setInputConnection(sourceData3.getOutputPort());
            act3.setMapper(map3);
            model.axis3z = act3;
        }
        if (model.axis4x === undefined) {
            const cubeSourceXL1 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.45, bound[1], bound[2] - (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineXL1 = cubeSourceXL1.getOutputData();
            const cubeSourceXL3 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.45, bound[7] + ((bound[7] - bound[1]) * 1 / ratioy), bound[14]],
            });
            const lineXL3 = cubeSourceXL3.getOutputData();
            const map1 = vtkMapper.newInstance();
            const act1 = vtkActor.newInstance();
            const sourceData1 = vtkAppendPolyData.newInstance();
            sourceData1.setInputData(lineXL1);
            sourceData1.addInputData(lineXL3);
            map1.setInputConnection(sourceData1.getOutputPort());
            act1.setMapper(map1);
            model.axis4x = act1;
        }
        if (model.axis4y === undefined) {
            const cubeSource2s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[0], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[2] - (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineYs = cubeSource2s.getOutputData();
            const cubeSource2c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[3] + (bound[3] - bound[0]) * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[14]],
            });
            const lineYc = cubeSource2c.getOutputData();
            const map2 = vtkMapper.newInstance();
            const act2 = vtkActor.newInstance();
            const sourceData2 = vtkAppendPolyData.newInstance();
            // sourceData2.setInputData(lineY);
            sourceData2.setInputData(lineYs);
            sourceData2.addInputData(lineYc);
            // sourceData2.addInputData(coneY);
            map2.setInputConnection(sourceData2.getOutputPort());
            act2.setMapper(map2);
            model.axis4y = act2;
        }
        if (model.axis4z === undefined) {
            const cubeSource3s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[0], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy), bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2],
            });
            const lineZs = cubeSource3s.getOutputData();
            const cubeSource3c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[3] + (bound[3] - bound[0]) * 0.1, bound[1], bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2],
            });
            const lineZc = cubeSource3c.getOutputData();
            const map3 = vtkMapper.newInstance();
            const act3 = vtkActor.newInstance();
            const sourceData3 = vtkAppendPolyData.newInstance();
            // sourceData3.setInputData(lineZ);
            sourceData3.setInputData(lineZs);
            sourceData3.addInputData(lineZc);
            // sourceData3.addInputData(coneZ);
            map3.setInputConnection(sourceData3.getOutputPort());
            act3.setMapper(map3);
            model.axis4z = act3;
        }
        if (model.axis5x === undefined) {
            const cubeSourceXL1 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [(bound[15] - bound[12]) * 0.55 + bound[12], bound[7], bound[14] + (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineXL1 = cubeSourceXL1.getOutputData();
            const cubeSourceXL3 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [(bound[15] - bound[12]) * 0.55 + bound[12], bound[1] - ((bound[7] - bound[1]) * 1 / ratioy), bound[8]],
            });
            const lineXL3 = cubeSourceXL3.getOutputData();
            const map1 = vtkMapper.newInstance();
            const act1 = vtkActor.newInstance();
            const sourceData1 = vtkAppendPolyData.newInstance();
            sourceData1.setInputData(lineXL1);
            sourceData1.addInputData(lineXL3);
            map1.setInputConnection(sourceData1.getOutputPort());
            act1.setMapper(map1);
            model.axis5x = act1;
        }
        if (model.axis5y === undefined) {
            const cubeSource2s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[0], bound[1] + (bound[7] - bound[1]) * (1 - 1 / ratioy) / 2, bound[14] + (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineYs = cubeSource2s.getOutputData();
            const cubeSource2c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[3] + (bound[3] - bound[0]) * 0.1, bound[1] + (bound[7] - bound[1]) * (1 - 1 / ratioy) / 2, bound[2]],
            });
            const lineYc = cubeSource2c.getOutputData();
            const map2 = vtkMapper.newInstance();
            const act2 = vtkActor.newInstance();
            const sourceData2 = vtkAppendPolyData.newInstance();
            // sourceData2.setInputData(lineY);
            sourceData2.setInputData(lineYs);
            sourceData2.addInputData(lineYc);
            // sourceData2.addInputData(coneY);
            map2.setInputConnection(sourceData2.getOutputPort());
            act2.setMapper(map2);
            model.axis5y = act2;
        }
        if (model.axis5z === undefined) {
            const cubeSource3s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[0], bound[1] - (bound[7] - bound[1]) * (1 / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2],
            });
            const lineZs = cubeSource3s.getOutputData();
            const cubeSource3c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[3] + (bound[3] - bound[0]) * 0.1, bound[7], bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2],
            });
            const lineZc = cubeSource3c.getOutputData();
            const map3 = vtkMapper.newInstance();
            const act3 = vtkActor.newInstance();
            const sourceData3 = vtkAppendPolyData.newInstance();
            // sourceData3.setInputData(lineZ);
            sourceData3.setInputData(lineZs);
            sourceData3.addInputData(lineZc);
            // sourceData3.addInputData(coneZ);
            map3.setInputConnection(sourceData3.getOutputPort());
            act3.setMapper(map3);
            model.axis5z = act3;
        }
        if (model.axis6x === undefined) {
            const cubeSourceXL1 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.55, bound[7], bound[14] + (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineXL1 = cubeSourceXL1.getOutputData();
            const cubeSourceXL3 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.55, bound[1] - ((bound[7] - bound[1]) * 1 / ratioy), bound[8]],
            });
            const lineXL3 = cubeSourceXL3.getOutputData();
            const map1 = vtkMapper.newInstance();
            const act1 = vtkActor.newInstance();
            const sourceData1 = vtkAppendPolyData.newInstance();
            sourceData1.setInputData(lineXL1);
            sourceData1.addInputData(lineXL3);
            map1.setInputConnection(sourceData1.getOutputPort());
            act1.setMapper(map1);
            model.axis6x = act1;
        }
        if (model.axis6y === undefined) {
            const cubeSource2s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[3], bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[14] + (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineYs = cubeSource2s.getOutputData();
            const cubeSource2c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[0] - (bound[3] - bound[0]) * 0.1, bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[2]],
            });
            const lineYc = cubeSource2c.getOutputData();
            const map2 = vtkMapper.newInstance();
            const act2 = vtkActor.newInstance();
            const sourceData2 = vtkAppendPolyData.newInstance();
            // sourceData2.setInputData(lineY);
            sourceData2.setInputData(lineYs);
            sourceData2.addInputData(lineYc);
            // sourceData2.addInputData(coneY);
            map2.setInputConnection(sourceData2.getOutputPort());
            act2.setMapper(map2);
            model.axis6y = act2;
        }
        if (model.axis6z === undefined) {
            const cubeSource3s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[3], bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2],
            });
            const lineZs = cubeSource3s.getOutputData();
            const cubeSource3c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[0] - (bound[3] - bound[0]) * 0.1, bound[7], bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2],
            });
            const lineZc = cubeSource3c.getOutputData();
            const map3 = vtkMapper.newInstance();
            const act3 = vtkActor.newInstance();
            const sourceData3 = vtkAppendPolyData.newInstance();
            // sourceData3.setInputData(lineZ);
            sourceData3.setInputData(lineZs);
            sourceData3.addInputData(lineZc);
            // sourceData3.addInputData(coneZ);
            map3.setInputConnection(sourceData3.getOutputPort());
            act3.setMapper(map3);
            model.axis6z = act3;
        }
        if (model.axis7x === undefined) {
            const cubeSourceXL1 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.55, bound[7], bound[2] - (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineXL1 = cubeSourceXL1.getOutputData();
            const cubeSourceXL3 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.55, bound[1] - ((bound[7] - bound[1]) * 1 / ratioy), bound[14]],
            });
            const lineXL3 = cubeSourceXL3.getOutputData();
            const map1 = vtkMapper.newInstance();
            const act1 = vtkActor.newInstance();
            const sourceData1 = vtkAppendPolyData.newInstance();
            sourceData1.setInputData(lineXL1);
            sourceData1.addInputData(lineXL3);
            map1.setInputConnection(sourceData1.getOutputPort());
            act1.setMapper(map1);
            model.axis7x = act1;
        }
        if (model.axis7y === undefined) {
            const cubeSource2s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[3], bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[2] - (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineYs = cubeSource2s.getOutputData();
            const cubeSource2c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[0] - (bound[3] - bound[0]) * 0.1, bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[14]],
            });
            const lineYc = cubeSource2c.getOutputData();
            const map2 = vtkMapper.newInstance();
            const act2 = vtkActor.newInstance();
            const sourceData2 = vtkAppendPolyData.newInstance();
            // sourceData2.setInputData(lineY);
            sourceData2.setInputData(lineYs);
            sourceData2.addInputData(lineYc);
            // sourceData2.addInputData(coneY);
            map2.setInputConnection(sourceData2.getOutputPort());
            act2.setMapper(map2);
            model.axis7y = act2;
        }
        if (model.axis7z === undefined) {
            const cubeSource3s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[3], bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy), bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2],
            });
            const lineZs = cubeSource3s.getOutputData();
            const cubeSource3c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[0] - (bound[3] - bound[0]) * 0.1, bound[7], bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2],
            });
            const lineZc = cubeSource3c.getOutputData();
            const map3 = vtkMapper.newInstance();
            const act3 = vtkActor.newInstance();
            const sourceData3 = vtkAppendPolyData.newInstance();
            // sourceData3.setInputData(lineZ);
            sourceData3.setInputData(lineZs);
            sourceData3.addInputData(lineZc);
            // sourceData3.addInputData(coneZ);
            map3.setInputConnection(sourceData3.getOutputPort());
            act3.setMapper(map3);
            model.axis7z = act3;
        }
        if (model.axis8x === undefined) {
            const cubeSourceXL1 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.45, bound[7], bound[2] - (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineXL1 = cubeSourceXL1.getOutputData();
            const cubeSourceXL3 = vtkCubeSource.newInstance({
                xLength: linewX * 1.1,
                yLength: linewX * 0.001,
                zLength: linewX * 0.001,
                center: [bound[3] - (bound[3] - bound[0]) * 0.45, bound[1] - ((bound[7] - bound[1]) * 1 / ratioy), bound[14]],
            });
            const lineXL3 = cubeSourceXL3.getOutputData();
            const map1 = vtkMapper.newInstance();
            const act1 = vtkActor.newInstance();
            const sourceData1 = vtkAppendPolyData.newInstance();
            sourceData1.setInputData(lineXL1);
            sourceData1.addInputData(lineXL3);
            map1.setInputConnection(sourceData1.getOutputPort());
            act1.setMapper(map1);
            model.axis8x = act1;
        }
        if (model.axis8y === undefined) {
            const cubeSource2s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[0], bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[2] - (bound[14] - bound[2]) * 1 / ratioz],
            });
            const lineYs = cubeSource2s.getOutputData();
            const cubeSource2c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewY * (1 + 1 / ratioy),
                zLength: linewX * 0.001,
                center: [bound[3] + (bound[3] - bound[0]) * 0.1, bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2, bound[14]],
            });
            const lineYc = cubeSource2c.getOutputData();
            const map2 = vtkMapper.newInstance();
            const act2 = vtkActor.newInstance();
            const sourceData2 = vtkAppendPolyData.newInstance();
            // sourceData2.setInputData(lineY);
            sourceData2.setInputData(lineYs);
            sourceData2.addInputData(lineYc);
            // sourceData2.addInputData(coneY);
            map2.setInputConnection(sourceData2.getOutputPort());
            act2.setMapper(map2);
            model.axis8y = act2;
        }
        if (model.axis8z === undefined) {
            const cubeSource3s = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[0], bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy), bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2],
            });
            const lineZs = cubeSource3s.getOutputData();
            const cubeSource3c = vtkCubeSource.newInstance({
                xLength: linewX * 0.001,
                yLength: linewX * 0.001,
                zLength: linewZ * (1 + 1 / ratioz),
                center: [bound[3] + (bound[3] - bound[0]) * 0.1, bound[7], bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2],
            });
            const lineZc = cubeSource3c.getOutputData();
            const map3 = vtkMapper.newInstance();
            const act3 = vtkActor.newInstance();
            const sourceData3 = vtkAppendPolyData.newInstance();
            // sourceData3.setInputData(lineZ);
            sourceData3.setInputData(lineZs);
            sourceData3.addInputData(lineZc);
            // sourceData3.addInputData(coneZ);
            map3.setInputConnection(sourceData3.getOutputPort());
            act3.setMapper(map3);
            model.axis8z = act3;
        }
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // ruler
        if (model.ruler1Xactor === undefined) {
            let rulerPoints = [];
            const rulerX = [];
            for (let i = 0; i < 11; i++) {
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[0] + (bound[3] - bound[0]) * i * 0.1, bound[1], bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2 + linewX * 0.005],
                });
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[0] + (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 + linewX * 0.005, bound[2]],
                });
                rulerPoints.push(bound[0] + (bound[3] - bound[0]) * i * 0.1, bound[1] - linewX * 0.03, bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) + linewX * 0.04);
                rulerPoints.push(bound[0] + (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) + linewX * 0.04, bound[2] - linewX * 0.03);
            }
            const sourceDataRulerX = vtkAppendPolyData.newInstance();
            sourceDataRulerX.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerX.length; i++) {
                const cubeSourceRulerX = vtkCubeSource.newInstance(rulerX[i]);
                const x_ruler = cubeSourceRulerX.getOutputData();
                sourceDataRulerX.addInputData(x_ruler);
            }
            const rulerXmapper = vtkMapper.newInstance();
            const rulerXactor = vtkActor.newInstance();
            rulerXmapper.setInputConnection(sourceDataRulerX.getOutputPort());
            rulerXactor.setMapper(rulerXmapper);
            model.ruler1Xactor = rulerXactor;
            model.rulerPoints = rulerPoints;
            model.ruler1X = rulerX;
        }

        if (model.ruler1Yactor === undefined) {
            const rulerY = [];
            for (let i = 0; i <= ratioy; i++) {
                rulerY.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[0], bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2 + linewX * 0.005],
                })
                rulerY.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.55 + bound[12] + linewX * 0.005, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[2]],
                })
                model.rulerPoints.push(bound[0] - linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) + linewX * 0.04);
                model.rulerPoints.push((bound[15] - bound[12]) * 1.1 + bound[12] + linewX * 0.04, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[2] - linewX * 0.03);
            }
            const sourceDataRulerY = vtkAppendPolyData.newInstance();
            sourceDataRulerY.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerY.length; i++) {
                const cubeSourceRulerY = vtkCubeSource.newInstance(rulerY[i]);
                const x_ruler = cubeSourceRulerY.getOutputData();
                sourceDataRulerY.addInputData(x_ruler);
            }
            const rulerYmapper = vtkMapper.newInstance();
            const rulerYactor = vtkActor.newInstance();
            rulerYmapper.setInputConnection(sourceDataRulerY.getOutputPort());
            rulerYactor.setMapper(rulerYmapper);
            model.ruler1Yactor = rulerYactor;
            model.ruler1Y = rulerY;
        }

        if (model.ruler1Zactor === undefined) {
            const rulerZ = [];
            for (let i = 0; i <= ratioz; i++) {
                rulerZ.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[0], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 + linewX * 0.005, bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                rulerZ.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.55 + bound[12] + linewX * 0.005, bound[1], bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                model.rulerPoints.push(bound[0] - linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) + linewX * 0.04, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
                model.rulerPoints.push((bound[15] - bound[12]) * 1.1 + bound[12] + linewX * 0.04, bound[1] - linewX * 0.03, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
            }
            const sourceDataRulerZ = vtkAppendPolyData.newInstance();
            sourceDataRulerZ.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerZ.length; i++) {
                const cubeSourceRulerZ = vtkCubeSource.newInstance(rulerZ[i]);
                const x_ruler = cubeSourceRulerZ.getOutputData();
                sourceDataRulerZ.addInputData(x_ruler);
            }
            const rulerZmapper = vtkMapper.newInstance();
            const rulerZactor = vtkActor.newInstance();
            rulerZmapper.setInputConnection(sourceDataRulerZ.getOutputPort());
            rulerZactor.setMapper(rulerZmapper);
            model.ruler1Zactor = rulerZactor;
            model.ruler1Z = rulerZ;
        }

        if (model.ruler2Xactor === undefined) {
            const rulerX = [];
            for (let i = 0; i < 11; i++) {
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1], bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2 + linewX * 0.005],
                });
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 + linewX * 0.005, bound[2]],
                });
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] - linewX * 0.03, bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) + linewX * 0.04);
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) + linewX * 0.04, bound[2] - linewX * 0.03);
            }
            const sourceDataRulerX = vtkAppendPolyData.newInstance();
            sourceDataRulerX.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerX.length; i++) {
                const cubeSourceRulerX = vtkCubeSource.newInstance(rulerX[i]);
                const x_ruler = cubeSourceRulerX.getOutputData();
                sourceDataRulerX.addInputData(x_ruler);
            }
            const rulerXmapper = vtkMapper.newInstance();
            const rulerXactor = vtkActor.newInstance();
            rulerXmapper.setInputConnection(sourceDataRulerX.getOutputPort());
            rulerXactor.setMapper(rulerXmapper);
            model.ruler2Xactor = rulerXactor;
            model.ruler2X = rulerX;
        }

        if (model.ruler2Yactor === undefined) {
            const rulerY = [];
            for (let i = 0; i <= ratioy; i++) {
                rulerY.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3], bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2 + linewX * 0.005],
                })
                rulerY.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [bound[12] + (bound[15] - bound[12]) * 0.45 - linewX * 0.005, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[2]],
                })
                model.rulerPoints.push(bound[3] + linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) + linewX * 0.04);
                model.rulerPoints.push(bound[12] - (bound[15] - bound[12]) * 0.1 - linewX * 0.04, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[2] - linewX * 0.03);
            }
            const sourceDataRulerY = vtkAppendPolyData.newInstance();
            sourceDataRulerY.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerY.length; i++) {
                const cubeSourceRulerY = vtkCubeSource.newInstance(rulerY[i]);
                const x_ruler = cubeSourceRulerY.getOutputData();
                sourceDataRulerY.addInputData(x_ruler);
            }
            const rulerYmapper = vtkMapper.newInstance();
            const rulerYactor = vtkActor.newInstance();
            rulerYmapper.setInputConnection(sourceDataRulerY.getOutputPort());
            rulerYactor.setMapper(rulerYmapper);
            model.ruler2Yactor = rulerYactor;
            model.ruler2Y = rulerY;
        }

        if (model.ruler2Zactor === undefined) {
            const rulerZ = [];
            for (let i = 0; i <= ratioz; i++) {
                rulerZ.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 + linewX * 0.005, bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                rulerZ.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.45 + bound[12] - linewX * 0.005, bound[1], bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                model.rulerPoints.push(bound[3] + linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) + linewX * 0.04, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
                model.rulerPoints.push(bound[12] - (bound[15] - bound[12]) * 0.1 - linewX * 0.04, bound[1] - linewX * 0.03, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
            }
            const sourceDataRulerZ = vtkAppendPolyData.newInstance();
            sourceDataRulerZ.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerZ.length; i++) {
                const cubeSourceRulerZ = vtkCubeSource.newInstance(rulerZ[i]);
                const x_ruler = cubeSourceRulerZ.getOutputData();
                sourceDataRulerZ.addInputData(x_ruler);
            }
            const rulerZmapper = vtkMapper.newInstance();
            const rulerZactor = vtkActor.newInstance();
            rulerZmapper.setInputConnection(sourceDataRulerZ.getOutputPort());
            rulerZactor.setMapper(rulerZmapper);
            model.ruler2Zactor = rulerZactor;
            model.ruler2Z = rulerZ;
        }

        if (model.ruler3Xactor === undefined) {
            const rulerX = [];
            for (let i = 0; i < 11; i++) {
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1], bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2 - linewX * 0.005],
                });
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 + linewX * 0.005, bound[14]],
                });
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] - linewX * 0.03, bound[14] - (bound[14] - bound[5]) - (bound[14] - bound[5]) / ratioz - linewX * 0.04);
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) + linewX * 0.04, bound[14] + linewX * 0.03);
            }
            const sourceDataRulerX = vtkAppendPolyData.newInstance();
            sourceDataRulerX.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerX.length; i++) {
                const cubeSourceRulerX = vtkCubeSource.newInstance(rulerX[i]);
                const x_ruler = cubeSourceRulerX.getOutputData();
                sourceDataRulerX.addInputData(x_ruler);
            }
            const rulerXmapper = vtkMapper.newInstance();
            const rulerXactor = vtkActor.newInstance();
            rulerXmapper.setInputConnection(sourceDataRulerX.getOutputPort());
            rulerXactor.setMapper(rulerXmapper);
            model.ruler3Xactor = rulerXactor;
            model.ruler3X = rulerX;
        }

        if (model.ruler3Yactor === undefined) {
            const rulerY = [];
            for (let i = 0; i <= ratioy; i++) {
                rulerY.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3], bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[5] + (bound[14] - bound[2]) * (1 - 1 / ratioz) / 2 - linewX * 0.005],
                })
                rulerY.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [bound[12] + (bound[15] - bound[12]) * 0.45 - linewX * 0.005, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[14]],
                })
                model.rulerPoints.push(bound[3] + linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[5] - (bound[14] - bound[2]) * 1 / ratioz - linewX * 0.04);
                model.rulerPoints.push(bound[12] - (bound[15] - bound[12]) * 0.1 - linewX * 0.04, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[14] + linewX * 0.03);
            }
            const sourceDataRulerY = vtkAppendPolyData.newInstance();
            sourceDataRulerY.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerY.length; i++) {
                const cubeSourceRulerY = vtkCubeSource.newInstance(rulerY[i]);
                const x_ruler = cubeSourceRulerY.getOutputData();
                sourceDataRulerY.addInputData(x_ruler);
            }
            const rulerYmapper = vtkMapper.newInstance();
            const rulerYactor = vtkActor.newInstance();
            rulerYmapper.setInputConnection(sourceDataRulerY.getOutputPort());
            rulerYactor.setMapper(rulerYmapper);
            model.ruler3Yactor = rulerYactor;
            model.ruler3Y = rulerY;
        }

        if (model.ruler3Zactor === undefined) {
            const rulerZ = [];
            for (let i = 0; i <= ratioz; i++) {
                rulerZ.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 + linewX * 0.005, bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                rulerZ.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.45 + bound[12] - linewX * 0.005, bound[1], bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                model.rulerPoints.push(bound[3] + linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) + linewX * 0.04, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
                model.rulerPoints.push(bound[12] - (bound[15] - bound[12]) * 0.1 - linewX * 0.04, bound[1] - linewX * 0.03, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
            }
            const sourceDataRulerZ = vtkAppendPolyData.newInstance();
            sourceDataRulerZ.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerZ.length; i++) {
                const cubeSourceRulerZ = vtkCubeSource.newInstance(rulerZ[i]);
                const x_ruler = cubeSourceRulerZ.getOutputData();
                sourceDataRulerZ.addInputData(x_ruler);
            }
            const rulerZmapper = vtkMapper.newInstance();
            const rulerZactor = vtkActor.newInstance();
            rulerZmapper.setInputConnection(sourceDataRulerZ.getOutputPort());
            rulerZactor.setMapper(rulerZmapper);
            model.ruler3Zactor = rulerZactor;
            model.ruler3Z = rulerZ;
        }

        if (model.ruler4Xactor === undefined) {
            const rulerX = [];
            for (let i = 0; i < 11; i++) {
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1], bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2 - linewX * 0.005],
                });
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 + linewX * 0.005, bound[14]],
                });
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] - linewX * 0.03, bound[14] - (bound[14] - bound[5]) - (bound[14] - bound[5]) / ratioz - linewX * 0.04);
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) + linewX * 0.04, bound[14] + linewX * 0.03);
            }
            const sourceDataRulerX = vtkAppendPolyData.newInstance();
            sourceDataRulerX.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerX.length; i++) {
                const cubeSourceRulerX = vtkCubeSource.newInstance(rulerX[i]);
                const x_ruler = cubeSourceRulerX.getOutputData();
                sourceDataRulerX.addInputData(x_ruler);
            }
            const rulerXmapper = vtkMapper.newInstance();
            const rulerXactor = vtkActor.newInstance();
            rulerXmapper.setInputConnection(sourceDataRulerX.getOutputPort());
            rulerXactor.setMapper(rulerXmapper);
            model.ruler4Xactor = rulerXactor;
            model.ruler4X = rulerX;
        }

        if (model.ruler4Yactor === undefined) {
            const rulerY = [];
            for (let i = 0; i <= ratioy; i++) {
                rulerY.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[0], bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[5] + (bound[14] - bound[2]) * (1 - 1 / ratioz) / 2 - linewX * 0.005],
                })
                rulerY.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [bound[12] + (bound[15] - bound[12]) * 0.55 + linewX * 0.005, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[14]],
                })
                model.rulerPoints.push(bound[0] - linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[5] - (bound[14] - bound[2]) * 1 / ratioz - linewX * 0.04);
                model.rulerPoints.push(bound[15] + (bound[15] - bound[12]) * 0.1 + linewX * 0.04, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[14] + linewX * 0.03);
            }
            const sourceDataRulerY = vtkAppendPolyData.newInstance();
            sourceDataRulerY.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerY.length; i++) {
                const cubeSourceRulerY = vtkCubeSource.newInstance(rulerY[i]);
                const x_ruler = cubeSourceRulerY.getOutputData();
                sourceDataRulerY.addInputData(x_ruler);
            }
            const rulerYmapper = vtkMapper.newInstance();
            const rulerYactor = vtkActor.newInstance();
            rulerYmapper.setInputConnection(sourceDataRulerY.getOutputPort());
            rulerYactor.setMapper(rulerYmapper);
            model.ruler4Yactor = rulerYactor;
            model.ruler4Y = rulerY;
        }

        if (model.ruler4Zactor === undefined) {
            const rulerZ = [];
            for (let i = 0; i <= ratioz; i++) {
                rulerZ.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[0], bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 + linewX * 0.005, bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                rulerZ.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.55 + bound[12] + linewX * 0.005, bound[1], bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                model.rulerPoints.push(bound[0] - linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (1 + 1 / ratioy) + linewX * 0.04, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
                model.rulerPoints.push(bound[15] + (bound[15] - bound[12]) * 0.1 + linewX * 0.04, bound[1] - linewX * 0.03, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
            }
            const sourceDataRulerZ = vtkAppendPolyData.newInstance();
            sourceDataRulerZ.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerZ.length; i++) {
                const cubeSourceRulerZ = vtkCubeSource.newInstance(rulerZ[i]);
                const x_ruler = cubeSourceRulerZ.getOutputData();
                sourceDataRulerZ.addInputData(x_ruler);
            }
            const rulerZmapper = vtkMapper.newInstance();
            const rulerZactor = vtkActor.newInstance();
            rulerZmapper.setInputConnection(sourceDataRulerZ.getOutputPort());
            rulerZactor.setMapper(rulerZmapper);
            model.ruler4Zactor = rulerZactor;
            model.ruler4Z = rulerZ;
        }

        if (model.ruler5Xactor === undefined) {
            const rulerX = [];
            for (let i = 0; i < 11; i++) {
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[0] + (bound[3] - bound[0]) * i * 0.1, bound[7], bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2 + linewX * 0.005],
                });
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[0] + (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 - 1 / ratioy) / 2 - linewX * 0.005, bound[2]],
                });
                model.rulerPoints.push(bound[0] + (bound[3] - bound[0]) * i * 0.1, bound[7] + linewX * 0.03, bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) + linewX * 0.04);
                model.rulerPoints.push(bound[0] + (bound[3] - bound[0]) * i * 0.1, bound[1] - (bound[7] - bound[1]) * (1 / ratioy) - linewX * 0.04, bound[2] - linewX * 0.03);
            }
            const sourceDataRulerX = vtkAppendPolyData.newInstance();
            sourceDataRulerX.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerX.length; i++) {
                const cubeSourceRulerX = vtkCubeSource.newInstance(rulerX[i]);
                const x_ruler = cubeSourceRulerX.getOutputData();
                sourceDataRulerX.addInputData(x_ruler);
            }
            const rulerXmapper = vtkMapper.newInstance();
            const rulerXactor = vtkActor.newInstance();
            rulerXmapper.setInputConnection(sourceDataRulerX.getOutputPort());
            rulerXactor.setMapper(rulerXmapper);
            model.ruler5Xactor = rulerXactor;
            model.ruler5X = rulerX;
        }

        if (model.ruler5Yactor === undefined) {
            const rulerY = [];
            for (let i = 0; i <= ratioy; i++) {
                rulerY.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[0], bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2 + linewX * 0.005],
                })
                rulerY.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.55 + bound[12] + linewX * 0.005, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[2]],
                })
                model.rulerPoints.push(bound[0] - linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) + linewX * 0.04);
                model.rulerPoints.push((bound[15] - bound[12]) * 1.1 + bound[12] + linewX * 0.04, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[2] - linewX * 0.03);
            }
            const sourceDataRulerY = vtkAppendPolyData.newInstance();
            sourceDataRulerY.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerY.length; i++) {
                const cubeSourceRulerY = vtkCubeSource.newInstance(rulerY[i]);
                const x_ruler = cubeSourceRulerY.getOutputData();
                sourceDataRulerY.addInputData(x_ruler);
            }
            const rulerYmapper = vtkMapper.newInstance();
            const rulerYactor = vtkActor.newInstance();
            rulerYmapper.setInputConnection(sourceDataRulerY.getOutputPort());
            rulerYactor.setMapper(rulerYmapper);
            model.ruler5Yactor = rulerYactor;
            model.ruler5Y = rulerY;
        }

        if (model.ruler5Zactor === undefined) {
            const rulerZ = [];
            for (let i = 0; i <= ratioz; i++) {
                rulerZ.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[0], bound[1] + (bound[7] - bound[1]) * (1 - 1 / ratioy) / 2 - linewX * 0.005, bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                rulerZ.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.55 + bound[12] + linewX * 0.005, bound[7], bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                model.rulerPoints.push(bound[0] - linewX * 0.03, bound[1] - (bound[7] - bound[1]) * (1 / ratioy) - linewX * 0.04, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
                model.rulerPoints.push((bound[15] - bound[12]) * 1.1 + bound[12] + linewX * 0.04, bound[7] + linewX * 0.03, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
            }
            const sourceDataRulerZ = vtkAppendPolyData.newInstance();
            sourceDataRulerZ.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerZ.length; i++) {
                const cubeSourceRulerZ = vtkCubeSource.newInstance(rulerZ[i]);
                const x_ruler = cubeSourceRulerZ.getOutputData();
                sourceDataRulerZ.addInputData(x_ruler);
            }
            const rulerZmapper = vtkMapper.newInstance();
            const rulerZactor = vtkActor.newInstance();
            rulerZmapper.setInputConnection(sourceDataRulerZ.getOutputPort());
            rulerZactor.setMapper(rulerZmapper);
            model.ruler5Zactor = rulerZactor;
            model.ruler5Z = rulerZ;
        }

        if (model.ruler6Xactor === undefined) {
            const rulerX = [];
            for (let i = 0; i < 11; i++) {
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[7], bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2 + linewX * 0.005],
                });
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] + (bound[7] - bound[1]) * (1 - 1 / ratioy) / 2 - linewX * 0.005, bound[2]],
                });
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[7] + linewX * 0.03, bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) + linewX * 0.04);
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] - (bound[7] - bound[1]) * (1 / ratioy) - linewX * 0.04, bound[2] - linewX * 0.03);
            }
            const sourceDataRulerX = vtkAppendPolyData.newInstance();
            sourceDataRulerX.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerX.length; i++) {
                const cubeSourceRulerX = vtkCubeSource.newInstance(rulerX[i]);
                const x_ruler = cubeSourceRulerX.getOutputData();
                sourceDataRulerX.addInputData(x_ruler);
            }
            const rulerXmapper = vtkMapper.newInstance();
            const rulerXactor = vtkActor.newInstance();
            rulerXmapper.setInputConnection(sourceDataRulerX.getOutputPort());
            rulerXactor.setMapper(rulerXmapper);
            model.ruler6Xactor = rulerXactor;
            model.ruler6X = rulerX;
        }

        if (model.ruler6Yactor === undefined) {
            const rulerY = [];
            for (let i = 0; i <= ratioy; i++) {
                rulerY.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3], bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) / 2 + linewX * 0.005],
                })
                rulerY.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [bound[12] + (bound[15] - bound[12]) * 0.45 - linewX * 0.005, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[2]],
                })
                model.rulerPoints.push(bound[3] + linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[8] + (bound[14] - bound[2]) * (1 + 1 / ratioz) + linewX * 0.04);
                model.rulerPoints.push(bound[12] - (bound[15] - bound[12]) * 0.1 - linewX * 0.04, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[2] - linewX * 0.03);
            }
            const sourceDataRulerY = vtkAppendPolyData.newInstance();
            sourceDataRulerY.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerY.length; i++) {
                const cubeSourceRulerY = vtkCubeSource.newInstance(rulerY[i]);
                const x_ruler = cubeSourceRulerY.getOutputData();
                sourceDataRulerY.addInputData(x_ruler);
            }
            const rulerYmapper = vtkMapper.newInstance();
            const rulerYactor = vtkActor.newInstance();
            rulerYmapper.setInputConnection(sourceDataRulerY.getOutputPort());
            rulerYactor.setMapper(rulerYmapper);
            model.ruler6Yactor = rulerYactor;
            model.ruler6Y = rulerY;
        }

        if (model.ruler6Zactor === undefined) {
            const rulerZ = [];
            for (let i = 0; i <= ratioz; i++) {
                rulerZ.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3], bound[1] + (bound[7] - bound[1]) * (1 - 1 / ratioy) / 2 - linewX * 0.005, bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                rulerZ.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.45 + bound[12] - linewX * 0.005, bound[7], bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                model.rulerPoints.push(bound[3] + linewX * 0.03, bound[1] - (bound[7] - bound[1]) * (1 / ratioy) - linewX * 0.04, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
                model.rulerPoints.push(bound[12] - (bound[15] - bound[12]) * 0.1 - linewX * 0.04, bound[7] + linewX * 0.03, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
            }
            const sourceDataRulerZ = vtkAppendPolyData.newInstance();
            sourceDataRulerZ.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerZ.length; i++) {
                const cubeSourceRulerZ = vtkCubeSource.newInstance(rulerZ[i]);
                const x_ruler = cubeSourceRulerZ.getOutputData();
                sourceDataRulerZ.addInputData(x_ruler);
            }
            const rulerZmapper = vtkMapper.newInstance();
            const rulerZactor = vtkActor.newInstance();
            rulerZmapper.setInputConnection(sourceDataRulerZ.getOutputPort());
            rulerZactor.setMapper(rulerZmapper);
            model.ruler6Zactor = rulerZactor;
            model.ruler6Z = rulerZ;
        }

        if (model.ruler7Xactor === undefined) {
            const rulerX = [];
            for (let i = 0; i < 11; i++) {
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[7], bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2 - linewX * 0.005],
                });
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 - linewX * 0.005, bound[14]],
                });
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[7] + linewX * 0.03, bound[14] - (bound[14] - bound[5]) - (bound[14] - bound[5]) / ratioz - linewX * 0.04);
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] - (bound[7] - bound[1]) * (1 / ratioy) - linewX * 0.04, bound[14] + linewX * 0.03);
            }
            const sourceDataRulerX = vtkAppendPolyData.newInstance();
            sourceDataRulerX.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerX.length; i++) {
                const cubeSourceRulerX = vtkCubeSource.newInstance(rulerX[i]);
                const x_ruler = cubeSourceRulerX.getOutputData();
                sourceDataRulerX.addInputData(x_ruler);
            }
            const rulerXmapper = vtkMapper.newInstance();
            const rulerXactor = vtkActor.newInstance();
            rulerXmapper.setInputConnection(sourceDataRulerX.getOutputPort());
            rulerXactor.setMapper(rulerXmapper);
            model.ruler7Xactor = rulerXactor;
            model.ruler7X = rulerX;
        }

        if (model.ruler7Yactor === undefined) {
            const rulerY = [];
            for (let i = 0; i <= ratioy; i++) {
                rulerY.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3], bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[5] + (bound[14] - bound[2]) * (1 - 1 / ratioz) / 2 - linewX * 0.005],
                })
                rulerY.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [bound[12] + (bound[15] - bound[12]) * 0.45 - linewX * 0.005, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[14]],
                })
                model.rulerPoints.push(bound[3] + linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[5] - (bound[14] - bound[2]) * 1 / ratioz - linewX * 0.04);
                model.rulerPoints.push(bound[12] - (bound[15] - bound[12]) * 0.1 - linewX * 0.04, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[14] + linewX * 0.03);
            }
            const sourceDataRulerY = vtkAppendPolyData.newInstance();
            sourceDataRulerY.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerY.length; i++) {
                const cubeSourceRulerY = vtkCubeSource.newInstance(rulerY[i]);
                const x_ruler = cubeSourceRulerY.getOutputData();
                sourceDataRulerY.addInputData(x_ruler);
            }
            const rulerYmapper = vtkMapper.newInstance();
            const rulerYactor = vtkActor.newInstance();
            rulerYmapper.setInputConnection(sourceDataRulerY.getOutputPort());
            rulerYactor.setMapper(rulerYmapper);
            model.ruler7Yactor = rulerYactor;
            model.ruler7Y = rulerY;
        }

        if (model.ruler7Zactor === undefined) {
            const rulerZ = [];
            for (let i = 0; i <= ratioz; i++) {
                rulerZ.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3], bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 - linewX * 0.005, bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                rulerZ.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.45 + bound[12] - linewX * 0.005, bound[7], bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                model.rulerPoints.push(bound[3] + linewX * 0.03, bound[1] - (bound[7] - bound[1]) * (1 / ratioy) - linewX * 0.04, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
                model.rulerPoints.push(bound[12] - (bound[15] - bound[12]) * 0.1 - linewX * 0.04, bound[7] + linewX * 0.03, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
            }
            const sourceDataRulerZ = vtkAppendPolyData.newInstance();
            sourceDataRulerZ.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerZ.length; i++) {
                const cubeSourceRulerZ = vtkCubeSource.newInstance(rulerZ[i]);
                const x_ruler = cubeSourceRulerZ.getOutputData();
                sourceDataRulerZ.addInputData(x_ruler);
            }
            const rulerZmapper = vtkMapper.newInstance();
            const rulerZactor = vtkActor.newInstance();
            rulerZmapper.setInputConnection(sourceDataRulerZ.getOutputPort());
            rulerZactor.setMapper(rulerZmapper);
            model.ruler7Zactor = rulerZactor;
            model.ruler7Z = rulerZ;
        }

        if (model.ruler8Xactor === undefined) {
            const rulerX = [];
            for (let i = 0; i < 11; i++) {
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[7], bound[14] - (bound[14] - bound[5]) / 2 - (bound[14] - bound[5]) / ratioz / 2 - linewX * 0.005],
                });
                rulerX.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 - linewX * 0.005, bound[14]],
                });
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[7] + linewX * 0.03, bound[14] - (bound[14] - bound[5]) - (bound[14] - bound[5]) / ratioz - linewX * 0.04);
                model.rulerPoints.push(bound[3] - (bound[3] - bound[0]) * i * 0.1, bound[1] - (bound[7] - bound[1]) * (1 / ratioy) - linewX * 0.04, bound[14] + linewX * 0.03);
            }
            const sourceDataRulerX = vtkAppendPolyData.newInstance();
            sourceDataRulerX.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerX.length; i++) {
                const cubeSourceRulerX = vtkCubeSource.newInstance(rulerX[i]);
                const x_ruler = cubeSourceRulerX.getOutputData();
                sourceDataRulerX.addInputData(x_ruler);
            }
            const rulerXmapper = vtkMapper.newInstance();
            const rulerXactor = vtkActor.newInstance();
            rulerXmapper.setInputConnection(sourceDataRulerX.getOutputPort());
            rulerXactor.setMapper(rulerXmapper);
            model.ruler8Xactor = rulerXactor;
            model.ruler8X = rulerX;
        }

        if (model.ruler8Yactor === undefined) {
            const rulerY = [];
            for (let i = 0; i <= ratioy; i++) {
                rulerY.push({
                    xLength: linewX * 0.001,
                    yLength: linewX * 0.001,
                    zLength: linewZ * (1 + 1 / ratioz) + linewX * 0.01,
                    center: [bound[0], bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[5] + (bound[14] - bound[2]) * (1 - 1 / ratioz) / 2 - linewX * 0.005],
                })
                rulerY.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [bound[12] + (bound[15] - bound[12]) * 0.55 + linewX * 0.005, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[14]],
                })
                model.rulerPoints.push(bound[0] - linewX * 0.03, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[5] - (bound[14] - bound[2]) * 1 / ratioz - linewX * 0.04);
                model.rulerPoints.push(bound[15] + (bound[15] - bound[12]) * 0.1 + linewX * 0.04, bound[1] + (bound[7] - bound[1]) * (i / ratioy), bound[14] + linewX * 0.03);
            }
            const sourceDataRulerY = vtkAppendPolyData.newInstance();
            sourceDataRulerY.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerY.length; i++) {
                const cubeSourceRulerY = vtkCubeSource.newInstance(rulerY[i]);
                const x_ruler = cubeSourceRulerY.getOutputData();
                sourceDataRulerY.addInputData(x_ruler);
            }
            const rulerYmapper = vtkMapper.newInstance();
            const rulerYactor = vtkActor.newInstance();
            rulerYmapper.setInputConnection(sourceDataRulerY.getOutputPort());
            rulerYactor.setMapper(rulerYmapper);
            model.ruler8Yactor = rulerYactor;
            model.ruler8Y = rulerY;
        }

        if (model.ruler8Zactor === undefined) {
            const rulerZ = [];
            for (let i = 0; i <= ratioz; i++) {
                rulerZ.push({
                    xLength: linewX * 0.001,
                    yLength: linewY * (1 + 1 / ratioy) + linewX * 0.01,
                    zLength: linewX * 0.001,
                    center: [bound[0], bound[7] - (bound[7] - bound[1]) * (1 + 1 / ratioy) / 2 - linewX * 0.005, bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                rulerZ.push({
                    xLength: linewX * 1.1 + linewX * 0.01,
                    yLength: linewX * 0.001,
                    zLength: linewX * 0.001,
                    center: [(bound[15] - bound[12]) * 0.55 + bound[12] + linewX * 0.005, bound[7], bound[2] + (bound[14] - bound[2]) * (i / ratioz)],
                })
                model.rulerPoints.push(bound[0] - linewX * 0.03, bound[1] - (bound[7] - bound[1]) * (1 / ratioy) - linewX * 0.04, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
                model.rulerPoints.push(bound[15] + (bound[15] - bound[12]) * 0.1 + linewX * 0.04, bound[7] + linewX * 0.03, bound[2] + (bound[14] - bound[2]) * (i / ratioz));
            }
            const sourceDataRulerZ = vtkAppendPolyData.newInstance();
            sourceDataRulerZ.setInputData(vtk({
                vtkClass: 'vtkPolyData',
            }));
            for (let i = 0; i < rulerZ.length; i++) {
                const cubeSourceRulerZ = vtkCubeSource.newInstance(rulerZ[i]);
                const x_ruler = cubeSourceRulerZ.getOutputData();
                sourceDataRulerZ.addInputData(x_ruler);
            }
            const rulerZmapper = vtkMapper.newInstance();
            const rulerZactor = vtkActor.newInstance();
            rulerZmapper.setInputConnection(sourceDataRulerZ.getOutputPort());
            rulerZactor.setMapper(rulerZmapper);
            model.ruler8Zactor = rulerZactor;
            model.ruler8Z = rulerZ;
        }
        model.rulerPoints.push(...bound);
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        const psMapper = vtkPixelSpaceCallbackMapper.newInstance();
        psMapper.setInputData(vtk({
            vtkClass: 'vtkPolyData',
            points: {
                vtkClass: 'vtkPoints',
                dataType: 'Float32Array',
                numberOfComponents: 3,
                values: model.rulerPoints,
            },
        }));

        model.axis1x.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis2x.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis3x.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis4x.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis5x.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis6x.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis7x.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis8x.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis1y.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis2y.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis3y.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis4y.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis5y.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis6y.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis7y.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis8y.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis1z.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis2z.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis3z.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis4z.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis5z.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis6z.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis7z.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.axis8z.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler1Xactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler2Xactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler3Xactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler4Xactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler5Xactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler6Xactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler7Xactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler8Xactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler1Yactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler2Yactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler3Yactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler4Yactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler5Yactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler6Yactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler7Yactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler8Yactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler1Zactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler2Zactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler3Zactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler4Zactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler5Zactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler6Zactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler7Zactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);
        model.ruler8Zactor.getProperty().setColor(actColor[0], actColor[1], actColor[2]);

        psMapper.setCallback((coordsList) => {
            if (document.querySelector(".vtk-container")) {
                let dims = document.querySelector(".vtk-container").getBoundingClientRect();
                textCtx.clearRect(0, 0, dims.width * window.devicePixelRatio, dims.height * window.devicePixelRatio);
            }

            model.renderer.removeActor(model.axis1x);
            model.renderer.removeActor(model.axis1y);
            model.renderer.removeActor(model.axis1z);
            model.renderer.removeActor(model.ruler1Xactor);
            model.renderer.removeActor(model.ruler1Yactor);
            model.renderer.removeActor(model.ruler1Zactor);
            model.renderer.removeActor(model.axis2x);
            model.renderer.removeActor(model.axis2y);
            model.renderer.removeActor(model.axis2z);
            model.renderer.removeActor(model.ruler2Xactor);
            model.renderer.removeActor(model.ruler2Yactor);
            model.renderer.removeActor(model.ruler2Zactor);
            model.renderer.removeActor(model.axis3x);
            model.renderer.removeActor(model.axis3y);
            model.renderer.removeActor(model.axis3z);
            model.renderer.removeActor(model.ruler3Xactor);
            model.renderer.removeActor(model.ruler3Yactor);
            model.renderer.removeActor(model.ruler3Zactor);
            model.renderer.removeActor(model.axis4x);
            model.renderer.removeActor(model.axis4y);
            model.renderer.removeActor(model.axis4z);
            model.renderer.removeActor(model.ruler4Xactor);
            model.renderer.removeActor(model.ruler4Yactor);
            model.renderer.removeActor(model.ruler4Zactor);
            model.renderer.removeActor(model.axis5x);
            model.renderer.removeActor(model.axis5y);
            model.renderer.removeActor(model.axis5z);
            model.renderer.removeActor(model.ruler5Xactor);
            model.renderer.removeActor(model.ruler5Yactor);
            model.renderer.removeActor(model.ruler5Zactor);
            model.renderer.removeActor(model.axis6x);
            model.renderer.removeActor(model.axis6y);
            model.renderer.removeActor(model.axis6z);
            model.renderer.removeActor(model.ruler6Xactor);
            model.renderer.removeActor(model.ruler6Yactor);
            model.renderer.removeActor(model.ruler6Zactor);
            model.renderer.removeActor(model.axis7x);
            model.renderer.removeActor(model.axis7y);
            model.renderer.removeActor(model.axis7z);
            model.renderer.removeActor(model.ruler7Xactor);
            model.renderer.removeActor(model.ruler7Yactor);
            model.renderer.removeActor(model.ruler7Zactor);
            model.renderer.removeActor(model.axis8x);
            model.renderer.removeActor(model.axis8y);
            model.renderer.removeActor(model.axis8z);
            model.renderer.removeActor(model.ruler8Xactor);
            model.renderer.removeActor(model.ruler8Yactor);
            model.renderer.removeActor(model.ruler8Zactor);

            if (coordsList[8 * (26 + 2 * ratioz + 2 * ratioy)][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 1][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy)][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 2][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy)][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 4][2]) {
                model.renderer.addActor(model.axis1x);
                model.renderer.addActor(model.axis1y);
                model.renderer.addActor(model.axis1z);
                model.renderer.addActor(model.ruler1Xactor);
                model.renderer.addActor(model.ruler1Yactor);
                model.renderer.addActor(model.ruler1Zactor);
                coordsList.forEach((xy, idx) => {
                    textCtx.font = `${14 * window.pixelRatio}px serif`;
                    textCtx.fillStyle = theme
                    textCtx.textAlign = 'center';
                    textCtx.textBaseline = 'middle';
                    if (xMulti && yMulti && zMulti) {
                        if (idx < 22) {
                            textCtx.fillText(`${(model.ruler1X[idx].center[0] * xMulti + Number(xMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 && idx >= 22) {
                            textCtx.fillText(`${(model.ruler1Y[idx - 22].center[1] * yMulti + Number(yMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 && idx < 26 + 2 * ratioz + 2 * ratioy) {
                            textCtx.fillText(`${(model.ruler1Z[idx - 2 * ratioy - 24].center[2] * zMulti + Number(zMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    } else {
                        if (idx < 22) {
                            textCtx.fillText(`${model.ruler1X[idx].center[0].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 && idx >= 22) {
                            textCtx.fillText(`${model.ruler1Y[idx - 22].center[1].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 && idx < 26 + 2 * ratioz + 2 * ratioy) {
                            textCtx.fillText(`${model.ruler1Z[idx - 2 * ratioy - 24].center[2].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    }
                });
            }
            else if (coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 1][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy)][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 1][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 3][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 1][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 5][2]) {
                model.renderer.addActor(model.axis2x);
                model.renderer.addActor(model.axis2y);
                model.renderer.addActor(model.axis2z);
                model.renderer.addActor(model.ruler2Xactor);
                model.renderer.addActor(model.ruler2Yactor);
                model.renderer.addActor(model.ruler2Zactor);
                coordsList.forEach((xy, idx) => {
                    textCtx.font = `${14 * window.pixelRatio}px serif`
                    textCtx.fillStyle = theme
                    textCtx.textAlign = 'center';
                    textCtx.textBaseline = 'middle';
                    if (xMulti && yMulti && zMulti) {
                        if (idx >= 26 + 2 * ratioz + 2 * ratioy && idx < 48 + 2 * ratioz + 2 * ratioy) {
                            textCtx.fillText(`${(model.ruler2X[idx - (26 + 2 * ratioz + 2 * ratioy)].center[0] * xMulti + Number(xMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 26 + 2 * ratioz + 2 * ratioy && idx >= 48 + 2 * ratioz + 2 * ratioy) {
                            textCtx.fillText(`${(model.ruler2Y[idx - 22 - (26 + 2 * ratioz + 2 * ratioy)].center[1] * yMulti + Number(yMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler2Z[idx - 2 * ratioy - 24 - (26 + 2 * ratioz + 2 * ratioy)].center[2] * zMulti + Number(zMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    } else {
                        if (idx >= 26 + 2 * ratioz + 2 * ratioy && idx < 48 + 2 * ratioz + 2 * ratioy) {
                            textCtx.fillText(`${model.ruler2X[idx - (26 + 2 * ratioz + 2 * ratioy)].center[0].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 26 + 2 * ratioz + 2 * ratioy && idx >= 48 + 2 * ratioz + 2 * ratioy) {
                            textCtx.fillText(`${model.ruler2Y[idx - 22 - (26 + 2 * ratioz + 2 * ratioy)].center[1].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler2Z[idx - 2 * ratioy - 24 - (26 + 2 * ratioz + 2 * ratioy)].center[2].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    }
                });
            }
            else if (coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 3][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 1][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 3][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 7][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 3][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 2][2]) {
                model.renderer.addActor(model.axis6x);
                model.renderer.addActor(model.axis6y);
                model.renderer.addActor(model.axis6z);
                model.renderer.addActor(model.ruler6Xactor);
                model.renderer.addActor(model.ruler6Yactor);
                model.renderer.addActor(model.ruler6Zactor);
                coordsList.forEach((xy, idx) => {
                    textCtx.font = `${14 * window.pixelRatio}px serif`
                    textCtx.fillStyle = theme
                    textCtx.textAlign = 'center';
                    textCtx.textBaseline = 'middle';
                    if (xMulti && yMulti && zMulti) {
                        if (idx >= 5 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 5 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler6X[idx - 5 * (26 + 2 * ratioz + 2 * ratioy)].center[0] * xMulti + Number(xMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 5 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 5 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler6Y[idx - 22 - 5 * (26 + 2 * ratioz + 2 * ratioy)].center[1] * yMulti + Number(yMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 5 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 5 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler6Z[idx - 2 * ratioy - 24 - 5 * (26 + 2 * ratioz + 2 * ratioy)].center[2] * zMulti + Number(zMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    } else {
                        if (idx >= 5 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 5 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler6X[idx - 5 * (26 + 2 * ratioz + 2 * ratioy)].center[0].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 5 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 5 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler6Y[idx - 22 - 5 * (26 + 2 * ratioz + 2 * ratioy)].center[1].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 5 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 5 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler6Z[idx - 2 * ratioy - 24 - 5 * (26 + 2 * ratioz + 2 * ratioy)].center[2].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    }
                });
            }
            else if (coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 2][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy)][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 2][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 3][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 2][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 6][2]) {
                model.renderer.addActor(model.axis5x);
                model.renderer.addActor(model.axis5y);
                model.renderer.addActor(model.axis5z);
                model.renderer.addActor(model.ruler5Xactor);
                model.renderer.addActor(model.ruler5Yactor);
                model.renderer.addActor(model.ruler5Zactor);
                coordsList.forEach((xy, idx) => {
                    textCtx.font = `${14 * window.pixelRatio}px serif`
                    textCtx.fillStyle = theme
                    textCtx.textAlign = 'center';
                    textCtx.textBaseline = 'middle';
                    if (xMulti && yMulti && zMulti) {
                        if (idx >= 4 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 4 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler5X[idx - 4 * (26 + 2 * ratioz + 2 * ratioy)].center[0] * xMulti + Number(xMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 4 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 4 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler5Y[idx - 22 - 4 * (26 + 2 * ratioz + 2 * ratioy)].center[1] * yMulti + Number(yMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 4 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 4 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler5Z[idx - 2 * ratioy - 24 - 4 * (26 + 2 * ratioz + 2 * ratioy)].center[2] * zMulti + Number(zMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    } else {
                        if (idx >= 4 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 4 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler5X[idx - 4 * (26 + 2 * ratioz + 2 * ratioy)].center[0].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 4 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 4 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler5Y[idx - 22 - 4 * (26 + 2 * ratioz + 2 * ratioy)].center[1].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 4 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 4 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler5Z[idx - 2 * ratioy - 24 - 4 * (26 + 2 * ratioz + 2 * ratioy)].center[2].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    }
                });
            }
            else if (coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 4][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy)][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 4][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 5][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 4][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 6][2]) {
                model.renderer.addActor(model.axis4x);
                model.renderer.addActor(model.axis4y);
                model.renderer.addActor(model.axis4z);
                model.renderer.addActor(model.ruler4Xactor);
                model.renderer.addActor(model.ruler4Yactor);
                model.renderer.addActor(model.ruler4Zactor);
                coordsList.forEach((xy, idx) => {
                    textCtx.font = `${14 * window.pixelRatio}px serif`
                    textCtx.fillStyle = theme
                    textCtx.textAlign = 'center';
                    textCtx.textBaseline = 'middle';
                    if (xMulti && yMulti && zMulti) {
                        if (idx >= 3 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 3 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler4X[idx - 3 * (26 + 2 * ratioz + 2 * ratioy)].center[0] * xMulti + Number(xMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 3 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 3 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler4Y[idx - 22 - 3 * (26 + 2 * ratioz + 2 * ratioy)].center[1] * yMulti + Number(yMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 3 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 3 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler4Z[idx - 2 * ratioy - 24 - 3 * (26 + 2 * ratioz + 2 * ratioy)].center[2] * zMulti + Number(zMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    } else {
                        if (idx >= 3 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 3 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler4X[idx - 3 * (26 + 2 * ratioz + 2 * ratioy)].center[0].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 3 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 3 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler4Y[idx - 22 - 3 * (26 + 2 * ratioz + 2 * ratioy)].center[1].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 3 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 3 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler4Z[idx - 2 * ratioy - 24 - 3 * (26 + 2 * ratioz + 2 * ratioy)].center[2].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    }
                });
            }
            else if (coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 5][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 1][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 5][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 7][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 5][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 4][2]) {
                model.renderer.addActor(model.axis3x);
                model.renderer.addActor(model.axis3y);
                model.renderer.addActor(model.axis3z);
                model.renderer.addActor(model.ruler3Xactor);
                model.renderer.addActor(model.ruler3Yactor);
                model.renderer.addActor(model.ruler3Zactor);
                coordsList.forEach((xy, idx) => {
                    textCtx.font = `${14 * window.pixelRatio}px serif`
                    textCtx.fillStyle = theme
                    textCtx.textAlign = 'center';
                    textCtx.textBaseline = 'middle';
                    if (xMulti && yMulti && zMulti) {
                        if (idx >= 2 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 2 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler3X[idx - 2 * (26 + 2 * ratioz + 2 * ratioy)].center[0] * xMulti + Number(xMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 2 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 2 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler3Y[idx - 22 - 2 * (26 + 2 * ratioz + 2 * ratioy)].center[1] * yMulti + Number(yMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 2 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 2 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler3Z[idx - 2 * ratioy - 24 - 2 * (26 + 2 * ratioz + 2 * ratioy)].center[2] * zMulti + Number(zMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    } else {
                        if (idx >= 2 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 2 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler3X[idx - 2 * (26 + 2 * ratioz + 2 * ratioy)].center[0].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 2 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 2 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler3Y[idx - 22 - 2 * (26 + 2 * ratioz + 2 * ratioy)].center[1].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 2 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 2 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler3Z[idx - 2 * ratioy - 24 - 2 * (26 + 2 * ratioz + 2 * ratioy)].center[2].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    }
                });
            }
            else if (coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 7][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 3][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 7][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 5][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 7][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 6][2]) {
                model.renderer.addActor(model.axis7x);
                model.renderer.addActor(model.axis7y);
                model.renderer.addActor(model.axis7z);
                model.renderer.addActor(model.ruler7Xactor);
                model.renderer.addActor(model.ruler7Yactor);
                model.renderer.addActor(model.ruler7Zactor);
                coordsList.forEach((xy, idx) => {
                    textCtx.font = `${14 * window.pixelRatio}px serif`
                    textCtx.fillStyle = theme
                    textCtx.textAlign = 'center';
                    textCtx.textBaseline = 'middle';
                    if (xMulti && yMulti && zMulti) {
                        if (idx >= 6 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 6 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler7X[idx - 6 * (26 + 2 * ratioz + 2 * ratioy)].center[0] * xMulti + Number(xMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 6 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 6 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler7Y[idx - 22 - 6 * (26 + 2 * ratioz + 2 * ratioy)].center[1] * yMulti + Number(yMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 6 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 6 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler7Z[idx - 2 * ratioy - 24 - 6 * (26 + 2 * ratioz + 2 * ratioy)].center[2] * zMulti + Number(zMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    } else {
                        if (idx >= 6 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 6 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler7X[idx - 6 * (26 + 2 * ratioz + 2 * ratioy)].center[0].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 6 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 6 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler7Y[idx - 22 - 6 * (26 + 2 * ratioz + 2 * ratioy)].center[1].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 6 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 6 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler7Z[idx - 2 * ratioy - 24 - 6 * (26 + 2 * ratioz + 2 * ratioy)].center[2].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    }
                });
            }
            else if (coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 6][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 2][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 6][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 4][2] && coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 6][2] >= coordsList[8 * (26 + 2 * ratioz + 2 * ratioy) + 7][2]) {
                model.renderer.addActor(model.axis8x);
                model.renderer.addActor(model.axis8y);
                model.renderer.addActor(model.axis8z);
                model.renderer.addActor(model.ruler8Xactor);
                model.renderer.addActor(model.ruler8Yactor);
                model.renderer.addActor(model.ruler8Zactor);
                coordsList.forEach((xy, idx) => {
                    textCtx.font = `${14 * window.pixelRatio}px serif`
                    textCtx.fillStyle = theme
                    textCtx.textAlign = 'center';
                    textCtx.textBaseline = 'middle';
                    if (xMulti && yMulti && zMulti) {
                        if (idx >= 7 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 7 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler8X[idx - 7 * (26 + 2 * ratioz + 2 * ratioy)].center[0] * xMulti + Number(xMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 7 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 7 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler8Y[idx - 22 - 7 * (26 + 2 * ratioz + 2 * ratioy)].center[1] * yMulti + Number(yMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 7 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 7 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${(model.ruler8Z[idx - 2 * ratioy - 24 - 7 * (26 + 2 * ratioz + 2 * ratioy)].center[2] * zMulti + Number(zMin)).toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    } else {
                        if (idx >= 7 * (26 + 2 * ratioz + 2 * ratioy) && idx < 22 + 7 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler8X[idx - 7 * (26 + 2 * ratioz + 2 * ratioy)].center[0].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx < 2 * ratioy + 24 + 7 * (26 + 2 * ratioz + 2 * ratioy) && idx >= 22 + 7 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler8Y[idx - 22 - 7 * (26 + 2 * ratioz + 2 * ratioy)].center[1].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        } else if (idx >= 2 * ratioy + 24 + 7 * (26 + 2 * ratioz + 2 * ratioy) && idx < 26 + 2 * ratioz + 2 * ratioy + 7 * (26 + 2 * ratioz + 2 * ratioy)) {
                            textCtx.fillText(`${model.ruler8Z[idx - 2 * ratioy - 24 - 7 * (26 + 2 * ratioz + 2 * ratioy)].center[2].toFixed(1)}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
                        }
                    }
                });
            }

        });
        const textActor = vtkActor.newInstance();
        textActor.setMapper(psMapper);
        model.textActor = textActor;
        model.renderer.addActor(model.textActor);

    } else if (ruler === false && dimensional === 2) {
        props.dispatch(actions.setMoveStyle(actions.moveType.PAN));
        model.renderer.removeActor(model.ruler1);
        model.renderer.removeActor(model.ruler2);
        model.renderer.removeActor(model.ruler3);
        model.renderer.removeActor(model.rulerXactor);
        model.renderer.removeActor(model.rulerYactor);
        model.renderer.removeActor(model.rulerZactor);
        model.renderer.removeActor(model.textActor);
        if (document.querySelector('.textCanvas')) {
            container.current.children[0].removeChild(document.querySelector('.textCanvas'))
        }
    } else if (ruler === false && dimensional === 3) {
        model.renderer.removeActor(model.axis1x);
        model.renderer.removeActor(model.axis1y);
        model.renderer.removeActor(model.axis1z);
        model.renderer.removeActor(model.ruler1Xactor);
        model.renderer.removeActor(model.ruler1Yactor);
        model.renderer.removeActor(model.ruler1Zactor);
        model.renderer.removeActor(model.axis2x);
        model.renderer.removeActor(model.axis2y);
        model.renderer.removeActor(model.axis2z);
        model.renderer.removeActor(model.ruler2Xactor);
        model.renderer.removeActor(model.ruler2Yactor);
        model.renderer.removeActor(model.ruler2Zactor);
        model.renderer.removeActor(model.axis3x);
        model.renderer.removeActor(model.axis3y);
        model.renderer.removeActor(model.axis3z);
        model.renderer.removeActor(model.ruler3Xactor);
        model.renderer.removeActor(model.ruler3Yactor);
        model.renderer.removeActor(model.ruler3Zactor);
        model.renderer.removeActor(model.axis4x);
        model.renderer.removeActor(model.axis4y);
        model.renderer.removeActor(model.axis4z);
        model.renderer.removeActor(model.ruler4Xactor);
        model.renderer.removeActor(model.ruler4Yactor);
        model.renderer.removeActor(model.ruler4Zactor);
        model.renderer.removeActor(model.axis5x);
        model.renderer.removeActor(model.axis5y);
        model.renderer.removeActor(model.axis5z);
        model.renderer.removeActor(model.ruler5Xactor);
        model.renderer.removeActor(model.ruler5Yactor);
        model.renderer.removeActor(model.ruler5Zactor);
        model.renderer.removeActor(model.axis6x);
        model.renderer.removeActor(model.axis6y);
        model.renderer.removeActor(model.axis6z);
        model.renderer.removeActor(model.ruler6Xactor);
        model.renderer.removeActor(model.ruler6Yactor);
        model.renderer.removeActor(model.ruler6Zactor);
        model.renderer.removeActor(model.axis7x);
        model.renderer.removeActor(model.axis7y);
        model.renderer.removeActor(model.axis7z);
        model.renderer.removeActor(model.ruler7Xactor);
        model.renderer.removeActor(model.ruler7Yactor);
        model.renderer.removeActor(model.ruler7Zactor);
        model.renderer.removeActor(model.axis8x);
        model.renderer.removeActor(model.axis8y);
        model.renderer.removeActor(model.axis8z);
        model.renderer.removeActor(model.ruler8Xactor);
        model.renderer.removeActor(model.ruler8Yactor);
        model.renderer.removeActor(model.ruler8Zactor);
        model.renderer.removeActor(model.textActor);
        if (document.querySelector('.textCanvas')) {
            container.current.children[0].removeChild(document.querySelector('.textCanvas'))
        }
    }
}

//创建平面
export const creatPlane = (model, _this, xAxis, yAxis, datatype, arrs, xLength, yLength, actor, mapper, lookupTable, data, cen, appName) => {
    let array = [], array1 = [];
    let xR = [...new Set(xAxis)];
    let yR = [...new Set(yAxis)];
    xR.sort(function (a, b) {
        return a - b;
    });
    yR.sort(function (a, b) {
        return a - b;
    });
    if (cen === undefined) {
        cen = [0, 0, 0];
    }
    // Array.from(new Set(array))
    yLength = Array.from(new Set(yAxis)).length;
    xLength = Array.from(new Set(xAxis)).length;

    if (xLength === 1) {
        xLength = 2;
    }
    if (datatype === "数据去趋势") {
        xLength -= 1;
    }

    // 定义平面源
    const planeSource = vtkPlaneSource.newInstance({
        XResolution: xLength - 1,
        YResolution: yLength - 1,
    });

    const simpleFilter = vtkCalculator.newInstance();

    // 生成的“z”数组将成为默认标量，因此平面映射器将按“z”着色：
    simpleFilter.setInputConnection(planeSource.getOutputPort());
    // 更新VTK场景
    model.renderer.resetCamera();
    model.renderer.resetCameraClippingRange();

    switch (datatype) {
        case "重力观测数据反演（多约束反演）":
        case "重力观测数据反演（三维正则，参考模型约束）":
        case "重力观测数据反演（参考模型-全变分约束）":
        case "MCMC反演":
        case "MCMC反演（参考模型约束）":
        case "三维断层模型正演":
        case "边缘识别":
        case "曲化平":
        case "数据扩边":
        case "最小曲率补空白":
            for (let i = 0; i < yLength; i++) {
                array1[i] = arrs.splice(0, xLength)
            }
            simpleFilter.setFormula({
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
                    for (let i = 0; i < data.length; i++) {
                        let index = yR.reverse().indexOf(yAxis[i]) * xLength + xR.indexOf(xAxis[i]);
                        z[index] = array1[yR.reverse().indexOf(yAxis[i])][xR.indexOf(xAxis[i])];
                    }
                    arraysOut.forEach(x => x.modified());
                }
            })
            break;
        case "重力异常计算":
        case "四面体模型单元正演":
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
            if (datatype === "重力异常计算") {
                yAxis = yAxis.reverse();
            }
            simpleFilter.setFormula({
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
                    for (let i = 0; i < data.length; i++) {
                        let index = yR.indexOf(yAxis[i]) * xLength + xR.indexOf(xAxis[i]);
                        z[index] = data[i];
                    }
                    arraysOut.forEach(x => x.modified());
                }
            })
            break;
        default:
            if (datatype === "2d" &&
                [
                    "大地电磁面波 (MT-Surf Field)",
                    "大地电磁面波 (MT-Surf)",
                    "接收函数反演 (ReceiverFunc Inversion)",
                    "接收函数-面波联合反演 (ReceiverFunc-Surf Inversion)",
                    "ERPS USTC",
                    "地震背景噪声成像(ERPS USTC)",
                    "相关分析联合反演",
                    "模糊聚类联合反演",
                    "基于数据空间的相关分析反演",
                    "交叉梯度联合反演",
                    "FCRM联合反演",
                    "模糊C回归聚类",
                    "最小二乘逆时偏移 (LSRTM)"].includes(appName)
            ) {
                simpleFilter.setFormula({
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
                        for (let i = 0; i < data.length; i++) {
                            let index = yR.indexOf(yAxis[i]) * xLength + xR.indexOf(xAxis[i]);
                            z[index] = data[i];
                        }
                        arraysOut.forEach(x => x.modified());
                    }
                })
            } else if (datatype === "2d" && (appName === "保幅超分辨率反演(Super Resolution ITSMF)" || appName === "保幅超分辨率反演 (Super Resolution Seismic Imaging)")) {
                arrs = arrs.reverse();
                for (let i = 0; i < yLength; i++) {
                    array1[i] = arrs.splice(0, xLength)
                }
                simpleFilter.setFormula({
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
                        for (let i = 0; i < data.length; i++) {
                            let index = yR.indexOf(yAxis[i]) * xLength + xR.indexOf(xAxis[i]);
                            z[index] = array1[yR.reverse().indexOf(yAxis[i])][xR.indexOf(xAxis[i])];
                        }
                        arraysOut.forEach(x => x.modified());
                    }
                })
            } else if (datatype === "2d" && (appName === "二维深度神经网络地震反演（2D-DNN-SeismicInv）" || appName === "深度神经网络地震反演(DNN-SeismicInv Field)")) {
                for (let i = 0; i < xLength; i++) {
                    array1[i] = arrs.splice(0, yLength)
                }
                for (let i = 0; i < yLength; i++) {
                    array[i] = []
                    for (let j = 0; j < xLength; j++) {
                        array[i][j] = array1[j][i]
                    }
                }
                array.reverse()
                simpleFilter.setFormula({
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
                        for (let i = 0; i < data.length; i++) {
                            let index = yR.reverse().indexOf(yAxis[i]) * xLength + xR.indexOf(xAxis[i]);
                            z[index] = array[yR.reverse().indexOf(yAxis[i])][xR.indexOf(xAxis[i])];
                        }
                        arraysOut.forEach(x => x.modified());
                    }
                });
            } else {
                for (let i = 0; i < xLength; i++) {
                    array1[i] = arrs.splice(0, yLength)
                }
                for (let i = 0; i < yLength; i++) {
                    array[i] = []
                    for (let j = 0; j < xLength; j++) {
                        array[i][j] = array1[j][i]
                    }
                }
                simpleFilter.setFormula({
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
                        for (let i = 0; i < data.length; i++) {
                            let index = yR.reverse().indexOf(yAxis[i]) * xLength + xR.indexOf(xAxis[i]);
                            z[index] = array[yR.reverse().indexOf(yAxis[i])][xR.indexOf(xAxis[i])];
                        }
                        arraysOut.forEach(x => x.modified());
                    }
                });
            }
            break;
    }
    mapper.setInputConnection(simpleFilter.getOutputPort());

    planeSource.set({ "xResolution": xLength - 1 });
    planeSource.set({ "yResolution": yLength - 1 });
    planeSource.set({ "Origin": cen });
    planeSource.set({ "Point1": [xLength + cen[0], cen[1], cen[2]] });
    planeSource.set({ "Point2": [cen[0], -yLength + cen[1], cen[2]] });
    // let cen = planeSource.getCenter();
    actor.setMapper(mapper);
    let pointDatas = [...data];
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
    if (appName === "保幅超分辨率反演(Super Resolution ITSMF)" || appName === "保幅超分辨率反演 (Super Resolution Seismic Imaging)") {
        min = 1e-9;
        max = 5e-8;
    }
    if (appName === "同步挤压") {
        if (min === 0) {
            min = 1e-4;
            max = 5e-4;
        } else {
            min = 1e-9;
            max = 5e-8;
        }
    }
    lookupTable.setMappingRange(min, max);
    mapper.setLookupTable(lookupTable);
    let pointLeft = planeSource.getOrigin();
    let planeCenter = planeSource.getCenter();
    let xlon = planeCenter[0] - pointLeft[0];
    let ylon = pointLeft[1] - planeCenter[1];
    model.renderer.addActor(actor);
    model.actState.push({
        min,
        max,
        xlon: xlon,
        ylon: ylon,
        planeCenter: planeCenter,
        pointLeft: pointLeft,
        xAxis: xR,
        yAxis: yR
    });
    _this.setState({
        xAxis: xR,
        yAxis: yR
    });
}

// 显示colorBar刻度
export const Sfn = (model, mode, min, max, xlon, ylon, planeCenter, pointLeft, container, theme, datatype, canvasClass, appName) => {
    let ScalPoint = [];
    let ScalCell = [];
    let ScalPointData = [];
    let rulerScal = [];
    const rulers = [];
    switch (datatype) {
        case "数据网格化":
        case "重力数据求偏导":
        case "坐标投影":
        case "六面体模型重力异常正演":
        case "六面体复杂模型构建及重力异常正演":
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
        case "MCMC反演":
        case "MCMC反演（参考模型约束）":
        case "重力观测数据反演（三维正则，参考模型约束）":
        case "重力观测数据反演（参考模型-全变分约束）":
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
            ScalPoint = [
                pointLeft[0] + 2.3 * xlon, planeCenter[1] + xlon / 2, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] + xlon / 2, 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1] + 2 * xlon / 5, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] + 2 * xlon / 5, 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1] + 3 * xlon / 10, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] + 3 * xlon / 10, 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1] + xlon / 5, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] + xlon / 5, 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1] + xlon / 10, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] + xlon / 10, 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1], 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1], 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1] - xlon / 10, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] - xlon / 10, 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1] - xlon / 5, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] - xlon / 5, 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1] - 3 * xlon / 10, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] - 3 * xlon / 10, 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1] - 2 * xlon / 5, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] - 2 * xlon / 5, 0,
                pointLeft[0] + 2.3 * xlon, planeCenter[1] - xlon / 2, 0,
                pointLeft[0] + 2.35 * xlon, planeCenter[1] - xlon / 2, 0
            ]
            for (let i = 0; i < ScalPoint.length - 2; i++) {
                ScalCell.push(3, i, i + 1, i + 2)
            }
            for (let i = 0; i < 11; i++) {
                rulers.push({
                    xLength: Math.abs(xlon) * 0.05,
                    yLength: Math.abs(xlon) * 0.005,
                    zLength: 0,
                    center: [ScalPoint[i * 6 + 3], ScalPoint[i * 6 + 4], 0],
                });
                rulerScal.push(ScalPoint[i * 6 + 3] + 0.05 * xlon, ScalPoint[i * 6 + 4], 0);
            }
            for (let i = 0; i <= 11; i++) {
                ScalPointData.push(max - (max - min) / 10 * i, max - (max - min) / 10 * i)
            }
            break;
        case "数据去趋势":
            ScalPoint = [
                pointLeft[0] + 2.1 * xlon, planeCenter[1] + xlon / 2, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] + xlon / 2, 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1] + 2 * xlon / 5, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] + 2 * xlon / 5, 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1] + 3 * xlon / 10, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] + 3 * xlon / 10, 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1] + xlon / 5, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] + xlon / 5, 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1] + xlon / 10, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] + xlon / 10, 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1], 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1], 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1] - xlon / 10, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] - xlon / 10, 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1] - xlon / 5, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] - xlon / 5, 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1] - 3 * xlon / 10, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] - 3 * xlon / 10, 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1] - 2 * xlon / 5, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] - 2 * xlon / 5, 0,
                pointLeft[0] + 2.1 * xlon, planeCenter[1] - xlon / 2, 0,
                pointLeft[0] + 2.15 * xlon, planeCenter[1] - xlon / 2, 0
            ];
            for (let i = 0; i < ScalPoint.length - 2; i++) {
                ScalCell.push(3, i, i + 1, i + 2)
            }
            for (let i = 0; i < 11; i++) {
                rulers.push({
                    xLength: Math.abs(xlon) * 0.05,
                    yLength: Math.abs(xlon) * 0.005,
                    zLength: 0,
                    center: [ScalPoint[i * 6 + 3], ScalPoint[i * 6 + 4], 0],
                });
                rulerScal.push(ScalPoint[i * 6 + 3] + 0.05 * xlon, ScalPoint[i * 6 + 4], 0);
                ScalPointData.push(max - (max - min) / 10 * i, max - (max - min) / 10 * i)
            };
            break;
        default:
            ScalPoint = [
                pointLeft[0] + 0.5 * ylon, planeCenter[1] + ylon / 2, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] + ylon / 2, 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1] + 2 * ylon / 5, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] + 2 * ylon / 5, 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1] + 3 * ylon / 10, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] + 3 * ylon / 10, 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1] + ylon / 5, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] + ylon / 5, 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1] + ylon / 10, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] + ylon / 10, 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1], 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1], 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1] - ylon / 10, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] - ylon / 10, 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1] - ylon / 5, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] - ylon / 5, 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1] - 3 * ylon / 10, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] - 3 * ylon / 10, 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1] - 2 * ylon / 5, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] - 2 * ylon / 5, 0,
                pointLeft[0] + 0.5 * ylon, planeCenter[1] - ylon / 2, 0,
                pointLeft[0] + 0.55 * ylon, planeCenter[1] - ylon / 2, 0
            ]
            for (let i = 0; i < ScalPoint.length - 2; i++) {
                ScalCell.push(3, i, i + 1, i + 2)
            }
            for (let i = 0; i < 11; i++) {
                rulers.push({
                    xLength: Math.abs(ylon) * 0.05,
                    yLength: Math.abs(ylon) * 0.005,
                    zLength: 0,
                    center: [ScalPoint[i * 6 + 3], ScalPoint[i * 6 + 4], 0],
                });
                rulerScal.push(ScalPoint[i * 6 + 3] + 0.15 * ylon, ScalPoint[i * 6 + 4], 0);
            }
            for (let i = 0; i <= 10; i++) {
                ScalPointData.push(max - (max - min) / 10 * i, max - (max - min) / 10 * i)
            }
            break;
    }
    // lookupTable.setHueRange(-1, 1);
    // lookupTable.setSaturationRange(0, 0);
    // lookupTable.setSaturationRange(1, 1);
    // lookupTable.setValueRange(-1,0.5);
    // lookupTable.setValueRange(-0.4, 30);
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // const lut1 = vtkColorTransferFunction.newInstance();
    // //预设色标颜色样式
    // const preset = vtkColorMaps.getPresetByName("X Ray");
    // //应用ColorMap
    // lut1.applyColorMap(preset);
    // lut1.updateRange();
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    const planeSource1 = vtkPlaneSource.newInstance();
    const lookupTable = vtkColorTransferFunction.newInstance();
    const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
    lookupTable.applyColorMap(preset);  //应用ColorMap
    const mapper1 = vtkMapper.newInstance({ lookupTable });
    const scalarBars = vtkActor.newInstance();
    mapper1.setInputConnection(planeSource1.getOutputPort());
    scalarBars.setMapper(mapper1);
    let polydata = {
        vtkClass: 'vtkPolyData',
        points: {
            vtkClass: 'vtkPoints',
            dataType: 'Float32Array',
            numberOfComponents: 3,
            values: ScalPoint,
        },
        polys: {
            vtkClass: 'vtkCellArray',
            dataType: 'Float32Array',
            values: ScalCell,
        },
        pointData: {
            vtkClass: 'vtkDataSetAttributes',
            activeScalars: 0,
            arrays: [{
                data: {
                    vtkClass: 'vtkDataArray',
                    name: 'pointScalars',
                    dataType: 'Float32Array',
                    values: ScalPointData,
                },
            }],
        }
    }
    mapper1.setInputData(vtk(polydata));
    mapper1.setScalarRange(min, max);
    if (mode !== "DEFAULT") {
        const lut = vtkColorTransferFunction.newInstance();
        const preset = vtkColorMaps.getPresetByName(mode);   //预设色标颜色样式
        lut.applyColorMap(preset);  //应用ColorMap
        lut.updateRange();
        mapper1.setLookupTable(lut)
        model.lookupTable1 = lut;
    }
    const scaleDataRuler = vtkAppendPolyData.newInstance();
    scaleDataRuler.setInputData(vtk({
        vtkClass: 'vtkPolyData',
    }));
    for (let i = 0; i < rulers.length; i++) {
        const cubeSourceRulerX = vtkCubeSource.newInstance(rulers[i]);
        const x_ruler = cubeSourceRulerX.getOutputData();
        scaleDataRuler.addInputData(x_ruler);
    }
    const psMapper = vtkPixelSpaceCallbackMapper.newInstance();
    psMapper.setInputData(vtk({
        vtkClass: 'vtkPolyData',
        points: {
            vtkClass: 'vtkPoints',
            dataType: 'Float32Array',
            numberOfComponents: 3,
            values: rulerScal,
        },
    }));
    const textCanvas = document.createElement('canvas');
    textCanvas.style.position = "absuloat";
    textCanvas.classList.add(canvasClass);
    container.current.children[0].appendChild(textCanvas);
    let dims = document.querySelector(".vtk-container").getBoundingClientRect();
    model.dims = dims;
    textCanvas.setAttribute('width', dims.width * window.devicePixelRatio);
    textCanvas.setAttribute('height', dims.height * window.devicePixelRatio);
    let textCtx = textCanvas.getContext('2d');
    model.textCtx = textCtx;
    let fixed = (num) => {
        num = Number(num);
        let num_c = Math.abs(num);
        if (String(num).indexOf("e-") > -1) {
            let d = String(num);
            let s = d.split("e-");
            let suffix = s[1];
            return Number(s[0]).toFixed(1) + "e-" + suffix
        } else if (String(num).indexOf("e") > -1) {
            let d = String(num);
            let s = d.split("e");
            let suffix = s[1];
            return Number(s[0]).toFixed(1) + "e" + suffix
        } else {
            let str = String(num_c);
            if (str.indexOf(".") > -1) {
                let len = str.split(".")[1].length;
                if (len > 6 && num_c < 0.00001) {
                    return num.toFixed(6)
                } else if (len > 5 && num_c >= 0.00001 && num_c < 0.0001) {
                    return num.toFixed(5)
                } else if (len > 4 && num_c >= 0.0001 && num_c < 0.001) {
                    return num.toFixed(4)
                } else if (len > 3 && num_c >= 0.001 && num_c < 0.01) {
                    return num.toFixed(3)
                } else if (len > 2 && num_c >= 0.01 && num_c < 0.1) {
                    return num.toFixed(2)
                } else if (len > 1 && num_c >= 0.1) {
                    return num.toFixed(1)
                } else {
                    return num
                }
            } else {
                return num
            }
        }
    }
    //色标卡值
    psMapper.setCallback((coordsList) => {
        let dims = {};
        if (document.querySelector(".vtk-container")) dims = document.querySelector(".vtk-container").getBoundingClientRect();
        textCtx.clearRect(0, 0, dims.width * window.devicePixelRatio, dims.height * window.devicePixelRatio);
        coordsList.forEach((xy, idx) => {
            textCtx.font = `${14 * window.pixelRatio}px serif`
            textCtx.fillStyle = theme
            textCtx.textAlign = 'left';
            textCtx.textBaseline = 'middle';
            if (idx < 11) {
                textCtx.fillText(`${fixed(ScalPointData[idx * 2])}`, xy[0], dims.height * window.devicePixelRatio - xy[1]);
            }
        });
    });
    const textActor = vtkActor.newInstance();
    textActor.setMapper(psMapper);
    model.textActor = textActor;
    model.renderer.addActor(model.textActor);
    const rulersmapper = vtkMapper.newInstance();
    const rulersactor = vtkActor.newInstance();
    rulersmapper.setInputConnection(scaleDataRuler.getOutputPort());
    rulersactor.setMapper(rulersmapper);
    model.renderer.addActor(scalarBars);
    model.renderer.addActor(rulersactor);
}
// 显示矢量
export const showVector = (vector, model, points, vectorData, lut1, min, max, ArrowSize) => {
    if (vector === true) {
        let vector = vtk({
            vtkClass: 'vtkPolyData',
            points: {
                vtkClass: 'vtkPoints',
                dataType: 'Float32Array',
                numberOfComponents: 3,
                values: points,
            },
            pointData: {
                vtkClass: 'vtkDataSetAttributes',
                activeScalars: 0,
                arrays: [{
                    data: {
                        vtkClass: 'vtkDataArray',
                        name: 'pointVectors',
                        dataType: 'Float32Array',
                        numberOfComponents: 3,
                        values: vectorData,
                    },
                }],
            }
        });
        const vecMapper1 = vtkGlyph3DMapper.newInstance();
        vecMapper1.setLookupTable(lut1);
        vecMapper1.setInputData(vector, 0);
        const arrowSource = vtkArrowSource.newInstance();
        vecMapper1.setInputConnection(arrowSource.getOutputPort(), 1);
        vecMapper1.setOrientationArray('pointVectors');
        vecMapper1.setScalarRange(min, max);
        vecMapper1.setScaleFactor(ArrowSize)
        const vecActor1 = vtkActor.newInstance();
        vecActor1.setMapper(vecMapper1);
        model.renderer.addActor(vecActor1);
        model.vectorActor = vecActor1;
    } else {
        if (model.vectorActor) {
            model.renderer.removeActor(model.vectorActor);
        }
    }
}
// 读取json
export const readJson = (filePath, _this, data, fileName, type) => {
    let xhr = new XMLHttpRequest()
    xhr.open('GET', '/data' + filePath, true);
    xhr.responseType = 'json';
    xhr.send();
    xhr.onreadystatechange = (e) => {
        if (xhr.readyState === 2) {
            var dom = document.createElement('div');
            dom.setAttribute('id', 'loading');
            // console.log(document.getElementsByClassName('views'))
            // document.getElementsByClassName('views')[0].appendChild(dom);
            ReactDOM.render(<Spin tip="加载中..." size="large" />, dom);
        }
        if (xhr.readyState === 4) {
            // cookie.save('filename', fileName);
            // setCookie('filename', fileName)
            data = JSON.stringify(xhr.response)
            _this.props.dispatch(actions.getData(data));
            // document.getElementsByClassName('views')[0].removeChild(document.getElementById('loading'));
        }
    };
}