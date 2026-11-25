import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer, LoadingState } from '../../../components/ui';

export default function TripExpensesRedirect() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace({
        pathname: '/expenses',
        params: { tripId: id },
      });
    }
  }, [id, router]);

  return (
    <ScreenContainer>
      <LoadingState message="Opening trip expenses..." fullScreen />
    </ScreenContainer>
  );
}
