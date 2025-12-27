import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { parseNotes } from './parser';
import { NotionArchiver } from './notion-client';
import { ClaudeService } from './claude-service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Notion client
const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!notionApiKey || !notionDatabaseId) {
  console.error('❌ Error: NOTION_API_KEY and NOTION_DATABASE_ID must be set in .env file');
  process.exit(1);
}

if (!anthropicApiKey) {
  console.error('❌ Error: ANTHROPIC_API_KEY must be set in .env file');
  process.exit(1);
}

const notionArchiver = new NotionArchiver(notionApiKey, notionDatabaseId);
const claudeService = new ClaudeService(anthropicApiKey);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory cache for thoughts
let thoughtsCache: any = null;
let thoughtsCacheTime = 0;
const THOUGHTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Background reflection preloader - runs every 4 minutes
async function preloadReflection() {
  try {
    console.log('🔄 Background: Preloading reflection...');
    const notes = await notionArchiver.getRecentNotes(7);
    await claudeService.generateReflection(notes, true); // Force refresh
    console.log('✅ Background: Reflection preloaded and cached');
  } catch (error: any) {
    console.error('❌ Background: Failed to preload reflection:', error.message);
  }
}

// Background thoughts preloader
async function preloadThoughts() {
  try {
    console.log('🔄 Background: Preloading thoughts...');
    const notes = await notionArchiver.getRecentNotes(365);
    const sortedNotes = notes.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.timestamp);
      const dateB = new Date(b.date + ' ' + b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });
    thoughtsCache = sortedNotes;
    thoughtsCacheTime = Date.now();
    console.log(`✅ Background: ${sortedNotes.length} thoughts preloaded and cached`);
  } catch (error: any) {
    console.error('❌ Background: Failed to preload thoughts:', error.message);
  }
}

// Preload immediately on startup
setTimeout(() => {
  preloadReflection();
  preloadThoughts();
}, 2000); // Wait 2 seconds after server starts

// Preload every 4 minutes
setInterval(preloadReflection, 4 * 60 * 1000);
// Preload thoughts every 5 minutes
setInterval(preloadThoughts, 5 * 60 * 1000);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Thoughts endpoint - get notes with pagination
app.get('/api/thoughts', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;

    // Check cache first
    let allNotes = thoughtsCache;
    if (!allNotes || Date.now() - thoughtsCacheTime > THOUGHTS_CACHE_TTL) {
      console.log('\n📖 Fetching thoughts (cache miss)...');
      const notes = await notionArchiver.getRecentNotes(365);
      allNotes = notes.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.timestamp);
        const dateB = new Date(b.date + ' ' + b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
      thoughtsCache = allNotes;
      thoughtsCacheTime = Date.now();
      console.log(`✅ Cached ${allNotes.length} thoughts`);
    } else {
      console.log(`⚡ Serving cached thoughts (page ${page})`);
    }

    // Paginate
    const start = page * limit;
    const end = start + limit;
    const paginatedNotes = allNotes.slice(start, end);

    res.json({
      success: true,
      page,
      limit,
      total: allNotes.length,
      hasMore: end < allNotes.length,
      notes: paginatedNotes,
    });
  } catch (error: any) {
    console.error('❌ Error fetching thoughts:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch thoughts' });
  }
});

// Reflect endpoint - get AI-generated reflection on recent notes
app.get('/api/reflect', async (req, res) => {
  try {
    // Check cache first for instant response
    const cached = claudeService.getCachedReflection();
    if (cached) {
      console.log('⚡ Serving cached reflection (instant!)');
      return res.json(cached);
    }

    console.log('\n🧘 Generating fresh reflection...');

    // Fetch notes from the past week
    const notes = await notionArchiver.getRecentNotes(7);
    console.log(`📊 Found ${notes.length} notes from the past week`);

    // Generate reflection using Claude (will cache automatically)
    const reflection = await claudeService.generateReflection(notes);
    console.log('✅ Reflection generated and cached\n');

    res.json(reflection);
  } catch (error: any) {
    console.error('❌ Error generating reflection:', error);
    res.status(500).json({ error: error.message || 'Failed to generate reflection' });
  }
});

// Archive notes endpoint
app.post('/api/archive', async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ error: 'No notes provided' });
    }

    console.log('\n📝 Received notes to archive...');

    // Parse the notes
    const parsed = parseNotes(notes);

    if (parsed.allNotes.length === 0) {
      return res.status(400).json({ error: 'No valid notes found. Make sure your notes have timestamps.' });
    }

    console.log(`📊 Parsed ${parsed.allNotes.length} notes across ${parsed.notesByDay.size} days`);

    // Archive to Notion
    console.log('📤 Archiving to Notion...');
    const result = await notionArchiver.archiveNotes(parsed.allNotes);

    console.log(`✅ Archive complete: ${result.success} successful, ${result.failed} failed\n`);

    if (result.failed > 0) {
      return res.status(207).json({
        success: true,
        message: `Archived ${result.success} notes. ${result.failed} failed.`,
        details: {
          success: result.success,
          failed: result.failed,
          errors: result.errors,
        },
      });
    }

    res.json({
      success: true,
      message: `Successfully archived ${result.success} note${result.success > 1 ? 's' : ''} to Notion!`,
      details: {
        notesArchived: result.success,
        daysSpanned: parsed.notesByDay.size,
      },
    });
  } catch (error: any) {
    console.error('❌ Error archiving notes:', error);
    res.status(500).json({ error: error.message || 'Failed to archive notes' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
