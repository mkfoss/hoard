import { describe, expect, it } from 'vitest';
import { SCENE_PAGE_SIZE, formatDuration, sceneTitle } from './display';

describe('SCENE_PAGE_SIZE', () => {
	it('caps the list at 100', () => {
		expect(SCENE_PAGE_SIZE).toBe(100);
	});
});

describe('sceneTitle', () => {
	it('prefers the scene title', () => {
		expect(sceneTitle({ title: 'A Title', files: [{ basename: 'file.mp4' }] })).toBe('A Title');
	});

	// Untitled scenes are the common case in a freshly scanned library, and the
	// server returns both null and empty string for them.
	it('falls back to the filename when there is no title', () => {
		expect(sceneTitle({ title: null, files: [{ basename: 'clip.mp4' }] })).toBe('clip.mp4');
		expect(sceneTitle({ title: '', files: [{ basename: 'clip.mp4' }] })).toBe('clip.mp4');
		expect(sceneTitle({ title: '   ', files: [{ basename: 'clip.mp4' }] })).toBe('clip.mp4');
	});

	it('uses the first file when a scene has several', () => {
		expect(sceneTitle({ title: null, files: [{ basename: 'a.mp4' }, { basename: 'b.mp4' }] })).toBe(
			'a.mp4'
		);
	});

	// A scene whose files have all been removed still has a database row.
	it('degrades to a placeholder when there is neither title nor file', () => {
		expect(sceneTitle({ title: null, files: [] })).toBe('Untitled scene');
	});
});

describe('formatDuration', () => {
	it('renders minutes and seconds below an hour', () => {
		expect(formatDuration(0)).toBe('0:00');
		expect(formatDuration(9)).toBe('0:09');
		expect(formatDuration(75)).toBe('1:15');
		expect(formatDuration(599)).toBe('9:59');
	});

	it('renders hours when the scene is long enough', () => {
		expect(formatDuration(3600)).toBe('1:00:00');
		expect(formatDuration(3725)).toBe('1:02:05');
	});

	it('rounds fractional seconds rather than showing them', () => {
		expect(formatDuration(75.6)).toBe('1:16');
	});

	it('returns nothing for a missing or nonsensical duration', () => {
		expect(formatDuration(undefined)).toBe('');
		expect(formatDuration(-1)).toBe('');
		expect(formatDuration(Number.NaN)).toBe('');
	});
});
