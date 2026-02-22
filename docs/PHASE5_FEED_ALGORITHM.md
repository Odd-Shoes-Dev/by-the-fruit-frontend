# Phase 5: Feed Algorithm

## Overview
Community feed with a simple relevance algorithm so investors and founders see posts that matter to them (connections, community, category match).

## Backend
- **CommunityPost**: author, community (optional), content, image, video, category
- **GET /profiles/community-posts/** — list (chronological), no auth
- **GET /profiles/community-posts/feed/** — relevance-ordered for authenticated user
- **POST /profiles/community-posts/** — create (auth required)

## Relevance Scoring (feed)
- **+10** if post author is a connected user (investor↔founder)
- **+5** if post author is in a community the viewer is in
- **+2** if post category matches viewer’s investment_type (investors) or business category (founders)
- Sorted by score (desc), then by date (desc)

## Frontend
- PostForm: content + optional category → community-posts API
- PostList: fetches feed when logged in, list when not; author link, category
- Community page: refresh after post; “Feed” in nav when logged in
