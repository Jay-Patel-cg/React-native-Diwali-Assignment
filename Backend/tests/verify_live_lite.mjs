import dotenv from 'dotenv';
dotenv.config();

import { planTrip } from '../src/services/geminiService.js';

process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
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
  console.log('planTrip with lite SUCCESS in', Date.now() - startPlan, 'ms:', planRes.tripTitle);
} catch (e) {
  console.error('planTrip with lite FAILED in', Date.now() - startPlan, 'ms:', e);
}
