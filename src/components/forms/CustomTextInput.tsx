import React from 'react';
import { TextInput, HelperText } from 'react-native-paper';
import { TextInputProps as PaperTextInputProps } from 'react-native-paper';

interface CustomTextInputProps extends Omit<PaperTextInputProps, 'theme' | 'error'> {
  error?: string;
  helperText?: string;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  error,
  helperText,
  style,
  ...props
}) => {
  return (
    <>
      <TextInput
        style={[{ marginBottom: 5 }, style]}
        error={!!error}
        {...props}
      />
      <HelperText type={error ? 'error' : 'info'} visible={!!(error || helperText)}>
        {error || helperText}
      </HelperText>
    </>
  );
};

export default CustomTextInput;
