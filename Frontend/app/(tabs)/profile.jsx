import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Image,
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
import { useDashboardStore } from '../../store/useDashboardStore';

export default function ProfileTabScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const stats = useDashboardStore((state) => state.stats);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';
  const userEmail = user?.email || 'traveler@samundarkesath.com';
  const userName = user?.name || 'Seaside Explorer';

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Samundar Ke Sath?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
              router.replace('/(auth)/welcome');
            } catch (err) {
              Alert.alert('Logout Error', err.message || 'Could not log out.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Profile"
        subtitle="Account & personal preferences"
        rightAction={
          <Pressable
            onPress={() => router.push('/profile/settings')}
            hitSlop={8}
            className="w-10 h-10 rounded-full bg-white border border-ink-200 items-center justify-center shadow-xs"
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.textPrimary} />
          </Pressable>
        }
      />

      {/* User Info Card */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
        <View className="flex-row items-center mb-4">
          <Pressable
            onPress={() => router.push('/profile/edit')}
            accessibilityLabel="Change profile picture"
            className="mr-4 relative"
          >
            {user?.avatar || user?.profileImage ? (
              <Image
                source={{ uri: user.avatar || user.profileImage }}
                className="w-16 h-16 rounded-full border-2 border-ocean-600 bg-ocean-100"
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-ocean-800 items-center justify-center border-2 border-ocean-600 shadow-xs">
                <Typography variant="h2" color="inverse" style={{ fontWeight: '800' }}>
                  {userInitial}
                </Typography>
              </View>
            )}
            <View className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-ocean-700 border-2 border-white items-center justify-center">
              <Ionicons name="camera" size={12} color="#FFFFFF" />
            </View>
          </Pressable>

          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-0.5">
              <Typography variant="h3" numberOfLines={1}>
                {userName}
              </Typography>
            </View>
            <Typography variant="caption" color="secondary" numberOfLines={1} className="mb-1.5">
              {userEmail}
            </Typography>
            <Badge label="Expedition Captain" tone="seafoam" />
          </View>
        </View>

        <Button
          title="Edit Profile"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/profile/edit')}
          leftIcon={<Ionicons name="pencil" size={14} color={COLORS.primary} />}
        />
      </View>

      {/* Travel Stats Grid */}
      <Typography variant="h3" className="mb-3">
        Travel Mileage
      </Typography>

      <View className="flex-row gap-3 mb-5">
        <View className="flex-1 bg-white border border-ink-200 rounded-2xl p-4 items-center shadow-xs">
          <View className="w-10 h-10 rounded-xl bg-ocean-50 items-center justify-center mb-2">
            <Ionicons name="boat-outline" size={20} color={COLORS.primary} />
          </View>
          <Typography variant="h2" color="ocean">
            {stats?.totalTrips || 0}
          </Typography>
          <Typography variant="caption" color="secondary">
            Trips Planned
          </Typography>
        </View>

        <View className="flex-1 bg-white border border-ink-200 rounded-2xl p-4 items-center shadow-xs">
          <View className="w-10 h-10 rounded-xl bg-seafoam-50 items-center justify-center mb-2">
            <Ionicons name="calendar-outline" size={20} color={COLORS.secondary} />
          </View>
          <Typography variant="h2" color="seafoam">
            {stats?.activeTrips || 0}
          </Typography>
          <Typography variant="caption" color="secondary">
            Active Now
          </Typography>
        </View>

        <View className="flex-1 bg-white border border-ink-200 rounded-2xl p-4 items-center shadow-xs">
          <View className="w-10 h-10 rounded-xl bg-coral-50 items-center justify-center mb-2">
            <Ionicons name="sparkles-outline" size={20} color={COLORS.accent} />
          </View>
          <Typography variant="h2" color="coral">
            AI
          </Typography>
          <Typography variant="caption" color="secondary">
            Copilot Ready
          </Typography>
        </View>
      </View>

      {/* Account Settings & Navigation List */}
      <Typography variant="h3" className="mb-3">
        Account & Navigation
      </Typography>

      <View className="bg-white border border-ink-200 rounded-3xl overflow-hidden mb-6 shadow-xs">
        {[
          {
            title: 'Notifications Center',
            subtitle: 'Trip alerts, reminders & split updates',
            icon: 'notifications-outline',
            color: COLORS.primary,
            route: '/notifications',
          },
          {
            title: 'Application Settings',
            subtitle: 'Currency, preferences & theme',
            icon: 'settings-outline',
            color: COLORS.secondary,
            route: '/profile/settings',
          },
          {
            title: 'AI Travel Copilot',
            subtitle: 'Open Gemini planner assistant',
            icon: 'sparkles-outline',
            color: COLORS.accent,
            route: '/ai',
          },
          {
            title: 'Destination Discovery',
            subtitle: 'Explore 50+ coastal beaches',
            icon: 'compass-outline',
            color: '#0284C7',
            route: '/destinations',
          },
        ].map((item, idx) => (
          <Pressable
            key={idx}
            onPress={() => router.push(item.route)}
            className={`flex-row items-center justify-between p-4 active:bg-ink-50 ${
              idx !== 0 ? 'border-t border-ink-100' : ''
            }`}
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-10 h-10 rounded-xl bg-ink-50 items-center justify-center mr-3.5">
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View className="flex-1">
                <Typography variant="body" style={{ fontWeight: '700' }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="secondary">
                  {item.subtitle}
                </Typography>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </Pressable>
        ))}
      </View>

      {/* Logout Action */}
      <View className="mb-8">
        <Button
          title={isLoggingOut ? 'Logging out...' : 'Log Out'}
          variant="outline"
          size="lg"
          onPress={handleLogout}
          disabled={isLoggingOut}
          leftIcon={<Ionicons name="log-out-outline" size={20} color={COLORS.error} />}
          textStyle={{ color: COLORS.error }}
          className="border-red-200 active:bg-red-50"
        />
      </View>
    </ScreenContainer>
  );
}
