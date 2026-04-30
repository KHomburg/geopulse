import { useEffect, useRef, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Box, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useFeedStore } from "../store/feed.store";
import { useGeolocation } from "../hooks/useGeolocation";
import { FeedIcon, LocationIcon, RefreshIcon } from "../components/icons";

const DEFAULT_CENTER = {
	lat: 52.52,
	lng: 13.405,
	zoom: 14
};

const DEFAULT_MAP_STYLE: StyleSpecification = {
	version: 8,
	sources: {
		"osm-raster": {
			type: "raster",
			tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
			tileSize: 256,
			attribution: "&copy; OpenStreetMap contributors"
		}
	},
	layers: [
		{
			id: "osm-raster-layer",
			type: "raster",
			source: "osm-raster",
			minzoom: 0,
			maxzoom: 19
		}
	]
};

const MAP_STYLE = import.meta.env.VITE_MAP_STYLE ?? DEFAULT_MAP_STYLE;

const MapPage = () => {
	const navigate = useNavigate();
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const [mapReady, setMapReady] = useState(false);
	const { location, posts, loadFeed, radiusKm, filter, isLoadingFeed } =
		useFeedStore();

	useGeolocation();

	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;

		const map = new maplibregl.Map({
			container: mapContainerRef.current,
			style: MAP_STYLE,
			center: [
				location.lng ?? DEFAULT_CENTER.lng,
				location.lat ?? DEFAULT_CENTER.lat
			],
			zoom: DEFAULT_CENTER.zoom,
			attributionControl: { compact: true },
			pitchWithRotate: false
		});

		map.dragRotate.disable();
		map.touchZoomRotate.disableRotation();
		map.addControl(
			new maplibregl.NavigationControl({ showCompass: false }),
			"bottom-right"
		);

		map.on("load", () => setMapReady(true));
		mapRef.current = map;

		return () => {
			map.remove();
			mapRef.current = null;
		};
	}, [location.lat, location.lng]);

	useEffect(() => {
		if (!mapReady || !mapRef.current || !location.lat || !location.lng)
			return;

		mapRef.current.flyTo({
			center: [location.lng, location.lat],
			zoom: 15,
			duration: 900
		});
	}, [location.lat, location.lng, mapReady]);

	const handleRecenter = () => {
		if (!mapRef.current || !location.lat || !location.lng) return;

		mapRef.current.flyTo({
			center: [location.lng, location.lat],
			zoom: 15,
			duration: 750
		});
	};

	const filterLabel =
		filter === "now"
			? "the last hour"
			: filter === "week"
			? "this week"
			: "today";

	useEffect(() => {
		if (!location.lat || !location.lng) return;
		void loadFeed(true);
	}, [location.lat, location.lng, loadFeed]);

	useEffect(() => {
		if (!mapReady || !mapRef.current) return;

		const map = mapRef.current;
		const sourceId = "posts-source";
		const clusterLayerId = "posts-cluster-layer";
		const clusterCountLayerId = "posts-cluster-count";
		const postCircleLayerId = "posts-circle-layer";

		[postCircleLayerId, clusterLayerId, clusterCountLayerId].forEach(
			(id) => {
				if (map.getLayer(id)) map.removeLayer(id);
			}
		);
		if (map.getSource(sourceId)) map.removeSource(sourceId);

		const features: GeoJSON.Feature[] = posts.map((post) => ({
			type: "Feature",
			geometry: { type: "Point", coordinates: [post.lng, post.lat] },
			properties: {
				id: post.id,
				tone: "#fffaf2"
			}
		}));

		map.addSource(sourceId, {
			type: "geojson",
			data: { type: "FeatureCollection", features },
			cluster: true,
			clusterMaxZoom: 14,
			clusterRadius: 50
		});

		map.addLayer({
			id: clusterLayerId,
			type: "circle",
			source: sourceId,
			filter: ["has", "point_count"],
			paint: {
				"circle-color": "rgba(15, 15, 15, 0.88)",
				"circle-radius": [
					"step",
					["get", "point_count"],
					18,
					10,
					24,
					30,
					32
				],
				"circle-stroke-width": 2,
				"circle-stroke-color": "rgba(255,250,242,0.88)"
			}
		});

		map.addLayer({
			id: clusterCountLayerId,
			type: "symbol",
			source: sourceId,
			filter: ["has", "point_count"],
			layout: {
				"text-field": "{point_count_abbreviated}",
				"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
				"text-size": 13
			},
			paint: { "text-color": "#ffffff" }
		});

		map.addLayer({
			id: postCircleLayerId,
			type: "circle",
			source: sourceId,
			filter: ["!", ["has", "point_count"]],
			paint: {
				"circle-color": ["get", "tone"],
				"circle-radius": 7,
				"circle-opacity": 0.92,
				"circle-stroke-width": 2,
				"circle-stroke-color": "rgba(15,15,15,0.82)"
			}
		});
	}, [mapReady, posts]);

	return (
		<Box style={{ position: "relative", width: "100%", height: "100%" }}>
			<Box className="gp-map-overlay">
				<Paper className="gp-surface gp-surface--strong gp-map-overlay__card">
					<Stack gap="sm">
						<Box>
							<Text className="gp-page-header__eyebrow">
								Live terrain
							</Text>
							<Text className="gp-map-overlay__title">
								{location.lat
									? posts.length > 0
										? `${posts.length} pulses around you`
										: "Your local map is ready"
									: "Waiting for your location"}
							</Text>
							<Text size="sm" c="dimmed" mt={6}>
								{location.lat
									? `Showing ${filterLabel} activity within ${radiusKm} km. Open the feed when you want the same signals in list form.`
									: "Turn on location access to center the map and reveal the pulses closest to you."}
							</Text>
						</Box>

						<Group gap={8}>
							<Box className="gp-mini-pill">
								<LocationIcon size={14} />
								<Text size="xs" c="inherit">
									{location.lat
										? `${radiusKm} km radius`
										: "Locating you"}
								</Text>
							</Box>
							<Box className="gp-mini-pill">
								<Text size="xs" c="inherit">
									{posts.length} visible pulse
									{posts.length === 1 ? "" : "s"}
								</Text>
							</Box>
						</Group>

						<Box className="gp-map-overlay__actions">
							<Button
								size="xs"
								onClick={() => void loadFeed(true)}
								loading={isLoadingFeed}
								leftSection={<RefreshIcon size={14} />}
							>
								Refresh nearby
							</Button>
							<Button
								size="xs"
								variant="light"
								color="brand"
								onClick={() => navigate("/feed")}
								leftSection={<FeedIcon size={14} />}
							>
								Open feed
							</Button>
							{location.lat && location.lng && (
								<Button
									size="xs"
									variant="subtle"
									color="gray"
									onClick={handleRecenter}
									leftSection={<LocationIcon size={14} />}
								>
									Recenter
								</Button>
							)}
						</Box>
					</Stack>
				</Paper>
			</Box>

			<div
				ref={mapContainerRef}
				style={{ width: "100%", height: "100%", background: "#0a0a0a" }}
			/>
		</Box>
	);
};

export default MapPage;
