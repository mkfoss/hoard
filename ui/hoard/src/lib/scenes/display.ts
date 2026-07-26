/**
 * How many scenes the list requests. The server applies this as `per_page`, so it
 * is a real limit on work done rather than a client-side truncation.
 *
 * Paging comes later; until then this is the whole list.
 */
export const SCENE_PAGE_SIZE = 100;

/** The parts of a scene needed to label it. */
interface TitledScene {
	title: string | null;
	files: { basename: string }[];
}

/**
 * The name to show for a scene.
 *
 * Most scenes in a freshly scanned library have no title, and the server reports
 * that as either null or an empty string, so people identify them by filename.
 */
export function sceneTitle(scene: TitledScene): string {
	const title = scene.title?.trim();
	if (title) {
		return title;
	}

	const basename = scene.files[0]?.basename.trim();
	if (basename) {
		return basename;
	}

	// The files were removed but the scene row remains.
	return 'Untitled scene';
}

/**
 * Formats a duration in seconds as `m:ss`, or `h:mm:ss` once it reaches an hour.
 *
 * Returns an empty string for a missing or nonsensical value so callers can omit
 * the element entirely rather than rendering "NaN".
 */
export function formatDuration(seconds: number | undefined): string {
	if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
		return '';
	}

	const total = Math.round(seconds);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const secs = total % 60;

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	}

	return `${minutes}:${String(secs).padStart(2, '0')}`;
}
