## Project visions:
Building a location-centric visual social app (let’s call it "GeoPulse") requires a delicate balance between the high-engagement "scroll" of Instagram and the hyper-local anonymity of Jodel.
To help Claude (or any AI) build this effectively, you need to provide a clear hierarchy of "The Three Pillars": Discovery (The Map), Engagement (The Feed), and Privacy (The Shield).


## Features:
1. Feature List: The Discovery Engine (Map & Hotspots)
The map isn't just a secondary feature; it is the primary interface.
  • Interactive Map Layer: Use a vector-based map (Mapbox/Google Maps) with custom "GeoPulse" styling.
  • Dynamic Clustering: Instead of thousands of pins, images should "cluster" into circles with numbers when zoomed out.
  • Hotspot Heatmaps: A toggleable layer showing where the most activity has occurred in the last 24 hours.
    ○ Algorithm: Use DBSCAN (Density-Based Spatial Clustering) to identify high-density post areas without requiring a predefined number of clusters.
  • Temporal Filters: "Now," "Today," and "This Week" filters to keep the map from feeling cluttered with old content.
  • Augmented Reality (AR) "View Finder": Users can hold up their phone to see "floating" images in the direction they were taken (optional/Phase 2).

2. Feature List: The Engagement Engine (Feed & Social)
  • The "Pulse" Feed: An Instagram-style vertical scroll, but sorted by a mix of Proximity and Recency.
  • Anonymity Toggles: Users can post as their profile (Public), a pseudonym (Local Legend), or fully Anonymous.
  • Local Upvotes (Karma): Similar to Jodel, posts are upvoted/downvoted. High-karma posts stay on the map longer; low-karma posts "evaporate."
  • Localized Stories: 24-hour disappearing photos that only appear on the map at the exact spot they were taken.
  • Geofenced Chat: Comment sections for posts are only accessible if the user is within a certain radius (e.g., 5km) of the post's location.

3. Privacy & Data Security (The "Shield")
This is the most critical section for your developer prompt. In 2026, user trust is won or lost on location privacy.
A. Location Obfuscation
Never store or display a user's exact GPS coordinates for a post.
  • Grid-Based Snapping: Snap posts to a 100m X 100m grid so users cannot be "tracked" to their front door.
  • Ghost Zones: Allow users to define "Safe Zones" (home, work, school). If they post from within these zones, the app automatically shifts the pin to the nearest public landmark or hides the location entirely.
B. Metadata Scrubbing
  • EXIF Stripping: The backend must automatically strip all EXIF metadata (camera type, timestamp, and original GPS) from images before they are saved to the S3 bucket.
C. Data Encryption
  • Zero-Knowledge Storage: Use end-to-end encryption for private messages.
  • Ephemeral Logs: Location history should be stored in RAM for session-based discovery and purged every 24 hours.

4. Safety & Content Moderation
Local anonymous apps often become "toxic" without strict guardrails.
  • AI Auto-Mod: Use Rekognition or similar AI to auto-block NSFW content, hate speech, or identifiable faces (if the user selects "Anonymous" mode).
  • Community Policing: Give "Trusted" local users (high Karma) the ability to "freeze" a post for manual review.
  • Shadow-Banning: Instead of a hard ban, trolls' posts simply don't appear on the map for others, preventing them from seeking attention.

Technical Specifications for Claude
Copy and paste this into your Claude prompt:
  Project Name: GeoPulse
  Tech Stack: React Native (Frontend), Node.js/FastAPI (Backend), PostgreSQL with PostGIS (Spatial Database), Mapbox GL SDK.
  Database Schema Requirements:
    1. Posts table: Must use GEOGRAPHY type for coordinates. Include obfuscated_lat and obfuscated_lng.
    2. Karma table: To track user reputation without linking to real-world identity.
  Core Logic to Build:
    ○ Implement a function to calculate "Hotspots" using a density-based clustering algorithm.
    ○ Build a "Privacy Wrapper" that adds a random $10-50m$ offset to any coordinate before it is written to the database.
    ○ Set up an S3 trigger to strip image metadata upon upload.
  UI/UX Goal: > Minimalist, map-first. Transition between the map and the feed should be a seamless "swipe up" from a map pin.

A quick tip for the "Hotspots" logic:
The hotspot feature, should be weighted by engagement, not just volume. Ten photos with 0 likes shouldn't be a "Hotspot," but two photos with 500 likes should be.

## core requirements
- high fidelity, mobile first visual design
- a web app which is provided to the mobile experience via a PWA
- intuitive navigation
- high data security standards - no cross user data retrievel
- each table that contains user related data contains a column `userId` to indicate the owner of that dataset
- generally recommended, state-of-the-art security standards for api and data security
- all libraries that will be used, should be free for commercial use

## basic technical requirements
- usage of `any` should be prevented as much as possible

## backend standards
Domain driven design with the following core module structur inside the modules folder:
/sampleModule
  ├─ sample.controller.ts
  ├─ sample.controller.test.ts => large units of business logic and whole workflows
  ├─ sample.service.test.ts
  ├─ sample.service.ts => small units of business logic
  ├─ sample.repository.test.ts
  ├─ sample.repository.ts => single purpose DB interaction functions
  ├─ sample.routes.ts => usable routes that are provided to the express router
  ├─ sample.routes.test.ts
  ├─ sample.utils.test.ts
  ├─ sample.utils.ts => small single purpose helper functions
  ├─ sample.schemas.ts => validators for bodies/objects/json data. use zod

to ensure to not run into circular dependency issues, to module use a layered approached:
- repository: contains single purpose DB interaction function. Has no dependency to resources outside of the module
- service: contains units of business logic assembled from functions from repositories and utils. cannot import other services or controller
- controllers: contain whole workflows to fullfill the requirements for a specific use cases and larger units of business logic. cannot access other controllers

## API standards
- versioning (/api/v1)
- as needed, multiple different APIs for endusers, customer support managers/ sysadmin (i.e. /api/v1/...; /cs/...; /sysadmin/...)
- as close as possible to REST standards

## Frontend standards
- state-of-the-art react setup
- Zustand for state management
- should build upon an existing component library (free for commercial use) and implement its own design system
- No dependency to tailwind

## testing
- create seeds for demos and testing, that will be adjusted at each step where the db structure changes
- make use of extensive test setup with minimal mocking
- for testing database transaction, the testing suit uses a an sqlite setup, to run tests against an actual database and seed extensive test data to emulate real production-like circumstances
- for routes, there will be extensive integrations testing that will ensure, that routes are hit with various inputs, validatiing that data is correctly written to, and retreived from the database

## development and documentation
- for rapid prototyping and development use a sqlite database
- for every deveopment step and every feature progress there should be a markdown file in the documentation folder with timestamp in the name, documenting what has be done and summarizing the ai conversation session
- repeatadly go back to what already has been done - review it and improve iteratively