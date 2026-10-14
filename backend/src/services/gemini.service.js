/**
 * @file gemini.service.js
 * @description Google Gemini AI Emergency Triage Service.
 * Analyzes patient symptom descriptions in English, Roman Urdu, and Urdu.
 * Recommends clinical priority, required medical specialties, emergency equipment,
 * and provides instant bystander pre-hospital first-aid instructions.
 */

const config = require('../config/env');

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  config.GEMINI_API_KEY ||
  'AIzaSyDYRdUb0-zn5lPPo-z-nDldCkLXt0ptV_A';

/**
 * Local Rule-based Clinical NLP Triage Engine (Fallback for offline or leaked API keys)
 */
function localClinicalTriage(symptoms) {
  const text = (symptoms || '').toLowerCase();

  const specialties = new Set();
  const resources = new Set();
  let priority = 'standard';
  const firstAid = [];

  // 1. Cardiac / Heart (English & Roman Urdu)
  if (
    text.includes('chest pain') ||
    (text.includes('chest') && text.includes('pain')) ||
    text.includes('heart') ||
    text.includes('cardiac') ||
    text.includes('dil ka daura') ||
    (text.includes('seene') && text.includes('dard')) ||
    text.includes('angina') ||
    text.includes('palpitation') ||
    text.includes('heart attack') ||
    text.includes('left arm pain')
  ) {
    specialties.add('Cardiology');
    resources.add('icu_bed');
    resources.add('catheterization_lab');
    priority = 'critical';
    firstAid.push('Keep the patient seated calmly in an upright W-position.');
    firstAid.push('Loosen tight clothing around neck and chest.');
    firstAid.push('If prescribed, assist with Nitroglycerin or Aspirin 300mg (chewed), unless allergic.');
    firstAid.push('Do not allow the patient to walk or exert physical effort.');
  }

  // 2. Trauma / Bleeding / Accidents
  if (
    text.includes('accident') ||
    text.includes('trauma') ||
    text.includes('bleed') ||
    text.includes('khoon') ||
    text.includes('wound') ||
    text.includes('gunshot') ||
    text.includes('goli') ||
    text.includes('stab') ||
    text.includes('chhuri') ||
    text.includes('crash') ||
    text.includes('haadsa') ||
    (text.includes('sar') && text.includes('chot')) ||
    text.includes('head injury') ||
    text.includes('fracture')
  ) {
    specialties.add('Trauma Surgery');
    resources.add('blood_bank');
    resources.add('trauma_team');
    priority = 'critical';
    firstAid.push('Apply firm, direct pressure on bleeding wounds using a clean cloth or bandage.');
    firstAid.push('Do not move the patient if neck or spinal injury is suspected.');
    firstAid.push('Keep the patient warm to prevent traumatic shock.');
  }

  // 3. Neurological / Stroke / Seizures
  if (
    text.includes('stroke') ||
    text.includes('seizure') ||
    text.includes('jhatkay') ||
    text.includes('falij') ||
    text.includes('paralysis') ||
    text.includes('unconscious') ||
    text.includes('behosh') ||
    text.includes('slurred speech') ||
    text.includes('brain') ||
    text.includes('coma')
  ) {
    specialties.add('Neurology');
    resources.add('ct_scanner');
    resources.add('icu_bed');
    priority = 'critical';
    firstAid.push('If convulsing, do not restrain the patient; clear the surrounding area of sharp objects.');
    firstAid.push('Place in the recovery position (on their side) once convulsions stop to maintain open airway.');
    firstAid.push('Do NOT put any objects, spoon, or water inside the mouth.');
  }

  // 4. Respiratory / Pulmonology
  if (
    text.includes('breathing') ||
    text.includes('saans') ||
    text.includes('asthma') ||
    text.includes('suffocation') ||
    text.includes('choking') ||
    text.includes('gala ghut') ||
    text.includes('ventilator') ||
    text.includes('oxygen')
  ) {
    specialties.add('Pulmonology');
    resources.add('ventilator');
    priority = priority === 'critical' ? 'critical' : 'urgent';
    firstAid.push('Sit the patient upright; leaning slightly forward with arms on knees helps breathing.');
    firstAid.push('Administer emergency inhaler (Salbutamol / Ventolin) 4-6 puffs if asthmatic.');
    firstAid.push('Ensure open ventilation and fresh air circulating in the room.');
  }

  // 5. Orthopedics / Bone Fractures
  if (
    text.includes('fracture') ||
    text.includes('bone') ||
    text.includes('haddi') ||
    text.includes('toot') ||
    text.includes('dislocation') ||
    text.includes('broken leg') ||
    text.includes('broken arm')
  ) {
    specialties.add('Orthopedics');
    if (priority !== 'critical') priority = 'urgent';
    firstAid.push('Immobilize the injured limb; do not attempt to realign the broken bone.');
    firstAid.push('Apply an ice pack wrapped in a cloth to reduce swelling.');
  }

  // 6. Pediatrics
  if (
    text.includes('child') ||
    text.includes('baby') ||
    text.includes('bacha') ||
    text.includes('bachay') ||
    text.includes('bachi') ||
    text.includes('infant') ||
    text.includes('pediatric')
  ) {
    specialties.add('Pediatrics');
    if (priority !== 'critical') priority = 'urgent';
    firstAid.push('Keep the infant calm, monitor temperature and hydration.');
  }

  if (specialties.size === 0) {
    specialties.add('Emergency Medicine');
    firstAid.push('Keep the patient in a resting position in a quiet area.');
    firstAid.push('Monitor breathing, pulse, and mental responsiveness continuously until ambulance arrives.');
  }

  return {
    source: 'clinical_nlp_engine',
    priority,
    specialties: Array.from(specialties),
    resources: Array.from(resources),
    firstAidInstructions: firstAid,
    clinicalImpression: `Identified indications matching: ${Array.from(specialties).join(', ')}. Urgency evaluated as ${priority.toUpperCase()}.`
  };
}

