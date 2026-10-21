const fs = require('node:fs/promises');
const path = require('node:path');
const { resolveName, findSimpleIconSlug, findDevicon } = require('./icon-lookup.js');

const CODERSRANK_ICON_API = 'https://icon-widget.codersrank.io/api/';
const SIMPLE_ICONS = 'https://cdn.simpleicons.org';
const SIMPLE_ICONS_INDEX = 'https://cdn.jsdelivr.net/npm/simple-icons@latest/data/simple-icons.json';
const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@2.17.0';
const CACHE_DIR = path.join(__dirname, 'icons');

const fetchText = async (url) => {
    try {
        const response = await fetch(url);
        return response.ok ? await response.text() : undefined;
    } catch {
        return undefined;
    }
};

const isSvg = (text) => /<svg[\s>]/.test(text || '');

const createResolver = ({ fetchText, cacheDir }) => {
    const indexes = new Map();

    const indexOf = (url) => {
        if (!indexes.has(url)) {
            indexes.set(url, fetchText(url).then((text) => (text ? JSON.parse(text) : [])));
        }
        return indexes.get(url);
    };

    const remoteUrls = async (language) => {
        const name = resolveName(language);
        const slug = findSimpleIconSlug(await indexOf(SIMPLE_ICONS_INDEX), name);
        const devicon = findDevicon(await indexOf(`${DEVICON}/devicon.json`), name);
        return [
            `${CODERSRANK_ICON_API}${encodeURIComponent(language)}`,
            slug && `${SIMPLE_ICONS}/${slug}`,
            devicon && `${DEVICON}/icons/${devicon.name}/${devicon.name}-${devicon.style}.svg`,
        ].filter(Boolean);
    };

    const cacheFile = (language) => path.join(cacheDir, `${encodeURIComponent(language)}.svg`);

    const readCached = (language) => fs.readFile(cacheFile(language), 'utf8').catch(() => undefined);

    const writeCached = async (language, svg) => {
        await fs.mkdir(cacheDir, { recursive: true });
        await fs.writeFile(cacheFile(language), svg);
    };

    return async (language) => {
        for (const url of await remoteUrls(language)) {
            const svg = await fetchText(url);
            if (isSvg(svg)) {
                console.log(`icon ${language}: ${url}`);
                await writeCached(language, svg);
                return svg;
            }
        }
        const cached = await readCached(language);
        if (cached) {
            console.log(`icon ${language}: cached file`);
        }
        return cached;
    };
};

module.exports = {
    CODERSRANK_ICON_API,
    createResolver,
    resolveIcon: createResolver({ fetchText, cacheDir: CACHE_DIR }),
};
