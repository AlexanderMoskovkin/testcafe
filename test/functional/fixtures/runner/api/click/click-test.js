var runTests = require('../../../../test-runner.js').runTests;
var expect   = require('chai').expect;


describe('api click test', function () {
    it('Should fail when the first argument is invisible', function (done) {
        runTests('click.test.js', 'Should fail when the first argument is invisible')
            .then(function () {
                throw new Error('Test should fail but was succeed');
            })
            .catch(function (err) {
                var expectedError = [
                    'Error at step "1.Click on invisible element":',
                    '',
                    'act.click($input);',
                    '',
                    'A target element \<input id="input"\> of the click action is not visible.',
                    'If this element should appear when you are hovering over another',
                    'element, make sure that you properly recorded the hover action.'
                ].join(' ');

                expect(err['Should fail when the first argument is invisible']).eql(expectedError);
            })
            .then(done)
            .catch(function (err) {
                done(err);
            });
    });

    it('Pointer events test (T191183) [ONLY:ie]', function () {
        return runTests('click.test.js', 'Pointer events test (T191183) [ONLY:ie]')
            .catch(function (err) {
                expect(err['Pointer events test (T191183) [ONLY:ie]']).eql('');
            });
    });
});
