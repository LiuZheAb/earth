import React, { Component } from 'react';
import { Provider } from 'react-redux';
import store from './redux/store/index';
import Vtk from './components/indexContainer';
import CsvView1DContainer from './components/echartsView/view_51&52/csvView_1d';
import CsvViewMaltiLineContainer from './components/echartsView/view_51&52/csvView_malti_line';
import CsvViewLineContainer from './components/echartsView/view_421&422/csvView_line';
import CsvViewSingleLineContainer from './components/echartsView/view_421&422/csvView_line3';
import CsvViewMatrixContainer from './components/echartsView/view_421&422/csvView_matrix';
import "./index.css";

export default class vis extends Component {
    render() {
        let { data, appName, datatype } = this.props;
        let visComponent = null;
        if (["混合谱元法 (SEM)", "混合谱元法 (MSEM)", "频域电磁联合反演"].includes(appName)) {
            if (datatype === "line") {
                visComponent = <CsvViewLineContainer data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "2d") {
                // visComponent = <Vtk data={data} datatype={datatype} appName={appName} />;
                visComponent = <CsvViewMatrixContainer data={data} datatype={datatype} appName={appName} />;
            } else if (datatype === "single") {
                visComponent = <CsvViewSingleLineContainer data={data} datatype={datatype} appName={appName} />;
            }
        } else {
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