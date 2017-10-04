import { t } from 'testcafe';

fixture `f`.page `https://google.com`;

test('t', async t => {
    await t
        .debug()
        .click('body')
        .click('body')
        .debug()
        .click('body');

    await t.eval(() => {throw new Error('err')});
});