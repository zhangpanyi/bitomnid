module.exports = {
    // 验证参数规则
    validationParams: function(req, rule, callback) {
        let params = req.params;
        for (let i = 0; i < rule.length; i++) {
            if (i >= params.length) {
                if (rule[i].value == null) {
                    let error = {code: -32602, message: rule[i].name+' is required'};
                    callback(error, undefined);
                    return false;
                }
                continue;
            }

            if (!rule[i].is_valid(params[i].toString())) {
                let error = {code: -32602, message: rule[i].name+' is invalid param'};
                callback(error, undefined);
                return false;
            }
        }
        return true;
    }
};
