(() => {
    const CODERSRANK_ICON_API = 'https://icon-widget.codersrank.io/api/';

    const missing = [];

    const onImageError = (event) => {
        const src = event.target.src;
        if (src?.startsWith(CODERSRANK_ICON_API)) {
            missing.push(decodeURIComponent(src.slice(CODERSRANK_ICON_API.length)));
        }
    };

    window.assertIconsLoaded = () => {
        if (missing.length > 0) {
            throw new Error(`No icon found for ${missing.join(', ')}`);
        }
    };

    const attachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init) {
        const root = attachShadow.call(this, init);
        root.addEventListener('error', onImageError, true);
        return root;
    };
})();
