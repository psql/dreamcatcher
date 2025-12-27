import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function createDatabase() {
  try {
    console.log('🚀 Setting up Dreamcatcher...\n');

    // First, try to find any existing page we have access to
    console.log('🔍 Searching for accessible pages...');
    const searchResponse = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
      page_size: 1,
    });

    let parentPageId: string;

    if (searchResponse.results.length > 0) {
      // Use the first accessible page as parent
      parentPageId = searchResponse.results[0].id;
      const page = searchResponse.results[0] as any;
      const pageTitle = page.properties?.title?.title?.[0]?.plain_text || 'Unknown';
      console.log(`✓ Found accessible page: "${pageTitle}"`);
      console.log(`  Will create database inside this page\n`);
    } else {
      // Try to create a new page
      console.log('No accessible pages found. Creating a new page...\n');

      // @ts-ignore
      const pageResponse = await notion.pages.create({
        // @ts-ignore
        parent: {
          type: 'workspace' as any,
          workspace: true,
        } as any,
        // @ts-ignore
        properties: {
          title: {
            title: [
              {
                text: {
                  content: 'Dreamcatcher',
                },
              },
            ],
          },
        },
      });

      parentPageId = (pageResponse as any).id;
      console.log('✓ Created new page "Dreamcatcher"\n');
    }

    console.log('📊 Creating database...');

    // @ts-ignore - TypeScript types may be incomplete
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
            content: 'Dreamcatcher Daily Notes Archive',
          },
        },
      ],
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

    const dbData = response as any;
    const databaseId = dbData.id;

    console.log('✅ Database created successfully!\n');
    console.log(`📊 Database Name: "Dreamcatcher Daily Notes Archive"`);
    console.log(`📝 Database ID: ${databaseId}`);
    console.log(`🔗 URL: https://notion.so/${databaseId.replace(/-/g, '')}\n`);

    console.log('📋 Properties created:');
    console.log('  - Name (Title) - Entry identifier');
    console.log('  - Date (Date) - The date of the note');
    console.log('  - Timestamp (Text) - Full timestamp string');
    console.log('  - Content (Text) - The note content');
    console.log('  - Raw (Text) - Original raw text\n');

    // Update .env file with the new database ID
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Replace the database ID
    envContent = envContent.replace(
      /NOTION_DATABASE_ID=.*/,
      `NOTION_DATABASE_ID=${databaseId}`
    );

    fs.writeFileSync(envPath, envContent);

    console.log('✅ Updated .env file with new database ID\n');
    console.log('🎉 Setup complete! You can now start archiving notes.');

  } catch (error: any) {
    console.error('\n❌ Error creating database:', error.message);

    if (error.code === 'validation_error') {
      console.log('\n⚠️  The integration needs to be connected to a page.');
      console.log('\nTo fix this:');
      console.log('1. Create a new page in Notion (or use an existing one)');
      console.log('2. Share that page with your integration');
      console.log('3. Copy the page ID from the URL');
      console.log('4. Add it to your .env file as NOTION_PAGE_ID=your-page-id');
      console.log('5. Run this script again');
      console.log('\nOR: Just create the database manually in Notion and share it with the integration.');
    } else {
      console.log('\nFull error:', error);
    }
  }
}

createDatabase();
