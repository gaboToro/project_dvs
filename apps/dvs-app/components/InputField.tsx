import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { theme } from '@/lib/theme';

type InputFieldProps = TextInputProps & {
  label: string;
};

export function InputField({ label, ...props }: InputFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.slate}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontFamily: theme.fonts.subheading,
    fontSize: 14,
    color: theme.colors.ink,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    color: theme.colors.ink,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
});
