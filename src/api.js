export function apiUrl(path, base = import.meta.env?.VITE_API_BASE_URL || '') {
    if (!base) return path;
    const url = new URL(base);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
        throw new Error('The public API address must be an HTTPS origin without credentials.');
    }
    return `${url.origin}${path}`;
}
