const assert = require('node:assert/strict');
const { test } = require('node:test');
const { resolveName, findSimpleIconSlug, findDevicon } = require('./icon-lookup.js');

const SIMPLE_ICONS = [
    { title: 'Shell', slug: 'shell' },
    { title: 'GNU Bash', slug: 'gnubash' },
    { title: 'C++', slug: 'cplusplus' },
    { title: 'Apache Groovy', slug: 'apachegroovy' },
    { title: 'HTML5', slug: 'html5' },
    { title: 'CSS', slug: 'css' },
    { title: 'Go', slug: 'go' },
    { title: 'Google', slug: 'google' },
];

const DEVICONS = [
    { name: 'bash', altnames: ['bourneagainshell'], versions: { svg: ['original', 'plain'] } },
    { name: 'groovy', altnames: ['groovylang', 'apachegroovy'], versions: { svg: ['original', 'plain'] } },
    { name: 'cplusplus', altnames: ['c++', 'cpp'], versions: { svg: ['original', 'plain'] } },
    { name: 'css3', altnames: ['cascadingstylesheets3'], versions: { svg: ['original', 'plain'] } },
    { name: 'html5', altnames: [], versions: { svg: ['original', 'plain'] } },
    { name: 'plainonly', altnames: [], versions: { svg: ['plain', 'line'] } },
];

test('Shell is looked up as Bash, not as the oil company', () => {
    assert.equal(findSimpleIconSlug(SIMPLE_ICONS, resolveName('Shell')), 'gnubash');
    assert.equal(findDevicon(DEVICONS, resolveName('Shell')).name, 'bash');
});

test('HTML is looked up as HTML5', () => {
    assert.equal(findSimpleIconSlug(SIMPLE_ICONS, resolveName('HTML')), 'html5');
    assert.equal(findDevicon(DEVICONS, resolveName('HTML')).name, 'html5');
});

test('CSS is a Simple Icons title and is looked up as css3 in Devicon', () => {
    assert.equal(findSimpleIconSlug(SIMPLE_ICONS, resolveName('CSS')), 'css');
    assert.equal(findDevicon(DEVICONS, resolveName('CSS')).name, 'css3');
});

test('C++ matches by title and by alternative name', () => {
    assert.equal(findSimpleIconSlug(SIMPLE_ICONS, resolveName('C++')), 'cplusplus');
    assert.equal(findDevicon(DEVICONS, resolveName('C++')).name, 'cplusplus');
});

test('Groovy matches a word of the full title and an alternative name', () => {
    assert.equal(findSimpleIconSlug(SIMPLE_ICONS, resolveName('Groovy')), 'apachegroovy');
    assert.equal(findDevicon(DEVICONS, resolveName('Groovy')).name, 'groovy');
});

test('an exact title wins over a word of a longer title', () => {
    assert.equal(findSimpleIconSlug(SIMPLE_ICONS, 'Go'), 'go');
});

test('a name that is no word of any title finds nothing', () => {
    assert.equal(findSimpleIconSlug(SIMPLE_ICONS, 'Gooo'), undefined);
    assert.equal(findDevicon(DEVICONS, 'Gooo'), undefined);
});

test('the original style is preferred, otherwise the first one', () => {
    assert.equal(findDevicon(DEVICONS, 'bash').style, 'original');
    assert.equal(findDevicon(DEVICONS, 'plainonly').style, 'plain');
});

test('names without an alias are used as they are', () => {
    assert.equal(resolveName('Python'), 'Python');
});
