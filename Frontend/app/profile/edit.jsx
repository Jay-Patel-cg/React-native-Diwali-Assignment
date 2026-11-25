import React, { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  ScreenContainer,
  Typography,
  Button,
} from '../../components/ui';
import { ScreenHeader } from '../../components/navigation';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services';

export default function ProfileEditScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(
    user?.avatar || user?.profileImage || ''
  );
  const [homeCity, setHomeCity] = useState(user?.preferences?.homeCity || 'Mumbai, India');
  const [bio, setBio] = useState(
    user?.preferences?.bio || 'Passionate coastal traveler chasing sunsets and ocean tides.'
  );
  const [currency] = useState(
    user?.preferences?.preferredCurrency || user?.preferences?.currency || 'INR'
  );
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const userInitial = (name || user?.name || 'S').trim().charAt(0).toUpperCase() || 'S';

  const processPickedAsset = async (asset) => {
    if (!asset?.uri && !asset?.base64) return;

    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 400 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (manipulated?.base64) {
        setProfileImage(`data:image/jpeg;base64,${manipulated.base64}`);
        return;
      }
    } catch {
      // Fall back to the original asset's base64 or data URI below
    }

    if (asset.base64) {
      const mimeType = asset.mimeType || 'image/jpeg';
      setProfileImage(`data:${mimeType};base64,${asset.base64}`);
      return;
    }

    if (asset.uri?.startsWith('data:image/')) {
      setProfileImage(asset.uri);
      return;
    }

    Alert.alert('Image Error', 'Could not process the selected photo. Please try another image.');
  };

  const handlePickFromLibrary = async () => {
    setIsPickingImage(true);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please allow photo library access in your device settings to select a profile photo.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        await processPickedAsset(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Gallery Error', err?.message || 'Could not open your photo library.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    setIsPickingImage(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in your device settings to take a profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        await processPickedAsset(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Camera Error', err?.message || 'Could not open the camera.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleRemovePhoto = () => {
    setProfileImage('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        profileImage,
        preferences: {
          preferredCurrency: currency,
          currency,
          homeCity: homeCity.trim(),
          bio: bio.trim(),
        },
      };

      const res = await authService.updateProfile(payload);
      const updatedUser = res.data?.user || res.data;
      if (updatedUser) {
        updateUser({ ...user, ...updatedUser, profileImage: updatedUser.profileImage ?? profileImage });
      } else {
        updateUser({ ...user, name: name.trim(), profileImage });
      }

      if (Platform.OS === 'web') {
        router.back();
      } else {
        Alert.alert('Profile Updated', 'Your profile details have been saved successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      Alert.alert('Update Failed', err.message || 'Could not update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable padded edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="Edit Profile"
        subtitle="Update your personal details & photo"
        showBack
      />

      {/* Profile Picture Card */}
      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 items-center shadow-xs">
        <Pressable
          onPress={handlePickFromLibrary}
          disabled={isPickingImage || isLoading}
          accessibilityLabel="Select profile photo"
          className="relative mb-3"
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              className="w-24 h-24 rounded-full border-2 border-ocean-600 bg-ocean-100"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-ocean-800 items-center justify-center border-2 border-ocean-600 shadow-xs">
              <Typography variant="display" color="inverse" style={{ fontWeight: '800' }}>
                {userInitial}
              </Typography>
            </View>
          )}

          <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-ocean-700 border-2 border-white items-center justify-center shadow-xs">
            {isPickingImage ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            )}
          </View>
        </Pressable>

        <Typography variant="bodySmall" color="secondary" className="mb-3">
          Tap your avatar or choose an option below
        </Typography>

        <View className="flex-row flex-wrap items-center justify-center gap-2.5">
          <Pressable
            onPress={handlePickFromLibrary}
            disabled={isPickingImage || isLoading}
            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ocean-50 border border-ocean-200"
          >
            <Ionicons name="images-outline" size={16} color={COLORS.primary} />
            <Typography variant="caption" color="ocean" style={{ fontWeight: '700' }}>
              Choose Photo
            </Typography>
          </Pressable>

          {Platform.OS !== 'web' ? (
            <Pressable
              onPress={handleTakePhoto}
              disabled={isPickingImage || isLoading}
              className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl bg-seafoam-50 border border-seafoam-200"
            >
              <Ionicons name="camera-outline" size={16} color={COLORS.secondary} />
              <Typography variant="caption" color="seafoam" style={{ fontWeight: '700' }}>
                Take Photo
              </Typography>
            </Pressable>
          ) : null}

          {profileImage ? (
            <Pressable
              onPress={handleRemovePhoto}
              disabled={isPickingImage || isLoading}
              className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200"
            >
              <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
              <Typography variant="caption" color="danger" style={{ fontWeight: '700' }}>
                Remove
              </Typography>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="bg-white border border-ink-200 rounded-3xl p-5 mb-5 shadow-xs">
        <Typography variant="h3" className="mb-4">
          Personal Information
        </Typography>

        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1">
            Full Name *
          </Typography>
          <View className="flex-row items-center bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5">
            <Ionicons name="person-outline" size={18} color={COLORS.primary} className="mr-2" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={COLORS.textMuted}
              className="flex-1 text-ink-900 text-sm ml-2"
            />
          </View>
        </View>

        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1">
            Email Address (Read-only)
          </Typography>
          <View className="flex-row items-center bg-ink-100/60 border border-ink-200 rounded-xl px-3.5 py-2.5">
            <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} className="mr-2" />
            <TextInput
              value={user?.email || ''}
              editable={false}
              className="flex-1 text-ink-500 text-sm ml-2"
            />
          </View>
        </View>

        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1">
            Home City / Origin
          </Typography>
          <View className="flex-row items-center bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5">
            <Ionicons name="home-outline" size={18} color={COLORS.secondary} className="mr-2" />
            <TextInput
              value={homeCity}
              onChangeText={setHomeCity}
              placeholder="e.g. Mumbai, Delhi, Bengaluru"
              placeholderTextColor={COLORS.textMuted}
              className="flex-1 text-ink-900 text-sm ml-2"
            />
          </View>
        </View>

        <View className="mb-4">
          <Typography variant="caption" color="secondary" className="mb-1">
            Traveler Bio / Mantra
          </Typography>
          <TextInput
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            placeholder="Tell fellow travelers about your travel style..."
            placeholderTextColor={COLORS.textMuted}
            className="bg-ink-50 border border-ink-200 rounded-xl px-3.5 py-2.5 text-ink-900 text-sm"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      </View>

      <View className="mb-8">
        <Button
          title={isLoading ? 'Saving Changes...' : 'Save Profile Changes'}
          variant="primary"
          size="lg"
          onPress={handleSave}
          disabled={isLoading}
          leftIcon={<Ionicons name="checkmark" size={18} color={COLORS.textInverse} />}
        />
      </View>
    </ScreenContainer>
  );
}
