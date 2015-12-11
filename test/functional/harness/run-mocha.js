var Mocha     = require('mocha');
var promisify = require('es6-promisify');

module.exports = function (tests, timeout) {
    var mocha = new Mocha({
        ui:              'bdd',
        reporter:        'spec',
        timeout:         timeout,
        reporterOptions: void 0
    });

    var runMocha = promisify(mocha.run.bind(mocha));

    if (Array.isArray(tests)) {
        tests.forEach(function (test) {
            mocha.addFile(test);
        });
    }
    else
        mocha.addFile(tests);

    return runMocha();
};
