import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function inspectDatabase() {
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    console.error('❌ NOTION_DATABASE_ID not set in .env file');
    return;
  }

  try {
    console.log('🔍 Inspecting database...\n');
    console.log(`Database ID: ${databaseId}\n`);

    // Get database structure
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    const dbData = database as any;
    const title = dbData.title?.[0]?.plain_text || 'Untitled';

    console.log(`📊 Database Name: "${title}"`);
    console.log(`   URL: https://notion.so/${databaseId.replace(/-/g, '')}\n`);

    console.log('📋 Properties (columns):');
    console.log('─'.repeat(50));

    const properties = dbData.properties || {};

    if (Object.keys(properties).length === 0) {
      console.log('  (No properties found - database might not be accessible)');
      console.log('\n  Debug: Full database object:');
      console.log(JSON.stringify(dbData, null, 2));
      return;
    }

    for (const [name, prop] of Object.entries(properties)) {
      const propData = prop as any;
      console.log(`\n  Property: "${name}"`);
      console.log(`  Type: ${propData.type}`);

      // Show additional details for certain types
      if (propData.type === 'select' && propData.select?.options) {
        console.log(`  Options: ${propData.select.options.map((o: any) => o.name).join(', ')}`);
      }
      if (propData.type === 'multi_select' && propData.multi_select?.options) {
        console.log(`  Options: ${propData.multi_select.options.map((o: any) => o.name).join(', ')}`);
      }
    }

    console.log('\n' + '─'.repeat(50));

    // Try to get a sample entry
    console.log('\n📄 Sample entries (first 3):');
    console.log('─'.repeat(50));

    // @ts-ignore - TypeScript types are incomplete for this method
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 3,
    });

    if (response.results.length === 0) {
      console.log('  (Database is empty)');
    } else {
      response.results.forEach((page: any, index: number) => {
        console.log(`\n  Entry ${index + 1}:`);

        // Show the page properties
        for (const [propName, propValue] of Object.entries(page.properties)) {
          const prop = propValue as any;
          let value = '(empty)';

          // Extract value based on type
          if (prop.type === 'title' && prop.title?.[0]) {
            value = prop.title[0].plain_text;
          } else if (prop.type === 'rich_text' && prop.rich_text?.[0]) {
            value = prop.rich_text[0].plain_text;
          } else if (prop.type === 'date' && prop.date) {
            value = prop.date.start;
          } else if (prop.type === 'select' && prop.select) {
            value = prop.select.name;
          } else if (prop.type === 'multi_select' && prop.multi_select) {
            value = prop.multi_select.map((s: any) => s.name).join(', ');
          } else if (prop.type === 'number' && prop.number !== null) {
            value = String(prop.number);
          }

          console.log(`    ${propName}: ${value}`);
        }
      });
    }

    console.log('\n' + '─'.repeat(50));
    console.log('\n✅ Database inspection complete!');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'object_not_found') {
      console.log('\n⚠️  The database was not found. Make sure you:');
      console.log('1. Shared the database with your integration');
      console.log('2. The database ID is correct');
      console.log('\nTo share the database:');
      console.log('- Open the database in Notion');
      console.log('- Click "..." (three dots) in top right');
      console.log('- Click "Add connections"');
      console.log('- Select your integration');
    } else if (error.code === 'unauthorized') {
      console.log('\n⚠️  Authorization error. Check your NOTION_API_KEY.');
    } else {
      console.log('\nFull error:', error);
    }
  }
}

inspectDatabase();
