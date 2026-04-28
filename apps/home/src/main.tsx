import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { geopulseTheme } from "./theme";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<BrowserRouter>
			<MantineProvider theme={geopulseTheme} forceColorScheme="dark">
				<App />
			</MantineProvider>
		</BrowserRouter>
	</React.StrictMode>
);
