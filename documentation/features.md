# GeoPulse — Feature List

## Authentication
- Register with email and password
- Login with JWT access + refresh token (auto-refresh via Axios interceptor)
- Logout (invalidates refresh token)
- Auth-guarded routes redirect to `/login`

## Posts
- Create a post with text content and an optional media URL
- Three anonymity modes: **Public** (shows user ID), **Local Legend** (custom pseudonym), **Anonymous**
- Posts are geo-stamped with an obfuscated lat/lng
- Optional **Story** mode — post expires after a configurable time
- Optional post tags for local vibes such as food, music, nightlife, outdoors, culture, alerts, and deals
- Optional **Drop** posts with a hint and GPS unlock radius
- Optional **Super Local Legend** posts that stay boosted in the feed for an extra hour when a user spends a perk credit
- Delete own posts
- Feed filtered by time window: Last Hour / Today / This Week
- Feed and map can both be filtered by tag/vibe
- Infinite scroll with intersection observer pagination
- `commentCount` shown on each post card
- Locked drop content stays blurred until the viewer is within the unlock radius or owns the post
- Post cards now surface author cosmetics such as pin avatars, username colors, trusted status, and boosted state

## Voting (Karma)
- Upvote or downvote any post (authenticated users only)
- Karma score displayed with color coding (violet = positive, red = negative)
- Score updates optimistically in the feed store
- Votes now modify the post author's persistent karma score
- Trusted Local eligibility is recalculated from karma thresholds

## Karma Shop / Perks
- Users can spend earned karma on cosmetic or boost perks
- Current perk catalog includes custom map pin avatars, colored usernames, and Super Local Legend credits
- Profile includes a dedicated Karma Shop entry point with current balance and purchase controls

## Comments
- View threaded comments on any post (expandable inline section)
- Post a comment (authenticated); submit with Enter or the send button
- Reply support via `parentId` (nested replies stored in DB)
- Delete own comments
- Comment count reflected in real-time on the post card
- Backend sends a `post_comment` notification to the post owner on new comment
- Comment activity contributes to live map heat trails

## Bookmarks
- Bookmark / un-bookmark any post with a single toggle (🔖)
- Dedicated **Saved Posts** page (`/bookmarks`) listing all saved posts
- Saved content is now reached from the Profile surface instead of the bottom navigation

## Map
- Interactive map (MapPage) showing nearby geo-tagged posts
- Hotspot cluster markers showing post density and total karma
- Clusters weighted by karma score
- Emoji-based post pins reflect author avatars and drop markers
- Activity heat trails visualize recent opens, votes, and comments around the user
- Friend ghost shares render as fuzzy live markers for accepted friends
- Nearby Live Lounges surface directly on the map with a join CTA
- Notification access moves to a bell icon in the map header

## Contacts / Friends
- Send a friend request to any user
- Accept or decline incoming requests
- Remove an existing friend
- View Friends, Received Requests, and Sent Requests in separate tabs
- Block a user
- Friend request triggers a `friend_request` notification; acceptance triggers `friend_accepted`
- People management is now reached from the Profile surface instead of the bottom navigation

## User Search
- Debounced search input on the Contacts page
- Searches by username and display name (`GET /api/v1/user/search?q=`)
- Results show Add / Pending / Friends status inline

## Messaging
- Open a direct-message conversation with any user
- Conversation list with last message preview and timestamp
- Real-time delivery over authenticated Server-Sent Events
- Typing indicators are pushed live over the realtime stream
- Messages marked as read on conversation open
- Unread message count badge updates instantly from realtime events
- Bubble UI: own messages right-aligned (violet gradient), others left-aligned

## Notifications
- In-app notification feed (`/notifications`)
- Notification types: `friend_request`, `friend_accepted`, `post_comment`, `post_vote`, `mention`, `system`
- Mark individual notification as read on click
- Mark all notifications as read
- Unread notification count badge updates instantly from realtime events
- Notification access is exposed as a bell action in the Feed and Map headers

## Navigation
- 5-tab bottom navigation bar: Map · Feed · Create · Messages · Profile
- Unread badges stay on Messages and Profile-adjacent notification entry points
- Auth-required tabs redirect to login when unauthenticated

## Profile
- View own profile page
- Update display name and bio
- Update email address
- Profile surfaces entry cards for Karma Shop, Trusted Locals, Ghost Mode, People, and Saved
- Profile shows current karma balance and trusted-local status

## Trusted Locals
- Users with at least `500` karma can access the Trusted Locals feed and chat room
- Trusted status is enforced from backend user state, not only the UI

## Live Lounges
- Presence reports can auto-create temporary Live Lounges when enough nearby users cluster together
- Lounge listings are geofenced around the current viewer and support room chat

## Ghost Mode
- Users can opt in to temporary location sharing with accepted friends only
- Shared positions are fuzzed to a block-style radius instead of exposing an exact coordinate
- Ghost sessions can be turned off explicitly and expire server-side

## Backend / Infrastructure
- Express + TypeScript API with Sequelize ORM (PostgreSQL)
- Zod schema validation on all request bodies and params
- Soft deletes (`paranoid: true`) on Posts and Comments
- Sequelize associations for all models (User, Post, Vote, Comment, Bookmark, Contact, Conversation, ConversationParticipant, Message, Notification, RefreshToken)
- Turborepo monorepo with separate `apps/api` and `apps/home` packages
- Docker Compose for local development
- Playwright end-to-end tests and Jest unit/integration tests
- Seed script for local test data
- Single SSE event stream fans out message, typing, unread-count, notification, and room events
- In-memory activity aggregation powers heat trails and live-lounge detection
- Room and ghost-share persistence back new trusted and friend-presence features
