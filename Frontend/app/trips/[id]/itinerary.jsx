import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, ScrollView, Alert, Modal } from 'react-native';
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
import { formatDate } from '../../../utils/formatters';
import { tripService } from '../../../services';

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [trip, setTrip] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Day Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDayNumber, setNewDayNumber] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tripRes, itinRes] = await Promise.all([
        tripService.getTripById(id),
        tripService.getItineraries(id),
      ]);
      setTrip(tripRes.data);
      const days = itinRes.data || [];
      days.sort((a, b) => a.dayNumber - b.dayNumber);
      setItineraries(days);
    } catch (err) {
      setError(err.message || 'Failed to load itinerary');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal with auto-calculated next day number and date
  const handleOpenAddModal = () => {
    setModalError(null);
    const nextDay = itineraries.length > 0
      ? Math.max(...itineraries.map((i) => i.dayNumber)) + 1
      : 1;

    setNewDayNumber(String(nextDay));

    if (trip?.startDate) {
      const baseDate = new Date(trip.startDate);
      baseDate.setDate(baseDate.getDate() + (nextDay - 1));
      setNewDate(baseDate.toISOString().split('T')[0]);
    } else {
      setNewDate(new Date().toISOString().split('T')[0]);
    }

    setNewNotes('');
    setShowAddModal(true);
  };

  const handleCreateDay = async () => {
    setModalError(null);
    if (!newDayNumber || isNaN(Number(newDayNumber))) {
      setModalError('Please enter a valid day number');
      return;
    }
    if (!newDate) {
      setModalError('Please enter a date');
      return;
    }

    setIsSavingDay(true);
    try {
      await tripService.createItinerary(id, {
        dayNumber: Number(newDayNumber),
        date: new Date(newDate).toISOString(),
        notes: newNotes.trim(),
        activities: [],
      });
      setShowAddModal(false);
      loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to create itinerary day');
    } finally {
      setIsSavingDay(false);
    }
  };

  const handleDeleteDay = (day) => {
    Alert.alert(
      `Delete Day ${day.dayNumber}`,
      `Are you sure you want to delete Day ${day.dayNumber} and its scheduled activities?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tripService.deleteItinerary(id, day._id);
              loadData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete day');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Expedition Itinerary"
        subtitle={trip?.title || 'Daily planner'}
        showBack
        rightAction={
          <Pressable
            onPress={handleOpenAddModal}
            accessibilityLabel="Add Day"
            className="w-10 h-10 rounded-full bg-ocean-800 items-center justify-center shadow-xs"
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </Pressable>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={loadData} retryLabel="Retry" className="mb-4" />
      ) : null}

      {isLoading ? (
        <LoadingState message="Loading daily itinerary..." />
      ) : itineraries.length > 0 ? (
        /* Timeline Itinerary Days */
        <View className="py-2 gap-4 pb-8">
          {itineraries.map((day, idx) => {
            const hasActivities = Array.isArray(day.activities) && day.activities.length > 0;

            return (
              <View key={day._id} className="relative flex-row items-start">
                {/* Timeline vertical bar & circle badge */}
                <View className="items-center mr-3 mt-1">
                  <View className="w-9 h-9 rounded-full bg-ocean-800 items-center justify-center border-2 border-ocean-100 z-10 shadow-xs">
                    <Typography variant="caption" color="inverse" style={{ fontWeight: '800' }}>
                      {day.dayNumber}
                    </Typography>
                  </View>
                  {idx < itineraries.length - 1 ? (
                    <View className="w-[2px] bg-ocean-200 flex-1 my-1 min-h-[70px]" />
                  ) : null}
                </View>

                {/* Day Card */}
                <Card className="flex-1 mb-2 bg-white border border-ink-200 p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View>
                      <Typography variant="h3">
                        Day {day.dayNumber}
                      </Typography>
                      {day.date ? (
                        <Typography variant="caption" color="secondary">
                          {formatDate(day.date)}
                        </Typography>
                      ) : null}
                    </View>

                    <View className="flex-row items-center gap-1">
                      {/* Manage activities for this day */}
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: `/trips/${id}/activities`,
                            params: { dayId: day._id, dayNumber: day.dayNumber },
                          })
                        }
                        className="px-2.5 py-1 rounded-xl bg-ocean-50 border border-ocean-100 flex-row items-center gap-1"
                      >
                        <Ionicons name="list" size={13} color={COLORS.primary} />
                        <Typography variant="caption" color="ocean" style={{ fontWeight: '700' }}>
                          Activities ({day.activities?.length || 0})
                        </Typography>
                      </Pressable>

                      {/* Delete day */}
                      <Pressable
                        onPress={() => handleDeleteDay(day)}
                        hitSlop={6}
                        className="w-7 h-7 rounded-lg items-center justify-center"
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Highlights / Notes */}
                  {day.notes ? (
                    <Typography variant="bodySmall" color="secondary" className="mb-3 leading-5">
                      {day.notes}
                    </Typography>
                  ) : null}

                  {/* Activities preview mini list */}
                  {hasActivities ? (
                    <View className="bg-ink-50 rounded-2xl p-2.5 gap-2 border border-ink-100">
                      {day.activities.slice(0, 3).map((act, actIdx) => (
                        <View key={act._id || actIdx} className="flex-row items-center gap-2">
                          <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
                          <Typography variant="caption" color="secondary" style={{ fontWeight: '600' }}>
                            {act.time || 'All day'}
                          </Typography>
                          <Typography variant="caption" numberOfLines={1} className="flex-1 text-ink-900">
                            • {act.title}
                          </Typography>
                        </View>
                      ))}

                      {day.activities.length > 3 ? (
                        <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
                          + {day.activities.length - 3} more activities
                        </Typography>
                      ) : null}
                    </View>
                  ) : (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: `/trips/${id}/activities`,
                          params: { dayId: day._id, dayNumber: day.dayNumber },
                        })
                      }
                      className="py-2 items-center justify-center border border-dashed border-ink-200 rounded-xl"
                    >
                      <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
                        + Add daily activities & schedule
                      </Typography>
                    </Pressable>
                  )}
                </Card>
              </View>
            );
          })}
        </View>
      ) : (
        <View className="py-12">
          <EmptyState
            title="No Itinerary Days Planned"
            message="Organize your expedition day by day with custom activities, scenic spots, and meal stops."
            actionLabel="+ Add Day 1"
            onAction={handleOpenAddModal}
          />
        </View>
      )}

      {/* Add Day Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-xl">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="h3">Add Itinerary Day</Typography>
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

            <View className="flex-row gap-3">
              <View className="w-28">
                <FormInput
                  label="Day #"
                  value={newDayNumber}
                  onChangeText={setNewDayNumber}
                  keyboardType="numeric"
                  placeholder="e.g. 1"
                />
              </View>

              <View className="flex-1">
                <FormInput
                  label="Date (YYYY-MM-DD)"
                  value={newDate}
                  onChangeText={setNewDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <FormInput
              label="Highlights / Notes"
              placeholder="e.g. Arrival at Goa airport, check into Palolem beach cottage, sunset dinner at the shack"
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
              numberOfLines={3}
            />

            <Button
              title="Add Itinerary Day"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleCreateDay}
              isLoading={isSavingDay}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
