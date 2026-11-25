import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Typography, Badge } from '../../components/ui';
import { ScreenHeader } from '../../components/navigation/ScreenHeader';
import { AiTypingIndicator, AiSuggestionChip } from '../../components/ai';
import { COLORS } from '../../constants/theme';
import { useAiStore } from '../../store/useAiStore';
import { aiService } from '../../services/aiService';

export default function AiTravelChatScreen() {
  const params = useLocalSearchParams();
  const scrollViewRef = useRef(null);

  const chatMessages = useAiStore((state) => state.chatMessages);
  const addChatMessage = useAiStore((state) => state.addChatMessage);
  const clearChat = useAiStore((state) => state.clearChat);
  const currentPlan = useAiStore((state) => state.currentPlan);
  const preferences = useAiStore((state) => state.preferences);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const activeDestination =
    params.destination ||
    currentPlan?.destination ||
    preferences.destination ||
    '';

  // Scroll to bottom on messages update
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [chatMessages, isSending]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isSending) return;

    setInputMessage('');

    // Add user message to store
    const userMsg = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);

    setIsSending(true);

    try {
      // Build history for backend (limit to last 10 messages)
      const sanitizedHistory = chatMessages.slice(-10).map((m) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      }));

      const tripContext = activeDestination
        ? {
            destination: activeDestination,
            origin: preferences.origin || undefined,
            startDate: preferences.startDate || undefined,
            endDate: preferences.endDate || undefined,
            travelers: preferences.travelers || undefined,
            budget: preferences.budget ? Number(preferences.budget) : undefined,
            currency: preferences.currency || 'INR',
          }
        : undefined;

      const payload = {
        message: textToSend,
        history: sanitizedHistory,
        tripContext,
      };

      const res = await aiService.chat(payload);
      if (res && res.data) {
        addChatMessage({
          role: 'model',
          content: res.data.reply || res.data.message || 'I am happy to help you with that!',
          suggestions:
            res.data.suggestedFollowUps ||
            res.data.suggestions ||
            [],
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      Alert.alert(
        'Chat Error',
        err.message || 'Unable to connect with AI Travel Copilot. Please check your connection and try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    Alert.alert('Reset Chat', 'Clear all messages in this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: clearChat },
    ]);
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader
        title="AI Travel Copilot"
        subtitle="Conversational Trip Assistant"
        showBack
        rightAction={
          <Pressable
            onPress={handleClearChat}
            hitSlop={8}
            className="w-10 h-10 rounded-full bg-white border border-ink-200 items-center justify-center"
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.textSecondary} />
          </Pressable>
        }
      />

      {/* Active Trip Context Pill if available */}
      {activeDestination ? (
        <View className="flex-row items-center justify-between px-4 py-2 mx-4 mb-2 bg-ocean-50 border border-ocean-200 rounded-xl">
          <View className="flex-row items-center gap-1.5 flex-1 mr-2">
            <Ionicons name="compass-outline" size={15} color={COLORS.primary} />
            <Typography variant="caption" color="ocean" style={{ fontWeight: '600' }} numberOfLines={1}>
              Context: {activeDestination}
            </Typography>
          </View>
          <Badge label="Active" tone="seafoam" />
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages Stream */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const timeStr = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <View
                key={msg.id || idx}
                className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Message Bubble */}
                <View
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs ${
                    isUser
                      ? 'bg-ocean-700 rounded-br-xs'
                      : 'bg-white border border-ink-200 rounded-bl-xs'
                  }`}
                >
                  {!isUser && (
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <Ionicons name="sparkles" size={13} color={COLORS.secondary} />
                      <Typography
                        variant="caption"
                        color="secondary"
                        style={{ fontWeight: '700' }}
                      >
                        Copilot
                      </Typography>
                    </View>
                  )}

                  <Typography
                    variant="bodySmall"
                    color={isUser ? 'inverse' : 'primary'}
                    className="leading-5"
                  >
                    {msg.content}
                  </Typography>

                  {timeStr ? (
                    <Typography
                      variant="caption"
                      color={isUser ? '#93C5FD' : 'muted'}
                      className="mt-1 self-end text-[10px]"
                    >
                      {timeStr}
                    </Typography>
                  ) : null}
                </View>

                {/* Suggested prompt chips under model messages */}
                {!isUser && Array.isArray(msg.suggestions) && msg.suggestions.length > 0 && (
                  <View className="flex-row flex-wrap mt-2 max-w-[95%]">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <AiSuggestionChip
                        key={sIdx}
                        label={suggestion}
                        onPress={() => handleSendMessage(suggestion)}
                        disabled={isSending}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {isSending && <AiTypingIndicator message="Gemini AI is analyzing coastal data..." />}
        </ScrollView>

        {/* Input Bar */}
        <View className="p-3 bg-white border-t border-ink-100 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-ink-50 border border-ink-200 rounded-2xl px-3.5 py-1.5">
            <TextInput
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Ask about beaches, ferry schedules, budget..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={1500}
              className="flex-1 text-ink-900 text-sm max-h-24 py-1"
            />
          </View>

          <Pressable
            onPress={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isSending}
            className={`w-11 h-11 rounded-2xl items-center justify-center ${
              inputMessage.trim() && !isSending
                ? 'bg-ocean-700 active:bg-ocean-800'
                : 'bg-ink-200'
            }`}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={inputMessage.trim() && !isSending ? COLORS.textInverse : COLORS.textMuted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
