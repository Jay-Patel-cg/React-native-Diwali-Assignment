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
import { FormInput } from '../../../components/forms';
import { COLORS } from '../../../constants/theme';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { tripService } from '../../../services';

export default function DailyActivitiesScreen() {
  const { id, dayId, dayNumber } = useLocalSearchParams();
  const router = useRouter();

  const [itineraries, setItineraries] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Activity Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityTime, setActivityTime] = useState('10:00 AM');
  const [activityLocation, setActivityLocation] = useState('');
  const [activityCost, setActivityCost] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadItineraries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tripService.getItineraries(id);
      const days = res.data || [];
      days.sort((a, b) => a.dayNumber - b.dayNumber);
      setItineraries(days);

      // Select target day or first day
      if (dayId) {
        const found = days.find((d) => d._id === dayId);
        setSelectedDay(found || days[0] || null);
      } else if (days.length > 0) {
        setSelectedDay(days[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load daily activities');
    } finally {
      setIsLoading(false);
    }
  }, [id, dayId]);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  const handleOpenAddModal = () => {
    setModalError(null);
    setActivityTitle('');
    setActivityTime('10:00 AM');
    setActivityLocation('');
    setActivityCost('');
    setActivityDescription('');
    setShowAddModal(true);
  };

  const handleCreateActivity = async () => {
    setModalError(null);
    if (!activityTitle.trim()) {
      setModalError('Activity title is required');
      return;
    }
    if (!selectedDay) {
      setModalError('No day selected');
      return;
    }

    setIsSavingActivity(true);
    try {
      const newActivity = {
        title: activityTitle.trim(),
        time: activityTime.trim() || undefined,
        location: activityLocation.trim() || undefined,
        description: activityDescription.trim() || undefined,
        cost: activityCost ? Number(activityCost) : 0,
      };

      const currentActivities = selectedDay.activities || [];
      const updatedActivities = [...currentActivities, newActivity];

      await tripService.updateItinerary(id, selectedDay._id, {
        activities: updatedActivities,
      });

      setShowAddModal(false);
      loadItineraries();
    } catch (err) {
      setModalError(err.message || 'Failed to save activity');
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDeleteActivity = (activityIndex) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to remove this activity from the daily schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = (selectedDay.activities || []).filter(
                (_, idx) => idx !== activityIndex
              );
              await tripService.updateItinerary(id, selectedDay._id, {
                activities: updated,
              });
              loadItineraries();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove activity');
            }
          },
        },
      ]
    );
  };

  const activities = selectedDay?.activities || [];

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Daily Schedule"
        subtitle={
          selectedDay
            ? `Day ${selectedDay.dayNumber} • ${formatDate(selectedDay.date)}`
            : 'Activities planner'
        }
        showBack
        rightAction={
          selectedDay ? (
            <Pressable
              onPress={handleOpenAddModal}
              accessibilityLabel="Add Activity"
              className="w-10 h-10 rounded-full bg-ocean-800 items-center justify-center shadow-xs"
            >
              <Ionicons name="add" size={22} color="#FFF" />
            </Pressable>
          ) : null
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={loadItineraries} retryLabel="Retry" className="mb-4" />
      ) : null}

      {/* Days Selector Bar */}
      {itineraries.length > 0 ? (
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {itineraries.map((day) => {
              const isSelected = selectedDay?._id === day._id;
              return (
                <Pressable
                  key={day._id}
                  onPress={() => setSelectedDay(day)}
                  className={`mr-2.5 px-4 py-2 rounded-2xl border flex-row items-center gap-1.5 ${
                    isSelected
                      ? 'bg-ocean-800 border-ocean-800 shadow-xs'
                      : 'bg-white border-ink-200'
                  }`}
                >
                  <Ionicons
                    name="calendar"
                    size={14}
                    color={isSelected ? '#FFF' : COLORS.textSecondary}
                  />
                  <Typography
                    variant="bodySmall"
                    color={isSelected ? 'inverse' : 'secondary'}
                    style={{ fontWeight: isSelected ? '700' : '500' }}
                  >
                    Day {day.dayNumber}
                  </Typography>
                  <Badge
                    label={String(day.activities?.length || 0)}
                    tone={isSelected ? 'seafoam' : 'ocean'}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Activities Timeline */}
      {isLoading ? (
        <LoadingState message="Loading activities..." />
      ) : itineraries.length === 0 ? (
        <View className="py-12">
          <EmptyState
            title="No Itinerary Days Created"
            message="Please create an itinerary day before adding daily activities."
            actionLabel="Go to Itinerary"
            onAction={() => router.push(`/trips/${id}/itinerary`)}
          />
        </View>
      ) : activities.length > 0 ? (
        <View className="gap-3 pb-8">
          {activities.map((act, idx) => (
            <Card key={act._id || idx} className="p-4 bg-white border border-ink-200">
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center gap-2 mb-1.5 flex-1 mr-2">
                  <View className="w-8 h-8 rounded-xl bg-ocean-50 items-center justify-center">
                    <Ionicons name="compass-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View className="flex-1">
                    <Typography variant="body" style={{ fontWeight: '700' }}>
                      {act.title}
                    </Typography>
                    {act.time ? (
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Ionicons name="time" size={12} color={COLORS.textSecondary} />
                        <Typography variant="caption" color="secondary" style={{ fontWeight: '600' }}>
                          {act.time}
                        </Typography>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Delete Activity */}
                <Pressable
                  onPress={() => handleDeleteActivity(idx)}
                  hitSlop={8}
                  className="w-7 h-7 rounded-lg items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                </Pressable>
              </View>

              {/* Location */}
              {act.location ? (
                <View className="flex-row items-center gap-1.5 my-1">
                  <Ionicons name="location-outline" size={14} color={COLORS.secondary} />
                  <Typography variant="caption" color="secondary">
                    {act.location}
                  </Typography>
                </View>
              ) : null}

              {/* Description */}
              {act.description ? (
                <Typography variant="bodySmall" color="secondary" className="my-1.5 leading-5">
                  {act.description}
                </Typography>
              ) : null}

              {/* Cost Meta */}
              {act.cost > 0 ? (
                <View className="flex-row items-center justify-end pt-2 border-t border-ink-100">
                  <Typography variant="caption" color="muted" className="mr-1">
                    Est. Cost:
                  </Typography>
                  <Typography variant="bodySmall" color="ocean" style={{ fontWeight: '700' }}>
                    {formatCurrency(act.cost, 'INR')}
                  </Typography>
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      ) : (
        <View className="py-12">
          <EmptyState
            title={`No Activities for Day ${selectedDay?.dayNumber}`}
            message="Add schedule items like morning beach walks, coastal boat rides, and seaside lunches."
            actionLabel="+ Add First Activity"
            onAction={handleOpenAddModal}
          />
        </View>
      )}

      {/* Add Activity Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-xl">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="h3">
                Add Activity • Day {selectedDay?.dayNumber}
              </Typography>
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
              label="Activity Title"
              placeholder="e.g. Scuba Diving at Grand Island"
              value={activityTitle}
              onChangeText={setActivityTitle}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormInput
                  label="Time Slot"
                  placeholder="e.g. 09:30 AM"
                  value={activityTime}
                  onChangeText={setActivityTime}
                  leftIcon={<Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />}
                />
              </View>

              <View className="flex-1">
                <FormInput
                  label="Est. Cost (INR)"
                  placeholder="e.g. 1500"
                  value={activityCost}
                  onChangeText={setActivityCost}
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} />}
                />
              </View>
            </View>

            <FormInput
              label="Location / Landmark"
              placeholder="e.g. Grand Island Jetty"
              value={activityLocation}
              onChangeText={setActivityLocation}
              leftIcon={<Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />}
            />

            <FormInput
              label="Notes & Tips"
              placeholder="e.g. Carry waterproof camera, reach 15 min early"
              value={activityDescription}
              onChangeText={setActivityDescription}
              multiline
              numberOfLines={2}
            />

            <Button
              title="Save Activity"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleCreateActivity}
              isLoading={isSavingActivity}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
