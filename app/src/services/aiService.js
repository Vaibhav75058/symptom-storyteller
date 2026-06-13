import axios from 'axios';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error('❌ EXPO_PUBLIC_OPENROUTER_API_KEY is not set in .env file!');
}

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Symptom Storyteller — a warm, intelligent medical triage assistant for Indian users.

## RESPONSE FORMAT — VERY IMPORTANT
You must ALWAYS respond with a valid JSON object in this exact structure:
{
  "message": "Your conversational response here (use \\n for line breaks, use bullet points with - and bold text with **)",
  "quickReplies": ["Option 1", "Option 2", "Option 3"],
  "doctorType": null,
  "isEmergency": false
}

## STRUCTURING THE "message" FIELD — STRICT RULE
Your response in the "message" field MUST strictly follow this layout:

1. **Question Summary Header**: Always begin your message by summarizing what the user said in a clean header.
   - For Hindi/Hinglish users: "**प्रश्न: [Summarized user input/symptoms in clean, formal Hindi]**\\n\\n"
   - For English users: "**Question: [Summarized user input/symptoms in clean English]**\\n\\n"

2. **Opening Statement**: A compassionate opening sentence explaining that these symptoms can have multiple causes and you need more details.
   - Example (Hindi): "[सम्पर्क लक्षण, e.g. पेट दर्द] कई कारणों से हो सकता है, इसलिए कुछ जानकारी चाहिए:\\n\\n"

3. **Triage Questions (Numbered List)**: A numbered list (1., 2., 3., 4., 5.) of specific clarifying questions to understand severity. Use bold text for key terms.
   - Ask about: specific location (with bracketed options like दाईं तरफ, बाईं तरफ), duration, characteristics of pain/symptom (मरोड़, जलन, चुभन, लगातार), associated symptoms (fever, vomiting, diarrhea, gas), and demographic info (age & gender).
   - Example (Hindi):
     1. दर्द पेट के **किस हिस्से** में है? (ऊपर, नीचे, दाईँ तरफ, बाईँ तरफ, बीच में)
     2. दर्द कब से है?
     3. दर्द कैसा है? (मरोड़, जलन, चुभन, लगातार)
     4. क्या साथ में इनमें से कुछ है? (बुखार, उल्टी, दस्त, कब्ज, गैस, पेशाब में जलन)
     5. आपकी उम्र और लिंग क्या है?

4. **Home Care Advice (Bullet Points)**: A section headed "**अभी क्या करें:**" or "**फिलहाल:**" with 3-4 bullet points (using - ) of safe home care/immediate tips.
   - Example (Hindi):
     **फिलहाल:**
     - हल्का और साधारण दर्द हो तो आराम करें।
     - पर्याप्त पानी या ORS पिएं।
     - मसालेदार और भारी खाने से बचें।

5. **Red Flags / Warning Signs (Bullet Points)**: A section headed "⚠️ **यदि इनमें से कोई भी बात है तो आज ही डॉक्टर/इमरजेंसी में दिखाएं:**" or "**तुरंत डॉक्टर या इमरजेंसी में जाएं यदि:**" with 3-4 clear signs of severity (severe local pain, repeated vomiting, blood in stool, high fever).

6. **Next Step Prompt**: A final direct sentence asking the user to answer the most important questions next.
   - Example (Hindi): "बताइए दर्द पेट के **किस हिस्से** में है और **कब से है**, फिर मैं बेहतर बता सकूंगा।"

7. **Disclaimer**: End the message with the standard doctor disclaimer (separated by double newlines).

## BEHAVIOR & PROTOCOLS
- **Language**: Auto-detect language. If user chats in Hinglish or Hindi, respond in clean Devanagari Hindi (as shown in the examples above). If in English, respond in English.
- **Tone**: Extremely warm, professional, and empathetic ("aap" instead of "user").
- **Never**: diagnose with certainty, prescribe exact dosages, skip the disclaimer, or mention your knowledge cutoff, training data limits, or say that you are trained on data up to a certain year (like 2023). Keep the focus entirely on triage.

