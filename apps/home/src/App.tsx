import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MapPage from "./pages/MapPage";
import FeedPage from "./pages/FeedPage";
import CreatePostPage from "./pages/CreatePostPage";
import ProfilePage from "./pages/ProfilePage";
import ContactsPage from "./pages/ContactsPage";
import MessagesPage from "./pages/MessagesPage";
import ConversationPage from "./pages/ConversationPage";
import NotificationsPage from "./pages/NotificationsPage";
import BookmarksPage from "./pages/BookmarksPage";
import KarmaShopPage from "./pages/KarmaShopPage";
import TrustedLocalsPage from "./pages/TrustedLocalsPage";
import GhostModePage from "./pages/GhostModePage";
import LiveLoungePage from "./pages/LiveLoungePage";
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
							<Route
								path="contacts"
								element={
									isAuthenticated ? (
										<ContactsPage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
							<Route
								path="messages"
								element={
									isAuthenticated ? (
										<MessagesPage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
							<Route
								path="messages/:conversationId"
								element={
									isAuthenticated ? (
										<ConversationPage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
							<Route
								path="notifications"
								element={
									isAuthenticated ? (
										<NotificationsPage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
							<Route
								path="bookmarks"
								element={
									isAuthenticated ? (
										<BookmarksPage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
							<Route path="profile" element={<ProfilePage />} />
							<Route
								path="profile/karmashop"
								element={
									isAuthenticated ? (
										<KarmaShopPage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
							<Route
								path="profile/trusted-locals"
								element={
									isAuthenticated ? (
										<TrustedLocalsPage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
							<Route
								path="profile/ghost-mode"
								element={
									isAuthenticated ? (
										<GhostModePage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
							<Route
								path="lounges/:roomKey"
								element={
									isAuthenticated ? (
										<LiveLoungePage />
									) : (
										<Navigate to="/login" replace />
									)
								}
							/>
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
