import React, { Component } from 'react';
import axios from 'axios';
import { Table, Card, Form, Input, Button, Modal, message, Icon, Row, Col, Select, InputNumber } from 'antd';
import apiPromise from '../../assets/url.js';
import { getCookie } from "../../utils/cookies";
import "./index.css";

let api = "";
const { Option } = Select;
const { confirm } = Modal;

class EditApp extends Component {
    constructor(props) {
        super(props)
        this.state = {
            inputType: ["text", "radio", "checkBox", "select", "textArea", "upload"],
            appName: "",
            module: [],
            params: [],
            paramNum: 0,
            project: [],
            runPath: '',
            visible: false
        }
    }
    componentDidMount() {
        //获取应用数据
        apiPromise.then(res => {
            api = res.data.api;
            axios({
                method: 'post',
                url: api + 'project/check',
                responseType: 'json',
                data: {
                    userName: getCookie("userName")
                },
                headers: { 'Content-Type': 'application/json' },
            })
                .then(response => {
                    if (response.data.status) {
                        this.setState({
                            project: response.data.message
                        });
                    };
                })
                .catch(error => {
                    message.error("服务器无响应", 2);
                });
        });
    }
    //编辑应用
    changeAppname(e) {
        this.setState({ appname: e.target.value });
    };
    changeModel(value) {
        this.setState({ module: value });
    };
    changeParamNum(value) {
        let { params, paramNum } = this.state;
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
    changeParamName(index, e) {
        let { params } = this.state;
        params[index].name = e.target.value;
        this.setState({
            params: params
        });
    };
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
            } else if (value.indexOf(",") !== -1) {//如果有“,”，则将输入的内容按“,”分隔开
                defaultValue = value.split(",");
            }
            //删除空值或逗号
            for (let i = 0; i < defaultValue.length; i++) {
                if (defaultValue[i] === "" || defaultValue[i] === null || typeof defaultValue[i] === undefined || defaultValue[i] === "," || defaultValue[i] === "，") {
                    defaultValue.splice(i, 1);
                    i = i - 1;
                };
            };
        };
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
            // eslint-disable-next-line    
            for (let i in defaultValue) {
                if (hash[defaultValue[i]]) {
                    callback("不能有重复的选项，请修改");
                }
                hash[defaultValue[i]] = true;
            };
            callback();
        };
    };
    remove(index) {
        let { params } = this.state;
        params.splice(index, 1);
        this.setState({
            params,
            paramNum: params.length,
        });
    };
    openEditModule(index) {
        let project = this.state.project;
        let data = project[index];
        this.setState({
            appName: data.appName,
            module: data.module,
            runPath: data.runPath,
            params: JSON.parse(data.params),
            paramNum: JSON.parse(data.params).length,
            visible: true
        });
    };
    modalCancel = () => {
        this.setState({
            appName: '',
            module: '',
            runPath: '',
            params: [],
            paramNum: 0,
            visible: false
        });
    };
    handleOk = () => {
        // eslint-disable-next-line
        let { appName, module, params, runPath } = this.state;
        axios({
            method: 'post',
            url: api + 'project/check',
            data: {
                userName: getCookie("userName"),
                appName: appName,
                params: JSON.stringify(params),
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            message.success("修改成功", 2);
        }).catch(error => {
            message.error("服务器无响应", 2);
        });
    };
    showDeleteConfirm(index) {
        confirm({
            title: '确定删除这个应用吗?',
            content: '该操作无法撤回！',
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk: () => {
                let { project } = this.state;
                project.splice(index, 1);
                this.setState({ project });
            }
        });
    }
    render() {
        const { getFieldDecorator } = this.props.form;
        let { appName, paramNum, inputType, params, project, visible } = this.state;
        //应用列名
        const projectcolumns = [
            {
                title: '项目名称',
                dataIndex: 'appName',
                key: 'name'
            },
            {
                title: '操作',
                dataIndex: '',
                key: 'x',
                render: (text, record, index) =>
                    <>
                        <Icon type="edit" style={{ fontSize: '24px', marginRight: '20px', color: '#1890ff' }} onClick={this.openEditModule.bind(this, index)} />
                        <Icon type="delete" style={{ fontSize: '24px', color: '#1890ff' }} onClick={this.showDeleteConfirm.bind(this, index)} />
                    </>
            },
        ];
        //编辑应用表单布局
        const formItemLayout = {
            labelCol: {
                sm: { span: 4 },
            },
            wrapperCol: {
                sm: { span: 18 },
            },
        };
        // //文件上传
        // const props = {
        //     name: 'uploadfile',
        //     action: api + 'upload',
        //     onChange(info) {
        //         if (info.file.status !== 'uploading') {
        //         };
        //         if (info.file.status === 'done') {
        //             message.success(`${info.file.name} 上传成功`);
        //         } else if (info.file.status === 'error') {
        //             message.error(`${info.file.name} 上传失败`);
        //         };
        //     },
        // };
        return (
            <Card bordered={false} style={{ width: "100%", textAlign: "center" }} bodyStyle={{ padding: 0 }}>
                <Table rowKey={record => record.appName} columns={projectcolumns} dataSource={project} tableLayout="fixed" />
                <Modal
                    title="修改应用"
                    visible={visible}
                    onOk={this.handleOk}
                    onCancel={this.modalCancel}
                    okText='确认'
                    cancelText='取消'
                    destroyOnClose="true"
                    className="edit-modal"
                >
                    <Form {...formItemLayout} onSubmit={this.handleSubmitproject}>
                        <Form.Item label="应用名称" style={{ marginBottom: "10px" }}>
                            {getFieldDecorator('appname', {
                                rules: [{ required: true, message: '请输入应用名称!', }], initialValue: appName, validateTrigger: 'onSubmit', // 设置进行表单验证的时机为onSubmit
                            })(
                                <Col span={12}>
                                    <Input defaultValue={appName} onChange={this.changeAppname.bind(this)} />
                                </Col>
                            )}
                        </Form.Item>
                        {/* <Form.Item label="修改镜像">
                                    {getFieldDecorator('appupload', {
                                        rules: [{ required: true, message: '请上传镜像' }], validateTrigger: 'onSubmit', // 设置进行表单验证的时机为onSubmit
                                    })(
                                        <Upload {...props} fileList={{}}>
                                            <Button disabled>
                                                <Icon type="upload" /> 当前已上传镜像
                                                </Button>
                                        </Upload>,
                                    )}
                                </Form.Item> */}
                        <Form.Item label="参数个数" style={{ marginBottom: "10px" }}>
                            {getFieldDecorator('paramNum', {
                                rules: [{ required: true, message: '请输入参数个数!' }],
                                initialValue: paramNum,
                                validateTrigger: 'onSubmit', // 设置进行表单验证的时机为onSubmit
                            })(
                                <InputNumber onChange={this.changeParamNum.bind(this)} min={0}></InputNumber>
                            )}
                        </Form.Item>
                        {/* 根据params数组生成参数列表 */}
                        {params.map((param, index) => {
                            return (
                                <Form.Item key={index} label={`参数  ${index + 1}：`} style={{ marginBottom: "10px" }}>
                                    <Row gutter={10}>
                                        <Col xs={params[index].type === "radio" || params[index].type === "checkBox" || params[index].type === "select" ? 8 : 12}>
                                            <Form.Item style={{ marginBottom: "0" }}>
                                                {getFieldDecorator(`${index}Name`, {
                                                    rules: [
                                                        {
                                                            required: true,
                                                            message: `输入参数 ${index + 1}的名称`
                                                        }
                                                    ],
                                                    initialValue: param.name,
                                                    validateTrigger: 'onSubmit', // 设置进行表单验证的时机为onSubmit
                                                })(
                                                    <Input placeholder={param.name == null ? "输入参数名称" : param.name} onChange={this.changeParamName.bind(this, index)} />
                                                )}
                                            </Form.Item>
                                        </Col>
                                        <Col xs={params[index].type === "radio" || params[index].type === "checkBox" || params[index].type === "select" ? 8 : 12}>
                                            <Form.Item style={{ marginBottom: "0" }}>
                                                {getFieldDecorator(`${index}Type`, {
                                                    rules: [
                                                        {
                                                            required: true,
                                                            message: `请选择参数 ${index + 1}的类型!`
                                                        }
                                                    ],
                                                    initialValue: param.type,
                                                })(
                                                    <Select onChange={this.changeParamType.bind(this, index)} placeholder={param.type === "text" ? "输入框" : (param.type === "radio" ? "单选框" : (param.type === "checkBox" ? "复选框" : (param.type === "select" ? "选择器" : (param.type === "textArea" ? "文本域" : (param.type === "textArea" ? "文本域" : (param.type == null ? "请选择类型" : null))))))}>
                                                        {inputType.map((type, index) => {
                                                            return (
                                                                <Option value={type} key={index}>
                                                                    {type === "text" ? "输入框" : (type === "radio" ? "单选框" : (type === "checkBox" ? "复选框" : (type === "select" ? "选择器" : (type === "textArea" ? "文本域" : null))))}
                                                                </Option>
                                                            );
                                                        })}
                                                    </Select>
                                                )}
                                            </Form.Item>
                                        </Col>
                                        {params[index].type === "radio" || params[index].type === "checkBox" || params[index].type === "select" ? (
                                            <Col span={8}>
                                                <Form.Item style={{ marginBottom: "0" }}>
                                                    <div key={`${index}Value`}>
                                                        {getFieldDecorator(`${index}Value`, {
                                                            rules: [{ validator: this.paramValueValidator.bind(this, index) }], initialValue: param.defaultValue,
                                                            getValueFromEvent: (event) => {
                                                                return event.target.value.replace(/\uff0c/g, ",")
                                                            },
                                                        })(
                                                            <Input placeholder={param.defaultValue} onChange={this.changeParamValue.bind(this, index)} />
                                                        )}
                                                    </div>
                                                </Form.Item>
                                            </Col>
                                        ) : null}
                                        <Button className="param-delete" type="circle" icon="close" size="small" onClick={this.remove.bind(this, index)} />
                                    </Row>
                                </Form.Item>
                            )
                        })}
                    </Form>
                </Modal>
            </Card>
        )
    }
}

export default Form.create({ name: 'editapp_form' })(EditApp);