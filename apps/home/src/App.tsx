import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MapPage from "./pages/MapPage";
import FeedPage from "./pages/FeedPage";
import CreatePostPage from "./pages/CreatePostPage";
import ProfilePage from "./pages/ProfilePage";
import { useAuthStore } from "./store/auth.store";

const App = () => {
	const { isAuthenticated } = useAuthStore();

	return (
		<Routes>
			{/* Auth routes (no layout) */}
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />

			{/* App routes (with bottom nav layout) */}
			<Route
				path="/*"
				element={
					<AppLayout>
						<Routes>
							<Route path="map" element={<MapPage />} />
							<Route path="feed" element={<FeedPage />} />
							<Route
								path="post/new"
								element={
									isAuthenticated ? (
										<CreatePostPage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
							<Route path="profile" element={<ProfilePage />} />
							<Route
								path="*"
								element={<Navigate to="/map" replace />}
							/>
						</Routes>
					</AppLayout>
				}
			/>
		</Routes>
	);
};

export default App;
