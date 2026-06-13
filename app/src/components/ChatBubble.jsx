import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export default function ChatBubble({ message, isUser }) {
  const { colors } = useTheme();

  // ── Robust text extraction ──
  let text = '';
  
  if (typeof message === 'string') {
    const trimmed = message.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        text = parsed.message || parsed.text || parsed.content || trimmed;
      } catch {
        text = trimmed;
      }
    } else {
      text = message;
    }
  } else if (message && typeof message === 'object') {
    text = message.message || message.text || message.content || '';
  }

  text = text.trim().replace(/\n{3,}/g, '\n\n');
  if (!text) {
    text = '...';
  }

  // Helper to parse basic markdown bold (**text**)
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const parts = rawText.split('**');
    return parts.map((part, index) => {
      const isBold = index % 2 === 1;
      return (
        <Text 
          key={index} 
          style={{ 
            fontWeight: isBold ? 'bold' : 'normal',
            color: isUser ? '#FFFFFF' : colors.text
          }}
        >
          {part}
        </Text>
      );
    });
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          backgroundColor: isUser ? colors.accent : colors.card,
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          maxWidth: '80%',
          minWidth: 40,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isUser ? 0 : 0.06,
          shadowRadius: 4,
          elevation: isUser ? 0 : 2,
          borderWidth: isUser ? 0 : 0.5,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: isUser ? '#FFFFFF' : colors.text,
            lineHeight: 21,
            fontFamily: 'System',
          }}
        >
          {renderFormattedText(text)}
        </Text>
      </View>
    </View>
  );
}