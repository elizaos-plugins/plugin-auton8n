import { Plugin } from '@elizaos/core';
import { getCurrentTimeAction } from './actions/getCurrentTime';
import { convertTimeAction } from './actions/convertTime';
import { timeProvider } from './providers/timeProvider';

export const timePlugin: Plugin = {
  name: '@elizaos/plugin-time',
  description: 'Provides current time and timezone information',
  actions: [getCurrentTimeAction, convertTimeAction],
  providers: [timeProvider],
  evaluators: [],
  services: [],
};

export default timePlugin;

// Export individual components for flexibility
export { getCurrentTimeAction } from './actions/getCurrentTime';
export { convertTimeAction } from './actions/convertTime';
export { timeProvider } from './providers/timeProvider';
