import React, { useState, useEffect } from 'react';
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
  Checkbox,
  ActivityIndicator,
  Divider,
  Subheading,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@context/AuthContext';
import { validateLoginForm, formatFirebaseError } from '@utils/validation';
import { ValidationErrors } from '../../types/auth';
import { LoginScreenProps } from '../../types/navigation';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { signIn, resetPassword } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    checkRememberMe();
  }, []);

  const checkRememberMe = async (): Promise<void> => {
    try {
      const rememberMeValue = await AsyncStorage.getItem('rememberMe');
      const savedEmail = await AsyncStorage.getItem('userEmail');
      
      if (rememberMeValue === 'true' && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error checking remember me:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = validateLoginForm(email, password);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (): Promise<void> => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signIn(email, password, rememberMe);
    } catch (error) {
      Alert.alert('Login Error', formatFirebaseError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (): Promise<void> => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    const emailErrors = validateLoginForm(email, 'dummy');
    if (emailErrors.email) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const result = await resetPassword(email);
      Alert.alert('Success', result.message || 'Password reset email sent!');
    } catch (error) {
      Alert.alert('Error', formatFirebaseError(error));
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string): void => {
    if (field === 'email') {
      setEmail(value);
    } else if (field === 'password') {
      setPassword(value);
    }

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
            <Title style={styles.title}>Welcome to Swach Netra</Title>
            <Subheading style={styles.subtitle}>
              Municipal Monitoring & Management System
            </Subheading>

            <TextInput
              label="Email Address"
              value={email}
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
              label="Password"
              value={password}
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

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text style={styles.checkboxLabel}>Remember me</Text>
            </View>

            <Button
              mode="contained"
              onPress={handleSignIn}
              style={styles.button}
              disabled={loading}
              contentStyle={styles.buttonContent}
            >
              {loading ? <ActivityIndicator color="white" /> : 'Sign In to Swach Netra'}
            </Button>

            <Button
              mode="text"
              onPress={handleForgotPassword}
              style={styles.linkButton}
            >
              Forgot Password?
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="text"
              onPress={() => navigation.navigate('SignUp')}
              style={styles.linkButton}
            >
              Don't have an account? Join Swach Netra
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
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

export default LoginScreen;
