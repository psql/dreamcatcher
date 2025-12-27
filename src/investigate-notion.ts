import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function investigateNotion() {
  try {
    console.log('🔍 Investigating Notion workspace...\n');

    // Search for all items (databases and pages)
    console.log('Searching for databases...');
    const response = await notion.search({});

    // Filter for databases only
    const databases = response.results.filter((item: any) =>
      item.object === 'database'
    );

    if (databases.length === 0) {
      console.log('❌ No databases found that the integration has access to.');
      console.log('\nMake sure you:');
      console.log('1. Shared your database with the integration');
      console.log('2. The integration has the correct permissions');
      return;
    }

    console.log(`\n✓ Found ${databases.length} database(s):\n`);

    for (const db of databases) {
      const database = db as any;
      const title = database.title?.[0]?.plain_text || 'Untitled';
      const id = database.id;

      console.log(`📊 Database: "${title}"`);
      console.log(`   ID: ${id}`);
      console.log(`   URL: https://notion.so/${id.replace(/-/g, '')}`);

      // Get database properties
      console.log('   Properties:');
      const properties = database.properties;
      for (const [name, prop] of Object.entries(properties)) {
        const propData = prop as any;
        console.log(`     - ${name} (${propData.type})`);
      }
      console.log('');
    }

    // If we found a database called "docstream", highlight it
    const docstreamDb = databases.find((db: any) => {
      const title = db.title?.[0]?.plain_text?.toLowerCase() || '';
      return title.includes('docstream');
    }) as any;

    if (docstreamDb) {
      console.log('\n✨ Found "docstream" database!');
      console.log(`\nAdd this to your .env file:`);
      console.log(`NOTION_DATABASE_ID=${docstreamDb.id}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 'unauthorized') {
      console.log('\nThe API key might be invalid or the integration needs permission.');
    }
  }
}

investigateNotion();
