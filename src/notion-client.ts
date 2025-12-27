import { Client } from '@notionhq/client';
import { ParsedNote } from './parser';

export class NotionArchiver {
  private notion: Client;
  private databaseId: string;

  constructor(apiKey: string, databaseId: string) {
    this.notion = new Client({ auth: apiKey });
    this.databaseId = databaseId;
  }

  /**
   * Archive a single note to Notion
   */
  async archiveNote(note: ParsedNote): Promise<string> {
    try {
      // @ts-ignore - TypeScript types may be incomplete
      const response = await this.notion.pages.create({
        // @ts-ignore
        parent: {
          type: 'database_id',
          database_id: this.databaseId,
        },
        // @ts-ignore
        icon: {
          type: 'emoji',
          emoji: '📝',
        },
        // @ts-ignore
        properties: {
          // Name column (title)
          Name: {
            title: [
              {
                type: 'text',
                text: {
                  content: `${note.date} - ${note.timestamp}`,
                },
              },
            ],
          },
          // Note Date column (date)
          'Note Date': {
            date: {
              start: note.date,
            },
          },
          // Timestamp column (text)
          Timestamp: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: note.timestamp,
                },
              },
            ],
          },
          // Content column (text preview)
          Content: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: note.content.substring(0, 2000),
                },
              },
            ],
          },
          // Created column (auto-populated by Notion)
          // Note: This will only work if the column exists in the database
          // If it doesn't exist yet, you'll need to add it manually first
        },
        // Add full content as blocks in the page body
        // @ts-ignore
        children: [
          {
            object: 'block',
            type: 'callout',
            callout: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `📅 ${note.date}  •  ⏰ ${note.timestamp}`,
                  },
                },
              ],
              icon: {
                emoji: '📌',
              },
              color: 'gray_background',
            },
          },
          {
            object: 'block',
            type: 'divider',
            divider: {},
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: note.content || '(empty)',
                  },
                },
              ],
            },
          },
        ],
      });

      const pageData = response as any;
      return pageData.id;
    } catch (error: any) {
      console.error('Error archiving note:', error.message);
      throw new Error(`Failed to archive note: ${error.message}`);
    }
  }

  /**
   * Archive multiple notes to Notion
   */
  async archiveNotes(notes: ParsedNote[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const note of notes) {
      try {
        await this.archiveNote(note);
        success++;
        console.log(`✓ Archived note from ${note.timestamp}`);
      } catch (error: any) {
        failed++;
        const errorMsg = `Failed to archive note from ${note.timestamp}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * Check if the connection to Notion is working
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.notion.databases.retrieve({
        database_id: this.databaseId,
      });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}
