module.exports = function nothrow(promise) {  
    return promise.then(data => {
       return [null, data];
    })
    .catch(err => [err]);
 };
 