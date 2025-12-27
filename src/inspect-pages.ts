import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function inspectPages() {
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    console.error('❌ NOTION_DATABASE_ID not set');
    return;
  }

  try {
    console.log('🔍 Querying database for existing pages...\n');

    // @ts-ignore
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 1,
    });

    if (response.results.length === 0) {
      console.log('No pages found in database');
      return;
    }

    const page = response.results[0] as any;

    console.log('📄 Sample Page:');
    console.log(`   ID: ${page.id}`);
    console.log('\n📋 Properties in this page:');
    console.log(JSON.stringify(page.properties, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

inspectPages();
