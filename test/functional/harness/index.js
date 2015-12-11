var Environment   = require('./environment.js');
var runMocha      = require('./run-mocha.js');
var BrowserHelper = require('./browser-helper');

exports.testCafe     = null;
exports.browsersInfo = null;

exports.run = function (hostname, ports, testPath, timeout, browserSettings, sauceLabsSettings) {
    var environment   = new Environment(hostname, ports.testCafePort1, ports.testCafePort2, ports.sitePort1, ports.sitePort2);
    var browserHelper = null;
    var testRunError  = null;

    function tearDown () {
        return browserHelper
            .closeBrowsers()
            .then(function () {
                environment.tearDown();
            });
    }

    return environment
        .start()
        .then(function (tc) {
            exports.testCafe = tc;

            exports.browsersInfo = browserSettings.map(function (settings) {
                return {
                    settings:   settings,
                    connection: tc.createBrowserConnection()
                };
            });

            browserHelper = new BrowserHelper(exports.browsersInfo, sauceLabsSettings);

            return browserHelper.openBrowsers();
        })
        .then(function () {
            return runMocha(testPath, timeout);
        })
        .then(tearDown)
        .catch(function (err) {
            testRunError = err;

            return tearDown();
        })
        .then(function () {
            if (testRunError)
                throw testRunError;
        });
};
