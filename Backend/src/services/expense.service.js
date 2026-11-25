import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import {
  escapeRegex,
  parsePagination,
  buildPaginationMeta,
} from '../utils/queryHelpers.js';
import * as notificationService from './notification.service.js';

/**
 * Helper to round decimals to 2 decimal places with mathematical precision
 */
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

/**
 * Returns the Set of accepted member user IDs (always including the trip owner).
 */
const getValidTripMemberIdSet = async (trip) => {
  const members = await TripMember.find({
    tripId: trip._id,
    invitationStatus: 'accepted',
  }).select('userId');

  const idSet = new Set([trip.owner.toString()]);
  members.forEach((m) => idSet.add(m.userId.toString()));
  return idSet;
};

/**
 * Resolves, validates trip membership & uniqueness, and calculates exact participant split shares
 * with cent-accurate reconciliation so sum(shareAmount) === totalAmount always.
 */
const calculateParticipantShares = async (
  trip,
  totalAmount,
  splitType = 'equal',
  providedParticipants = [],
  validMemberIds = null
) => {
  const roundedAmount = round2(totalAmount);
  const allowedIds = validMemberIds || (await getValidTripMemberIdSet(trip));

  // Validate provided participants belong to this trip and have no duplicate userIds
  if (Array.isArray(providedParticipants) && providedParticipants.length > 0) {
    const seen = new Set();
    for (const p of providedParticipants) {
      const uid = p.userId.toString();
      if (!allowedIds.has(uid)) {
        throw new ApiError(
          400,
          `Participant '${uid}' is not an active member of this trip.`
        );
      }
      if (seen.has(uid)) {
        throw new ApiError(
          400,
          'Duplicate participant detected in expense split.'
        );
      }
      seen.add(uid);
    }
  }

  if (splitType === 'equal') {
    const participantUserIds =
      providedParticipants && providedParticipants.length > 0
        ? providedParticipants.map((p) => p.userId.toString())
        : Array.from(allowedIds);

    if (participantUserIds.length === 0) {
      throw new ApiError(
        400,
        'At least one participant is required to split the expense'
      );
    }

    const n = participantUserIds.length;
    const baseShare = Math.floor((roundedAmount / n) * 100) / 100;
    const distributed = round2(baseShare * n);
    let remainderCents = Math.round((roundedAmount - distributed) * 100);

    return participantUserIds.map((userId) => {
      let share = baseShare;
      if (remainderCents > 0) {
        share = round2(share + 0.01);
        remainderCents--;
      }
      return {
        userId,
        shareAmount: share,
        hasPaid: false,
      };
    });
  }

  if (splitType === 'exact') {
    if (!providedParticipants || providedParticipants.length === 0) {
      throw new ApiError(
        400,
        'Participants list with shareAmount is required for exact split'
      );
    }

    let sumShares = 0;
    const participants = providedParticipants.map((p) => {
      const share = round2(p.shareAmount || 0);
      sumShares = round2(sumShares + share);
      return {
        userId: p.userId,
        shareAmount: share,
        hasPaid: Boolean(p.hasPaid),
      };
    });

    if (Math.abs(sumShares - roundedAmount) > 0.01) {
      throw new ApiError(
        400,
        `Sum of participant shares (${sumShares}) must match the total expense amount (${roundedAmount})`
      );
    }

    return participants;
  }

  if (splitType === 'percentage') {
    if (!providedParticipants || providedParticipants.length === 0) {
      throw new ApiError(
        400,
        'Participants list with percentage is required for percentage split'
      );
    }

    let sumPercentage = 0;
    providedParticipants.forEach((p) => {
      sumPercentage = round2(sumPercentage + Number(p.percentage || 0));
    });

    if (Math.abs(sumPercentage - 100) > 0.05) {
      throw new ApiError(
        400,
        `Sum of participant percentages must equal 100% (Got: ${sumPercentage}%)`
      );
    }

    let runningSum = 0;
    return providedParticipants.map((p, idx) => {
      const isLast = idx === providedParticipants.length - 1;
      const share = isLast
        ? round2(roundedAmount - runningSum)
        : round2(((Number(p.percentage) || 0) / 100) * roundedAmount);
      runningSum = round2(runningSum + share);
      return {
        userId: p.userId,
        shareAmount: Math.max(0, share),
        hasPaid: Boolean(p.hasPaid),
      };
    });
  }

  return providedParticipants;
};

