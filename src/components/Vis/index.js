import React, { Component } from 'react';
import { Provider } from 'react-redux';
import store from './redux/store/index';
import Vtk from './components/indexContainer';
import CsvView1DContainer from './components/echartsView/view_51&52/csvView_line_single';
import CsvViewMaltiLineContainer from './components/echartsView/view_51&52/csvView_line_double';
import CsvViewLineContainer from './components/echartsView/view_421&422/csvView_line_25D&3D';
import CsvViewLineContainer2 from './components/echartsView/view_421&422/csvView_line_multiFile';
import CsvViewSingleLineContainer from './components/echartsView/view_421&422/csvView_line_single';
import CsvViewMatrixContainer from './components/echartsView/view_421&422/csvView_matrix';
import CsvViewMatrixContainer2 from './components/echartsView/view_421&422/csvView_matrix2';
import CsvViewMatrixContainer3 from './components/echartsView/view_421&422/csvView_matrix3';
import "./index.css";

export default class vis extends Component {
    render() {
        let { data, appName, datatype } = this.props;

        let visComponent = null;
        if (["混合谱元法 (SEM)", "混合谱元法 (MSEM)", "混合谱元法电磁正演 (MSEM)", "频域电磁联合反演", "极限学习机电磁联合反演"].includes(appName)) {
            if (datatype === "line_1") {
                visComponent = <CsvViewLineContainer data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "line_2") {
                visComponent = <CsvViewLineContainer2 data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "2d_1") {
                visComponent = <CsvViewMatrixContainer data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "2d_2") {
                visComponent = <CsvViewMatrixContainer2 data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "single") {
                visComponent = <CsvViewSingleLineContainer data={data} datatype={datatype} appName={appName} />;
            }
        } else if (["Super Resolution ITSMF", "超分辨率反演", "保幅超分辨率反演(Super Resolution ITSMF)", "超分辨率地震成像 (Super Resolution Seismic Imaging)"].includes(appName)) {
            visComponent = datatype === "2d_heatmap" ?
                <CsvViewMatrixContainer3 data={data} datatype={datatype} appName={appName} />
                :
                datatype === "1d" ?
                    <CsvView1DContainer data={data} datatype={datatype} appName={appName} />
                    :
                    <Vtk data={data} datatype={datatype} appName={appName} />;
        }
        else {
            if (appName === "线性求解器(实/复) (Linear Solver)" && datatype === "txt") {
                visComponent = <CsvViewMaltiLineContainer data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "1d" || datatype === "txt") {
                visComponent = <CsvView1DContainer data={data} datatype={datatype} appName={appName} />;
            } else {
                visComponent = <Vtk data={data} datatype={datatype} appName={appName} />;
            }
        }
        return (
            <Provider store={store} >
                {visComponent}
            </Provider>
        )
    }
}