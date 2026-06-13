import axios from 'axios';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export const transcribeAudio = async (audioUri) => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is missing. Please add it to your .env file.");
    }

    const formData = new FormData();
    
    // Create a generic file object for the audio
    formData.append('file', {
      uri: audioUri,
      name: 'recording.m4a',
      type: 'audio/m4a',
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Optional: can be removed to auto-detect

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.text;
  } catch (error) {
    console.error('Whisper API Error:', error.response?.data || error.message);
    throw new Error('Failed to transcribe audio. Please try again.');
  }
};
