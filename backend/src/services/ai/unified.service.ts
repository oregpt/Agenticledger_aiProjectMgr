/**
 * Unified AI Service
 * Provides a single interface for AI operations that can switch between providers
 * Supports organization-specific settings from the database
 */

import { aiConfig, type AIProvider } from '../../config/ai.js';
import * as openaiService from './openai.service.js';
import * as anthropicService from './anthropic.service.js';
import * as settingsService from './settings.service.js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: AIProvider; // Override the default provider for this request
  organizationId?: number; // Use org-specific settings if provided
}

/**
 * Get the active provider (can be overridden per-request)
 */
export function getActiveProvider(override?: AIProvider): AIProvider {
  return override || aiConfig.provider;
}

/**
 * Check if the specified provider is configured
 */
export function isProviderConfigured(provider?: AIProvider): boolean {
  const activeProvider = getActiveProvider(provider);

  switch (activeProvider) {
    case 'openai':
      return openaiService.isOpenAIConfigured();
    case 'anthropic':
      return anthropicService.isAnthropicConfigured();
    default:
      return false;
  }
}

/**
 * Check if any AI provider is configured
 */
export function isAIConfigured(): boolean {
  return openaiService.isOpenAIConfigured() || anthropicService.isAnthropicConfigured();
}

/**
 * Generate a chat completion using the active provider
 * If organizationId is provided, uses org-specific settings from the database
 */
