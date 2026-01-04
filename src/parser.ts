export interface ParsedNote {
  timestamp: string; // Original timestamp string
  date: string; // ISO date (YYYY-MM-DD)
  content: string; // Note content
  rawText: string; // Original raw text for this entry
}

export interface ParsedNotesResult {
  notesByDay: Map<string, ParsedNote[]>; // Grouped by date
  allNotes: ParsedNote[];
}

/**
 * Parse raw notes text and extract timestamps and content
 */
export function parseNotes(rawText: string): ParsedNotesResult {
  const lines = rawText.split('\n');
  const allNotes: ParsedNote[] = [];
  let currentTimestamp: string | null = null;
  let currentContent: string[] = [];
  let currentRawText: string[] = [];

  // Regex patterns for different timestamp formats
  const timestampPatterns = [
    // Format: 2025.12.13.1102.GMT-0800
    /^(\d{4})\.(\d{2})\.(\d{2})\.(\d{2})\.?(\d{2})?\.?(GMT[+-]\d{4})?$/,
    // Format: 2025.12.15.20.39
    /^(\d{4})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})$/,
    // Format: 2025.12.26.21:51:13 -0500 (with colons and timezone)
    /^(\d{4})\.(\d{2})\.(\d{1,3})\.(\d{2}):(\d{2}):(\d{2})\s*[+-]?\d{4}$/,
    // Format: 2025.12.26.21:51:13 (with colons, no timezone)
    /^(\d{4})\.(\d{2})\.(\d{1,3})\.(\d{2}):(\d{2}):(\d{2})$/,
    // Format: 2025.12.17 or 2025.12.17.1225.GMT-0700
    /^(\d{4})\.(\d{2})\.(\d{1,3})/,
    // Format: 2026.01 (just year and month)
    /^(\d{4})\.(\d{2})$/,
  ];

  function isTimestamp(line: string): boolean {
    const trimmed = line.trim();
    return timestampPatterns.some(pattern => pattern.test(trimmed));
  }

  function parseTimestampToDate(timestamp: string): string {
    // Try to extract YYYY.MM.DD from any format
    let match = timestamp.match(/^(\d{4})\.(\d{2})\.(\d{1,3})/);
    if (match) {
      let [, year, month, day] = match;

      // Handle invalid day values (e.g., 361 -> 26, 99 -> 09)
      let dayNum = parseInt(day, 10);
      if (dayNum > 31) {
        // If 3 digits, likely a typo - take last 2 digits
        day = day.slice(-2);
        dayNum = parseInt(day, 10);
      }

      // Ensure day is valid (1-31)
      if (dayNum < 1) dayNum = 1;
      if (dayNum > 31) dayNum = 31;
      day = dayNum.toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    // Try YYYY.MM format (no day)
    match = timestamp.match(/^(\d{4})\.(\d{2})$/);
    if (match) {
      const [, year, month] = match;
      return `${year}-${month}-01`; // Default to first day of month
    }

    // Fallback to current date
    return new Date().toISOString().split('T')[0];
  }

  function saveCurrentNote() {
    if (currentTimestamp && currentContent.length > 0) {
      const content = currentContent.join('\n').trim();
      const rawText = currentRawText.join('\n').trim();

      if (content) {
        allNotes.push({
          timestamp: currentTimestamp,
          date: parseTimestampToDate(currentTimestamp),
          content,
          rawText,
        });
      }
    }
  }

  // Parse line by line
  for (const line of lines) {
    const trimmedLine = line.trim();

    if (isTimestamp(trimmedLine)) {
      // Save previous note
      saveCurrentNote();

      // Start new note
      currentTimestamp = trimmedLine;
      currentContent = [];
      currentRawText = [trimmedLine];
    } else if (currentTimestamp) {
      // Add to current note content
      if (trimmedLine) {
        currentContent.push(line);
      }
      currentRawText.push(line);
    }
    // Ignore lines before the first timestamp
  }

  // Save the last note
  saveCurrentNote();

  // Group notes by day
  const notesByDay = new Map<string, ParsedNote[]>();
  for (const note of allNotes) {
    const existing = notesByDay.get(note.date) || [];
    existing.push(note);
    notesByDay.set(note.date, existing);
  }

  return {
    notesByDay,
    allNotes,
  };
}

/**
 * Format notes for display/debugging
 */
export function formatParsedNotes(result: ParsedNotesResult): string {
  let output = '';

  output += `Total notes parsed: ${result.allNotes.length}\n`;
  output += `Days with notes: ${result.notesByDay.size}\n\n`;

  for (const [date, notes] of result.notesByDay.entries()) {
    output += `📅 ${date} (${notes.length} note${notes.length > 1 ? 's' : ''})\n`;
    output += '─'.repeat(50) + '\n';

    for (const note of notes) {
      output += `  ⏰ ${note.timestamp}\n`;
      output += `  ${note.content.split('\n').join('\n  ')}\n\n`;
    }
  }

  return output;
}
