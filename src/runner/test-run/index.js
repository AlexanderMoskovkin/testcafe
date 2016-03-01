import path from 'path';
import Promise from 'pinkie';
import { Session } from 'testcafe-hammerhead';
import { createDoneCommand, TYPE as COMMAND_TYPE } from './commands';
import CLIENT_MESSAGES from '../client-messages';


export default class TestRun extends Session {
    constructor (test, browserConnection, screenshotCapturer, opts) {
        var uploadsRoot = path.dirname(test.fixture.path);

        super(uploadsRoot);

        this.opts               = opts;
        this.test               = test;
        this.browserConnection  = browserConnection;
        this.screenshotCapturer = screenshotCapturer;

        this.started        = false;
        this.pendingCommand = null;
        this.pendingRequest = null;
        this.pendingJsError = null;

        this.errs = [];
    }

    _getPayloadScript () {
        // TODO
    }

    _getIframePayloadScript () {
        // TODO
    }

    async _start () {
        this.started = true;

        try {
            await this.test.fn(this);
        }
        catch (err) {
            this._fatalError(err);
        }
        finally {
            this.done();
        }
    }

    _fatalError (err) {
        this.errs.push(err);
    }

    _updatePendingWaitCommand () {
        if (this.pendingCommand && this.pendingCommand.command.type === COMMAND_TYPE.wait) {
            var commandArgs = this.pendingCommand.command.arguments;

            if (!commandArgs.startWaitingTime)
                commandArgs.startWaitingTime = Date.now();
            else
                commandArgs.ms -= Date.now() - commandArgs.startWaitingTime;

            if (commandArgs.ms <= 0) {
                this.pendingCommand.resolve();
                this.pendingCommand = null;
            }
        }
    }

    getAuthCredentials () {
        // TODO
    }

    handleFileDownload () {
        // TODO
    }

    handlePageError () {
        // TODO
    }

    executeCommand (command) {
        var pendingJsError = this.pendingJsError;

        if (pendingJsError) {
            this.pendingJsError = null;
            return Promise.reject(pendingJsError);
        }

        if (this.pendingRequest)
            this.pendingRequest.resolve(command);

        return new Promise((resolve, reject) => {
            this.pendingCommand = { command, resolve, reject };
        });
    }

    done () {
        if (this.pendingRequest)
            this.pendingRequest.resolve(createDoneCommand());

        if (this.pendingJsError)
            this.errs.push(this.pendingJsError);

        this.emit('done');
    }
}

// Service message handlers
var ServiceMessages = TestRun.prototype;

ServiceMessages[CLIENT_MESSAGES.ready] = function (msg) {
    this.pendingRequest = null;

    if (!this.started)
        this._start();

    if (msg && msg.commandAccomplished && this.pendingCommand) {
        if (msg.err)
            this.pendingCommand.reject(msg.err);
        else
            this.pendingCommand.resolve();

        this.pendingCommand = null;
    }

    this._updatePendingWaitCommand();

    if (this.pendingCommand) {
        if (this.pendingJsError) {
            this.pendingCommand.reject(this.pendingJsError);
            this.pendingJsError = null;
            this.pendingCommand = null;
        }
        else
            return Promise.resolve(this.pendingCommand.command);
    }

    return new Promise((resolve, reject) => {
        this.pendingRequest = { resolve, reject };
    });
};

ServiceMessages[CLIENT_MESSAGES.jsError] = function (msg) {
    if (this.pendingCommand) {
        this.pendingCommand.reject(msg.err);
        this.pendingCommand = null;
    }
    else
        this.pendingJsError = msg.err;
};
