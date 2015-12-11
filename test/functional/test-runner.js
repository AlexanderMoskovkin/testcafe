var harness = require('./harness');
var path    = require('path');
var caller  = require('caller');


function checkTestByBrowserAlias (test, browserAlias) {
    var matchesOnly = test.match(/\[ONLY\:([,\s\w]*)\]/);
    var matchesSkip = test.match(/\[SKIP\:([,\s\w]*)\]/);

    var only = true;
    var skip = false;

    if (matchesOnly !== null)
        only = matchesOnly[1].indexOf(browserAlias) > -1;

    if (matchesSkip !== null)
        skip = matchesSkip[1].indexOf(browserAlias) > -1;

    return only && !skip;
}

function filterErrorsByUserAgents (errors, userAgents) {
    return errors.filter(function (error) {
        return userAgents.indexOf(error.split('\n')[0]) > -1;
    });
}

function getFailedTests (testCafeReport) {
    var testResults = JSON.parse(testCafeReport).fixtures[0].tests;
    var failedTests = {};

    testResults
        .filter(function (test) {
            return test.errs.length > 0;
        })
        .forEach(function (test) {
            var actualUserAgents = harness.browsersInfo
                .filter(function (browserInfo) {
                    return checkTestByBrowserAlias(test.name, browserInfo.settings.alias);
                })
                .map(function (browserInfo) {
                    return browserInfo.connection.userAgent;
                });

            var actualBrowsersCount = actualUserAgents.length;
            var actualTestErrors    = filterErrorsByUserAgents(test.errs, actualUserAgents);
            var actualTestErrorsCount = actualTestErrors.length;

            if (actualTestErrorsCount) {
                //NOTE: if the test failed in different browsers with the same error we join it to one error
                if (actualTestErrorsCount !== actualBrowsersCount)
                    failedTests[test.name] = actualTestErrors.join('\n');
                else {
                    failedTests[test.name] = actualTestErrors[0]
                        .split('\n')
                        .slice(1)
                        .map(function (str) {
                            return str.trim();
                        })
                        .join(' ');
                }
            }
        });

    return failedTests;
}

exports.runTests = function (fixture, testName) {
    var testCafeReport = '';
    var runner         = harness.testCafe.createRunner();
    var fixturePath    = path.join(path.dirname(caller()), fixture);

    var connections = harness.browsersInfo.map(function (browserInfo) {
        return browserInfo.connection;
    });

    return runner
        .browsers(connections)
        .filter(function (test) {
            return testName ? test === testName : true;
        })
        .reporter('json', {
            write: function (data) {
                testCafeReport += data;
            },

            end: function (data) {
                testCafeReport += data;
            }
        })
        .src(fixturePath)
        .run()
        .then(function () {
            var failedTests = getFailedTests(testCafeReport);

            if (Object.keys(failedTests).length > 0)
                throw failedTests;
        });
};
