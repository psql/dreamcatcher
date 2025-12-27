import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function setupProperDatabase() {
  try {
    console.log('🚀 Creating a proper table database with date columns...\n');

    // Find an existing page to use as parent
    const searchResponse = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
      page_size: 1,
    });

    if (searchResponse.results.length === 0) {
      console.error('❌ No accessible pages found. Please create a page in Notion and share it with the integration first.');
      return;
    }

    const parentPageId = searchResponse.results[0].id;
    console.log(`✓ Using parent page: ${parentPageId}\n`);

    // Create database with proper schema
    // @ts-ignore
    const response = await notion.databases.create({
      // @ts-ignore
      parent: {
        type: 'page_id',
        page_id: parentPageId,
      },
      // @ts-ignore
      title: [
        {
          type: 'text',
          text: {
            content: 'Dreamcatcher Daily Notes',
          },
        },
      ],
      // @ts-ignore
      properties: {
        // Title column (required)
        Name: {
          title: {},
        },
        // Note date (proper date type)
        'Note Date': {
          date: {},
        },
        // When it was filed/archived
        Filed: {
          created_time: {},
        },
        // Original timestamp string
        Timestamp: {
          rich_text: {},
        },
        // Note content (preview)
        Content: {
          rich_text: {},
        },
      },
    });

    const dbData = response as any;
    const databaseId = dbData.id;

    console.log('✅ Database created successfully!\n');
    console.log(`📊 Database: "Dreamcatcher Daily Notes"`);
    console.log(`📝 Database ID: ${databaseId}`);
    console.log(`🔗 URL: https://notion.so/${databaseId.replace(/-/g, '')}\n`);

    console.log('📋 Columns:');
    console.log('  - Name (Title) - Note identifier');
    console.log('  - Note Date (Date) - The date from your timestamp');
    console.log('  - Filed (Created Time) - When the note was archived');
    console.log('  - Timestamp (Text) - Original timestamp string');
    console.log('  - Content (Text) - Note content preview\n');

    // Update .env file
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(
      /NOTION_DATABASE_ID=.*/,
      `NOTION_DATABASE_ID=${databaseId}`
    );
    fs.writeFileSync(envPath, envContent);

    console.log('✅ Updated .env file with new database ID\n');
    console.log('🎉 All set! The database is ready with proper date columns.');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.log('\nFull error:', error);
  }
}

setupProperDatabase();
