# Dreamcatcher Setup Guide

## Getting Your Notion API Key

Follow these steps to set up your Notion integration:

### Step 1: Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Give it a name (e.g., "Dreamcatcher")
4. Select the workspace where you want to store your notes
5. Click **"Submit"**
6. Copy the **"Internal Integration Token"** - this is your `NOTION_API_KEY`

### Step 2: Create or Find Your Notion Database

You need a database in Notion where your notes will be archived. You can either:

**Option A: Create a new database**
1. Open Notion and create a new page
2. Type `/database` and select "Table - Inline"
3. Name it something like "Daily Notes Archive"

**Option B: Use an existing database**
- Navigate to the database you want to use

### Step 3: Share the Database with Your Integration

1. Open your Notion database page
2. Click the **"..."** (three dots) in the top right
3. Scroll down and click **"Add connections"**
4. Search for and select your integration (e.g., "Dreamcatcher")
5. Click **"Confirm"**

### Step 4: Get Your Database ID

Your database ID is in the URL of your database page:

```
https://www.notion.so/YOUR_WORKSPACE/DATABASE_ID?v=VIEW_ID
                                     ^^^^^^^^^^^
                                     This is your Database ID
```

The DATABASE_ID is a 32-character string (with hyphens).

Example: `12345678-1234-1234-1234-123456789abc`

### Step 5: Configure Your Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NOTION_DATABASE_ID=12345678-1234-1234-1234-123456789abc
   PORT=3000
   ```

## Next Steps

Once you have your `.env` file configured, we can:

1. **Investigate your Notion database structure** - I'll look at what properties/columns exist
2. **Build the parser** - Extract timestamps and notes from your text
3. **Test the integration** - Make sure everything works before archiving real notes

## Running the App

```bash
# Install dependencies (already done)
npm install

# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

## Need Help?

Let me know when you have:
- Created the Notion integration ✓
- Created/selected your database ✓
- Shared the database with your integration ✓
- Added the credentials to your .env file ✓

Then I can investigate your database structure and build the rest of the system!
