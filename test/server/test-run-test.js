var expect          = require('chai').expect;
var Promise         = require('pinkie');
var noop            = require('noop-fn');
var TestRun         = require('../../lib/runner/test-run');
var commands        = require('../../lib/runner/test-run/commands');
var CLIENT_MESSAGES = require('../../lib/runner/client-messages');

function wait (ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

function nextTick () {
    return wait(0);
}

describe.only('TestRun', function () {
    it('Should send the pending command to client and resolve/reject it when it is done', function () {
        var testMock = {
            fixture: 'fixture',
            fn:      noop
        };

        var testRun          = new TestRun(testMock);
        var click1           = commands.createClickCommand();
        var click2           = commands.createClickCommand();
        var commandsToClient = [];
        var testRunDone      = false;

        testRun.once('done', function () {
            testRunDone = true;
        });

        var readyMsg = {};

        var actionSuccessMsg = {
            commandAccomplished: true,
            err:                 null
        };

        var actionError   = 'action-error';
        var actionFailMsg = {
            commandAccomplished: true,
            err:                 actionError
        };

        function sendClientRequest (msg) {
            return testRun[CLIENT_MESSAGES.ready](msg)
                .then(function (command) {
                    commandsToClient.push(command);
                });
        }

        sendClientRequest(readyMsg)
            .then(function () {
                // NOTE: simulate page reload before pending step is executed
                return sendClientRequest(readyMsg);
            })
            .then(function () {
                return sendClientRequest(actionSuccessMsg);
            })
            .then(function () {
                return sendClientRequest(actionFailMsg);
            });

        return testRun.executeCommand(click1)
            .then(function () {
                return testRun.executeCommand(click2);
            })
            .then(function () {
                throw new Error('command should be rejected');
            })
            .catch(function (err) {
                expect(err).equal(actionError);

                testRun.done();
                return nextTick();
            })
            .then(function () {
                expect(testRunDone).to.be.true;
                expect(commandsToClient.length).eql(4);
                expect(commandsToClient[0]).eql(click1);
                expect(commandsToClient[1]).eql(click1);
                expect(commandsToClient[2]).eql(click2);
                expect(commandsToClient[3].type).eql(commands.TYPE.testDone);
            });
    });

    it('Should call test.fn() and complete the test after it is resolved', function () {
        var testMock = {
            fixture: 'fixture',
            fn:      Promise.resolve
        };

        var testRun     = new TestRun(testMock);
        var testRunDone = false;

        testRun.once('done', function () {
            testRunDone = true;
        });

        return testRun[CLIENT_MESSAGES.ready]()
            .then(function (command) {
                expect(command.type).eql(commands.TYPE.testDone);
                expect(testRunDone).to.be.true;
            });
    });

    it('Should call test.fn() and complete the test with an error after it is rejected', function () {
        var testError = 'test-error';
        var testMock  = {
            fixture: 'fixture',

            fn: function () {
                return Promise.reject(testError);
            }
        };

        var testRun     = new TestRun(testMock);
        var testRunDone = false;

        testRun.once('done', function () {
            testRunDone = true;
        });

        return testRun[CLIENT_MESSAGES.ready]()
            .then(function (command) {
                expect(testRun.errs[0]).eql(testError);
                expect(command.type).eql(commands.TYPE.testDone);
                expect(testRunDone).to.be.true;
            });
    });

    it('Should update the startWaitingTime argument for the wait command when it is requested from the client', function () {
        var waitCommand      = commands.createWaitCommand(100);
        var commandsToClient = [];

        var testMock = {
            fixture: 'fixture',
            fn:      function (testRun) {
                testRun
                    .executeCommand(waitCommand)
                    .then(function () {
                        testRun.done();
                    });
            }
        };

        var testRun = new TestRun(testMock);

        return testRun[CLIENT_MESSAGES.ready]()
            .then(function (waitAction) {
                commandsToClient.push(waitAction);
                expect(waitAction.arguments.ms).eql(100);

                return wait(50);
            })
            .then(function () {
                return testRun[CLIENT_MESSAGES.ready]();
            })
            .then(function (waitAction) {
                commandsToClient.push(waitAction);
                expect(waitAction.arguments.ms).to.be.within(1, 50);

                return wait(50);
            })
            .then(function () {
                return testRun[CLIENT_MESSAGES.ready]();
            })
            .then(function (doneCommand) {
                expect(doneCommand.type).eql(commands.TYPE.testDone);
            });
    });

    it('Should reject pending command if an js-error is raised', function () {
        var testMock = {
            fixture: 'fixture',
            fn:      noop
        };

        var clickCommand = commands.createClickCommand();
        var jsError      = 'js-error';

        var testRun = new TestRun(testMock);

        nextTick()
            .then(function () {
                return testRun[CLIENT_MESSAGES.ready]();
            })
            .then(function () {
                testRun[CLIENT_MESSAGES.jsError]({ err: jsError });
            });

        return testRun
            .executeCommand(clickCommand)
            .then(function () {
                throw 'command executing should fail but it is succeed';
            })
            .catch(function (err) {
                expect(err).eql(jsError);
            });
    });

    it('Should reject the next command if an js-error is raised when there are no pending command', function () {
        var clickCommand = commands.createClickCommand();

        var testMock = {
            fixture: 'fixture',
            fn:      function (testRun) {
                return testRun.executeCommand(clickCommand);
            }
        };

        var jsError = 'js-error';
        var testRun = new TestRun(testMock);

        testRun[CLIENT_MESSAGES.jsError]({ err: jsError });

        return testRun[CLIENT_MESSAGES.ready]()
            .then(function (command) {
                expect(command.type).eql(commands.TYPE.testDone);
                expect(testRun.errs[0]).eql(jsError);
            });
    });

    it('Should add an error when test is done if there are no commands after js error is raised', function () {
        var testMock = {
            fixture: 'fixture',
            fn:      function () {
                return nextTick()
                    .then(Promise.resolve);
            }
        };

        var jsError = 'js-error';
        var testRun = new TestRun(testMock);

        testRun[CLIENT_MESSAGES.jsError]({ err: jsError });

        return testRun[CLIENT_MESSAGES.ready]()
            .then(function (command) {
                expect(command.type).eql(commands.TYPE.testDone);
                expect(testRun.errs[0]).eql(jsError);
            });
    });
});
