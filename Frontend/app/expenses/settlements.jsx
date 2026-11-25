import React, { useState, useEffect, useCallback } from 'react';
import { View, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
  LoadingState,
  ErrorState,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { Card } from '../../components/cards';
import { COLORS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatters';
import { expenseService } from '../../services';

export default function GroupSettlementsScreen() {
  const { tripId } = useLocalSearchParams();
  const router = useRouter();

  const [settlementData, setSettlementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadSettlements = useCallback(
    async (isRefresh = false) => {
      if (!tripId) return;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const res = await expenseService.getSettlements(tripId);
        setSettlementData(res.data);
      } catch (err) {
        setError(err.message || 'Failed to calculate group settlements');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [tripId]
  );

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  if (isLoading && !isRefreshing) {
    return (
      <ScreenContainer>
        <LoadingState message="Calculating debt simplification & settlements..." fullScreen />
      </ScreenContainer>
    );
  }

  const {
    currency = 'INR',
    userBalances = [],
    settlements = [],
    isFullySettled = false,
  } = settlementData || {};

  return (
    <ScreenContainer
      scrollable
      padded
      refreshing={isRefreshing}
      onRefresh={() => loadSettlements(true)}
      edges={['top', 'left', 'right']}
    >
      <ScreenHeader
        title="Group Settlements"
        subtitle="Fair debt simplification & balances"
        showBack
      />

      {error ? (
        <ErrorState message={error} onRetry={loadSettlements} retryLabel="Retry" className="mb-4" />
      ) : null}

      {/* 1. Settlement Status Hero */}
      {isFullySettled ? (
        <Card className="mb-5 p-5 bg-emerald-50 border border-emerald-200 items-center text-center shadow-xs">
          <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center mb-2">
            <Ionicons name="checkmark-circle" size={32} color="#059669" />
          </View>
          <Typography variant="h2" color="success" align="center" className="mb-1">
            All Accounts Settled!
          </Typography>
          <Typography variant="bodySmall" color="secondary" align="center">
            No outstanding balances remain. Everyone in this expedition is squared up!
          </Typography>
        </Card>
      ) : (
        <View className="mb-5 p-5 rounded-3xl bg-ocean-800 shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Badge label="Simplified Debts" tone="seafoam" />
            <Ionicons name="git-compare" size={20} color={COLORS.secondarySoft} />
          </View>
          <Typography variant="display" color="inverse" style={{ fontWeight: '800' }} className="mb-1 text-2xl">
            {settlements.length} {settlements.length === 1 ? 'Transfer' : 'Transfers'} Needed
          </Typography>
          <Typography variant="bodySmall" color="#CCFBF1">
            Optimized multi-party algorithm computes the minimum number of payments to settle all debts.
          </Typography>
        </View>
      )}

      {/* 2. Recommended Settlement Transfers ("Who Pays Whom") */}
      {!isFullySettled && settlements.length > 0 ? (
        <View className="mb-6">
          <Typography variant="h3" className="mb-3 px-1">
            Recommended Settlements
          </Typography>

          <View className="gap-3">
            {settlements.map((transfer, idx) => (
              <Card key={idx} className="p-4 bg-white border border-coral-100 shadow-xs">
                <View className="flex-row items-center justify-between mb-2">
                  {/* From User */}
                  <View className="flex-1 mr-2">
                    <Typography variant="caption" color="muted">
                      From (Debtor)
                    </Typography>
                    <Typography variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
                      {transfer.fromName || 'Member'}
                    </Typography>
                  </View>

                  {/* Transfer Arrow & Amount */}
                  <View className="items-center px-2">
                    <Typography variant="h3" color="coral" style={{ fontWeight: '800' }}>
                      {formatCurrency(transfer.amount, transfer.currency || currency)}
                    </Typography>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.accent} />
                  </View>

                  {/* To User */}
                  <View className="flex-1 items-end ml-2">
                    <Typography variant="caption" color="muted">
                      To (Creditor)
                    </Typography>
                    <Typography variant="body" color="ocean" style={{ fontWeight: '700' }} numberOfLines={1}>
                      {transfer.toName || 'Member'}
                    </Typography>
                  </View>
                </View>

                {/* Narrative Description */}
                <View className="bg-ink-50 rounded-xl p-2.5 mt-1 border border-ink-100">
                  <Typography variant="caption" color="secondary" className="leading-4">
                    <Typography variant="caption" style={{ fontWeight: '700' }}>
                      {transfer.fromName}
                    </Typography>{' '}
                    pays{' '}
                    <Typography variant="caption" color="coral" style={{ fontWeight: '700' }}>
                      {formatCurrency(transfer.amount, transfer.currency || currency)}
                    </Typography>{' '}
                    to{' '}
                    <Typography variant="caption" style={{ fontWeight: '700' }}>
                      {transfer.toName}
                    </Typography>{' '}
                    to settle their shared expenses.
                  </Typography>
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {/* 3. Member Balances List */}
      <View className="mb-6">
        <Typography variant="h3" className="mb-3 px-1">
          Individual Balances
        </Typography>

        <View className="gap-3">
          {userBalances.map((ub) => {
            const initial = ub.name ? ub.name.charAt(0).toUpperCase() : '?';
            const isOwed = ub.netBalance > 0.01;
            const owes = ub.netBalance < -0.01;

            return (
              <Card key={ub.userId} className="p-4 bg-white border border-ink-200">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-3 flex-1 mr-2">
                    {ub.profileImage ? (
                      <Image
                        source={{ uri: ub.profileImage }}
                        className="w-10 h-10 rounded-full border border-ocean-200"
                      />
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-ocean-800 items-center justify-center">
                        <Typography variant="body" color="inverse" style={{ fontWeight: '700' }}>
                          {initial}
                        </Typography>
                      </View>
                    )}

                    <View className="flex-1">
                      <Typography variant="body" numberOfLines={1} style={{ fontWeight: '700' }}>
                        {ub.name || 'Member'}
                      </Typography>
                      <Typography variant="caption" color="secondary" numberOfLines={1}>
                        Paid: {formatCurrency(ub.totalPaid, currency)} • Owed: {formatCurrency(ub.totalOwed, currency)}
                      </Typography>
                    </View>
                  </View>

                  {/* Net Balance Status */}
                  <View className="items-end">
                    <Badge
                      label={
                        isOwed
                          ? `+${formatCurrency(ub.netBalance, currency)}`
                          : owes
                            ? `-${formatCurrency(Math.abs(ub.netBalance), currency)}`
                            : 'Settled'
                      }
                      tone={isOwed ? 'success' : owes ? 'coral' : 'neutral'}
                    />
                    <Typography variant="caption" color="muted" className="mt-0.5">
                      {isOwed ? 'Gets back' : owes ? 'Owes group' : 'All clear'}
                    </Typography>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      </View>
    </ScreenContainer>
  );
}
