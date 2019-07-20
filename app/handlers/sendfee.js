const utils = require('./utils/utils.js');

module.exports = async function(client, req, callback) {
    const rule = [
        {
            name: 'minAmount',
            value: null,
            is_valid: function(amount) {
                if (!validator.isFloat(amount)) {
                    return false;
                }
                this.value = amount;
                return true;
            }
        }
    ];
    if (!utils.validationParams(req, rule, callback)) {
        return;
    }
 
    callback(undefined, null);
 }