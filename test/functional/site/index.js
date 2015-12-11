var Server = require('./server');


var server1 = null;
var server2 = null;

exports.create = function (port1, port2, basePath) {
    server1 = new Server(port1, basePath);
    server2 = new Server(port2, basePath);
};

exports.destroy = function () {
    server1.close();
    server2.close();
};
