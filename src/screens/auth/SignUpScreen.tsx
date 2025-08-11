import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Title,
  HelperText,
  ActivityIndicator,
  Divider,
  Subheading,
} from 'react-native-paper';
import { useAuth } from '@context/AuthContext';
import { validateSignUpForm, formatFirebaseError } from '@utils/validation';
import { SignUpData, ValidationErrors } from '../../types/auth';
import { UserRole } from '../../types/user';
import { SignUpScreenProps } from '../../types/navigation';
import RoleSelector from '@components/forms/RoleSelector';

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState<SignUpData>({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const validateForm = (): boolean => {
    const newErrors = validateSignUpForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (): Promise<void> => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signUp(formData);
      Alert.alert('Success', result.message || 'Account created successfully!');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Sign Up Error', formatFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SignUpData, value: string | UserRole): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Join Swach Netra</Title>
            <Subheading style={styles.subtitle}>
              Municipal Monitoring & Management System
            </Subheading>

            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              mode="outlined"
              style={styles.input}
              error={!!errors.name}
              left={<TextInput.Icon icon="account" />}
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name}
            </HelperText>

            <TextInput
              label="Email Address"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!errors.email}
              left={<TextInput.Icon icon="email" />}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>

            <TextInput
              label="Mobile Number"
              value={formData.mobileNumber}
              onChangeText={(value) => handleInputChange('mobileNumber', value)}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              error={!!errors.mobileNumber}
              left={<TextInput.Icon icon="phone" />}
              placeholder="10-digit mobile number"
            />
            <HelperText type="error" visible={!!errors.mobileNumber}>
              {errors.mobileNumber}
            </HelperText>

            <RoleSelector
              value={formData.role}
              onValueChange={(role) => handleInputChange('role', role)}
              error={errors.role}
              style={styles.input}
            />

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              error={!!errors.password}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              error={!!errors.confirmPassword}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSignUp}
              style={styles.button}
              disabled={loading}
              contentStyle={styles.buttonContent}
            >
              {loading ? <ActivityIndicator color="white" /> : 'Create Swach Netra Account'}
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
            >
              Already have an account? Sign In
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e8',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    elevation: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 14,
    color: '#666',
  },
  input: {
    marginBottom: 5,
  },
  button: {
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#4caf50',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 15,
  },
  linkButton: {
    marginTop: 5,
  },
});

export default SignUpScreen;
