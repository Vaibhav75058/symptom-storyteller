const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { Anthropic } = require('@anthropic-ai/sdk');
// const OpenAI = require('openai'); // Ready when needed for Whisper

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize clients (will fail gracefully if keys are missing initially)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key' });

// 10 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10,
  message: { error: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userProfile } = req.body;
    
    // In full implementation, we build the system prompt and send it to Claude
    res.json({ 
      possible_conditions: ["Common Cold"], 
      urgency_level: "low", 
      specialist_type: "General Physician", 
      notes: "Drink water and rest.", 
      disclaimer: "This is AI triage only. Please consult a doctor." 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vision', async (req, res) => {
  try {
    const { imageBase64, type } = req.body;
    res.json({ 
      visible_observations: "Mild redness", 
      possible_conditions: ["Contact Dermatitis"], 
      urgency: "low", 
      recommended_specialist: "Dermatologist", 
      advice: "Keep area clean.", 
      disclaimer: "This is AI image analysis only. Not a medical diagnosis. Please consult a doctor." 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transcribe', async (req, res) => {
  try {
    res.json({ text: "Sample transcribed text." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend proxy running on port ${PORT}`);
});
