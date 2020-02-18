//新建应用页面
import React from "react";
import { Form, Button, InputNumber, Select, Input, Upload, Icon, message, Row, Col, Modal, Result } from "antd";
import axios from "axios";
import { apiurl } from "../../assets/urls";
import "./index.css";
import { getCookie, getUserCookie } from '../../utils/cookies';

const { Option } = Select;

class NewApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            appName: "",
            module: "",
            path: "",
            paramNum: 0,
            params: [],
            uploaded: false,
            disabled: false,
            fileName: "",
            modules: [],
            langType: "",
            langTypes: [],
            inputType: ["text", "radio", "checkBox", "select", "textArea", "upload"],
            loading: false,
            visible: false,
            fileList: [],
            submitResult: {
                state: null,
                status: null,
                title: null,
            }
        };
        this.changeAppName = this.changeAppName.bind(this);
        this.changeModule = this.changeModule.bind(this);
        this.changeLangType = this.changeLangType.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
        this.changeParamNum = this.changeParamNum.bind(this);
        this.changePath = this.changePath.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.continue = this.continue.bind(this);
        this.reChangeAppName = this.reChangeAppName.bind(this);
        this.reUpload = this.reUpload.bind(this);
        this.appNameValidator = this.appNameValidator.bind(this);
    };
    componentDidMount() {
        document.title = "新建应用";
        this.setState({
            paramNum: 0
        });
        const _this = this;
        //获取模块列表
        axios.get(apiurl + "homelanguage")
            .then(function (response) {
                _this.setState({
                    modules: response.data.modules,
                    langTypes: response.data.langType
                });
            })
            .catch(function (error) {
                message.error("服务器无响应", 2);
            });
    };
    //获取输入框的内容
    changeAppName(e) {
        if (this.state.submitResult.state === 2) {
            let { submitResult } = this.state;
            submitResult.state = null;
            this.setState({
                submitResult: submitResult
            });
        };
        this.setState({ appName: e.target.value });
    };
    appNameValidator = (rule, value, callback) => {
        if (!value) {
            callback('请输入应用名称!');
        } else if (this.state.submitResult.state === 2) {
            callback('应用名称已存在!');
        } else (
            callback()
        );
    };
    //获取选项
    changeModule(value) {
        this.setState({ module: value });
    };
    changeLangType(value) {
        this.setState({ langType: value });
    };
    handleFileChange(info) {
        let fileList = [...info.fileList];
        fileList = fileList.slice(-1);
        this.setState({ fileList });
        if (info.file.status === "done") {
            message.success(`${info.file.name} 上传成功`);
            this.setState({ uploaded: true, fileName: info.file.name });
        } else if (info.file.status === "error") {
            message.error(`${info.file.name} 上传失败`);
            this.setState({ uploaded: false });
        };
    };
    changePath(e) {
        this.setState({ path: e.target.value });
    };
    //根据参数个数生成params数组
    changeParamNum(value) {
        let { params, paramNum } = this.state;
        //获取当前paramNum与前一个paramNum的差值
        let disValue = value - paramNum;
        if (disValue > 0) {
            for (let i = 0; i < disValue; i++) {
                params.push({});
            };
        } else {
            disValue = Math.abs(disValue);
            for (let i = 0; i < disValue; i++) {
                params.pop();
            };
        };
        this.setState({
            paramNum: value,
            params: params
        });
    };
    //获取参数名称
    changeParamName(index, e) {
        let { params } = this.state;
        params[index].name = e.target.value;
        this.setState({
            params: params
        });
    };
    //获取参数类型
    changeParamType(index, value) {
        let { params } = this.state;
        params[index].type = value;
        params[index].defaultValue = "";
        this.setState({
            params: params
        });
    };
    //获取参数默认值
    changeParamValue(index, e) {
        let defaultValue = [], value = e.target.value.toString().replace(/\uff0c/g, ","), { params } = this.state;
        if (value !== null) {
            //如果没有“,”，则输入的内容就是defaultValue
            if (value.indexOf(",") === -1) {
                defaultValue.push(value);
            } //如果有“,”，则将输入的内容按“,”分隔开
            else if (value.indexOf(",") > -1) {
                defaultValue = value.split(",");
            };
            //删除空值或逗号
            for (let i = 0; i < defaultValue.length; i++) {
                if (defaultValue[i] === "" || defaultValue[i] === null || typeof defaultValue[i] === undefined || defaultValue[i] === "," || defaultValue[i] === "，") {
                    defaultValue.splice(i, 1);
                    i = i - 1;
                }
            };
        }
        params[index].defaultValue = defaultValue;
        this.setState({
            params: params
        });
    };
    paramValueValidator = (index, rule, value, callback) => {
        if (!value) {
            callback('默认值不能为空!');
        } else {
            let hash = {}, defaultValue = this.state.params[index].defaultValue;
            for (let i = 0; i < defaultValue.length; i++) {
                if (hash[defaultValue[i]]) {
                    callback("不能有重复的选项，请修改");
                }
                hash[defaultValue[i]] = true;
            }
            callback();
        };
    };
    //提交应用数据时调用
    handleSubmit(e) {
        e.preventDefault();
        let { uploaded, appName, module, langType, params, path, fileName } = this.state;
        //判断文件是否上传完成
        if (uploaded) {
            this.props.form.validateFields({ force: true }, (err, values) => {
                let checkRepeatName = () => {
                    let array = [];
                    for (let i = 0; i < params.length; i++) {
                        array.push(params[i].name);
                    };
                    let hash = {};
                    for (let i = 0; i < array.length; i++) {
                        if (hash[array[i]]) {
                            message.error("参数名重复，请修改");
                            return true;
                        }
                        hash[array[i]] = true;
                    };
                    return false;
                };
                if (!err && !checkRepeatName() && getUserCookie()) {
                    let _this = this;
                    _this.setState({
                        loading: true
                    });
                    axios({
                        method: "post",
                        url: apiurl + "upload",
                        data: {
                            userName: getCookie("userName"),
                            appName: appName,
                            module: module,
                            langType: langType,
                            params: params,
                            path: path,
                            fileName: fileName
                        },
                        headers: {
                            "Content-Type": "application/json"
                        }
                    })
                        .then(function (response) {
                            if (response.data.state === 1) {
                                //提交成功后将button设置不可点
                                _this.setState({
                                    submitResult: {
                                        state: 1,
                                        status: "success",
                                        title: "提交成功",
                                    },
                                    disabled: true,
                                    loading: false,
                                    visible: true
                                });
                            } if (response.data.state === 2) {
                                //提交失败将button设置可点
                                _this.setState({
                                    submitResult: {
                                        state: 2,
                                        status: "error",
                                        title: "提交失败,应用名称已存在!"
                                    },
                                    disabled: false,
                                    loading: false,
                                    visible: true
                                });
                            } if (response.data.state === 0) {
                                //提交失败将button设置可点
                                _this.setState({
                                    submitResult: {
                                        state: 0,
                                        status: "error",
                                        title: "提交失败,您上传的文件不是docker镜像!"
                                    },
                                    disabled: false,
                                    loading: false,
                                    visible: true
                                });
                            };
                        })
                        .catch(function (error) {
                            _this.setState({
                                submitResult: {
                                    state: -1,
                                    status: "error",
                                    title: "提交失败"
                                },
                                disabled: false,
                                visible: false,
                                loading: true
                            });
                        });
                };
            });
        } else {
            message.error(`镜像未上传成功`);
        };
    }
    handleCancel = e => {
        this.setState({
            visible: false,
        });
    };
    continue() {
        this.props.form.resetFields();
        this.setState({
            visible: false,
            disabled: false,
            appName: "",
            module: "",
            path: "",
            paramNum: 0,
            params: [],
            fileList: []
        });
    };
    reChangeAppName() {
        this.props.form.validateFields({ force: true });
        this.setState({
            visible: false,
            disabled: false,
        });
    };
    reUpload() {
        this.setState({
            visible: false,
            disabled: false,
            fileList: []
        });
    };
    setApp(app) {
        sessionStorage.setItem("appName", app);
        this.props.history.push("/details");
    };
    render() {
        const { getFieldDecorator } = this.props.form;
        const { appName, modules, langTypes, params, inputType, disabled, loading, visible, submitResult, fileList } = this.state;
        //上传文件
        const uploadProps = {
            name: "uploadfile",
            action: apiurl + "upload",
            headers: {
                authorization: "authorization-text"
            },
            data: {
                userName: getCookie("userName")
            },
            onChange: this.handleFileChange,
        };
        let resultExtra = null;
        switch (submitResult.state) {
            case 1:
                resultExtra = <>
                    <Button type="default" style={{ marginRight: "20px" }} onClick={() => { this.props.history.push("/home") }}>返回首页</Button>
                    <Button type="primary" style={{ marginRight: "20px" }} onClick={this.continue}>创建下一个应用</Button>
                    <Button type="primary" onClick={this.setApp.bind(this, appName)}>开始计算</Button>
                </>;
                break;
            case 2:
                resultExtra = <>
                    <Button type="default" style={{ marginRight: "20px" }} onClick={() => { this.props.history.push("/home") }}>返回首页</Button>
                    <Button type="primary" style={{ marginRight: "20px" }} onClick={this.reChangeAppName}>修改应用名</Button>
                </>;
                break;
            case 0:
                resultExtra = <>
                    <Button type="default" style={{ marginRight: "20px" }} onClick={() => { this.props.history.push("/home") }}>返回首页</Button>
                    <Button type="primary" style={{ marginRight: "20px" }} onClick={this.reUpload}>重新上传docker</Button>
                </>;
                break;
            case -1:
                resultExtra = <>
                    <Button type="primary" style={{ marginRight: "20px" }} onClick={() => { this.props.history.push("/home") }}>返回首页</Button>
                    <Button type="primary" style={{ marginRight: "20px" }} onClick={this.continue}>创建下一个应用</Button>
                </>;
                break;
            default:
                break;
        };
        return (
            <div className="newapp box-shadow">
                <Form onSubmit={this.handleSubmit}>
                    <Row gutter={20}>
                        <Col xs={7} className="appProps" style={params.length === 0 ? { margin: "0 auto", float: "none" } : null}>
                            <Form.Item label="应用名称">
                                {getFieldDecorator("appName", {
                                    rules: [{ validator: this.appNameValidator }]
                                })(
                                    <Input placeholder="请输入应用名称" onChange={this.changeAppName} />
                                )}
                            </Form.Item>
                            <Form.Item label="注册应用模块">
                                {getFieldDecorator("module", {
                                    rules: [{ required: true, message: "请选择应用模块!" }]
                                })(
                                    <Select onChange={this.changeModule} placeholder="--请选择模块--">
                                        {modules.map((module, index) => {
                                            return (
                                                <Option value={index + 1} key={index}>
                                                    {module}
                                                </Option>
                                            );
                                        })}
                                    </Select>
                                )}
                            </Form.Item>
                            <Form.Item label="程序语言类型">
                                {getFieldDecorator("langTypes", {
                                    rules: [{ required: true, message: "请选择程序语言类型!" }]
                                })(
                                    <Select onChange={this.changeLangType} placeholder="--请选择类型--">
                                        {langTypes.map((langType, index) => {
                                            return (
                                                <Option value={langType} key={index}>
                                                    {langType}
                                                </Option>
                                            );
                                        })}
                                    </Select>
                                )}
                            </Form.Item>
                            <Form.Item label="上传镜像">
                                {getFieldDecorator("appUpload", {
                                    rules: [{ required: true, message: "请上传镜像" }],
                                    validateTrigger: "onChange"
                                })(
                                    <Upload {...uploadProps} fileList={fileList}>
                                        <Button>
                                            <Icon type="upload" /> 点击上传镜像
                                        </Button>
                                    </Upload>
                                )}
                            </Form.Item>
                            <Form.Item label="运行路径">
                                {getFieldDecorator("imgUrl", {
                                    rules: [{ required: true, message: "请输入运行路径!" }]
                                })(
                                    <Input placeholder="请输入运行路径" onChange={this.changePath} />
                                )}
                            </Form.Item>
                            <Form.Item label="参数个数">
                                {getFieldDecorator("paramNum", {
                                    rules: [{ required: true, message: "请输入参数个数!" }]
                                })(
                                    <InputNumber onChange={this.changeParamNum} min={0} />
                                )}
                            </Form.Item>
                            {params.length === 0 && (
                                <Form.Item className="newapp-button" wrapperCol={{ xs: { span: 4, offset: 10 }, sm: { span: 4, offset: 10 } }}>
                                    {disabled ?
                                        <Button type="primary" htmlType="submit" disabled>
                                            您已提交
                                        </Button>
                                        :
                                        <Button type="primary" htmlType="submit" loading={loading}>
                                            提交应用
                                        </Button>
                                    }
                                </Form.Item>
                            )}
                        </Col>
                        <Col xs={17}>
                            <div className="paramsList">
                                {/* 根据params数组生成参数列表 */}
                                {params.map((param, index) => {
                                    return (
                                        // eslint-disable-next-line
                                        <div key={index} style={{ display: "flex", display: "-webkit-flex" }}>
                                            <div className="paramLabel">
                                                <label htmlFor="">{`参数  ${index + 1}：`}</label>
                                            </div>
                                            <div className="paramInput">
                                                <Row gutter={10}>
                                                    <Col xs={params[index].type === "radio" || params[index].type === "checkBox" || params[index].type === "select" ? 8 : 12}>
                                                        <Form.Item className="paramName" key={`${index}Name`}>
                                                            {getFieldDecorator(`${index}Name`, {
                                                                rules: [
                                                                    {
                                                                        required: true,
                                                                        message: `请输入参数 ${index + 1}的名称!`
                                                                    }
                                                                ]
                                                            })(
                                                                <Input placeholder={`请输入参数 ${index + 1}的名称!`} onChange={this.changeParamName.bind(this, index)} />
                                                            )}
                                                        </Form.Item>
                                                    </Col>
                                                    <Col xs={params[index].type === "radio" || params[index].type === "checkBox" || params[index].type === "select" ? 8 : 12}>
                                                        <Form.Item className="paramType" key={`${index}Type`}>
                                                            {getFieldDecorator(`${index}Type`, {
                                                                rules: [
                                                                    {
                                                                        required: true,
                                                                        message: `请选择参数 ${index + 1}的类型!`
                                                                    }
                                                                ]
                                                            })(
                                                                <Select onChange={this.changeParamType.bind(this, index)} placeholder="--请选择参数类型--">
                                                                    {inputType.map((type, index) => {
                                                                        return (
                                                                            <Option value={type} key={index}>
                                                                                {type === "text" ? "输入框" : (type === "radio" ? "单选框" : (type === "checkBox" ? "复选框" : (type === "select" ? "选择器" : (type === "textArea" ? "文本域" : (type === "upload" ? "上传文件" : null)))))}
                                                                            </Option>
                                                                        );
                                                                    })}
                                                                </Select>
                                                            )}
                                                        </Form.Item>
                                                    </Col>
                                                    {params[index].type === "radio" || params[index].type === "checkBox" || params[index].type === "select" ? (
                                                        <Col xs={8}>
                                                            <Form.Item className="paramValue" key={`${index}Value`}>
                                                                {getFieldDecorator(`${index}Value`, {
                                                                    rules: [{ validator: this.paramValueValidator.bind(this, index) }],
                                                                    getValueFromEvent: (event) => {
                                                                        return event.target.value.replace(/\uff0c/g, ",")
                                                                    },
                                                                })(
                                                                    <Input placeholder={`请输入参数的默认值,以“,”隔开`} onChange={this.changeParamValue.bind(this, index)} />
                                                                )}
                                                            </Form.Item>
                                                        </Col>
                                                    ) : null}
                                                </Row>
                                            </div>
                                        </div>
                                    );
                                })}
                                {params.length === 0 ? null : (
                                    <Form.Item className="newapp-button" wrapperCol={{ xs: { span: 2, offset: 6 } }}>
                                        {disabled ?
                                            <Button type="primary" htmlType="submit" disabled>
                                                您已提交
                                            </Button>
                                            :
                                            <Button type="primary" htmlType="submit" loading={loading}>
                                                提交应用
                                            </Button>
                                        }
                                    </Form.Item>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Form>
                <Modal
                    visible={visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    footer={null}
                >
                    <Result
                        status={submitResult.status}
                        title={submitResult.title}
                        style={{ padding: "10px" }}
                        extra={resultExtra}
                    />
                </Modal>
            </div>
        );
    };
};

export default Form.create({ name: "newapp" })(NewApp);