import React, { useState, useEffect } from 'react';
import { 
    Text, 
    TextInput, 
    View, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../FirebaseConfig';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AdminDashboard from '../admin/AdminDashboard';
import ContractorDashboard from '../contractor/ContractorDashboard';
import SwachhHRDashboard from '../swachh_hr/Swachh_hr_Dashboard';
import DriverDashboard from '../driver/DriverDashboard';


const { width, height } = Dimensions.get('window');

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const navigation = useNavigation();
    const auth = FIREBASE_AUTH;

    useEffect(() => {
        console.log('Firebase Auth instance:', auth);
        if (auth) {
            console.log('✅ Firebase Auth connected successfully');
        } else {
            console.log('❌ Firebase Auth connection failed');
        }
    }, []);

    // Function to get user role and navigate accordingly
    const handlePostLoginNavigation = async (user: any) => {
        try {
            // Fetch user data from Firestore to get role
            const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userRole = userData.role;
                const userName = userData.fullName || user.email;
                
                console.log('User role:', userRole);
                
                // Navigate based on user role
                switch (userRole) {
                    case 'admin':
                        Alert.alert(
                            'Welcome Administrator',
                            `Hello ${userName}! Redirecting to Admin Dashboard...`,
                            [
                                {
                                    text: 'Continue',
                                    onPress: () => navigation.navigate(AdminDashboard as never)
                                }
                            ],
                            { cancelable: false }
                        );
                        break;
                 
                    case 'transport_contractor':
                        Alert.alert(
                            'Welcome Contractor',
                            `Hello ${userName}! Redirecting to Contractor Dashboard...`,
                            [
                                {
                                    text: 'Continue',
                                    onPress: () => navigation.navigate(ContractorDashboard as never)
                                }
                            ],
                            { cancelable: false }
                        );
                        break;

                       case 'driver':
                         Alert.alert(
                    'Welcome',
                    'Login successful. Redirecting to dashboard...',
                    [
                        {
                            text: 'Continue',
                            onPress: () => navigation.navigate(DriverDashboard as never)
                        }
                    ],
                    { cancelable: false }
                );

                    case 'swachh_hr':
                        Alert.alert(
                            'Welcome Swachh HR',
                            `Hello ${userName}! Redirecting to Swachh HR Dashboard...`,
                            [
                                {
                                    text: 'Continue',
                                    onPress: () => navigation.navigate(SwachhHRDashboard as never)
                                }
                            ],
                            { cancelable: false }
                        );
                        break;


                  
                }
            } else {
                // If user document doesn't exist in Firestore, treat as citizen
                console.log('User document not found, treating as citizen');
                Alert.alert(
                    'Welcome',
                    'Login successful. Redirecting to dashboard...',
                    [
                        {
                            text: 'Continue',
                            onPress: () => navigation.navigate(DriverDashboard as never)
                        }
                    ],
                    { cancelable: false }
                );
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
            // Fallback to Home page if there's an error
            Alert.alert(
                'Welcome',
                'Login successful. Redirecting to dashboard...',
                [
                    {
                        text: 'Continue',
                        onPress: () => navigation.navigate(DriverDashboard as never)
                    }
                ],
                { cancelable: false }
            );
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing Information', 'Please fill in all fields to continue');
            return;
        }

        setLoading(true);
        try {
            const response = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login successful:', response);
            
            // Handle role-based navigation
            await handlePostLoginNavigation(response.user);
            
        } catch (error) {
            console.log('Login error:', error);
            let errorMessage = 'An error occurred during login';
            
            // Handle specific Firebase auth errors
            if (error instanceof Error) {
                switch (error.message) {
                    case 'Firebase: Error (auth/user-not-found).':
                        errorMessage = 'No account found with this email address';
                        break;
                    case 'Firebase: Error (auth/wrong-password).':
                        errorMessage = 'Incorrect password. Please try again';
                        break;
                    case 'Firebase: Error (auth/invalid-email).':
                        errorMessage = 'Please enter a valid email address';
                        break;
                    case 'Firebase: Error (auth/too-many-requests).':
                        errorMessage = 'Too many failed attempts. Please try again later';
                        break;
                    default:
                        errorMessage = error.message;
                }
            }
            
            Alert.alert('Login Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!email || !password) {
            Alert.alert('Missing Information', 'Please fill in all fields to continue');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password should be at least 6 characters long');
            return;
        }

        setLoading(true);
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Signup successful:', response);
            
            // For new signups, redirect to role-based signup page for complete profile
            Alert.alert(
                'Account Created',
                'Please complete your profile with role selection',
                [
                    {
                        text: 'Complete Profile',
                        onPress: () => navigation.navigate('Signup' as never)
                    }
                ]
            );
        } catch (error) {
            console.log('Signup error:', error);
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
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = () => {
        if (isLogin) {
            handleLogin();
        } else {
            handleSignup();
        }
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
                {/* Header Section with Gradient */}
                <LinearGradient
                    colors={['#1a365d', '#2d5a87', '#4299e1']}
                    style={styles.headerSection}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />
                    
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <Text style={styles.logoText}>🏛️</Text>
                        </View>
                        <Text style={styles.appName}>Swachh Netra</Text>
                        <Text style={styles.appTagline}>Smart City Monitoring System</Text>
                    </View>
                    
                    <View style={styles.greetingContainer}>
                        <Text style={styles.greeting}>{getCurrentTimeGreeting()}</Text>
                        <Text style={styles.subtitle}>
                            {isLogin ? 'Welcome back to your dashboard' : 'Join our civic community'}
                        </Text>
                    </View>
                </LinearGradient>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </Text>
                        <Text style={styles.formSubtitle}>
                            {isLogin ? 
                                'Access your role-based municipal dashboard' : 
                                'Start monitoring civic services in Pune'
                            }
                        </Text>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View style={[
                            styles.inputWrapper,
                            emailFocused && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <Text style={styles.inputIcon}>@</Text>
                            </View>
                            <TextInput 
                                value={email} 
                                style={styles.input} 
                                placeholder='Enter your email address' 
                                placeholderTextColor="#999"
                                autoCapitalize='none'
                                keyboardType='email-address'
                                onChangeText={setEmail}
                                editable={!loading}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={[
                            styles.inputWrapper,
                            passwordFocused && styles.inputWrapperFocused
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <Text style={styles.inputIcon}>•</Text>
                            </View>
                            <TextInput 
                                secureTextEntry={!showPassword} 
                                value={password} 
                                style={styles.input} 
                                placeholder='Enter your password' 
                                placeholderTextColor="#999"
                                autoCapitalize='none' 
                                onChangeText={setPassword}
                                editable={!loading}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                            />
                            <TouchableOpacity 
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.passwordToggle}
                            >
                                <Text style={styles.passwordToggleText}>
                                    {showPassword ? 'Hide' : 'Show'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {!isLogin && (
                            <Text style={styles.passwordHint}>
                                Minimum 6 characters required
                            </Text>
                        )}
                    </View>

                    {/* Role Indicator for Login */}
                    {isLogin && (
                        <View style={styles.roleIndicator}>
                            <Text style={styles.roleIndicatorText}>
                                🏛️ Admins will be redirected to Admin Dashboard
                            </Text>
                            <Text style={styles.roleIndicatorSubtext}>
                                Citizens and Officers get their respective dashboards
                            </Text>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity 
                        style={[styles.submitButtonContainer, loading && styles.buttonDisabled]} 
                        onPress={handleSubmit}
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
                                    <Text style={styles.loadingText}>
                                        {isLogin ? 'Signing In...' : 'Creating Account...'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Text style={styles.submitButtonText}>
                                        {isLogin ? 'Sign In' : 'Create Account'}
                                    </Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Forgot Password (Login only) */}
                    {isLogin && (
                        <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                            <Text style={styles.forgotPasswordText}>
                                Forgot your password?
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Switch between Login/Signup */}
                    <View style={styles.switchSection}>
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.switchContainer}>
                            <Text style={styles.switchText}>
                                {isLogin ? "New to Municipal Monitor? " : "Already have an account? "}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    if (isLogin) {
                                        navigation.navigate('Signup' as never);
                                    } else {
                                        setIsLogin(true);
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.switchButtonText}>
                                    {isLogin ? 'Create Account' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Powered by APRICITY DIGITAL LAB
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Secure • Reliable 
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default Login;

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
        paddingBottom: 50,
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: 25,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    logoText: {
        fontSize: 30,
    },
    appName: {
        fontSize: 32,
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
    },
    greetingContainer: {
        alignItems: 'center',
    },
    greeting: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#ffffff90',
        textAlign: 'center',
        lineHeight: 20,
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
    formHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
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
        height: 58,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    inputWrapperFocused: {
        borderColor: '#4299e1',
        backgroundColor: '#fff',
        shadowColor: '#4299e1',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        transform: [{ scale: 1.01 }],
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
    inputIcon: {
        fontSize: 16,
        color: '#4299e1',
        fontWeight: '600',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 0,
    },
    passwordToggle: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    passwordToggleText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    passwordHint: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        marginLeft: 4,
    },
    roleIndicator: {
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    roleIndicatorText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
        marginBottom: 4,
    },
    roleIndicatorSubtext: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },
    submitButtonContainer: {
        borderRadius: 15,
        marginTop: 15,
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
    forgotPassword: {
        alignSelf: 'center',
        marginTop: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    forgotPasswordText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    switchSection: {
        marginTop: 30,
        marginBottom: 20,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e1e5e9',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#999',
        fontWeight: '500',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    switchText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    switchButtonText: {
        fontSize: 14,
        color: '#007AFF',
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
        fontWeight: '500',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
    },
});
