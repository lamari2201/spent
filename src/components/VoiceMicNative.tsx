import { useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Alert, Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { parseSpokenAmount } from '../utils/parseAmount';
import { voiceMicStyles as styles } from './voiceMicStyles';

type Props = {
  onAmountRecognized: (amount: number) => void;
  disabled?: boolean;
  wrapStyle?: StyleProp<ViewStyle>;
};

export function VoiceMicNative({ onAmountRecognized, disabled, wrapStyle }: Props) {
  const [listening, setListening] = useState(false);
  const lastTranscript = useRef('');
  const consumedFinal = useRef(false);

  useSpeechRecognitionEvent('start', () => {
    consumedFinal.current = false;
    setListening(true);
  });
  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    if (consumedFinal.current) {
      consumedFinal.current = false;
      lastTranscript.current = '';
      return;
    }
    const raw = lastTranscript.current.trim();
    lastTranscript.current = '';
    if (!raw) return;
    const n = parseSpokenAmount(raw);
    if (n != null) {
      onAmountRecognized(n);
    } else {
      Alert.alert('Voice', `Could not read a number from: "${raw}"`);
    }
  });
  useSpeechRecognitionEvent('result', (event) => {
    const t = event.results[0]?.transcript ?? '';
    lastTranscript.current = t;
    if (event.isFinal) {
      const n = parseSpokenAmount(t);
      if (n != null) {
        consumedFinal.current = true;
        onAmountRecognized(n);
        void Promise.resolve(ExpoSpeechRecognitionModule.stop());
      }
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error !== 'aborted') {
      Alert.alert('Voice', event.message ?? 'Could not capture speech. Try again or use the pad.');
    }
  });

  async function toggle() {
    if (disabled) return;
    if (listening) {
      await ExpoSpeechRecognitionModule.stop();
      return;
    }
    lastTranscript.current = '';
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone', 'Allow microphone and speech recognition to add amounts by voice.');
      return;
    }
    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
    } catch {
      Alert.alert(
        'Voice unavailable',
        'Speech recognition needs a dev build. Run npx expo run:ios after installing dependencies.',
      );
    }
  }

  return (
    <View style={[styles.wrap, wrapStyle]}>
      <Pressable
        onPress={() => void toggle()}
        disabled={disabled}
        style={({ pressed }) => [
          styles.mic,
          listening && styles.micActive,
          disabled && styles.micDisabled,
          pressed && styles.micPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={listening ? 'Stop listening' : 'Speak amount'}
      >
        <MaterialIcons name="mic" size={36} color="#0c0f14" />
      </Pressable>
      <Text style={styles.hint}>
        {listening ? 'Listening… say an amount' : 'Tap — say the number (e.g. “42.50”)'}
      </Text>
    </View>
  );
}
