# Dreamcatcher

A minimalist note archiving system that parses timestamped notes and archives them to Notion.

## Features

- 📝 Fullscreen, distraction-free writing interface (inspired by iA Writer)
- 🗓️ Automatic date extraction from timestamps
- 📊 Archives to Notion with sortable date columns
- ⌨️ Keyboard shortcuts (⌘+Enter to archive)
- 🎨 Clean, minimalist dark UI

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

3. Add your Notion credentials to `.env`:
```
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id
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

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: Vanilla JS, HTML, CSS
- **Database**: Notion API
- **Deployment**: Railway (recommended) or Netlify Functions

## License

ISC