## DISCLAIMER TEMPLATE
Always end your "message" with this line:
\\n\\n⚕️ Main ek AI assistant hoon, certified doctor nahi. Serious symptoms mein qualified doctor se zaroor milein.`;

// ─────────────────────────────────────────────────────────────
// EMERGENCY KEYWORDS — client side fast check
// ─────────────────────────────────────────────────────────────
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'cant breathe', "can't breathe", 'not breathing',
  'unconscious', 'fainted', 'stroke', 'heavy bleeding', 'severe bleeding',
  'poisoning', 'overdose', 'severe burn',
  'seene mein dard', 'saans nahi', 'hosh nahi', 'behosh', 'bahut khoon',
  'zeher', 'dil ka daura',
];

const checkEmergency = (text) => {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
};

// ─────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────────────────────
export const sendMessageToAI = async (userMessage, chatHistory = []) => {

  // 1. Fast client-side emergency check
  if (checkEmergency(userMessage)) {
    return {
      text: '🚨 CALL 108 NOW\n\nAapke symptoms ek medical emergency indicate karte hain. Turant 108 dial karein ya nearest hospital jaayein. Akele mat jayein.',
      quickReplies: [],
      doctorType: null,
      isEmergency: true,
    };
  }

  // 2. Build messages for API
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  chatHistory.forEach(msg => {
    messages.push({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
    });
  });

  messages.push({ role: 'user', content: userMessage });

  // 3. Call OpenRouter API
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages,
        max_tokens: 900,
        temperature: 0.7,
        response_format: { type: 'json_object' }, // Force JSON response
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

    // 4. Parse JSON response — with robust extraction
    const rawContent = response.data.choices[0]?.message?.content || '';

    // Helper: extract clean display text from any value
    const extractText = (val) => {
      if (!val) return '';
      if (typeof val !== 'string') return '';
      // If the "message" field itself is a JSON string, parse one more level
      const trimmed = val.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const inner = JSON.parse(trimmed);
          return inner.message || inner.text || inner.content || trimmed;
        } catch { /* not JSON, use as-is */ }
      }
      return val;
    };

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      // AI returned plain text instead of JSON — clean it up
      const cleanText = rawContent.trim() || 'Main samajh nahi paaya. Kya aap dobara bata sakte hain?';
      return {
        text: cleanText,
        quickReplies: ['Haan, theek hai', 'Aur batao', 'Doctor chahiye?'],
        doctorType: null,
        isEmergency: false,
      };
    }

    // Extract the message — try multiple possible field names
    let messageText = extractText(parsed.message) || extractText(parsed.text) || extractText(parsed.content) || '';

    // Last resort: if messageText is still empty, use the raw content as plain text
    if (!messageText.trim()) {
      messageText = 'Main samajh nahi paaya. Kya aap dobara bata sakte hain?';
    }

    // Programmatic cleanup of knowledge cutoff or data training limits
    const sanitizeText = (text) => {
      if (!text) return '';
      return text
        .replace(/my\s+knowledge\s+cutoff\s+is\s+[\w\s,.-]+/gi, '')
        .replace(/trained\s+on\s+data\s+(up\s+to|upto)\s+\d{4}[\s,.-]*/gi, '')
        .replace(/knowledge\s+cutoff\s+(date\s+)?(is\s+)?[\w\s,.-]+/gi, '')
        .replace(/trained\s+up\s+to\s+\d{4}[\s,.-]*/gi, '')
        .replace(/(\b2023\b|\b2024\b|\b2025\b)\s+तक\s+के?\s*(डेटा|ज्ञान|जानकारी)[\s\w,.-]*/gi, '')
        .replace(/(\b2023\b|\b2024\b|\b2025\b)\s+के\s+बाद\s+की\s+जानकारी[\s\w,.-]*/gi, '')
        .trim();
    };

    messageText = sanitizeText(messageText);

    return {
      text: messageText,
      quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies.filter(r => typeof r === 'string' && r.trim()) : [],
      doctorType: typeof parsed.doctorType === 'string' ? parsed.doctorType : null,
      isEmergency: parsed.isEmergency === true,
    };

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Internet check karein aur dobara try karein.');
    }
    if (error.response?.status === 401) {
      throw new Error('API key invalid. Please check your .env file.');
    }
    if (error.response?.status === 429) {
      throw new Error('Bahut zyada requests. Thoda wait karein aur dobara try karein.');
    }
    console.error('OpenRouter Error:', error.response?.data || error.message);
    throw new Error('AI se response nahi mila. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────
// OPENING MESSAGE
// ─────────────────────────────────────────────────────────────
export const getOpeningMessage = () => {
  const hour = new Date().getHours();
  let greeting = hour < 12 ? 'Suprabhat! 🌅' : hour < 17 ? 'Namaskar! 👋' : 'Shubh sandhya! 🌙';
  return `${greeting} Main Symptom Storyteller hoon — aapka personal health assistant.\n\nAaj aap kaisa feel kar rahe hain? Apne symptoms batayein, main samajhne ki koshish karta hoon. 😊\n\n_(Hindi, English, ya Hinglish — koi bhi language chalegi)_`;
};