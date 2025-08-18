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
    Animated,
    Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../FirebaseConfig';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';


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

    // Animation values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(50))[0];
    const scaleAnim = useState(new Animated.Value(0.9))[0];
    const logoRotateAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        console.log('Firebase Auth instance:', auth);
        if (auth) {
            console.log('✅ Firebase Auth connected successfully');
        } else {
            console.log('❌ Firebase Auth connection failed');
        }

        // Initialize animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // Logo rotation animation
        const rotateAnimation = Animated.loop(
            Animated.timing(logoRotateAnim, {
                toValue: 1,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        rotateAnimation.start();

        return () => rotateAnimation.stop();
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
                                    onPress: () => navigation.navigate('AdminDashboard' as never)
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
                                    onPress: () => navigation.navigate('ContractorDashboard' as never)
                                }
                            ],
                            { cancelable: false }
                        );
                        break;

                    case 'driver':
                        Alert.alert(
                            'Welcome Driver',
                            `Hello ${userName}! Redirecting to Driver Dashboard...`,
                            [
                                {
                                    text: 'Continue',
                                    onPress: () => navigation.navigate('DriverDashboard' as never)
                                }
                            ],
                            { cancelable: false }
                        );
                        break;

                    case 'swachh_hr':
                        Alert.alert(
                            'Welcome Swachh HR',
                            `Hello ${userName}! Redirecting to Swachh HR Dashboard...`,
                            [
                                {
                                    text: 'Continue',
                                    onPress: () => navigation.navigate('SwachhHRDashboard' as never)
                                }
                            ],
                            { cancelable: false }
                        );
                        break;

                    default:
                        // Fallback for unknown roles
                        Alert.alert(
                            'Welcome',
                            'Login successful. Redirecting to dashboard...',
                            [
                                {
                                    text: 'Continue',
                                    onPress: () => navigation.navigate('DriverDashboard' as never)
                                }
                            ],
                            { cancelable: false }
                        );
                        break;
                }
            } else {
                // If user document doesn't exist in Firestore, treat as driver (default role)
                console.log('User document not found, treating as driver');
                Alert.alert(
                    'Welcome',
                    'Login successful. Redirecting to dashboard...',
                    [
                        {
                            text: 'Continue',
                            onPress: () => navigation.navigate('DriverDashboard' as never)
                        }
                    ],
                    { cancelable: false }
                );
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
            // Fallback to Driver dashboard if there's an error
            Alert.alert(
                'Login Error',
                'There was an issue accessing your profile. Redirecting to default dashboard...',
                [
                    {
                        text: 'Continue',
                        onPress: () => navigation.navigate('DriverDashboard' as never)
                    }
                ],
                { cancelable: false }
            );
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            // Add shake animation for validation error
            Animated.sequence([
                Animated.timing(slideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start();

            Alert.alert('Missing Information', 'Please fill in all fields to continue');
            return;
        }

        setLoading(true);

        // Add loading animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();

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
                    colors={['#0f172a', '#1e293b', '#334155', '#475569']}
                    style={styles.headerSection}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Animated Background Elements */}
                    <Animated.View style={[styles.decorativeCircle1, { opacity: fadeAnim }]} />
                    <Animated.View style={[styles.decorativeCircle2, { opacity: fadeAnim }]} />
                    <Animated.View style={[styles.decorativeCircle3, { opacity: fadeAnim }]} />

                    <Animated.View style={[
                        styles.logoContainer,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim },
                                {
                                    rotate: logoRotateAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '360deg'],
                                    }),
                                },
                            ],
                        }
                    ]}>
                        <LinearGradient
                            colors={['#3b82f6', '#1d4ed8', '#1e40af']}
                            style={styles.logoIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialIcons name="eco" size={36} color="#ffffff" />
                        </LinearGradient>
                        <Animated.Text style={[styles.appName, { opacity: fadeAnim }]}>
                            Swachh Netra
                        </Animated.Text>
                        <Animated.Text style={[styles.appTagline, { opacity: fadeAnim }]}>
                            Smart City Monitoring System
                        </Animated.Text>
                    </Animated.View>

                    <Animated.View style={[
                        styles.greetingContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}>
                        <Text style={styles.greeting}>{getCurrentTimeGreeting()}</Text>
                        <Text style={styles.subtitle}>
                            {isLogin ? 'Welcome back to your professional dashboard' : 'Join our advanced civic monitoring platform'}
                        </Text>
                    </Animated.View>
                </LinearGradient>

                {/* Form Section */}
                <Animated.View style={[
                    styles.formSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }
                ]}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>
                            {isLogin ? 'Professional Sign In' : 'Create Professional Account'}
                        </Text>
                        <Text style={styles.formSubtitle}>
                            {isLogin ?
                                'Access your enterprise-grade municipal dashboard' :
                                'Join our advanced civic monitoring platform'
                            }
                        </Text>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                            <MaterialIcons name="email" size={16} color="#374151" /> Email Address
                        </Text>
                        <Animated.View style={[
                            styles.inputWrapper,
                            emailFocused && styles.inputWrapperFocused,
                            {
                                transform: [{ scale: emailFocused ? 1.02 : 1 }],
                            }
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <MaterialIcons name="email" size={20} color="#3b82f6" />
                            </View>
                            <TextInput
                                value={email}
                                style={styles.input}
                                placeholder='Enter your professional email address'
                                placeholderTextColor="#9ca3af"
                                autoCapitalize='none'
                                keyboardType='email-address'
                                onChangeText={setEmail}
                                editable={!loading}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                            />
                            {email.length > 0 && (
                                <MaterialIcons
                                    name="check-circle"
                                    size={20}
                                    color="#10b981"
                                    style={styles.validationIcon}
                                />
                            )}
                        </Animated.View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                            <MaterialIcons name="lock" size={16} color="#374151" /> Password
                        </Text>
                        <Animated.View style={[
                            styles.inputWrapper,
                            passwordFocused && styles.inputWrapperFocused,
                            {
                                transform: [{ scale: passwordFocused ? 1.02 : 1 }],
                            }
                        ]}>
                            <View style={styles.inputIconContainer}>
                                <MaterialIcons name="lock" size={20} color="#3b82f6" />
                            </View>
                            <TextInput
                                secureTextEntry={!showPassword}
                                value={password}
                                style={styles.input}
                                placeholder='Enter your secure password'
                                placeholderTextColor="#9ca3af"
                                autoCapitalize='none'
                                onChangeText={setPassword}
                                editable={!loading}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.passwordToggle}
                                activeOpacity={0.7}
                            >
                                <MaterialIcons
                                    name={showPassword ? 'visibility-off' : 'visibility'}
                                    size={20}
                                    color="#6b7280"
                                />
                            </TouchableOpacity>
                            {password.length >= 6 && (
                                <MaterialIcons
                                    name="check-circle"
                                    size={20}
                                    color="#10b981"
                                    style={styles.validationIcon}
                                />
                            )}
                        </Animated.View>
                        {!isLogin && (
                            <Text style={styles.passwordHint}>
                                <MaterialIcons name="info" size={14} color="#6b7280" /> Minimum 6 characters required
                            </Text>
                        )}
                    </View>

                    {/* Role Indicator for Login */}
                    {isLogin && (
                        <LinearGradient
                            colors={['#f0f9ff', '#e0f2fe']}
                            style={styles.roleIndicator}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={styles.roleIndicatorHeader}>
                                <MaterialIcons name="admin-panel-settings" size={24} color="#0369a1" />
                                <Text style={styles.roleIndicatorText}>
                                    Role-Based Access Control
                                </Text>
                            </View>
                            <Text style={styles.roleIndicatorSubtext}>
                                • Administrators → Admin Dashboard{'\n'}
                                • Contractors → Contractor Dashboard{'\n'}
                                • HR Staff → Swachh HR Dashboard{'\n'}
                                • Drivers → Driver Dashboard
                            </Text>
                        </LinearGradient>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButtonContainer, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={loading ? ['#9ca3af', '#6b7280'] : ['#1e40af', '#3b82f6', '#60a5fa']}
                            style={styles.submitButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={styles.loadingText}>
                                        {isLogin ? 'Authenticating...' : 'Creating Account...'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.buttonContent}>
                                    <MaterialIcons
                                        name={isLogin ? 'login' : 'person-add'}
                                        size={20}
                                        color="#fff"
                                        style={styles.buttonIcon}
                                    />
                                    <Text style={styles.submitButtonText}>
                                        {isLogin ? 'Sign In Securely' : 'Create Professional Account'}
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
                </Animated.View>

                {/* Footer */}
                <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                    <View style={styles.footerContent}>
                        <MaterialIcons name="security" size={16} color="#6b7280" />
                        <Text style={styles.footerText}>
                            Powered by APRICITY DIGITAL LAB
                        </Text>
                    </View>
                    <View style={styles.footerFeatures}>
                        <View style={styles.featureItem}>
                            <MaterialIcons name="verified-user" size={14} color="#10b981" />
                            <Text style={styles.footerSubtext}>Enterprise Security</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <MaterialIcons name="cloud-done" size={14} color="#3b82f6" />
                            <Text style={styles.footerSubtext}>Cloud Reliable</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <MaterialIcons name="speed" size={14} color="#f59e0b" />
                            <Text style={styles.footerSubtext}>High Performance</Text>
                        </View>
                    </View>
                </Animated.View>
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
    decorativeCircle3: {
        position: 'absolute',
        top: 100,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    validationIcon: {
        marginLeft: 8,
    },
    passwordHint: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        marginLeft: 4,
    },
    roleIndicator: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    roleIndicatorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleIndicatorText: {
        fontSize: 16,
        color: '#0369a1',
        fontWeight: '700',
        marginLeft: 8,
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
        justifyContent: 'center',
    },
    buttonIcon: {
        marginRight: 8,
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
        paddingVertical: 24,
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    footerText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
        marginLeft: 6,
    },
    footerFeatures: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerSubtext: {
        fontSize: 11,
        color: '#6b7280',
        marginLeft: 4,
        fontWeight: '500',
    },
});
