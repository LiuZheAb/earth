import React from 'react';
import { Layout, Menu, Card, Form, Input, Button, Modal, message, Tooltip, Icon, Upload } from 'antd';
import axios from 'axios';
import { apiurl } from '../../assets/urls';
import "./index.css";
import { getCookie } from "../../utils/cookies";
import IconFont from "../../assets/IconFont";
import EditApp from './EditApp.js';

const { Sider, Content } = Layout;
const { TextArea } = Input;

let checkNullvalue = (param, str) => {
    if (str.length === 0) {
        message.error(`${param}不能为空，请填写后重新提交`, 2);
        return false;
    } else {
        return true;
    };
};

class Personal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            personalSiderKey: sessionStorage.getItem("personalSiderKey") ? sessionStorage.getItem("personalSiderKey") : "1",
            userName: getCookie("userName"),
            psd: "",
            email: "请设置邮箱",
            mobile: "请设置手机号",
            editEmail: "请输入邮箱",
            editMobile: "请输入手机号",
            avatar: "",
            nickname: "",
            description: "",
            address: "",
            area: "",
            password: "",
            newPassword: "",
            confirmPassword: "",
            accountStatus: 1,
            visible: [false, false, false],
            loading: false,
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChangeMobile = this.handleChangeMobile.bind(this);
        this.handleChangeEmail = this.handleChangeEmail.bind(this);
        this.handleChangePsd = this.handleChangePsd.bind(this);
        this.beforeUpload = this.beforeUpload.bind(this);
        this.changeSider = this.changeSider.bind(this);
    };
    // 根据用户名获取到用户信息
    componentDidMount() {
        const _this = this;
        let { userName } = this.state;
        if (userName) {
            axios({
                method: 'post',
                url: apiurl + 'user',
                responseType: 'json',
                data: {
                    userName: getCookie("userName")
                },
                headers: { 'Content-Type': 'application/json' },
            })
                .then(function (response) {
                    let { password, email, mobile, avatar, nickname, description, address, status, area } = response.data;
                    _this.setState({
                        psd: password,
                        email: email,
                        editEmail: email,
                        mobile: mobile,
                        editMobile: mobile,
                        avatar: avatar,
                        nickname: nickname,
                        description: description,
                        address: address,
                        accountStatus: status,
                        area: area,
                    });
                })
                .catch(function (error) {
                    message.error("服务器无响应", 2);
                });
        } else {
            message.error("用户信息过期，请重新登录", 2);
        }
    };
    //更换侧边栏
    changeSider(props) {
        this.setState({
            personalSiderKey: props.key
        });
        sessionStorage.setItem("personalSiderKey", props.key);
    };
    // 修改用户头像
    beforeUpload(file) {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('你只能上传jpg或png格式的文件!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('图片大小不能超过2MB!');
        }
        return isJpgOrPng && isLt2M;
    };
    handleChangeAvatar = info => {
        if (info.file.status === 'uploading') {
            this.setState({ loading: true });
            return;
        } else if (info.file.status === 'done') {
            this.setState({
                avatar: info.file.response.avatar,
                loading: false,
            });
        };
    };
    // 表单数据双向绑定
    handleChange(key, e) {
        this.setState({ [key]: e.target.value });
    };
    //打开模态框
    showModal = (index) => {
        let { visible } = this.state;
        visible[index] = true;
        this.setState({
            visible: visible,
        });
    };
    // 关闭模态框
    handleCancel = (index) => {
        let { visible } = this.state;
        visible[index] = false;
        this.setState({
            visible: visible,
        });
    };
    nicknameValidator(rule, value, callback) {
        var len = 0;
        for (var i = 0; i < value.length; i++) {
            var a = value.charAt(i);
            // eslint-disable-next-line
            if (a.match(/[^\x00-\xff]/ig) != null) {
                len += 2;
            } else {
                len += 1;
            };
        };
        if (!value) {
            callback('昵称不能为空!');
        } else if (len > 16) {
            callback('昵称不能超过16个字符!');
        } else {
            callback();
        };
    };
    descriptionValidator(rule, value, callback) {
        callback();
    };
    addressValidator(rule, value, callback) {
        callback();
    };
    areaValidator(rule, value, callback) {
        callback();
    };
    // 个人信息页数据提交
    handleSubmit(e) {
        e.preventDefault();
        let { userName, nickname, description, address, area } = this.state;
        let _this = this;
        _this.props.form.validateFields({ force: true }, (err, values) => {
            if (!err) {
                //判断文件是否上传完成
                axios({
                    method: 'post',
                    url: apiurl + 'userchange',
                    data: {
                        userName: userName,
                        nickname: nickname,
                        description: description,
                        address: address,
                        area: area,
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function (response) {
                    message.success("修改成功", 2);
                }).catch(function (error) {
                    message.error("服务器无响应", 2);
                });
            };
        });
    };
    //修改手机号码
    handleChangeMobile(e) {
        e.preventDefault();
        let _this = this;
        let { editMobile, visible, userName } = this.state;
        if (checkNullvalue("手机号", editMobile)) {
            if (/^[1]([3-9])[0-9]{9}$/.test(editMobile) === false) {
                message.error('手机号格式错误');
            } else {
                axios({
                    method: 'post',
                    url: apiurl + 'usercenter',
                    data: {
                        userName: userName,
                        mobile: editMobile,
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function (response) {
                    visible[0] = false;
                    _this.setState({
                        visible: visible,
                        mobile: editMobile
                    });
                    message.success("修改成功", 2);
                }).catch(function (error) {
                    message.error("服务器无响应", 2);
                });
            };
        };
    };
    //修改邮箱地址
    handleChangeEmail(e) {
        e.preventDefault();
        let _this = this;
        let { editEmail, visible, userName } = this.state;
        if (checkNullvalue("邮箱", editEmail)) {
            if (/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(editEmail) === false) {
                message.error('邮箱格式错误');
            } else {
                axios({
                    method: 'post',
                    url: apiurl + 'usercenter',
                    data: {
                        userName: userName,
                        email: editEmail,
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function (response) {
                    visible[1] = false;
                    _this.setState({
                        visible: visible,
                        email: editEmail
                    });
                    message.success("修改成功", 2);
                }).catch(function (error) {
                    message.error("服务器无响应", 2);
                });
            };
        };
    };
    //修改密码
    handleChangePsd(e) {
        e.preventDefault();
        let _this = this;
        let { userName, password, newPassword, confirmPassword, visible } = this.state;
        if (checkNullvalue("旧密码", password) && checkNullvalue("新密码", newPassword) && checkNullvalue("确认密码", confirmPassword)) {
            if (/^[0-9a-zA-Z]{4,16}$/.test(newPassword) === false) {
                message.error('密码格式不符合要求');
            } else {
                if (newPassword !== confirmPassword) {
                    message.error('两次输入的密码不一致，请重新输入！');
                } else {
                    axios({
                        method: 'post',
                        url: apiurl + 'usercenter',
                        data: {
                            userName: userName,
                            password: password,
                            newPassword: newPassword,
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).then(function (response) {
                        let { status, msg } = response.data;
                        switch (status) {
                            case -1:
                                message.error(msg, 2);
                                break;
                            case 0:
                                message.warning(msg, 2);
                                break;
                            case 1:
                                message.success(msg, 2);
                                visible[2] = false;
                                _this.setState({
                                    visible: visible,
                                });
                                break;
                            case 2:
                                message.error(msg, 2);
                                break;
                            default:
                                break;
                        };
                    }).catch(function (error) {
                        message.error("服务器无响应", 2);
                    });
                };
            };
        };
    };
    //账号申诉
    accountAppeal() {
        let _this = this;
        let { userName } = this.state;
        axios({
            method: 'post',
            url: apiurl + 'usercenter',
            data: {
                userName: userName,
                status: 2
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (response) {
            _this.setState({
                accountStatus: response.data.status
            });
        }).catch(function (error) {
            message.error("服务器无响应");
        });
    };
    render() {
        const { getFieldDecorator } = this.props.form;
        let content;
        let { personalSiderKey, visible, psd, userName, email, editEmail, mobile, editMobile, avatar, nickname, description, address, area, accountStatus } = this.state;
        switch (personalSiderKey) {
            case "1":
                const uploadButton = (
                    <>
                        <Icon type={this.state.loading ? 'loading' : 'plus'} />
                        <div className="ant-upload-text">点击上传头像</div>
                    </>
                );
                content = <Card bordered={false} style={{ width: "100%" }}>
                    <Form layout="vertical" id="personal-form" onSubmit={this.handleSubmit}>
                        <Form.Item label="头像">
                            <Upload
                                name="avatar"
                                listType="picture-card"
                                className="avatar-uploader"
                                showUploadList={false}
                                action={apiurl + "useravatar"}
                                data={{ userName: userName }}
                                beforeUpload={this.beforeUpload}
                                onChange={this.handleChangeAvatar}
                            >
                                {avatar ? <img src={apiurl + avatar} alt="avatar" style={{ width: '100%' }} /> : uploadButton}
                            </Upload>
                        </Form.Item>
                        <Form.Item label="用户名">
                            <Input placeholder="您还未设置昵称，请输入昵称" value={userName} disabled onChange={this.handleChange.bind(this, 'nickname')} />
                        </Form.Item>
                        <Form.Item label="昵称">
                            {getFieldDecorator('nickname', {
                                rules: [{ validator: this.nicknameValidator }],
                                initialValue: nickname,
                            })(
                                <Input placeholder="您还未设置昵称，请输入昵称" onChange={this.handleChange.bind(this, 'nickname')} />
                            )}
                        </Form.Item>
                        <Form.Item label="简介">
                            {getFieldDecorator('description', {
                                rules: [{ validator: this.descriptionValidator }],
                                initialValue: description,
                                validateTrigger: "onSubmit"
                            })(
                                <TextArea rows={4} maxLength={66} placeholder="请填写简介" onChange={this.handleChange.bind(this, 'description')} />
                            )}
                        </Form.Item>
                        <Form.Item label="地址">
                            {getFieldDecorator('address', {
                                rules: [{ validator: this.addressValidator }],
                                initialValue: address,
                                validateTrigger: "onSubmit"
                            })(
                                <Input placeholder="请输入您的地址" onChange={this.handleChange.bind(this, 'address')} />
                            )}
                        </Form.Item>
                        <Form.Item label="应用领域">
                            {getFieldDecorator('area', {
                                rules: [{ validator: this.areaValidator }],
                                initialValue: area,
                                validateTrigger: "onSubmit"
                            })(
                                <Input placeholder="请输入应用领域" onChange={this.handleChange.bind(this, 'area')} />
                            )}
                        </Form.Item>
                        <Form.Item style={{ textAlign: "center" }}>
                            <Button type="primary" htmlType="submit">更新信息</Button>
                        </Form.Item>
                    </Form>
                </Card>;
                break;
            case "2":
                content = <Card bordered={false} style={{ width: "100%" }}>
                    <div className="item-block">
                        <div className="item">
                            <p className="title">手机号码</p>
                            <p>{mobile}</p>
                        </div>
                        <div className="item">
                            <span className="change-btn" onClick={this.showModal.bind(this, 0)}>更改</span>
                            <Modal title="修改手机号码" visible={visible[0]} onOk={this.handleChangeMobile} onCancel={this.handleCancel.bind(this, 0)} okText="确定" cancelText="取消">
                                <Input placeholder="请输入您的手机号码" value={editMobile} onChange={this.handleChange.bind(this, "editMobile")} onPressEnter={this.handleChangeMobile} />
                            </Modal>
                        </div>
                    </div>
                    <div className="item-block">
                        <div className="item">
                            <p className="title">邮箱</p>
                            <p>{email}</p>
                        </div>
                        <div className="item">
                            <span className="change-btn" onClick={this.showModal.bind(this, 1)}>更改</span>
                            <Modal title="修改邮箱" visible={visible[1]} onOk={this.handleChangeEmail} onCancel={this.handleCancel.bind(this, 1)} okText="确定" cancelText="取消">
                                <Input placeholder="请输入您的邮箱" value={editEmail} onChange={this.handleChange.bind(this, "editEmail")} onPressEnter={this.handleChangeEmail} />
                            </Modal>
                        </div>
                    </div>
                    <div className="item-block">
                        <div className="item">
                            <p className="title">密码</p>
                            <p>{psd ? "已设置" : "请设置密码"}</p>
                        </div>
                        <div className="item">
                            <span className="change-btn" onClick={this.showModal.bind(this, 2)}>更改</span>
                            <Modal title="修改密码" visible={visible[2]} onOk={this.handleChangePsd} onCancel={this.handleCancel.bind(this, 2)} okText="确定" cancelText="取消">
                                <Tooltip placement="top" title="请输入旧密码">
                                    <Input style={{ margin: "15px 0" }} prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="旧密码"
                                        onChange={this.handleChange.bind(this, 'password')} onPressEnter={this.handleChangePsd} />
                                </Tooltip>
                                <Tooltip placement="top" title="密码由4-16位英文或数字组成，不能包含特殊字符">
                                    <Input style={{ margin: "15px 0" }} prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="新密码"
                                        onChange={this.handleChange.bind(this, 'newPassword')} onPressEnter={this.handleChangePsd} />
                                </Tooltip>
                                <Tooltip placement="top" title="请再次输入新密码">
                                    <Input style={{ margin: "15px 0" }} prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="请再次输入新密码"
                                        onChange={this.handleChange.bind(this, 'confirmPassword')} onPressEnter={this.handleChangePsd} />
                                </Tooltip>
                            </Modal>
                        </div>
                    </div>
                </Card>;
                break;
            case "3":
                content = <Card bordered={false} style={{ width: "100%", textAlign: "center", paddingTop: "30px" }}>
                    {accountStatus === 1
                        ? <p>您的账号正常，无需申诉</p>
                        : accountStatus === -1 ? <><p>您的账号异常</p><Button type="primary" onClick={this.accountAppeal}>申诉</Button></> : <p>您的账号已申诉，请等待审核结果</p>
                    }
                </Card>;
                break;
            case "4":
                content = <EditApp />
                break;
            default:
                break;
        }
        return (
            <Layout className="personal box-shadow">
                <Sider className="personal-sider">
                    <Menu
                        theme="light"
                        mode="vertical"
                        defaultSelectedKeys={[personalSiderKey]}
                        style={{ lineHeight: '64px' }}
                        id="personal-menu"
                    >
                        <Menu.Item key="1" onClick={this.changeSider}>个人信息</Menu.Item>
                        <Menu.Item key="2" onClick={this.changeSider}>账户管理</Menu.Item>
                        <Menu.Item key="3" onClick={this.changeSider}>账号申诉</Menu.Item>
                        <Menu.Item key="4" onClick={this.changeSider}>编辑应用</Menu.Item>
                    </Menu>
                    <Menu
                        theme="light"
                        mode="horizontal"
                        defaultSelectedKeys={[personalSiderKey]}
                        id="personal-menu-h"
                    >
                        <Menu.Item key="1" onClick={this.changeSider}>个人信息</Menu.Item>
                        <Menu.Item key="2" onClick={this.changeSider}>账户管理</Menu.Item>
                        <Menu.Item key="3" onClick={this.changeSider}>账号申诉</Menu.Item>
                        <Menu.Item key="4" onClick={this.changeSider}>编辑应用</Menu.Item>
                    </Menu>
                </Sider>
                <Content className="personal-content">
                    {userName ? content : <p style={{ marginTop: "20px" }}>用户信息过期，请重新登录</p>}
                </Content>
            </Layout>
        );
    };
};

export default Form.create({ name: 'personal_form' })(Personal);