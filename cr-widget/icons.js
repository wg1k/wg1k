(() => {
    const CODERSRANK_ICON_API = 'https://icon-widget.codersrank.io/api/';
    const SIMPLE_ICONS = 'https://cdn.simpleicons.org';
    const SIMPLE_ICONS_INDEX = 'https://cdn.jsdelivr.net/npm/simple-icons@latest/data/simple-icons.json';
    const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@2.17.0';

    const NAME_ALIASES = {
        Shell: 'Bash',
        HTML: 'HTML5',
    };

    const repairs = new Set();

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
        const target = name.toLowerCase();
        const aliasesOf = (icon) => Object.values(icon.aliases || {}).flat().filter((alias) => typeof alias === 'string');
        const namesOf = (icon) => [icon.title, ...aliasesOf(icon)].map((n) => n.toLowerCase());
        const icons = await simpleIconsIndex();
        const icon = icons.find((i) => namesOf(i).includes(target))
            || icons.find((i) => i.title.toLowerCase().split(/\W+/).includes(target));
        return icon && `${SIMPLE_ICONS}/${icon.slug}`;
    };

    const deviconUrl = async (name) => {
        const target = name.toLowerCase();
        const icons = await deviconIndex();
        const icon = icons.find((i) => [i.name, ...i.altnames].some((n) => n.toLowerCase() === target));
        if (!icon) {
            return undefined;
        }
        const style = icon.versions.svg.includes('original') ? 'original' : icon.versions.svg[0];
        return `${DEVICON}/icons/${icon.name}/${icon.name}-${style}.svg`;
    };

    const fallbackUrls = async (language) => {
        const name = NAME_ALIASES[language] || language;
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
        console.error(`No icon found for ${language}`);
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
    };

    const attachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init) {
        const root = attachShadow.call(this, init);
        root.addEventListener('error', onImageError, true);
        return root;
    };
})();
