/**
 * 文件名：index.js
 * 作者：曾彤
 * 创建时间：2021/2/18
 * 文件描述：展示页面主文件
 */
import React from "react";
import { Row, Col, Layout, Table, Form, Button, message, Upload, Tabs, Input, Card, Select, Icon } from "antd";
import "./index.css";
import Header from "../../../components/HomeNavbar";
import axios from "axios";
import { baseUrl, hdfsUploadUrl, hbaseUploadUrl, importUrl, getAllTableUrl, downloadUrl, downloadHref, selectByOneUrl, selectByTwoUrl, selectByThreeUrl } from "../assets/url";
import reqwest from 'reqwest';

const { Option } = Select;
const { TabPane } = Tabs;
const { Content } = Layout;

export default class Download extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hbaseProps: null,
      hdfsProps: null,
      data: [],
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 20000
      },
      loading: false,
      keyLoading: false,
      //sheet表单
      sheetList: [],
      //当前表单
      currentSheet: "",
      //所有信息
      allCol: [],
      allData: [],
      //关键字查询
      keyCol: [],
      keyData: [],
      //表单对应的数据数量
      sheetDataLen: {},
      //当前表单对应的数据数量
      currentSheetDataLen: null,
      //查询关键字
      selectKey1: "",
      selectKey2: "",
      selectKey3: "",
      //关键词查询结果的列名和数据
      keyCols: [],
      keyDatas: []
    };
  };

  componentDidMount() {
    document.title = "HDFS&HBASE";
    axios.defaults.timeout = 600000;
    //查询所有sheet表单
    axios({
      method: 'get',
      url: getAllTableUrl,
    }).then((res) => {
      if (res.data.value) {
        let data = res.data.value.split("][");
        data[0] = data[0].substring(1);
        data[data.length - 1] = data[data.length - 1].substring(0, data[data.length - 1].length - 1);
        let newData = {};
        let sheetList = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i].split("|[GENERIC]|")) {
            let data1 = data[i].split("|[GENERIC]|")[0];
            let data2 = data[i].split("|[GENERIC]|")[1];
            sheetList.push(data1);
            newData[data1] = data2;
          };
        };
        this.setState({
          sheetList,
          sheetDataLen: newData,
          currentSheet: sheetList.length > 0 ? sheetList[0] : '',
          currentSheetDataLen: sheetList.length > 0 ? newData[sheetList[0]] : 0
        }, () => {
          this.handleSelect();
          // const { pagination , currentSheet } = this.state;
          // this.fetch({ pagination },currentSheet);
        });
      };
    }).catch((err) => {
      message.error("网络错误！")
    });

    axios({
      method: 'get',
      url: baseUrl + "/Bigdata/service/ipig/selectByOne",
      params: { Key1: "地震", tableName: "Sheet3" }
    })
  };

  //查询数据（通用）
  handleSelect = () => {
    const { pagination, currentSheet } = this.state;
    this.fetch({ pagination }, currentSheet);
  };

  handleImport = () => {
    axios({
      method: 'get',
      url: importUrl
    });
    message.info("导入中，请稍后刷新页面查询")
  };

  handleTableChange = (pagination, filters, sorter, sheetName) => {
    this.fetch({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
    }, this.state.currentSheet);
  };

  arrayToObj = (array) => {
    let newArr = [];
    for (let i = 0; i < array.length; i++) {
      let obj = {};
      for (let j = 0; j < array[i].length; j++) {
        obj[j.toString()] = array[i][j]
      };
      newArr.push(obj);
    };
    return newArr;
  };

  handleDownload = (e, dataName) => {
    let { currentSheet } = this.state;
    axios({
      method: 'get',
      url: downloadUrl,
      params: { tableName: currentSheet, dataName: dataName }
    }).then((res => {
      let value = res.data.value;
      let values = value.split(";");
      for (let i = 0; i < values.length; i++) {
        window.open(downloadHref + values[i], "_blank");
      }
    })).catch((err) => {
      message.error("下载错误")
    })
  }

  colToObj = (colArr) => {
    let colObj = [];
    for (let i = 0; i < colArr.length; i++) {
      let obj = {};
      obj["title"] = colArr[i];
      obj["dataIndex"] = i;
      obj["key"] = i;
      colObj.push(obj);
    };
    let obj = {};
    obj["title"] = "操作";
    obj["dataIndex"] = "operation";
    obj["render"] = (_, text) => {
      return (
        <Button onClick={(e) => this.handleDownload(e, text["6"])}>下载</Button>
      )
    };
    colObj.push(obj);
    return colObj;
  }

  fetch = (params = {}, sheetName) => {
    this.setState({ loading: true });
    let current = params.pagination.current;
    let rowKey = ((current - 1) * 10 + 1) + "-" + ((current - 1) * 10 + 10);
    let { currentSheetDataLen } = this.state;
    reqwest({
      url: baseUrl + "/Bigdata/service/ipig/select",
      method: 'get',
      type: 'json',
      data: { Key: rowKey, tableName: sheetName }
    }).then(res => {
      if (res.value) {
        let data = res.value.split("], [");
        data[0] = data[0].split("[[")[1];
        data[data.length - 1] = data[data.length - 1].split("]]")[0];
        let allCol = [], allData = [];
        if (data.length % 9 === 0) {
          let dataLen = data.length / 9;
          for (let i = 0; i < data.length; i++) {
            if (i < 9) {
              allCol.push(data[i].split("|")[0]);
            }
            allData.push(data[i].split("|")[1]);
          };
          let allDataCopy = JSON.parse(JSON.stringify(allData));
          allData = [];
          for (let i = 0; i < dataLen; i++) {
            allData.push(allDataCopy.splice(0, 9))
          };
          allCol = this.colToObj(allCol);
          allData = this.arrayToObj(allData);
          this.setState({
            allCol,
            allData
          })
        } else {
          message.error("查询异常");
        }
      };
      this.setState({
        loading: false,
        data: res.results,
        pagination: {
          ...params.pagination,
          total: currentSheetDataLen ? currentSheetDataLen : 10,
        },
      });
    });
  };

  //更改要查询的数据表单（select rowkey)
  sheetSelect = (e) => {
    let { sheetDataLen } = this.state;
    this.setState({
      currentSheet: e,
      currentSheetDataLen: sheetDataLen[e] ? sheetDataLen[e] : 10
    }, () => {
      this.handleSelect();
    });
  };

  handleSelectKey = (e, key) => {
    let value = e.target.value;
    switch (key) {
      case "Key1":
        this.setState({
          selectKey1: value
        });
        break;
      case "Key2":
        this.setState({
          selectKey2: value
        });
        break;
      case "Key3":
        this.setState({
          selectKey3: value
        });
        break;
      default:
        break;
    }
  };

  //根据关键字查询
  handleKeySelect = () => {
    let { selectKey1, selectKey2, selectKey3, currentSheet } = this.state;
    let keyNum = 0;
    //判断关键字个数
    if (selectKey1) {
      keyNum = keyNum + 1;
    };
    if (selectKey2) {
      keyNum = keyNum + 1;
    };
    if (selectKey3) {
      keyNum = keyNum + 1;
    };
    if (keyNum === 1) {
      this.setState({ keyLoading: true })
      axios({
        method: 'get',
        url: selectByOneUrl,
        params: { Key1: selectKey1 ? selectKey1 : (selectKey2 ? selectKey2 : selectKey3), tableName: currentSheet }
      }).then((res) => {
        let value = res.data.value;
        let data = value.split("][");
        data[0] = data[0].split("[")[1];
        data[data.length - 1] = data[data.length - 1].split("]")[0];
        if (data.length % 9 === 0) {
          let dataLen = data.length / 9;
          let keyCols = [], keyDatas = [];
          for (let i = 0; i < data.length; i++) {
            let data1 = data[i].split(",")[1];
            let data2 = data[i].split(",")[2];
            if (i < 9) {
              keyCols.push(data1);
            };
            keyDatas.push(data2);
          };
          keyCols = this.colToObj(keyCols);
          let keyDatasCopy = JSON.parse(JSON.stringify(keyDatas));
          keyDatas = [];
          for (let i = 0; i < dataLen; i++) {
            keyDatas.push(keyDatasCopy.splice(0, 9))
          };
          keyDatas = this.arrayToObj(keyDatas);
          this.setState({
            keyCols,
            keyDatas,
            keyLoading: false
          })
        };
      })
    } else if (keyNum === 2) {
      axios({
        method: 'get',
        url: selectByTwoUrl,
        params: { Key1: selectKey1 ? selectKey1 : (selectKey2 ? selectKey2 : selectKey3), Key2: selectKey2 ? selectKey2 : selectKey3, tableName: currentSheet }
      }).then((res) => {
        let value = res.data.value;
        let data = value.split("][");
        data[0] = data[0].split("[")[1];
        data[data.length - 1] = data[data.length - 1].split("]")[0];
        if (data.length % 9 === 0) {
          let dataLen = data.length / 9;
          let keyCols = [], keyDatas = [];
          for (let i = 0; i < data.length; i++) {
            let data1 = data[i].split(",")[1];
            let data2 = data[i].split(",")[2];
            if (i < 9) {
              keyCols.push(data1);
            };
            keyDatas.push(data2);
          };
          keyCols = this.colToObj(keyCols);
          let keyDatasCopy = JSON.parse(JSON.stringify(keyDatas));
          keyDatas = [];
          for (let i = 0; i < dataLen; i++) {
            keyDatas.push(keyDatasCopy.splice(0, 9))
          };
          keyDatas = this.arrayToObj(keyDatas);
          this.setState({
            keyCols,
            keyDatas,
            keyLoading: false
          })
        };
      })
    } else if (keyNum === 3) {
      axios({
        method: 'get',
        url: selectByThreeUrl,
        params: { Key1: selectKey1, Key2: selectKey2, Key3: selectKey3, tableName: currentSheet }
      }).then((res) => {
        let value = res.data.value;
        let data = value.split("][");
        data[0] = data[0].split("[")[1];
        data[data.length - 1] = data[data.length - 1].split("]")[0];
        if (data.length % 9 === 0) {
          let dataLen = data.length / 9;
          let keyCols = [], keyDatas = [];
          for (let i = 0; i < data.length; i++) {
            let data1 = data[i].split(",")[1];
            let data2 = data[i].split(",")[2];
            if (i < 9) {
              keyCols.push(data1);
            };
            keyDatas.push(data2);
          };
          keyCols = this.colToObj(keyCols);
          let keyDatasCopy = JSON.parse(JSON.stringify(keyDatas));
          keyDatas = [];
          for (let i = 0; i < dataLen; i++) {
            keyDatas.push(keyDatasCopy.splice(0, 9))
          };
          keyDatas = this.arrayToObj(keyDatas);
          this.setState({
            keyCols,
            keyDatas,
            keyLoading: false
          })
        };
      })
    } else {
      message.error("请至少输入一个关键字！")
    }
  };

  //下载hdfs文件的名称
  hdfsFileName = (e) => {
    this.setState({
      hdfsName: e.target.value
    });
  };

  render() {
    const { pagination, loading, sheetList, allCol, allData, keyCols, keyDatas, keyLoading } = this.state;
    const hbaseProps = {
      name: 'file',
      multiple: true,
      action: hbaseUploadUrl,
      onChange(info) {
        const { status } = info.file;
        if (status !== 'uploading') {
        };
        if (status === 'done') {
          message.success(`${info.file.name} 上传成功`);
        } else if (status === 'error') {
          message.error(`${info.file.name} 上传失败`);
        };
      },
    };
    const hdfsProps = {
      name: 'file',
      multiple: true,
      action: hdfsUploadUrl,
      data: { hdfsPath: "/data/", serverPath: "" },
      onChange(info) {
        const { status } = info.file;
        if (status !== 'uploading') {
        };
        if (status === 'done') {
          message.success(`${info.file.name} 上传成功`);
        } else if (status === 'error') {
          message.error(`${info.file.name} 上传失败`);
        };
      }
    };
    return (
      <Layout id="bdcenter" style={{ minHeight: '100vh' }}>
        <Header />
        <Layout style={{ paddingTop: 50 }}>
          <Content className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}>
            <Row>
              <Col span={2}></Col>
              <Col span={20}>
                <Form>
                  <Form.Item key="uploadFile">
                    <div id="fileUpload">
                      <Card key="fileUpload">
                        <Tabs onChange={this.tabChange}>
                          <TabPane tab="数据库存储" key="1">
                            <div id="uploadFile">
                              <Row>
                                <Col span={10}><p>上传数据信息表格到服务器</p></Col>
                                <Col span={14} style={{ textAlign: "right" }}><Button onClick={this.handleImport} type="primary">导入</Button></Col>
                              </Row>
                              <Upload.Dragger className="uploadFile"
                                {...hbaseProps}
                              >
                                <p className="ant-upload-drag-icon">
                                  <Icon type="inbox"></Icon>
                                </p>
                                <p className="ant-upload-text">点击或拖拽文件至此区域以上传</p>
                              </Upload.Dragger>
                            </div>
                          </TabPane>
                        </Tabs>
                      </Card>
                    </div>
                    <div id="fileinfo">
                      <Card key="fileUpload">
                        <Tabs>
                          <TabPane tab="文件信息查询" key="2">
                            <Form.Item label="表单名称">
                              <Select onChange={this.sheetSelect}>
                                {sheetList ? sheetList.map((item, index) => {
                                  return (
                                    <Option key={index} value={item}>{item}</Option>
                                  )
                                }) : <Option>无数据</Option>}
                              </Select>
                            </Form.Item>
                          </TabPane>
                        </Tabs>
                        {allCol.length > 0 ? (<Table
                          columns={allCol}
                          rowKey={record => record.time}
                          dataSource={allData}
                          pagination={pagination}
                          loading={loading}
                          onChange={this.handleTableChange}
                          scroll={{ x: "max-content" }}
                        />) : null}

                      </Card>
                    </div>
                    <div id="keySelect">
                      <Card id="keySelect">
                        <Tabs>
                          <TabPane tab="关键字查询" key="1">
                            <div id="keySelect">
                              <Row>
                                <Col>
                                  <Form.Item label="关键词1">
                                    <Input onChange={(e) => { this.handleSelectKey(e, "Key1") }}></Input>
                                  </Form.Item>
                                  <Form.Item label="关键词2">
                                    <Input onChange={(e) => { this.handleSelectKey(e, "Key2") }}></Input>
                                  </Form.Item>
                                  <Form.Item label="关键词3">
                                    <Input onChange={(e) => { this.handleSelectKey(e, "Key3") }}></Input>
                                  </Form.Item>
                                </Col>
                              </Row>
                              <Row style={{ textAlign: "center" }}>
                                <Button onClick={this.handleKeySelect} type="primary">查询</Button>
                              </Row>
                              {keyCols.length > 0 ?
                                (<Table loading={keyLoading} columns={keyCols} dataSource={keyDatas} rowKey={record => record.time} scroll={{ x: "max-content" }} pagination={false} ></Table>) : null}
                            </div>
                          </TabPane>
                        </Tabs>
                      </Card>
                    </div>
                    <div id="hdfsUpload">
                      <Card key="fileUpload">
                        <Tabs onChange={this.tabChange}>
                          <TabPane tab="hdfs文件上传" key="1">
                            <div id="uploadFile">
                              <Row>
                                <Col span={10}><p>上传源数据到服务器</p></Col>
                              </Row>
                              <Upload.Dragger className="uploadFile"
                                {...hdfsProps}
                              >
                                <p className="ant-upload-drag-icon">
                                  <Icon type="inbox"></Icon>
                                </p>
                                <p className="ant-upload-text">点击或拖拽文件至此区域以上传</p>
                              </Upload.Dragger>
                            </div>
                          </TabPane>
                        </Tabs>
                      </Card>
                    </div>
                  </Form.Item>
                </Form>
              </Col>
              <Col span={2}></Col>
            </Row>
          </Content>
        </Layout>
      </Layout>
    );
  };
};