/**
 * Create a new expense for a trip
 */
export const createExpense = async (
  tripId,
  requesterId,
  expenseData,
  requesterName = ''
) => {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const tripCurrency = (trip.currency || 'INR').toUpperCase();
  const requestedCurrency = expenseData.currency
    ? String(expenseData.currency).toUpperCase().trim()
    : tripCurrency;

  if (requestedCurrency !== tripCurrency) {
    throw new ApiError(
      400,
      `Expense currency '${requestedCurrency}' does not match trip currency '${tripCurrency}'.`
    );
  }

  const validMemberIds = await getValidTripMemberIdSet(trip);
  const payerId = (expenseData.paidBy || requesterId).toString();

  if (!validMemberIds.has(payerId)) {
    throw new ApiError(
      400,
      'The specified payer (paidBy) is not an active member of this trip.'
    );
  }

  const numAmount = round2(expenseData.amount);
  const splitType = expenseData.splitType || 'equal';

  // Calculate participants and individual split shares
  const participants = await calculateParticipantShares(
    trip,
    numAmount,
    splitType,
    expenseData.participants,
    validMemberIds
  );

  // Mark payer's own share as settled/paid
  participants.forEach((p) => {
    if (p.userId.toString() === payerId) {
      p.hasPaid = true;
    }
  });

  const expense = await Expense.create({
    tripId,
    paidBy: payerId,
    title: expenseData.title.trim(),
    amount: numAmount,
    currency: tripCurrency,
    category: expenseData.category || 'miscellaneous',
    expenseDate: expenseData.expenseDate
      ? new Date(expenseData.expenseDate)
      : new Date(),
    notes: expenseData.notes ? expenseData.notes.trim() : '',
    splitType,
    participants,
    receiptImage: expenseData.receiptImage || '',
  });

  await notificationService.sendExpenseUpdateNotification({
    tripId,
    tripTitle: trip.title,
    actorId: requesterId,
    actorName: requesterName,
    expenseTitle: expense.title,
    amount: numAmount,
    currency: tripCurrency,
    action: 'added',
  });

  return Expense.findById(expense._id)
    .populate('paidBy', 'name email profileImage')
    .populate('participants.userId', 'name email profileImage');
};

/**
 * Retrieve paginated and filtered expenses for a trip
 */
export const getTripExpenses = async (tripId, queryParams = {}) => {
  const { category, paidBy, startDate, endDate, search, sort = 'desc' } =
    queryParams;

  const { page, limit, skip } = parsePagination(queryParams, {
    defaultLimit: 20,
    maxLimit: 100,
  });

  const filter = { tripId };

  if (category) {
    filter.category = String(category).toLowerCase().trim();
  }

  if (paidBy && mongoose.Types.ObjectId.isValid(paidBy)) {
    filter.paidBy = paidBy;
  }

  if (startDate || endDate) {
    filter.expenseDate = {};
    if (startDate && !isNaN(new Date(startDate).getTime())) {
      filter.expenseDate.$gte = new Date(startDate);
    }
    if (endDate && !isNaN(new Date(endDate).getTime())) {
      filter.expenseDate.$lte = new Date(endDate);
    }
  }

  if (search && String(search).trim().length > 0) {
    const searchRegex = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ title: searchRegex }, { notes: searchRegex }];
  }

  const sortDirection = sort === 'asc' ? 1 : -1;
  const sortOption = { expenseDate: sortDirection, createdAt: -1 };

  const [expenses, total, aggregateTotal] = await Promise.all([
    Expense.find(filter)
      .populate('paidBy', 'name email profileImage')
      .populate('participants.userId', 'name email profileImage')
      .sort(sortOption)
      .skip(skip)
      .limit(limit),
    Expense.countDocuments(filter),
    Expense.aggregate([
      { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
      { $group: { _id: null, totalSum: { $sum: '$amount' } } },
    ]),
  ]);

  const tripTotalExpenditure =
    aggregateTotal.length > 0 ? round2(aggregateTotal[0].totalSum) : 0;

  return {
    expenses,
    tripTotalExpenditure,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Retrieve a single expense by ID
 */
export const getExpenseById = async (tripId, expenseId) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, 'Invalid expense ID format');
  }

  const expense = await Expense.findOne({ _id: expenseId, tripId })
    .populate('paidBy', 'name email profileImage')
    .populate('participants.userId', 'name email profileImage');

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  return expense;
};

