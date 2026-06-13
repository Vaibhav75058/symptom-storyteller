import axios from 'axios';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

// ─────────────────────────────────────────────────────────────
// SYMPTOM PHOTO ANALYSIS PROMPT — ENGLISH & HINDI SUPPORT
// ─────────────────────────────────────────────────────────────
const getSymptomPrompt = (isHindi) => {
  const lang = isHindi ? 'Hindi (Devanagari script)' : 'English';
  
  return `You are an AI medical image triage assistant. The user will send you a photo of a visible symptom (skin rash, wound, swelling, etc).

RESPOND IN: ${lang}

Analyze the image and respond with a valid JSON object in this EXACT structure:
{
  "visible_observations": "Describe what you see in the image clearly (color, size, texture, location) in ${lang}",
  "possible_conditions": ["Condition 1 in ${lang}", "Condition 2 in ${lang}"],
  "urgency": "low" | "moderate" | "high",
  "recommended_specialist": "Specialist type (simple English name like Dermatologist, General Physician, or 'None')",
  "advice": "Immediate care advice in ${lang}",
  "disclaimer": "Medical disclaimer in ${lang}"
}

RULES:
1. DETECT NON-MEDICAL OBJECTS / RANDOM IMAGES:
   - Carefully inspect if the image contains a human body part with an actual visible medical symptom (e.g. skin rash, cut, wound, burn, swelling, redness).
   - If the image contains a random object (e.g. laptop, keyboard, table, animal, food, scenery, book) or does NOT show any clear human medical symptom:
     * "visible_observations" MUST be exactly: ${isHindi ? '"छवि में कोई स्पष्ट चिकित्सीय लक्षण या मानव शरीर का अंग नहीं पाया गया।"' : '"No human medical symptom or affected body part detected in the image."'}
     * "possible_conditions" MUST be: []
     * "urgency" MUST be: "low"
     * "recommended_specialist" MUST be: "None"
     * "advice" MUST be: ${isHindi ? '"कृपया प्रभावित त्वचा या लक्षण की एक साफ़ फ़ोटो लें ताकि मैं विश्लेषण कर सकूं।"' : '"Please take a clear photo of the affected skin or symptom so I can analyze it."'}

2. IF A MEDICAL SYMPTOM IS DETECTED:
   - Provide detailed observations about the symptom.
   - List 2-4 possible conditions (most likely first) in ${lang}.
   - Set urgency based on severity ("low", "moderate", "high").
   - Recommend a single specialist type (e.g. Dermatologist, General Physician, Orthopedic).
   - Provide 2-3 lines of practical care advice in ${lang}.

- ALWAYS respond with valid JSON only.
- recommended_specialist must remain in English (e.g. 'Dermatologist', 'None') so the app can handle routing.
- Be medically helpful but remember you are NOT making a definitive diagnosis.`;
};

export const analyzeSymptomPhoto = async (photoBase64, isHindi = false) => {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is missing. Please add it to your .env file.');
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: getSymptomPrompt(isHindi) },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this symptom image and provide your triage assessment.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${photoBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: 'json_object' },
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

    const rawContent = response.data.choices[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error('AI response parse failed');
    }

    // Validate and provide defaults
    return {
      visible_observations: parsed.visible_observations || (isHindi ? 'छवि से लक्षणों की स्पष्ट पहचान नहीं हो सकी।' : 'Unable to clearly identify symptoms from the image.'),
      possible_conditions: Array.isArray(parsed.possible_conditions) ? parsed.possible_conditions : [],
      urgency: ['low', 'moderate', 'high'].includes(parsed.urgency) ? parsed.urgency : 'low',
      recommended_specialist: parsed.recommended_specialist || 'None',
      advice: parsed.advice || (isHindi ? 'उचित उपचार के लिए योग्य डॉक्टर से परामर्श लें।' : 'Please consult a qualified doctor for proper diagnosis.'),
      disclaimer: parsed.disclaimer || (isHindi ? 'यह केवल AI छवि विश्लेषण है। कोई चिकित्सा निदान नहीं है।' : 'This is AI image analysis only. Not a medical diagnosis.'),
    };
  } catch (error) {
    console.error('Symptom Analysis Error:', error.response?.data || error.message);
    throw new Error(isHindi ? 'समान लक्षण का विश्लेषण विफल रहा। कृपया पुनः प्रयास करें।' : 'Symptom analysis failed. Please try again.');
  }
};
