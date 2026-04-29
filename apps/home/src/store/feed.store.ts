import { create } from "zustand";
import { postsApi, Post, HotspotCluster, TimeFilter } from "../api/posts.api";
import { activityApi, type ActivityHeatPoint } from "../api/activity.api";

interface LocationState {
	lat: number | null;
	lng: number | null;
}

interface FeedState {
	posts: Post[];
	hotspots: HotspotCluster[];
	activityHeatmap: ActivityHeatPoint[];
	location: LocationState;
	filter: TimeFilter;
	selectedTags: string[];
	radiusKm: number;
	isLoadingFeed: boolean;
	isLoadingHotspots: boolean;
	isLoadingActivityHeatmap: boolean;
	feedError: string | null;
	hasMore: boolean;

	setLocation: (lat: number, lng: number) => void;
	setFilter: (filter: TimeFilter) => void;
	setTags: (tags: string[]) => void;
	setRadius: (km: number) => void;
	loadFeed: (reset?: boolean) => Promise<void>;
	loadHotspots: () => Promise<void>;
	loadActivityHeatmap: () => Promise<void>;
	votePost: (postId: number, value: 1 | -1) => Promise<void>;
	removeVote: (postId: number) => Promise<void>;
	addPost: (post: Post) => void;
	removePost: (postId: number) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
	posts: [],
	hotspots: [],
	activityHeatmap: [],
	location: { lat: null, lng: null },
	filter: "today",
	selectedTags: [],
	radiusKm: 10,
	isLoadingFeed: false,
	isLoadingHotspots: false,
	isLoadingActivityHeatmap: false,
	feedError: null,
	hasMore: true,

	setLocation: (lat, lng) => {
		set({ location: { lat, lng } });
	},

	setFilter: (filter) => {
		set({ filter, posts: [], hasMore: true });
	},

	setTags: (tags) => {
		set({ selectedTags: tags, posts: [], hasMore: true });
	},

	setRadius: (km) => {
		set({ radiusKm: km, posts: [], hasMore: true });
	},

	loadFeed: async (reset = false) => {
		const { location, filter, radiusKm, posts, selectedTags } = get();
		if (!location.lat || !location.lng) return;

		set({ isLoadingFeed: true, feedError: null });
		if (reset) set({ posts: [], hasMore: true });

		try {
			const offset = reset ? 0 : posts.length;
			const { data } = await postsApi.getFeed({
				lat: location.lat,
				lng: location.lng,
				radiusKm,
				filter,
				tags: selectedTags,
				limit: 20,
				offset
			});
			set((state) => ({
				posts: reset ? data.data : [...state.posts, ...data.data],
				hasMore: data.data.length === 20,
				isLoadingFeed: false
			}));
		} catch {
			set({ feedError: "Failed to load posts", isLoadingFeed: false });
		}
	},

	loadHotspots: async () => {
		const { location, filter, radiusKm } = get();
		if (!location.lat || !location.lng) return;

		set({ isLoadingHotspots: true });
		try {
			const { data } = await postsApi.getHotspots({
				lat: location.lat,
				lng: location.lng,
				radiusKm: radiusKm * 2,
				filter
			});
			set({ hotspots: data.data, isLoadingHotspots: false });
		} catch {
			set({ isLoadingHotspots: false });
		}
	},

	loadActivityHeatmap: async () => {
		const { location, radiusKm } = get();
		if (!location.lat || !location.lng) return;

		set({ isLoadingActivityHeatmap: true });
		try {
			const { data } = await activityApi.getHeatmap({
				lat: location.lat,
				lng: location.lng,
				radiusKm: Math.min(radiusKm * 1.5, 20)
			});
			set({
				activityHeatmap: data.data,
				isLoadingActivityHeatmap: false
			});
		} catch {
			set({ isLoadingActivityHeatmap: false });
		}
	},

	votePost: async (postId, value) => {
		const { data } = await postsApi.vote(postId, value);
		set((state) => ({
			posts: state.posts.map((p) =>
				p.id === postId ? { ...p, karmaScore: data.karmaScore } : p
			)
		}));
	},

	removeVote: async (postId) => {
		try {
			await postsApi.removeVote(postId);
		} catch {
			// Silent failure
		}
	},

	addPost: (post) => {
		set((state) => ({ posts: [post, ...state.posts] }));
	},

	removePost: (postId) => {
		set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) }));
	}
}));
