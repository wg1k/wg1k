const NAME_ALIASES = {
    Shell: 'Bash',
    HTML: 'HTML5',
};

const DEVICON_ALIASES = {
    CSS: 'CSS3',
};

const lowerCase = (text) => text.toLowerCase();

const aliasesOf = (icon) => Object.values(icon.aliases || {}).flat().filter((alias) => typeof alias === 'string');

const simpleIconNames = (icon) => [icon.title, ...aliasesOf(icon)].map(lowerCase);

const titleWords = (icon) => lowerCase(icon.title).split(/\W+/);

const resolveName = (language) => NAME_ALIASES[language] || language;

const findSimpleIconSlug = (icons, name) => {
    const target = lowerCase(name);
    const icon = icons.find((i) => simpleIconNames(i).includes(target))
        || icons.find((i) => titleWords(i).includes(target));
    return icon && icon.slug;
};

const findDevicon = (icons, name) => {
    const target = lowerCase(DEVICON_ALIASES[name] || name);
    const icon = icons.find((i) => [i.name, ...i.altnames].some((n) => lowerCase(n) === target));
    if (!icon) {
        return undefined;
    }
    const style = icon.versions.svg.includes('original') ? 'original' : icon.versions.svg[0];
    return { name: icon.name, style };
};

const iconLookup = { resolveName, findSimpleIconSlug, findDevicon };

module.exports = iconLookup;
