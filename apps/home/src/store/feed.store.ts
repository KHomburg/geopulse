import { create } from "zustand";
import { postsApi, Post, HotspotCluster, TimeFilter } from "../api/posts.api";

interface LocationState {
	lat: number | null;
	lng: number | null;
}

interface FeedState {
	posts: Post[];
	hotspots: HotspotCluster[];
	location: LocationState;
	filter: TimeFilter;
	radiusKm: number;
	isLoadingFeed: boolean;
	isLoadingHotspots: boolean;
	feedError: string | null;
	hasMore: boolean;

	setLocation: (lat: number, lng: number) => void;
	setFilter: (filter: TimeFilter) => void;
	setRadius: (km: number) => void;
	loadFeed: (reset?: boolean) => Promise<void>;
	loadHotspots: () => Promise<void>;
	votePost: (postId: number, value: 1 | -1) => Promise<void>;
	removeVote: (postId: number) => Promise<void>;
	addPost: (post: Post) => void;
	removePost: (postId: number) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
	posts: [],
	hotspots: [],
	location: { lat: null, lng: null },
	filter: "today",
	radiusKm: 10,
	isLoadingFeed: false,
	isLoadingHotspots: false,
	feedError: null,
	hasMore: true,

	setLocation: (lat, lng) => {
		set({ location: { lat, lng } });
	},

	setFilter: (filter) => {
		set({ filter, posts: [], hasMore: true });
	},

	setRadius: (km) => {
		set({ radiusKm: km, posts: [], hasMore: true });
	},

	loadFeed: async (reset = false) => {
		const { location, filter, radiusKm, posts } = get();
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
