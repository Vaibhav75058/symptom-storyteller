import axios from 'axios';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || process.env.EXPO_PUBLIC_c_API_KEY;

// ─────────────────────────────────────────────────────────────
// MEDICINE ANALYSIS PROMPT — DETAILED + LANGUAGE SUPPORT
// ─────────────────────────────────────────────────────────────
const getMedicinePrompt = (isHindi) => {
  const lang = isHindi ? 'Hindi (Devanagari script)' : 'English';
  
  return `You are a medicine information assistant for Indian users. The user will either:
1. Send you a photo of a medicine strip/bottle/box, OR
2. Send you a medicine name as text.

RESPOND IN: ${lang}

You must analyze it and respond with a valid JSON object in this EXACT structure:
{
  "medicine_name": "Full medicine name with strength (e.g. Paracetamol 500mg)",
  "generic_name": "Generic/salt name (e.g. Acetaminophen)",
  "drug_class": "Drug class (e.g. Analgesic, Antipyretic)",
  "manufacturer": "Company name if known, otherwise null",
  "uses": ["Detailed use 1 with explanation", "Detailed use 2 with explanation", "Detailed use 3"],
  "side_effects": ["Side effect 1 with when it happens", "Side effect 2 with severity", "Side effect 3"],
  "contraindications": ["When NOT to take - detailed", "Another situation when NOT to take"],
  "interactions": ["Drug interaction 1 - what happens", "Drug interaction 2 - what happens"],
  "dosage_info": "Detailed dosage guidance with age groups if applicable",
  "storage": "Storage instructions",
  "how_it_works": "Simple 2-3 line explanation of how this medicine works in the body",
  "important_note": "Disclaimer about consulting doctor"
}

RULES:
- ALWAYS respond with valid JSON only, no extra text.
- ALL text values (uses, side_effects, etc.) MUST be in ${lang}.
- medicine_name and generic_name should remain in English (international names).
- BE DETAILED AND EXPLANATORY — each item in uses/side_effects should be 1-2 sentences explaining WHY, not just single words.
  ${isHindi ? `
  HINDI EXAMPLES:
  - uses: ["बुखार कम करने के लिए — यह शरीर का तापमान कम करती है और बुखार से राहत दिलाती है", "सिरदर्द में आराम — हल्के से मध्यम सिरदर्द में तुरंत असर करती है"]
  - side_effects: ["जी मिचलाना — खाली पेट लेने पर पेट में बेचैनी हो सकती है", "भूख कम लगना — कुछ दिनों तक खाने में मन नहीं लगता"]
  - contraindications: ["जिगर (लिवर) की बीमारी हो तो बिल्कुल न लें — यह लिवर को और नुकसान पहुंचा सकती है"]
  ` : `
  ENGLISH EXAMPLES:
  - uses: ["Reduces fever — It works by lowering the body's temperature set point in the brain, providing relief from fever", "Relieves mild to moderate pain — Effective for headaches, toothaches, body aches and menstrual cramps"]
  - side_effects: ["Nausea — Taking on an empty stomach may cause mild stomach discomfort or queasiness", "Loss of appetite — Some people may experience reduced hunger for a few days"]
  - contraindications: ["Severe liver disease — This medicine is processed by the liver and can cause serious damage if liver is already compromised"]
  `}
- Provide 4-6 items for uses and side_effects.
- Provide 2-4 items for contraindications and interactions.
- dosage_info should include general guidance for adults and children if applicable.
- how_it_works should be a simple explanation that a common person can understand.
- important_note MUST always include the disclaimer: ${isHindi ? '"यह जानकारी केवल शिक्षा के लिए है। हमेशा अपने डॉक्टर की सलाह का पालन करें और दवाई की खुराक के लिए फार्मासिस्ट से सलाह लें।"' : '"This information is for educational purposes only. Always follow your doctor\'s prescription and consult a pharmacist for dosage guidance."'}`;
};

// ─────────────────────────────────────────────────────────────
// ANALYZE MEDICINE FROM PHOTO (Vision API)
// ─────────────────────────────────────────────────────────────
export const analyzeMedicineFromPhoto = async (photoBase64, isHindi = false) => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: getMedicinePrompt(isHindi) },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: isHindi
                  ? 'इस फ़ोटो में दिखाई गई दवाई की विस्तृत जानकारी दें।'
                  : 'Please identify this medicine from the photo and provide detailed information about it.',
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
        max_tokens: 1500,
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

    const rawContent = response.data.choices[0].message.content;
    return JSON.parse(rawContent);
  } catch (error) {
    console.error('Medicine Photo Analysis Error:', error.response?.data || error.message);
    throw new Error(isHindi ? 'दवाई की फ़ोटो से जानकारी नहीं मिल पाई। नाम से खोजें।' : 'Medicine photo se information nahi mil paayi. Text search try karein.');
  }
};

// ─────────────────────────────────────────────────────────────
// SEARCH MEDICINE BY NAME (Text API)
// ─────────────────────────────────────────────────────────────
export const searchMedicineByName = async (medicineName, isHindi = false) => {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: getMedicinePrompt(isHindi) },
          {
            role: 'user',
            content: isHindi
              ? `इस दवाई के बारे में विस्तार से बताएं: ${medicineName}`
              : `Provide detailed information about this medicine: ${medicineName}`,
          },
        ],
        max_tokens: 1500,
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
        timeout: 30000,
      }
    );

    const rawContent = response.data.choices[0].message.content;
    return JSON.parse(rawContent);
  } catch (error) {
    console.error('Medicine Search Error:', error.response?.data || error.message);
    throw new Error(isHindi ? 'दवाई की जानकारी नहीं मिल पाई। दोबारा कोशिश करें।' : 'Medicine ki information nahi mil paayi. Dobara try karein.');
  }
};
