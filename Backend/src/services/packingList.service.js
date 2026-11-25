import { PackingList } from '../models/PackingList.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, buildPaginationMeta } from '../utils/queryHelpers.js';

/**
 * Computes real-time packing progress and category breakdown from items.
 */
const computePackingProgress = (allItems = []) => {
  const totalItems = allItems.length;
  let packedItems = 0;
  let totalQuantity = 0;
  let packedQuantity = 0;
  const categoryMap = {};

  for (const item of allItems) {
    const qty = Number(item.quantity) || 1;
    totalQuantity += qty;

    if (item.isPacked) {
      packedItems++;
      packedQuantity += qty;
    }

    const cat = item.category || 'other';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, total: 0, packed: 0 };
    }
    categoryMap[cat].total++;
    if (item.isPacked) categoryMap[cat].packed++;
  }

  const completionPercentage =
    totalItems > 0
      ? Math.round((packedItems / totalItems) * 10000) / 100
      : 0;

  const categoryBreakdown = Object.values(categoryMap).map((c) => ({
    ...c,
    percentage: c.total > 0 ? Math.round((c.packed / c.total) * 10000) / 100 : 0,
  }));

  return {
    totalItems,
    packedItems,
    unpackedItems: totalItems - packedItems,
    totalQuantity,
    packedQuantity,
    completionPercentage,
    categoryBreakdown,
  };
};

/**
 * Create a packing list for a trip if missing, and append any provided items.
 */
export const createOrAddItems = async (tripId, items = []) => {
  let packingList = await PackingList.findOne({ tripId });

  if (!packingList) {
    packingList = await PackingList.create({
      tripId,
      items,
    });
  } else if (items.length > 0) {
    packingList.items.push(...items);
    await packingList.save();
  }

  const populated = await PackingList.findById(packingList._id).populate(
    'items.assignedTo',
    'name email profileImage'
  );

  return {
    _id: populated._id,
    tripId: populated.tripId,
    items: populated.items,
    progress: computePackingProgress(populated.items),
    updatedAt: populated.updatedAt,
  };
};

/**
 * Get the packing list for a trip with optional filtering, search, pagination, and progress.
 */
export const getPackingList = async (tripId, queryParams = {}) => {
  const { category, isPacked, assignedTo, search, page, limit } = queryParams;

  let packingList = await PackingList.findOne({ tripId }).populate(
    'items.assignedTo',
    'name email profileImage'
  );

  // Auto-initialize empty packing list if none exists yet for an existing trip
  if (!packingList) {
    packingList = await PackingList.create({ tripId, items: [] });
  }

  const allItems = packingList.items || [];
  const progress = computePackingProgress(allItems);

  let filteredItems = allItems;

  if (category) {
    const normalizedCat = String(category).toLowerCase().trim();
    filteredItems = filteredItems.filter((i) => i.category === normalizedCat);
  }

  if (isPacked !== undefined) {
    const packedBool = isPacked === 'true' || isPacked === true;
    filteredItems = filteredItems.filter((i) => Boolean(i.isPacked) === packedBool);
  }

  if (assignedTo) {
    filteredItems = filteredItems.filter(
      (i) => i.assignedTo && i.assignedTo._id.toString() === String(assignedTo)
    );
  }

  if (search && String(search).trim().length > 0) {
    const q = String(search).trim().toLowerCase();
    filteredItems = filteredItems.filter((i) =>
      i.itemName.toLowerCase().includes(q)
    );
  }

  const totalFiltered = filteredItems.length;
  let paginatedItems = filteredItems;
  let pagination = null;

  if (page !== undefined || limit !== undefined) {
    const parsed = parsePagination(
      { page, limit },
      { defaultLimit: 25, maxLimit: 100 }
    );
    paginatedItems = filteredItems.slice(parsed.skip, parsed.skip + parsed.limit);
    pagination = buildPaginationMeta(totalFiltered, parsed.page, parsed.limit);
  }

  return {
    _id: packingList._id,
    tripId: packingList.tripId,
    items: paginatedItems,
    progress,
    ...(pagination && { pagination }),
    updatedAt: packingList.updatedAt,
  };
};

/**
 * Update a single packing list item (edit fields or toggle packed status).
 */
export const updatePackingItem = async (tripId, itemId, updateData) => {
  const packingList = await PackingList.findOne({ tripId });
  if (!packingList) {
    throw new ApiError(404, 'Packing list not found for this trip');
  }

  const item = packingList.items.id(itemId);
  if (!item) {
    throw new ApiError(404, 'Packing list item not found');
  }

  if (updateData.itemName !== undefined) item.itemName = updateData.itemName.trim();
  if (updateData.quantity !== undefined) item.quantity = Number(updateData.quantity);
  if (updateData.isPacked !== undefined) item.isPacked = Boolean(updateData.isPacked);
  if (updateData.category !== undefined) item.category = updateData.category;
  if (updateData.assignedTo !== undefined) {
    item.assignedTo = updateData.assignedTo || null;
  }

  await packingList.save();

  const populated = await PackingList.findById(packingList._id).populate(
    'items.assignedTo',
    'name email profileImage'
  );
  const updatedItem = populated.items.id(itemId);

  return {
    item: updatedItem,
    progress: computePackingProgress(populated.items),
  };
};

/**
 * Delete a single item from the trip's packing list.
 */
export const deletePackingItem = async (tripId, itemId) => {
  const packingList = await PackingList.findOne({ tripId });
  if (!packingList) {
    throw new ApiError(404, 'Packing list not found for this trip');
  }

  const item = packingList.items.id(itemId);
  if (!item) {
    throw new ApiError(404, 'Packing list item not found');
  }

  item.deleteOne();
  await packingList.save();

  return {
    deletedItemId: itemId,
    progress: computePackingProgress(packingList.items),
  };
};

export default {
  createOrAddItems,
  getPackingList,
  updatePackingItem,
  deletePackingItem,
};

