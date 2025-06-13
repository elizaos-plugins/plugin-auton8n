import { Provider, IAgentRuntime, Memory, State } from '@elizaos/core';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import dayOfYear from 'dayjs/plugin/dayOfYear';

// Extend dayjs with needed plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(dayOfYear);

export const timeProvider: Provider = {
  name: 'timeProvider',
  description: 'Provides current time and timezone context information',

  get: async (runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<any> => {
    try {
      // Get current time in various formats
      const now = dayjs();
      const utcTime = now.utc();

      // Get user's timezone from runtime settings or default to UTC
      const requestedTimezone = runtime.getSetting('USER_TIMEZONE') || 'UTC';
      let localTime;
      let actualTimezone = requestedTimezone;

      try {
        localTime = requestedTimezone !== 'UTC' ? now.tz(requestedTimezone) : utcTime;
      } catch (tzError) {
        // Fall back to UTC if timezone is invalid
        console.warn(`Invalid timezone: ${requestedTimezone}, falling back to UTC`);
        localTime = utcTime;
        actualTimezone = 'UTC';
      }

      // Calculate UTC offset
      const utcOffset = localTime.utcOffset() / 60; // Convert minutes to hours

      // Prepare time data
      const timeData = {
        currentTime: localTime.format('YYYY-MM-DD HH:mm:ss'),
        currentTimeISO: localTime.toISOString(),
        utcTime: utcTime.format('YYYY-MM-DD HH:mm:ss'),
        timezone: actualTimezone,
        utcOffset: utcOffset,
        dayOfWeek: localTime.format('dddd'),
        date: localTime.format('MMMM D, YYYY'),
        time12Hour: localTime.format('h:mm A'),
        time24Hour: localTime.format('HH:mm'),
        unix: localTime.unix(),
        weekNumber: localTime.week(),
        dayOfYear: localTime.dayOfYear(),
      };

      // Create formatted output
      const output = `
Current Time Information
=======================
UTC Time: ${utcTime.format('YYYY-MM-DD HH:mm:ss')}
Local Time: ${localTime.format('YYYY-MM-DD HH:mm:ss')} (${actualTimezone})
Unix Timestamp: ${localTime.unix() * 1000}
ISO 8601: ${localTime.toISOString()}
Day of Week: ${localTime.format('dddd')}
Week of Year: ${localTime.week()}
Day of Year: ${localTime.dayOfYear()}

Common Timezones:
- New York: ${now.tz('America/New_York').format('YYYY-MM-DD HH:mm:ss')}
- London: ${now.tz('Europe/London').format('YYYY-MM-DD HH:mm:ss')}
- Tokyo: ${now.tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss')}
- Sydney: ${now.tz('Australia/Sydney').format('YYYY-MM-DD HH:mm:ss')}
      `.trim();

      return {
        text: output,
        data: timeData,
      };
    } catch (error) {
      console.error('Error in timeProvider:', error);
      return {
        text: 'Unable to provide time information',
      };
    }
  },
};
