import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

// ─────────────────────────────────────────────────────────────
// ALL UI STRINGS — English & Hindi
// ─────────────────────────────────────────────────────────────
const STRINGS = {
  en: {
    // Home Screen
    goodMorning: 'Good morning,',
    goodAfternoon: 'Good afternoon,',
    goodEvening: 'Good evening,',
    howCanWeHelp: 'How can we help today?',
    aiChat: 'AI Chat',
    aiChatDesc: 'Get instant answers to\nyour health questions',
    cameraScan: 'Camera Scan',
    cameraScanDesc: 'Scan symptoms using\nyour phone camera',
    medicineInfo: 'Medicine Info',
    medicineInfoDesc: 'Learn about medicines,\nuses and side effects',
    findDoctors: 'Find Doctors',
    findDoctorsDesc: 'Find nearby doctors\nand specialists',
    recentSessions: 'Recent Sessions',
    seeAll: 'See All',
    skinRashAssessment: 'Skin Rash Assessment',
    yesterdayLow: 'Yesterday • Low Urgency',
    view: 'View',

    // Chat Screen
    triageChat: '🩺 Triage Chat',
    newChat: 'New Chat',
    typeSymptoms: 'Apne symptoms batayein...',
    convertingVoice: 'Converting voice...',
    recording: '🎤 Recording... Tap mic to stop',
    convertingVoiceText: 'Converting voice to text...',
    quickReplyHint: 'Quick reply select karein ya khud likhein:',
    findNearby: 'Find Nearby',
    maps: '↗ Maps',
    emergency: 'EMERGENCY',
    emergencyDesc: 'Aapke symptoms ek medical emergency indicate karte hain.\nTurant 108 call karein ya nearest hospital jaayein.\n\nAkele mat jayein — kisi ko saath lein.',
    call108: 'Call 108 Now',
    notMyEmergency: 'Yeh meri situation nahi hai — wapas jao',
    errorMsg: '⚠️ Kuch problem aayi. Internet check karein aur dobara try karein.',

    // Medicine Scanner
    medicineInfoTitle: 'Medicine Info',
    medicineInfoSubtitle: 'Scan a medicine strip or search by name to get detailed information.',
    scanMedicine: '📸 Scan Medicine',
    scanMedicineDesc: 'Camera se medicine strip ya bottle scan karein',
    searchByName: '🔍 Search by Name',
    searchPlaceholder: 'e.g. Crocin, Dolo 650, Azithromycin...',
    searchMedicineBtn: 'Search Medicine',
    popularSearches: 'Popular searches:',
    analyzingMedicine: 'Analyzing Medicine...',
    analyzingMedicineDesc: 'AI medicine ki information\ndhoondh raha hai',
    back: 'Back',
    searchAnother: 'Search Another Medicine',
    uses: 'Uses',
    sideEffects: 'Side Effects',
    dosageInfo: 'Dosage Info',
    contraindications: 'Contraindications',
    drugInteractions: 'Drug Interactions',
    storage: 'Storage',
    or: 'OR',
    preview: 'Preview',
    retake: 'Retake',
    analyze: 'Analyze',
    analyzingSymptom: 'Analyzing symptom...',
    analyzingSymptomDesc: 'AI aapki image review kar raha hai',

    // Triage Result
    triageResult: 'Triage Result',
    lowUrgency: 'Low Urgency',
    moderateUrgency: 'Moderate Urgency',
    highUrgency: 'High Urgency',
    observations: 'Observations',
    possibleConditions: 'Possible Conditions',
    recommendedSpecialist: 'Recommended Specialist',
    advice: 'Advice',
    find: 'Find',
    done: 'Done',

    // Doctors
    doctorsTitle: 'Find Doctors',

    // Profile
    language: 'Language',
    hindi: 'हिंदी',
    english: 'English',
    medicalProfile: 'Medical Profile',
    age: 'Age',
    gender: 'Gender',
    bloodGroup: 'Blood Group',
    allergies: 'Allergies',
    chronicConditions: 'Chronic Conditions',
    saveChanges: 'Save Changes',
    profileSaved: '✅ Profile saved successfully!',
    profileSaveError: '❌ Failed to save profile.',
    profileLoading: 'Loading profile...',
    logout: 'Log Out',
    saving: 'Saving...',

    // Camera
    positionSymptom: 'Position symptom in frame',
    cameraPermission: 'We need your permission to show the camera',
    grantPermission: 'Grant Permission',
    medicineScannerTitle: 'Medicine Scanner',
    medicineFrame: 'Medicine ko frame mein rakhein',

    // Health Dashboard
    healthDashboard: 'Health Dashboard',
    heartRate: 'Heart Rate',
    bloodPressure: 'Blood Pressure',
    weight: 'Weight',
    bpm: 'bpm',
    kgUnit: 'kg',
    mmHg: 'mmHg',
    logEntry: 'Log Entry',
    weeklyTrends: 'Weekly Trends',
    monthlyTrends: 'Monthly Trends',
    noHealthData: 'No health data yet. Tap + to log your first entry!',
    saveEntry: 'Save Entry',
    healthLogged: '✅ Health data saved!',
    healthLogError: '❌ Failed to save health data.',
    systolic: 'Systolic',
    diastolic: 'Diastolic',

    // Medicine Reminder
    medicineReminder: 'Medicine Reminder',
    addMedicine: 'Add Medicine',
    medicineName: 'Medicine Name',
    medicineDescription: 'Description / Notes',
    dosage: 'Dosage',
    medicineType: 'Medicine Type',
    frequency: 'Frequency',
    timeSelection: 'Time Selection',
    duration: 'Duration',
    repeatOption: 'Repeat',
    onceADay: 'Once a Day',
    twiceADay: 'Twice a Day',
    threeTimesADay: '3 Times a Day',
    fourTimesADay: '4 Times a Day',
    customFrequency: 'Custom',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
    daily: 'Daily',
    alternateDays: 'Alternate Days',
    weekly: 'Weekly',
    specificDays: 'Specific Days',
    startDate: 'Start Date',
    endDate: 'End Date',
    totalDays: 'Total Days',
    ongoing: 'Ongoing',
    tablet: 'Tablet',
    capsule: 'Capsule',
    syrup: 'Syrup',
    injection: 'Injection',
    drops: 'Drops',
    cream: 'Cream',
    voiceReminder: 'Voice Reminder',
    caretaker: 'Caretaker / Family',
    caretakerName: 'Caretaker Name',
    caretakerPhone: 'Caretaker Phone',
    prescriptionPhoto: 'Prescription Photo',
    totalQuantity: 'Total Quantity',
    remainingQuantity: 'Remaining',
    refillAlert: 'Refill Alert',
    taken: 'Taken',
    missed: 'Missed',
    skipped: 'Skipped',
    takeNow: 'Take Now',
    snooze: 'Snooze 10 Min',
    skip: 'Skip',
    medicineHistory: 'Medicine History',
    adherence: 'Adherence',
    todaysMedicines: "Today's Medicines",
    nextMedicine: 'Next Medicine',
    missedMedicines: 'Missed Medicines',
    progress: 'Progress',
    noReminders: 'No medicines added yet. Tap + to add your first reminder!',
    medicineSaved: '✅ Medicine reminder saved!',
    medicineSaveError: '❌ Failed to save medicine reminder.',
    medicineDeleted: 'Medicine reminder deleted.',
    refillWarning: 'Only {qty} left!',
    camera: 'Camera',
    gallery: 'Gallery',
    uploadPrescription: 'Upload Prescription',
    emergencyContacts: 'Emergency',
    doctorNumber: 'Doctor Number',
    familyContact: 'Family Contact',
    ambulance: 'Ambulance 108',
    saveMedicine: 'Save Medicine',
    editMedicine: 'Edit Medicine',
    active: 'Active',
    paused: 'Paused',

    // Dark Mode
    darkMode: 'Dark Mode',
    appearance: 'Appearance',

    // Notifications
    notificationPermission: 'Enable Notifications',
    healthTip: 'Health Tip',
    medicineAlarm: 'Medicine Alarm',
  },

  hi: {
    // Home Screen
    goodMorning: 'सुप्रभात,',
    goodAfternoon: 'नमस्कार,',
    goodEvening: 'शुभ संध्या,',
    howCanWeHelp: 'आज हम कैसे मदद करें?',
    aiChat: 'AI चैट',
    aiChatDesc: 'अपने स्वास्थ्य सवालों के\nतुरंत जवाब पाएं',
    cameraScan: 'कैमरा स्कैन',
    cameraScanDesc: 'अपने फ़ोन कैमरे से\nलक्षण स्कैन करें',
    medicineInfo: 'दवाई की जानकारी',
    medicineInfoDesc: 'दवाइयों के बारे में जानें,\nउपयोग और साइड इफ़ेक्ट',
    findDoctors: 'डॉक्टर खोजें',
    findDoctorsDesc: 'नज़दीकी डॉक्टर\nऔर विशेषज्ञ खोजें',
    recentSessions: 'हाल की बातचीत',
    seeAll: 'सब देखें',
    skinRashAssessment: 'त्वचा पर चकत्ते की जांच',
    yesterdayLow: 'कल • कम ज़रूरत',
    view: 'देखें',

    // Chat Screen
    triageChat: '🩺 स्वास्थ्य चैट',
    newChat: 'नया चैट',
    typeSymptoms: 'अपने लक्षण बताएं...',
    convertingVoice: 'आवाज़ बदल रही है...',
    recording: '🎤 रिकॉर्डिंग... रोकने के लिए माइक दबाएं',
    convertingVoiceText: 'आवाज़ को लिखावट में बदल रहे हैं...',
    quickReplyHint: 'जल्दी जवाब चुनें या खुद लिखें:',
    findNearby: 'नज़दीकी',
    maps: '↗ मैप',
    emergency: 'आपातकाल',
    emergencyDesc: 'आपके लक्षण एक मेडिकल इमरजेंसी दर्शाते हैं।\nतुरंत 108 कॉल करें या नज़दीकी अस्पताल जाएं।\n\nअकेले मत जाएं — किसी को साथ लें।',
    call108: '108 पर कॉल करें',
    notMyEmergency: 'यह मेरी स्थिति नहीं है — वापस जाओ',
    errorMsg: '⚠️ कुछ समस्या आई। इंटरनेट चेक करें और दोबारा कोशिश करें।',

    // Medicine Scanner
    medicineInfoTitle: 'दवाई की जानकारी',
    medicineInfoSubtitle: 'दवाई की पट्टी स्कैन करें या नाम से खोजें।',
    scanMedicine: '📸 दवाई स्कैन करें',
    scanMedicineDesc: 'कैमरे से दवाई की पट्टी या बोतल स्कैन करें',
    searchByName: '🔍 नाम से खोजें',
    searchPlaceholder: 'जैसे: क्रोसिन, डोलो 650, अज़िथ्रोमाइसिन...',
    searchMedicineBtn: 'दवाई खोजें',
    popularSearches: 'लोकप्रिय खोज:',
    analyzingMedicine: 'दवाई की जानकारी ढूंढ रहे हैं...',
    analyzingMedicineDesc: 'AI दवाई की विस्तृत\nजानकारी खोज रहा है',
    back: 'वापस',
    searchAnother: 'दूसरी दवाई खोजें',
    uses: 'उपयोग (किस काम आती है)',
    sideEffects: 'साइड इफ़ेक्ट (नुकसान)',
    dosageInfo: 'खुराक की जानकारी',
    contraindications: 'कब नहीं लेनी चाहिए',
    drugInteractions: 'दूसरी दवाइयों के साथ असर',
    storage: 'कैसे रखें',
    or: 'या',
    preview: 'फ़ोटो देखें',
    retake: 'दोबारा लें',
    analyze: 'जांच करें',
    analyzingSymptom: 'लक्षण जांच रही है...',
    analyzingSymptomDesc: 'AI आपकी फ़ोटो देख रहा है',

    // Triage Result
    triageResult: 'जांच का नतीजा',
    lowUrgency: 'कम ज़रूरत',
    moderateUrgency: 'मध्यम ज़रूरत',
    highUrgency: 'तुरंत ज़रूरत',
    observations: 'क्या दिखा',
    possibleConditions: 'संभावित बीमारियां',
    recommendedSpecialist: 'किस डॉक्टर को दिखाएं',
    advice: 'सलाह',
    find: 'खोजें',
    done: 'हो गया',

    // Doctors
    doctorsTitle: 'डॉक्टर खोजें',

    // Profile
    language: 'भाषा',
    hindi: 'हिंदी',
    english: 'English',
    medicalProfile: 'चिकित्सा प्रोफ़ाइल',
    age: 'उम्र',
    gender: 'लिंग',
    bloodGroup: 'रक्त समूह (Blood Group)',
    allergies: 'एलर्जी (Allergies)',
    chronicConditions: 'पुरानी बीमारियां (Chronic Conditions)',
    saveChanges: 'बदलाव सहेजें',
    profileSaved: '✅ प्रोफ़ाइल सफलतापूर्वक सहेजी गई!',
    profileSaveError: '❌ प्रोफ़ाइल सहेजने में विफलता।',
    profileLoading: 'प्रोफ़ाइल लोड हो रही है...',
    logout: 'लॉग आउट',
    saving: 'सहेज रहे हैं...',

    // Camera
    positionSymptom: 'लक्षण को फ़्रेम में रखें',
    cameraPermission: 'कैमरा इस्तेमाल करने की अनुमति चाहिए',
    grantPermission: 'अनुमति दें',
    medicineScannerTitle: 'दवाई स्कैनर',
    medicineFrame: 'दवाई को फ़्रेम में रखें',

    // Health Dashboard
    healthDashboard: 'स्वास्थ्य डैशबोर्ड',
    heartRate: 'हृदय गति',
    bloodPressure: 'रक्तचाप',
    weight: 'वज़न',
    bpm: 'बीपीएम',
    kgUnit: 'किलो',
    mmHg: 'एमएम एचजी',
    logEntry: 'एंट्री दर्ज करें',
    weeklyTrends: 'साप्ताहिक रुझान',
    monthlyTrends: 'मासिक रुझान',
    noHealthData: 'अभी कोई स्वास्थ्य डेटा नहीं है। + दबाकर पहली एंट्री करें!',
    saveEntry: 'एंट्री सहेजें',
    healthLogged: '✅ स्वास्थ्य डेटा सहेजा गया!',
    healthLogError: '❌ स्वास्थ्य डेटा सहेजने में विफलता।',
    systolic: 'सिस्टोलिक',
    diastolic: 'डायस्टोलिक',

    // Medicine Reminder
    medicineReminder: 'दवाई रिमाइंडर',
    addMedicine: 'दवाई जोड़ें',
    medicineName: 'दवाई का नाम',
    medicineDescription: 'विवरण / नोट्स',
    dosage: 'खुराक',
    medicineType: 'दवाई का प्रकार',
    frequency: 'कितनी बार',
    timeSelection: 'समय चुनें',
    duration: 'अवधि',
    repeatOption: 'दोहराव',
    onceADay: 'दिन में एक बार',
    twiceADay: 'दिन में दो बार',
    threeTimesADay: 'दिन में तीन बार',
    fourTimesADay: 'दिन में चार बार',
    customFrequency: 'कस्टम',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    evening: 'शाम',
    night: 'रात',
    daily: 'रोज़',
    alternateDays: 'एक दिन छोड़कर',
    weekly: 'हफ़्ते में एक बार',
    specificDays: 'चुने हुए दिन',
    startDate: 'शुरू तारीख़',
    endDate: 'अंतिम तारीख़',
    totalDays: 'कुल दिन',
    ongoing: 'जारी',
    tablet: 'टैबलेट',
    capsule: 'कैप्सूल',
    syrup: 'सिरप',
    injection: 'इंजेक्शन',
    drops: 'ड्रॉप्स',
    cream: 'क्रीम',
    voiceReminder: 'आवाज़ रिमाइंडर',
    caretaker: 'देखभालकर्ता / परिवार',
    caretakerName: 'देखभालकर्ता का नाम',
    caretakerPhone: 'देखभालकर्ता का फ़ोन',
    prescriptionPhoto: 'प्रिस्क्रिप्शन फ़ोटो',
    totalQuantity: 'कुल मात्रा',
    remainingQuantity: 'शेष',
    refillAlert: 'रीफिल अलर्ट',
    taken: 'ली गई',
    missed: 'छूट गई',
    skipped: 'छोड़ी गई',
    takeNow: 'अभी लें',
    snooze: '10 मिनट बाद',
    skip: 'छोड़ें',
    medicineHistory: 'दवाई इतिहास',
    adherence: 'पालन',
    todaysMedicines: 'आज की दवाइयां',
    nextMedicine: 'अगली दवाई',
    missedMedicines: 'छूटी दवाइयां',
    progress: 'प्रगति',
    noReminders: 'अभी कोई दवाई नहीं जोड़ी। + दबाकर पहला रिमाइंडर जोड़ें!',
    medicineSaved: '✅ दवाई रिमाइंडर सहेजा गया!',
    medicineSaveError: '❌ दवाई रिमाइंडर सहेजने में विफलता।',
    medicineDeleted: 'दवाई रिमाइंडर हटाया गया।',
    refillWarning: 'सिर्फ़ {qty} बचे हैं!',
    camera: 'कैमरा',
    gallery: 'गैलरी',
    uploadPrescription: 'प्रिस्क्रिप्शन अपलोड करें',
    emergencyContacts: 'आपातकालीन',
    doctorNumber: 'डॉक्टर का नंबर',
    familyContact: 'परिवार का संपर्क',
    ambulance: 'एम्बुलेंस 108',
    saveMedicine: 'दवाई सहेजें',
    editMedicine: 'दवाई संपादित करें',
    active: 'सक्रिय',
    paused: 'रुकी हुई',

    // Dark Mode
    darkMode: 'डार्क मोड',
    appearance: 'दिखावट',

    // Notifications
    notificationPermission: 'सूचनाएं चालू करें',
    healthTip: 'स्वास्थ्य सुझाव',
    medicineAlarm: 'दवाई अलार्म',
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const toggleLanguage = async () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    setLang(newLang);
    try {
      await AsyncStorage.setItem('app_language', newLang);
    } catch (e) { /* ignore */ }
  };

  const setLanguage = async (newLang) => {
    setLang(newLang);
    try {
      await AsyncStorage.setItem('app_language', newLang);
    } catch (e) { /* ignore */ }
  };

  // Load saved language on mount
  React.useEffect(() => {
    AsyncStorage.getItem('app_language').then(saved => {
      if (saved === 'hi' || saved === 'en') setLang(saved);
    }).catch(() => {});
  }, []);

  const t = (key) => STRINGS[lang]?.[key] || STRINGS['en']?.[key] || key;
  const isHindi = lang === 'hi';

  return (
    <LanguageContext.Provider value={{ lang, isHindi, t, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
