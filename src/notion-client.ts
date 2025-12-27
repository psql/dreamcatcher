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
   * Split long text into chunks that fit Notion's 2000 character limit
   */
  private splitIntoChunks(text: string, maxLength: number = 2000): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      const chunk = text.substring(currentIndex, currentIndex + maxLength);
      chunks.push(chunk);
      currentIndex += maxLength;
    }

    return chunks;
  }

  /**
   * Archive a single note to Notion
   */
  async archiveNote(note: ParsedNote): Promise<string> {
    try {
      // Split content into chunks if it's too long
      const contentChunks = this.splitIntoChunks(note.content || '(empty)', 2000);
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
          // Create a paragraph block for each chunk
          ...contentChunks.map((chunk) => ({
            object: 'block' as const,
            type: 'paragraph' as const,
            paragraph: {
              rich_text: [
                {
                  type: 'text' as const,
                  text: {
                    content: chunk,
                  },
                },
              ],
            },
          })),
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

  /**
   * Get notes from the past week for reflection
   */
  async getRecentNotes(days: number = 7): Promise<ParsedNote[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - days);
      const dateFilter = sevenDaysAgo.toISOString().split('T')[0];

      // @ts-ignore
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Note Date',
          date: {
            on_or_after: dateFilter,
          },
        },
        sorts: [
          {
            property: 'Note Date',
            direction: 'descending',
          },
        ],
      });

      // @ts-ignore
      const notes: ParsedNote[] = response.results.map((page: any) => {
        const noteDate = page.properties['Note Date']?.date?.start || '';
        const timestamp = page.properties['Timestamp']?.rich_text?.[0]?.text?.content || '';
        const content = page.properties['Content']?.rich_text?.[0]?.text?.content || '';

        return {
          date: noteDate,
          timestamp: timestamp,
          content: content,
        };
      });

      return notes;
    } catch (error: any) {
      console.error('Error fetching recent notes:', error.message);
      throw new Error(`Failed to fetch recent notes: ${error.message}`);
    }
  }
}
