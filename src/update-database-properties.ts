import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function updateDatabaseProperties() {
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    console.error('❌ NOTION_DATABASE_ID not set in .env file');
    return;
  }

  try {
    console.log('🔧 Updating database properties...\n');

    // @ts-ignore
    const response = await notion.databases.update({
      database_id: databaseId,
      // @ts-ignore
      properties: {
        // Title property (required for all databases)
        Name: {
          title: {},
        },
        // Date of the note entry
        Date: {
          date: {},
        },
        // Full timestamp string
        Timestamp: {
          rich_text: {},
        },
        // The note content
        Content: {
          rich_text: {},
        },
        // Original raw text (for reference)
        Raw: {
          rich_text: {},
        },
      },
    });

    console.log('✅ Database properties updated successfully!');
    console.log(JSON.stringify(response, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\nFull error:', error);
  }
}

updateDatabaseProperties();
