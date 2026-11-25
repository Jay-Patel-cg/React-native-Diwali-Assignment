import React, { useState } from 'react';
import { View, Pressable, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { Card } from '../../components/cards';
import { FormInput } from '../../components/forms';
import { COLORS } from '../../constants/theme';
import { isValidDateRange } from '../../utils/validators';
import { tripService } from '../../services';

const DESTINATION_PRESETS = [
  'South Goa, Palolem',
  'Havelock Island, Andamans',
  'Varkala Cliff, Kerala',
  'Gokarna, Kudle Beach',
  'Pondicherry Promenade',
  'Bangaram, Lakshadweep',
];

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
];

export default function CreateTripScreen() {
  const router = useRouter();

  // Helper to get formatted default dates
  const today = new Date();
  const nextWeek = new Date(Date.now() + 86400000 * 5);
  const formatDateISO = (d) => d.toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [origin, setOrigin] = useState('');
  const [startDate, setStartDate] = useState(formatDateISO(today));
  const [endDate, setEndDate] = useState(formatDateISO(nextWeek));
  const [budget, setBudget] = useState('25000');
  const [travelers, setTravelers] = useState(2);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_IMAGES[0]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Expedition title is required';
    }

    if (!destination.trim()) {
      errs.destination = 'Destination is required';
    }

    if (!startDate.trim()) {
      errs.startDate = 'Start date is required';
    }

    if (!endDate.trim()) {
      errs.endDate = 'End date is required';
    } else if (startDate && !isValidDateRange(startDate, endDate)) {
      errs.endDate = 'End date must be on or after start date';
    }

    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      errs.budget = 'Please enter a valid budget amount';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateTrip = async () => {
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        destination: destination.trim(),
        origin: origin.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        budget: Number(budget),
        currency: 'INR',
        travelers: Number(travelers) || 1,
        description: description.trim() || undefined,
        coverImage: coverImage || undefined,
        status: 'planning',
      };

      const res = await tripService.createTrip(payload);
      const createdTrip = res.data;
      router.replace(`/trips/${createdTrip._id}`);
    } catch (err) {
      setServerError(err.message || 'Failed to create trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable keyboardAware padded edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Plan New Expedition"
        subtitle="Set sail to breathtaking coastlines"
        showBack
      />

      {serverError ? (
        <View className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex-row items-center gap-2.5">
          <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
          <Typography variant="bodySmall" color="danger" className="flex-1">
            {serverError}
          </Typography>
        </View>
      ) : null}

      <Card className="mb-6">
        {/* Title */}
        <FormInput
          label="Expedition Title"
          placeholder="e.g. South Goa Beach Hopping & Sunsets"
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            if (errors.title) setErrors((e) => ({ ...e, title: null }));
          }}
          error={errors.title}
          leftIcon={<Ionicons name="boat-outline" size={18} color={COLORS.textSecondary} />}
        />

        {/* Destination */}
        <FormInput
          label="Destination"
          placeholder="e.g. Palolem & Agonda Beach, Goa"
          value={destination}
          onChangeText={(val) => {
            setDestination(val);
            if (errors.destination) setErrors((e) => ({ ...e, destination: null }));
          }}
          error={errors.destination}
          leftIcon={<Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />}
        />

        {/* Destination Presets */}
        <View className="mb-4 -mt-1">
          <Typography variant="caption" color="muted" className="mb-2">
            Suggested coastal spots:
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DESTINATION_PRESETS.map((spot) => (
              <Pressable
                key={spot}
                onPress={() => {
                  setDestination(spot);
                  if (!title) setTitle(`${spot} Expedition`);
                  if (errors.destination) setErrors((e) => ({ ...e, destination: null }));
                }}
                className="mr-2 px-3 py-1.5 rounded-xl bg-ocean-50 border border-ocean-100"
              >
                <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
                  + {spot.split(',')[0]}
                </Typography>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Origin */}
        <FormInput
          label="Starting From / Origin (Optional)"
          placeholder="e.g. Mumbai, Bangalore, Pune"
          value={origin}
          onChangeText={setOrigin}
          leftIcon={<Ionicons name="navigate-outline" size={18} color={COLORS.textSecondary} />}
        />

        {/* Dates */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormInput
              label="Start Date"
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={(val) => {
                setStartDate(val);
                if (errors.startDate) setErrors((e) => ({ ...e, startDate: null }));
              }}
              error={errors.startDate}
              leftIcon={<Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />}
            />
          </View>

          <View className="flex-1">
            <FormInput
              label="End Date"
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={(val) => {
                setEndDate(val);
                if (errors.endDate) setErrors((e) => ({ ...e, endDate: null }));
              }}
              error={errors.endDate}
              leftIcon={<Ionicons name="calendar" size={16} color={COLORS.textSecondary} />}
            />
          </View>
        </View>

        {/* Budget & Travelers */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormInput
              label="Est. Budget (INR)"
              placeholder="e.g. 25000"
              value={budget}
              onChangeText={(val) => {
                setBudget(val);
                if (errors.budget) setErrors((e) => ({ ...e, budget: null }));
              }}
              keyboardType="numeric"
              error={errors.budget}
              leftIcon={<Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} />}
            />
          </View>

          <View className="flex-1 mb-4">
            <Typography variant="label" color="secondary" className="mb-1.5 ml-0.5">
              Travelers
            </Typography>
            <View className="flex-row items-center justify-between rounded-2xl border border-ink-200 px-3 min-h-[50px] bg-white">
              <Pressable
                onPress={() => setTravelers((prev) => Math.max(1, prev - 1))}
                hitSlop={8}
                className="w-8 h-8 rounded-full bg-ink-100 items-center justify-center"
              >
                <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
              </Pressable>

              <View className="flex-row items-center gap-1">
                <Ionicons name="person" size={14} color={COLORS.primary} />
                <Typography variant="body" style={{ fontWeight: '700' }}>
                  {travelers}
                </Typography>
              </View>

              <Pressable
                onPress={() => setTravelers((prev) => prev + 1)}
                hitSlop={8}
                className="w-8 h-8 rounded-full bg-ink-100 items-center justify-center"
              >
                <Ionicons name="add" size={16} color={COLORS.textPrimary} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Description / Notes */}
        <FormInput
          label="Trip Description & Vibe"
          placeholder="e.g. Sunset dolphin spotting, beach shacks, scuba diving and quiet workation days"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* Cover Image Picker */}
        <View className="mb-4">
          <Typography variant="label" color="secondary" className="mb-1.5 ml-0.5">
            Cover Atmosphere
          </Typography>
          <View className="flex-row gap-2">
            {PRESET_IMAGES.map((img, idx) => {
              const isSelected = coverImage === img;
              return (
                <Pressable
                  key={idx}
                  onPress={() => setCoverImage(img)}
                  className={`flex-1 h-20 rounded-2xl overflow-hidden border-2 ${
                    isSelected ? 'border-ocean-600 scale-102' : 'border-ink-200 opacity-60'
                  }`}
                >
                  <Image source={{ uri: img }} className="w-full h-full" resizeMode="cover" />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Submit Button */}
        <Button
          title="Create Expedition"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleCreateTrip}
          isLoading={isSubmitting}
          rightIcon={<Ionicons name="arrow-forward" size={18} color="#FFF" />}
        />
      </Card>
    </ScreenContainer>
  );
}
