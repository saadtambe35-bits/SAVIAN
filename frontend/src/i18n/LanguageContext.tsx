import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

/**
 * LINE CLEAR (SAVIAN) - Indian Railways AI Operations Cockpit
 * LanguageContext.tsx: Comprehensive Trilingual Localization Engine (English, Rajbhasha Hindi, Marathi)
 * Features:
 *  1. Authentic Indian Railways Official Vocabulary (Railway Board Rajbhasha + Central Railway Marathi)
 *  2. Full-text and Word-by-Word phrase tokenization & translation
 *  3. Seamless DOM-level Auto-Translation Engine with MutationObserver
 *  4. Instant zero-latency switching with 100% original English restore on 'en'
 *  5. Zero External Dependencies (Pure React 18 & TypeScript)
 */

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

// ============================================================================
// 1. RAILWAY OFFICIAL MULTI-WORD PHRASES (Matched longest-first)
// ============================================================================
export const RAILWAY_PHRASES: { en: string; hi: string; mr: string }[] = [
  { en: 'P-Way', hi: 'पी-वे (रेलमार्ग)', mr: 'पी-वे (रेल्वे मार्ग)' },
  { en: 'Co-aligning', hi: 'समन्वय स्थापित करते हुए', mr: 'समन्वय साधत' },
  { en: 'Co-align', hi: 'समन्वय करें', mr: 'समन्वय साधा' },
  { en: 'Plasser Quick-Relief Track Machine', hi: 'प्लासर त्वरित-राहत ट्रैक मशीन', mr: 'प्लासर जलद-मदत ट्रॅक यंत्र' },
  { en: 'Plasser', hi: 'प्लासर मशीन', mr: 'प्लासर यंत्र' },
  { en: 'CRIS', hi: 'क्रिस (CRIS)', mr: 'क्रिस (CRIS)' },
  { en: 'TMS', hi: 'टीएमएस (TMS)', mr: 'टीएमएस (TMS)' },
  { en: 'SMMS', hi: 'एसएमएमएस (SMMS)', mr: 'एसएमएमएस (SMMS)' },
  { en: 'TDMS', hi: 'टीडीएमएस (TDMS)', mr: 'टीडीएमएस (TDMS)' },
  { en: 'ICMS', hi: 'आईसीएमएस (ICMS)', mr: 'आईसीएमएस (ICMS)' },
  { en: 'FOIS', hi: 'एफओआईएस (FOIS)', mr: 'एफओआईएस (FOIS)' },
  { en: 'NavIC', hi: 'नाविक (NavIC)', mr: 'नाविक (NavIC)' },
  { en: 'BPL', hi: 'भोपाल (BPL)', mr: 'भोपाळ (BPL)' },
  { en: 'ET', hi: 'इटारसी (ET)', mr: 'इटारसी (ET)' },
  { en: 'BINA', hi: 'बीना (BINA)', mr: 'बीना (BINA)' },
  { en: 'RKMP', hi: 'रानी कमलापति (RKMP)', mr: 'राणी कमलापती (RKMP)' },
  { en: 'ROI', hi: 'आरओआई (लाभ)', mr: 'आरओआई (परतावा)' },
  { en: 'Non-Conventional', hi: 'गैर-पारंपरिक', mr: 'गैर-पारंपारिक' },
  { en: 'Non Conventional', hi: 'गैर-पारंपरिक', mr: 'गैर-पारंपारिक' },
  { en: 'Speed Restriction', hi: 'गति प्रतिबंध', mr: 'वेग मर्यादा' },
  { en: 'Track Machine', hi: 'ट्रैक मशीन', mr: 'ट्रॅक यंत्र' },
  { en: 'Duty Limit', hi: 'ड्यूटी सीमा', mr: 'ड्यूटी मर्यादा' },
  // Core Operational Concepts
  { en: 'Temporary Speed Restriction (TSR)', hi: 'अस्थायी गति प्रतिबंध (टीएसआर)', mr: 'तात्पुरते वेग निर्बंध (टीएसआर)' },
  { en: 'Temporary Speed Restriction', hi: 'अस्थायी गति प्रतिबंध', mr: 'तात्पुरते वेग निर्बंध' },
  { en: 'Track Maintenance Block', hi: 'ट्रैक अनुरक्षण ब्लॉक', mr: 'रेल्वे ट्रॅक दुरुस्ती ब्लॉक' },
  { en: 'Track Maintenance', hi: 'ट्रैक अनुरक्षण', mr: 'रेल्वे ट्रॅक दुरुस्ती' },
  { en: 'Caution Order (T/409)', hi: 'सावधानी आदेश (टी/409)', mr: 'दक्षता आदेश (टी/409)' },
  { en: 'Caution Order', hi: 'सावधानी आदेश', mr: 'दक्षता आदेश' },
  { en: 'Line Clear', hi: 'लाइन क्लियर', mr: 'मार्ग मोकळा' },
  { en: 'Vande Bharat Express', hi: 'वंदे भारत एक्सप्रेस', mr: 'वंदे भारत एक्सप्रेस' },
  { en: 'Rajdhani Express', hi: 'राजधानी एक्सप्रेस', mr: 'राजधानी एक्सप्रेस' },
  { en: 'Shatabdi Express', hi: 'शताब्दी एक्सप्रेस', mr: 'शताब्दी एक्सप्रेस' },
  { en: 'Freight Goods Train', hi: 'मालगाड़ी', mr: 'मालगाडी' },
  { en: 'Freight Goods', hi: 'मालगाड़ी', mr: 'मालगाडी' },
  { en: 'Passenger Train', hi: 'सवारी गाड़ी', mr: 'प्रवासी गाडी' },
  { en: 'Station Master', hi: 'स्टेशन मास्टर', mr: 'स्थानक प्रबंधक' },
  { en: 'Section Controller', hi: 'अनुभाग नियंत्रक', mr: 'विभाग नियंत्रक' },
  { en: 'Senior Section Engineer (SSE)', hi: 'वरिष्ठ खंड अभियंता (एसएसई)', mr: 'वरिष्ठ विभाग अभियंता (एसएसई)' },
  { en: 'Senior Section Engineer', hi: 'वरिष्ठ खंड अभियंता', mr: 'वरिष्ठ विभाग अभियंता' },
  { en: 'Loco Pilot', hi: 'लोको पायलट / चालक', mr: 'लोको पायलट / चालक' },
  { en: 'Assistant Loco Pilot', hi: 'सहायक लोको पायलट', mr: 'सहायक लोको पायलट' },
  { en: 'Headway Interval', hi: 'ट्रेनों के बीच का समय (हेडवे)', mr: 'गाड्यांमधील अंतर (हेडवे)' },
  { en: 'Loop Siding Line', hi: 'लूप साइडिंग लाइन', mr: 'लूप लाईन' },
  { en: 'Loop Line', hi: 'लूप लाइन', mr: 'लूप लाईन' },
  { en: 'OHE Traction Power Cut', hi: 'ओएचई बिजली कटौती', mr: 'ओएचई विद्युत खंडित' },
  { en: 'OHE Power Cut', hi: 'ओएचई विद्युत कटौती', mr: 'ओएचई वीज खंडित' },
  { en: 'Demurrage Penalty Saved', hi: 'विलंब शुल्क बचत (डेमरेज)', mr: 'विलंब शुल्क बचत' },
  { en: 'Demurrage Saved', hi: 'डेमरेज बचत', mr: 'डेमरेज बचत' },
  { en: 'Clearance Gauge Infringement', hi: 'निकासी सीमा उल्लंघन', mr: 'क्लिअरन्स मर्यादा उल्लंघन' },
  { en: 'Kavach SIL-4 Collision Avoidance', hi: 'कवच एसआईएल-4 टक्कर सुरक्षा प्रणाली', mr: 'कवच एसआयएल-4 टक्कर प्रतिबंधक यंत्रणा' },
  { en: 'Kavach Commissioned', hi: 'कवच सक्रिय', mr: 'कवच कार्यान्वित' },
  { en: 'Kavach Compliance', hi: 'कवच अनुपालन', mr: 'कवच अनुपालन' },
  { en: 'Kavach Protection', hi: 'कवच सुरक्षा', mr: 'कवच संरक्षण' },
  { en: 'Shadow Block Savings', hi: 'शैडो ब्लॉक बचत', mr: 'शॅडो ब्लॉक बचत' },
  { en: 'Shadow Block Optimization', hi: 'शैडो ब्लॉक अनुकूलन', mr: 'शॅडो ब्लॉक ऑप्टिमायझेशन' },
  { en: 'Shadow Block', hi: 'शैडो ब्लॉक', mr: 'शॅडो ब्लॉक' },
  { en: 'Shadow Merges', hi: 'शैडो ब्लॉक विलय', mr: 'शॅडो ब्लॉक विलीनीकरण' },
  { en: 'Total Demands', hi: 'कुल मांगें', mr: 'एकूण मागण्या' },
  { en: 'Active Demands', hi: 'सक्रिय मांगें', mr: 'सक्रिय मागण्या' },
  { en: 'Train Delay Impact', hi: 'ट्रेन विलंब प्रभाव', mr: 'गाडी उशीर प्रभाव' },
  { en: 'Train Delay', hi: 'ट्रेन विलंब', mr: 'गाडीचा उशीर' },
  { en: 'Re-optimize Corridor', hi: 'अनुभाग पुनः अनुकूलित करें', mr: 'मार्ग पुन्हा ऑप्टिमाइझ करा' },
  { en: 'Re-optimize', hi: 'पुनः अनुकूलित करें', mr: 'पुन्हा ऑप्टिमाइझ करा' },
  { en: 'Co-aligning OHE & S&T under P-Way possessions', hi: 'पी-वे ब्लॉक के तहत ओएचई व सिग्नलिंग का समन्वय', mr: 'पी-वे ब्लॉक अंतर्गत ओएचई व सिग्नलिंगचे समन्वय' },
  { en: 'Punctuality preserved across passenger slots', hi: 'यात्री समय-सारिणी में समयबद्धता सुरक्षित', mr: 'प्रवासी गाड्यांची वेळ पाळणे संरक्षित' },
  { en: 'vs manual', hi: 'बनाम मैन्युअल', mr: 'विरुद्ध मॅन्युअल' },
  { en: 'High Priority Corridor Alert', hi: 'उच्च प्राथमिकता गलियारा चेतावनी', mr: 'उच्च प्राधान्य कॉरिडॉर इशारा' },
  { en: 'Simulate Crew Fatigue Event', hi: 'क्रू थकान स्थिति सिमुलेट करें', mr: 'क्रू थकवा स्थिती सिम्युलेट करा' },
  { en: '104-Hr Fortnightly Safety Rule Violation Predictor', hi: '१०४-घंटे पाक्षिक सुरक्षा नियम उल्लंघन पूर्वानुमानक', mr: '१०४-तास पाक्षिक सुरक्षा नियम उल्लंघन अंदाजकर्ता' },
  { en: 'Autonomous Worksite Possession Enforcement', hi: 'स्वायत्त कार्यस्थल ब्लॉक अधिकार प्रवर्तन', mr: 'स्वायत्त कार्यस्थळ ब्लॉक अंमलबजावणी' },
  { en: 'IMD Doppler Radar Integration', hi: 'मौसम विभाग (IMD) डॉपलर रडार एकीकरण', mr: 'हवामान विभाग (IMD) डॉपलर रडार एकत्रीकरण' },
  { en: 'Department Trust & Integrity Matrix', hi: 'विभाग विश्वास एवं सत्यनिष्ठा मैट्रिक्स', mr: 'विभाग विश्वास व अखंडता मॅट्रिक्स' },
  { en: 'Voice Dispatch Terminal', hi: 'वॉइस डिस्पैच टर्मिनल', mr: 'व्हॉईस डिस्पॅच टर्मिनल' },
  { en: 'Station 3D Digital Twin', hi: 'स्टेशन ३डी डिजिटल ट्विन', mr: 'स्थानक ३डी डिजिटल ट्विन' },
  { en: 'Financial & Operational Dividend', hi: 'वित्तीय एवं परिचालन लाभांश', mr: 'आर्थिक व वाहतूक लाभांश' },
  { en: 'Crew Duty Limit Guard', hi: 'क्रू ड्यूटी सीमा रक्षक', mr: 'क्रू ड्यूटी मर्यादा रक्षक' },
  { en: 'Geofence Safety Interlock', hi: 'जियोफेंस सुरक्षा लॉक', mr: 'जिओफेन्स सुरक्षा कुलूप' },
  { en: 'Live Weather & TSR Engine', hi: 'लाइव मौसम व टीएसआर इंजन', mr: 'थेट हवामान व टीएसआर इंजिन' },
  { en: 'Bina Junction (BINA)', hi: 'बीना जंक्शन (BINA)', mr: 'बीना जंक्शन (BINA)' },
  { en: 'Itarsi Junction (ET)', hi: 'इटारसी जंक्शन (ET)', mr: 'इटारसी जंक्शन (ET)' },
  { en: 'Bhopal Junction (BPL)', hi: 'भोपाल जंक्शन (BPL)', mr: 'भोपाळ जंक्शन (BPL)' },
  { en: 'Rani Kamlapati (RKMP)', hi: 'रानी कमलापति (RKMP)', mr: 'राणी कमलापती (RKMP)' },
  { en: 'BINA – ET SECTION', hi: 'बीना - इटारसी खंड (१५२.४ किमी)', mr: 'बीना - इटारसी विभाग (१५२.४ किमी)' },
  { en: 'Bina – Itarsi Section', hi: 'बीना - इटारसी खंड', mr: 'बीना - इटारसी विभाग' },
  { en: 'Corridor Overview', hi: 'गलियारा अवलोकन (डैशबोर्ड)', mr: 'मार्ग विहंगावलोकन (डॅशबोर्ड)' },
  { en: 'Live Operations & Block Schedule Dashboard', hi: 'लाइव संचालन एवं ब्लॉक समय-सारिणी', mr: 'थेट कामकाज आणि ब्लॉक वेळापत्रक' },
  { en: 'Marey Time-Space Diagram', hi: 'मारे समय-दूरी आरेख', mr: 'मारे वेळ-अंतर आकृती' },
  { en: 'Interactive Stringline Timetable & Block Bands (D3.js)', hi: 'इंटरएक्टिव समय-सारिणी एवं ब्लॉक बैंड (D3.js)', mr: 'परस्परसंवादी वेळापत्रक आणि ब्लॉक पट्टे (D3.js)' },
  { en: 'Block Demands', hi: 'अनुरक्षण ब्लॉक मांगें', mr: 'देखभाल ब्लॉक मागण्या' },
  { en: 'TMS, SMMS & TDMS Maintenance Requests', hi: 'टीएमएस, एसएमएमएस एवं टीडीएमएस अनुरक्षण अनुरोध', mr: 'टीएमएस, एसएमएमएस आणि टीडीएमएस विनंत्या' },
  { en: 'AI Scheduling Cockpit', hi: 'एआई शेड्यूलिंग कॉकपिट', mr: 'एआय शेड्यूलिंग कॉकपिट' },
  { en: 'CP-SAT Optimization & Explainable Reasoning (XAI)', hi: 'सीपी-सैट अनुकूलन एवं व्याख्यात्मक निर्णय (XAI)', mr: 'सीपी-सॅट ऑप्टिमायझेशन आणि स्पष्टीकरण (XAI)' },
  { en: 'Multi-Department Lifecycle Pipeline', hi: 'बहु-विभागीय स्वीकृति पाइपलाइन', mr: 'बहु-विभागीय मंजुरी पाइपलाइन' },
  { en: 'Six-Stage Request to Completion Governance', hi: 'छह-चरणीय अनुरक्षण गवर्नेंस प्रक्रिया', mr: 'सहा-टप्प्यांची मंजुरी प्रक्रिया' },
  { en: 'Station 3D Yard Twin', hi: 'स्टेशन ३डी यार्ड डिजिटल ट्विन', mr: 'स्थानक ३डी यार्ड डिजिटल ट्विन' },
  { en: 'Three.js Spatial Interlocking & Point Machine Status', hi: 'स्थानिक इंटरलॉकिंग एवं पॉइंट मशीन स्थिति (Three.js)', mr: 'इंटरलॉकिंग आणि पॉइंट मशीन स्थिती (Three.js)' },
  { en: 'Department Trust Matrix', hi: 'विभाग विश्वास एवं अनुशासन मैट्रिक्स', mr: 'विभाग विश्वास व शिस्त मॅट्रिक्स' },
  { en: 'P-Way, OHE, S&T Reliability & Punctuality Scoring', hi: 'पी-वे, ओएचई व सिग्नलिंग विश्वसनीयता स्कोर', mr: 'पी-वे, ओएचई आणि सिग्नलिंग विश्वासार्हता गुण' },
  { en: 'System Settings & Safety Constraints', hi: 'सिस्टम सेटिंग्स एवं सुरक्षा नियम', mr: 'सिस्टम सेटिंग्ज आणि सुरक्षा नियम' },
  { en: 'Corridor Parameters, Kavach Thresholds & Solver Tuning', hi: 'गलियारा पैरामीटर, कवच नियम एवं सॉल्वर ट्यूनिंग', mr: 'कॉरिडॉर मापदंड, कवच नियम आणि सॉल्वर ट्युनिंग' },
  { en: 'Crew Overtime Averted', hi: 'क्रू ओवरटाइम बचत', mr: 'क्रू ओव्हरटाईम बचत' },
  { en: 'Energy Recovery', hi: 'ऊर्जा पुनर्चक्रण', mr: 'ऊर्जा पुनर्प्राप्ती' },
  { en: 'Track Availability Boost', hi: 'ट्रैक उपलब्धता वृद्धि', mr: 'ट्रॅक उपलब्धता वाढ' },
  { en: 'Simulate Cloudburst', hi: 'बादल फटना सिमुलेट करें', mr: 'ढगफुटी सिम्युलेट करा' },
  { en: 'Simulate Heavy Rain', hi: 'भारी बारिश सिमुलेट करें', mr: 'मुसळधार पाऊस सिम्युलेट करा' },
  { en: 'HOER Rules Section 130', hi: 'एचओईआर नियम धारा १३०', mr: 'एचओईआर नियम कलम १३०' },
  { en: 'Signal & Telecommunication', hi: 'सिग्नल एवं दूरसंचार (एस एंड टी)', mr: 'सिग्नल व दूरसंचार' },
  { en: 'Permanent Way', hi: 'स्थायी मार्ग (पी-वे)', mr: 'रेल्वे मार्ग (पी-वे)' },
  { en: 'Overhead Equipment', hi: 'विद्युत तार (ओएचई)', mr: 'विद्युत उपकरणे (ओएचई)' },
  { en: 'Standard Scenario', hi: 'मानक परिदृश्य', mr: 'प्रमाणित परिस्थिती' },
  { en: 'Aggressive Scenario', hi: 'आक्रामक परिदृश्य', mr: 'आक्रमक परिस्थिती' },
  { en: 'Chaos Scenario', hi: 'आपातकालीन परिदृश्य', mr: 'आणीबाणी परिस्थिती' },
  { en: 'Up Line', hi: 'अप लाइन', mr: 'अप लाईन' },
  { en: 'Down Line', hi: 'डाउन लाइन', mr: 'डाउन लाईन' },
  { en: 'Both Lines', hi: 'दोनों लाइनें', mr: 'दोन्ही लाईन्स' },
  { en: 'Start Time', hi: 'प्रारंभ समय', mr: 'सुरुवात वेळ' },
  { en: 'End Time', hi: 'समाप्ति समय', mr: 'समाप्ती वेळ' },
  { en: 'Speed Limit', hi: 'गति सीमा', mr: 'वेग मर्यादा' },
  { en: 'Run Solver', hi: 'सॉल्वर चलाएं', mr: 'सॉल्वर सुरू करा' },
  { en: 'Solve Now', hi: 'अभी हल करें', mr: 'आता सोडवा' },
  { en: 'Add Demand', hi: 'मांग जोड़ें', mr: 'मागणी जोडा' },
  { en: 'Filter Demands', hi: 'मांगें फ़िल्टर करें', mr: 'मागण्या फिल्टर करा' },
  { en: 'Search demands...', hi: 'मांगें खोजें...', mr: 'मागण्या शोधा...' },
  { en: 'Search station...', hi: 'स्टेशन खोजें...', mr: 'स्थानक शोधा...' },
  { en: 'Audit Trail', hi: 'ऑडिट ट्रेल', mr: 'ऑडिट ट्रेल' },
  { en: 'System Connected', hi: 'सिस्टम कनेक्टेड', mr: 'सिस्टम जोडलेली आहे' },
  { en: 'System Disconnected', hi: 'सिस्टम डिस्कनेक्टेड', mr: 'सिस्टम खंडित आहे' },
  { en: 'Last Solve', hi: 'अंतिम समाधान', mr: 'शेवटचे निराकरण' },
  { en: 'Optimality Gap', hi: 'सर्वोत्तमता अंतराल', mr: 'सर्वोत्तम अंतर' },
  { en: 'Confidence Score', hi: 'विश्वास स्कोर', mr: 'विश्वास गुण' },
];

