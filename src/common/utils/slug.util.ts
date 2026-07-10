export function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 80);
}

export function uniqueSlug(base: string): string {
    const suffix = Date.now().toString(36);
    return `${slugify(base)}-${suffix}`;
}
