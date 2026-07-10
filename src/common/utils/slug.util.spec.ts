import { slugify, uniqueSlug } from './slug.util';

describe('slug.util', () => {
    it('slugifies names', () => {
        expect(slugify('  Handmade Mugs!  ')).toBe('handmade-mugs');
    });

    it('creates a unique slug with a suffix', () => {
        const slug = uniqueSlug('Jane Store');
        expect(slug.startsWith('jane-store-')).toBe(true);
    });
});
