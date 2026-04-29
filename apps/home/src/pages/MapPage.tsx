import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
	ActionIcon,
	Box,
	Button,
	Group,
	Paper,
	Select,
	Stack,
	Text
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useFeedStore } from "../store/feed.store";
import type { HotspotCluster } from "../api/posts.api";
import { useGeolocation } from "../hooks/useGeolocation";
import { useInboxStore } from "../store/inbox.store";
import { POST_TAGS, type PostTagKey } from "../constants/postTags";
import { ghostApi, type FriendGhost } from "../api/ghost.api";
import { mapPlacesApi, type NearbyPlace } from "../api/mapPlaces.api";
import { roomsApi, type LiveLounge } from "../api/rooms.api";
import { useAuthStore } from "../store/auth.store";

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

// Default to a street-level OSM raster map so the UI always shows real roads
// and labels even without a third-party vector-tile style token.
const MAP_STYLE = import.meta.env.VITE_MAP_STYLE ?? DEFAULT_MAP_STYLE;

const FILTER_OPTIONS = [
	{ value: "now", label: "Last hour" },
	{ value: "today", label: "Today" },
	{ value: "week", label: "This week" }
];

const truncatePlaceLabel = (value: string, maxLength: number) => {
	if (value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, maxLength - 1).trimEnd()}...`;
};

const MapPage = () => {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const userMarkerRef = useRef<maplibregl.Marker | null>(null);
	const ghostMarkersRef = useRef<maplibregl.Marker[]>([]);
	const placeMarkersRef = useRef<maplibregl.Marker[]>([]);
	const navigate = useNavigate();
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const unreadNotifications = useInboxStore(
		(state) => state.unreadNotifications
	);

	const {
		location,
		filter,
		hotspots,
		activityHeatmap,
		posts,
		selectedTags,
		setFilter,
		setTags,
		loadFeed,
		loadHotspots,
		loadActivityHeatmap
	} = useFeedStore();

	const [mapReady, setMapReady] = useState(false);
	const [mapViewport, setMapViewport] = useState(DEFAULT_CENTER);
	const [lounges, setLounges] = useState<LiveLounge[]>([]);
	const [ghosts, setGhosts] = useState<FriendGhost[]>([]);
	const [places, setPlaces] = useState<NearbyPlace[]>([]);
	const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(
		null
	);
	const [areaLabel, setAreaLabel] = useState<string | null>(null);
	const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
	useGeolocation();

	const focusPlace = useCallback((place: NearbyPlace) => {
		setSelectedPlace(place);
		mapRef.current?.flyTo({
			center: [place.lng, place.lat],
			zoom: Math.max(mapRef.current.getZoom(), 16),
			duration: 900
		});
	}, []);

	// Initialize MapLibre map (no API token required)
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

		map.on("load", () => {
			const center = map.getCenter();
			setMapViewport({
				lat: center.lat,
				lng: center.lng,
				zoom: map.getZoom()
			});
			setMapReady(true);
		});

		map.on("moveend", () => {
			const center = map.getCenter();
			setMapViewport({
				lat: center.lat,
				lng: center.lng,
				zoom: map.getZoom()
			});
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
			zoom: 15,
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

	useEffect(() => {
		if (!mapReady) return;

		const controller = new AbortController();
		const radiusMeters =
			mapViewport.zoom >= 16 ? 450 : mapViewport.zoom >= 15 ? 650 : 900;

		setIsLoadingPlaces(true);

		void mapPlacesApi
			.getDiscovery({
				lat: mapViewport.lat,
				lng: mapViewport.lng,
				radiusMeters,
				signal: controller.signal
			})
			.then((discovery) => {
				if (controller.signal.aborted) return;

				setPlaces(discovery.places);
				setAreaLabel(discovery.areaLabel);
				setSelectedPlace((current) => {
					if (!current) {
						return discovery.places[0] ?? null;
					}

					return (
						discovery.places.find(
							(place) => place.id === current.id
						) ??
						discovery.places[0] ??
						null
					);
				});
				setIsLoadingPlaces(false);
			})
			.catch(() => {
				if (controller.signal.aborted) return;
				setPlaces([]);
				setAreaLabel(null);
				setSelectedPlace(null);
				setIsLoadingPlaces(false);
			});

		return () => {
			controller.abort();
		};
	}, [mapReady, mapViewport.lat, mapViewport.lng, mapViewport.zoom]);

	// Load data when location is ready
	useEffect(() => {
		if (!location.lat || !location.lng) return;
		loadFeed(true);
		loadHotspots();
		loadActivityHeatmap();
	}, [
		location,
		filter,
		selectedTags,
		loadFeed,
		loadHotspots,
		loadActivityHeatmap
	]);

	useEffect(() => {
		if (!isAuthenticated || !location.lat || !location.lng) {
			setLounges([]);
			setGhosts([]);
			return;
		}

		const loadRealtimeMapData = async () => {
			try {
				const [{ data: loungeData }, { data: ghostData }] =
					await Promise.all([
						roomsApi.getLiveLounges({
							lat: location.lat!,
							lng: location.lng!
						}),
						ghostApi.getFriendGhosts()
					]);
				setLounges(loungeData.data);
				setGhosts(ghostData.data);
			} catch {
				setLounges([]);
				setGhosts([]);
			}
		};

		void loadRealtimeMapData();
		const interval = window.setInterval(loadRealtimeMapData, 60_000);
		return () => window.clearInterval(interval);
	}, [isAuthenticated, location.lat, location.lng]);

	// Render post pins on map
	useEffect(() => {
		if (!mapReady || !mapRef.current) return;
		const map = mapRef.current;

		const sourceId = "posts-source";
		const layerId = "posts-emoji-layer";
		const postCircleLayerId = "posts-circle-layer";
		const clusterLayerId = "posts-cluster-layer";
		const clusterCountLayerId = "posts-cluster-count";

		// Remove existing layers/source
		[
			layerId,
			postCircleLayerId,
			clusterLayerId,
			clusterCountLayerId
		].forEach((id) => {
			if (map.getLayer(id)) map.removeLayer(id);
		});
		if (map.getSource(sourceId)) map.removeSource(sourceId);

		const features: GeoJSON.Feature[] = posts.map((post) => ({
			type: "Feature",
			geometry: { type: "Point", coordinates: [post.lng, post.lat] },
			properties: {
				id: post.id,
				karma: post.karmaScore,
				content: post.content,
				pinAvatar:
					post.authorPinAvatar ??
					(post.postType === "drop" ? "🎁" : "📍")
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
			id: postCircleLayerId,
			type: "circle",
			source: sourceId,
			filter: ["!", ["has", "point_count"]],
			paint: {
				"circle-color": "rgba(16,16,16,0.82)",
				"circle-radius": 14,
				"circle-stroke-width": 1.5,
				"circle-stroke-color": "rgba(255,255,255,0.35)"
			}
		});

		map.addLayer({
			id: layerId,
			type: "symbol",
			source: sourceId,
			filter: ["!", ["has", "point_count"]],
			layout: {
				"text-field": ["get", "pinAvatar"],
				"text-size": 18,
				"text-allow-overlap": true
			},
			paint: {
				"text-color": "#ffffff"
			}
		});
	}, [mapReady, posts]);

	useEffect(() => {
		if (!mapReady || !mapRef.current) return;
		const map = mapRef.current;
		const sourceId = "activity-source";
		const layerId = "activity-heatmap";

		if (map.getLayer(layerId)) map.removeLayer(layerId);
		if (map.getSource(sourceId)) map.removeSource(sourceId);

		if (activityHeatmap.length === 0) return;

		const features: GeoJSON.Feature[] = activityHeatmap.map((point) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [point.centerLng, point.centerLat]
			},
			properties: { weight: point.intensity }
		}));

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
					20,
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
					"rgba(27, 46, 82, 0)",
					0.25,
					"rgba(62, 164, 255, 0.25)",
					0.5,
					"rgba(77, 226, 166, 0.4)",
					0.8,
					"rgba(255, 196, 87, 0.55)",
					1,
					"rgba(255, 120, 74, 0.7)"
				],
				"heatmap-radius": [
					"interpolate",
					["linear"],
					["zoom"],
					0,
					2,
					15,
					34
				],
				"heatmap-opacity": 0.7
			}
		});
	}, [activityHeatmap, mapReady]);

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

	useEffect(() => {
		if (!mapReady || !mapRef.current) return;
		ghostMarkersRef.current.forEach((marker) => marker.remove());
		ghostMarkersRef.current = [];

		for (const ghost of ghosts) {
			const el = document.createElement("div");
			el.style.cssText = `
				width: 28px;
				height: 28px;
				border-radius: 14px;
				background: rgba(18,18,18,0.9);
				border: 1px solid rgba(255,255,255,0.3);
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 14px;
				box-shadow: 0 0 10px rgba(255,255,255,0.12);
			`;
			el.textContent = ghost.friend?.pinAvatar ?? "👻";

			const marker = new maplibregl.Marker(el)
				.setLngLat([ghost.lng, ghost.lat])
				.setPopup(
					new maplibregl.Popup({ offset: 14 }).setText(
						`${
							ghost.friend?.displayName ??
							ghost.friend?.username ??
							"Friend"
						} · ±${ghost.precisionMeters}m`
					)
				)
				.addTo(mapRef.current);

			ghostMarkersRef.current.push(marker);
		}

		return () => {
			ghostMarkersRef.current.forEach((marker) => marker.remove());
			ghostMarkersRef.current = [];
		};
	}, [ghosts, mapReady]);

	useEffect(() => {
		if (!mapReady || !mapRef.current) return;

		placeMarkersRef.current.forEach((marker) => marker.remove());
		placeMarkersRef.current = [];

		for (const place of places.slice(0, 8)) {
			const isSelected = selectedPlace?.id === place.id;
			const element = document.createElement("button");
			element.type = "button";
			element.title = place.name;
			element.style.cssText = `
				width: 34px;
				height: 34px;
				border-radius: 17px;
				border: 2px solid rgba(255,255,255,0.95);
				background: ${isSelected ? "#6c63ff" : "rgba(15,15,15,0.9)"};
				color: #ffffff;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 16px;
				cursor: pointer;
				box-shadow: 0 8px 18px rgba(0,0,0,0.28);
			`;
			element.textContent = place.icon;
			element.onclick = () => focusPlace(place);

			const marker = new maplibregl.Marker({
				element,
				anchor: "bottom"
			})
				.setLngLat([place.lng, place.lat])
				.setPopup(
					new maplibregl.Popup({ offset: 18 }).setText(
						`${place.name} · ${place.category}`
					)
				)
				.addTo(mapRef.current);

			placeMarkersRef.current.push(marker);
		}

		return () => {
			placeMarkersRef.current.forEach((marker) => marker.remove());
			placeMarkersRef.current = [];
		};
	}, [focusPlace, mapReady, places, selectedPlace?.id]);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			if (value) setFilter(value as "now" | "today" | "week");
		},
		[setFilter]
	);

	const toggleTag = (tag: PostTagKey) => {
		if (selectedTags.includes(tag)) {
			setTags(selectedTags.filter((item) => item !== tag));
			return;
		}
		setTags([...selectedTags, tag]);
	};

	const highlightedPlace = selectedPlace ?? places[0] ?? null;
	const placeCardBottomOffset = lounges.length > 0 ? 252 : 148;
	const highlightedPlaceName = highlightedPlace
		? truncatePlaceLabel(highlightedPlace.name, 52)
		: null;

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
						<Stack gap={2}>
							<Text
								fw={700}
								size="sm"
								style={{ color: "#6c63ff" }}
							>
								GeoPulse
							</Text>
							<Text size="xs" c="dimmed">
								{isLoadingPlaces
									? "Scanning nearby places..."
									: areaLabel
									? `Near ${areaLabel}`
									: "Explore real streets and nearby places"}
							</Text>
						</Stack>
						<Group gap={8} wrap="nowrap">
							<Select
								data={FILTER_OPTIONS}
								value={filter}
								onChange={handleFilterChange}
								size="xs"
								style={{ width: 110 }}
							/>
							<Box style={{ position: "relative" }}>
								<ActionIcon
									variant="subtle"
									radius="xl"
									size="lg"
									onClick={() => navigate("/notifications")}
									style={{
										color: "#f0f0f0",
										background: "rgba(255,255,255,0.04)"
									}}
								>
									🔔
								</ActionIcon>
								{unreadNotifications > 0 && (
									<Box
										style={{
											position: "absolute",
											top: -3,
											right: -2,
											minWidth: 16,
											height: 16,
											padding: "0 4px",
											borderRadius: 999,
											background: "#ff6584",
											color: "#fff",
											fontSize: 10,
											fontWeight: 700,
											display: "flex",
											alignItems: "center",
											justifyContent: "center"
										}}
									>
										{Math.min(unreadNotifications, 99)}
									</Box>
								)}
							</Box>
						</Group>
					</Group>
				</Paper>
				<Group
					gap={8}
					mt={10}
					wrap="nowrap"
					style={{ overflowX: "auto" }}
				>
					{POST_TAGS.map((tag) => {
						const selected = selectedTags.includes(tag.key);
						return (
							<Button
								key={tag.key}
								size="compact-xs"
								variant={selected ? "filled" : "subtle"}
								color={selected ? "violet" : "gray"}
								onClick={() => toggleTag(tag.key)}
							>
								{tag.icon} {tag.label}
							</Button>
						);
					})}
				</Group>
			</Box>

			{highlightedPlace && (
				<Box
					style={{
						position: "absolute",
						left: 16,
						right: 16,
						bottom: placeCardBottomOffset,
						zIndex: 12
					}}
				>
					<Paper
						radius="xl"
						style={{
							background: "rgba(20,20,20,0.94)",
							backdropFilter: "blur(14px)",
							border: "1px solid rgba(255,255,255,0.08)",
							padding: "12px"
						}}
					>
						<Group
							justify="space-between"
							align="flex-start"
							wrap="nowrap"
						>
							<Stack gap={2} style={{ flex: 1 }}>
								<Text size="xs" c="dimmed">
									Nearby place
								</Text>
								<Text fw={700}>
									{highlightedPlace.icon}{" "}
									{highlightedPlaceName}
								</Text>
								<Text size="xs" c="dimmed">
									{highlightedPlace.category} ·{" "}
									{highlightedPlace.distanceMeters}m away
								</Text>
								{highlightedPlace.contextLine && (
									<Text size="xs" c="dimmed">
										{highlightedPlace.contextLine}
									</Text>
								)}
							</Stack>
							<Button
								size="xs"
								variant="light"
								color="violet"
								onClick={() => focusPlace(highlightedPlace)}
							>
								Center
							</Button>
						</Group>

						<Group
							gap={8}
							mt={10}
							wrap="nowrap"
							style={{ overflowX: "auto" }}
						>
							{places.slice(0, 6).map((place) => {
								const isSelected =
									highlightedPlace.id === place.id;

								return (
									<Button
										key={place.id}
										size="compact-sm"
										radius="xl"
										variant={
											isSelected ? "filled" : "subtle"
										}
										color={isSelected ? "violet" : "gray"}
										onClick={() => focusPlace(place)}
									>
										{place.icon}{" "}
										{truncatePlaceLabel(place.name, 28)}
									</Button>
								);
							})}
						</Group>
					</Paper>
				</Box>
			)}

			{lounges.length > 0 && (
				<Box
					style={{
						position: "absolute",
						left: 16,
						right: 16,
						bottom: 148,
						zIndex: 12
					}}
				>
					<Stack gap={8}>
						{lounges.slice(0, 2).map((lounge) => (
							<Paper
								key={lounge.roomKey}
								radius="lg"
								style={{
									background: "rgba(20,20,20,0.92)",
									border: "1px solid #2a2a2a",
									padding: "10px 12px"
								}}
							>
								<Group justify="space-between" wrap="nowrap">
									<Box>
										<Text fw={700}>{lounge.title}</Text>
										<Text size="xs" c="dimmed">
											{lounge.activeUsers} people inside ·{" "}
											{lounge.radiusMeters}m radius
										</Text>
									</Box>
									<Button
										size="xs"
										color="violet"
										onClick={() =>
											navigate(
												`/lounges/${encodeURIComponent(
													lounge.roomKey
												)}`
											)
										}
									>
										Join
									</Button>
								</Group>
							</Paper>
						))}
					</Stack>
				</Box>
			)}

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
							{places.length > 0
								? ` · ${places.length} nearby places`
								: ""}
							{lounges.length > 0
								? ` · ${lounges.length} live lounges`
								: ""}
							{ghosts.length > 0
								? ` · ${ghosts.length} friends in ghost mode`
								: ""}
						</Text>
					</Paper>
				</Box>
			)}
		</Box>
	);
};

export default MapPage;