/**
 * Update an existing expense
 */
export const updateExpense = async (
  tripId,
  expenseId,
  requesterId,
  requesterRole,
  updateData,
  requesterName = ''
) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, 'Invalid expense ID format');
  }

  const [expense, trip] = await Promise.all([
    Expense.findOne({ _id: expenseId, tripId }),
    Trip.findById(tripId),
  ]);

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const isPayer = expense.paidBy.toString() === requesterId.toString();
  const isPrivileged = requesterRole === 'owner' || requesterRole === 'admin';

  if (!isPayer && !isPrivileged) {
    throw new ApiError(
      403,
      'Permission denied. Only the payer, trip admin, or trip owner can edit this expense.'
    );
  }

  const tripCurrency = (trip.currency || 'INR').toUpperCase();
  if (
    updateData.currency &&
    String(updateData.currency).toUpperCase().trim() !== tripCurrency
  ) {
    throw new ApiError(
      400,
      `Expense currency '${updateData.currency}' does not match trip currency '${tripCurrency}'.`
    );
  }

  const validMemberIds = await getValidTripMemberIdSet(trip);
  if (updateData.paidBy && !validMemberIds.has(updateData.paidBy.toString())) {
    throw new ApiError(
      400,
      'The specified payer (paidBy) is not an active member of this trip.'
    );
  }

  const newAmount =
    updateData.amount !== undefined ? round2(updateData.amount) : expense.amount;
  const newSplitType = updateData.splitType || expense.splitType;
  const newParticipants = updateData.participants || expense.participants;

  if (
    updateData.amount !== undefined ||
    updateData.splitType !== undefined ||
    updateData.participants !== undefined
  ) {
    const updatedParticipants = await calculateParticipantShares(
      trip,
      newAmount,
      newSplitType,
      newParticipants,
      validMemberIds
    );

    const payer = (updateData.paidBy || expense.paidBy).toString();
    updatedParticipants.forEach((p) => {
      if (p.userId.toString() === payer) {
        p.hasPaid = true;
      }
    });

    expense.participants = updatedParticipants;
    expense.amount = newAmount;
    expense.splitType = newSplitType;
  }

  if (updateData.title) expense.title = updateData.title.trim();
  if (updateData.category) expense.category = updateData.category;
  if (updateData.expenseDate) expense.expenseDate = new Date(updateData.expenseDate);
  if (updateData.notes !== undefined) expense.notes = updateData.notes.trim();
  if (updateData.paidBy) expense.paidBy = updateData.paidBy;
  if (updateData.receiptImage !== undefined) {
    expense.receiptImage = updateData.receiptImage;
  }

  await expense.save();

  await notificationService.sendExpenseUpdateNotification({
    tripId,
    tripTitle: trip.title,
    actorId: requesterId,
    actorName: requesterName,
    expenseTitle: expense.title,
    amount: expense.amount,
    currency: expense.currency,
    action: 'updated',
  });

  return Expense.findById(expense._id)
    .populate('paidBy', 'name email profileImage')
    .populate('participants.userId', 'name email profileImage');
};

