const fs = require('fs');

module.exports = {
    // 存储路径
    getPath: function() {
        if (!fs.existsSync('db')) {
            fs.mkdirSync('db');
        }
        return 'db/listunspent.json';
    },

    // 获取高度
    getListUnspent : function() {
        if (!fs.existsSync(this.getPath())) {
            fs.writeFileSync(this.getPath(), '[]');
        }
        let listunspent = JSON.parse(fs.readFileSync(this.getPath(), 'utf-8'));
        return listunspent || [];
    },

    // 更新高度
    setListUnspent : function(listunspent) {
        let json = JSON.stringify(listunspent);
        fs.writeFileSync(this.getPath(), json);
    }
};
