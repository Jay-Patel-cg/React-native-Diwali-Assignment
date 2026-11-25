import dotenv from 'dotenv';
dotenv.config();

import { planTrip, travelChat } from '../src/services/geminiService.js';

console.log('Testing live AI chat with model:', process.env.GEMINI_MODEL);
const startChat = Date.now();
try {
  const chatRes = await travelChat({
    message: 'Give me 2 quick tips for packing for Goa in November.',
    conversationHistory: [],
  });
  console.log('travelChat SUCCESS in', Date.now() - startChat, 'ms using model:', chatRes.metadata.model);
  console.log('Reply preview:', chatRes.reply.slice(0, 100), '...');
} catch (e) {
  console.error('travelChat FAILED:', e.message);
}

console.log('Testing live AI planTrip...');
const startPlan = Date.now();
try {
  const planRes = await planTrip({
    destination: 'Goa',
    origin: 'Mumbai',
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    travelersCount: 2,
    budget: 25000,
    currency: 'INR',
    travelStyle: 'coastal',
    interests: ['beaches', 'seafood'],
  });
  console.log('planTrip SUCCESS in', Date.now() - startPlan, 'ms using model:', planRes.metadata.model);
  console.log('Trip title:', planRes.tripTitle);
} catch (e) {
  console.error('planTrip FAILED:', e.message);
}