/**
 * Delete an expense
 */
export const deleteExpense = async (
  tripId,
  expenseId,
  requesterId,
  requesterRole
) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, 'Invalid expense ID format');
  }

  const expense = await Expense.findOne({ _id: expenseId, tripId });
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  const isPayer = expense.paidBy.toString() === requesterId.toString();
  const isPrivileged = requesterRole === 'owner' || requesterRole === 'admin';

  if (!isPayer && !isPrivileged) {
    throw new ApiError(
      403,
      'Permission denied. Only the payer, trip admin, or trip owner can delete this expense.'
    );
  }

  await Expense.findByIdAndDelete(expenseId);

  return { message: 'Expense deleted successfully' };
};

/**
 * Real-time Budget Tracking & Statistics
 */
export const getTripBudgetTracking = async (tripId) => {
  const trip = await Trip.findById(tripId).select('title budget currency status');
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const stats = await Expense.aggregate([
    { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  const totalSpent = stats.length > 0 ? round2(stats[0].totalExpenses) : 0;
  const transactionCount = stats.length > 0 ? stats[0].totalTransactions : 0;
  const totalBudget = trip.budget || 0;
  const budgetRemaining = round2(totalBudget - totalSpent);
  const percentageSpent =
    totalBudget > 0 ? round2((totalSpent / totalBudget) * 100) : 0;
  const isOverBudget = totalSpent > totalBudget && totalBudget > 0;

  return {
    tripId: trip._id,
    tripTitle: trip.title,
    currency: trip.currency,
    totalBudget,
    totalSpent,
    budgetRemaining,
    percentageSpent,
    isOverBudget,
    totalTransactions: transactionCount,
  };
};

/**
 * Detailed Expense Analytics & Category-wise Breakdown (batch user lookup — no N+1)
 */
export const getExpenseAnalytics = async (tripId) => {
  const trip = await Trip.findById(tripId).select('budget currency');
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const tripObjectId = new mongoose.Types.ObjectId(tripId);

  const [categoryAggregation, paidByAggregation] = await Promise.all([
    Expense.aggregate([
      { $match: { tripId: tripObjectId } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]),
    Expense.aggregate([
      { $match: { tripId: tripObjectId } },
      {
        $group: {
          _id: '$paidBy',
          totalPaid: { $sum: '$amount' },
          paidCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalExpenses = round2(
    categoryAggregation.reduce((acc, cat) => acc + cat.totalAmount, 0)
  );

  const categoryBreakdown = categoryAggregation.map((cat) => ({
    category: cat._id,
    totalAmount: round2(cat.totalAmount),
    transactionCount: cat.transactionCount,
    percentageOfTotal:
      totalExpenses > 0 ? round2((cat.totalAmount / totalExpenses) * 100) : 0,
  }));

  // Single batch query to resolve all payers (fixes N+1)
  const payerIds = paidByAggregation.map((item) => item._id);
  const payerUsers =
    payerIds.length > 0
      ? await User.find({ _id: { $in: payerIds } })
          .select('name email profileImage')
          .lean()
      : [];

  const userLookup = new Map(payerUsers.map((u) => [u._id.toString(), u]));

  const payerStatistics = paidByAggregation.map((item) => {
    const uid = item._id.toString();
    return {
      user: userLookup.get(uid) || { _id: item._id, name: 'Unknown User' },
      totalPaid: round2(item.totalPaid),
      transactionsPaid: item.paidCount,
    };
  });

  return {
    tripId,
    currency: trip.currency,
    totalExpenses,
    categoryBreakdown,
    payerStatistics,
  };
};

/**
 * Multi-Party Debt Simplification & Settlement Calculation (batch user lookup — no N+1)
 */
export const calculateSettlements = async (tripId) => {
  const trip = await Trip.findById(tripId).select('currency owner');
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const [expenses, members] = await Promise.all([
    Expense.find({ tripId }).lean(),
    TripMember.find({ tripId, invitationStatus: 'accepted' }).populate(
      'userId',
      'name email profileImage'
    ),
  ]);

  const userMap = {};

  members.forEach((m) => {
    if (m.userId) {
      const uId = m.userId._id.toString();
      userMap[uId] = {
        userId: uId,
        name: m.userId.name || 'Member',
        email: m.userId.email || '',
        profileImage: m.userId.profileImage || '',
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      };
    }
  });

  // Collect any historic payers/participants who may have since left the trip in ONE batch query
  const missingUserIds = new Set();
  for (const exp of expenses) {
    const payerId = exp.paidBy.toString();
    if (!userMap[payerId]) missingUserIds.add(payerId);
    for (const p of exp.participants || []) {
      const pId = p.userId.toString();
      if (!userMap[pId]) missingUserIds.add(pId);
    }
  }

  if (missingUserIds.size > 0) {
    const missingUsers = await User.find({
      _id: { $in: Array.from(missingUserIds) },
    })
      .select('name email profileImage')
      .lean();

    const missingLookup = new Map(missingUsers.map((u) => [u._id.toString(), u]));
    for (const uid of missingUserIds) {
      const u = missingLookup.get(uid);
      userMap[uid] = {
        userId: uid,
        name: u?.name || 'Former Member',
        email: u?.email || '',
        profileImage: u?.profileImage || '',
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      };
    }
  }

  let totalTripSpending = 0;

  for (const exp of expenses) {
    totalTripSpending = round2(totalTripSpending + exp.amount);
    const payerId = exp.paidBy.toString();
    userMap[payerId].totalPaid = round2(userMap[payerId].totalPaid + exp.amount);

    for (const p of exp.participants || []) {
      const participantId = p.userId.toString();
      userMap[participantId].totalOwed = round2(
        userMap[participantId].totalOwed + (p.shareAmount || 0)
      );
    }
  }

  const userBalances = Object.values(userMap).map((u) => {
    const net = round2(u.totalPaid - u.totalOwed);
    return {
      ...u,
      netBalance: net,
      status: net > 0.01 ? 'owed' : net < -0.01 ? 'owes' : 'settled',
    };
  });

  const debtors = [];
  const creditors = [];

  userBalances.forEach((u) => {
    if (u.netBalance < -0.01) {
      debtors.push({ ...u, remainingDebt: round2(Math.abs(u.netBalance)) });
    } else if (u.netBalance > 0.01) {
      creditors.push({ ...u, remainingCredit: round2(u.netBalance) });
    }
  });

  debtors.sort((a, b) => b.remainingDebt - a.remainingDebt);
  creditors.sort((a, b) => b.remainingCredit - a.remainingCredit);

  const settlements = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const transferAmount = round2(
      Math.min(debtor.remainingDebt, creditor.remainingCredit)
    );

    if (transferAmount > 0) {
      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        fromEmail: debtor.email,
        to: creditor.userId,
        toName: creditor.name,
        toEmail: creditor.email,
        amount: transferAmount,
        currency: trip.currency,
      });

      debtor.remainingDebt = round2(debtor.remainingDebt - transferAmount);
      creditor.remainingCredit = round2(creditor.remainingCredit - transferAmount);
    }

    if (debtor.remainingDebt < 0.01) dIdx++;
    if (creditor.remainingCredit < 0.01) cIdx++;
  }

  return {
    tripId,
    currency: trip.currency,
    totalExpenses: totalTripSpending,
    userBalances,
    settlements,
    isFullySettled: settlements.length === 0,
  };
};

export default {
  createExpense,
  getTripExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getTripBudgetTracking,
  getExpenseAnalytics,
  calculateSettlements,
};
