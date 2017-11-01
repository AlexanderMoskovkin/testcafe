describe.only('[Regression](GH-1822)', function () {
    it('Should add hover pseudo class to an iframe when cursor is inside it (not IE)', function () {
        return runTests('testcafe-fixtures/index-test.js', 'gh-1822 (NOT IE)', { only: ['chrome'] });
    });

    it.only('Should add hover pseudo class to an iframe when cursor is inside it (not IE)', function () {
        return runTests('testcafe-fixtures/index-test.js', 'gh-1822 (IE)', { only: ['ie', 'edge'] });
    });
});
