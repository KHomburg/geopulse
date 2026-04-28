import { createTheme } from "@mantine/core";

export const geopulseTheme = createTheme({
	primaryColor: "violet",
	primaryShade: 6,

	colors: {
		dark: [
			"#f0f0f0",
			"#c1c1c1",
			"#888888",
			"#555555",
			"#2a2a2a",
			"#1e1e1e",
			"#141414",
			"#0d0d0d",
			"#0a0a0a",
			"#050505"
		]
	},

	defaultRadius: "md",

	fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

	headings: {
		fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		fontWeight: "700"
	},

	components: {
		Button: {
			defaultProps: {
				radius: "xl"
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
		Card: {
			defaultProps: {
				radius: "lg"
			}
		}
	}
});