export async function generateCompletion(
  messages: ChatMessage[],
  options?: CompletionOptions
): Promise<string> {
  // If organizationId is provided, use database settings
  if (options?.organizationId) {
    return generateCompletionWithOrgSettings(messages, options);
  }

  // Otherwise use static config (env vars)
  const provider = getActiveProvider(options?.provider);

  switch (provider) {
    case 'openai': {
      if (!openaiService.isOpenAIConfigured()) {
        throw new Error('OpenAI is not configured');
      }
      return openaiService.generateCompletion(
        messages.map(m => ({ role: m.role, content: m.content })),
        {
          model: options?.model,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature,
        }
      );
    }

    case 'anthropic': {
      if (!anthropicService.isAnthropicConfigured()) {
        throw new Error('Anthropic is not configured');
      }
      // Anthropic uses a different message format - system is separate
      const systemMessage = messages.find(m => m.role === 'system');
      const nonSystemMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      return anthropicService.generateCompletion(nonSystemMessages, {
        model: options?.model,
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        systemPrompt: systemMessage?.content,
      });
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Internal: Generate completion using organization-specific settings from DB
 */
async function generateCompletionWithOrgSettings(
  messages: ChatMessage[],
  options: CompletionOptions
): Promise<string> {
  const settings = await settingsService.getEffectiveAISettings(options.organizationId);
  const provider = options.provider || settings.provider;

  switch (provider) {
    case 'openai': {
      if (!settings.openai.apiKey) {
        throw new Error('OpenAI is not configured for this organization');
      }

      // Create a new client with org-specific API key
      const client = new OpenAI({ apiKey: settings.openai.apiKey });
      const response = await client.chat.completions.create({
        model: options.model || settings.openai.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: options.maxTokens || aiConfig.openai.maxTokens,
        temperature: options.temperature ?? aiConfig.openai.temperature,
      });

      return response.choices[0]?.message?.content || '';
    }

    case 'anthropic': {
      if (!settings.anthropic.apiKey) {
        throw new Error('Anthropic is not configured for this organization');
      }

      // Create a new client with org-specific API key
      const client = new Anthropic({ apiKey: settings.anthropic.apiKey });
      const systemMessage = messages.find(m => m.role === 'system');
      const nonSystemMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await client.messages.create({
        model: options.model || settings.anthropic.model,
        max_tokens: options.maxTokens || aiConfig.anthropic.maxTokens,
        temperature: options.temperature ?? aiConfig.anthropic.temperature,
        system: systemMessage?.content,
        messages: nonSystemMessages,
      });

      const textContent = response.content.find(block => block.type === 'text');
      return textContent?.type === 'text' ? textContent.text : '';
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Generate a chat completion with JSON response
 * If organizationId is provided, uses org-specific settings from the database
 */
export async function generateJsonCompletion<T>(
  messages: ChatMessage[],
  options?: CompletionOptions
): Promise<T> {
  // If organizationId is provided, use database settings
  if (options?.organizationId) {
    return generateJsonCompletionWithOrgSettings<T>(messages, options);
  }

  // Otherwise use static config (env vars)
  const provider = getActiveProvider(options?.provider);

  switch (provider) {
    case 'openai': {
      if (!openaiService.isOpenAIConfigured()) {
        throw new Error('OpenAI is not configured');
      }
      return openaiService.generateJsonCompletion<T>(
        messages.map(m => ({ role: m.role, content: m.content })),
        {
          model: options?.model,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature,
        }
      );
    }

    case 'anthropic': {
      if (!anthropicService.isAnthropicConfigured()) {
        throw new Error('Anthropic is not configured');
      }
      // Anthropic uses a different message format - system is separate
      const systemMessage = messages.find(m => m.role === 'system');
      const nonSystemMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      return anthropicService.generateJsonCompletion<T>(nonSystemMessages, {
        model: options?.model,
        maxTokens: options?.maxTokens,
        temperature: options?.temperature,
        systemPrompt: systemMessage?.content,
      });
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Internal: Generate JSON completion using organization-specific settings from DB
 */
async function generateJsonCompletionWithOrgSettings<T>(
  messages: ChatMessage[],
  options: CompletionOptions
): Promise<T> {
  const settings = await settingsService.getEffectiveAISettings(options.organizationId);
  const provider = options.provider || settings.provider;

  switch (provider) {
    case 'openai': {
      if (!settings.openai.apiKey) {
        throw new Error('OpenAI is not configured for this organization');
      }

      // Create a new client with org-specific API key
      const client = new OpenAI({ apiKey: settings.openai.apiKey });
      const response = await client.chat.completions.create({
        model: options.model || settings.openai.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: options.maxTokens || aiConfig.openai.maxTokens,
        temperature: options.temperature ?? aiConfig.openai.temperature,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '';
      try {
        return JSON.parse(content) as T;
      } catch (error) {
        throw new Error(`Failed to parse JSON response: ${content}`);
      }
    }

    case 'anthropic': {
      if (!settings.anthropic.apiKey) {
        throw new Error('Anthropic is not configured for this organization');
      }

      // Create a new client with org-specific API key
      const client = new Anthropic({ apiKey: settings.anthropic.apiKey });
      const systemMessage = messages.find(m => m.role === 'system');
      const nonSystemMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // Add JSON instruction to system prompt
      const jsonSystemPrompt = systemMessage?.content
        ? `${systemMessage.content}\n\nIMPORTANT: You must respond with valid JSON only. No markdown, no explanations, just the JSON object.`
        : 'You must respond with valid JSON only. No markdown, no explanations, just the JSON object.';

      const response = await client.messages.create({
        model: options.model || settings.anthropic.model,
        max_tokens: options.maxTokens || aiConfig.anthropic.maxTokens,
        temperature: options.temperature ?? aiConfig.anthropic.temperature,
        system: jsonSystemPrompt,
        messages: nonSystemMessages,
      });

      const textContent = response.content.find(block => block.type === 'text');
      let content = textContent?.type === 'text' ? textContent.text : '';

      // Try to extract JSON from potential markdown code blocks
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.slice(7);
      } else if (content.startsWith('```')) {
        content = content.slice(3);
      }
      if (content.endsWith('```')) {
        content = content.slice(0, -3);
      }

      try {
        return JSON.parse(content.trim()) as T;
      } catch (error) {
        throw new Error(`Failed to parse JSON response: ${content}`);
      }
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get information about the current provider configuration
 */
export function getProviderInfo(): {
  activeProvider: AIProvider;
  openaiConfigured: boolean;
  anthropicConfigured: boolean;
  openaiModel: string;
  anthropicModel: string;
} {
  return {
    activeProvider: aiConfig.provider,
    openaiConfigured: openaiService.isOpenAIConfigured(),
    anthropicConfigured: anthropicService.isAnthropicConfigured(),
    openaiModel: aiConfig.openai.model,
    anthropicModel: aiConfig.anthropic.model,
  };
}

export default {
  getActiveProvider,
  isProviderConfigured,
  isAIConfigured,
  generateCompletion,
  generateJsonCompletion,
  getProviderInfo,
};
