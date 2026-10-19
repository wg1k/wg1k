(() => {
    const CODERSRANK_ICON_API = 'https://icon-widget.codersrank.io/api/';
    const SIMPLE_ICONS = 'https://cdn.simpleicons.org';
    const SIMPLE_ICONS_INDEX = 'https://cdn.jsdelivr.net/npm/simple-icons@latest/data/simple-icons.json';
    const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@2.17.0';

    const { resolveName, findSimpleIconSlug, findDevicon } = window.iconLookup;

    const repairs = new Set();
    const unrepaired = [];

    const fetchOnce = (url) => {
        let index;
        return () => {
            index ??= fetch(url)
                .then((response) => response.json())
                .catch((error) => {
                    console.warn(`index ${url} failed (${error.message})`);
                    return [];
                });
            return index;
        };
    };

    const simpleIconsIndex = fetchOnce(SIMPLE_ICONS_INDEX);
    const deviconIndex = fetchOnce(`${DEVICON}/devicon.json`);

    const simpleIconsUrl = async (name) => {
        const slug = findSimpleIconSlug(await simpleIconsIndex(), name);
        return slug && `${SIMPLE_ICONS}/${slug}`;
    };

    const deviconUrl = async (name) => {
        const icon = findDevicon(await deviconIndex(), name);
        return icon && `${DEVICON}/icons/${icon.name}/${icon.name}-${icon.style}.svg`;
    };

    const fallbackUrls = async (language) => {
        const name = resolveName(language);
        const urls = [await simpleIconsUrl(name), await deviconUrl(name)];
        return urls.filter(Boolean);
    };

    const loads = (img, url) => new Promise((resolve) => {
        img.addEventListener('load', () => resolve(true), { once: true });
        img.addEventListener('error', () => resolve(false), { once: true });
        img.src = url;
    });

    const repairIcon = async (img) => {
        const language = decodeURIComponent(img.src.slice(CODERSRANK_ICON_API.length));
        for (const url of await fallbackUrls(language)) {
            if (await loads(img, url)) {
                console.log(`icon ${language}: ${url}`);
                return;
            }
        }
        unrepaired.push(language);
    };

    const track = (repair) => {
        repairs.add(repair);
        repair.finally(() => repairs.delete(repair));
    };

    const onImageError = (event) => {
        if (event.target.src?.startsWith(CODERSRANK_ICON_API)) {
            track(repairIcon(event.target));
        }
    };

    window.iconsRepaired = async () => {
        while (repairs.size > 0) {
            await Promise.allSettled([...repairs]);
        }
        if (unrepaired.length > 0) {
            throw new Error(`No icon found for ${unrepaired.join(', ')}`);
        }
    };

    const attachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init) {
        const root = attachShadow.call(this, init);
        root.addEventListener('error', onImageError, true);
        return root;
    };
})();
