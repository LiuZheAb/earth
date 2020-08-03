//前台首页，个人中心、平台简介、最近访问
import React from 'react'
import { Row, Col, message, Modal } from 'antd';
// eslint-disable-next-line
import { HashRouter as Router, Route, Link } from "react-router-dom";
import './index.css';
import { apiurl } from '../../assets/urls';
import axios from 'axios';
import { getCookie } from '../../utils/cookies';
import loadable from '../../utils/lazyLoad';

const RecentVisit = loadable(() => import('../RecentVisit'));
const ModuleList = loadable(() => import('../ModuleList'));
const LoginModal = loadable(() => import('../LoginModal'));

export default class Home extends React.Component {
  state = {
    userName: getCookie("userName") ? getCookie("userName") : "",
    email: "请先设置邮箱",
    mobile: "请先设置手机号",
    avatar: "",
  };
  componentDidMount() {
    const _this = this;
    if (this.state.userName) {
      axios({
        method: 'post',
        url: apiurl + 'user',
        responseType: 'json',
        data: {
          userName: this.state.userName
        },
        headers: { 'Content-Type': 'application/json' },
      })
        .then(function (response) {
          let { email, mobile, avatar, nickname, description } = response.data;
          _this.setState({
            email: email,
            mobile: mobile,
            avatar: avatar,
            nickname: nickname,
            description: description
          });
        })
        .catch(function (error) {
          message.error("服务器无响应", 2);
        });
    }
  };
  setSiderkey(index) {
    sessionStorage.setItem('personalSiderKey', index);
  };
  showModal = () => {
    this.setState({ visible: true })
  }
  handleOk = e => {
    this.setState({
      visible: false,
    });
  };
  render() {
    let { userName, mobile, email, avatar, nickname } = this.state;
    return (
      <div className="homepage">
        <Row gutter={10} style={{ marginBottom: "10px" }}>
          <Col lg={12} xs={24}>
            <div>个人中心</div>
            <div className="top-block person box-shadow">
              <div className="avatar" style={{ backgroundColor: avatar ? null : "#d7e9f0" }}>
                <img src={avatar ? apiurl + avatar : require("../../assets/images/avatar.png")} alt="头像" />
                {/* <img src={require("../../assets/images/avatar.png")} alt="头像" /> */}
              </div>
              <div className="personality">
                {userName ?
                  <ul>
                    <li><div className="personal-info"><div>用户名 :</div>{userName}</div></li>
                    <li><div className="personal-info"><div>昵称 :</div>{nickname}</div><Link to="personal" onClick={this.setSiderkey.bind(this, "1")}>编辑</Link></li>
                    <li><div className="personal-info"><div>邮箱 :</div>{email}</div><Link to="personal" onClick={this.setSiderkey.bind(this, "2")}>点击更换</Link></li>
                    <li><div className="personal-info"><div>电话 :</div>{mobile}</div><Link to="personal" onClick={this.setSiderkey.bind(this, "2")}>点击更换</Link></li>
                  </ul>
                  :
                  <span style={{ color: "#1890ff", cursor: "pointer" }} onClick={this.showModal}>您还未登录，请先登录</span>
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
                <h3>综合地球物理联合反演与解释一体化平台</h3>
                <p>项目拟通过3000米以浅多种、多类型数据的联合反演解释技术以及多元信息评价与预测技术，发展大数据人工智能理论方法，提高大规模数据处理、解释的高性能计算能力，研发重磁、电磁、地震处理、解释可视化及一体化平台，开展典型矿集区应用示范，从而实现中深部金属矿产资源评价与预测。 </p>
                <Link className="more" to="about" onClick={() => { sessionStorage.setItem("aboutSiderKey", 1) }}>更多详情</Link>
              </div>
            </div>
          </Col>
        </Row>
        <RecentVisit />
        <ModuleList />
      </div>
    );
  };
};