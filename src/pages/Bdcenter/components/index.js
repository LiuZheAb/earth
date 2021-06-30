/**
 * 文件名：index.js
 * 作者：曾彤
 * 创建时间：2021/2/18
 * 文件描述：展示页面主文件
 */
import React from "react";
import { Row, Col, Layout, Table, Form, Icon, Button, message, Upload, Input, Radio, Select, Divider, Modal, Tabs, Tooltip, DatePicker } from "antd";
import 'moment/locale/zh-cn';
import Header from "../../../components/HomeNavbar";
import axios from "axios";
import locale from 'antd/es/date-picker/locale/zh_CN';
import reqwest from 'reqwest';
import "./index.css";
import apiPromise from '../../../assets/url';

let baseUrl = "", selectByOneUrl = "", selectByTwoUrl = "", selectByThreeUrl = "";

const { Option } = Select;
const { Content } = Layout;
const { TabPane } = Tabs;
const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

const tailLayout = {
  wrapperCol: { span: 24 },
};
//所有信息
const columns = _this => [{
  dataIndex: "dataEntity",
  title: "数据文件",
  width: 182,
  render: text => <p className="ellipsis-column"><Tooltip title={text}>{text}</Tooltip></p>,
  fixed: 'left',
}, {
  dataIndex: "dataFormat",
  title: "数据格式"
}, {
  dataIndex: "dataSetName",
  title: "数据集名称",
  width: 182,
  render: text => <p className="ellipsis-column"><Tooltip title={text}>{text}</Tooltip></p>
}, {
  dataIndex: "dataSource",
  title: "数据来源"
}, {
  dataIndex: "keyWords",
  title: "关键词",
  width: 182,
  render: text => <p className="ellipsis-column2"><Tooltip title={text}>{text}</Tooltip></p>
}, {
  dataIndex: "principal",
  title: "数据负责人",
  width: 182,
  render: text => <p className="ellipsis-column2"><Tooltip title={text}>{text}</Tooltip></p>
}, {
  dataIndex: "proDataCategory",
  title: "专业数据类别"
}, {
  dataIndex: "summary",
  title: "摘要",
  width: 332,
  render: text => <p className="ellipsis-column3"><Tooltip title={text}>{text}</Tooltip></p>
}, {
  dataIndex: "time",
  title: "创建时间"
}, {
  dataIndex: "operation",
  title: "操作",
  render: (_, { dataEntity, dataSetName, key }) => {
    let fileSuffix = dataEntity.split(".").pop();
    return <Button type="primary" onClick={(e) => _this.handleDownload(e, dataSetName, dataEntity, key)} loading={_this.state.btnLoading[dataSetName + "" + key]}>
      {imgSuffix.includes(fileSuffix) ? "预览" : txtSuffix.includes(fileSuffix) || /i[0-9]/.test(fileSuffix) ? "查看" : "下载"}
    </Button>
  }
}];
const imgSuffix = ["bmp", "jpg", "png", "tif", "gif", "pcx", "tga", "exif", "fpx", "svg", "psd", "cdr", "pcd", "dxf", "ufo", "eps", "ai", "raw", "WMF", "webp", "avif"];
const txtSuffix = ["cpp", "py", "txt", "stp", "pdf", "pos", "script"];
class Download extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: [],
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      loading: false,
      keyLoading: false,
      allData: [],
      //关键字查询
      keyCol: [],
      keyData: [],
      //表单对应的数据数量
      sheetDataLen: {},
      //当前表单对应的数据数量
      currentDataSetName: "",
      //查询关键字
      selectKeys: "",
      //关键词查询结果的列名和数据
      keyCols: [],
      keyDatas: [],
      //数据集名称
      datasetNames: [],
      //可否修改数据集名字
      dataSetSelect: true,
      //已上传文件列表
      fileList: [],
      //当前drawer显示内容对应的数据集
      dataSetDrawer: "",
      //drawer中的文件列表
      drawerFileList: [],
      selectKey: "",
      btnLoading: {},
      previewUrl: "",
      visible: false,
      open: false,
      name: "",
      searchType: true,
      selectedCategory: undefined,
      time: ""
    };
    this.lock = null;
  };

  componentDidMount() {
    axios.defaults.timeout = 600000;
    //获取所有数据集名称
    apiPromise.then(res => {
      baseUrl = res.data.baseUrl;
      selectByOneUrl = res.data.baseUrl + "/Bigdata/service/ipig/selectByOne";
      selectByTwoUrl = res.data.baseUrl + "/Bigdata/service/ipig/selectByTwo";
      selectByThreeUrl = res.data.baseUrl + "/Bigdata/service/ipig/selectByThree";
    }).then(() => {
      axios({
        method: 'get',
        url: baseUrl + "/Bigdata/service/ipig/getDataSetNameList"
      }).then((res) => {
        res.data.length > 0 && this.setState({ datasetNames: Array.from(new Set(res.data)) });
      });
      this.handleSelect();
    });
  };

  //查询数据（通用）
  handleSelect = () => {
    const { pagination } = this.state;
    this.fetch({ pagination });
  };

  //全部数据集（未分类）
  handleTableChange = (pagination, filters, sorter) => {
    if (!this.state.select) {
      this.fetch({
        sortField: sorter.field,
        sortOrder: sorter.order,
        pagination,
        ...filters,
      });
    } else {
      this.setState({
        pagination
      })
    }
  };

  handleDownload = (e, dataSetName, fileName, key) => {
    this.btnLoadingStatus(dataSetName + "" + key, true);
    let fileSuffix = fileName.split(".").pop();
    axios({
      method: 'get',
      url: baseUrl + "/Bigdata/service/ipig/downDataFile",
      params: { downDataFileName: fileName, dataSetName: dataSetName }
    }).then((res) => {
      if (res.data) {
        if (imgSuffix.indexOf(fileSuffix) > -1) {
          this.setState({
            previewUrl: baseUrl + res.data,
            visible: true
          });
        } else if (txtSuffix.indexOf(fileSuffix) > -1 || /i[0-9]/.test(fileSuffix)) {
          window.open(baseUrl + res.data);
        } else {
          let elementA = document.createElement('a');
          elementA.style.display = 'none';
          elementA.href = baseUrl + res.data;
          document.body.appendChild(elementA);
          elementA.click();
          document.body.removeChild(elementA);
        }
      };
      this.btnLoadingStatus(dataSetName + "" + key, false);
    }).catch(() => {
      message.error("文件信息获取错误");
      this.btnLoadingStatus(dataSetName + "" + key, false);
    })
  }

  fetch = (params = {}) => {
    this.setState({ loading: true });
    let { current, pageSize } = params.pagination;
    let rowKey = ((current - 1) * pageSize + 1) + "-" + (current * pageSize);
    reqwest({
      url: baseUrl + "/Bigdata/service/ipig/select",
      method: 'get',
      type: 'json',
      data: { Key: rowKey }
    }).then(res => {
      if (res.list.length > 0) {
        res.list.map((item, index) => { item.key = index; return item });
        this.setState({
          allData: res.list
        });
      };
      let total = parseInt(res.list[0].num);
      if (total > 0) {
        this.setState({
          loading: false,
          pagination: {
            ...params.pagination,
            total,
          },
        });
      };
    }).catch(() => {
      message.error("数据获取失败")
      this.setState({
        loading: false,
      })
    });
  };

  //查询数据类别（select rowkey)
  dataCategorySelect = (value) => {
    this.setState({
      selectedCategory: value
    });
    if (value !== "无") {
      this.setState({
        select: true,
      });
      axios({
        method: 'get',
        url: baseUrl + "/Bigdata/service/ipig/getDataSetNameByCategory",
        params: { category: value }
      }).then((res) => {
        if (res.data.length > 0) {
          res.data.map((item, index) => { item.key = index; return item });
          this.setState({
            allData: res.data,
            pagination: {
              current: 1,
              pageSize: 10,
              total: res.data.length
            }
          });
        };
      });
    } else {
      this.handleSelect();
    };
  };

  handleSelectKey = (e, key) => {
    this.setState({
      selectKey: e.target.value
    })
  };

  //按钮加载状态
  btnLoadingStatus = (key, bool) => {
    let { btnLoading } = this.state;
    btnLoading[key] = bool;
    this.setState({
      btnLoading
    });
  };

  //根据关键字查询
  handleKeySelect = () => {
    let { selectKey } = this.state;
    this.btnLoadingStatus("keySelect", true);
    //判断关键字个数
    let selectKeys = selectKey ? selectKey.split(" ") : [];
    let keyNum = selectKeys.length;
    let params = {};
    for (let i = 0; i < keyNum; i++) {
      params["Key" + (i + 1)] = selectKeys[i];
    }
    if (keyNum >= 1 && keyNum <= 3) {
      this.setState({ keyLoading: true, select: true })
      axios({
        method: 'get',
        url: keyNum === 1 ? selectByOneUrl : keyNum === 2 ? selectByTwoUrl : keyNum === 3 && selectByThreeUrl,
        params
      }).then((res) => {
        let value = res.data.value ? res.data.value : res.data;
        value.map((item, index) => { item.key = index; return item });
        this.setState({
          allData: value,
          keyLoading: false,
          pagination: {
            current: 1,
            pageSize: 10,
            total: value.length
          }
        })
        this.btnLoadingStatus("keySelect", false);
      }).catch(() => {
        message.error("查询失败！")
        this.btnLoadingStatus("keySelect", false);
      })
    } else {
      message.error("请输入1~3个关键字！")
      this.btnLoadingStatus("keySelect", false);
    };
  };

  onFinish = (e) => {
    e.preventDefault();
    this.props.form.validateFields({ force: true }, (err, values) => {
      if (!err) {
        let { fileList, time } = this.state;
        values.time = time;
        this.btnLoadingStatus("submit", true)
        let newObj = JSON.parse(JSON.stringify(values));
        newObj.dataEntity = fileList;
        axios({
          method: 'post',
          url: baseUrl + "/Bigdata/service/ipig/addMetaData",
          data: newObj
        }).then((res) => {
          if (res.data === "元数据插入成功") {
            message.success("元数据插入成功")
            this.handleSelect();
          } else {
            message.error(res.data)
          };
          this.btnLoadingStatus("submit", false);
        }).catch(() => {
          message.error("提交失败")
          this.btnLoadingStatus("submit", false);
        })
      }
    })
  };
  onNameChange = event => {
    this.setState({
      name: event.target.value,
    });
  };

  addItem = () => {
    const { datasetNames, name } = this.state;
    if (name) {
      this.setState({
        datasetNames: [...datasetNames, name],
        name: '',
      });
    } else {
      message.warn("请填写新数据集名称");
    }
  };

  //当前数据集名
  handleCurrentDataSet = () => {
    let { btnLoading, currentDataSetName } = this.state;
    if (currentDataSetName) {
      btnLoading.dataSetName = true;
      this.setState({
        dataSetSelect: false,
        btnLoading
      }, () => {
        let { btnLoading } = this.state;
        btnLoading.dataSetName = false;
        this.setState({
          btnLoading
        });
      });
    } else {
      message.warn("请选择数据集名称");
    }
  };

  dataSetNameSelect = (e) => {
    this.setState({
      currentDataSetName: e
    });
  };

  customRequest = (info) => {
    let { file } = info;
    let { fileList, currentDataSetName } = this.state;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataSetName', currentDataSetName);
    axios({
      method: 'post',
      url: baseUrl + "/Bigdata/service/ipig/addDataEntity",
      data: formData
    }).then((res) => {
      if (res.data === "数据插入成功") {
        info.onSuccess(res, file);
        message.success("上传成功");
        fileList.push(info.file.name);
        this.setState({
          fileList
        });
      } else {
        info.onError(res, file);
        message.error("上传失败");
      };
    });
  };
  onClose = () => {
    this.setState({
      visible: false
    });
  };
  lockClose = e => {
    clearTimeout(this.lock);
    this.lock = setTimeout(() => {
      this.lock = null;
    }, 100);
  };
  onDropdownVisibleChange = open => {
    if (this.lock) return;
    this.setState({ open });
  };
  handleCancleFilter = () => {
    this.setState({
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      selectedCategory: undefined,
      select: false
    })
    this.fetch({ pagination: { current: 1, pageSize: 10, total: 0 } })
  }
  render() {
    const { pagination, loading, allData, datasetNames, dataSetSelect, btnLoading, name, currentDataSetName, previewUrl, visible, open, searchType, select, selectedCategory } = this.state;
    const { getFieldDecorator } = this.props.form;
    return (
      <Layout id="bdcenter" style={{ minHeight: '100vh' }}>
        <Header />
        <Layout style={{ paddingTop: 50 }}>
          <Content className="site-layout-background">
            <Row>
              <Col md={2} sm={0} xs={0}></Col>
              <Col md={20} sm={24} xs={24} className="box-shadow" style={{ background: "#fff", padding: "0 16px", minHeight: "calc(100vh - 90px)" }}>
                <Tabs defaultActiveKey="1">
                  <TabPane tab="数据文件上传" key="1">
                    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
                      <Form
                        {...layout}
                        onSubmit={this.onFinish}
                      >
                        <Row>
                          <Form.Item label="数据集名称">
                            {getFieldDecorator('dataSetName', {
                              rules: [
                                {
                                  required: true,
                                  message: '请输入数据集名称',
                                },
                              ],
                              setFieldsValue: currentDataSetName
                            })(
                              <Select
                                disabled={!dataSetSelect}
                                style={{ width: "calc(100% - 80px)" }}
                                onChange={this.dataSetNameSelect}
                                open={open}
                                onDropdownVisibleChange={this.onDropdownVisibleChange}
                                placeholder="选择/新建数据集"
                                dropdownRender={menu => (
                                  <div>
                                    {menu}
                                    <Divider style={{ margin: '4px 0' }} />
                                    <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                                      <Input
                                        style={{ flex: 'auto' }}
                                        value={name}
                                        onChange={this.onNameChange}
                                        onMouseDown={this.lockClose}
                                        onMouseUp={this.lockClose}
                                        placeholder="数据集名称"
                                      />
                                      <span style={{ flex: 'none', display: 'block', cursor: 'pointer', lineHeight: "32px" }} onClick={this.addItem} onMouseDown={this.lockClose} onMouseUp={this.lockClose}>
                                        <Icon type="plus" /> 新增数据集
                                      </span>
                                    </div>
                                  </div>
                                )}
                              >
                                {datasetNames.length > 0 && datasetNames.map(item => (
                                  <Option key={item}>{item}</Option>
                                ))}
                              </Select>
                            )}
                          </Form.Item>
                          <Button onClick={this.handleCurrentDataSet} type="primary" loading={btnLoading.dataSetName} style={{ position: "absolute", right: 0, bottom: 28 }}>确定</Button>
                        </Row>
                        <Form.Item label="摘要(50字以内)">
                          {getFieldDecorator('summary', {
                            rules: [
                              {
                                required: true,
                                message: '请输入摘要',
                              },
                            ],
                          })(
                            <Input.TextArea></Input.TextArea>
                          )}
                        </Form.Item>
                        <Form.Item label="关键字">
                          {getFieldDecorator('keyWords', {
                            rules: [
                              {
                                required: true,
                                message: '请输入关键字',
                              },
                            ],
                          })(
                            <Input placeholder="请输入关键字"></Input>
                          )}
                        </Form.Item>
                        <Form.Item label="专业数据类别">
                          {getFieldDecorator('proDataCategory', {
                            rules: [
                              {
                                required: true,
                                message: '请输入专业数据类别',
                              },
                            ],
                          })(
                            <Input placeholder="请输入专业数据类别"></Input>
                          )}
                        </Form.Item>
                        <Form.Item label="数据格式">
                          {getFieldDecorator('dataFormat', {
                            rules: [
                              {
                                required: true,
                                message: '请输入数据集格式',
                              },
                            ],
                          })(
                            <Input placeholder="请输入数据集格式"></Input>
                          )}
                        </Form.Item>
                        <Form.Item label="创建时间">
                          {getFieldDecorator('time', {
                            rules: [
                              {
                                required: true,
                                message: '请输入创建时间',
                              },
                            ],
                          })(
                            <DatePicker locale={locale} onChange={(date, dateString) => { this.setState({ time: dateString }) }} />
                          )}
                        </Form.Item>
                        <Form.Item label="数据来源">
                          {getFieldDecorator('dataSource', {
                            rules: [
                              {
                                required: true,
                                message: '请输入数据来源',
                              },
                            ],
                          })(
                            <Input placeholder="请输入数据来源"></Input>
                          )}
                        </Form.Item>
                        <Form.Item label="数据负责人">
                          {getFieldDecorator('principal', {
                            rules: [
                              {
                                required: true,
                                message: '请输入数据负责人',
                              },
                            ],
                          })(
                            <Input placeholder="请输入数据负责人"></Input>
                          )}
                        </Form.Item>
                        <Form.Item label="数据文件">
                          {getFieldDecorator('dataEntity', {
                            valuePropName: 'fileList',
                            getValueFromEvent: e => {
                              if (Array.isArray(e)) {
                                return e;
                              }
                              return e && e.fileList;
                            },
                            rules: [{
                              required: true,
                              validator: (rule, value, callback) => {
                                if (currentDataSetName && !value) {
                                  return callback('请上传数据文件！')
                                } else if (!currentDataSetName) {
                                  return callback('请选择数据集名称并确定！')
                                } else {
                                  return callback()
                                }
                              }
                            }],
                          })(
                            <Upload className="uploadFile" customRequest={this.customRequest} multiple={true}>
                              <Button disabled={dataSetSelect} title={dataSetSelect ? "请选择数据集名称并确定" : ""} type="primary"><Icon type="upload" />上传</Button>
                            </Upload>
                          )}
                        </Form.Item>
                        <Form.Item {...tailLayout} style={{ textAlign: "center" }}>
                          <Button type="primary" htmlType="submit" >提交</Button>
                        </Form.Item>
                      </Form>
                    </div>
                  </TabPane>
                  <TabPane tab="文件信息检索" key="2">
                    <div className="search-type">
                      <label className="name">数据检索方式：</label>
                      <Radio.Group onChange={(e) => { this.setState({ searchType: e.target.value }) }} value={searchType}>
                        <Radio value={true}>数据集名称检索</Radio>
                        <Radio value={false}>关键词检索</Radio>
                      </Radio.Group>
                    </div>
                    <div className="search-area">
                      {searchType ?
                        <>
                          <label className="name">数据集名称：</label>
                          <Select onChange={this.dataCategorySelect} value={selectedCategory} placeholder="选择数据集" className="dataset-select">
                            {datasetNames.length > 0 && datasetNames.map((item, index) => {
                              return (
                                <Option key={index} value={item}>{item}</Option>
                              )
                            })}
                          </Select>
                        </>
                        :
                        <>
                          <label className="name">关键词：</label>
                          <Form className="select-key">
                            <Form.Item style={{ marginBottom: 0 }}>
                              {getFieldDecorator('selectKey', {
                                rules: [
                                  {
                                    validator: (rule, value, callback) => {
                                      if (value.split(" ").length < 4) {
                                        return callback()
                                      } else {
                                        return callback('请不要输入三个以上的关键字！')
                                      }
                                    }
                                  },
                                ],
                              })(
                                <Input placeholder="请输入1~3个关键字，以空格分隔" onChange={this.handleSelectKey}></Input>
                              )}
                            </Form.Item>
                          </Form>
                          <Button onClick={this.handleKeySelect} type="primary">查询</Button>
                        </>
                      }
                    </div>
                    <div style={{ textAlign: "right", marginBottom: 24 }}>
                      <Button disabled={!select} type="primary" onClick={this.handleCancleFilter}>取消筛选</Button>
                    </div>
                    <Table
                      columns={columns(this)}
                      dataSource={allData}
                      pagination={{
                        ...pagination,
                        hideOnSinglePage: true,
                      }}
                      loading={loading}
                      onChange={this.handleTableChange}
                      scroll={{ x: "max-content" }}
                    />
                  </TabPane>
                </Tabs>
              </Col>
              <Col md={2} sm={0} xs={0}></Col>
            </Row>
          </Content>
        </Layout>
        <Modal visible={visible} onClose={this.onClose} footer={null} onCancel={this.onClose} centered={true}>
          <div style={{ width: "100%", textAlign: "center" }}>
            <img alt="preview" src={previewUrl} style={{ width: "100%", height: "100%", marginTop: "40px" }}></img>
          </div>
        </Modal>
      </Layout >
    );
  };
};

export default Form.create({ name: "uploadFile" })(Download);