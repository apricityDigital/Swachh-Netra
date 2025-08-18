import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SignupNew = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        address: ''
    });
    const [adminSecret, setAdminSecret] = useState('');
    const [selectedRole, setSelectedRole] = useState('driver');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    
    const navigation = useNavigation();
    const { signUp, loading } = useAuth();

    // Define roles for your municipal monitoring app
    const roles = [
        { 
            value: 'driver', 
            label: 'Driver', 
            description: 'Vehicle operator for waste collection',
            icon: '🚛',
            color: '#4299e1'
        },
        { 
            value: 'swachh_hr', 
            label: 'Swachh HR', 
            description: 'Manage workforce and operations',
            icon: '👥',
            color: '#48bb78'
        },
        { 
            value: 'contractor', 
            label: 'Contractor', 
            description: 'Manage drivers and vehicles',
            icon: '🏗️',
            color: '#ed8936'
        },
        { 
            value: 'admin', 
            label: 'Administrator', 
            description: 'Full system access and control',
            icon: '👑',
            color: '#9f7aea'
        },
    ];

    // Admin secret key - in production, this should be more secure
    const ADMIN_SECRET_KEY = 'SWACHH_ADMIN_2024';

    const handleSignup = async () => {
        // Validation
        if (!formData.fullName || !formData.email || !formData.password || !formData.phoneNumber) {
            Alert.alert('Missing Information', 'Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long');
            return;
        }

        // Check admin secret if admin role is selected
        if (selectedRole === 'admin' && adminSecret !== ADMIN_SECRET_KEY) {
            Alert.alert('Access Denied', 'Invalid admin secret key');
            return;
        }

        try {
            await signUp(formData.email, formData.password, {
                fullName: formData.fullName,
                role: selectedRole as any,
                phoneNumber: formData.phoneNumber,
                address: formData.address
            });

            Alert.alert(
                'Account Created Successfully!',
                'Welcome to Swachh Netra. You can now access your dashboard.',
                [
                    {
                        text: 'Continue',
                        onPress: () => navigation.replace('Dashboard' as never)
                    }
                ]
            );

        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = 'An error occurred during signup';
            
            if (error instanceof Error) {
                switch (error.message) {
                    case 'Firebase: Error (auth/email-already-in-use).':
                        errorMessage = 'An account with this email already exists';
                        break;
                    case 'Firebase: Error (auth/invalid-email).':
                        errorMessage = 'Please enter a valid email address';
                        break;
                    case 'Firebase: Error (auth/weak-password).':
                        errorMessage = 'Please choose a stronger password';
                        break;
                    default:
                        errorMessage = error.message;
                }
            }
            
            Alert.alert('Signup Failed', errorMessage);
        }
    };

    const updateFormData = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getCurrentTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header Section */}
                <LinearGradient
                    colors={['#1a365d', '#2d5a87', '#4299e1']}
                    style={styles.headerSection}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />
                    
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <Text style={styles.logoText}>🏛️</Text>
                        </View>
                        <Text style={styles.appName}>Join Swachh Netra</Text>
                        <Text style={styles.appTagline}>{getCurrentTimeGreeting()}! Create your account</Text>
                    </View>
                </LinearGradient>

                {/* Form Section */}
                <View style={styles.formSection}>
                    {/* Role Selection */}
                    <View style={styles.roleSection}>
                        <Text style={styles.sectionTitle}>Select Your Role</Text>
                        <View style={styles.rolesGrid}>
                            {roles.map((role) => (
                                <TouchableOpacity
                                    key={role.value}
                                    style={[
                                        styles.roleCard,
                                        selectedRole === role.value && styles.roleCardSelected
                                    ]}
                                    onPress={() => setSelectedRole(role.value)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.roleIcon}>{role.icon}</Text>
                                    <Text style={[
                                        styles.roleLabel,
                                        selectedRole === role.value && styles.roleLabelSelected
                                    ]}>
                                        {role.label}
                                    </Text>
                                    <Text style={[
                                        styles.roleDescription,
                                        selectedRole === role.value && styles.roleDescriptionSelected
                                    ]}>
                                        {role.description}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Admin Secret Key */}
                    {selectedRole === 'admin' && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Admin Secret Key</Text>
                            <View style={[
                                styles.inputWrapper,
                                focusedField === 'adminSecret' && styles.inputWrapperFocused
                            ]}>
                                <View style={styles.inputIconContainer}>
                                    <MaterialIcons name="security" size={16} color="#9f7aea" />
                                </View>
                                <TextInput 
                                    value={adminSecret}
                                    style={styles.input} 
                                    placeholder='Enter admin secret key' 
                                    placeholderTextColor="#999"
                                    secureTextEntry={true}
                                    onChangeText={setAdminSecret}
                                    editable={!loading}
                                    onFocus={() => setFocusedField('adminSecret')}
                                    onBlur={() => setFocusedField('')}
                                />
                            </View>
                            <Text style={styles.adminHint}>
                                Contact system administrator for the secret key
                            </Text>
                        </View>
                    )}

                    {/* Personal Information */}
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'fullName' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <MaterialIcons name="person" size={16} color="#4299e1" />
                            </View>
                            <TextInput 
                                value={formData.fullName}
                                style={styles.input} 
                                placeholder='Enter your full name' 
                                placeholderTextColor="#999"
                                onChangeText={(value) => updateFormData('fullName', value)}
                                editable={!loading}
                                onFocus={() => setFocusedField('fullName')}
                                onBlur={() => setFocusedField('')}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'email' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <MaterialIcons name="email" size={16} color="#4299e1" />
                            </View>
                            <TextInput
                                value={formData.email}
                                style={styles.input}
                                placeholder='Enter your email address'
                                placeholderTextColor="#999"
                                keyboardType='email-address'
                                autoCapitalize='none'
                                onChangeText={(value) => updateFormData('email', value)}
                                editable={!loading}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField('')}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'phoneNumber' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <MaterialIcons name="phone" size={16} color="#4299e1" />
                            </View>
                            <TextInput
                                value={formData.phoneNumber}
                                style={styles.input}
                                placeholder='Enter your phone number'
                                placeholderTextColor="#999"
                                keyboardType='phone-pad'
                                onChangeText={(value) => updateFormData('phoneNumber', value)}
                                editable={!loading}
                                onFocus={() => setFocusedField('phoneNumber')}
                                onBlur={() => setFocusedField('')}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Address (Optional)</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'address' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <MaterialIcons name="location-on" size={16} color="#4299e1" />
                            </View>
                            <TextInput
                                value={formData.address}
                                style={styles.input}
                                placeholder='Enter your address'
                                placeholderTextColor="#999"
                                multiline={true}
                                numberOfLines={2}
                                onChangeText={(value) => updateFormData('address', value)}
                                editable={!loading}
                                onFocus={() => setFocusedField('address')}
                                onBlur={() => setFocusedField('')}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'password' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <MaterialIcons name="lock" size={16} color="#4299e1" />
                            </View>
                            <TextInput
                                value={formData.password}
                                style={styles.input}
                                placeholder='Create a password'
                                placeholderTextColor="#999"
                                secureTextEntry={!showPassword}
                                onChangeText={(value) => updateFormData('password', value)}
                                editable={!loading}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField('')}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.passwordToggle}
                            >
                                <MaterialIcons
                                    name={showPassword ? 'visibility-off' : 'visibility'}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <View style={[
                            styles.inputWrapper,
                            focusedField === 'confirmPassword' && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <MaterialIcons name="lock-outline" size={16} color="#4299e1" />
                            </View>
                            <TextInput
                                value={formData.confirmPassword}
                                style={styles.input}
                                placeholder='Confirm your password'
                                placeholderTextColor="#999"
                                secureTextEntry={!showConfirmPassword}
                                onChangeText={(value) => updateFormData('confirmPassword', value)}
                                editable={!loading}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField('')}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.passwordToggle}
                            >
                                <MaterialIcons
                                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                                    size={20}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButtonContainer, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={loading ? ['#ccc', '#ccc'] : ['#1a365d', '#2d5a87', '#4299e1']}
                            style={styles.submitButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={styles.loadingText}>Creating Account...</Text>
                                </View>
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.submitButtonText}>Create Account</Text>
                                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Login Link */}
                    <View style={styles.loginSection}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login' as never)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.loginButtonText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        By creating an account, you agree to our Terms of Service
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Powered by APRICITY DIGITAL LAB
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    scrollContainer: {
        flexGrow: 1,
        minHeight: height,
    },
    headerSection: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
        zIndex: 1,
    },
    logoIcon: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 35,
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoText: {
        fontSize: 30,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    appTagline: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    formSection: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 30,
        marginTop: -20,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    roleSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    rolesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    roleCard: {
        width: (width - 60) / 2,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    roleCardSelected: {
        backgroundColor: '#e6fffa',
        borderColor: '#4299e1',
        transform: [{ scale: 1.02 }],
    },
    roleIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    roleLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    roleLabelSelected: {
        color: '#4299e1',
    },
    roleDescription: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        lineHeight: 16,
    },
    roleDescriptionSelected: {
        color: '#2d5a87',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        paddingHorizontal: 18,
        minHeight: 58,
    },
    inputWrapperFocused: {
        borderColor: '#4299e1',
        backgroundColor: '#fff',
        shadowColor: '#4299e1',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    inputIconContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        backgroundColor: 'rgba(66, 153, 225, 0.1)',
        borderRadius: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 16,
    },
    passwordToggle: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    adminHint: {
        fontSize: 12,
        color: '#9f7aea',
        marginTop: 4,
        marginLeft: 4,
        fontStyle: 'italic',
    },
    submitButtonContainer: {
        borderRadius: 15,
        marginTop: 20,
        marginBottom: 20,
        shadowColor: '#1a365d',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    submitButton: {
        borderRadius: 15,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        shadowOpacity: 0.1,
        elevation: 2,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    loginSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    loginText: {
        fontSize: 14,
        color: '#666',
    },
    loginButtonText: {
        fontSize: 14,
        color: '#4299e1',
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 16,
    },
    footerSubtext: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
    },
});

export default SignupNew;
