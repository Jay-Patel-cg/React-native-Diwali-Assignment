import React, { useState } from 'react';
import {
  View,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import Typography from '../ui/Typography';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const CATEGORY_ICONS = {
  sightseeing: 'camera-outline',
  beach: 'sunny-outline',
  dining: 'restaurant-outline',
  water_sports: 'boat-outline',
  transport: 'car-outline',
  accommodation: 'bed-outline',
  relaxation: 'cafe-outline',
  shopping: 'bag-handle-outline',
  other: 'compass-outline',
};

export function AiPlanDayCard({
  day,
  dayIndex,
  onUpdateDay,
  onDeleteActivity,
  onUpdateActivity,
  onAddActivity,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null = add new, number = editing

  // Modal form state
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formCategory, setFormCategory] = useState('sightseeing');

  const activities = day.activities || [];
  const dayNumber = day.dayNumber || day.day || dayIndex + 1;
  const dayTitle = day.title || day.theme || `Day ${dayNumber} Exploration`;

  const openAddModal = () => {
    setEditingIndex(null);
    setFormTitle('');
    setFormTime('10:00 AM');
    setFormDescription('');
    setFormCost('0');
    setFormCategory('sightseeing');
    setModalVisible(true);
  };

  const openEditModal = (activity, index) => {
    setEditingIndex(index);
    setFormTitle(activity.title || '');
    setFormTime(activity.time || activity.timeOfDay || '');
    setFormDescription(activity.description || '');
    setFormCost(String(activity.estimatedCost || activity.cost || '0'));
    setFormCategory(activity.category || 'sightseeing');
    setModalVisible(true);
  };

  const handleSaveModal = () => {
    if (!formTitle.trim()) {
      Alert.alert('Required', 'Please enter an activity title.');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      time: formTime.trim() || undefined,
      description: formDescription.trim(),
      estimatedCost: Number(formCost) || 0,
      category: formCategory,
    };

    if (editingIndex !== null) {
      onUpdateActivity?.(dayNumber, editingIndex, payload);
    } else {
      onAddActivity?.(dayNumber, payload);
    }

    setModalVisible(false);
  };

  const confirmDeleteActivity = (index, actTitle) => {
    Alert.alert(
      'Remove Activity',
      `Are you sure you want to remove "${actTitle || 'this activity'}" from Day ${dayNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onDeleteActivity?.(dayNumber, index),
        },
      ]
    );
  };

  return (
    <View className="bg-white rounded-2xl border border-ink-200 mb-4 overflow-hidden shadow-xs">
      {/* Day Header */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between p-4 bg-ocean-50/60 border-b border-ink-100"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-9 h-9 rounded-xl bg-ocean-700 items-center justify-center mr-3 shadow-xs">
            <Typography variant="bodySmall" color="inverse" style={{ fontWeight: '700' }}>
              D{dayNumber}
            </Typography>
          </View>
          <View className="flex-1">
            <Typography variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
              {dayTitle}
            </Typography>
            {day.date ? (
              <Typography variant="caption" color="secondary">
                {day.date} • {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
              </Typography>
            ) : (
              <Typography variant="caption" color="secondary">
                {activities.length} scheduled {activities.length === 1 ? 'activity' : 'activities'}
              </Typography>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textSecondary}
          />
        </View>
      </Pressable>

      {/* Activities Timeline */}
      {isExpanded && (
        <View className="p-4">
          {activities.length === 0 ? (
            <View className="py-4 items-center">
              <Typography variant="caption" color="muted">
                No activities for this day yet.
              </Typography>
            </View>
          ) : (
            activities.map((act, idx) => {
              const iconName =
                CATEGORY_ICONS[act.category?.toLowerCase()] || 'compass-outline';
              const costDisplay =
                act.estimatedCost !== undefined
                  ? act.estimatedCost > 0
                    ? `₹${act.estimatedCost}`
                    : 'Free'
                  : null;

              return (
                <View
                  key={idx}
                  className={`flex-row pb-4 ${
                    idx !== activities.length - 1 ? 'border-l-2 border-ocean-100 ml-4 pl-4' : 'ml-4 pl-4'
                  } relative`}
                >
                  {/* Timeline dot */}
                  <View
                    className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-ocean-600 items-center justify-center"
                  />

                  {/* Activity Details Card */}
                  <View className="flex-1 bg-ink-50/70 border border-ink-100 rounded-xl p-3">
                    <View className="flex-row items-start justify-between mb-1">
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-1.5 mb-0.5">
                          {act.time ? (
                            <Badge label={act.time} tone="neutral" />
                          ) : null}
                          {costDisplay ? (
                            <Badge label={costDisplay} tone="seafoam" />
                          ) : null}
                        </View>
                        <Typography
                          variant="bodySmall"
                          style={{ fontWeight: '700' }}
                          className="mt-0.5"
                        >
                          {act.title}
                        </Typography>
                      </View>

                      {/* Edit & Delete Actions */}
                      <View className="flex-row items-center gap-1">
                        <Pressable
                          onPress={() => openEditModal(act, idx)}
                          hitSlop={6}
                          className="p-1 rounded bg-white border border-ink-200"
                        >
                          <Ionicons name="pencil" size={13} color={COLORS.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDeleteActivity(idx, act.title)}
                          hitSlop={6}
                          className="p-1 rounded bg-white border border-ink-200"
                        >
                          <Ionicons name="trash-outline" size={13} color={COLORS.error} />
                        </Pressable>
                      </View>
                    </View>

                    {act.description ? (
                      <Typography
                        variant="caption"
                        color="secondary"
                        className="mt-1 leading-4"
                      >
                        {act.description}
                      </Typography>
                    ) : null}

                    {act.location ? (
                      <View className="flex-row items-center mt-1.5 gap-1">
                        <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                        <Typography variant="caption" color="muted">
                          {act.location}
                        </Typography>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}

          {/* Add Activity Button */}
          <Pressable
            onPress={openAddModal}
            className="flex-row items-center justify-center py-2.5 px-4 mt-2 rounded-xl border border-dashed border-ocean-300 bg-ocean-50/40 active:bg-ocean-100"
          >
            <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
            <Typography
              variant="caption"
              color="ocean"
              style={{ fontWeight: '700' }}
              className="ml-1.5"
            >
              Add Activity to Day {dayNumber}
            </Typography>
          </Pressable>
        </View>
      )}

      {/* Edit / Add Activity Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-3xl p-5 border border-ink-100 shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="h3">
                {editingIndex !== null ? 'Edit Activity' : `Add Activity (Day ${dayNumber})`}
              </Typography>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            <View className="mb-3">
              <Typography variant="caption" color="secondary" className="mb-1">
                Activity Title *
              </Typography>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Scuba diving at Grand Island"
                placeholderTextColor={COLORS.textMuted}
                className="bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5 text-ink-900 text-sm"
              />
            </View>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <Typography variant="caption" color="secondary" className="mb-1">
                  Time / Slot
                </Typography>
                <TextInput
                  value={formTime}
                  onChangeText={setFormTime}
                  placeholder="e.g. 10:00 AM"
                  placeholderTextColor={COLORS.textMuted}
                  className="bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5 text-ink-900 text-sm"
                />
              </View>
              <View className="flex-1">
                <Typography variant="caption" color="secondary" className="mb-1">
                  Estimated Cost (₹)
                </Typography>
                <TextInput
                  value={formCost}
                  onChangeText={setFormCost}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  className="bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5 text-ink-900 text-sm"
                />
              </View>
            </View>

            <View className="mb-4">
              <Typography variant="caption" color="secondary" className="mb-1">
                Description & Tips
              </Typography>
              <TextInput
                value={formDescription}
                onChangeText={setFormDescription}
                multiline
                numberOfLines={3}
                placeholder="Details, travel tips, what to wear..."
                placeholderTextColor={COLORS.textMuted}
                className="bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5 text-ink-900 text-sm"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <View className="flex-row justify-end gap-2">
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => setModalVisible(false)}
              />
              <Button
                title={editingIndex !== null ? 'Save Changes' : 'Add Activity'}
                variant="primary"
                size="sm"
                onPress={handleSaveModal}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default AiPlanDayCard;
