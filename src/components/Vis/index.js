import React, { Component } from 'react';
import { Provider } from 'react-redux';
import store from './redux/store/index';
import Vtk from './components/indexContainer';
import CsvView1DContainer from './components/echartsView/view_51&52/csvView_line_single';
import CsvViewMaltiLineContainer from './components/echartsView/view_51&52/csvView_line_double';
import CsvViewLineContainer from './components/echartsView/view_421&422/csvView_line_25D&3D';
import CsvViewLineContainer2 from './components/echartsView/view_421&422/csvView_line_multiFile';
import CsvViewSingleLineContainer from './components/echartsView/view_421&422/csvView_line_single';
import CsvViewSingleLineContainer2 from './components/echartsView/view_311/csvView_line_single';
import CsvViewMatrixContainer from './components/echartsView/view_421&422/csvView_matrix';
import CsvViewMatrixContainer2 from './components/echartsView/view_421&422/csvView_matrix2';
import CsvViewMatrixContainer3 from './components/echartsView/view_421&422/csvView_matrix3';
import "./index.css";

export default class vis extends Component {
    render() {
        let { data, appName, datatype, fileName } = this.props;
        let visComponent = null;
        if (["混合谱元法 (SEM)", "混合谱元法 (MSEM)", "混合谱元法电磁正演 (MSEM)", "极限学习机电磁联合反演(ELM_INV)", "极限学习机电磁联合反演"].includes(appName)) {
            if (datatype === "line_1") {
                visComponent = <CsvViewLineContainer data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "line_2") {
                visComponent = <CsvViewLineContainer2 data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "2d_1") {
                visComponent = <CsvViewMatrixContainer data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "2d_2") {
                visComponent = <CsvViewMatrixContainer2 data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "2d_3") {
                visComponent = <CsvViewMatrixContainer3 data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "single") {
                visComponent = <CsvViewSingleLineContainer data={data} datatype={datatype} appName={appName} />;
            }
        } else if (appName === "保幅超分辨率反演(Super Resolution ITSMF)") {
            visComponent =
                // datatype === "2d_heatmap" ?
                //     <CsvViewMatrixContainer3 data={data} datatype={datatype} appName={appName} />
                //     :
                datatype === "1d" ?
                    <CsvView1DContainer data={data} datatype={datatype} appName={appName} />
                    :
                    <Vtk data={data} datatype={datatype} appName={appName} fileName={fileName} />;
        } else if (appName === "线性求解器(实/复) (Linear Solver)" && datatype === "txt") {
            visComponent = <CsvViewMaltiLineContainer data={data} datatype={datatype} appName={appName} />;
        } else if (appName === "重磁正演(GM Forward Modeling)") {
            if (datatype === "圆盘模型正演" || datatype === "二维多边形正演" || datatype === "二维多边形反演") {
                visComponent = <CsvViewSingleLineContainer2 data={data} datatype={datatype} appName={appName} />;
            } else {
                visComponent = <Vtk data={data} datatype={datatype} appName={appName} fileName={fileName} />;
            }
        } else if (appName === "重磁反演（GM Inversion）") {
            if (datatype === "二维多边形反演") {
                visComponent = <CsvViewSingleLineContainer2 data={data} datatype={datatype} appName={appName} />;
            } else {
                visComponent = <Vtk data={data} datatype={datatype} appName={appName} fileName={fileName} />;
            }
        } else {
            if (datatype === "1d" || datatype === "txt") {
                visComponent = <CsvView1DContainer data={data} datatype={datatype} appName={appName} />;
            } else {
                visComponent = <Vtk data={data} datatype={datatype} appName={appName} fileName={fileName} />;
            }
        }
        return (
            <Provider store={store} >
                {visComponent}
            </Provider>
        )
    }
}