import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Badge,
  Button,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [selectedCurrency, setSelectedCurrency] = useState(
    user?.preferences?.currency || 'INR'
  );
  const [tripReminders, setTripReminders] = useState(true);
  const [expenseAlerts, setExpenseAlerts] = useState(true);
  const [aiTips, setAiTips] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);

  const handleClearCache = () => {
    Alert.alert(
      'Clear App Cache',
      'This will clear locally stored thumbnails and offline maps. Your account data is safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Cache cleared successfully.');
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="Settings"
        subtitle="App preferences & configurations"
        showBack
      />

      {/* Currency Preference */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
        <Typography variant="h3" className="mb-1">
          Base Currency
        </Typography>
        <Typography variant="caption" color="secondary" className="mb-3">
          Select default currency for AI trip estimates and expenses
        </Typography>

        <View className="flex-row gap-2">
          {CURRENCIES.map((curr) => {
            const isSelected = selectedCurrency === curr;
            return (
              <Pressable
                key={curr}
                onPress={() => setSelectedCurrency(curr)}
                className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                  isSelected
                    ? 'bg-ocean-700 border-ocean-700'
                    : 'bg-ink-50 border-ink-200'
                }`}
              >
                <Typography
                  variant="bodySmall"
                  color={isSelected ? 'inverse' : 'primary'}
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                >
                  {curr}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Notification Preferences */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
        <Typography variant="h3" className="mb-3">
          Push Notifications
        </Typography>

        <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-ink-100">
          <View className="flex-1 mr-3">
            <Typography variant="body" style={{ fontWeight: '600' }}>
              Trip Reminders
            </Typography>
            <Typography variant="caption" color="secondary">
              Alerts for upcoming expedition departures and daily itineraries
            </Typography>
          </View>
          <Switch
            value={tripReminders}
            onValueChange={setTripReminders}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-ink-100">
          <View className="flex-1 mr-3">
            <Typography variant="body" style={{ fontWeight: '600' }}>
              Expense & Settlement Updates
            </Typography>
            <Typography variant="caption" color="secondary">
              Instant alerts when co-travelers add receipts or balances change
            </Typography>
          </View>
          <Switch
            value={expenseAlerts}
            onValueChange={setExpenseAlerts}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Typography variant="body" style={{ fontWeight: '600' }}>
              AI Copilot Suggestions
            </Typography>
            <Typography variant="caption" color="secondary">
              Personalized coastal tips and weather-aware suggestions
            </Typography>
          </View>
          <Switch
            value={aiTips}
            onValueChange={setAiTips}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Offline & Cache */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
        <Typography variant="h3" className="mb-3">
          Offline & Storage
        </Typography>

        <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-ink-100">
          <View className="flex-1 mr-3">
            <Typography variant="body" style={{ fontWeight: '600' }}>
              Offline Sync
            </Typography>
            <Typography variant="caption" color="secondary">
              Cache itineraries and packing checklists for offline beach access
            </Typography>
          </View>
          <Switch
            value={offlineSync}
            onValueChange={setOfflineSync}
            trackColor={{ false: COLORS.border, true: COLORS.secondary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Pressable
          onPress={handleClearCache}
          className="flex-row items-center justify-between py-1"
        >
          <Typography variant="bodySmall" color="secondary">
            Clear Local Cache
          </Typography>
          <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }}>
            Clear (18 MB)
          </Typography>
        </Pressable>
      </View>

      {/* About App */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-8 shadow-xs">
        <Typography variant="h3" className="mb-2">
          About Samundar Ke Sath
        </Typography>

        <View className="gap-2 pt-1">
          <View className="flex-row items-center justify-between">
            <Typography variant="caption" color="secondary">
              Version
            </Typography>
            <Badge label="1.0.0 (Production)" tone="ocean" />
          </View>
          <View className="flex-row items-center justify-between">
            <Typography variant="caption" color="secondary">
              AI Engine
            </Typography>
            <Badge label="Google Gemini 3.8" tone="seafoam" />
          </View>
          <View className="flex-row items-center justify-between">
            <Typography variant="caption" color="secondary">
              Framework
            </Typography>
            <Typography variant="caption" style={{ fontWeight: '600' }}>
              Expo SDK 57 • React Native 0.86
            </Typography>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
