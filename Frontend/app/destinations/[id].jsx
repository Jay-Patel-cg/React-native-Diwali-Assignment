import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Badge,
  Button,
  LoadingState,
  ErrorState,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { COLORS } from '../../constants/theme';
import { discoveryService } from '../../services';
import { useAiStore } from '../../store/useAiStore';

export default function DestinationDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const setPreferences = useAiStore((state) => state.setPreferences);

  const destinationId = params.id;
  const [destination, setDestination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!destinationId) {
        setIsLoading(false);
        setError('Missing destination parameter');
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await discoveryService.getDestinationById(destinationId);
        setDestination(res.data?.destination || res.data);
      } catch (err) {
        setError(err.message || 'Could not load destination details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [destinationId]);

  const handlePlanWithAi = () => {
    if (!destination) return;

    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 14);
    const end = new Date(start);
    end.setDate(start.getDate() + 4);

    setPreferences({
      destination: destination.name || destination.title,
      origin: 'Mumbai',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      travelers: 2,
      travelStyle: ['coastal'],
      interests: Array.isArray(destination.tags) ? destination.tags : ['Beaches', 'Sunsets'],
    });

    router.push('/ai/preferences');
  };

  const destName = destination?.name || destination?.title || 'Coastal Destination';
  const locationStr = [destination?.region, destination?.state, destination?.country || 'India']
    .filter(Boolean)
    .join(', ');

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title={destName}
        subtitle={locationStr}
        showBack
      />

      {isLoading ? (
        <LoadingState message="Discovering coastal details..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => router.back()} />
      ) : destination ? (
        <>
          {/* Hero Image or Fallback */}
          <View className="rounded-3xl overflow-hidden mb-5 bg-ocean-900 border border-ocean-800 shadow-sm relative">
            {destination.imageUrl || destination.image ? (
              <Image
                source={{ uri: destination.imageUrl || destination.image }}
                className="w-full h-52 object-cover"
              />
            ) : (
              <View className="w-full h-52 items-center justify-center p-5">
                <Ionicons name="boat" size={48} color={COLORS.secondarySoft} className="mb-2" />
                <Typography variant="h2" color="inverse" align="center">
                  {destName}
                </Typography>
              </View>
            )}

            <View className="absolute bottom-3 left-3 flex-row gap-2">
              {destination.bestSeason || destination.bestTimeToVisit ? (
                <Badge
                  label={destination.bestSeason || destination.bestTimeToVisit}
                  tone="seafoam"
                />
              ) : null}
              {destination.category ? (
                <Badge label={destination.category} tone="neutral" />
              ) : null}
            </View>
          </View>

          {/* Description */}
          <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
            <Typography variant="h3" className="mb-2">
              About {destName}
            </Typography>
            <Typography variant="bodySmall" color="secondary" className="leading-5">
              {destination.description ||
                destination.summary ||
                'A stunning seaside retreat offering warm waters, coastal cuisine, and dramatic sunset cliff points.'}
            </Typography>
          </View>

          {/* Highlights & Tags */}
          {Array.isArray(destination.tags) && destination.tags.length > 0 && (
            <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
              <Typography variant="h3" className="mb-2">
                Top Coastal Highlights
              </Typography>
              <View className="flex-row flex-wrap gap-2">
                {destination.tags.map((tag, idx) => (
                  <Badge key={idx} label={tag} tone="ocean" />
                ))}
              </View>
            </View>
          )}

          {/* Plan Trip CTA */}
          <View className="mb-8">
            <Button
              title="Plan Trip Here with Gemini AI ⛵"
              variant="primary"
              size="lg"
              onPress={handlePlanWithAi}
              leftIcon={<Ionicons name="sparkles" size={18} color={COLORS.textInverse} />}
            />
          </View>
        </>
      ) : null}
    </ScreenContainer>
  );
}
