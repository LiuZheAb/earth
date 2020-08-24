/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 注册表单
 */

import React, { Component } from 'react';
import axios from 'axios';
import { withRouter, Link } from "react-router-dom";
import { Form, Icon, Input, Button, message, Checkbox, AutoComplete, Tooltip } from "antd";
import { apiurl } from '../../assets/url.js';
import { setCookie } from '../../utils/cookies';
import './index.css';

const AutoCompleteOption = AutoComplete.Option;

class RegisterForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            captchaUrl: '',
            captchaId: '',
            message: '',
            username: '',
            email: '',
            password: '',
            confirmpassword: '',
            captcha: '',
            registerState: '',
            autoCompleteResult: [],
            checked: false
        };
    };
    componentDidMount() {
        const _this = this;
        //获取验证码
        axios.get(apiurl + 'firstgetcaptcha')
            .then(function (response) {
                _this.setState({
                    captchaId: response.data["getCaptchaID"],
                    captchaUrl: apiurl + "captcha/" + response.data["getCaptchaID"] + '.png',
                    isLoaded: true,
                    invisible: true
                });
            }).catch(function (error) {
                message.error("服务器无响应", 2);
                _this.setState({
                    isLoaded: false,
                    invisible: false
                });
            });
    };
    //刷新验证码
    handleClick = () => {
        if (this.state.captchaId) {
            this.setState({ captchaUrl: apiurl + "captcha/" + this.state.captchaId + '.png?reload=' + (new Date()).getTime() });
        } else {
            const _this = this;
            axios.get(apiurl + 'firstgetcaptcha')
                .then(function (response) {
                    _this.setState({
                        captchaId: response.data["getCaptchaID"],
                        captchaUrl: apiurl + "captcha/" + response.data["getCaptchaID"] + '.png',
                        isLoaded: true,
                    });
                }).catch(function (error) {
                    message.error("服务器无响应", 2);
                    _this.setState({
                        isLoaded: false,
                        error: error
                    });
                });
        }
    };
    //获取用户输入的各项信息
    handleChange(key, e) {
        this.setState({ [key]: e.target.value });
    };
    //用户名验证
    usernameValidator = (rule, value, callback) => {
        if (!value) {
            callback('用户名不能为空!');
        } else if (this.state.registerState === 2) {
            callback(this.state.message);
        } else if (/^[0-9a-zA-Z]{4,16}$/.test(value) === false) {
            callback('用户名格式不符合要求！');
        } else {
            callback();
        };
    };
    // 邮箱验证
    emailValidator = (rule, value, callback) => {
        if (!value) {
            callback('邮箱不能为空!');
        } else if (/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value) === false) {
            callback('请输入正确的邮箱格式！');
        } else {
            callback();
        };
    };
    // 自动补全邮箱地址
    handleWebsiteChange = value => {
        let autoCompleteResult;
        if (!value || /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value) === true) {
            autoCompleteResult = [];
        } else {
            autoCompleteResult = ['@qq.com', '@163.com', '@126.com', '@gmail.com', '@sina.com', '@yahoo.com'].map(domain => `${value}${domain}`);
        }
        this.setState({
            autoCompleteResult: autoCompleteResult,
            email: value
        });
    };
    // 密码验证
    passwordValidator = (rule, value, callback) => {
        if (!value) {
            callback('请输入密码!');
        } else if (/^[0-9a-zA-Z]{4,16}$/.test(value) === false) {
            callback('密码格式不符合要求');
        } else {
            callback();
        };
    };
    // 确认密码
    confirmPasswordValidator = (rule, value, callback) => {
        if (!value) {
            callback('请再次输入密码!');
        } else if (value !== this.state.password) {
            callback('两次输入的密码不一致，请重新输入！');
        } else {
            callback();
        };
    };
    // 验证码验证
    captchaValidator = (rule, value, callback) => {
        if (!value) {
            callback("验证码不能为空!");
        } else if (this.state.registerState === 3) {
            callback(this.state.message);
        } else if (/^[0-9]{4,4}$/.test(value) === false) {
            callback('验证码必须为4位数字!');
        } else {
            callback();
        };
    };
    // 校验是否勾选协议
    checkboxChange(e) {
        this.setState({
            checked: e.target.checked
        })
    }
    //注册提交表单时调用
    handleSubmitregister = (e) => {
        e.preventDefault();
        const _this = this;
        let { username, password, captcha, captchaId, email } = this.state;
        _this.props.form.validateFields({ force: true }, (err, values) => {
            if (!err) {
                axios({
                    method: 'post',
                    url: apiurl + 'register',
                    responseType: 'json',
                    data: {
                        username: username,
                        password: password,
                        captcha: captcha,
                        captcha_id: captchaId,
                        email: email
                    },
                    headers: { 'Content-Type': 'application/json' },
                })
                    .then(function (response) {
                        _this.setState({
                            registerState: response.data["status"],
                            message: response.data["message"]
                        });
                        _this.props.form.validateFields({ force: true }, (err, values) => {
                            // eslint-disable-next-line 
                            switch (response.data["status"]) {
                                case 0: {
                                    setTimeout(_this.setState({
                                        registerState: 4,
                                        captchaUrl: apiurl + "captcha/" + captchaId + '.png?reload=' + (new Date()).getTime(),
                                    }), 3000);
                                    break;
                                }
                                case 1: {
                                    message.success("注册成功", 1);
                                    setCookie("userName", username);
                                    setTimeout(() => {
                                        _this.props.history.push('/home');
                                    }, 1000);
                                    break;
                                }
                                case 2: {
                                    setTimeout(_this.setState({
                                        registerState: 4,
                                        captchaUrl: apiurl + "captcha/" + captchaId + '.png?reload=' + (new Date()).getTime(),
                                    }), 3000);
                                    break;
                                }
                                case 3: {
                                    setTimeout(_this.setState({
                                        registerState: 4,
                                        captchaUrl: apiurl + "captcha/" + captchaId + '.png?reload=' + (new Date()).getTime(),
                                    }), 3000);
                                    break;
                                }
                            };
                        });
                    })
                    .catch(function (error) {
                        message.error("注册失败", 2);
                    });
            };
        });
    };
    setSiderkey(index) {
        sessionStorage.setItem('aboutSiderKey', index);
    };
    render() {
        const { getFieldDecorator } = this.props.form;
        let { checked, autoCompleteResult, captchaUrl } = this.state;
        const websiteOptions = autoCompleteResult.map(website => (
            <AutoCompleteOption key={website}>{website}</AutoCompleteOption>
        ));
        return (
            <div className="register">
                <Link to="/login" className="changeform">已有账号，直接登陆</Link>
                <label className="register-fun">账号注册</label>
                <Form onSubmit={this.handleSubmitregister} className="register-form">
                    <Form.Item hasFeedback>
                        <Tooltip placement="top" title="用户名由4-16位英文或数字组成，不能包含特殊字符">
                            {getFieldDecorator('username', {
                                rules: [{ validator: this.usernameValidator }],
                                //禁止输入空格
                                getValueFromEvent: (event) => {
                                    return event.target.value.replace(/\s+/g, "")
                                },
                            })(
                                <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="用户名"
                                    onChange={this.handleChange.bind(this, 'username')} />
                            )}
                        </Tooltip>
                    </Form.Item>
                    <Form.Item hasFeedback>
                        <Tooltip placement="top" title="请输入你的邮箱地址">
                            {getFieldDecorator('email', {
                                rules: [{ validator: this.emailValidator }],
                            })(
                                <AutoComplete dataSource={websiteOptions} onChange={this.handleWebsiteChange}>
                                    <Input prefix={<Icon type="mail" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="邮箱" />
                                </AutoComplete>
                            )}
                        </Tooltip>
                    </Form.Item>
                    <Form.Item hasFeedback>
                        <Tooltip placement="top" title="密码由4-16位英文或数字组成，不能包含特殊字符">
                            {getFieldDecorator('password', {
                                rules: [{ validator: this.passwordValidator }],
                            })(
                                <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="密码"
                                    onChange={this.handleChange.bind(this, 'password')} />
                            )}
                        </Tooltip>
                    </Form.Item>
                    <Form.Item hasFeedback>
                        <Tooltip placement="top" title="请再次输入密码">
                            {getFieldDecorator('confirmpassword', {
                                rules: [{ validator: this.confirmPasswordValidator }]
                            })(
                                <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="请再次输入密码"
                                    onChange={this.handleChange.bind(this, 'confirmpassword')} />
                            )}
                        </Tooltip>
                    </Form.Item>
                    <Form.Item className="captcha">
                        {getFieldDecorator('captcha', {
                            rules: [{ validator: this.captchaValidator }],
                        })(
                            <Input prefix={<Icon type="safety-certificate" style={{ color: 'rgba(0,0,0,.25)' }} />} type="captcha" placeholder="验证码" onChange={this.handleChange.bind(this, 'captcha')} />
                        )}
                        <img src={captchaUrl} alt="验证码" onClick={this.handleClick} />
                    </Form.Item>

                    <Form.Item>
                        {getFieldDecorator('agreement', {
                            rules: [{ required: true, message: '请仔细阅读协议！' }],
                        })(
                            <Checkbox checked={checked}
                                onChange={this.checkboxChange.bind(this)}>
                                我已阅读<Link to="/about" onClick={this.setSiderkey.bind(this, "4")}>《法律声明和隐私权政策》</Link>
                            </Checkbox>,
                        )}
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="register-form-button">
                            注册
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        )
    }
}
export default withRouter(Form.create({ name: 'register' })(RegisterForm));