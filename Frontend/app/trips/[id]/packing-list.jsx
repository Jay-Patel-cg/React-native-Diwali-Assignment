import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, ScrollView, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
  LoadingState,
  ErrorState,
  EmptyState,
} from '../../../components/ui';
import { ScreenHeader } from '../../../components/navigation';
import { Card } from '../../../components/cards';
import { FormInput, FormSelect } from '../../../components/forms';
import { COLORS } from '../../../constants/theme';
import { PACKING_CATEGORIES } from '../../../constants/config';
import { tripService } from '../../../services';

const CATEGORY_ICONS = {
  clothing: 'shirt-outline',
  beachwear: 'water-outline',
  toiletries: 'sparkles-outline',
  electronics: 'hardware-chip-outline',
  documents: 'document-text-outline',
  medication: 'medkit-outline',
  accessories: 'glasses-outline',
  other: 'cube-outline',
};

export default function PackingListScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [packingList, setPackingList] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('beachwear');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadPackingList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tripService.getPackingList(id);
      setPackingList(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load packing list');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPackingList();
  }, [loadPackingList]);

  // Toggle packed status with optimistic UI update
  const handleTogglePacked = async (item) => {
    const nextPacked = !item.isPacked;

    // Optimistic update
    setPackingList((prev) => {
      if (!prev) return prev;
      const updatedItems = (prev.items || []).map((i) =>
        i._id === item._id ? { ...i, isPacked: nextPacked } : i
      );
      const packedCount = updatedItems.filter((i) => i.isPacked).length;
      const totalCount = updatedItems.length;
      return {
        ...prev,
        items: updatedItems,
        progress: {
          totalItems: totalCount,
          packedItems: packedCount,
          percentage: totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0,
        },
      };
    });

    try {
      await tripService.updatePackingItem(id, item._id, { isPacked: nextPacked });
    } catch (err) {
      // Revert if API fails
      loadPackingList();
      Alert.alert('Error', err.message || 'Failed to update item');
    }
  };

  const handleAddItem = async () => {
    setModalError(null);
    if (!itemName.trim()) {
      setModalError('Item name is required');
      return;
    }

    setIsAddingItem(true);
    try {
      await tripService.addPackingItems(id, {
        items: [
          {
            itemName: itemName.trim(),
            name: itemName.trim(),
            category: itemCategory,
            quantity: Number(itemQuantity) || 1,
            isPacked: false,
          },
        ],
      });
      setShowAddModal(false);
      setItemName('');
      setItemQuantity(1);
      loadPackingList();
    } catch (err) {
      setModalError(err.message || 'Failed to add packing item');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = (item) => {
    const displayName = item.itemName || item.name || 'Item';
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove "${displayName}" from your packing checklist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tripService.deletePackingItem(id, item._id);
              loadPackingList();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const allItems = packingList?.items || [];
  const progress = packingList?.progress || {
    totalItems: allItems.length,
    packedItems: allItems.filter((i) => i.isPacked).length,
    percentage:
      allItems.length > 0
        ? Math.round((allItems.filter((i) => i.isPacked).length / allItems.length) * 100)
        : 0,
  };

  const filteredItems =
    selectedCategory === 'all'
      ? allItems
      : allItems.filter((i) => i.category === selectedCategory);

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Packing Checklist"
        subtitle="Be beach-ready with coastal essentials"
        showBack
        rightAction={
          <Pressable
            onPress={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            accessibilityLabel="Add Item"
            className="w-10 h-10 rounded-full bg-ocean-800 items-center justify-center shadow-xs"
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </Pressable>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={loadPackingList} retryLabel="Retry" className="mb-4" />
      ) : null}

      {/* Packing Progress Card */}
      <Card className="mb-4 p-4 bg-white border border-ink-200">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-xl bg-seafoam-50 items-center justify-center">
              <Ionicons name="bag-check" size={18} color={COLORS.secondary} />
            </View>
            <Typography variant="h3">
              Packing Progress
            </Typography>
          </View>
          <Badge
            label={`${progress.percentage}% Packed`}
            tone={progress.percentage === 100 ? 'success' : 'seafoam'}
          />
        </View>

        <Typography variant="caption" color="secondary" className="mb-2">
          {progress.packedItems} of {progress.totalItems} items packed into your bags
        </Typography>

        <View className="h-2.5 w-full bg-ink-100 rounded-full overflow-hidden">
          <View
            className="h-full bg-seafoam-500 rounded-full"
            style={{ width: `${progress.percentage}%` }}
          />
        </View>
      </Card>

      {/* Category Pills */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          <Pressable
            onPress={() => setSelectedCategory('all')}
            className={`mr-2 px-3.5 py-1.5 rounded-full border ${
              selectedCategory === 'all'
                ? 'bg-ocean-800 border-ocean-800'
                : 'bg-white border-ink-200'
            }`}
          >
            <Typography
              variant="bodySmall"
              color={selectedCategory === 'all' ? 'inverse' : 'secondary'}
              style={{ fontWeight: selectedCategory === 'all' ? '700' : '500' }}
            >
              All Items ({allItems.length})
            </Typography>
          </Pressable>

          {PACKING_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = allItems.filter((i) => i.category === cat).length;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`mr-2 px-3.5 py-1.5 rounded-full border capitalize ${
                  isSelected
                    ? 'bg-ocean-800 border-ocean-800'
                    : 'bg-white border-ink-200'
                }`}
              >
                <Typography
                  variant="bodySmall"
                  color={isSelected ? 'inverse' : 'secondary'}
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                >
                  {cat} ({count})
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Items List */}
      {isLoading ? (
        <LoadingState message="Loading packing items..." />
      ) : filteredItems.length > 0 ? (
        <View className="gap-2.5 pb-8">
          {filteredItems.map((item) => {
            const iconName = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other;

            return (
              <Card
                key={item._id}
                className={`p-3.5 bg-white border ${
                  item.isPacked ? 'border-seafoam-200 bg-seafoam-50/20' : 'border-ink-200'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={() => handleTogglePacked(item)}
                    className="flex-row items-center gap-3 flex-1 mr-2"
                  >
                    {/* Checkbox */}
                    <View
                      className={`w-6 h-6 rounded-lg items-center justify-center border ${
                        item.isPacked
                          ? 'bg-seafoam-500 border-seafoam-500'
                          : 'border-ink-300 bg-white'
                      }`}
                    >
                      {item.isPacked ? (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      ) : null}
                    </View>

                    <View className="w-8 h-8 rounded-xl bg-ink-50 items-center justify-center">
                      <Ionicons
                        name={iconName}
                        size={16}
                        color={item.isPacked ? COLORS.secondary : COLORS.textSecondary}
                      />
                    </View>

                    <View className="flex-1">
                      <Typography
                        variant="body"
                        style={{
                          fontWeight: '600',
                          textDecorationLine: item.isPacked ? 'line-through' : 'none',
                          color: item.isPacked ? COLORS.textMuted : COLORS.textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {item.itemName || item.name}
                      </Typography>
                      <Typography variant="caption" color="muted">
                        Qty: {item.quantity || 1} • {item.category}
                      </Typography>
                    </View>
                  </Pressable>

                  {/* Delete Item */}
                  <Pressable
                    onPress={() => handleDeleteItem(item)}
                    hitSlop={8}
                    className="w-7 h-7 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <View className="py-12">
          <EmptyState
            title="No Items in this Category"
            message="Add packing essentials like sunscreen, sunglasses, flip-flops, and power banks."
            actionLabel="+ Add Packing Item"
            onAction={() => setShowAddModal(true)}
          />
        </View>
      )}

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-xl">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="h3">Add Packing Item</Typography>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {modalError ? (
              <View className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Typography variant="caption" color="danger" className="flex-1">
                  {modalError}
                </Typography>
              </View>
            ) : null}

            <FormInput
              label="Item Name"
              placeholder="e.g. UV Sunscreen SPF 50+, Beach Towel"
              value={itemName}
              onChangeText={setItemName}
            />

            <FormSelect
              label="Packing Category"
              options={PACKING_CATEGORIES}
              value={itemCategory}
              onChange={setItemCategory}
            />

            <View className="mb-5">
              <Typography variant="label" color="secondary" className="mb-1.5 ml-0.5">
                Quantity
              </Typography>
              <View className="flex-row items-center justify-between rounded-2xl border border-ink-200 px-4 min-h-[50px] bg-white">
                <Pressable
                  onPress={() => setItemQuantity((prev) => Math.max(1, prev - 1))}
                  hitSlop={8}
                  className="w-8 h-8 rounded-full bg-ink-100 items-center justify-center"
                >
                  <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
                </Pressable>

                <Typography variant="body" style={{ fontWeight: '700' }}>
                  {itemQuantity}
                </Typography>

                <Pressable
                  onPress={() => setItemQuantity((prev) => prev + 1)}
                  hitSlop={8}
                  className="w-8 h-8 rounded-full bg-ink-100 items-center justify-center"
                >
                  <Ionicons name="add" size={16} color={COLORS.textPrimary} />
                </Pressable>
              </View>
            </View>

            <Button
              title="Add to Packing List"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleAddItem}
              isLoading={isAddingItem}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
