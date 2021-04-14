/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 前台首页，个人中心、平台简介、最近访问
 */

import React from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import { Row, Col, message, Modal } from 'antd';
import { getCookie } from '../../utils/cookies';
import apiPromise from '../../assets/url.js';
import loadable from '../../utils/lazyLoad';
import './index.css';

const RecentVisit = loadable(() => import('../RecentVisit'));
const Example = loadable(() => import('../Example'));
const ModuleList = loadable(() => import('../ModuleList'));
const LoginModal = loadable(() => import('../LoginModal'));

export default class Home extends React.Component {
  state = {
    userName: getCookie("userName") || "",
    email: "",
    mobile: "",
    avatar: "",
    data: undefined,
    loading: "loading",
    api: ""
  };
  componentDidMount() {
    document.getElementsByTagName("body")[0].style.overflow = "auto";
    apiPromise.then(res => {
      this.setState({ api: res.data.api })
      if (this.state.userName) {
        axios({
          method: 'post',
          url: res.data.api + 'user',
          responseType: 'json',
          data: {
            userName: this.state.userName
          },
          headers: { 'Content-Type': 'application/json' },
        }).then(response => {
          let { email, mobile, avatar, nickname, description } = response.data;
          this.setState({
            email,
            mobile,
            avatar,
            nickname,
            description
          });
        }).catch(error => {
          message.error("服务器无响应", 2);
        });
      }
      axios.get(res.data.api + 'home')
        .then(response => {
          this.setState({
            data: response.data,
            loading: "done"
          });
        }).catch(error => {
          this.setState({
            loading: "error"
          });
        });
    });
  };
  // 显示模态框
  showModal = () => {
    this.setState({ visible: true })
  }
  // 点击确定调用
  handleOk = () => {
    this.setState({
      visible: false,
    });
  };
  render() {
    let { userName, mobile, email, avatar, nickname, data, loading, api } = this.state;
    return (
      <div className="homepage">
        <Row gutter={10}>
          <Col lg={12} xs={24}>
            <div className="title">个人中心</div>
            <div className="top-block person box-shadow">
              <div className="avatar" style={{ backgroundColor: avatar ? null : "#d7e9f0" }}>
                <img src={avatar ? api + avatar : require("../../assets/images/avatar.png")} alt="头像" />
              </div>
              <div className="personality">
                {userName ?
                  <>
                    <ul className="prop-name">
                      <li>用户名 :</li>
                      <li>昵称 :</li>
                      <li>邮箱 :</li>
                      <li>电话 :</li>
                    </ul>
                    <ul className="prop">
                      <li>{userName}</li>
                      <li>{nickname || "未设置昵称"}</li>
                      <li>{email || "未设置邮箱"}</li>
                      <li>{mobile || "未设置电话"}</li>
                    </ul>
                  </>
                  :
                  <div className="login-btn">
                    <Link to="/login">您还未登录，请先登录</Link>
                  </div>
                }
              </div>
              <Modal
                visible={this.state.visible}
                onOk={this.handleOk}
                onCancel={this.handleOk}
                footer={null}
                bodyStyle={{ padding: "40px 40px 20px" }}
                style={{ width: "300px", maxWidth: "500px" }}>
                <LoginModal parent={this} />
              </Modal>
            </div>
          </Col>
          <Col lg={12} xs={24}>
            <div className="title">平台简介</div>
            <div className="top-block plat-desc box-shadow">
              <div className="plat-img">
                <img src={require("../../assets/images/introduce.jpg")} alt="平台简介" />
              </div>
              <div className="textarea">
                <h3 title="综合地球物理联合反演与解释一体化平台">综合地球物理联合反演与解释一体化平台</h3>
                <p>项目拟通过3000米以浅多种、多类型数据的联合反演解释技术以及多元信息评价与预测技术，发展大数据人工智能理论方法，提高大规模数据处理、解释的高性能计算能力，研发重磁、电磁、地震处理、解释可视化及一体化平台，开展典型矿集区应用示范，从而实现中深部金属矿产资源评价与预测。 </p>
                <Link className="more" to="/about" onClick={() => { sessionStorage.setItem("aboutSiderKey", 1) }}>更多详情</Link>
              </div>
            </div>
          </Col>
        </Row>
        <Row gutter={10} style={{ display: "flex", alignItems: "stretch", flexWrap: "wrap" }}>
          <RecentVisit />
          <Example data={data} api={api} />
        </Row>
        <ModuleList data={data} loading={loading} api={api} />
      </div >
    );
  };
};