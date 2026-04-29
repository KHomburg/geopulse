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
- Delete own posts
- Feed filtered by time window: Last Hour / Today / This Week
- Infinite scroll with intersection observer pagination
- `commentCount` shown on each post card

## Voting (Karma)
- Upvote or downvote any post (authenticated users only)
- Karma score displayed with color coding (violet = positive, red = negative)
- Score updates optimistically in the feed store

## Comments
- View threaded comments on any post (expandable inline section)
- Post a comment (authenticated); submit with Enter or the send button
- Reply support via `parentId` (nested replies stored in DB)
- Delete own comments
- Comment count reflected in real-time on the post card
- Backend sends a `post_comment` notification to the post owner on new comment

## Bookmarks
- Bookmark / un-bookmark any post with a single toggle (🔖)
- Dedicated **Saved Posts** page (`/bookmarks`) listing all saved posts
- Bookmark nav item in the bottom navigation

## Map
- Interactive map (MapPage) showing nearby geo-tagged posts
- Hotspot cluster markers showing post density and total karma
- Clusters weighted by karma score

## Contacts / Friends
- Send a friend request to any user
- Accept or decline incoming requests
- Remove an existing friend
- View Friends, Received Requests, and Sent Requests in separate tabs
- Block a user
- Friend request triggers a `friend_request` notification; acceptance triggers `friend_accepted`

## User Search
- Debounced search input on the Contacts page
- Searches by username and display name (`GET /api/v1/user/search?q=`)
- Results show Add / Pending / Friends status inline

## Messaging
- Open a direct-message conversation with any user
- Conversation list with last message preview and timestamp
- Real-time-style polling — new messages fetched every 5 s
- Messages marked as read on conversation open
- Unread message count badge in the nav bar (polled every 15 s)
- Bubble UI: own messages right-aligned (violet gradient), others left-aligned

## Notifications
- In-app notification feed (`/notifications`)
- Notification types: `friend_request`, `friend_accepted`, `post_comment`, `post_vote`, `mention`, `system`
- Mark individual notification as read on click
- Mark all notifications as read
- Unread notification count badge in the nav bar (polled every 15 s)

## Navigation
- 8-tab bottom navigation bar: Map · Feed · Post · People · Messages · Alerts · Saved · Profile
- Unread badges on Messages and Alerts tabs
- Auth-required tabs redirect to login when unauthenticated

## Profile
- View own profile page
- Update display name and bio
- Update email address

## Backend / Infrastructure
- Express + TypeScript API with Sequelize ORM (PostgreSQL)
- Zod schema validation on all request bodies and params
- Soft deletes (`paranoid: true`) on Posts and Comments
- Sequelize associations for all models (User, Post, Vote, Comment, Bookmark, Contact, Conversation, ConversationParticipant, Message, Notification, RefreshToken)
- Turborepo monorepo with separate `apps/api` and `apps/home` packages
- Docker Compose for local development
- Playwright end-to-end tests and Jest unit/integration tests
- Seed script for local test data
