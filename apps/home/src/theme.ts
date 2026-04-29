import { createTheme } from "@mantine/core";

export const geopulseTheme = createTheme({
	primaryColor: "brand",
	primaryShade: 5,

	colors: {
		brand: [
			"#fff6ec",
			"#fbe7d3",
			"#f4d0ae",
			"#e7b179",
			"#d79b5d",
			"#c4874d",
			"#9f653c",
			"#7e4d30",
			"#5f3823",
			"#412418"
		],
		dark: [
			"#fffaf2",
			"#e7dfd4",
			"#b7b0a6",
			"#90897f",
			"#626159",
			"#282c35",
			"#1c2028",
			"#171a22",
			"#11141b",
			"#0b0e14"
		]
	},

	black: "#0b0e14",
	white: "#fffaf2",

	defaultRadius: "md",

	fontFamily: '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',

	headings: {
		fontFamily:
			'"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
		fontWeight: "700"
	},

	components: {
		Button: {
			defaultProps: {
				radius: "md",
				size: "sm"
			}
		},
		ActionIcon: {
			defaultProps: {
				radius: "md",
				variant: "subtle"
			}
		},
		TextInput: {
			defaultProps: {
				radius: "md"
			}
		},
		PasswordInput: {
			defaultProps: {
				radius: "md"
			}
		},
		Textarea: {
			defaultProps: {
				radius: "md"
			}
		},
		Select: {
			defaultProps: {
				radius: "md"
			}
		},
		SegmentedControl: {
			defaultProps: {
				radius: "md"
			}
		},
		Alert: {
			defaultProps: {
				radius: "md"
			}
		},
		Card: {
			defaultProps: {
				radius: "md"
			}
		},
		Paper: {
			defaultProps: {
				radius: "md"
			}
		},
		Badge: {
			defaultProps: {
				radius: "md"
			}
		}
	}
});
