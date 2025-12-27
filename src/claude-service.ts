import Anthropic from '@anthropic-ai/sdk';
import { ParsedNote } from './parser';

export interface ReflectionSummary {
  theme: string;
  insight: string;
  objective: string;
  styles: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
    fontWeight: string;
    letterSpacing: string;
    textTransform: string;
    animation: string;
  };
}

interface CachedReflection {
  data: ReflectionSummary;
  timestamp: number;
}

export class ClaudeService {
  private client: Anthropic;
  private cache: CachedReflection | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Get the time-of-day personality style (like Indian ragas)
   */
  private getTimeOfDayPersonality(): { period: string; prompt: string } {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
      // Morning (5am - 11am)
      return {
        period: 'morning',
        prompt: 'You are the morning raga - energizing, fresh, preparing. Focus on clarity and readiness for the day ahead. Your tone is gentle awakening, like sunrise. Encourage preparation, intention-setting, and fresh starts.',
      };
    } else if (hour >= 11 && hour < 17) {
      // Midday (11am - 5pm)
      return {
        period: 'midday',
        prompt: 'You are the midday raga - active, dynamic, physical. Focus on energy and movement. Your tone is vibrant and encouraging. Suggest physical activity, momentum, and engagement with the world.',
      };
    } else {
      // Evening (5pm - 5am)
      return {
        period: 'evening',
        prompt: 'You are the evening raga - contemplative, settling, reflective. Focus on meditation, integration, and rest. Your tone is calming like dusk. Encourage reflection on the day, gentle closure, and peaceful restoration.',
      };
    }
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    const now = Date.now();
    return now - this.cache.timestamp < this.CACHE_TTL;
  }

  /**
   * Get cached reflection if valid
   */
  getCachedReflection(): ReflectionSummary | null {
    if (this.isCacheValid()) {
      return this.cache!.data;
    }
    return null;
  }

  /**
   * Generate a reflection summary from recent notes
   */
  async generateReflection(notes: ParsedNote[], forceRefresh: boolean = false): Promise<ReflectionSummary> {
    // Return cached version if valid and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      console.log('⚡ Returning cached reflection');
      return this.cache!.data;
    }

    if (notes.length === 0) {
      const emptyReflection = {
        theme: 'No notes yet',
        insight: 'Start writing to see your reflections',
        objective: 'Write your first note',
        styles: {
          backgroundColor: '#1a1a1a',
          textColor: '#666666',
          accentColor: '#444444',
          fontFamily: 'Inter',
          fontWeight: '300',
          letterSpacing: '0.02em',
          textTransform: 'none',
          animation: 'none',
        },
      };
      // Cache even empty reflections
      this.cache = {
        data: emptyReflection,
        timestamp: Date.now(),
      };
      return emptyReflection;
    }

    // Get time-of-day personality
    const timePersonality = this.getTimeOfDayPersonality();
    console.log(`🎵 Using ${timePersonality.period} raga personality`);

    // Combine notes into a single string
    const notesText = notes
      .map((note) => `[${note.date} ${note.timestamp}]\n${note.content}`)
      .join('\n\n---\n\n');

    const prompt = `${timePersonality.prompt}

Based on the following notes from the past week, provide:

1. A brief theme (1-2 sentences) summarizing what the person has been thinking/working on
2. A positive insight (1-2 sentences) - something uplifting or interesting you notice, aligned with the current time of day
3. A suggested objective (1 sentence) - a concrete, actionable goal appropriate for this time of day
4. Dynamic visual styles that match the time-of-day energy - be creative and bold! This is a shape-shifting mutant interface.

For the styles object (only use color and typography - NO transforms/scales):
- backgroundColor: a color that captures the mood (can be vibrant, subtle, dark, light)
- textColor: main text color (ensure good readability with background)
- accentColor: for the "suggested objective" label
- fontFamily: choose from "Inter", "Space Mono", "Playfair Display", or "Courier Prime" (match the mood)
- fontWeight: 100-900 (thin for calm, bold for energetic)
- letterSpacing: -0.05em to 0.15em (tight for energy, loose for calm)
- textTransform: "none" or "uppercase" (uppercase for bold/active times)
- animation: "none", "pulse", "float", "breathe", "shimmer" (gentle opacity changes only)

Morning = awakening colors (soft oranges, yellows, light bg), serif or clean sans fonts
Midday = vibrant colors (bright blues, energetic), bold mono or sans fonts
Evening = calming colors (deep purples, blues, warm darks), elegant serif fonts

Keep your text response warm, encouraging, and derpy/playful in tone. Be concise and human.

Notes:
${notesText}

Respond in JSON format:
{
  "theme": "...",
  "insight": "...",
  "objective": "...",
  "styles": {
    "backgroundColor": "#...",
    "textColor": "#...",
    "accentColor": "#...",
    "fontFamily": "Inter|Space Mono|Playfair Display|Courier Prime",
    "fontWeight": "...",
    "letterSpacing": "...",
    "textTransform": "...",
    "animation": "..."
  }
}`;

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract the text content from the response
      const textContent = message.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      // Parse the JSON response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const reflection: ReflectionSummary = JSON.parse(jsonMatch[0]);

      // Cache the result
      this.cache = {
        data: reflection,
        timestamp: Date.now(),
      };

      return reflection;
    } catch (error: any) {
      console.error('Error generating reflection:', error);
      throw new Error(`Failed to generate reflection: ${error.message}`);
    }
  }
}
