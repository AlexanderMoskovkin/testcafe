import Promise from 'pinkie';


export default class RawDataCompiler {
    canCompile (code, filename) {
        return /\.testcafe$/.test(filename);
    }

    _compileTest (fixture, test) {
        test.fixture = fixture;

        test.fn = testRun => {
            var commandsChain = Promise.resolve();

            test.commands.forEach(command => {
                commandsChain = commandsChain.then(() => testRun.executeCommand(command));
            });

            return commandsChain;
        };

        return test;
    }

    compile (code, filename) {
        var data     = JSON.parse(code);
        var fixtures = data.fixtures;
        var tests    = [];

        fixtures.forEach(fixture => {
            fixture.path  = filename;
            fixture.tests = fixture.tests.map(test => this._compileTest(fixture, test));
            tests         = tests.concat(fixture.tests);
        });

        return tests;
    }
}
