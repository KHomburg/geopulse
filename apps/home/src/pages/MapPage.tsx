import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Box, Group, Paper, Select, Text } from "@mantine/core";
import { useFeedStore } from "../store/feed.store";
import type { HotspotCluster } from "../api/posts.api";
import { useGeolocation } from "../hooks/useGeolocation";

// Free dark style from MapLibre demo tiles (no token required).
// Override via VITE_MAP_STYLE env var to use a MapTiler/custom style.
const MAP_STYLE =
	import.meta.env.VITE_MAP_STYLE ??
	"https://demotiles.maplibre.org/style.json";

const FILTER_OPTIONS = [
	{ value: "now", label: "Last hour" },
	{ value: "today", label: "Today" },
	{ value: "week", label: "This week" }
];

const MapPage = () => {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const userMarkerRef = useRef<maplibregl.Marker | null>(null);

	const {
		location,
		filter,
		hotspots,
		posts,
		setFilter,
		loadFeed,
		loadHotspots
	} = useFeedStore();

	const [mapReady, setMapReady] = useState(false);
	useGeolocation();

	// Initialize MapLibre map (no API token required)
	useEffect(() => {
		if (!mapContainerRef.current || mapRef.current) return;

		const map = new maplibregl.Map({
			container: mapContainerRef.current,
			style: MAP_STYLE,
			center: [location.lng ?? 13.405, location.lat ?? 52.52],
			zoom: 13,
			attributionControl: false,
			pitchWithRotate: false
		});

		map.on("load", () => {
			setMapReady(true);
		});

		mapRef.current = map;

		return () => {
			map.remove();
			mapRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Fly to user location when acquired
	useEffect(() => {
		if (!mapReady || !mapRef.current || !location.lat || !location.lng)
			return;

		mapRef.current.flyTo({
			center: [location.lng, location.lat],
			zoom: 14,
			duration: 1500
		});

		// User location dot
		if (userMarkerRef.current) {
			userMarkerRef.current.setLngLat([location.lng, location.lat]);
		} else {
			const el = document.createElement("div");
			el.style.cssText = `
        width: 16px; height: 16px; border-radius: 50%;
        background: #6c63ff; border: 3px solid #fff;
        box-shadow: 0 0 12px rgba(108,99,255,0.8);
      `;
			userMarkerRef.current = new maplibregl.Marker(el)
				.setLngLat([location.lng, location.lat])
				.addTo(mapRef.current);
		}
	}, [mapReady, location]);

	// Load data when location is ready
	useEffect(() => {
		if (!location.lat || !location.lng) return;
		loadFeed(true);
		loadHotspots();
	}, [location, filter, loadFeed, loadHotspots]);

	// Render post pins on map
	useEffect(() => {
		if (!mapReady || !mapRef.current) return;
		const map = mapRef.current;

		const sourceId = "posts-source";
		const layerId = "posts-layer";
		const clusterLayerId = "posts-cluster-layer";
		const clusterCountLayerId = "posts-cluster-count";

		// Remove existing layers/source
		[layerId, clusterLayerId, clusterCountLayerId].forEach((id) => {
			if (map.getLayer(id)) map.removeLayer(id);
		});
		if (map.getSource(sourceId)) map.removeSource(sourceId);

		const features: GeoJSON.Feature[] = posts.map((post) => ({
			type: "Feature",
			geometry: { type: "Point", coordinates: [post.lng, post.lat] },
			properties: {
				id: post.id,
				karma: post.karmaScore,
				content: post.content
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
				"circle-color": [
					"step",
					["get", "point_count"],
					"#6c63ff",
					10,
					"#8b85ff",
					30,
					"#ff6584"
				],
				"circle-radius": [
					"step",
					["get", "point_count"],
					20,
					10,
					30,
					30,
					40
				],
				"circle-opacity": 0.85
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
			id: layerId,
			type: "circle",
			source: sourceId,
			filter: ["!", ["has", "point_count"]],
			paint: {
				"circle-color": "#6c63ff",
				"circle-radius": 8,
				"circle-stroke-width": 2,
				"circle-stroke-color": "#ffffff",
				"circle-opacity": 0.9
			}
		});
	}, [mapReady, posts]);

	// Render hotspot heatmap layer
	useEffect(() => {
		if (!mapReady || !mapRef.current) return;
		const map = mapRef.current;

		const sourceId = "hotspots-source";
		const layerId = "hotspots-heatmap";

		if (map.getLayer(layerId)) map.removeLayer(layerId);
		if (map.getSource(sourceId)) map.removeSource(sourceId);

		if (hotspots.length === 0) return;

		const features: GeoJSON.Feature[] = hotspots.map(
			(h: HotspotCluster) => ({
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [h.centerLng, h.centerLat]
				},
				properties: { weight: h.weight }
			})
		);

		map.addSource(sourceId, {
			type: "geojson",
			data: { type: "FeatureCollection", features }
		});

		map.addLayer({
			id: layerId,
			type: "heatmap",
			source: sourceId,
			paint: {
				"heatmap-weight": [
					"interpolate",
					["linear"],
					["get", "weight"],
					0,
					0,
					50,
					1
				],
				"heatmap-intensity": [
					"interpolate",
					["linear"],
					["zoom"],
					0,
					1,
					15,
					3
				],
				"heatmap-color": [
					"interpolate",
					["linear"],
					["heatmap-density"],
					0,
					"rgba(0,0,255,0)",
					0.2,
					"rgba(108,99,255,0.3)",
					0.5,
					"rgba(139,133,255,0.5)",
					0.8,
					"rgba(255,101,132,0.6)",
					1,
					"rgba(255,64,64,0.8)"
				],
				"heatmap-radius": [
					"interpolate",
					["linear"],
					["zoom"],
					0,
					2,
					15,
					40
				],
				"heatmap-opacity": 0.7
			}
		});
	}, [mapReady, hotspots]);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			if (value) setFilter(value as "now" | "today" | "week");
		},
		[setFilter]
	);

	return (
		<Box style={{ position: "relative", width: "100%", height: "100%" }}>
			{/* Map container */}
			<div
				ref={mapContainerRef}
				style={{ width: "100%", height: "100%", background: "#0a0a0a" }}
			/>

			{/* Top filter bar */}
			<Box
				style={{
					position: "absolute",
					top: 16,
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: 10,
					width: "calc(100% - 32px)",
					maxWidth: 360
				}}
			>
				<Paper
					style={{
						background: "rgba(20,20,20,0.92)",
						backdropFilter: "blur(12px)",
						border: "1px solid #2a2a2a",
						padding: "8px 12px"
					}}
					radius="xl"
				>
					<Group justify="space-between" align="center" wrap="nowrap">
						<Text fw={700} size="sm" style={{ color: "#6c63ff" }}>
							GeoPulse
						</Text>
						<Select
							data={FILTER_OPTIONS}
							value={filter}
							onChange={handleFilterChange}
							size="xs"
							style={{ width: 110 }}
						/>
					</Group>
				</Paper>
			</Box>

			{/* Stats pill */}
			{posts.length > 0 && (
				<Box
					style={{
						position: "absolute",
						bottom: 100,
						left: "50%",
						transform: "translateX(-50%)",
						zIndex: 10
					}}
				>
					<Paper
						style={{
							background: "rgba(20,20,20,0.88)",
							backdropFilter: "blur(8px)",
							border: "1px solid #2a2a2a",
							padding: "6px 16px"
						}}
						radius="xl"
					>
						<Text size="xs" c="dimmed">
							{posts.length} pulses nearby
						</Text>
					</Paper>
				</Box>
			)}
		</Box>
	);
};

export default MapPage;
