/*
 *文件名 : index.js
 *作者 : 刘哲
 *创建时间 : 2020/8/24
 *文件描述 : 检测是否为空值
 */

import { message } from "antd";

export default function checkNullvalue(param) {
    if (param !== null) {
        if (param.lenth === 0) {
            message.error("参数值不能为空，请填写后重新提交", 2);
            return false;
        } else {
            let checks = true;
            for (let i = 0; i < param.length; i++) {
                if (param[i].currentValue === undefined || param[i].currentValue === "" || param[i].currentValue.length === 0) {
                    message.error(`${param[i].paramName}的值不能为空，请填写后重新提交`, 2);
                    checks = checks && false;
                } else {
                    checks = checks && true;
                }
            };
            return checks;
        };
    } else {
        return true;
    };
};