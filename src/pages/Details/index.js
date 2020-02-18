//应用详情页
import React from 'react';
import { Layout, Button, Menu, Select, Radio, Checkbox, Input, message, Card, Col, Row, Form, Upload, Icon, Empty } from 'antd';
import './index.css'
// eslint-disable-next-line
import { HashRouter as Router, Route, Link } from "react-router-dom";
import { createHashHistory } from 'history';
import axios from 'axios';
import IconFont from '../../assets/IconFont';
import { apiurl } from '../../assets/urls';
import checkNullvalue from "../../utils/checkNullvalue";
// import Vtkview from "../../components/Vtkview";
import Listener from "../../components/Listener";
import Contour from "../../components/Contour";
import { getCookie } from '../../utils/cookies';

const { Content, Header, Sider } = Layout;
const history = createHashHistory();
const { Option } = Select;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const { TextArea } = Input;

class Details extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            collapsed: true,// 值为true隐藏，false为显示。默认值为true。
            textBoxs: [],
            selectBoxs: [],
            radioBoxs: [],
            checkBoxs: [],
            textAreas: [],
            uploadBoxs: [],
            appName: sessionStorage.getItem("appName") ? sessionStorage.getItem("appName") : "",
            resMessage: "",
            loading: false,
            content: <Empty style={{ height: "250px" }} description="程序未运行" />,
            listener: <Empty style={{ height: "250px" }} description="程序未运行" />
            // activeData: getActiveData()
        };
        this.importJson = this.importJson.bind(this);
        this.setApp = this.setApp.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    };
    timer = undefined;
    requestRef = undefined;
    componentDidMount() {
        document.title = "详情";
        const _this = this;
        //根据应用名称向服务端请求并获取数据
        if (_this.state.appName) {
            axios({
                method: 'post',
                url: apiurl + 'render',
                data: {
                    projectName: _this.state.appName,
                    userName: getCookie("userName") ? getCookie("userName") : ""
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (response) {
                let appParams = response.data.projectparams;
                _this.setState({
                    textBoxs: appParams.texts,
                    selectBoxs: appParams.selects,
                    radioBoxs: appParams.radios,
                    checkBoxs: appParams.checkBoxs,
                    textAreas: appParams.textAreas,
                    uploadBoxs: appParams.uploadBoxs,
                });
            })
                .catch(function (error) {
                    message.error("服务器无响应");
                });
        } else {
            message.error("未获取到应用名称,请返回首页");
        };
    };
    //改变sidebar收缩状态时调用
    toggle = () => {
        let { collapsed } = this.state;
        this.setState({
            collapsed: !collapsed,
        });
    };
    /**
     * 获取textBoxs当前输入的值，并把值赋给textBoxs数组
     * @param {*} index input框的序号
     * @param {*} value 输入的值
     */
    changeText(index, e) {
        let { textBoxs } = this.state;
        textBoxs[index].currentValue = e.target.value;
        this.setState({
            textBoxs: textBoxs
        });
    };
    //获取selectBoxs当前所选项的值，并把值赋给selectBoxs数组
    changeOption(index, value) {
        let { selectBoxs } = this.state;
        selectBoxs[index].currentValue = value;
        this.setState({
            selectBoxs: selectBoxs
        });
    };
    //获取radioBoxs当前所选项的值，并把值赋给radioBoxs数组
    changeRadio(index, e) {
        let { radioBoxs } = this.state;
        radioBoxs[index].currentValue = e.target.value;
        this.setState({
            radioBoxs: radioBoxs
        });
    };
    //获取checkBoxs当前所选项的值，并把值赋给checkBoxs数组
    changeCheck(index, checkedValues) {
        let { checkBoxs } = this.state;
        checkBoxs[index].currentValue = checkedValues;
        this.setState({
            checkBoxs: checkBoxs
        });
    };
    //获取textAreas当前所选项的值，并把值赋给textAreas数组
    changeTextarea(index, e) {
        let { textAreas } = this.state;
        textAreas[index].currentValue = e.target.value;
        this.setState({
            textAreas: textAreas
        });
    };
    changeUpload(index, info) {
        if (info.file.status === "done") {
            let { uploadBoxs } = this.state;
            uploadBoxs[index].currentValue = info.file.name;
            this.setState({ uploaded: true, uploadBoxs: uploadBoxs });
            message.success(`${info.file.name} 上传成功`);
        } else if (info.file.status === "error") {
            message.error(`${info.file.name} 上传失败`);
            this.setState({ uploaded: false });
        };
    };
    //点击打开时调用  
    importJson(e) {
        if (e.target.value) {
            //读取json
            let file = document.getElementById('file').files[0];
            const reader = new FileReader();
            //外层作用域的重新定义
            let _this = this;
            reader.readAsText(file);
            reader.onload = function () {
                var importJson1 = JSON.parse(reader.result);
                _this.setState({
                    textBoxs: importJson1.texts,
                    selectBoxs: importJson1.selects,
                    radioBoxs: importJson1.radios,
                    checkBoxs: importJson1.checkBoxs,
                    textAreas: importJson1.textAreas,
                    uploadBoxs: importJson1.uploadBoxs,
                });
            };
        };
    };
    /**
     * 项目json的创建，1 支持保存到本地 2 上传服务器保存项目json
     * @param {*} command 判断是保存还是上传
     */
    setApp(command) {
        //json格式化
        let { textBoxs, selectBoxs, radioBoxs, checkBoxs, textAreas, uploadBoxs } = this.state;
        if (checkNullvalue(textBoxs) && checkNullvalue(selectBoxs) && checkNullvalue(radioBoxs) && checkNullvalue(checkBoxs) && checkNullvalue(textAreas)) {
            let makeJson = `{ "texts" :${JSON.stringify(textBoxs)}
                ,"selects" :${JSON.stringify(selectBoxs)}
                ,"radios" :${JSON.stringify(radioBoxs)}
                ,"checkBoxs" :${JSON.stringify(checkBoxs)}
                ,"textAreas" :${JSON.stringify(textAreas)}
                ,"uploadBoxs" :${JSON.stringify(uploadBoxs)}}`;
            //保存到本地
            if (command === "download") {
                //虚拟dom实现下载   
                var elementA = document.createElement('a');
                elementA.download = +new Date() + ".json";//文件名
                //隐藏dom点不显示
                elementA.style.display = 'none';
                var blob = new Blob([makeJson]);//二进制
                elementA.href = URL.createObjectURL(blob);
                document.body.appendChild(elementA);
                elementA.click();
                document.body.removeChild(elementA);
            } else if (command === "upload") {//上传json文件
                if (JSON.stringify(textBoxs) === "[]" &&
                    JSON.stringify(selectBoxs) === "[]" &&
                    JSON.stringify(radioBoxs) === "[]" &&
                    JSON.stringify(checkBoxs) === "[]" &&
                    JSON.stringify(textBoxs) === "[]" &&
                    JSON.stringify(uploadBoxs) === "[]"
                ) {
                    alert("注意：您正在上传一个空的项目！");
                };
                let instance = axios.create({ headers: {} });
                instance.post('/dynamic', makeJson)
                    .then(res => { })
                    .catch(err => { });
            };
        };
    };
    handleSubmit(e) {
        e.preventDefault();
        //判断文件是否上传完成
        let _this = this;
        this.setState({
            loading: true
        });
        let { textBoxs, selectBoxs, radioBoxs, checkBoxs, textAreas, uploadBoxs, appName } = this.state;
        let params = {};
        function formatData(array) {
            if (array) {
                let len = array.length;
                for (let i = 0; i < len; i++) {
                    params[array[i].paramName] = array[i].currentValue;
                };
            };
        };
        let fileList = {};
        function formatFileData(array) {
            if (array) {
                let len = array.length;
                for (let i = 0; i < len; i++) {
                    fileList[array[i].paramName] = array[i].currentValue;
                };
            };
        };
        formatData(textBoxs);
        formatData(selectBoxs);
        formatData(radioBoxs);
        formatData(checkBoxs);
        formatData(textAreas);
        formatFileData(uploadBoxs);
        if (checkNullvalue(textBoxs) && checkNullvalue(selectBoxs) && checkNullvalue(uploadBoxs) && checkNullvalue(radioBoxs) && checkNullvalue(checkBoxs) && checkNullvalue(textAreas)) {
            axios({
                method: 'post',
                url: apiurl + 'compute',
                data: {
                    appName: appName,
                    params: params,
                    fileList: fileList
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function (response) {
                _this.setState({
                    resMessage: response.data.message,
                    loading: false,
                    content: 
                    // <Vtkview/>,
                    response.data.data ? <Contour data={response.data.data} /> : <Contour message={response.data.message} />,
                    listener: <Listener />
                });
            }).catch(function (error) {
                message.error("服务器无响应")
                _this.setState({
                    loading: false
                });
            });
        } else {
            _this.setState({
                loading: false
            });
        };
    };
    render() {
        const formItemLayout = {
            labelCol: {
                xs: { span: 24 },
                sm: { span: 6 },
            },
            wrapperCol: {
                xs: { span: 24 },
                sm: { span: 18 },
            },
        };
        const { appName, collapsed, textBoxs, selectBoxs, radioBoxs, checkBoxs, textAreas, uploadBoxs, loading, content, listener } = this.state;
        // const{getFieldDecorator}=this.props.form
        const uploadProps = {
            name: "uploadfile",
            action: apiurl + "upload",
            headers: {
                authorization: "authorization-text"
            },
            data: {
                project: appName
            }
        };
        return (
            <div className="details">
                <Header className="details-header">
                    <Button className="details-menu-btn" type="primary" onClick={this.toggle}>
                        <IconFont type="anticondaohang-caidan" style={{ fontSize: '24px', color: '#fff', marginLeft: '-3px' }} />
                    </Button>
                    <Link to="/home">
                        <div className="details-logo" title="综合地球物理反演与解释一体化平台">
                            <img src={require('../../assets/images/logo.png')} alt="IPIG" draggable="false" />
                            <span>综合地球物理反演与解释一体化平台</span>
                        </div>
                    </Link>
                    <span className="details-title">{appName}</span>
                    <IconFont className="details-quit" onClick={history.goBack} type="anticonfanhui" />
                </Header>
                <Sider
                    collapsible
                    trigger={null}
                    collapsed={collapsed}
                    className="details-sider">
                    <Menu className="details-menu" mode="inline">
                        <li className="ant-menu-item details-collapse">
                            <IconFont
                                type="anticonquit"
                                style={{ fontSize: '36px', margin: "0" }}
                                className="details-collapse-icon"
                                onClick={this.toggle} />
                        </li>
                        <Menu.Item key="1"><Link to="/newapp">新建</Link></Menu.Item>
                        <Menu.Item key="2" className="open-file" title="" onClick={this.toggle}><input id="file" type="file" accept=".json" onChange={this.importJson} />打开</Menu.Item>
                        <Menu.Item key="3" onClick={() => { this.setApp("download"); this.toggle() }}>保存</Menu.Item>
                        <Menu.Item key="4" onClick={() => { this.setApp("upload"); this.toggle() }}>上传</Menu.Item>
                    </Menu>
                </Sider>
                <Content className="details-content">
                    <Row style={{ height: "100%", width: "100%" }}>
                        <Col span={6} className="details-card">
                            <Card title="参数数据" bordered={false} className="params-card">
                                <Form {...formItemLayout} onSubmit={this.handleSubmit} className="details-form">
                                    {textBoxs === null ? null : textBoxs.map((textBox, index) => {
                                        return (
                                            <Form.Item label={textBox.paramName} key={index}>
                                                <Input min={0} step={1} value={textBox.currentValue} onChange={this.changeText.bind(this, index)} />
                                            </Form.Item>
                                        );
                                    })}
                                    {selectBoxs === null ? null : selectBoxs.map((selectBox, index) => {
                                        return (
                                            <Form.Item label={selectBox.paramName} key={index}>
                                                <Select onChange={this.changeOption.bind(this, index)} value={selectBox.currentValue}>
                                                    {selectBox.defaultValue.map((value, index2) => {
                                                        return (
                                                            <Option key={index2} value={value}>
                                                                {value}
                                                            </Option>
                                                        );
                                                    }
                                                    )}
                                                </Select>
                                            </Form.Item>
                                        );
                                    })}
                                    {uploadBoxs === null || uploadBoxs === undefined ? null : uploadBoxs.map((upload, index) => {
                                        return (
                                            <Form.Item label={upload.paramName} key={index}>
                                                <Upload {...uploadProps}
                                                    onChange={this.changeUpload.bind(this, index)}
                                                >
                                                    <Button type="default"><Icon type="upload" />上传文件</Button>
                                                </Upload>
                                            </Form.Item>
                                        );
                                    })}
                                    {radioBoxs === null ? null : radioBoxs.map((radioBox, index) => {
                                        return (
                                            <Form.Item label={radioBox.paramName} key={index}>
                                                <RadioGroup onChange={this.changeRadio.bind(this, index)} value={radioBox.currentValue}>
                                                    {radioBox.defaultValue.map((value, index2) => {
                                                        return (
                                                            <Radio key={index2} value={value}>
                                                                {value}
                                                            </Radio>
                                                        );
                                                    })}
                                                </RadioGroup>
                                            </Form.Item>
                                        );
                                    })}
                                    {checkBoxs === null ? null : checkBoxs.map((checkBox, index) => {
                                        return (
                                            <Form.Item label={checkBox.paramName} key={index}>
                                                <CheckboxGroup options={checkBox.defaultValue} value={checkBox.currentValue} onChange={this.changeCheck.bind(this, index)} />
                                            </Form.Item>
                                        );
                                    })}
                                    {textAreas === null ? null : textAreas.map((textArea, index) => {
                                        return (
                                            <Form.Item label={textArea.paramName} key={index}>
                                                <TextArea autoSize={{ minRows: 4, maxRows: 2000 }} cols={10} value={textArea.currentValue} onChange={this.changeTextarea.bind(this, index)} />
                                            </Form.Item>
                                        );
                                    })}
                                    <Row className="app-button">
                                        <Button type="primary" className="">帮助</Button>
                                        <Button type="primary" className="" htmlType="submit" loading={loading}>运行</Button>
                                    </Row>
                                </Form>
                            </Card>
                        </Col>
                        <Col span={8} className="details-card">
                            <Card title="运行监控" bordered={false}>
                                {listener}
                            </Card>
                        </Col>
                        <Col span={10} className="details-card">
                            <Card title="后处理显示" bordered={false} bodyStyle={{ padding: 0, overflow: "hidden" }}>
                                {content}
                            </Card>
                        </Col>
                    </Row>
                </Content >
            </div >
        );
    };
};

export default Form.create({ name: "details" })(Details);