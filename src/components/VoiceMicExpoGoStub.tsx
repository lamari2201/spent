import type { StyleProp, ViewStyle } from 'react-native';
import { Alert, Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { voiceMicStyles as styles } from './voiceMicStyles';

type Props = { wrapStyle?: StyleProp<ViewStyle> };

export function VoiceMicExpoGoStub({ wrapStyle }: Props) {
  return (
    <View style={[styles.wrap, wrapStyle]}>
      <Pressable
        onPress={() =>
          Alert.alert(
            'Expo Go',
            'Voice uses native speech recognition. To try the mic, run a dev build on your device:\n\nnpx expo run:ios\n\nThe calculator, totals, and charts work in Expo Go.',
          )
        }
        style={({ pressed }) => [styles.mic, pressed && styles.micPressed]}
        accessibilityRole="button"
        accessibilityLabel="Voice not available in Expo Go"
      >
        <MaterialIcons name="mic-off" size={36} color="#0c0f14" />
      </Pressable>
      <Text style={styles.hint}>Mic: use dev build (Expo Go = pad + charts)</Text>
    </View>
  );
}
