/**
 * Anthropic Service
 * Provides Anthropic Claude client initialization and common AI operations
 */

import Anthropic from '@anthropic-ai/sdk';
import { aiConfig } from '../../config/ai.js';

let anthropicClient: Anthropic | null = null;

/**
 * Get the Anthropic client instance (singleton)
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!aiConfig.anthropic.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    anthropicClient = new Anthropic({
      apiKey: aiConfig.anthropic.apiKey,
    });
  }

  return anthropicClient;
}

/**
 * Check if Anthropic is configured
 */
export function isAnthropicConfigured(): boolean {
  return !!aiConfig.anthropic.apiKey;
}

/**
 * Generate a chat completion using Anthropic Claude
 */
export async function generateCompletion(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: options?.model || aiConfig.anthropic.model,
    max_tokens: options?.maxTokens || aiConfig.anthropic.maxTokens,
    temperature: options?.temperature ?? aiConfig.anthropic.temperature,
    system: options?.systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  // Extract text from content blocks
  const textContent = response.content.find(block => block.type === 'text');
  return textContent?.type === 'text' ? textContent.text : '';
}

/**
 * Generate a chat completion with JSON response
 * Note: Anthropic doesn't have a native JSON mode, so we instruct it in the prompt
 */
export async function generateJsonCompletion<T>(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<T> {
  // Add JSON instruction to system prompt
  const jsonSystemPrompt = options?.systemPrompt
    ? `${options.systemPrompt}\n\nIMPORTANT: You must respond with valid JSON only. No markdown, no explanations, just the JSON object.`
    : 'You must respond with valid JSON only. No markdown, no explanations, just the JSON object.';

  const content = await generateCompletion(messages, {
    ...options,
    systemPrompt: jsonSystemPrompt,
  });

  try {
    // Try to extract JSON from potential markdown code blocks
    let jsonString = content.trim();

    // Remove markdown code blocks if present
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.slice(0, -3);
    }

    return JSON.parse(jsonString.trim()) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${content}`);
  }
}

export default {
  getAnthropicClient,
  isAnthropicConfigured,
  generateCompletion,
  generateJsonCompletion,
};
