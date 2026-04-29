export const TRUSTED_LOCALS_MIN_KARMA = 500;

export const PERK_KEYS = [
	"pin_avatar_radar",
	"username_color_sunburst",
	"super_local_legend_credit"
] as const;

export type PerkKey = (typeof PERK_KEYS)[number];

export const KARMA_PERK_CATALOG = [
	{
		key: "pin_avatar_radar" as const,
		label: "Radar Pin Avatar",
		description: "Equip a radar-style pin on the map and in nearby feeds.",
		cost: 120,
		previewValue: "📡"
	},
	{
		key: "username_color_sunburst" as const,
		label: "Sunburst Username",
		description: "Highlight your public identity with a warm accent color.",
		cost: 180,
		previewValue: "#ff9f43"
	},
	{
		key: "super_local_legend_credit" as const,
		label: "Super Local Legend",
		description:
			"One boosted Local Legend post pinned above the feed for an extra hour.",
		cost: 250,
		previewValue: 1
	}
] as const;
