/**
 * Test scenarios for n8n plugin e2e testing
 * Each scenario includes conversation scripts and expected behaviors
 */

export interface TestScenario {
  id: string;
  name: string;
  pattern: string;
  description: string;
  conversation: ConversationTurn[];
  expectedWorkflow?: any;
  requiredEnvVars: string[];
  validateResult: (result: any) => boolean;
}

export interface ConversationTurn {
  speaker: 'user' | 'agent' | 'system';
  message: string;
  expectedAction?: string;
  providedCredentials?: Record<string, string>;
}

export const testScenarios: TestScenario[] = [
  // Pattern 1: Cached Provider
  {
    id: 'weather-provider',
    name: 'Weather Data Provider',
    pattern: 'cached-provider',
    description: 'Tests cached weather data provider with 5-minute TTL',
    requiredEnvVars: ['TEST_N8N_API_KEY', 'TEST_OPENWEATHER_API_KEY'],
    conversation: [
      {
        speaker: 'user',
        message: "What's the weather like in New York?",
      },
      {
        speaker: 'agent',
        message: "I'll check the weather in New York for you. Let me set up the weather service.",
        expectedAction: 'generate-workflow',
      },
      {
        speaker: 'system',
        message: 'The workflow requires OpenWeather API credentials. Please provide your API key.',
        expectedAction: 'request-credentials',
      },
      {
        speaker: 'user',
        message: "Here's my API key: {{TEST_OPENWEATHER_API_KEY}}",
        providedCredentials: { OPENWEATHER_API_KEY: 'TEST_OPENWEATHER_API_KEY' },
      },
      {
        speaker: 'agent',
        message:
          'The current weather in New York is sunny with a temperature of 72°F (22°C). The forecast shows clear skies for the rest of the day.',
        expectedAction: 'execute-workflow',
      },
    ],
    validateResult: (result) => {
      return result.text.includes('weather') && result.text.includes('New York');
    },
  },

  {
    id: 'stock-provider',
    name: 'Stock Price Provider',
    pattern: 'cached-provider',
    description: 'Tests cached stock price provider with 1-minute TTL',
    requiredEnvVars: ['TEST_N8N_API_KEY', 'TEST_ALPHA_VANTAGE_API_KEY'],
    conversation: [
      {
        speaker: 'user',
        message: "What's the current price of AAPL stock?",
      },
      {
        speaker: 'agent',
        message: "I'll fetch the current AAPL stock price for you.",
        expectedAction: 'generate-workflow',
      },
      {
        speaker: 'system',
        message:
          'The workflow requires Alpha Vantage API credentials. Please provide your API key.',
        expectedAction: 'request-credentials',
      },
      {
        speaker: 'user',
        message: '{{TEST_ALPHA_VANTAGE_API_KEY}}',
        providedCredentials: { ALPHA_VANTAGE_API_KEY: 'TEST_ALPHA_VANTAGE_API_KEY' },
      },
      {
        speaker: 'agent',
        message: "AAPL is currently trading at $178.45, up 1.2% from yesterday's close.",
        expectedAction: 'execute-workflow',
      },
    ],
    validateResult: (result) => {
      return result.text.includes('AAPL') && result.text.includes('$');
    },
  },

  // Pattern 2: Dynamic Provider
  {
    id: 'search-provider',
    name: 'Search Provider',
    pattern: 'dynamic-provider',
    description: 'Tests real-time search provider without caching',
    requiredEnvVars: ['TEST_N8N_API_KEY', 'TEST_GOOGLE_API_KEY'],
    conversation: [
      {
        speaker: 'user',
        message: 'Search for the latest news about artificial intelligence',
      },
      {
        speaker: 'agent',
        message: "I'll search for the latest AI news for you.",
        expectedAction: 'generate-workflow',
      },
      {
        speaker: 'agent',
        message: 'Here are the latest AI news stories: [search results would appear here]',
        expectedAction: 'execute-workflow',
      },
    ],
    validateResult: (result) => {
      return result.text.includes('AI') || result.text.includes('artificial intelligence');
    },
  },

  {
    id: 'translation-provider',
    name: 'Translation Provider',
    pattern: 'dynamic-provider',
    description: 'Tests parameterized translation provider',
    requiredEnvVars: ['TEST_N8N_API_KEY', 'TEST_DEEPL_API_KEY'],
    conversation: [
      {
        speaker: 'user',
        message: 'Translate "Hello, how are you?" to Spanish',
      },
      {
        speaker: 'agent',
        message: "I'll translate that to Spanish for you.",
        expectedAction: 'generate-workflow',
      },
      {
        speaker: 'system',
        message: 'The workflow requires DeepL API credentials.',
        expectedAction: 'request-credentials',
      },
      {
        speaker: 'user',
        message: '{{TEST_DEEPL_API_KEY}}',
        providedCredentials: { DEEPL_API_KEY: 'TEST_DEEPL_API_KEY' },
      },
      {
        speaker: 'agent',
        message: 'The Spanish translation is: "Hola, ¿cómo estás?"',
        expectedAction: 'execute-workflow',
      },
    ],
    validateResult: (result) => {
      return result.text.includes('Hola') && result.text.includes('cómo estás');
    },
  },

  // Pattern 3: Sync Action
  {
    id: 'send-email-action',
    name: 'Send Email Action',
    pattern: 'sync-action',
    description: 'Tests synchronous email sending action',
    requiredEnvVars: ['TEST_N8N_API_KEY', 'TEST_SMTP_HOST', 'TEST_SMTP_USER', 'TEST_SMTP_PASS'],
    conversation: [
      {
        speaker: 'user',
        message:
          'Send an email to john@example.com with subject "Meeting Tomorrow" and body "Let\'s meet at 2 PM"',
      },
      {
        speaker: 'agent',
        message: "I'll send that email for you.",
        expectedAction: 'generate-workflow',
      },
      {
        speaker: 'system',
        message: 'The workflow requires SMTP credentials.',
        expectedAction: 'request-credentials',
      },
      {
        speaker: 'user',
        message:
          'SMTP server: {{TEST_SMTP_HOST}}, username: {{TEST_SMTP_USER}}, password: {{TEST_SMTP_PASS}}',
        providedCredentials: {
          SMTP_HOST: 'TEST_SMTP_HOST',
          SMTP_USER: 'TEST_SMTP_USER',
          SMTP_PASS: 'TEST_SMTP_PASS',
        },
      },
      {
        speaker: 'agent',
        message: 'Email sent successfully to john@example.com with subject "Meeting Tomorrow".',
        expectedAction: 'execute-workflow',
      },
    ],
    validateResult: (result) => {
      return result.text.includes('sent successfully') && result.text.includes('john@example.com');
    },
  },

  {
    id: 'create-task-action',
    name: 'Create Task Action',
    pattern: 'sync-action',
    description: 'Tests task creation in project management tool',
    requiredEnvVars: ['TEST_N8N_API_KEY', 'TEST_TODOIST_API_KEY'],
    conversation: [
      {
        speaker: 'user',
        message: 'Create a task "Review Q4 reports" due tomorrow in my Work project',
      },
      {
        speaker: 'agent',
        message: "I'll create that task in your Work project.",
        expectedAction: 'generate-workflow',
      },
      {
        speaker: 'agent',
        message: 'Task "Review Q4 reports" has been created in your Work project, due tomorrow.',
        expectedAction: 'execute-workflow',
      },
    ],
    validateResult: (result) => {
      return result.text.includes('task') && result.text.includes('created');
    },
  },

  // Pattern 4: Async Action
  {
    id: 'generate-report-action',
    name: 'Generate Report Action',
    pattern: 'async-action',
    description: 'Tests long-running report generation',
    requiredEnvVars: ['TEST_N8N_API_KEY', 'TEST_DATABASE_URL'],
    conversation: [
      {
        speaker: 'user',
        message: 'Generate a comprehensive sales report for Q4 2024',
      },
      {
        speaker: 'agent',
        message: "I'll start generating the Q4 2024 sales report. This may take a few minutes.",
        expectedAction: 'generate-workflow',
      },
      {
        speaker: 'agent',
        message:
          "The report generation has started. I'll notify you when it's complete. The job ID is RPT-2024-Q4-001.",
        expectedAction: 'execute-workflow-async',
      },
      {
        speaker: 'user',
        message: 'Is the report ready?',
      },
      {
        speaker: 'agent',
        message:
          'Yes, the Q4 2024 sales report is complete. You can download it from: [report URL]',
        expectedAction: 'check-workflow-status',
      },
    ],
    validateResult: (result) => {
      return (
        result.text.includes('report') &&
        (result.text.includes('started') || result.text.includes('complete'))
      );
    },
  },

  // Pattern 5: Trigger Pattern
  {
    id: 'webhook-trigger',
    name: 'Webhook Trigger',
    pattern: 'trigger',
    description: 'Tests webhook trigger for customer support',
    requiredEnvVars: ['TEST_N8N_API_KEY', 'TEST_WEBHOOK_URL'],
    conversation: [
      {
        speaker: 'user',
        message: 'Set up a webhook to handle customer support tickets',
      },
      {
        speaker: 'agent',
        message: "I'll set up a webhook trigger for customer support tickets.",
        expectedAction: 'generate-workflow',
      },
      {
        speaker: 'agent',
        message:
          "Webhook created at {{TEST_WEBHOOK_URL}}/support-tickets. When tickets are received, I'll process them automatically.",
        expectedAction: 'deploy-trigger',
      },
      {
        speaker: 'system',
        message: 'Webhook received: New support ticket #1234 from customer@example.com',
        expectedAction: 'trigger-fired',
      },
      {
        speaker: 'agent',
        message: "I've received support ticket #1234. I'll create a response workflow.",
        expectedAction: 'handle-trigger',
      },
    ],
    validateResult: (result) => {
      return result.text.includes('webhook') || result.text.includes('ticket');
    },
  },

  // Pattern 6: AI Workflow Generation
  {
    id: 'ai-workflow-generation',
    name: 'AI Workflow Generation',
    pattern: 'ai-generation',
    description: 'Tests natural language to workflow generation',
    requiredEnvVars: ['TEST_N8N_API_KEY'],
    conversation: [
      {
        speaker: 'user',
        message:
          'Create a workflow that fetches data from an API, filters results where status is "active", transforms the data to include only name and email fields, and saves it to a Google Sheet',
      },
      {
        speaker: 'agent',
        message:
          "I'll create a multi-step workflow for you that:\n1. Fetches data from the API\n2. Filters for active status\n3. Transforms to keep only name and email\n4. Saves to Google Sheets",
        expectedAction: 'generate-complex-workflow',
      },
      {
        speaker: 'system',
        message: 'The workflow requires Google Sheets credentials.',
        expectedAction: 'request-credentials',
      },
      {
        speaker: 'user',
        message: 'Use my Google account: {{TEST_GOOGLE_OAUTH}}',
        providedCredentials: { GOOGLE_SHEETS_OAUTH: 'TEST_GOOGLE_OAUTH' },
      },
      {
        speaker: 'agent',
        message:
          'Workflow created and deployed successfully. It will:\n- Fetch data from the API endpoint\n- Filter records where status="active"\n- Extract name and email fields\n- Append results to your Google Sheet\n\nThe workflow ID is WF-API-SHEET-001.',
        expectedAction: 'deploy-workflow',
      },
    ],
    validateResult: (result) => {
      return result.text.includes('workflow') && result.text.includes('created');
    },
  },
];

// Helper function to get test credentials from environment
export function getTestCredential(envVar: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Test credential ${envVar} not found in environment`);
  }
  return value;
}

// Helper function to replace credential placeholders in messages
export function replaceCredentialPlaceholders(message: string): string {
  return message.replace(/\{\{(\w+)\}\}/g, (match, envVar) => {
    return getTestCredential(envVar);
  });
}
