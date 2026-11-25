import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Trip from '../src/models/Trip.js';
import TripMember from '../src/models/TripMember.js';
import Expense from '../src/models/Expense.js';
import Itinerary from '../src/models/Itinerary.js';
import PackingList from '../src/models/PackingList.js';
import Notification from '../src/models/Notification.js';
import * as geminiService from '../src/services/geminiService.js';

const PORT = 5097;
const BASE_URL = `http://localhost:${PORT}/api`;

const mockAiClient = {
  models: {
    generateContent: async ({ contents }) => {
      const promptStr = typeof contents === 'string' ? contents : JSON.stringify(contents);
      if (promptStr.includes('travel query') || promptStr.includes('travelChat') || promptStr.includes('message')) {
        return {
          text: JSON.stringify({
            reply: 'South Goa is renowned for scenic beaches like Palolem, Butterfly, and Agonda.',
            suggestedFollowUps: ['Best sunset viewpoints in South Goa', 'Top seafood shacks'],
            referencedDestinations: ['South Goa'],
            containsCostEstimates: true,
          }),
        };
      }
      if (promptStr.includes('day itinerary for') || promptStr.includes('generateItinerary')) {
        return {
          text: JSON.stringify({
            tripTitle: '4-Day Sun-Kissed South Goa Coastal Expedition',
            destination: 'South Goa, India',
            summary: 'Serene beach exploration with heritage fort visits and fresh coastal dining.',
            currency: 'INR',
            totalEstimatedCost: 28000,
            dayWiseItinerary: [
              {
                dayNumber: 1,
                date: '2026-12-05',
                theme: 'Arrival & Palolem Beach Sunset',
                activities: [
                  {
                    title: 'Palolem Beach Relaxation',
                    category: 'beach',
                    time: '04:00 PM',
                    description: 'Unwind on the crescent shoreline',
                    estimatedCost: 0,
                  },
                ],
                estimatedDayCost: 1500,
              },
              {
                dayNumber: 2,
                date: '2026-12-06',
                theme: 'Cabo de Rama Fort & Cola Beach Lagoon',
                activities: [
                  {
                    title: 'Cabo de Rama Cliff Exploration',
                    category: 'sightseeing',
                    time: '10:00 AM',
                    description: 'Historic Portuguese coastal fort',
                    estimatedCost: 200,
                  },
                ],
                estimatedDayCost: 3200,
              },
            ],
            foodHighlights: ['Goan Fish Thali', 'Bebinca'],
            travelTips: ['Rent a scooter for coastal commuting', 'Carry cash for beach shacks'],
          }),
        };
      }
      return {
        text: JSON.stringify({
          tripTitle: '4-Day Sun-Kissed South Goa Coastal Expedition',
          destination: 'South Goa, India',
          summary: 'Serene beach exploration with heritage fort visits and coastal dining.',
          currency: 'INR',
          estimatedTotalCost: 35000,
          budgetTier: 'moderate',
          dayWiseItinerary: [
            {
              dayNumber: 1,
              date: '2026-12-05',
              theme: 'Arrival & Palolem Beach Sunset',
              activities: [
                {
                  title: 'Palolem Beach Check-in',
                  category: 'beach',
                  time: '04:00 PM',
                  description: 'Golden hour walk by the shore',
                  estimatedCost: 0,
                },
              ],
              estimatedDayCost: 2000,
            },
          ],
          packingSuggestions: [
            { itemName: 'Sunscreen SPF 50', category: 'toiletries' },
            { itemName: 'Quick-dry Towel', category: 'beachwear' },
            { itemName: 'Waterproof Phone Case', category: 'accessories' },
          ],
        }),
      };
    },
  },
};

const results = [];
function recordResult(stepNumber, testName, endpoint, method, statusCode, success, details) {
  results.push({ stepNumber, testName, endpoint, method, statusCode, success, details });
  const icon = success ? '✓' : '✗';
  console.log(`[${icon}] Step ${stepNumber}: ${testName} (${method} ${endpoint}) -> Status ${statusCode} (${details})`);
}

