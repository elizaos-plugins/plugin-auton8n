import { Action, IAgentRuntime, Memory, State, HandlerCallback, Content } from '@elizaos/core';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with needed plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const convertTimeAction: Action = {
  name: 'convertTime',
  description: 'Convert time between different timezones',
  similes: ['convert time', 'time conversion', 'what time', 'timezone conversion'],
  examples: [
    [
      {
        name: 'user',
        content: {
          text: 'What time is 3pm EST in Tokyo?',
        },
      },
      {
        name: 'agent',
        content: {
          text: '3:00 PM EST is 5:00 AM (next day) in Tokyo (Asia/Tokyo)',
        },
      },
    ],
    [
      {
        name: 'user',
        content: {
          text: 'Convert 10:30 AM PST to London time',
        },
      },
      {
        name: 'agent',
        content: {
          text: '10:30 AM PST is 6:30 PM in London (Europe/London)',
        },
      },
    ],
  ],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    // Check for conversion patterns
    return (
      (text.includes('convert') && (text.includes('time') || /\d/.test(text))) ||
      (text.includes('what time') && text.includes('in')) ||
      (/\d+(?::?\d+)?\s*(?:am|pm)/.test(text) && (text.includes('in') || text.includes('to')))
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ): Promise<any> => {
    try {
      const text = message.content?.text || '';

      // Parse time and timezones from the message
      const parseResult = parseTimeConversionRequest(text);

      if (!parseResult) {
        throw new Error(
          'Could not parse time conversion request. Please specify time and timezones.'
        );
      }

      const { time, fromTimezone, toTimezone } = parseResult;

      // Create dayjs object with the time in the source timezone
      const sourceTime = dayjs.tz(time, fromTimezone);

      // Convert to target timezone
      const targetTime = sourceTime.tz(toTimezone);

      // Format the result
      const sourceFormatted = sourceTime.format('h:mm A');
      const targetFormatted = targetTime.format('h:mm A');

      // Check if dates are different
      const sourceDate = sourceTime.format('YYYY-MM-DD');
      const targetDate = targetTime.format('YYYY-MM-DD');

      let responseText = `${sourceFormatted} ${fromTimezone} is ${targetFormatted}`;

      if (sourceDate !== targetDate) {
        // Compare the actual dates to determine next/previous
        if (targetDate > sourceDate) {
          responseText += ` (next day)`;
        } else {
          responseText += ` (previous day)`;
        }
      }

      responseText += ` in ${toTimezone}`;

      if (callback) {
        callback({
          text: responseText,
          action: 'convertTime',
          metadata: {
            sourceTime: sourceTime.format(),
            targetTime: targetTime.format(),
            fromTimezone,
            toTimezone,
          },
        } as Content);
      }

      return {
        text: responseText,
        success: true,
        data: {
          sourceTime: sourceTime.format(),
          targetTime: targetTime.format(),
          fromTimezone,
          toTimezone,
        },
      };
    } catch (error) {
      const errorMessage = `Error converting time: ${error.message}`;
      if (callback) {
        callback({
          text: errorMessage,
          error: true,
        } as Content);
      }
      return {
        text: errorMessage,
        success: false,
        error: error.message,
      };
    }
  },
};

