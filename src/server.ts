import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { parseNotes } from './parser';
import { NotionArchiver } from './notion-client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Notion client
const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !notionDatabaseId) {
  console.error('❌ Error: NOTION_API_KEY and NOTION_DATABASE_ID must be set in .env file');
  process.exit(1);
}

const notionArchiver = new NotionArchiver(notionApiKey, notionDatabaseId);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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
