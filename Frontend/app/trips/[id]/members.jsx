import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, Image, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  Typography,
  Button,
  Badge,
  LoadingState,
  ErrorState,
} from '../../../components/ui';
import { ScreenHeader } from '../../../components/navigation';
import { Card } from '../../../components/cards';
import { FormInput, FormSelect } from '../../../components/forms';
import { COLORS } from '../../../constants/theme';
import { isValidEmail } from '../../../utils/validators';
import { tripService } from '../../../services';

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer (Read-only)' },
  { value: 'editor', label: 'Editor (Can add/edit items)' },
  { value: 'admin', label: 'Admin (Full management)' },
];

const ROLE_TONES = {
  owner: 'coral',
  admin: 'ocean',
  editor: 'seafoam',
  viewer: 'neutral',
};

const STATUS_TONES = {
  accepted: 'success',
  pending: 'ocean',
  rejected: 'danger',
};

export default function TripMembersScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tripService.getTripMembers(id);
      setMembers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load trip members');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleSendInvite = async () => {
    setInviteError(null);
    if (!inviteEmail.trim()) {
      setInviteError('Email address is required');
      return;
    }
    if (!isValidEmail(inviteEmail)) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setIsSendingInvite(true);
    try {
      await tripService.inviteMember(id, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      loadMembers();
      Alert.alert('Invitation Sent', `Invitation sent to ${inviteEmail}`);
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRemoveMember = (member) => {
    if (member.role === 'owner') {
      Alert.alert('Action Denied', 'The trip owner cannot be removed');
      return;
    }

    const memberName = member.userId?.name || 'this member';
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this expedition?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await tripService.removeMember(id, member._id);
              loadMembers();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Expedition Crew"
        subtitle={`${members.length} ${members.length === 1 ? 'member' : 'members'} collaborating`}
        showBack
        rightAction={
          <Pressable
            onPress={() => {
              setInviteError(null);
              setShowInviteModal(true);
            }}
            accessibilityLabel="Invite Member"
            className="w-10 h-10 rounded-full bg-ocean-800 items-center justify-center shadow-xs"
          >
            <Ionicons name="person-add" size={18} color="#FFF" />
          </Pressable>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={loadMembers} retryLabel="Retry" className="mb-4" />
      ) : null}

      {isLoading ? (
        <LoadingState message="Loading crew members..." />
      ) : (
        <View className="gap-3 pb-8">
          {members.map((member) => {
            const user = member.userId || {};
            const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
            const roleTone = ROLE_TONES[member.role] || 'neutral';
            const statusTone = STATUS_TONES[member.invitationStatus] || 'neutral';

            return (
              <Card key={member._id} className="p-4 bg-white border border-ink-200">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1 mr-2">
                    {user.profileImage ? (
                      <Image
                        source={{ uri: user.profileImage }}
                        className="w-11 h-11 rounded-full border border-ocean-200"
                      />
                    ) : (
                      <View className="w-11 h-11 rounded-full bg-ocean-800 items-center justify-center">
                        <Typography variant="body" color="inverse" style={{ fontWeight: '700' }}>
                          {initial}
                        </Typography>
                      </View>
                    )}

                    <View className="flex-1">
                      <Typography variant="body" numberOfLines={1} style={{ fontWeight: '700' }}>
                        {user.name || 'Invited User'}
                      </Typography>
                      <Typography variant="caption" color="secondary" numberOfLines={1}>
                        {user.email || '—'}
                      </Typography>
                    </View>
                  </View>

                  {/* Actions & Badges */}
                  <View className="items-end gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <Badge label={member.role.toUpperCase()} tone={roleTone} />
                      {member.role !== 'owner' ? (
                        <Pressable
                          onPress={() => handleRemoveMember(member)}
                          hitSlop={8}
                          className="w-6 h-6 rounded-md items-center justify-center ml-1"
                        >
                          <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                        </Pressable>
                      ) : null}
                    </View>

                    {member.invitationStatus !== 'accepted' ? (
                      <Badge label={member.invitationStatus} tone={statusTone} />
                    ) : null}
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Invite Member Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 shadow-xl">
            <View className="flex-row items-center justify-between mb-4">
              <Typography variant="h3">Invite Crew Member</Typography>
              <Pressable onPress={() => setShowInviteModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {inviteError ? (
              <View className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 flex-row items-center gap-2">
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Typography variant="caption" color="danger" className="flex-1">
                  {inviteError}
                </Typography>
              </View>
            ) : null}

            <FormInput
              label="Member Email Address"
              placeholder="e.g. companion@samundar.com"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Ionicons name="mail-outline" size={16} color={COLORS.textSecondary} />}
            />

            <FormSelect
              label="Access Role"
              options={ROLE_OPTIONS}
              value={inviteRole}
              onChange={setInviteRole}
              helperText="Editors can add activities and expenses; Viewers have read access"
            />

            <Button
              title="Send Invitation"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSendInvite}
              isLoading={isSendingInvite}
              rightIcon={<Ionicons name="paper-plane" size={16} color="#FFF" />}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
