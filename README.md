# Reals - Calgary Hacks 2026

## Turning Doomscrolling into Real Learning

**Reals** is an educational web application that transforms short-form
scrolling into structured, gated micro-learning. Inspired by the
fast-paced UX of platforms like TikTok, Reals delivers five short
AI-generated micro-lecture videos - but you cannot scroll forward
until you correctly answer a comprehension question.

Instead of:

Watch → Forget → Scroll

It becomes:

Watch → Retrieve → Confirm → Progress

------------------------------------------------------------------------

## Concept Overview

Users create educational "threads" by:

-   Entering a topic prompt\
-   Explicitly specifying required sources (URLs, PDFs, textbooks,
    notes)\
-   Optionally selecting difficulty or constraints (e.g., "Use chapter 4
    only")

The system generates:

-   5 structured micro-lecture videos (\~60 seconds each)
-   5 multiple-choice comprehension questions (1 per video)

All content is pre-generated and preloaded for smooth playback.

------------------------------------------------------------------------

## Core Features

### Gated Progression

-   Users must answer correctly to unlock the next video.
-   Incorrect answers require retry + replay.
-   Passive scrolling is eliminated.

### Active Recall Reinforcement

-   Forces retrieval before progression.
-   Immediate feedback with explanation.

### Structured Micro-Learning

Each video includes: - \~10-second vertical looping background -
AI-generated script - TTS narration - Burned-in subtitles - Focused
concept coverage

### Progress Tracking

Tracks: - Attempts - Completion time - Mastery per concept

------------------------------------------------------------------------

## Tech Stack

### Frontend
- Next.js (React)

### Backend
- Next.js  routes (Node.js)

### Database
- MySQL (mysql2)

### Storage
- Azure Blob Storage

### AI / APIs
- KEI API — Primary AI orchestration layer
- Sora 2 (via KEI API) — Short-form vertical video generation
- Groq API — Prompt refinement & structured topic decomposition
- ElevenLabs API — Text-To-Speech generation from text inputted

------------------------------------------------------------------------

## Architecture Overview

1.  Thread Creation\
    Prompt + sources stored in database

2.  AI Generation Pipeline

    -   Topic decomposition → 5 subtopics\
    -   Script generation\
    -   Quiz generation\
    -   TTS audio\
    -   Background clip\
    -   Subtitle rendering\
    -   Final MP4 render\
    -   Upload to Azure Blob

3.  Playback

    -   Preloaded videos\
    -   Swipe gated by quiz validation

4.  Progress Tracking

    -   Stored per user per video

------------------------------------------------------------------------

## Environment Variable Setup

Create a `.env.local` file in the root of your project:

### MySQL Configuration

MYSQL_HOST=localhost\
MYSQL_PORT=3306\
MYSQL_USER=root\
MYSQL_PASSWORD=your_password\
MYSQL_DATABASE=video

### Azure Blob Storage

AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name\
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key\
AZURE_STORAGE_CONTAINER_VIDEOS=videos\

### AI / Generation Keys

KEI_API_KEY=your_api_key
GROQ_API_KEY=your_api_key

------------------------------------------------------------------------

## Installation

npm install\
npm install @azure/storage-blob\
npm install mysql2
npm install groq-sdk

Run locally:

npm run dev

Local connection:

http://localhost:3000

------------------------------------------------------------------------

## Why Reals Is Different

Reals preserves the engagement of short-form video while removing
passive consumption. Every scroll is earned through demonstrated
understanding.

Real scrolling. Real recall. Real learning.

------------------------------------------------------------------------
