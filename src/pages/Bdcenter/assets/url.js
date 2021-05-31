export let baseUrl = "http://192.168.0.101:8080";
//hdfs上传文件地址
export let hdfsUploadUrl = baseUrl + "/Bigdata/service/ipig/addDataEntity";
export let hbaseUploadUrl = baseUrl + "/Bigdata/service/ipig/upload_csv";
export let importUrl = baseUrl + "/Bigdata/service/ipig/import";
export let selectUrl = baseUrl + "/Bigdata/service/ipig/select";
//获取所有表单名
export let getAllTableUrl = baseUrl + "/Bigdata/service/ipig/getAllTable";
export let downloadUrl = baseUrl + "/Bigdata/service/ipig/getDataNameByPath";
export let downloadHref = baseUrl + "/Bigdata/service/ipig/download?hdfsPath=/data/";

export let selectByOneUrl = baseUrl + "/Bigdata/service/ipig/selectByOne";
export let selectByTwoUrl = baseUrl + "/Bigdata/service/ipig/selectByTwo";
export let selectByThreeUrl = baseUrl + "/Bigdata/service/ipig/selectByThree";
