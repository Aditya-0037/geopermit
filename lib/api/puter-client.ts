/**
 * Puter.js Client for Free Claude API
 * Uses user-pays model - no API keys required!
 * https://developer.puter.com/tutorials/free-unlimited-claude-35-sonnet-api/
 */

import { puter } from '@heyputer/puter.js';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Available Claude models via Puter.js
 */
export const CLAUDE_MODELS = {
  FABLE_5: 'claude-fable-5',
  OPUS_4_8: 'claude-opus-4-8',
  OPUS_4_7: 'claude-opus-4-7',
  SONNET_4_6: 'claude-sonnet-4-6',
  HAIKU_4_5: 'claude-haiku-4-5',
} as const;

/**
 * Generate text using Claude via Puter.js
 * No API key required - users cover their own usage
 */
export async function generateWithClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    model = CLAUDE_MODELS.SONNET_4_6,
    temperature,
    max_tokens,
  } = options;

  try {
    const response = await puter.ai.chat(prompt, {
      model,
      temperature,
      max_tokens,
    });

    const chatRes = response as any;
    return chatRes.message?.content?.[0]?.text || chatRes.message?.content || "";
  } catch (error) {
    console.error('Puter.js Claude API error:', error);
    throw new Error('Failed to generate response from Claude');
  }
}

/**
 * Stream responses from Claude (for long-form content)
 */
export async function* streamClaude(
  prompt: string,
  options: ClaudeOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = CLAUDE_MODELS.SONNET_4_6,
    temperature,
    max_tokens,
  } = options;

  try {
    const response = await puter.ai.chat(prompt, {
      model,
      temperature,
      max_tokens,
      stream: true,
    });

    for await (const part of response) {
      if (part?.text) {
        yield part.text;
      }
    }
  } catch (error) {
    console.error('Puter.js Claude streaming error:', error);
    throw new Error('Failed to stream response from Claude');
  }
}

/**
 * Extract structured JSON from permit applications
 * Used for intake classification
 */
export async function extractPermitData(
  applicationText: string
): Promise<any> {
  const prompt = `You are a permit intake classifier for a municipal planning authority.
Given a permit application, extract:

1. applicant_name: full name
2. applicant_email: email address
3. applicant_phone: phone number (or null)
4. permit_type: one of [Residential, Commercial, Industrial, Mixed-Use, Demolition, Renovation, Utility]
5. site_address: full street address
6. site_description: brief description of proposed work
7. missing_docs: list of missing required documents

Return ONLY valid JSON. No preamble, no markdown fences.

Application:
${applicationText}`;

  const response = await generateWithClaude(prompt, {
    model: CLAUDE_MODELS.SONNET_4_6,
    max_tokens: 500,
  });

  try {
    return JSON.parse(response);
  } catch (error) {
    // Retry once with stricter prompt if JSON parse fails
    const retryPrompt = `${prompt}\n\nIMPORTANT: Return ONLY the JSON object, nothing else. Start with { and end with }`;
    const retryResponse = await generateWithClaude(retryPrompt, {
      model: CLAUDE_MODELS.SONNET_4_6,
      max_tokens: 500,
    });

    return JSON.parse(retryResponse);
  }
}

/**
 * Generate resolution decision based on case context
 */
export async function generateResolutionDecision(
  caseContext: any
): Promise<{
  ai_decision: 'AutoApprove' | 'EscalateHuman' | 'RequestDocuments';
  ai_confidence: number;
  ai_reasoning: string;
}> {
  const prompt = `You are a municipal permit case resolution advisor.
Analyze this permit case and decide how to route it.

Decision rules:
- If protected_area = true → ALWAYS return EscalateHuman
- If zone_conflict = true → ALWAYS return EscalateHuman
- If missing_docs is non-empty → return RequestDocuments
- If all clear and confidence > 0.90 → return AutoApprove
- When in doubt → return EscalateHuman

Case data:
${JSON.stringify(caseContext, null, 2)}

Return ONLY valid JSON:
{
  "ai_decision": "AutoApprove" | "EscalateHuman" | "RequestDocuments",
  "ai_confidence": 0.0-1.0,
  "ai_reasoning": "Plain English explanation, max 3 sentences."
}`;

  const response = await generateWithClaude(prompt, {
    model: CLAUDE_MODELS.SONNET_4_6,
    max_tokens: 300,
  });

  return JSON.parse(response);
}
