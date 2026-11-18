import mongoose from 'mongoose';
import { Expense } from '../models/Expense.js';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Helper to round decimals to 2 decimal places with mathematical precision
 */
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

/**
 * Resolves and calculates participant split shares
 */
const calculateParticipantShares = async (tripId, totalAmount, splitType = 'equal', providedParticipants = []) => {
  const roundedAmount = round2(totalAmount);

  if (splitType === 'equal') {
    let participantUserIds = [];

    if (providedParticipants && providedParticipants.length > 0) {
      participantUserIds = providedParticipants.map((p) => p.userId.toString());
    } else {
      // Default to all accepted members of the trip including the owner
      const members = await TripMember.find({ tripId, invitationStatus: 'accepted' }).select('userId');
      participantUserIds = members.map((m) => m.userId.toString());
    }

    if (participantUserIds.length === 0) {
      throw new ApiError(400, 'At least one participant is required to split the expense');
    }

    const n = participantUserIds.length;
    const baseShare = Math.floor((roundedAmount / n) * 100) / 100;
    let distributed = round2(baseShare * n);
    let remainderCents = Math.round((roundedAmount - distributed) * 100);

    return participantUserIds.map((userId, idx) => {
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
      throw new ApiError(400, 'Participants list with shareAmount is required for exact split');
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

    if (Math.abs(sumShares - roundedAmount) > 0.05) {
      throw new ApiError(
        400,
        `Sum of participant shares (${sumShares}) must match the total expense amount (${roundedAmount})`
      );
    }

    return participants;
  }

  if (splitType === 'percentage') {
    if (!providedParticipants || providedParticipants.length === 0) {
      throw new ApiError(400, 'Participants list with percentage is required for percentage split');
    }

    let sumPercentage = 0;
    providedParticipants.forEach((p) => {
      sumPercentage = round2(sumPercentage + Number(p.percentage || 0));
    });

    if (Math.abs(sumPercentage - 100) > 0.5) {
      throw new ApiError(400, `Sum of participant percentages must equal 100% (Got: ${sumPercentage}%)`);
    }

    return providedParticipants.map((p) => {
      const share = round2(((Number(p.percentage) || 0) / 100) * roundedAmount);
      return {
        userId: p.userId,
        shareAmount: share,
        hasPaid: Boolean(p.hasPaid),
      };
    });
  }

  return providedParticipants;
};

/**
 * Create a new expense for a trip
 */
export const createExpense = async (tripId, requesterId, expenseData) => {
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  const payerId = expenseData.paidBy || requesterId;
  const numAmount = round2(expenseData.amount);
  const currency = (expenseData.currency || trip.currency || 'INR').toUpperCase();
  const splitType = expenseData.splitType || 'equal';

  // Calculate participants and individual split shares
  const participants = await calculateParticipantShares(
    tripId,
    numAmount,
    splitType,
    expenseData.participants
  );

  // Mark payer's own share as settled/paid
  participants.forEach((p) => {
    if (p.userId.toString() === payerId.toString()) {
      p.hasPaid = true;
    }
  });

  const expense = await Expense.create({
    tripId,
    paidBy: payerId,
    title: expenseData.title.trim(),
    amount: numAmount,
    currency,
    category: expenseData.category || 'miscellaneous',
    expenseDate: expenseData.expenseDate ? new Date(expenseData.expenseDate) : new Date(),
    notes: expenseData.notes ? expenseData.notes.trim() : '',
    splitType,
    participants,
    receiptImage: expenseData.receiptImage || '',
  });

  return Expense.findById(expense._id)
    .populate('paidBy', 'name email profileImage')
    .populate('participants.userId', 'name email profileImage');
};

/**
 * Retrieve paginated and filtered expenses for a trip
 */
export const getTripExpenses = async (tripId, queryParams = {}) => {
  const {
    page = 1,
    limit = 20,
    category,
    paidBy,
    startDate,
    endDate,
    search,
    sort = 'desc',
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

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

  if (search && search.trim().length > 0) {
    const searchRegex = new RegExp(search.trim(), 'i');
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
      .limit(limitNum),
    Expense.countDocuments(filter),
    Expense.aggregate([
      { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
      { $group: { _id: null, totalSum: { $sum: '$amount' } } },
    ]),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;
  const tripTotalExpenditure = aggregateTotal.length > 0 ? round2(aggregateTotal[0].totalSum) : 0;

  return {
    expenses,
    tripTotalExpenditure,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  };
};

/**
 * Retrieve a single expense by ID
 */
export const getExpenseById = async (tripId, expenseId) => {
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
export const updateExpense = async (tripId, expenseId, requesterId, requesterRole, updateData) => {
  const expense = await Expense.findOne({ _id: expenseId, tripId });
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  const isPayer = expense.paidBy.toString() === requesterId.toString();
  const isPrivileged = requesterRole === 'owner' || requesterRole === 'admin';

  if (!isPayer && !isPrivileged) {
    throw new ApiError(
      403,
      'Permission denied. Only the payer, trip admin, or trip owner can edit this expense.'
    );
  }

  const newAmount = updateData.amount !== undefined ? round2(updateData.amount) : expense.amount;
  const newSplitType = updateData.splitType || expense.splitType;
  const newParticipants = updateData.participants || expense.participants;

  // If amount, splitType, or participants changed, recalculate participant shares
  if (
    updateData.amount !== undefined ||
    updateData.splitType !== undefined ||
    updateData.participants !== undefined
  ) {
    const updatedParticipants = await calculateParticipantShares(
      tripId,
      newAmount,
      newSplitType,
      newParticipants
    );

    const payer = updateData.paidBy || expense.paidBy;
    updatedParticipants.forEach((p) => {
      if (p.userId.toString() === payer.toString()) {
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
  if (updateData.receiptImage !== undefined) expense.receiptImage = updateData.receiptImage;

  await expense.save();

  return Expense.findById(expense._id)
    .populate('paidBy', 'name email profileImage')
    .populate('participants.userId', 'name email profileImage');
};

/**
 * Delete an expense
 */
export const deleteExpense = async (tripId, expenseId, requesterId, requesterRole) => {
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
  const percentageSpent = totalBudget > 0 ? round2((totalSpent / totalBudget) * 100) : 0;
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
 * Detailed Expense Analytics & Category-wise Breakdown
 */
export const getExpenseAnalytics = async (tripId) => {
  const trip = await Trip.findById(tripId).select('budget currency');
  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // 1. Category-wise Aggregation
  const categoryAggregation = await Expense.aggregate([
    { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  const totalExpenses = round2(
    categoryAggregation.reduce((acc, cat) => acc + cat.totalAmount, 0)
  );

  const categoryBreakdown = categoryAggregation.map((cat) => ({
    category: cat._id,
    totalAmount: round2(cat.totalAmount),
    transactionCount: cat.transactionCount,
    percentageOfTotal: totalExpenses > 0 ? round2((cat.totalAmount / totalExpenses) * 100) : 0,
  }));

  // 2. Spending per person (who paid what)
  const paidByAggregation = await Expense.aggregate([
    { $match: { tripId: new mongoose.Types.ObjectId(tripId) } },
    {
      $group: {
        _id: '$paidBy',
        totalPaid: { $sum: '$amount' },
        paidCount: { $sum: 1 },
      },
    },
  ]);

  // Populate user details for paidBy
  const paidByUserMap = {};
  for (const item of paidByAggregation) {
    const user = await User.findById(item._id).select('name email profileImage');
    paidByUserMap[item._id.toString()] = {
      user: user || { _id: item._id, name: 'Unknown User' },
      totalPaid: round2(item.totalPaid),
      transactionsPaid: item.paidCount,
    };
  }

  return {
    tripId,
    currency: trip.currency,
    totalExpenses,
    categoryBreakdown,
    payerStatistics: Object.values(paidByUserMap),
  };
};

/**
 * Multi-Party Debt Simplification & Settlement Calculation
 *
 * Implements a true multi-party settlement algorithm:
 * 1. Calculates exact net balance for each person: netBalance = totalPaid - totalShare
 * 2. Does NOT assume anyone owes the trip owner.
 * 3. Uses greedy two-pointer matching to minimize the number of transfer transactions.
 */
export const calculateSettlements = async (tripId) => {
  const trip = await Trip.findById(tripId).select('currency');
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

  // Initialize all known trip members
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

  // Calculate contributions and shares across all expenses
  let totalTripSpending = 0;

  for (const exp of expenses) {
    totalTripSpending = round2(totalTripSpending + exp.amount);
    const payerId = exp.paidBy.toString();

    // Ensure payer exists in map
    if (!userMap[payerId]) {
      const payerUser = await User.findById(payerId).select('name email profileImage');
      userMap[payerId] = {
        userId: payerId,
        name: payerUser ? payerUser.name : 'Unknown User',
        email: payerUser ? payerUser.email : '',
        profileImage: payerUser ? payerUser.profileImage : '',
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      };
    }

    userMap[payerId].totalPaid = round2(userMap[payerId].totalPaid + exp.amount);

    // Track participants shares
    if (exp.participants && exp.participants.length > 0) {
      for (const p of exp.participants) {
        const participantId = p.userId.toString();
        if (!userMap[participantId]) {
          const partUser = await User.findById(participantId).select('name email profileImage');
          userMap[participantId] = {
            userId: participantId,
            name: partUser ? partUser.name : 'Participant',
            email: partUser ? partUser.email : '',
            profileImage: partUser ? partUser.profileImage : '',
            totalPaid: 0,
            totalOwed: 0,
            netBalance: 0,
          };
        }
        userMap[participantId].totalOwed = round2(userMap[participantId].totalOwed + (p.shareAmount || 0));
      }
    }
  }

  // Calculate net balance for each person
  // Positive netBalance = Creditor (is owed money)
  // Negative netBalance = Debtor (owes money)
  const userBalances = Object.values(userMap).map((u) => {
    const net = round2(u.totalPaid - u.totalOwed);
    return {
      ...u,
      netBalance: net,
      status: net > 0.01 ? 'owed' : net < -0.01 ? 'owes' : 'settled',
    };
  });

  // Separate debtors and creditors for settlement resolution
  const debtors = [];
  const creditors = [];

  userBalances.forEach((u) => {
    if (u.netBalance < -0.01) {
      debtors.push({ ...u, remainingDebt: round2(Math.abs(u.netBalance)) });
    } else if (u.netBalance > 0.01) {
      creditors.push({ ...u, remainingCredit: round2(u.netBalance) });
    }
  });

  // Sort debtors and creditors descending by amounts
  debtors.sort((a, b) => b.remainingDebt - a.remainingDebt);
  creditors.sort((a, b) => b.remainingCredit - a.remainingCredit);

  const settlements = [];
  let dIdx = 0;
  let cIdx = 0;

  // Minimal transaction resolution
  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const transferAmount = round2(Math.min(debtor.remainingDebt, creditor.remainingCredit));

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

