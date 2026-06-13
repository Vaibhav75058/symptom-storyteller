import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

/**
 * Transcribe audio using OpenAI Whisper via OpenRouter's API
 * OpenRouter expects a JSON body with base64-encoded audio.
 */
export const transcribeAudio = async (audioUri) => {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is missing. Please add it to your .env file.');
    }

    // 1. Read the audio file and convert it to base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64Audio) {
      throw new Error('Failed to read audio file.');
    }

    // 2. Determine file format from the URI (usually m4a, wav, or mp3)
    let format = 'm4a';
    const extensionMatch = audioUri.match(/\.(\w+)$/);
    if (extensionMatch && extensionMatch[1]) {
      format = extensionMatch[1].toLowerCase();
      // OpenRouter supports common extensions like m4a, mp3, wav, flac, etc.
    }

    // 3. Post to OpenRouter audio transcription endpoint
    const response = await axios.post(
      'https://openrouter.ai/api/v1/audio/transcriptions',
      {
        model: 'openai/whisper-large-v3',
        input_audio: {
          data: base64Audio,
          format: format,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://symptom-storyteller.app',
          'X-Title': 'Symptom Storyteller',
        },
        timeout: 45000,
      }
    );

    const text = response.data?.text?.trim();
    if (!text) {
      throw new Error('No transcription text returned from OpenRouter.');
    }

    return text;
  } catch (error) {
    console.error('Whisper Transcription Error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error?.message ||
      error.message ||
      'Voice transcription failed. Please try typing your symptoms instead.'
    );
  }
};
