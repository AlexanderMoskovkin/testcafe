export const TYPE = {
    click:     'click',
    wait:      'wait',
    assertion: 'assertion',
    testDone:  'test-done'
};

export function createClickCommand () {
    return {
        type:      TYPE.click,
        arguments: {}
    };
}

export function createWaitCommand (ms) {
    return {
        type:      TYPE.wait,
        arguments: {
            ms:               ms,
            startWaitingTime: null
        }
    };
}

export function createAssertionCommand () {
    return {
        type:      TYPE.assertion,
        arguments: {}
    };
}

export function createDoneCommand () {
    return {
        type: TYPE.testDone
    };
}