/**
 * Perform AI Triage using Google Gemini API with seamless local fallback
 * @param {string} symptomDescription
 * @param {string} [language='en']
 * @returns {Promise<Object>}
 */
async function triageWithGemini(symptomDescription, language = 'en') {
  if (!symptomDescription || typeof symptomDescription !== 'string') {
    return localClinicalTriage('');
  }

  const prompt = `
You are an expert Emergency Medicine Triage Physician.
Analyze this emergency patient description: "${symptomDescription}".

Extract and return STRICT JSON with this schema:
{
  "priority": "critical" | "urgent" | "standard",
  "specialties": ["Cardiology" | "Trauma Surgery" | "Neurology" | "Pediatrics" | "Pulmonology" | "Orthopedics" | "Emergency Medicine"],
  "resources": ["icu_bed" | "er_bed" | "ventilator" | "blood_bank" | "ct_scanner" | "catheterization_lab"],
  "firstAidInstructions": [
    "Short, actionable pre-hospital first aid advice for bystander"
  ],
  "clinicalImpression": "1-2 sentence clinical assessment"
}
Output only valid JSON. No conversational fluff or markdown fences.
`.trim();

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      }),
      signal: AbortSignal.timeout(4500)
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
        return {
          source: 'gemini_generative_ai',
          priority: ['critical', 'urgent', 'standard'].includes(parsed.priority) ? parsed.priority : 'urgent',
          specialties: Array.isArray(parsed.specialties) ? parsed.specialties : ['Emergency Medicine'],
          resources: Array.isArray(parsed.resources) ? parsed.resources : [],
          firstAidInstructions: Array.isArray(parsed.firstAidInstructions) ? parsed.firstAidInstructions : [],
          clinicalImpression: parsed.clinicalImpression || 'Gemini clinical triage assessment completed.'
        };
      }
    }
  } catch (err) {
    // Graceful fallback on network timeout, revoked key, or JSON parse error
  }

  // Fallback to our specialized multi-lingual emergency NLP engine
  return localClinicalTriage(symptomDescription);
}

module.exports = {
  triageWithGemini,
  localClinicalTriage
};
