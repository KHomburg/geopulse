import { afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import App from "../../shared/config/express.config";
import { clearMapDiscoveryCache } from "./map.service";

function mockJsonResponse<T>(body: T): Response {
	return {
		ok: true,
		status: 200,
		json: async () => body
	} as Response;
}

describe("Map routes", () => {
	afterEach(() => {
		clearMapDiscoveryCache();
		jest.restoreAllMocks();
	});

	it("returns cached discovery data for repeated nearby lookups", async () => {
		const fetchMock = jest
			.spyOn(globalThis, "fetch")
			.mockImplementation(async (input: string | URL | Request) => {
				const url = String(input);

				if (url.includes("overpass-api.de")) {
					return mockJsonResponse({
						elements: [
							{
								type: "node",
								id: 1,
								lat: 52.5205,
								lon: 13.4052,
								tags: {
									name: "Berlin Dungeon",
									tourism: "attraction",
									"addr:street": "Spandauer Straße",
									"addr:suburb": "Mitte"
								}
							}
						]
					});
				}

				if (url.includes("nominatim.openstreetmap.org")) {
					return mockJsonResponse({
						address: {
							neighbourhood: "Nikolaiviertel"
						}
					});
				}

				throw new Error(`Unexpected fetch URL: ${url}`);
			});

		const first = await request(App)
			.get("/api/v1/map/discovery")
			.query({ lat: 52.52, lng: 13.405, radiusMeters: 650 })
			.expect(200);

		const second = await request(App)
			.get("/api/v1/map/discovery")
			.query({ lat: 52.52, lng: 13.405, radiusMeters: 650 })
			.expect(200);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(first.body.data.areaLabel).toBe("Nikolaiviertel");
		expect(first.body.data.places).toHaveLength(1);
		expect(first.body.data.places[0].name).toBe("Berlin Dungeon");
		expect(second.body.data.places[0].contextLine).toBe(
			"Spandauer Straße · Mitte"
		);
	});

	it("rejects invalid discovery queries", async () => {
		await request(App)
			.get("/api/v1/map/discovery")
			.query({ lat: "north", lng: 13.405 })
			.expect(400);
	});
});
