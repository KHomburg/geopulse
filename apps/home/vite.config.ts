import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		// Force a single copy of react/react-dom so the workspace-local v19
		// is used instead of any hoisted root-level v18
		dedupe: ["react", "react-dom"]
	},
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["rocket.png", "robots.txt"],
			manifest: {
				name: "GeoPulse",
				short_name: "GeoPulse",
				description: "Location-centric visual social app",
				theme_color: "#0a0a0a",
				background_color: "#0a0a0a",
				display: "standalone",
				orientation: "portrait",
				start_url: "/",
				icons: [
					{
						src: "rocket.png",
						sizes: "192x192",
						type: "image/png"
					},
					{
						src: "rocket.png",
						sizes: "512x512",
						type: "image/png"
					}
				]
			}
		})
	]
});
