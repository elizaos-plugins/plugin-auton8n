import { describe, it, expect } from 'vitest';
import timePlugin from '../index';
import { Plugin } from '@elizaos/core';

describe('Time Plugin Integration', () => {
  it('should export a valid plugin', () => {
    expect(timePlugin).toBeDefined();
    expect(timePlugin.name).toBe('@elizaos/plugin-time');
    expect(timePlugin.description).toBe('Provides current time and timezone information');
  });

  it('should have all required plugin properties', () => {
    expect(timePlugin).toHaveProperty('name');
    expect(timePlugin).toHaveProperty('description');
    expect(timePlugin).toHaveProperty('actions');
    expect(timePlugin).toHaveProperty('providers');
    expect(timePlugin).toHaveProperty('evaluators');
    expect(timePlugin).toHaveProperty('services');
  });

  it('should include two actions', () => {
    expect(Array.isArray(timePlugin.actions)).toBe(true);
    expect(timePlugin.actions).toHaveLength(2);

    const actionNames = timePlugin.actions.map((action: any) => action.name);
    expect(actionNames).toContain('getCurrentTime');
    expect(actionNames).toContain('convertTime');
  });

  it('should include one provider', () => {
    expect(Array.isArray(timePlugin.providers)).toBe(true);
    expect(timePlugin.providers).toHaveLength(1);

    const provider = timePlugin.providers[0];
    expect(provider.name).toBe('timeProvider');
  });

  it('should have empty evaluators and services', () => {
    expect(Array.isArray(timePlugin.evaluators)).toBe(true);
    expect(timePlugin.evaluators).toHaveLength(0);

    expect(Array.isArray(timePlugin.services)).toBe(true);
    expect(timePlugin.services).toHaveLength(0);
  });

  it('should export individual components', async () => {
    const { getCurrentTimeAction, convertTimeAction, timeProvider } = await import('../index');

    expect(getCurrentTimeAction).toBeDefined();
    expect(getCurrentTimeAction.name).toBe('getCurrentTime');

    expect(convertTimeAction).toBeDefined();
    expect(convertTimeAction.name).toBe('convertTime');

    expect(timeProvider).toBeDefined();
    expect(timeProvider.name).toBe('timeProvider');
  });

  it('should be a valid Plugin type', () => {
    // This test ensures the plugin conforms to the Plugin interface
    const plugin: Plugin = timePlugin;
    expect(plugin).toBeDefined();
  });
});
