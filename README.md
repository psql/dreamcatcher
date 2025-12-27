# Dreamcatcher

A minimalist note-taking app with AI-powered reflections. Capture thoughts quickly, archive them to Notion, and get time-based insights from Claude AI.

## Features

### ✏️ Write Tab
- **Quick capture**: Start typing immediately
- **Auto-timestamp**: No timestamp? We add one automatically
- **Auto-backup**: Saves to `backup.txt` every 5 minutes + 10 seconds after typing stops
- **Archive to Notion**: One-click sync with keyboard shortcut (`Cmd+Enter`)
- **Long note support**: Automatically splits notes >2000 chars for Notion API

### 🧘 Reflect Tab
- **AI-powered insights**: Claude analyzes your past week of notes
- **Time-based ragas**: Dynamic personality based on time of day
  - Morning (5am-11am): Awakening, preparation focus
  - Midday (11am-5pm): Active, physical energy
  - Evening (5pm-5am): Contemplative, reflective
- **Dynamic styling**: Background colors, fonts, typography adapt to mood
- **Cached for speed**: Preloads in background every 4 minutes

### 📖 Thoughts Tab
- **Read your archive**: Clean, scrollable view of all notes
- **Always fresh**: Fetches latest from Notion (no cache)
- **Infinite scroll**: Loads 20 notes at a time
- **Chronological**: Newest first

### ⚡ Command Palette (`Cmd+K`)
- Quick navigation with fuzzy search
- Single-key shortcuts: `W` (Write), `R` (Reflect), `T` (Thoughts), `B` (Backups)
- Arrow keys + Enter for keyboard-only navigation

### ⌨️ Keyboard Navigation
- `ESC` - Enter tab navigation mode
- `←` / `→` - Navigate tabs instantly
- `ENTER` - Exit navigation, return to editing
- `Cmd+Enter` - Archive notes

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Add your credentials to `.env`:
```env
# Notion Integration Token
NOTION_API_KEY=your_notion_integration_token

# Notion Database ID
NOTION_DATABASE_ID=your_database_id

# Anthropic API Key for Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# Server Port (optional)
PORT=3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open `http://localhost:3000`

## Deploying to Railway

### Prerequisites
- Railway account: https://railway.app
- Railway CLI installed: `npm i -g @railway/cli`

### Deployment Steps

1. **Login to Railway:**
```bash
railway login
```

2. **Initialize project:**
```bash
railway init
```

3. **Add environment variables:**
```bash
railway variables set NOTION_API_KEY=your_notion_integration_token
railway variables set NOTION_DATABASE_ID=your_database_id
```

4. **Deploy:**
```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
railway up
```

5. **Your app will be live!** Railway will provide a URL like `https://dreamcatcher-production.up.railway.app`

### Alternative: Deploy via GitHub

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `psql/dreamcatcher`
4. Add environment variables in the Railway dashboard:
   - `NOTION_API_KEY`
   - `NOTION_DATABASE_ID`
5. Deploy!

## Notion Setup

See [SETUP.md](./SETUP.md) for detailed instructions on setting up your Notion integration and database.

## Note Format

Your notes should have timestamps in one of these formats:

```
2025.12.26.1430.GMT-0800
Your note content here

2025.12.26.1545.GMT-0800
Another note

2025.12.27
Simple date format also works
```

## Project Structure

```
dreamcatcher/
├── src/
│   ├── server.ts           # Express server, API endpoints, background tasks
│   ├── notion-client.ts    # Notion API integration, CRUD operations
│   ├── claude-service.ts   # Claude AI integration, reflection generation
│   ├── parser.ts           # Note timestamp parser
│   └── ...
├── public/
│   └── index.html          # Single-page frontend (HTML + CSS + JS)
├── backup.txt              # Auto-backup file (gitignored)
├── .env                    # Environment variables (gitignored)
└── package.json
```

## Architecture

### Backend (TypeScript + Express)
- **Server** (`src/server.ts`): Main Express app, routes, background tasks
- **Notion Client** (`src/notion-client.ts`): Handles all Notion API calls
  - Archive notes to database
  - Fetch recent notes with pagination
  - Auto-splits content >2000 chars
- **Claude Service** (`src/claude-service.ts`): AI reflection generation
  - Time-of-day personality system (ragas)
  - In-memory caching (5 min TTL)
  - Background preloading every 4 minutes
- **Parser** (`src/parser.ts`): Parses timestamps from note text

### Frontend (Vanilla JS)
- **Single HTML file** with embedded CSS and JavaScript
- **Tab system**: Three main views (write, reflect, thoughts)
- **Command palette**: Fuzzy search + keyboard shortcuts
- **Auto-backup**: Periodic saves to server (5min + 10s after typing)
- **Keyboard navigation**: ESC + arrows for tab switching

