export const POST_TAGS = [
	{ key: "food", label: "Food", icon: "🍕" },
	{ key: "alert", label: "Alert", icon: "🚨" },
	{ key: "party", label: "Party", icon: "🎉" },
	{ key: "news", label: "News", icon: "🗞️" },
	{ key: "deal", label: "Deals", icon: "🎟️" }
] as const;

export type PostTagKey = (typeof POST_TAGS)[number]["key"];
