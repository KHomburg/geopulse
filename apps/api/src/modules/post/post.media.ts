export const MAX_POST_MEDIA_ITEMS = 6;

function normalizePostMediaUrls(values: Array<string | null | undefined>) {
	const normalizedUrls: string[] = [];
	const seen = new Set<string>();

	for (const value of values) {
		if (typeof value !== "string") {
			continue;
		}

		const trimmed = value.trim();
		if (!trimmed || seen.has(trimmed)) {
			continue;
		}

		normalizedUrls.push(trimmed);
		seen.add(trimmed);

		if (normalizedUrls.length >= MAX_POST_MEDIA_ITEMS) {
			break;
		}
	}

	return normalizedUrls;
}

export function mergeIncomingPostMediaUrls(params: {
	mediaUrl?: string | null;
	mediaUrls?: string[] | null;
}) {
	return normalizePostMediaUrls([
		params.mediaUrl,
		...(params.mediaUrls ?? [])
	]);
}

export function parseStoredPostMediaUrls(
	storedMedia: string | null | undefined
) {
	if (!storedMedia) {
		return [];
	}

	const trimmed = storedMedia.trim();
	if (!trimmed) {
		return [];
	}

	try {
		const parsed = JSON.parse(trimmed) as unknown;

		if (Array.isArray(parsed)) {
			return normalizePostMediaUrls(
				parsed.filter(
					(value): value is string => typeof value === "string"
				)
			);
		}

		if (typeof parsed === "string") {
			return normalizePostMediaUrls([parsed]);
		}
	} catch {
		// Legacy rows can still contain a plain single URL.
	}

	return normalizePostMediaUrls([trimmed]);
}

export function serializePostMediaUrls(mediaUrls: string[]) {
	const normalizedUrls = normalizePostMediaUrls(mediaUrls);
	return normalizedUrls.length > 0 ? JSON.stringify(normalizedUrls) : null;
}
