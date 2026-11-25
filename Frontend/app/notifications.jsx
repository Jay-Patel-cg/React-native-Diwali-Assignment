import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Badge,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../components/ui';
import { ScreenHeader } from '../components/navigation';
import { COLORS } from '../constants/theme';
import { notificationService } from '../services';

const NOTIFICATION_ICONS = {
  trip_reminder: { name: 'calendar', color: COLORS.primary, bg: 'bg-ocean-50' },
  trip_invite: { name: 'people', color: COLORS.secondary, bg: 'bg-seafoam-50' },
  itinerary_update: { name: 'compass', color: '#0284C7', bg: 'bg-sky-50' },
  expense_update: { name: 'wallet', color: COLORS.accent, bg: 'bg-coral-50' },
  general: { name: 'notifications', color: COLORS.textPrimary, bg: 'bg-ink-50' },
};

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await notificationService.getNotifications({
        limit: 25,
        unreadOnly: filter === 'unread' ? 'true' : undefined,
      });
      setNotifications(res.data?.notifications || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (item) => {
    if (item.isRead) return;

    try {
      await notificationService.markAsRead(item._id || item.id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === (item._id || item.id) ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      // silently fail or retry
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      Alert.alert('Error', 'Could not mark all notifications as read.');
    }
  };

  const handlePressItem = (item) => {
    handleMarkAsRead(item);

    if (item.data?.tripId) {
      router.push(`/trips/${item.data.tripId}`);
    } else if (item.type === 'expense_update') {
      router.push('/expenses');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <ScreenContainer
      scrollable
      padded
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'}
        showBack
        rightAction={
          unreadCount > 0 ? (
            <Pressable onPress={handleMarkAllRead} hitSlop={6}>
              <Typography variant="caption" color="ocean" style={{ fontWeight: '700' }}>
                Mark All Read
              </Typography>
            </Pressable>
          ) : null
        }
      />

      {/* Filter Tabs */}
      <View className="flex-row gap-2 mb-4">
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
        ].map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setFilter(t.id)}
            className={`px-3.5 py-1.5 rounded-full border ${
              filter === t.id
                ? 'bg-ocean-700 border-ocean-700'
                : 'bg-white border-ink-200'
            }`}
          >
            <Typography
              variant="caption"
              color={filter === t.id ? 'inverse' : 'primary'}
              style={{ fontWeight: filter === t.id ? '700' : '500' }}
            >
              {t.label}
            </Typography>
          </Pressable>
        ))}
      </View>

      {/* Error state */}
      {error && !isLoading ? (
        <ErrorState message={error} onRetry={() => fetchNotifications()} className="mb-4" />
      ) : null}

      {/* Loading state */}
      {isLoading && !isRefreshing ? (
        <LoadingState message="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No Notifications"
          description={
            filter === 'unread'
              ? 'You have read all your notifications.'
              : 'Trip reminders, member invites, and expense alerts will appear here.'
          }
          actionLabel="Go to Expeditions"
          onAction={() => router.push('/trips')}
        />
      ) : (
        <View className="gap-2.5 pb-8">
          {notifications.map((item) => {
            const config = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.general;
            const timeAgo = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <Pressable
                key={item._id || item.id}
                onPress={() => handlePressItem(item)}
                className={`bg-white rounded-2xl p-4 border active:bg-ink-50 shadow-xs ${
                  item.isRead ? 'border-ink-200 opacity-80' : 'border-ocean-300 bg-ocean-50/20'
                }`}
              >
                <View className="flex-row items-start">
                  <View
                    className={`w-10 h-10 rounded-xl ${config.bg} items-center justify-center mr-3 mt-0.5`}
                  >
                    <Ionicons name={config.name} size={20} color={config.color} />
                  </View>

                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Typography
                        variant="bodySmall"
                        style={{ fontWeight: item.isRead ? '600' : '800' }}
                      >
                        {item.title}
                      </Typography>
                      {!item.isRead && (
                        <View className="w-2 h-2 rounded-full bg-ocean-600 ml-2" />
                      )}
                    </View>

                    <Typography variant="caption" color="secondary" className="leading-4 mb-1">
                      {item.message}
                    </Typography>

                    {timeAgo ? (
                      <Typography variant="caption" color="muted" className="text-[10px]">
                        {timeAgo}
                      </Typography>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenContainer>
  );
}
