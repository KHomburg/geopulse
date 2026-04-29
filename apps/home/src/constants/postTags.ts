export const POST_TAGS = [
	{ key: "food", label: "Food", tone: "#c4874d" },
	{ key: "alert", label: "Alert", tone: "#f06b5f" },
	{ key: "party", label: "Party", tone: "#b88df0" },
	{ key: "news", label: "News", tone: "#65b8b0" },
	{ key: "deal", label: "Deals", tone: "#e7b179" }
] as const;

export type PostTagKey = (typeof POST_TAGS)[number]["key"];
