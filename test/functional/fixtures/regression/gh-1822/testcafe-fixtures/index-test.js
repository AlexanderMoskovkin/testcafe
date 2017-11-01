import { Selector } from 'testcafe';

fixture `gh-1822`
    .page `http://localhost:3000/fixtures/regression/gh-1822/pages/index.html`;

const parent = Selector('#parent');
const child  = Selector('#child');
const iframe = Selector('#iframe');

const YELLOW = 'rgb(255, 255, 0)';
const RED    = 'rgb(255, 0, 0)';
const WHITE  = 'rgb(0, 0, 0)';

test('gh-1822 (NOT IE)', async t => {
    await t
        .hover(Selector("#parent"), { offsetY: -10 })
        .expect(parent.getStyleProperty('background-color')).eql(YELLOW)
        .hover(iframe)
        .expect(parent.getStyleProperty('background-color')).eql(YELLOW)
        .hover('#child', { offsetY: -10 })
        .expect(parent.getStyleProperty('background-color')).eql(YELLOW)
        .expect(child.getStyleProperty('background-color')).eql(RED);
});

test('gh-1822 (IE)', async t => {
    await t
        .debug()
        .hover(Selector("#parent"), { offsetY: -10 })
        .expect(parent.getStyleProperty('background-color')).eql(YELLOW)
        .switchToIframe(iframe)
        .hover('body')
        .switchToMainWindow()
        //.hover(iframe)
        .expect(parent.getStyleProperty('background-color')).eql(WHITE)
        .expect(child.getStyleProperty('background-color')).eql(WHITE)
        .hover('#child', { offsetY: -10 })
        .expect(parent.getStyleProperty('background-color')).eql(YELLOW)
        .expect(child.getStyleProperty('background-color')).eql(RED);
});