### Data Flow

#### Writing & Archiving
```
User types → Auto-backup (10s debounce) → Server saves to backup.txt
User hits Archive → Auto-add timestamp if missing → Parse notes →
Split into chunks → Create Notion pages → Clear backup
```

#### Reflections
```
Server startup → Background preload (fetch notes + generate reflection) →
Cache for 5 min → User opens reflect tab → Serve cached data (instant) →
Background refresh every 4 min
```

#### Thoughts
```
User opens thoughts tab → Fetch from Notion API (page 0) →
User scrolls → Load next page when 80% scrolled → Append to list
```

## API Endpoints

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

### `POST /api/backup`
Save textarea content to backup file.

**Body:**
```json
{ "content": "your note text..." }
```

### `GET /api/backup`
Load backup content.

**Response:**
```json
{ "success": true, "content": "..." }
```

### `DELETE /api/backup`
Clear backup file.

### `GET /api/open-backups`
Opens project root folder in file explorer.

### `GET /api/thoughts?page=0&limit=20`
Fetch notes from Notion with pagination.

**Query params:**
- `page`: Page number (default: 0)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "page": 0,
  "limit": 20,
  "total": 100,
  "hasMore": true,
  "notes": [
    {
      "date": "2025-12-26",
      "timestamp": "2025.12.26.1430.GMT-0800",
      "content": "Note content..."
    }
  ]
}
```

### `GET /api/reflect`
Get AI-generated reflection on recent notes.

**Response:**
```json
{
  "theme": "Theme of your week...",
  "insight": "A positive insight...",
  "objective": "Suggested objective...",
  "styles": {
    "backgroundColor": "#1a1a1a",
    "textColor": "#e0e0e0",
    "accentColor": "#4a9eff",
    "fontFamily": "Inter",
    "fontWeight": "300",
    "letterSpacing": "0.02em",
    "textTransform": "none",
    "animation": "pulse"
  }
}
```

### `POST /api/archive`
Archive notes to Notion.

**Body:**
```json
{ "notes": "2025.12.26.1430.GMT-0800\nYour note content..." }
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully archived 1 note to Notion!",
  "details": {
    "notesArchived": 1,
    "daysSpanned": 1
  }
}
```

## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Storage**: Notion API (via @notionhq/client v2.x)
- **AI**: Claude API (via @anthropic-ai/sdk)
- **Fonts**: Google Fonts (Inter, Space Mono, Playfair Display, Courier Prime)
- **Deployment**: Railway (recommended) or any Node.js hosting

## Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repo** and clone your fork
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly** - run `npm run build` to check for TypeScript errors
5. **Commit with clear messages** (see format below)
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Commit Message Format

```
Add/Update/Fix: Brief description

- Bullet points with details
- What changed and why
- Any breaking changes

🤖 Generated with [Tool Name]
Co-Authored-By: [Your Name]
```

### Code Style

- **TypeScript** with `@ts-ignore` for incomplete Notion types
- **Minimal dependencies** - keep it lean
- **No frontend framework** - vanilla JS preferred
- **Functional programming** style where possible
- **Clear variable names** - readability > brevity

### Key Files for Contributors

**`src/server.ts`**
- All API endpoints
- Background tasks (reflection preload)
- Backup management
- Express app configuration

**`src/claude-service.ts`**
- `getTimeOfDayPersonality()` - Raga logic (morning/midday/evening)
- `generateReflection()` - Main AI call with caching
- `getCachedReflection()` - Cache retrieval

**`src/notion-client.ts`**
- `archiveNote()` - Single note → Notion page
- `getRecentNotes()` - Fetch with date filtering
- `splitIntoChunks()` - Handle long content (>2000 chars)

**`public/index.html`**
- Everything frontend (1 file!)
- Tab switching logic
- Command palette (Cmd+K)
- Keyboard navigation (ESC + arrows)
- Auto-backup system

## Troubleshooting

### "Notion API key invalid"
- Check your `.env` file has correct `NOTION_API_KEY`
- Verify the integration has access to the database
- Make sure database is shared with your integration

### "Anthropic API key missing"
- Add `ANTHROPIC_API_KEY` to your `.env` file
- Get one at https://console.anthropic.com/

### "No valid notes found"
- Timestamps should be: `YYYY.MM.DD.HHMM.GMT±HHMM`
- Or write without a timestamp - one will be auto-added!

### "Failed to archive" with 2000 char error
- Should be fixed automatically (auto-chunks)
- If persists, check `src/notion-client.ts` `splitIntoChunks()`

### Backup not loading
- Check file permissions in project root
- Look for `backup.txt` in root directory
- Check server logs for errors

## License

ISC

## Credits

Created by [@okpasquale](https://twitter.com/okpasquale)

Built with [Claude Code](https://claude.com/claude-code)