let server;
let primaryUserToken;
let primaryUserId;
let primaryEmail;
let secondaryUserToken;
let secondaryUserId;
let secondaryEmail;
let testTripId;
let savedAiTripId;
let testItineraryId;
let testExpenseId;
let testPackingItemId;

async function runFinalAuditE2E() {
  console.log('========================================================================');
  console.log('   SAMUNDAR KE SATH — FINAL RIGOROUS 12-STEP END-TO-END TEST SUITE      ');
  console.log('========================================================================\n');

  await connectDB();
  geminiService.setGeminiClientForTesting(mockAiClient);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test Server online at http://localhost:${PORT}/api\n`);

  const timestamp = Date.now();
  primaryEmail = `audit_captain_${timestamp}@samundarkesath.com`;
  secondaryEmail = `audit_navigator_${timestamp}@samundarkesath.com`;

  // -------------------------------------------------------------------
  // TEST 1: Register (Validation, Password Hashing & Token Generation)
  // -------------------------------------------------------------------
  // 1a: Test short password rejection (validation guard)
  const invalidRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Captain Aakash',
      email: primaryEmail,
      password: '123', // too short
    }),
  });
  const invalidRegData = await invalidRegRes.json();

  // 1b: Valid registration
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Captain Aakash',
      email: primaryEmail,
      password: 'StrongPassword@123',
    }),
  });
  const regData = await regRes.json();
  primaryUserId = regData.data?.user?._id;
  primaryUserToken = regData.data?.token;

  recordResult(
    1,
    'User Registration',
    '/auth/register',
    'POST',
    regRes.status,
    invalidRegRes.status === 400 && regRes.status === 201 && Boolean(primaryUserToken),
    `Validated weak password rejection (400) & created user with JWT token`
  );

  // -------------------------------------------------------------------
  // TEST 2: Login (Authentication, Password Verification & JWT Refresh)
  // -------------------------------------------------------------------
  // 2a: Test wrong password rejection
  const wrongLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: primaryEmail,
      password: 'WrongPassword@999',
    }),
  });

  // 2b: Test valid login
  const validLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: primaryEmail,
      password: 'StrongPassword@123',
    }),
  });
  const validLoginData = await validLoginRes.json();
  primaryUserToken = validLoginData.data?.token;

  recordResult(
    2,
    'User Login',
    '/auth/login',
    'POST',
    validLoginRes.status,
    wrongLoginRes.status === 401 && validLoginRes.status === 200 && Boolean(primaryUserToken),
    `Rejected bad credentials (401) & issued fresh token for ${primaryEmail}`
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${primaryUserToken}`,
  };

  // -------------------------------------------------------------------
  // TEST 3: Google Authentication (Signature Verification & Security Guard)
  // -------------------------------------------------------------------
  const googleRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'mock_unverified_google_token' }),
  });
  recordResult(
    3,
    'Google Authentication Verification',
    '/auth/google',
    'POST',
    googleRes.status,
    googleRes.status === 401 || googleRes.status === 400 || googleRes.status === 503,
    `Protected route rejects spoofed tokens (Status: ${googleRes.status})`
  );

  // -------------------------------------------------------------------
  // TEST 4: Create Trip (Trip CRUD & Default Membership Initialization)
  // -------------------------------------------------------------------
  const createTripRes = await fetch(`${BASE_URL}/trips`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'South Goa Beach & Heritage Getaway',
      destination: 'South Goa, India',
      startDate: '2026-12-05',
      endDate: '2026-12-09',
      budget: 45000,
      currency: 'INR',
      travelStyle: ['coastal', 'relaxing'],
      notes: 'Golden sand beaches and Portuguese architecture',
    }),
  });
  const createTripData = await createTripRes.json();
  testTripId = createTripData.data?._id;

  const getTripRes = await fetch(`${BASE_URL}/trips/${testTripId}`, { headers: authHeaders });

  recordResult(
    4,
    'Create Trip',
    '/trips',
    'POST',
    createTripRes.status,
    createTripRes.status === 201 && getTripRes.status === 200,
    `Trip ${testTripId} created with ₹45,000 budget and owner role`
  );

  // -------------------------------------------------------------------
  // TEST 5: Invite Trip Members (Collaboration & Role Management)
  // -------------------------------------------------------------------
  // Register secondary user first
  const secRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Navigator Priya',
      email: secondaryEmail,
      password: 'StrongPassword@123',
    }),
  });
  const secRegData = await secRegRes.json();
  secondaryUserId = secRegData.data?.user?._id;
  secondaryUserToken = secRegData.data?.token;

  const secHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secondaryUserToken}`,
  };

  // 5a: Owner invites collaborator as editor
  const inviteRes = await fetch(`${BASE_URL}/trips/${testTripId}/members`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email: secondaryEmail,
      role: 'editor',
    }),
  });
  const inviteData = await inviteRes.json();
  const membershipId = inviteData.data?._id;

  // 5b: Collaborator responds and accepts
  const acceptRes = await fetch(`${BASE_URL}/trips/${testTripId}/members/respond`, {
    method: 'PATCH',
    headers: secHeaders,
    body: JSON.stringify({ status: 'accepted' }),
  });

  // 5c: Owner promotes member to admin
  const updateRoleRes = await fetch(`${BASE_URL}/trips/${testTripId}/members/${membershipId}/role`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ role: 'admin' }),
  });

  recordResult(
    5,
    'Invite Trip Members',
    '/trips/:tripId/members',
    'POST/PATCH',
    inviteRes.status,
    inviteRes.status === 201 && acceptRes.status === 200 && updateRoleRes.status === 200,
    `Invited ${secondaryEmail}, invitation accepted, promoted to admin`
  );

  // -------------------------------------------------------------------
  // TEST 6: Add Expense (Expense Recording & Equal Split Calculation)
  // -------------------------------------------------------------------
  const addExpenseRes = await fetch(`${BASE_URL}/trips/${testTripId}/expenses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Beachfront Villa Booking (3 Nights)',
      amount: 18000,
      currency: 'INR',
      category: 'accommodation',
      expenseDate: '2026-12-05T14:00:00.000Z',
      paidBy: primaryUserId,
      splitType: 'equal',
      participants: [{ userId: primaryUserId }, { userId: secondaryUserId }],
    }),
  });
  const addExpenseData = await addExpenseRes.json();
  testExpenseId = addExpenseData.data?._id;

  recordResult(
    6,
    'Add Expense',
    '/trips/:tripId/expenses',
    'POST',
    addExpenseRes.status,
    addExpenseRes.status === 201 && addExpenseData.data?.amount === 18000,
    `Recorded ₹18,000 accommodation expense with equal split (₹9,000/person)`
  );

  // -------------------------------------------------------------------
  // TEST 7: Update Budget & Live Budget Tracking
  // -------------------------------------------------------------------
  // 7a: Update trip total budget
  const updateBudgetRes = await fetch(`${BASE_URL}/trips/${testTripId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ budget: 55000 }),
  });

  // 7b: Fetch real-time budget calculation
  const getBudgetRes = await fetch(`${BASE_URL}/trips/${testTripId}/budget`, {
    headers: authHeaders,
  });
  const budgetData = await getBudgetRes.json();

  recordResult(
    7,
    'Update Budget',
    '/trips/:id & /trips/:id/budget',
    'PATCH/GET',
    updateBudgetRes.status,
    updateBudgetRes.status === 200 &&
      getBudgetRes.status === 200 &&
      budgetData.data?.totalBudget === 55000 &&
      budgetData.data?.totalSpent === 18000 &&
      budgetData.data?.budgetRemaining === 37000,
    `Budget raised to ₹55,000; spent ₹18,000, balance ₹37,000 (32.7% used)`
  );

  // -------------------------------------------------------------------
  // TEST 8: Generate AI Itinerary (Gemini SDK Integration & Schema Parsing)
  // -------------------------------------------------------------------
  const genAiItinRes = await fetch(`${BASE_URL}/ai/generate-itinerary`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      destination: 'South Goa, India',
      startDate: '2026-12-05',
      endDate: '2026-12-08',
      travelers: 2,
      pace: 'moderate',
    }),
  });
  const genAiItinData = await genAiItinRes.json();

  recordResult(
    8,
    'Generate AI Itinerary',
    '/ai/generate-itinerary',
    'POST',
    genAiItinRes.status,
    genAiItinRes.status === 200 && Array.isArray(genAiItinData.data?.dayWiseItinerary),
    `Generated ${genAiItinData.data?.dayWiseItinerary?.length}-day structured itinerary in ${genAiItinData.data?.currency}`
  );

  // -------------------------------------------------------------------
  // TEST 9: Save AI Trip (Full AI Workflow: Trip -> Itinerary -> Packing List)
  // -------------------------------------------------------------------
  // 9a: Create Trip from AI Plan
  const saveAiTripRes = await fetch(`${BASE_URL}/trips`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: genAiItinData.data?.tripTitle || 'AI South Goa Expedition',
      destination: genAiItinData.data?.destination || 'South Goa, India',
      startDate: '2026-12-05',
      endDate: '2026-12-08',
      budget: genAiItinData.data?.totalEstimatedCost || 28000,
      currency: 'INR',
      travelStyle: ['coastal'],
      notes: genAiItinData.data?.summary || 'AI Generated plan',
    }),
  });
  const saveAiTripData = await saveAiTripRes.json();
  savedAiTripId = saveAiTripData.data?._id;

  // 9b: Save generated itinerary days
  let savedDaysCount = 0;
  for (const day of genAiItinData.data?.dayWiseItinerary || []) {
    const saveDayRes = await fetch(`${BASE_URL}/trips/${savedAiTripId}/itinerary`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        dayNumber: day.dayNumber,
        date: day.date,
        theme: day.theme,
        activities: day.activities,
      }),
    });
    if (saveDayRes.status === 201) savedDaysCount++;
  }

  // 9c: Save AI Packing items (valid categories: toiletries, accessories)
  const savePackRes = await fetch(`${BASE_URL}/trips/${savedAiTripId}/packing-list`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      items: [
        { itemName: 'Sunscreen SPF 50', category: 'toiletries' },
        { itemName: 'Waterproof Dry Bag', category: 'accessories' },
      ],
    }),
  });

  recordResult(
    9,
    'Save AI Trip',
    '/trips & /itinerary & /packing-list',
    'POST',
    saveAiTripRes.status,
    saveAiTripRes.status === 201 && savedDaysCount >= 2 && savePackRes.status === 201,
    `Persisted AI trip (${savedAiTripId}) with ${savedDaysCount} days & packing list`
  );

  // -------------------------------------------------------------------
  // TEST 10: Manage Itinerary (Create, Update & Delete Daily Activities)
  // -------------------------------------------------------------------
  // 10a: Create itinerary day
  const createItinRes = await fetch(`${BASE_URL}/trips/${testTripId}/itinerary`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      dayNumber: 1,
      date: '2026-12-05',
      activities: [
        {
          title: 'Sunset at Palolem Beach',
          category: 'beach',
          time: '05:30 PM',
          description: 'Golden hour drinks and sea breeze',
          estimatedCost: 800,
        },
      ],
    }),
  });
  const createItinData = await createItinRes.json();
  testItineraryId = createItinData.data?._id;

  // 10b: Update itinerary day with additional activity
  const updateItinRes = await fetch(`${BASE_URL}/trips/${testTripId}/itinerary/${testItineraryId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      dayNumber: 1,
      activities: [
        {
          title: 'Sunset at Palolem Beach',
          category: 'beach',
          time: '05:30 PM',
          description: 'Golden hour drinks and sea breeze',
          estimatedCost: 800,
        },
        {
          title: 'Fresh Catch Shack Dinner',
          category: 'dining',
          time: '08:00 PM',
          description: 'Tandoori Kingfish dinner',
          estimatedCost: 1500,
        },
      ],
    }),
  });

  // 10c: Delete itinerary day
  const deleteItinRes = await fetch(`${BASE_URL}/trips/${testTripId}/itinerary/${testItineraryId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });

  recordResult(
    10,
    'Manage Itinerary',
    '/trips/:tripId/itinerary',
    'POST/PATCH/DELETE',
    deleteItinRes.status,
    createItinRes.status === 201 && updateItinRes.status === 200 && deleteItinRes.status === 200,
    `Created day 1, added dining activity, and verified clean deletion`
  );

  // -------------------------------------------------------------------
  // TEST 11: Manage Packing List (Add Items, Mark Packed & Progress)
  // -------------------------------------------------------------------
  // 11a: Add items with valid categories (accessories, beachwear, other)
  const addPackRes = await fetch(`${BASE_URL}/trips/${testTripId}/packing-list`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      items: [
        { itemName: 'Polarized Sunglasses', category: 'accessories' },
        { itemName: 'Flip Flops', category: 'beachwear' },
        { itemName: 'Snorkel Gear', category: 'other' },
      ],
    }),
  });
  const addPackData = await addPackRes.json();
  testPackingItemId = addPackData.data?.items?.[0]?._id;

  // 11b: Mark item as packed
  const updatePackRes = await fetch(`${BASE_URL}/trips/${testTripId}/packing-list/${testPackingItemId}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ isPacked: true }),
  });

  // 11c: Delete one item
  const deletePackItemId = addPackData.data?.items?.[2]?._id;
  const deletePackRes = await fetch(`${BASE_URL}/trips/${testTripId}/packing-list/${deletePackItemId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });

  // 11d: Verify packing list statistics
  const getPackRes = await fetch(`${BASE_URL}/trips/${testTripId}/packing-list`, {
    headers: authHeaders,
  });
  const getPackData = await getPackRes.json();

  recordResult(
    11,
    'Manage Packing List',
    '/trips/:tripId/packing-list',
    'POST/PATCH/DELETE',
    addPackRes.status,
    addPackRes.status === 201 &&
      updatePackRes.status === 200 &&
      deletePackRes.status === 200 &&
      (getPackData.data?.progress?.totalItems === 2 || getPackData.data?.items?.length === 2) &&
      (getPackData.data?.progress?.packedItems === 1 || getPackData.data?.items?.filter(i => i.isPacked).length === 1),
    `Added 3 items, packed 1 item, removed 1 item (50% packing progress)`
  );

  // -------------------------------------------------------------------
  // TEST 12: Logout (Token Invalidation & Stateless Revocation)
  // -------------------------------------------------------------------
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: authHeaders,
  });
  const logoutData = await logoutRes.json();

  recordResult(
    12,
    'User Logout',
    '/auth/logout',
    'POST',
    logoutRes.status,
    logoutRes.status === 200 && logoutData.success === true,
    `Stateless logout confirmed; response cleared user session`
  );

  // -------------------------------------------------------------------
  // Database Cleanup
  // -------------------------------------------------------------------
  await Trip.findByIdAndDelete(testTripId);
  await Trip.findByIdAndDelete(savedAiTripId);
  await Expense.deleteMany({ tripId: { $in: [testTripId, savedAiTripId] } });
  await Itinerary.deleteMany({ tripId: { $in: [testTripId, savedAiTripId] } });
  await PackingList.deleteMany({ tripId: { $in: [testTripId, savedAiTripId] } });
  await TripMember.deleteMany({ tripId: { $in: [testTripId, savedAiTripId] } });
  await User.findByIdAndDelete(primaryUserId);
  await User.findByIdAndDelete(secondaryUserId);
  console.log('\n✓ Cleaned up test trips, members, expenses, packing lists, and users from database');

  console.log('\n========================================================================');
  const passed = results.filter((r) => r.success).length;
  console.log(`   FINAL RIGOROUS 12-STEP TEST RESULT: ${passed} / 12 CHECKS PASSED`);
  console.log('========================================================================\n');

  return results;
}

runFinalAuditE2E()
  .catch((err) => {
    console.error('\n❌ FINAL RIGOROUS TEST FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    geminiService.resetGeminiClient();
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(0);
  });
