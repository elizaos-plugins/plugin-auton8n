import { Action, IAgentRuntime, Memory, State, HandlerCallback, Content } from '@elizaos/core';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export const getCurrentTimeAction: Action = {
  name: 'getCurrentTime',
  description: 'Get the current time in a specified timezone',
  similes: ['time', 'clock', 'what time is it', 'current time', 'time now'],
  examples: [
    [
      {
        name: 'user',
        content: {
          text: 'What time is it in New York?',
        },
      },
      {
        name: 'agent',
        content: {
          text: 'The current time in New York (America/New_York) is 2024-03-14 10:30:45',
        },
      },
    ],
    [
      {
        name: 'user',
        content: {
          text: "What's the current time?",
        },
      },
      {
        name: 'agent',
        content: {
          text: 'The current time is 2024-03-14 14:30:45 (UTC)',
        },
      },
    ],
  ],

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    const text = message.content?.text?.toLowerCase() || '';
    return text.includes('time') || text.includes('clock');
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

      // Extract timezone from message if present
      let timezone = 'UTC';

      // Try to map common city names to timezones first
      const cityToTimezone: Record<string, string> = {
        'new york': 'America/New_York',
        newyork: 'America/New_York',
        ny: 'America/New_York',
        'los angeles': 'America/Los_Angeles',
        la: 'America/Los_Angeles',
        chicago: 'America/Chicago',
        london: 'Europe/London',
        paris: 'Europe/Paris',
        tokyo: 'Asia/Tokyo',
        sydney: 'Australia/Sydney',
        beijing: 'Asia/Shanghai',
        moscow: 'Europe/Moscow',
        dubai: 'Asia/Dubai',
      };

      // Check for city names in the text
      const lowerText = text.toLowerCase();
      for (const [city, tz] of Object.entries(cityToTimezone)) {
        if (lowerText.includes(city)) {
          timezone = tz;
          break;
        }
      }

      // If no city found, try to extract timezone format (e.g., America/New_York)
      if (timezone === 'UTC') {
        const timezoneMatch = text.match(/(?:in|at|timezone:?)\s+([A-Za-z_]+\/[A-Za-z_]+)/i);
        if (timezoneMatch) {
          timezone = timezoneMatch[1];
        }
      }

      // Get current time
      let timeString: string;
      let timezoneInfo = '';

      try {
        const now = dayjs();
        if (timezone !== 'UTC') {
          timeString = now.tz(timezone).format('YYYY-MM-DD HH:mm:ss');
          timezoneInfo = ` (${timezone})`;
        } else {
          timeString = now.utc().format('YYYY-MM-DD HH:mm:ss');
          timezoneInfo = ' (UTC)';
        }
      } catch (error) {
        // Fallback to UTC if timezone is invalid
        const now = dayjs();
        timeString = now.utc().format('YYYY-MM-DD HH:mm:ss');
        timezoneInfo = ' (UTC)';
        timezone = 'UTC'; // Update timezone to reflect fallback
      }

      const responseText = `The current time is ${timeString}${timezoneInfo}`;

      if (callback) {
        callback({
          text: responseText,
          action: 'getCurrentTime',
          metadata: {
            timezone,
            timestamp: timeString,
          },
        } as Content);
      }

      return {
        text: responseText,
        success: true,
        data: {
          time: timeString,
          timezone,
        },
      };
    } catch (error) {
      const errorMessage = `Error getting current time: ${error.message}`;
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
