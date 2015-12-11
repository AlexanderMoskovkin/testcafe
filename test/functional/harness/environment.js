var site           = require('../site');
var createTestCafe = require('../../../lib');

var Environment = module.exports = function (hostname, tcPort1, tcPort2, sitePort1, sitePort2) {
    this.hostname  = hostname;
    this.testCafe  = null;
    this.tcPort1   = tcPort1;
    this.tcPort2   = tcPort2;
    this.sitePort1 = sitePort1;
    this.sitePort2 = sitePort2;
};

Environment.prototype.start = function () {
    var environment = this;

    site.create(this.sitePort1, this.sitePort2, './test/functional/');

    return createTestCafe(this.hostname, this.tcPort1, this.tcPort2)
        .then(function (tc) {
            environment.testCafe = tc;

            return tc;
        });
};

Environment.prototype.tearDown = function () {
    site.destroy();
    this.testCafe.close();
};
