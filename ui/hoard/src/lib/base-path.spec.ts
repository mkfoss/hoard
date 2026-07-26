import { describe, expect, it } from 'vitest';
import { DEFAULT_BASE_PATH, resolveBasePath } from './base-path';

describe('resolveBasePath', () => {
	it('defaults to /hoard when the override is unset', () => {
		expect(resolveBasePath(undefined)).toBe(DEFAULT_BASE_PATH);
		expect(DEFAULT_BASE_PATH).toBe('/hoard');
	});

	it('treats an empty override as the site root', () => {
		expect(resolveBasePath('')).toBe('');
	});

	it('accepts a root-relative override', () => {
		expect(resolveBasePath('/media/hoard')).toBe('/media/hoard');
	});

	it('strips a trailing slash so the base never ends in /', () => {
		expect(resolveBasePath('/hoard/')).toBe('/hoard');
		expect(resolveBasePath('/')).toBe('');
	});

	it('rejects an override that does not begin with /', () => {
		expect(() => resolveBasePath('hoard')).toThrow(/HOARD_BASE_PATH/);
	});
});
