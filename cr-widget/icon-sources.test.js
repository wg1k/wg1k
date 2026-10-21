const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createResolver, CODERSRANK_ICON_API } = require('./icon-sources.js');

const SIMPLE_ICONS_INDEX = 'https://cdn.jsdelivr.net/npm/simple-icons@latest/data/simple-icons.json';
const DEVICON_INDEX = 'https://cdn.jsdelivr.net/gh/devicons/devicon@2.17.0/devicon.json';

const INDEXES = {
    [SIMPLE_ICONS_INDEX]: JSON.stringify([{ title: 'CSS', slug: 'css' }]),
    [DEVICON_INDEX]: JSON.stringify([
        { name: 'css3', altnames: [], versions: { svg: ['original'] } },
    ]),
};

const CODERSRANK_CSS = `${CODERSRANK_ICON_API}CSS`;
const SIMPLE_ICONS_CSS = 'https://cdn.simpleicons.org/css';
const DEVICON_CSS = 'https://cdn.jsdelivr.net/gh/devicons/devicon@2.17.0/icons/css3/css3-original.svg';

const resolverWith = async (responses) => {
    const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'icons-'));
    const fetchText = async (url) => ({ ...INDEXES, ...responses })[url];
    return { cacheDir, resolve: createResolver({ fetchText, cacheDir }) };
};

test('the first source that answers is used and cached', async () => {
    const { cacheDir, resolve } = await resolverWith({
        [CODERSRANK_CSS]: '<svg>codersrank</svg>',
        [SIMPLE_ICONS_CSS]: '<svg>simple</svg>',
    });
    assert.equal(await resolve('CSS'), '<svg>codersrank</svg>');
    assert.equal(await fs.readFile(path.join(cacheDir, 'CSS.svg'), 'utf8'), '<svg>codersrank</svg>');
});

test('the next source is tried when one fails or answers with something else', async () => {
    const { resolve } = await resolverWith({
        [CODERSRANK_CSS]: '<html>503</html>',
        [DEVICON_CSS]: '<svg>devicon</svg>',
    });
    assert.equal(await resolve('CSS'), '<svg>devicon</svg>');
});

test('the cached file is used when every remote source fails', async () => {
    const { cacheDir, resolve } = await resolverWith({});
    await fs.writeFile(path.join(cacheDir, 'CSS.svg'), '<svg>cached</svg>');
    assert.equal(await resolve('CSS'), '<svg>cached</svg>');
});

test('a language with no source and no cached file finds nothing', async () => {
    const { resolve } = await resolverWith({});
    assert.equal(await resolve('CSS'), undefined);
});
