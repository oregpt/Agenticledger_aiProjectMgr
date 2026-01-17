/**
 * OpenAI Service
 * Provides OpenAI client initialization and common AI operations
 */

import OpenAI from 'openai';
import { aiConfig } from '../../config/ai';

let openaiClient: OpenAI | null = null;

/**
 * Get the OpenAI client instance (singleton)
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!aiConfig.openai.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    openaiClient = new OpenAI({
      apiKey: aiConfig.openai.apiKey,
    });
  }

  return openaiClient;
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!aiConfig.openai.apiKey;
}

/**
 * Generate a chat completion using OpenAI
 */
export async function generateCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    responseFormat?: 'text' | 'json_object';
  }
): Promise<string> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: options?.model || aiConfig.openai.model,
    messages,
    max_tokens: options?.maxTokens || aiConfig.openai.maxTokens,
    temperature: options?.temperature ?? aiConfig.openai.temperature,
    response_format: options?.responseFormat
      ? { type: options.responseFormat }
      : undefined,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Generate a chat completion with JSON response
 */
export async function generateJsonCompletion<T>(
  messages: OpenAI.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<T> {
  const content = await generateCompletion(messages, {
    ...options,
    responseFormat: 'json_object',
  });

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${content}`);
  }
}

/**
 * Generate embeddings for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: aiConfig.openai.embeddingModel,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batched)
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: aiConfig.openai.embeddingModel,
    input: texts,
  });

  // Sort by index to maintain order
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

export default {
  getOpenAIClient,
  isOpenAIConfigured,
  generateCompletion,
  generateJsonCompletion,
  generateEmbedding,
  generateEmbeddings,
};
