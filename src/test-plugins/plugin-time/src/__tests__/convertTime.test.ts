import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { convertTimeAction } from '../actions/convertTime';
import { IAgentRuntime, Memory, State } from '@elizaos/core';

// Mock runtime
const createMockRuntime = (): IAgentRuntime => {
  return {
    getSetting: vi.fn(),
    services: new Map(),
    providers: new Map(),
    actions: new Map(),
    evaluators: new Map(),
  } as any;
};

// Mock memory
const createMockMemory = (text: string): Memory =>
  ({
    id: crypto.randomUUID() as any,
    content: { text },
    roomId: crypto.randomUUID() as any,
    agentId: crypto.randomUUID() as any,
    entityId: null as any,
    createdAt: Date.now(),
  }) as Memory;

describe('convertTimeAction', () => {
  let mockRuntime: IAgentRuntime;
  let mockState: State;

  beforeEach(() => {
    mockRuntime = createMockRuntime();
    mockState = { values: {}, data: {}, text: '' };
    vi.clearAllMocks();

    // Mock date to ensure consistent tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-14T15:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('validate', () => {
    it("should validate messages with 'convert' and 'time'", async () => {
      const message = createMockMemory('Convert 3pm EST to PST');
      const result = await convertTimeAction.validate(mockRuntime, message);
      expect(result).toBe(true);
    });

    it("should validate messages with 'what time' and 'in'", async () => {
      const message = createMockMemory('What time is 10am PST in London?');
      const result = await convertTimeAction.validate(mockRuntime, message);
      expect(result).toBe(true);
    });

    it('should not validate messages without conversion keywords', async () => {
      const message = createMockMemory('What time is it?');
      const result = await convertTimeAction.validate(mockRuntime, message);
      expect(result).toBe(false);
    });
  });

  describe('handler', () => {
    it('should convert time between timezones', async () => {
      const message = createMockMemory('What time is 3pm EST in Tokyo?');
      const result = (await convertTimeAction.handler(mockRuntime, message, mockState)) as any;

      expect(result.success).toBe(true);
      expect(result.text).toContain('3:00 PM');
      expect(result.text).toContain('Tokyo');
      expect(result.data.fromTimezone).toBe('America/New_York');
      expect(result.data.toTimezone).toBe('Asia/Tokyo');
    });

    it('should handle PST to London conversion', async () => {
      const message = createMockMemory('Convert 10:30 AM PST to London time');
      const result = (await convertTimeAction.handler(mockRuntime, message, mockState)) as any;

      expect(result.success).toBe(true);
      expect(result.text).toContain('10:30 AM');
      expect(result.text).toContain('London');
      expect(result.data.fromTimezone).toBe('America/Los_Angeles');
      expect(result.data.toTimezone).toBe('Europe/London');
    });

    it('should handle next day conversions', async () => {
      const message = createMockMemory('What time is 11pm EST in Sydney?');
      const result = (await convertTimeAction.handler(mockRuntime, message, mockState)) as any;

      expect(result.success).toBe(true);
      expect(result.text).toContain('(next day)');
      expect(result.data.fromTimezone).toBe('America/New_York');
      expect(result.data.toTimezone).toBe('Australia/Sydney');
    });

    it('should handle callback if provided', async () => {
      const message = createMockMemory('Convert 2pm GMT to Tokyo');
      const callback = vi.fn();

      await convertTimeAction.handler(mockRuntime, message, mockState, {}, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('2:00 PM'),
          action: 'convertTime',
          metadata: expect.objectContaining({
            fromTimezone: 'Europe/London',
            toTimezone: 'Asia/Tokyo',
          }),
        })
      );
    });

    it('should handle parse errors gracefully', async () => {
      const message = createMockMemory('Convert something to somewhere');
      const result = (await convertTimeAction.handler(mockRuntime, message, mockState)) as any;

      expect(result.success).toBe(false);
      expect(result.text).toContain('Error converting time');
      expect(result.text).toContain('Could not parse');
    });

    it('should handle time without colon format', async () => {
      const message = createMockMemory('Convert 3am EST to PST');
      const result = (await convertTimeAction.handler(mockRuntime, message, mockState)) as any;

      expect(result.success).toBe(true);
      expect(result.text).toContain('3:00 AM');
    });

    it('should handle various timezone abbreviations', async () => {
      const timezones = [
        { input: 'CST', expected: 'America/Chicago' },
        { input: 'MST', expected: 'America/Denver' },
        { input: 'GMT', expected: 'Europe/London' },
        { input: 'JST', expected: 'Asia/Tokyo' },
      ];

      for (const { input, expected } of timezones) {
        const message = createMockMemory(`Convert 12pm ${input} to UTC`);
        const result = (await convertTimeAction.handler(mockRuntime, message, mockState)) as any;

        expect(result.success).toBe(true);
        expect(result.data.fromTimezone).toBe(expected);
      }
    });
  });

  describe('examples', () => {
    it('should have properly formatted examples', () => {
      expect(convertTimeAction.examples).toBeDefined();
      expect(Array.isArray(convertTimeAction.examples)).toBe(true);
      expect(convertTimeAction.examples.length).toBeGreaterThan(0);

      // Check first example
      const firstExample = convertTimeAction.examples[0];
      expect(Array.isArray(firstExample)).toBe(true);
      expect(firstExample[0]).toHaveProperty('name', 'user');
      expect(firstExample[0].content.text).toContain('time');
      expect(firstExample[1]).toHaveProperty('name', 'agent');
    });
  });
});
