import { isRunningInExpoGo } from 'expo';
import { VoiceMicExpoGoStub } from './VoiceMicExpoGoStub';

type Props = {
  onAmountRecognized: (amount: number) => void;
  disabled?: boolean;
  wrapStyle?: import('react-native').StyleProp<import('react-native').ViewStyle>;
};

/** Expo Go: avoid loading native speech module. Dev builds use the real mic. */
export function VoiceMicButton(props: Props) {
  if (isRunningInExpoGo()) {
    return <VoiceMicExpoGoStub wrapStyle={props.wrapStyle} />;
  }

  const { VoiceMicNative } = require('./VoiceMicNative') as typeof import('./VoiceMicNative');
  return <VoiceMicNative {...props} />;
}
