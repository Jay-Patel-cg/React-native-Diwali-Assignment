import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Typography, Button, Badge } from '../../components/ui';
import { Card } from '../../components/cards';
import { COLORS } from '../../constants/theme';
import { APP_CONFIG } from '../../constants/config';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scrollable padded edges={['top', 'bottom', 'left', 'right']}>
      {/* Ocean Hero Banner */}
      <View className="mt-2 mb-6 rounded-3xl bg-ocean-800 p-6 shadow-sm overflow-hidden relative">
        {/* Decorative background badge */}
        <View className="flex-row items-center justify-between mb-4">
          <Badge label="AI Travel Copilot" tone="seafoam" />
          <View className="w-10 h-10 rounded-full bg-ocean-700 items-center justify-center">
            <Ionicons name="boat" size={22} color={COLORS.secondarySoft} />
          </View>
        </View>

        <Typography variant="display" color="inverse" className="mb-2">
          {APP_CONFIG.appName}
        </Typography>

        <Typography variant="body" color="#CCFBF1" className="leading-6">
          Set sail along mesmerizing coastlines. Plan smarter trips, split expenses seamlessly,
          and discover hidden seaside paradises with Google Gemini AI.
        </Typography>
      </View>

      {/* Value Pillars */}
      <Typography variant="h3" className="mb-3 px-1">
        Why Travel With Us?
      </Typography>

      <View className="gap-3 mb-6">
        <Card className="flex-row items-center gap-3.5 p-4 border border-ocean-100 bg-white">
          <View className="w-12 h-12 rounded-2xl bg-ocean-50 items-center justify-center">
            <Ionicons name="sparkles" size={24} color={COLORS.primary} />
          </View>
          <View className="flex-1">
            <Typography variant="body" style={{ fontWeight: '600' }} className="mb-0.5">
              AI Travel Copilot
            </Typography>
            <Typography variant="caption" color="secondary">
              Personalized day-wise itineraries, budget estimates, and hidden gems powered by Gemini.
            </Typography>
          </View>
        </Card>

        <Card className="flex-row items-center gap-3.5 p-4 border border-seafoam-100 bg-white">
          <View className="w-12 h-12 rounded-2xl bg-seafoam-50 items-center justify-center">
            <Ionicons name="wallet-outline" size={24} color={COLORS.secondary} />
          </View>
          <View className="flex-1">
            <Typography variant="body" style={{ fontWeight: '600' }} className="mb-0.5">
              Expense Splitting & Budget
            </Typography>
            <Typography variant="caption" color="secondary">
              Real-time group cost splitting, per-person balances, and automatic debt settlements.
            </Typography>
          </View>
        </Card>

        <Card className="flex-row items-center gap-3.5 p-4 border border-coral-100 bg-white">
          <View className="w-12 h-12 rounded-2xl bg-coral-50 items-center justify-center">
            <Ionicons name="compass-outline" size={24} color={COLORS.accent} />
          </View>
          <View className="flex-1">
            <Typography variant="body" style={{ fontWeight: '600' }} className="mb-0.5">
              Coastal Discovery & Packing
            </Typography>
            <Typography variant="caption" color="secondary">
              Curated coastal destinations and weather-ready beach checklists with packing progress.
            </Typography>
          </View>
        </Card>
      </View>

      {/* Action Buttons */}
      <View className="mt-auto pt-2 pb-4 gap-3">
        <Button
          title="Get Started • Create Account"
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(auth)/register')}
          rightIcon={<Ionicons name="arrow-forward" size={18} color={COLORS.textInverse} />}
        />

        <Button
          title="Sign In to Existing Account"
          variant="outline"
          size="lg"
          fullWidth
          onPress={() => router.push('/(auth)/login')}
          leftIcon={<Ionicons name="log-in-outline" size={18} color={COLORS.primary} />}
        />

        {/* Subtle Terms / Privacy note */}
        <Typography variant="caption" color="muted" align="center" className="mt-3 px-4">
          By continuing, you agree to our Terms of Service & Privacy Policy. Safe and encrypted
          coastal journeys.
        </Typography>
      </View>
    </ScreenContainer>
  );
}
