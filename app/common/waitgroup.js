class WaitGrounp {
    constructor(count) {
        this._count = count;
    }

    done() {
        if (this._count > 0) {
            this._count--;
        }
    }

    async wait() {
        let self = this;
        function waitDone() {
            return new Promise(function(resolve, reject) {
                function _waitDone() {
                    let handler;
                    if (self._count <= 0) {
                        handler = resolve;
                    } else {
                        handler = _waitDone;
                    }
                    setTimeout(handler, 0);
                }
                _waitDone();
            })
        }
        await waitDone();
    }
};

module.exports = WaitGrounp;
