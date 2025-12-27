import { parseNotes, formatParsedNotes } from './parser';
import fs from 'fs';
import path from 'path';

// Sample notes based on your format
const sampleNotes = `
2025.12.13.1102.GMT-0800
I think using apple notes as scratchpad is better
Then archive it into notion as a data store if needed as a nice archive…
Then I can flush this note if needed. Copy and paste it all into an archive?


2025.12.13.2357.GMT-0800
Yes, this is the way


2025.12.14.1829.GMT-0800
2025.12.13.gas-station-jerky-incident-compressed


2025.12.15.1101.GMT-0700
All team chat
- Getting stuff back from Austin
- Can someone book me a flight back? Airbnb for Austin?
- 14 Kern Ramble St, Austin, TX 78722
- Summer Sesame Street call Tue
- 2-3p
- Zilker Park fairy lights

I was very clear Coy has a specific schedule and mine has flexibility.


2025.12.15.2213.GMT-0700
Can we keep it streaming
YouTube Live Stream
Spark's Dropbox Folder
Put it his instagram + tiktok


2025.12.17
153 code
`;

function testParser() {
  console.log('🧪 Testing Note Parser\n');
  console.log('='.repeat(60));
  console.log('INPUT:');
  console.log('='.repeat(60));
  console.log(sampleNotes);
  console.log('\n' + '='.repeat(60));
  console.log('PARSED OUTPUT:');
  console.log('='.repeat(60) + '\n');

  const result = parseNotes(sampleNotes);
  const formatted = formatParsedNotes(result);

  console.log(formatted);

  console.log('='.repeat(60));
  console.log('JSON OUTPUT (for debugging):');
  console.log('='.repeat(60));
  console.log(JSON.stringify(result.allNotes, null, 2));
}

testParser();