// Sort multi-word phrases by length descending to match longest matches first
RAILWAY_PHRASES.sort((a, b) => b.en.length - a.en.length);

// ============================================================================
// 2. SINGLE WORDS & RAILWAY LEXICON (Case-insensitive word token translation)
// ============================================================================
export const SINGLE_WORDS_DICT: Record<string, { hi: string; mr: string }> = {
  co: { hi: 'सह', mr: 'सह' },
  traffic: { hi: 'यातायात', mr: 'वाहतूक' },
  scheduled: { hi: 'निर्धारित', mr: 'नियोजित' },
  equipped: { hi: 'सुसज्जित', mr: 'सज्ज' },
  paths: { hi: 'मार्ग', mr: 'मार्ग' },
  emergency: { hi: 'आपातकालीन', mr: 'आणीबाणी' },
  dispatch: { hi: 'डिस्पैच', mr: 'डिस्पॅच' },
  dispatches: { hi: 'डिस्पैच', mr: 'डिस्पॅच' },
  simulator: { hi: 'सिम्युलेटर', mr: 'सिम्युलेटर' },
  required: { hi: 'आवश्यक', mr: 'आवश्यक' },
  engine: { hi: 'इंजन', mr: 'इंजिन' },
  way: { hi: 'मार्ग', mr: 'मार्ग' },
  limit: { hi: 'सीमा', mr: 'मर्यादा' },
  solve: { hi: 'हल करें', mr: 'सोडवा' },
  scenario: { hi: 'परिदृश्य', mr: 'परिस्थिती' },
  scenarios: { hi: 'परिदृश्य', mr: 'परिस्थिती' },
  over: { hi: 'अधिक', mr: 'जास्त' },
  avoided: { hi: 'टाला गया', mr: 'टाळले' },
  express: { hi: 'एक्सप्रेस', mr: 'जलद' },
  averted: { hi: 'टाला गया', mr: 'टाळले' },
  scheduler: { hi: 'शेड्यूलर', mr: 'शेड्युलर' },
  injection: { hi: 'इंजेक्शन', mr: 'समाविष्ट' },
  position: { hi: 'स्थिति', mr: 'स्थान' },
  consolidation: { hi: 'समेकन', mr: 'एकत्रीकरण' },
  past: { hi: 'पार', mr: 'पार' },
  de: { hi: 'डी', mr: 'डी' },
  non: { hi: 'गैर', mr: 'गैर' },
  conventional: { hi: 'पारंपरिक', mr: 'पारंपारिक' },
  recovery: { hi: 'पुनर्प्राप्ति', mr: 'पुनर्प्राप्ती' },
  requirement: { hi: 'आवश्यकता', mr: 'गरज' },
  ping: { hi: 'सक्रिय सिग्नल', mr: 'सक्रिय सिग्नल' },
  real: { hi: 'वास्तविक', mr: 'वास्तविक' },
  rule: { hi: 'नियम', mr: 'नियम' },
  inspector: { hi: 'निरीक्षक', mr: 'निरीक्षक' },
  shan: { hi: 'शान', mr: 'शान' },
  legal: { hi: 'कानूनी', mr: 'कायदेशीर' },
  extracted: { hi: 'निकाला गया', mr: 'काढलेले' },
  automatically: { hi: 'स्वचालित रूप से', mr: 'स्वयंचलितपणे' },
  routed: { hi: 'मार्गनिर्देशित', mr: 'मार्गनिर्देशित' },
  iterations: { hi: 'पुनरावृत्तियां', mr: 'फेऱ्या' },
  personnel: { hi: 'कर्मचारी', mr: 'कर्मचारी' },
  inside: { hi: 'अंदर', mr: 'आत' },
  complete: { hi: 'पूर्ण', mr: 'पूर्ण' },
  consumes: { hi: 'खपत करता है', mr: 'खर्च करतो' },
  xxx: { hi: 'XXX', mr: 'XXX' },
  lt: { hi: '<', mr: '<' },
  gt: { hi: '>', mr: '>' },
  trainleftpct: { hi: '', mr: '' },
  abatement: { hi: 'कमी', mr: 'कपात' },
  across: { hi: 'भर में', mr: 'मध्ये' },
  action: { hi: 'कार्रवाई', mr: 'कृती' },
  actions: { hi: 'कार्रवाई', mr: 'कृती' },
  active: { hi: 'सक्रिय', mr: 'सक्रिय' },
  activity: { hi: 'गतिविधि', mr: 'कामकाज' },
  actual: { hi: 'वास्तविक', mr: 'प्रत्यक्ष' },
  add: { hi: 'जोड़ें', mr: 'जोडा' },
  adhesion: { hi: 'आसंजन (पकड़)', mr: 'चाकाची पकड' },
  advance: { hi: 'अग्रिम', mr: 'आगाऊ' },
  advanced: { hi: 'उन्नत', mr: 'प्रगत' },
  after: { hi: 'के बाद', mr: 'नंतर' },
  against: { hi: 'के विरुद्ध', mr: 'विरुद्ध' },
  aggressive: { hi: 'आक्रामक', mr: 'आक्रमक' },
  ago: { hi: 'पहले', mr: 'पूर्वी' },
  ai: { hi: 'एआई', mr: 'एआय' },
  alert: { hi: 'सतर्कता', mr: 'सावधानता' },
  alerts: { hi: 'सूचनाएं', mr: 'सूचना' },
  alignment: { hi: 'संरेखण', mr: 'संरेखन' },
  all: { hi: 'सभी', mr: 'सर्व' },
  ambient: { hi: 'वातावरणीय', mr: 'वातावरणीय' },
  an: { hi: 'एक', mr: 'एक' },
  and: { hi: 'और', mr: 'आणि' },
  approve: { hi: 'स्वीकृत करें', mr: 'मंजूर करा' },
  approved: { hi: 'स्वीकृत', mr: 'मंजूर' },
  are: { hi: 'हैं', mr: 'आहेत' },
  aspect: { hi: 'संकेत', mr: 'संकेत' },
  assigned: { hi: 'आवंटित', mr: 'नेमून दिलेले' },
  assistant: { hi: 'सहायक', mr: 'सहाय्यक' },
  at: { hi: 'पर', mr: 'येथे' },
  atmospheric: { hi: 'वायुमंडलीय', mr: 'वातावरणीय' },
  audit: { hi: 'ऑडिट', mr: 'ऑडिट' },
  authorization: { hi: 'प्राधिकरण', mr: 'प्राधिकरण' },
  authorize: { hi: 'अधिकृत करें', mr: 'अधिकृत करा' },
  authorized: { hi: 'अधिकृत', mr: 'अधिकृत' },
  auto: { hi: 'ऑटो', mr: 'ऑटो' },
  automated: { hi: 'स्वचालित', mr: 'स्वयंचलित' },
  automatic: { hi: 'स्वचालित', mr: 'स्वयंचलित' },
  avg: { hi: 'औसत', mr: 'सरासरी' },
  back: { hi: 'वापस', mr: 'मागे' },
  balanced: { hi: 'संतुलित', mr: 'संतुलित' },
  ballast: { hi: 'बैलास्ट (गिट्टी)', mr: 'खडी' },
  bamora: { hi: 'बामोरा', mr: 'बामोरा' },
  band: { hi: 'बैंड', mr: 'पट्टा' },
  bcm: { hi: 'बीसीएम', mr: 'बीसीएम' },
  be: { hi: 'होना', mr: 'असणे' },
  before: { hi: 'से पहले', mr: 'पूर्वी' },
  best: { hi: 'सर्वोत्तम', mr: 'सर्वोत्कृष्ट' },
  between: { hi: 'के बीच', mr: 'दरम्यान' },
  bharat: { hi: 'भारत', mr: 'भारत' },
  bhopal: { hi: 'भोपाल', mr: 'भोपाळ' },
  bina: { hi: 'बीना', mr: 'बीना' },
  block: { hi: 'ब्लॉक', mr: 'ब्लॉक' },
  blocks: { hi: 'ब्लॉक', mr: 'ब्लॉक' },
  board: { hi: 'बोर्ड', mr: 'बोर्ड' },
  bonus: { hi: 'बोनस', mr: 'बोनस' },
  bound: { hi: 'की ओर', mr: 'च्या दिशेने' },
  boxn: { hi: 'बीओएक्सएन', mr: 'बीओएक्सएन' },
  bpl: { hi: 'भोपाल (BPL)', mr: 'भोपाळ (BPL)' },
  breach: { hi: 'उल्लंघन', mr: 'उल्लंघन' },
  breakdown: { hi: 'खराबी', mr: 'बिघाड' },
  buffer: { hi: 'बफर', mr: 'बफर' },
  by: { hi: 'द्वारा', mr: 'द्वारे' },
  camera: { hi: 'कैमरा', mr: 'कॅमेरा' },
  cancel: { hi: 'रद्द करें', mr: 'रद्द करा' },
  cancelled: { hi: 'रद्द', mr: 'रद्द' },
  candidate: { hi: 'उम्मीदवार', mr: 'उमेदवार' },
  cannot: { hi: 'नहीं किया जा सकता', mr: 'केले जाऊ शकत नाही' },
  carbon: { hi: 'कार्बन', mr: 'कार्बन' },
  centre: { hi: 'केंद्र', mr: 'केंद्र' },
  chaos: { hi: 'अराजकता', mr: 'गोंधळ' },
  chart: { hi: 'चार्ट', mr: 'आलेख' },
  checklist: { hi: 'जांच सूची', mr: 'तपासणी सूची' },
  chips: { hi: 'चिप्स', mr: 'टॅग्स' },
  clamped: { hi: 'क्लैंप किया गया', mr: 'क्लॅम्प केलेले' },
  clash: { hi: 'टकराव', mr: 'संघर्ष' },
  clashes: { hi: 'टकराव', mr: 'संघर्ष' },
  clean: { hi: 'साफ', mr: 'स्वच्छ' },
  cleaning: { hi: 'सफाई', mr: 'स्वच्छता' },
  clear: { hi: 'क्लियर', mr: 'मोकळा' },
  clearance: { hi: 'निकासी', mr: 'मंजुरी' },
  cleared: { hi: 'क्लियर किया गया', mr: 'मार्ग मोकळा केला' },
  click: { hi: 'क्लिक करें', mr: 'क्लिक करा' },
  close: { hi: 'बंद करें', mr: 'बंद करा' },
  closed: { hi: 'बंद', mr: 'बंद' },
  coa: { hi: 'सीओए', mr: 'सीओए' },
  cockpit: { hi: 'कॉकपिट', mr: 'कॉकपिट' },
  code: { hi: 'कोड', mr: 'कोड' },
  collar: { hi: 'कॉलर', mr: 'कॉलर' },
  commercial: { hi: 'वाणिज्य', mr: 'वाणिज्य' },
  commissioned: { hi: 'सक्रिय', mr: 'कार्यान्वित' },
  completed: { hi: 'संपन्न', mr: 'पूर्ण' },
  compliance: { hi: 'अनुपालन', mr: 'पालन' },
  confirm: { hi: 'पुष्टि करें', mr: 'पुष्टी करा' },
  conflicts: { hi: 'विरोध', mr: 'संघर्ष' },
  connected: { hi: 'कनेक्टेड', mr: 'जोडलेले' },
  consecutive: { hi: 'लगातार', mr: 'सलग' },
  consequences: { hi: 'परिणाम', mr: 'परिणाम' },
  conservation: { hi: 'बचत', mr: 'बचत' },
  constraint: { hi: 'प्रतिबंध / नियम', mr: 'अडचण / नियम' },
  contact: { hi: 'संपर्क', mr: 'संपर्क' },
  contiguous: { hi: 'सटा हुआ', mr: 'सलग' },
  controller: { hi: 'नियंत्रक', mr: 'नियंत्रक' },
  coordinate: { hi: 'समन्वय करें', mr: 'समन्वय करा' },
  corridor: { hi: 'गलियारा', mr: 'कॉरिडॉर' },
  corridors: { hi: 'गलियारे', mr: 'कॉरिडॉर' },
  cost: { hi: 'लागत', mr: 'खर्च' },
  cp: { hi: 'सीपी', mr: 'सीपी' },
  cpsat: { hi: 'सीपी-सैट', mr: 'सीपी-सॅट' },
  create: { hi: 'बनाएं', mr: 'तयार करा' },
  crew: { hi: 'क्रू दल', mr: 'कर्मचारी दल' },
  cris: { hi: 'क्रिस (CRIS)', mr: 'क्रिस (CRIS)' },
  critical: { hi: 'अतिगंभीर', mr: 'अतिगंभीर' },
  crossing: { hi: 'क्रॉसिंग', mr: 'क्रॉसिंग' },
  ctc: { hi: 'सीटीसी', mr: 'सीटीसी' },
  current: { hi: 'वर्तमान', mr: 'सध्याचे' },
  cycle: { hi: 'चक्र', mr: 'चक्र' },
  danger: { hi: 'खतरा', mr: 'धोका' },
  dashboard: { hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड' },
  date: { hi: 'दिनांक', mr: 'तारीख' },
  daytime: { hi: 'दिन का समय', mr: 'दिवसाची वेळ' },
  debt: { hi: 'लागत', mr: 'कर्ज' },
  deep: { hi: 'गहन', mr: 'खोलवर' },
  delay: { hi: 'विलंब', mr: 'उशीर' },
  delays: { hi: 'विलंब', mr: 'उशीर' },
  delete: { hi: 'हटाएं', mr: 'हटवा' },
  demand: { hi: 'मांग', mr: 'मागणी' },
  demands: { hi: 'मांगें', mr: 'मागण्या' },
  demo: { hi: 'डेमो', mr: 'डेमो' },
  demurrage: { hi: 'विलंब शुल्क (डेमरेज)', mr: 'विलंब शुल्क' },
  department: { hi: 'विभाग', mr: 'विभाग' },
  departments: { hi: 'विभाग', mr: 'विभाग' },
  dept: { hi: 'विभाग', mr: 'विभाग' },
  describe: { hi: 'वर्णन करें', mr: 'वर्णन करा' },
  description: { hi: 'विवरण', mr: 'वर्णन' },
  details: { hi: 'विवरण', mr: 'तपशील' },
  detected: { hi: 'पाया गया', mr: 'आढळले' },
  deviation: { hi: 'विचलन', mr: 'फरक' },
  device: { hi: 'उपकरण', mr: 'यंत्र' },
  diesel: { hi: 'डीजल', mr: 'डिझेल' },
  digitaltwin: { hi: 'डिजिटल ट्विन', mr: 'डिजिटल ट्विन' },
  direction: { hi: 'दिशा', mr: 'दिशा' },
  directorate: { hi: 'निदेशालय', mr: 'संचालनालय' },
  discipline: { hi: 'अनुशासन', mr: 'शिस्त' },
  disconnected: { hi: 'डिस्कनेक्टेड', mr: 'खंडित' },
  disconnection: { hi: 'विच्छेदन', mr: 'खंडित करणे' },
  disruption: { hi: 'व्यवधान', mr: 'अडथळा' },
  distance: { hi: 'दूरी', mr: 'अंतर' },
  dividend: { hi: 'लाभांश', mr: 'लाभांश' },
  done: { hi: 'पूर्ण', mr: 'झाले' },
  double: { hi: 'दोहरा', mr: 'दुहेरी' },
  down: { hi: 'डाउन', mr: 'डाउन' },
  downline: { hi: 'डाउन लाइन', mr: 'डाउन लाईन' },
  downtime: { hi: 'डाउनटाइम', mr: 'डाउनटाइम' },
  drag: { hi: 'खींचें', mr: 'ड्रॅग करा' },
  duration: { hi: 'अवधि', mr: 'कालावधी' },
  duty: { hi: 'ड्यूटी', mr: 'कर्तव्य' },
  each: { hi: 'प्रत्येक', mr: 'प्रत्येक' },
  edit: { hi: 'संपादित करें', mr: 'संपादित करा' },
  efficiency: { hi: 'दक्षता', mr: 'कार्यक्षमता' },
  electrical: { hi: 'विद्युत', mr: 'विद्युत' },
  eligible: { hi: 'पात्र', mr: 'पात्र' },
  employment: { hi: 'ड्यूटी', mr: 'नोकरी' },
  end: { hi: 'समाप्ति', mr: 'शेवट' },
  energy: { hi: 'ऊर्जा', mr: 'ऊर्जा' },
  enforced: { hi: 'लागू', mr: 'अंमलात आणले' },
  engineer: { hi: 'अभियंता', mr: 'अभियंता' },
  engineering: { hi: 'इंजीनियरिंग', mr: 'अभियांत्रिकी' },
  equivalent: { hi: 'समतुल्य', mr: 'सममूल्य' },
  et: { hi: 'इटारसी (ET)', mr: 'इटारसी (ET)' },
  execute: { hi: 'निष्पादित करें', mr: 'अंमलात आणा' },
  executed: { hi: 'निष्पादित', mr: 'अंमलात आणले' },
  executing: { hi: 'जारी है', mr: 'सुरू आहे' },
  exp: { hi: 'एक्सप्रेस', mr: 'जलद' },
  explainability: { hi: 'व्याख्यात्मकता', mr: 'स्पष्टीकरण क्षमता' },
  export: { hi: 'निर्यात', mr: 'निर्यात' },
  extra: { hi: 'अतिरिक्त', mr: 'अतिरिक्त' },
  failed: { hi: 'विफल', mr: 'अयशस्वी' },
  fast: { hi: 'तेज', mr: 'जलद' },
  fatigue: { hi: 'थकान', mr: 'थकवा' },
  filter: { hi: 'फ़िल्टर', mr: 'फिल्टर' },
  first: { hi: 'पहला', mr: 'पहिले' },
  fog: { hi: 'कोहरा', mr: 'धुके' },
  fois: { hi: 'एफओआईएस (FOIS)', mr: 'एफओआईएस (FOIS)' },
  for: { hi: 'के लिए', mr: 'साठी' },
  form: { hi: 'फॉर्म', mr: 'अर्ज' },
  formal: { hi: 'औपचारिक', mr: 'औपचारिक' },
  formula: { hi: 'सूत्र', mr: 'सूत्र' },
  freight: { hi: 'मालगाड़ी', mr: 'मालगाडी' },
  from: { hi: 'से', mr: 'पासून' },
  fuel: { hi: 'ईंधन', mr: 'इंधन' },
  gain: { hi: 'लाभ', mr: 'नफा' },
  gang: { hi: 'ट्रैकमैन गैंग', mr: 'गॅंग' },
  gangkm: { hi: 'गैंग किमी', mr: 'गॅंग किमी' },
  gap: { hi: 'अंतर', mr: 'अंतर' },
  gauge: { hi: 'गेज', mr: 'गेज' },
  geofence: { hi: 'जियोफेंस', mr: 'जिओफेन्स' },
  goods: { hi: 'माल', mr: 'माल' },
  gps: { hi: 'जीपीएस', mr: 'जीपीएस' },
  gr: { hi: 'जीआर', mr: 'जीआर' },
  granted: { hi: 'स्वीकृत', mr: 'मंजूर' },
  green: { hi: 'हरा', mr: 'हिरवा' },
  guard: { hi: 'गार्ड', mr: 'रक्षक' },
  halt: { hi: 'ठहराव', mr: 'थांबा' },
  halts: { hi: 'ठहराव', mr: 'थांबे' },
  harmonize: { hi: 'सामंजस्य', mr: 'समन्वय' },
  harvest: { hi: 'लाभ', mr: 'लाभ' },
  hazard: { hi: 'खतरा', mr: 'धोका' },
  headway: { hi: 'हेडवे', mr: 'हेडवे' },
  headways: { hi: 'हेडवे', mr: 'हेडवे' },
  heartbeat: { hi: 'हार्टबीट', mr: 'हार्टबीट' },
  held: { hi: 'रोका गया', mr: 'थांबवले' },
  high: { hi: 'उच्च', mr: 'उच्च' },
  historical: { hi: 'ऐतिहासिक', mr: 'ऐतिहासिक' },
  hoer: { hi: 'एचओईआर', mr: 'एचओईआर' },
  hour: { hi: 'घंटा', mr: 'तास' },
  hours: { hi: 'घंटे', mr: 'तास' },
  hover: { hi: 'होवर करें', mr: 'होव्हर करा' },
  hrs: { hi: 'घंटे', mr: 'तास' },
  hsd: { hi: 'हाई-स्पीड डीजल', mr: 'हाय-स्पीड डिझेल' },
  hub: { hi: 'हब', mr: 'केंद्र' },
  ibms: { hi: 'आईबीएमएस', mr: 'आईबीएमएस' },
  icms: { hi: 'आईसीएमएस (ICMS)', mr: 'आईसीएमएस (ICMS)' },
  id: { hi: 'आईडी', mr: 'आयडी' },
  idle: { hi: 'निष्क्रिय', mr: 'निष्क्रिय' },
  imd: { hi: 'मौसम विभाग (IMD)', mr: 'हवामान विभाग (IMD)' },
  immutable: { hi: 'अपरिवर्तनीय', mr: 'अपरिवर्तनीय' },
  impact: { hi: 'प्रभाव', mr: 'प्रभाव' },
  import: { hi: 'आयात', mr: 'आयात' },
  in: { hi: 'में', mr: 'मध्ये' },
  indian: { hi: 'भारतीय', mr: 'भारतीय' },
  information: { hi: 'सूचना', mr: 'माहिती' },
  insat: { hi: 'इनसैट', mr: 'इनसैट' },
  inspect: { hi: 'निरीक्षण करें', mr: 'तपासणी करा' },
  inspection: { hi: 'निरीक्षण', mr: 'तपासणी' },
  integrated: { hi: 'एकीकृत', mr: 'एकात्मिक' },
  interlock: { hi: 'इंटरलाक', mr: 'इंटरलॉक' },
  interlocking: { hi: 'इंटरलॉकिंग', mr: 'इंटरलॉकिंग' },
  irnss: { hi: 'आईआरएनएसएस', mr: 'आईआरएनएसएस' },
  is: { hi: 'है', mr: 'आहे' },
  isolated: { hi: 'अलग किया गया', mr: 'वेगळे केलेले' },
  itarsi: { hi: 'इटारसी', mr: 'इटारसी' },
  jarvis: { hi: 'जार्विस एआई', mr: 'जार्विस एआय' },
  jn: { hi: 'जंक्शन', mr: 'जंक्शन' },
  junction: { hi: 'जंक्शन', mr: 'जंक्शन' },
  kavach: { hi: 'कवच', mr: 'कवच' },
  kg: { hi: 'किग्रा', mr: 'किग्रॅ' },
  kinetic: { hi: 'गतिज', mr: 'गतिज' },
  km: { hi: 'किमी', mr: 'किमी' },
  language: { hi: 'भाषा', mr: 'भाषा' },
  last: { hi: 'अंतिम', mr: 'शेवटचे' },
  latency: { hi: 'विलंबता', mr: 'लेटन्सी' },
  lifecycle: { hi: 'स्वीकृति चक्र', mr: 'मंजुरी चक्र' },
  lighting: { hi: 'प्रकाश', mr: 'दिवाबत्ती' },
  line: { hi: 'लाइन', mr: 'लाईन' },
  lines: { hi: 'लाइनें', mr: 'लाईन्स' },
  liters: { hi: 'लीटर', mr: 'लिटर' },
  live: { hi: 'लाइव', mr: 'थेट' },
  location: { hi: 'स्थान', mr: 'स्थान' },
  locked: { hi: 'सुरक्षित लॉक', mr: 'सुरक्षित कुलूप' },
  loco: { hi: 'लोकोमोटिव (इंजन)', mr: 'इंजिन' },
  locomotive: { hi: 'इंजन', mr: 'इंजिन' },
  log: { hi: 'लॉग', mr: 'लॉग' },
  loop: { hi: 'लूप लाइन', mr: 'लूप लाईन' },
  loops: { hi: 'लूप लाइनें', mr: 'लूप लाईन्स' },
  low: { hi: 'निम्न', mr: 'कमी' },
  machine: { hi: 'मशीन', mr: 'यंत्र' },
  machinery: { hi: 'मशीनरी', mr: 'यंत्रसामग्री' },
  machines: { hi: 'मशीनें', mr: 'यंत्रे' },
  mail: { hi: 'मेल', mr: 'मेल' },
  main: { hi: 'मुख्य', mr: 'मुख्य' },
  maintenance: { hi: 'अनुरक्षण', mr: 'देखभाल' },
  manage: { hi: 'प्रबंधन करें', mr: 'व्यवस्थापित करा' },
  management: { hi: 'प्रबंधन', mr: 'व्यवस्थापन' },
  mandi: { hi: 'मंडी', mr: 'मंडी' },
  manual: { hi: 'मैन्युअल', mr: 'मॅन्युअल' },
  marey: { hi: 'मारे चार्ट', mr: 'मारे चार्ट' },
  master: { hi: 'मास्टर', mr: 'प्रबंधक' },
  matrix: { hi: 'मैट्रिक्स', mr: 'मॅट्रिक्स' },
  mechanical: { hi: 'यांत्रिक', mr: 'यांत्रिकी' },
  medium: { hi: 'मध्यम', mr: 'मध्यम' },
  menu: { hi: 'मेनू', mr: 'मेनू' },
  merge: { hi: 'विलय', mr: 'विलीनीकरण' },
  merges: { hi: 'विलय', mr: 'विलीनीकरण' },
  metric: { hi: 'मापदंड', mr: 'मापदंड' },
  metrics: { hi: 'मापदंड', mr: 'मापदंड' },
  min: { hi: 'मिनट', mr: 'मिनिट' },
  ministry: { hi: 'मंत्रालय', mr: 'मंत्रालय' },
  mins: { hi: 'मिनट', mr: 'मिनिटे' },
  minute: { hi: 'मिनट', mr: 'मिनिट' },
  minutes: { hi: 'मिनट', mr: 'मिनिटे' },
  modal: { hi: 'संवाद बॉक्स', mr: 'संवाद खिडकी' },
  mode: { hi: 'मोड', mr: 'मोड' },
  mouse: { hi: 'माउस', mr: 'माउस' },
  move: { hi: 'आगे बढ़ें', mr: 'पुढे चला' },
  movement: { hi: 'आवागमन', mr: 'हालचाल' },
  navic: { hi: 'नाविक (NavIC)', mr: 'नाविक (NavIC)' },
  navigation: { hi: 'नेविगेशन', mr: 'नेव्हिगेशन' },
  nbsp: { hi: ' ', mr: ' ' },
  new: { hi: 'नया', mr: 'नवीन' },
  newkm: { hi: 'नया किमी', mr: 'नवीन किमी' },
  next: { hi: 'अगला', mr: 'पुढील' },
  night: { hi: 'रात', mr: 'रात्र' },
  no: { hi: 'नहीं', mr: 'नाही' },
  nominal: { hi: 'मानक', mr: 'मानक' },
  normal: { hi: 'सामान्य', mr: 'सामान्य' },
  not: { hi: 'नहीं', mr: 'नाही' },
  notifications: { hi: 'सूचनाएं', mr: 'सूचना' },
  now: { hi: 'अभी', mr: 'आता' },
  objective: { hi: 'उद्देश्य', mr: 'उद्दिष्ट' },
  of: { hi: 'का', mr: 'चे' },
  offline: { hi: 'ऑफलाइन', mr: 'ऑफलाइन' },
  ohe: { hi: 'ओएचई (विद्युत तार)', mr: 'ओएचई (विद्युत तार)' },
  ok: { hi: 'ठीक है', mr: 'ठीक आहे' },
  old: { hi: 'पुराना', mr: 'जुने' },
  on: { hi: 'पर', mr: 'वर' },
  online: { hi: 'ऑनलाइन', mr: 'ऑनलाइन' },
  open: { hi: 'खोलें', mr: 'उघडा' },
  operating: { hi: 'परिचालन', mr: 'वाहतूक' },
  opportunity: { hi: 'अवसर', mr: 'संधी' },
  optimal: { hi: 'सर्वोत्तम', mr: 'सर्वोत्कृष्ट' },
  optimized: { hi: 'अनुकूलित', mr: 'ऑप्टिमाइझ केलेले' },
  or: { hi: 'या', mr: 'किंवा' },
  out: { hi: 'बाहर', mr: 'बाहेर' },
  overhaul: { hi: 'मरम्मत', mr: 'दुरुस्ती' },
  overruns: { hi: 'अतिरिक्त समय', mr: 'ओव्हररन' },
  overstay: { hi: 'अतिरिक्त ठहराव', mr: 'अतिरिक्त मुक्काम' },
  overtime: { hi: 'ओवरटाइम', mr: 'ओव्हरटाईम' },
  overview: { hi: 'अवलोकन', mr: 'विहंगावलोकन' },
  padlocked: { hi: 'ताला लगाया गया', mr: 'कुलूप लावलेले' },
  pan: { hi: 'पैन करें', mr: 'पॅन करा' },
  parameters: { hi: 'मापदंड', mr: 'मापदंड' },
  passenger: { hi: 'सवारी (पैसेंजर)', mr: 'प्रवासी' },
  patrol: { hi: 'गश्त', mr: 'गस्त' },
  pause: { hi: 'रोकें', mr: 'थांबवा' },
  peak: { hi: 'व्यस्त समय', mr: 'गर्दीची वेळ' },
  penalty: { hi: 'जुर्माना', mr: 'दंड' },
  pending: { hi: 'लंबित', mr: 'प्रलंबित' },
  per: { hi: 'प्रति', mr: 'प्रति' },
  period: { hi: 'अवधि', mr: 'कालावधी' },
  permanent: { hi: 'स्थायी', mr: 'कायमस्वरूपी' },
  pilot: { hi: 'पायलट', mr: 'पायलट' },
  pitch: { hi: 'पिच', mr: 'पिच' },
  platform: { hi: 'प्लेटफॉर्म', mr: 'प्लॅटफॉर्म' },
  platforms: { hi: 'प्लेटफॉर्म', mr: 'प्लॅटफॉर्म' },
  point: { hi: 'पॉइंट', mr: 'पॉइंट' },
  points: { hi: 'पॉइंट्स', mr: 'पॉइंट्स' },
  possession: { hi: 'ब्लॉक अधिकार', mr: 'ब्लॉक ताबा' },
  possessions: { hi: 'ब्लॉक अधिकार', mr: 'ब्लॉक ताबा' },
  power: { hi: 'विद्युत', mr: 'विद्युत' },
  presets: { hi: 'प्रीसेट', mr: 'प्रीसेट' },
  prevent: { hi: 'रोकें', mr: 'प्रतिबंध करा' },
  previous: { hi: 'पिछला', mr: 'मागील' },
  primary: { hi: 'प्राथमिक', mr: 'प्राथमिक' },
  prioritize: { hi: 'प्राथमिकता दें', mr: 'प्राधान्य द्या' },
  priority: { hi: 'प्राथमिकता', mr: 'प्राधान्य' },
  promise: { hi: 'वचनबद्धता', mr: 'आश्वासन' },
  proposed: { hi: 'प्रस्तावित', mr: 'प्रस्तावित' },
  protected: { hi: 'संरक्षित', mr: 'संरक्षित' },
  psr: { hi: 'पीएसआर', mr: 'पीएसआर' },
  punctuality: { hi: 'समयबद्धता', mr: 'वेळ पाळणे' },
  pway: { hi: 'पी-वे (रेलमार्ग)', mr: 'पी-वे (रेलमार्ग)' },
  queue: { hi: 'कतार', mr: 'रांग' },
  quick: { hi: 'त्वरित', mr: 'जलद' },
  radar: { hi: 'रडार', mr: 'रडार' },
  rail: { hi: 'पटरी', mr: 'रेल्वे' },
  rails: { hi: 'पटरियां', mr: 'रेल्वे' },
  railway: { hi: 'रेलवे', mr: 'रेल्वे' },
  railways: { hi: 'रेलवे', mr: 'रेल्वे' },
  rain: { hi: 'बारिश', mr: 'पाऊस' },
  rainfall: { hi: 'वर्षा', mr: 'पाऊस' },
  rajdhani: { hi: 'राजधानी', mr: 'राजधानी' },
  rake: { hi: 'रेक', mr: 'रेक' },
  rakes: { hi: 'रेक', mr: 'रेक' },
  rate: { hi: 'दर', mr: 'दर' },
  rating: { hi: 'रेटिंग', mr: 'गुणांकन' },
  ratio: { hi: 'अनुपात', mr: 'गुणोत्तर' },
  rationale: { hi: 'तर्कसंगत व्याख्या', mr: 'तर्कशुद्ध स्पष्टीकरण' },
  reasoning: { hi: 'तर्क', mr: 'तर्क' },
  reduction: { hi: 'कमी / कटौती', mr: 'कपात' },
  refresh: { hi: 'रीफ्रेश करें', mr: 'रिफ्रेश करा' },
  rejected: { hi: 'अस्वीकृत', mr: 'नाकारले' },
  relief: { hi: 'राहत', mr: 'मदत' },
  replacement: { hi: 'प्रतिस्थापन', mr: 'बदलणे' },
  request: { hi: 'अनुरोध', mr: 'विनंती' },
  requested: { hi: 'अनुरोधित', mr: 'विनंती केलेले' },
  reset: { hi: 'रीसेट करें', mr: 'रीसेट करा' },
  resolve: { hi: 'समाधान करें', mr: 'सोडवा' },
  rest: { hi: 'विश्राम', mr: 'विश्रांती' },
  restoration: { hi: 'पुनर्स्थापना', mr: 'पूर्ववत करणे' },
  restriction: { hi: 'प्रतिबंध', mr: 'निर्बंध' },
  resume: { hi: 'पुनः प्रारंभ करें', mr: 'पुन्हा सुरू करा' },
  review: { hi: 'समीक्षा करें', mr: 'पुनरावलोकन करा' },
  reviewed: { hi: 'समीक्षित', mr: 'पुनरावलोकन' },
  rfid: { hi: 'आरएफआईडी', mr: 'आरएफआईडी' },
  risk: { hi: 'जोखिम', mr: 'धोका' },
  rkmp: { hi: 'रानी कमलापति (RKMP)', mr: 'राणी कमलापती (RKMP)' },
  roi: { hi: 'निवेश पर लाभ (ROI)', mr: 'गुंतवणूक परतावा (ROI)' },
  rotate: { hi: 'घुमाएं', mr: 'फिरवा' },
  route: { hi: 'मार्ग', mr: 'मार्ग' },
  routine: { hi: 'नियमित', mr: 'नियमित' },
  rtk: { hi: 'आरटीके', mr: 'आरटीके' },
  run: { hi: 'चलाएं', mr: 'सुरू करा' },
  safe: { hi: 'सुरक्षित', mr: 'सुरक्षित' },
  safety: { hi: 'सुरक्षा', mr: 'सुरक्षा' },
  same: { hi: 'समान', mr: 'सारखे' },
  sanchi: { hi: 'सांची', mr: 'सांची' },
  sat: { hi: 'सैट', mr: 'सॅट' },
  save: { hi: 'सहेजें', mr: 'जतन करा' },
  saved: { hi: 'बचत', mr: 'बचत' },
  savian: { hi: 'सावियन', mr: 'सावियन' },
  saving: { hi: 'बचत', mr: 'बचत' },
  savings: { hi: 'बचत', mr: 'बचत' },
  schedule: { hi: 'शेड्यूल', mr: 'वेळापत्रक' },
  scheduling: { hi: 'शेड्यूलिंग', mr: 'वेळापत्रक नियोजन' },
  scope: { hi: 'दायरा', mr: 'व्याप्ती' },
  score: { hi: 'स्कोर', mr: 'गुण' },
  scoring: { hi: 'स्कोरिंग', mr: 'गुणांकन' },
  screening: { hi: 'छाननी', mr: 'तपासणी' },
  scroll: { hi: 'स्क्रॉल करें', mr: 'स्क्रॉल करा' },
  search: { hi: 'खोजें', mr: 'शोधा' },
  sec: { hi: 'सेकंड', mr: 'सेकंद' },
  secondary: { hi: 'द्वितीयक', mr: 'दुय्यम' },
  seconds: { hi: 'सेकंड', mr: 'सेकंद' },
  secs: { hi: 'सेकंड', mr: 'सेकंद' },
  section: { hi: 'अनुभाग (खंड)', mr: 'विभाग' },
  sections: { hi: 'अनुभाग', mr: 'विभाग' },
  select: { hi: 'चुनें', mr: 'निवडा' },
  selection: { hi: 'चयन', mr: 'निवड' },
  session: { hi: 'सत्र', mr: 'सत्र' },
  settings: { hi: 'सेटिंग्स', mr: 'सेटिंग्ज' },
  severity: { hi: 'गंभीरता', mr: 'तीव्रता' },
  shadow: { hi: 'शैडो', mr: 'शॅडो' },
  shatabdi: { hi: 'शताब्दी', mr: 'शताब्दी' },
  sidebar: { hi: 'साइडबार', mr: 'साइडबार' },
  siding: { hi: 'साइडिंग', mr: 'साइडिंग' },
  sign: { hi: 'हस्ताक्षर करें', mr: 'स्वाक्षरी करा' },
  signal: { hi: 'सिग्नल', mr: 'सिग्नल' },
  signals: { hi: 'सिग्नल', mr: 'सिग्नल' },
  sil: { hi: 'एसआईएल', mr: 'एसआयएल' },
  simulate: { hi: 'सिमुलेट करें', mr: 'सिम्युलेट करा' },
  simulation: { hi: 'सिमुलेशन', mr: 'सिम्युलेशन' },
  sleepers: { hi: 'स्लीपर', mr: 'स्लीपर' },
  slider: { hi: 'स्लाइडर', mr: 'स्लायडर' },
  slow: { hi: 'धीमी', mr: 'हळू' },
  smms: { hi: 'एसएमएमएस (SMMS)', mr: 'एसएमएमएस (SMMS)' },
  solver: { hi: 'सॉल्वर', mr: 'सॉल्वर' },
  solving: { hi: 'गणना जारी', mr: 'गणना सुरू' },
  source: { hi: 'स्रोत', mr: 'स्रोत' },
  spacing: { hi: 'दूरी', mr: 'अंतर' },
  span: { hi: 'अवधि', mr: 'कालावधी' },
  speech: { hi: 'वाणी', mr: 'आवाज' },
  speed: { hi: 'गति', mr: 'वेग' },
  sr: { hi: 'एसआर', mr: 'एसआर' },
  sse: { hi: 'वरिष्ठ खंड अभियंता (एसएसई)', mr: 'वरिष्ठ विभाग अभियंता (एसएसई)' },
  ssekm: { hi: 'एसएसई किमी', mr: 'एसएसई किमी' },
  standard: { hi: 'मानक', mr: 'प्रमाणित' },
  start: { hi: 'प्रारंभ', mr: 'सुरुवात' },
  startkm: { hi: 'प्रारंभ किमी', mr: 'सुरुवात किमी' },
  station: { hi: 'स्टेशन', mr: 'स्थानक' },
  stations: { hi: 'स्टेशन', mr: 'स्थानके' },
  status: { hi: 'स्थिति', mr: 'स्थिती' },
  submit: { hi: 'जमा करें', mr: 'सादर करा' },
  submitted: { hi: 'जमा किया गया', mr: 'सादर केले' },
  success: { hi: 'सफल', mr: 'यशस्वी' },
  summary: { hi: 'सारांश', mr: 'सारांश' },
  switch: { hi: 'बदलें', mr: 'बदला' },
  sync: { hi: 'सिंक करें', mr: 'सिंक करा' },
  synced: { hi: 'सिंक हुआ', mr: 'सिंक झाले' },
  syncing: { hi: 'सिंक हो रहा है', mr: 'सिंक होत आहे' },
  system: { hi: 'सिस्टम', mr: 'सिस्टम' },
  systems: { hi: 'सिस्टम', mr: 'प्रणाली' },
  tamping: { hi: 'टैम्पिंग', mr: 'टॅम्पिंग' },
  tcas: { hi: 'टीकास', mr: 'टीकास' },
  tdms: { hi: 'टीडीएमएस (TDMS)', mr: 'टीडीएमएस (TDMS)' },
  telecom: { hi: 'दूरसंचार', mr: 'दूरसंचार' },
  telemetry: { hi: 'टेलीमेट्री डेटा', mr: 'टेलिमेट्री डेटा' },
  temp: { hi: 'तापमान', mr: 'तापमान' },
  temperature: { hi: 'तापमान', mr: 'तापमान' },
  test: { hi: 'परीक्षण', mr: 'चाचणी' },
  the: { hi: '', mr: '' },
  threshold: { hi: 'सीमा', mr: 'मर्यादा' },
  tier: { hi: 'श्रेणी', mr: 'श्रेणी' },
  time: { hi: 'समय', mr: 'वेळ' },
  timetable: { hi: 'समय-सारिणी', mr: 'वेळापत्रक' },
  tms: { hi: 'टीएमएस (TMS)', mr: 'टीएमएस (TMS)' },
  to: { hi: 'तक', mr: 'पर्यंत' },
  toggle: { hi: 'टॉगल करें', mr: 'टॉगल करा' },
  tokens: { hi: 'टोकन', mr: 'टोकन' },
  tonne: { hi: 'टन', mr: 'टन' },
  total: { hi: 'कुल', mr: 'एकूण' },
  tower: { hi: 'टावर (टॉवर)', mr: 'टॉवर' },
  track: { hi: 'ट्रैक', mr: 'ट्रॅक' },
  trackmen: { hi: 'ट्रैकमैन', mr: 'ट्रॅकमॅन' },
  tracks: { hi: 'ट्रैक', mr: 'ट्रॅक' },
  traction: { hi: 'विद्युत ट्रैक्शन', mr: 'ट्रॅक्शन' },
  train: { hi: 'ट्रेन (गाड़ी)', mr: 'गाडी' },
  trains: { hi: 'ट्रेनें', mr: 'गाड्या' },
  transmitted: { hi: 'भेजा गया', mr: 'पाठवले' },
  trials: { hi: 'परीक्षण', mr: 'चाचण्या' },
  trust: { hi: 'विश्वास', mr: 'विश्वास' },
  turnout: { hi: 'टर्नआउट', mr: 'टर्नआउट' },
  twilight: { hi: 'गोधूलि', mr: 'संध्याकाळ' },
  type: { hi: 'प्रकार', mr: 'प्रकार' },
  under: { hi: 'के तहत', mr: 'अंतर्गत' },
  unlock: { hi: 'अनलॉक करें', mr: 'अनलॉक करा' },
  unlocked: { hi: 'अनलॉक', mr: 'अनलॉक' },
  up: { hi: 'अप', mr: 'अप' },
  upline: { hi: 'अप लाइन', mr: 'अप लाईन' },
  utilization: { hi: 'उपयोग', mr: 'वापर' },
  utterance: { hi: 'उच्चारण', mr: 'उच्चार' },
  validated: { hi: 'सत्यापित', mr: 'प्रमाणित' },
  value: { hi: 'मूल्य', mr: 'मूल्य' },
  vande: { hi: 'वंदे', mr: 'वंदे' },
  variance: { hi: 'भिन्नता', mr: 'फरक' },
  vb: { hi: 'वंदे भारत', mr: 'वंदे भारत' },
  verification: { hi: 'सत्यापन', mr: 'पडताळणी' },
  verified: { hi: 'सत्यापित', mr: 'पडताळणी झाली' },
  verma: { hi: 'वर्मा', mr: 'वर्मा' },
  vidisha: { hi: 'विदिशा', mr: 'विदिशा' },
  view: { hi: 'देखें', mr: 'पहा' },
  violation: { hi: 'उल्लंघन', mr: 'उल्लंघन' },
  visibility: { hi: 'दृश्यता', mr: 'दृश्यमानता' },
  visualizer: { hi: 'दृश्य प्रदर्शक', mr: 'दृश्य प्रदर्शक' },
  voice: { hi: 'आवाज', mr: 'आवाज' },
  vs: { hi: 'बनाम', mr: 'विरुद्ध' },
  wagon: { hi: 'वैगन', mr: 'वॅगन' },
  wagons: { hi: 'वैगन', mr: 'वॅगन्स' },
  wait: { hi: 'प्रतीक्षा करें', mr: 'प्रतीक्षा करा' },
  wall: { hi: 'दीवार', mr: 'भिंत' },
  warning: { hi: 'चेतावनी', mr: 'इशारा' },
  wcr: { hi: 'पश्चिम मध्य रेल', mr: 'पश्चिम मध्य रेल्वे' },
  weather: { hi: 'मौसम', mr: 'हवामान' },
  weight: { hi: 'वजन (महत्व)', mr: 'वजन (महत्त्व)' },
  wheel: { hi: 'पहिया', mr: 'चाक' },
  while: { hi: 'जब', mr: 'जेव्हा' },
  will: { hi: 'होगा', mr: 'होईल' },
  wind: { hi: 'हवा की गति', mr: 'वारा' },
  window: { hi: 'समय स्लॉट (विंडो)', mr: 'वेळ स्लॉट' },
  windows: { hi: 'समय स्लॉट', mr: 'वेळ स्लॉट' },
  wire: { hi: 'तार', mr: 'तार' },
  with: { hi: 'के साथ', mr: 'सह' },
  withdraw: { hi: 'वापस लें', mr: 'मागे घ्या' },
  work: { hi: 'कार्य', mr: 'काम' },
  yard: { hi: 'यार्ड', mr: 'यार्ड' },
  yes: { hi: 'हाँ', mr: 'होय' },
  zero: { hi: 'शून्य', mr: 'शून्य' },
  zone: { hi: 'ज़ोन', mr: 'झोन' },
  zoom: { hi: 'ज़ूम करें', mr: 'झूम करा' },
};

// ============================================================================
// 3. CORE TRANSLATION ENGINE (Multi-word phrase + Token translation)
// ============================================================================

/**
 * Translates any English string into authentic Hindi or Marathi
 * Preserves numbers, HTML tags, punctuation, train numbers, and formatting
 */
export function translateText(rawText: string, targetLang: SupportedLanguage): string {
  if (!rawText || targetLang === 'en') return rawText;

  let text = rawText;

  const lang = targetLang as 'hi' | 'mr';

  // Step 1: Replace Multi-Word Phrases First (longest phrases matched first)
  for (const phrase of RAILWAY_PHRASES) {
    if (text.toLowerCase().includes(phrase.en.toLowerCase())) {
      const escaped = phrase.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const startBoundary = /^\w/.test(phrase.en) ? '\\b' : '';
      const endBoundary = /\w$/.test(phrase.en) ? '\\b' : '';
      const regex = new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'gi');
      text = text.replace(regex, phrase[lang]);
    }
  }

  // Step 2: Replace individual word tokens (preserving punctuation, brackets, numbers)
  // Matches words consisting of letters, apostrophes, and hyphens
  text = text.replace(/\b([A-Za-z]+(?:'[a-z]+)?)\b/g, (match) => {
    // If word is already Devanagari or number, leave intact
    const lower = match.toLowerCase();

    // Check if word exists in our single word dictionary
    const found = SINGLE_WORDS_DICT[lower];
    if (found) {
      return found[lang];
    }

    return match;
  });

  return text;
}

// ============================================================================
// 4. RAILWAY_DICTIONARY FOR BACKWARD COMPATIBILITY WITH t(key)
// ============================================================================
export const RAILWAY_DICTIONARY: Record<string, Record<SupportedLanguage, string>> = {};

// Populate RAILWAY_DICTIONARY with phrases and single words
for (const p of RAILWAY_PHRASES) {
  const key = p.en.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  RAILWAY_DICTIONARY[key] = { en: p.en, hi: p.hi, mr: p.mr };
  RAILWAY_DICTIONARY[p.en] = { en: p.en, hi: p.hi, mr: p.mr };
}

for (const [word, trans] of Object.entries(SINGLE_WORDS_DICT)) {
  if (!RAILWAY_DICTIONARY[word]) {
    RAILWAY_DICTIONARY[word] = { en: word, hi: trans.hi, mr: trans.mr };
  }
}

// Extra explicit keys for UI views
const EXTRA_UI_KEYS: Record<string, { hi: string; mr: string }> = {
  total_demands: { hi: 'कुल मांगें', mr: 'एकूण मागण्या' },
  shadow_savings: { hi: 'शैडो ब्लॉक बचत', mr: 'शॅडो ब्लॉक बचत' },
  train_delay_impact: { hi: 'ट्रेन विलंब प्रभाव', mr: 'गाडी उशीर प्रभाव' },
  kavach_commissioned: { hi: 'कवच चालू', mr: 'कवच कार्यान्वित' },
  reoptimize: { hi: 'पुनः अनुकूलित करें', mr: 'पुन्हा ऑप्टिमाइझ करा' },
  navigation: { hi: 'नेविगेशन', mr: 'नेव्हिगेशन' },
  bina_et_section: { hi: 'बीना - इटारसी खंड', mr: 'बीना - इटारसी विभाग' },
  dashboard: { hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड' },
  marey: { hi: 'मारे चार्ट', mr: 'मारे चार्ट' },
  demands: { hi: 'ब्लॉक मांगें', mr: 'ब्लॉक मागण्या' },
  solver: { hi: 'एआई शेड्यूलर', mr: 'एआय शेड्युलर' },
  lifecycle: { hi: 'स्वीकृति पाइपलाइन', mr: 'मंजुरी पाइपलाइन' },
  digitaltwin: { hi: '3D यार्ड ट्विन', mr: '3D यार्ड ट्विन' },
  discipline: { hi: 'अनुशासन मैट्रिक्स', mr: 'शिस्त मॅट्रिक्स' },
  settings: { hi: 'सेटिंग्स व नियम', mr: 'सेटिंग्ज' },
};

for (const [k, v] of Object.entries(EXTRA_UI_KEYS)) {
  RAILWAY_DICTIONARY[k] = { en: k, hi: v.hi, mr: v.mr };
}

// ============================================================================
// 5. REACT CONTEXT & DOM MUTATION OBSERVER
// ============================================================================
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = 'savian_rail_language_pref';

// Global WeakMaps to safely track original English text & avoid memory leaks
const originalTextMap = new WeakMap<Node, string>();
const currentTranslatedMap = new WeakMap<Node, string>();
const originalAttrMap = new WeakMap<Element, Record<string, string>>();

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Load saved preference on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
      if (savedLang === 'en' || savedLang === 'hi' || savedLang === 'mr') {
        setLanguageState(savedLang);
      }
    } catch {
      // Storage fallback
    }
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Ignored
    }
  }, []);

  // Universal t() function that works for ANY string or key
  const t = useCallback(
    (input: string): string => {
      if (!input) return input;
      if (language === 'en') {
        const entry = RAILWAY_DICTIONARY[input];
        return entry ? entry.en : input;
      }

      // Check dictionary key first
      const entry = RAILWAY_DICTIONARY[input];
      if (entry && entry[language]) {
        return entry[language];
      }

      // If not a dictionary key, translate arbitrary text using the phrase/word engine
      return translateText(input, language);
    },
    [language]
  );

  // ==========================================================================
  // DOM-LEVEL AUTOMATIC TEXT TRANSLATOR WITH MUTATION OBSERVER
  // Walks all text nodes in the page and translates them into Hindi or Marathi.
  // When switched back to 'en', restores 100% of the original English text!
  // ==========================================================================
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let isTranslating = false;

    const translateDOMNode = (root: Node) => {
      const walk = (node: Node) => {
        // Handle Element Attributes (placeholder, title, aria-label)
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName;

          // Skip non-translatable tags
          if (
            tagName === 'SCRIPT' ||
            tagName === 'STYLE' ||
            tagName === 'NOSCRIPT' ||
            tagName === 'CODE' ||
            tagName === 'PRE' ||
            el.classList?.contains('notranslate') ||
            el.getAttribute('translate') === 'no'
          ) {
            return;
          }

          // Translate tooltips and input placeholders
          for (const attr of ['placeholder', 'title']) {
            const currentVal = el.getAttribute(attr);
            if (currentVal && currentVal.trim()) {
              let origRecord = originalAttrMap.get(el);
              if (!origRecord) {
                origRecord = {};
                originalAttrMap.set(el, origRecord);
              }

              if (origRecord[attr] === undefined) {
                origRecord[attr] = currentVal;
              }

              if (language === 'en') {
                el.setAttribute(attr, origRecord[attr]);
              } else {
                const translated = translateText(origRecord[attr], language);
                el.setAttribute(attr, translated);
              }
            }
          }
        }

        // Handle Text Nodes
        if (node.nodeType === Node.TEXT_NODE) {
          const rawVal = node.nodeValue;
          if (rawVal && rawVal.trim().length > 0) {
            let orig = originalTextMap.get(node);
            const prevTrans = currentTranslatedMap.get(node);

            // If new node or updated by React with new English text
            if (orig === undefined || (prevTrans !== undefined && rawVal !== prevTrans)) {
              orig = rawVal;
              originalTextMap.set(node, orig);
            }

            if (language === 'en') {
              if (node.nodeValue !== orig) {
                node.nodeValue = orig;
              }
              currentTranslatedMap.delete(node);
            } else {
              const translated = translateText(orig, language);
              if (node.nodeValue !== translated) {
                currentTranslatedMap.set(node, translated);
                node.nodeValue = translated;
              }
            }
          }
          return;
        }

        // Recursively walk children
        let child = node.firstChild;
        while (child) {
          walk(child);
          child = child.nextSibling;
        }
      };

      walk(root);
    };

    const runTranslation = () => {
      if (isTranslating) return;
      isTranslating = true;
      try {
        translateDOMNode(document.body);
      } finally {
        isTranslating = false;
      }
    };

    // Run immediately when language changes
    runTranslation();

    // Set up MutationObserver to react to dynamic changes / view navigation
    const observer = new MutationObserver((mutations) => {
      if (isTranslating) return;

      let shouldRun = false;
      for (const m of mutations) {
        if (m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
          shouldRun = true;
          break;
        }
        if (m.type === 'characterData') {
          shouldRun = true;
          break;
        }
      }

      if (shouldRun) {
        runTranslation();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a <LanguageProvider>');
  }
  return context;
};

// ============================================================================
// 6. ELEGANT PILL LANGUAGE TOGGLE COMPONENT
// ============================================================================
export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  const options: { code: SupportedLanguage; label: string; subLabel: string }[] = [
    { code: 'en', label: 'EN', subLabel: 'English' },
    { code: 'hi', label: 'हिन्दी', subLabel: 'राजभाषा' },
    { code: 'mr', label: 'मराठी', subLabel: 'मध्य रेल्वे' },
  ];

  return (
    <div
      role="group"
      aria-label="Language selection toggle"
      className="inline-flex items-center p-1 rounded-full bg-[#ece8dd] border border-[#d8d2c4] shadow-inner"
    >
      {options.map((opt) => {
        const isActive = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLanguage(opt.code)}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-full transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-emerald-800 text-white shadow-sm scale-[1.03]'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
            title={`Switch to ${opt.subLabel}`}
            aria-pressed={isActive}
          >
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default LanguageProvider;