function parseTimeConversionRequest(text: string): {
  time: string;
  fromTimezone: string;
  toTimezone: string;
} | null {
  // Common timezone abbreviations and their IANA equivalents
  const timezoneMap: Record<string, string> = {
    est: 'America/New_York',
    eastern: 'America/New_York',
    edt: 'America/New_York',
    cst: 'America/Chicago',
    central: 'America/Chicago',
    cdt: 'America/Chicago',
    mst: 'America/Denver',
    mountain: 'America/Denver',
    mdt: 'America/Denver',
    pst: 'America/Los_Angeles',
    pacific: 'America/Los_Angeles',
    pdt: 'America/Los_Angeles',
    gmt: 'Europe/London',
    bst: 'Europe/London',
    london: 'Europe/London',
    paris: 'Europe/Paris',
    tokyo: 'Asia/Tokyo',
    jst: 'Asia/Tokyo',
    sydney: 'Australia/Sydney',
    beijing: 'Asia/Shanghai',
    shanghai: 'Asia/Shanghai',
    moscow: 'Europe/Moscow',
    dubai: 'Asia/Dubai',
  };

  const normalizedText = text.toLowerCase();

  // Try to extract time patterns - use original text to preserve case
  const timePattern = /(\d{1,2}:?\d{0,2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))/i;
  const timeMatch = text.match(timePattern);

  if (!timeMatch) {
    return null;
  }

  let timeStr = timeMatch[1];
  // Normalize time format - preserve AM/PM case
  if (!timeStr.includes(':')) {
    timeStr = timeStr.replace(/(\d{1,2})\s*(am|pm)/i, '$1:00 $2');
  }

  // Ensure proper spacing
  timeStr = timeStr.replace(/(\d)([ap]m)/i, '$1 $2');

  // Extract source and target timezones
  let fromTimezone = '';
  let toTimezone = '';

  // Look for pattern: "time TZ in/to TZ"
  // First, find all timezone mentions
  const foundTimezones: { tz: string; pos: number; word: string }[] = [];

  for (const [key, value] of Object.entries(timezoneMap)) {
    const index = normalizedText.indexOf(key);
    if (index !== -1) {
      foundTimezones.push({ tz: value, pos: index, word: key });
    }
  }

  // Sort by position
  foundTimezones.sort((a, b) => a.pos - b.pos);

  // Find the position of "in" or "to"
  const inIndex = Math.max(normalizedText.indexOf(' in '), normalizedText.indexOf(' to '));

  if (foundTimezones.length >= 2) {
    // If we have two timezones, first is source, second is target
    fromTimezone = foundTimezones[0].tz;
    toTimezone = foundTimezones[1].tz;
  } else if (foundTimezones.length === 1) {
    // If we only have one timezone, determine if it's source or target based on position relative to "in/to"
    if (inIndex > -1 && foundTimezones[0].pos > inIndex) {
      // Timezone appears after "in/to", so it's the target
      toTimezone = foundTimezones[0].tz;
      fromTimezone = 'UTC';
    } else {
      // Timezone appears before "in/to" or no "in/to" found, so it's the source
      fromTimezone = foundTimezones[0].tz;
      toTimezone = 'UTC';
    }
  } else {
    // No timezones found, use defaults
    fromTimezone = 'UTC';
    toTimezone = 'UTC';
  }

  // If we have a time in AM/PM format, parse it properly
  const now = dayjs();

  // Determine the right format based on the AM/PM case
  let parsedTime;
  const hasUpperAMPM = /[AP]M/i.test(timeStr) && timeStr !== timeStr.toLowerCase();

  if (hasUpperAMPM) {
    // Use uppercase format for uppercase AM/PM
    parsedTime = dayjs(`${now.format('YYYY-MM-DD')} ${timeStr}`, 'YYYY-MM-DD h:mm A');
  } else {
    // Use lowercase format for lowercase am/pm
    parsedTime = dayjs(`${now.format('YYYY-MM-DD')} ${timeStr}`, 'YYYY-MM-DD h:mm a');
  }

  if (!parsedTime.isValid()) {
    // Try without space between time and am/pm
    parsedTime = dayjs(
      `${now.format('YYYY-MM-DD')} ${timeStr}`,
      hasUpperAMPM ? 'YYYY-MM-DD h:mmA' : 'YYYY-MM-DD h:mma'
    );
  }

  if (!parsedTime.isValid()) {
    // Try 24-hour format as fallback
    parsedTime = dayjs(`${now.format('YYYY-MM-DD')} ${timeStr}`, 'YYYY-MM-DD HH:mm');
  }

  if (!parsedTime.isValid()) {
    return null;
  }

  return {
    time: parsedTime.format('YYYY-MM-DD HH:mm:ss'),
    fromTimezone,
    toTimezone,
  };
}
