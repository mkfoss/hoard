import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import SceneList from './SceneList.svelte';
import { SCENE_PAGE_SIZE } from '$lib/scenes/display';

afterEach(() => {
	vi.unstubAllGlobals();
});

type SceneRow = {
	id: string;
	title: string | null;
	date: string | null;
	studio: { name: string } | null;
	files: { basename: string; duration: number }[];
	paths: { screenshot: string | null };
};

function scene(overrides: Partial<SceneRow> = {}): SceneRow {
	return {
		id: '1',
		title: 'A Scene',
		date: '2026-01-02',
		studio: { name: 'A Studio' },
		files: [{ basename: 'a.mp4', duration: 75 }],
		paths: { screenshot: '/scene/1/screenshot' },
		...overrides
	};
}

function stubScenes(scenes: SceneRow[], count = scenes.length) {
	const fetchMock = vi.fn<typeof fetch>(
		async () =>
			new Response(JSON.stringify({ data: { findScenes: { count, scenes } } }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
	);
	vi.stubGlobal('fetch', fetchMock);

	return fetchMock;
}

function stubStatus(status: number) {
	vi.stubGlobal(
		'fetch',
		vi.fn<typeof fetch>(async () => new Response('', { status }))
	);
}

describe('SceneList', () => {
	it('requests no more than the capped page size', async () => {
		const fetchMock = stubScenes([scene()]);

		render(SceneList);
		await expect.element(page.getByText('A Scene')).toBeInTheDocument();

		const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
		expect(body.variables).toEqual({ perPage: SCENE_PAGE_SIZE });
	});

	it('lists each scene with its studio and duration', async () => {
		stubScenes([
			scene(),
			scene({
				id: '2',
				title: 'Another',
				studio: { name: 'Other Studio' },
				files: [{ basename: 'b.mp4', duration: 3725 }]
			})
		]);

		render(SceneList);

		await expect.element(page.getByText('A Scene')).toBeInTheDocument();
		await expect.element(page.getByText('Another')).toBeInTheDocument();
		await expect.element(page.getByText('A Studio')).toBeInTheDocument();
		await expect.element(page.getByText('Other Studio')).toBeInTheDocument();
		await expect.element(page.getByText('1:15')).toBeInTheDocument();
		await expect.element(page.getByText('1:02:05')).toBeInTheDocument();
	});

	it('falls back to the filename for an untitled scene', async () => {
		stubScenes([scene({ title: '', files: [{ basename: 'untitled-clip.mp4', duration: 10 }] })]);

		render(SceneList);

		await expect.element(page.getByText('untitled-clip.mp4')).toBeInTheDocument();
	});

	it('says so when the library is empty rather than showing a blank page', async () => {
		stubScenes([]);

		render(SceneList);

		await expect.element(page.getByText(/No scenes/i)).toBeInTheDocument();
	});

	it('offers a way to sign in when the session is missing', async () => {
		stubStatus(401);

		render(SceneList);

		await expect.element(page.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
	});

	it('reports a failure rather than an empty library', async () => {
		stubStatus(500);

		render(SceneList);

		await expect.element(page.getByText(/could not be loaded/i)).toBeInTheDocument();
	});

	// count is the library total; the list is capped. Showing "100 scenes" when
	// there are 4000 would be a lie.
	it('says the list is capped when more scenes exist than are shown', async () => {
		stubScenes([scene()], 4000);

		render(SceneList);

		await expect.element(page.getByText(/4000/)).toBeInTheDocument();
	});
});
