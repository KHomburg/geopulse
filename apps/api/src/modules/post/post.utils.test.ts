import { describe, it, expect } from "@jest/globals";
import {
	snapToGrid,
	addRandomOffset,
	obfuscateCoordinates,
	haversineDistanceMeters,
	resolveAuthorDisplay
} from "./post.utils";

describe("post.utils – snapToGrid", () => {
	it("snaps coordinates to a ~100m grid", () => {
		const { lat, lng } = snapToGrid(48.8566, 2.3522);
		// Result should differ from input by at most one grid cell (~0.001°)
		expect(Math.abs(lat - 48.8566)).toBeLessThan(0.002);
		expect(Math.abs(lng - 2.3522)).toBeLessThan(0.002);
	});

	it("is idempotent – snapping already-snapped value returns same value", () => {
		const first = snapToGrid(51.505, -0.09);
		const second = snapToGrid(first.lat, first.lng);
		// Due to floating-point arithmetic the result should be within 1 µm
		expect(Math.abs(second.lat - first.lat)).toBeLessThan(1e-6);
		expect(Math.abs(second.lng - first.lng)).toBeLessThan(1e-6);
	});
});

describe("post.utils – addRandomOffset", () => {
	it("moves the coordinate by 10–50 m", () => {
		const lat = 48.8566;
		const lng = 2.3522;
		const { lat: newLat, lng: newLng } = addRandomOffset(lat, lng);
		const dist = haversineDistanceMeters(lat, lng, newLat, newLng);
		expect(dist).toBeGreaterThanOrEqual(10);
		expect(dist).toBeLessThanOrEqual(60); // allow small floating-point margin
	});

	it("produces different results on subsequent calls", () => {
		const r1 = addRandomOffset(48.8566, 2.3522);
		const r2 = addRandomOffset(48.8566, 2.3522);
		// Extremely unlikely to be identical
		const sameResult = r1.lat === r2.lat && r1.lng === r2.lng;
		expect(sameResult).toBe(false);
	});
});

describe("post.utils – obfuscateCoordinates", () => {
	it("returns obfuscatedLat and obfuscatedLng keys", () => {
		const result = obfuscateCoordinates(48.8566, 2.3522);
		expect(result).toHaveProperty("obfuscatedLat");
		expect(result).toHaveProperty("obfuscatedLng");
	});

	it("never returns exact input coordinates", () => {
		const rawLat = 40.7128;
		const rawLng = -74.006;
		for (let i = 0; i < 10; i++) {
			const { obfuscatedLat, obfuscatedLng } = obfuscateCoordinates(
				rawLat,
				rawLng
			);
			expect(obfuscatedLat).not.toBe(rawLat);
			expect(obfuscatedLng).not.toBe(rawLng);
		}
	});
});

describe("post.utils – haversineDistanceMeters", () => {
	it("returns 0 for same point", () => {
		expect(haversineDistanceMeters(48.8566, 2.3522, 48.8566, 2.3522)).toBe(
			0
		);
	});

	it("calculates known distance accurately", () => {
		// London to Paris is approximately 334–342 km
		const dist = haversineDistanceMeters(51.5074, -0.1278, 48.8566, 2.3522);
		expect(dist / 1000).toBeGreaterThan(330);
		expect(dist / 1000).toBeLessThan(350);
	});
});

describe("post.utils – resolveAuthorDisplay", () => {
	it("public mode returns authorId and no pseudonym", () => {
		const result = resolveAuthorDisplay("public", 42, null);
		expect(result.authorId).toBe(42);
		expect(result.authorPseudonym).toBeNull();
	});

	it("anonymous mode returns null for both", () => {
		const result = resolveAuthorDisplay("anonymous", 42, null);
		expect(result.authorId).toBeNull();
		expect(result.authorPseudonym).toBeNull();
	});

	it("local_legend mode returns pseudonym only", () => {
		const result = resolveAuthorDisplay("local_legend", 42, "TheWatcher");
		expect(result.authorId).toBeNull();
		expect(result.authorPseudonym).toBe("TheWatcher");
	});
});
