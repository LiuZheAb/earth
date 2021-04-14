import React, { Component } from 'react';
import { Provider } from 'react-redux';
import store from './redux/store/index';
import Vtk from './components/indexContainer';
import CsvView1DContainer from './csvView_1d';
import CsvViewLineContainer from './csvView_line';
import "./index.css";

export default class vis extends Component {
    render() {
        return (
            <Provider store={store} >
                {this.props.appName === "混合谱元法 (SEM)" ?
                    <CsvViewLineContainer data={this.props.data} datatype={this.props.datatype} appName={this.props.appName} />
                    : (this.props.datatype === "1d" ?
                        <CsvView1DContainer data={this.props.data} datatype={this.props.datatype} appName={this.props.appName} />
                        : <Vtk data={this.props.data} datatype={this.props.datatype} appName={this.props.appName} />)
                }
            </Provider>
        )
    }
}