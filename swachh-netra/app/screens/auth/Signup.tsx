import React, { useState, useEffect } from 'react';
import {
    Text,
    TextInput,
    View,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    Dimensions,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../FirebaseConfig';
import { ApprovalService } from '../../../services/ApprovalService';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Signup = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'driver' // default role
    });
    const [loading, setLoading] = useState(false);
    const [adminSecret, setAdminSecret] = useState('');
    const [focusedField, setFocusedField] = useState('');
    const [contractors, setContractors] = useState<any[]>([]);
    const [selectedContractor, setSelectedContractor] = useState('');
    const navigation = useNavigation();
    const auth = FIREBASE_AUTH;

    // Animation values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(50))[0];
    const scaleAnim = useState(new Animated.Value(0.9))[0];
    const logoRotateAnim = useState(new Animated.Value(0))[0];

    // Define roles for your municipal monitoring app
    const roles = [
        {
            value: 'driver',
            label: 'Driver',
            description: 'Vehicle operator for waste collection',
            icon: 'local-shipping',
            color: '#3b82f6',
            gradient: ['#3b82f6', '#1d4ed8'] as readonly [string, string]
        },
        {
            value: 'swachh_hr',
            label: 'Swachh HR',
            description: 'Manage workforce and operations',
            icon: 'people',
            color: '#10b981',
            gradient: ['#10b981', '#059669'] as readonly [string, string]
        },
        {
            value: 'transport_contractor',
            label: 'Contractor',
            description: 'Manage drivers and vehicles',
            icon: 'engineering',
            color: '#f59e0b',
            gradient: ['#f59e0b', '#d97706'] as readonly [string, string]
        },
        {
            value: 'admin',
            label: 'Administrator',
            description: 'Full system access and control',
            icon: 'admin-panel-settings',
            color: '#8b5cf6',
            gradient: ['#8b5cf6', '#7c3aed'] as readonly [string, string]
        },
    ];

    // Admin secret key - in production, this should be more secure
    const ADMIN_SECRET_KEY = 'SWACHH_ADMIN_2024';

    // Fetch contractors for driver role selection
    const fetchContractors = async () => {
        try {
            const contractorsQuery = query(
                collection(FIRESTORE_DB, 'users'),
                where('role', '==', 'transport_contractor'),
                where('isActive', '==', true)
            );
            const contractorsSnapshot = await getDocs(contractorsQuery);
            const contractorsList = contractorsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setContractors(contractorsList);
        } catch (error) {
            console.error('Error fetching contractors:', error);
        }
    };

    useEffect(() => {
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

        // Fetch contractors when component mounts
        fetchContractors();

        return () => rotateAnimation.stop();
    }, []);

    const handleSignup = async () => {
        // Validation
        if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            Alert.alert('Error', 'Password should be at least 6 characters long');
            return;
        }

        // Admin role validation
        if (formData.role === 'admin' && adminSecret !== ADMIN_SECRET_KEY) {
            Alert.alert('Error', 'Invalid admin secret key');
            return;
        }

        // Driver role validation - must select a contractor
        if (formData.role === 'driver' && !selectedContractor) {
            Alert.alert('Error', 'Please select a contractor to request approval from');
            return;
        }

        setLoading(true);
        try {
            // For admin role, create account directly (with secret key validation)
            if (formData.role === 'admin') {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );

                const user = userCredential.user;

                await setDoc(doc(FIRESTORE_DB, 'users', user.uid), {
                    uid: user.uid,
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    role: formData.role,
                    createdAt: new Date().toISOString(),
                    isActive: true,
                    permissions: getRolePermissions(formData.role)
                });

                Alert.alert(
                    'Success',
                    'Admin account created successfully!',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
                );
            } else {
                // For other roles, create approval request using ApprovalService
                const approvalRequest = {
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    role: formData.role,
                    password: formData.password, // Store temporarily for approval
                    requestedAt: new Date().toISOString(),
                    status: 'pending' as const,
                    approver: formData.role === 'driver' ? selectedContractor : 'admin',
                    approverType: formData.role === 'driver' ? 'contractor' as const : 'admin' as const
                };

                await ApprovalService.createApprovalRequest(approvalRequest);

                const approverText = formData.role === 'driver'
                    ? 'your selected contractor'
                    : 'the administrator';

                Alert.alert(
                    'Request Submitted',
                    `Your ${roles.find(r => r.value === formData.role)?.label} registration request has been submitted for approval by ${approverText}. You will be notified once approved.`,
                    [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
                );
            }

        } catch (error) {
            console.log('Signup error:', error);
            Alert.alert('Signup Failed', (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Define permissions based on role
    const getRolePermissions = (role: string) => {
        switch (role) {
            case 'admin':
                return {
                    canManageUsers: true,
                    canViewAllReports: true,
                    canAssignTasks: true,
                    canGenerateReports: true,
                    canManageSystem: true
                };
            case 'transport_contractor':
                return {                    
                    canManageUsers: true,
                    canViewAllReports: true,
                    canAssignTasks: true,
                    canGenerateReports: true,
                    canManageSystem: true
                };
            case 'swachh_hr':
                return {
                    canManageUsers: false,
                    canViewAllReports: true,
                    canAssignTasks: true,
                    canGenerateReports: true,
                    canManageSystem: false
                };
            case 'driver':
            default:
                return {
                    canManageUsers: false,
                    canViewAllReports: false,
                    canAssignTasks: false,
                    canGenerateReports: false,
                    canManageSystem: false
                };
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
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
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
                            Join our advanced civic monitoring platform
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
                        <Text style={styles.formTitle}>Create Professional Account</Text>
                        <Text style={styles.formSubtitle}>
                            Join our enterprise-grade municipal monitoring system
                        </Text>
                    </View>

                    {/* Personal Information Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>
                            <MaterialIcons name="person" size={18} color="#374151" /> Personal Information
                        </Text>

                        {/* Full Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                <MaterialIcons name="person" size={16} color="#374151" /> Full Name
                            </Text>
                            <Animated.View style={[
                                styles.inputWrapper,
                                focusedField === 'fullName' && styles.inputWrapperFocused,
                                {
                                    transform: [{ scale: focusedField === 'fullName' ? 1.02 : 1 }],
                                }
                            ]}>
                                <View style={styles.inputIconContainer}>
                                    <MaterialIcons name="person" size={20} color="#3b82f6" />
                                </View>
                                <TextInput
                                    value={formData.fullName}
                                    style={styles.input}
                                    placeholder='Enter your full name'
                                    placeholderTextColor="#9ca3af"
                                    onChangeText={(value) => updateFormData('fullName', value)}
                                    editable={!loading}
                                    onFocus={() => setFocusedField('fullName')}
                                    onBlur={() => setFocusedField('')}
                                />
                                {formData.fullName.length > 0 && (
                                    <MaterialIcons
                                        name="check-circle"
                                        size={20}
                                        color="#10b981"
                                        style={styles.validationIcon}
                                    />
                                )}
                            </Animated.View>
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                <MaterialIcons name="email" size={16} color="#374151" /> Email Address
                            </Text>
                            <Animated.View style={[
                                styles.inputWrapper,
                                focusedField === 'email' && styles.inputWrapperFocused,
                                {
                                    transform: [{ scale: focusedField === 'email' ? 1.02 : 1 }],
                                }
                            ]}>
                                <View style={styles.inputIconContainer}>
                                    <MaterialIcons name="email" size={20} color="#3b82f6" />
                                </View>
                                <TextInput
                                    value={formData.email}
                                    style={styles.input}
                                    placeholder='Enter your professional email'
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize='none'
                                    keyboardType='email-address'
                                    onChangeText={(value) => updateFormData('email', value)}
                                    editable={!loading}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField('')}
                                />
                                {formData.email.includes('@') && (
                                    <MaterialIcons
                                        name="check-circle"
                                        size={20}
                                        color="#10b981"
                                        style={styles.validationIcon}
                                    />
                                )}
                            </Animated.View>
                        </View>

                        {/* Phone Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                <MaterialIcons name="phone" size={16} color="#374151" /> Phone Number
                            </Text>
                            <Animated.View style={[
                                styles.inputWrapper,
                                focusedField === 'phone' && styles.inputWrapperFocused,
                                {
                                    transform: [{ scale: focusedField === 'phone' ? 1.02 : 1 }],
                                }
                            ]}>
                                <View style={styles.inputIconContainer}>
                                    <MaterialIcons name="phone" size={20} color="#3b82f6" />
                                </View>
                                <TextInput
                                    value={formData.phone}
                                    style={styles.input}
                                    placeholder='Enter your phone number'
                                    placeholderTextColor="#9ca3af"
                                    keyboardType='phone-pad'
                                    onChangeText={(value) => updateFormData('phone', value)}
                                    editable={!loading}
                                    onFocus={() => setFocusedField('phone')}
                                    onBlur={() => setFocusedField('')}
                                />
                                {formData.phone.length >= 10 && (
                                    <MaterialIcons
                                        name="check-circle"
                                        size={20}
                                        color="#10b981"
                                        style={styles.validationIcon}
                                    />
                                )}
                            </Animated.View>
                        </View>
                    </View>

                    {/* Security Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>
                            <MaterialIcons name="security" size={18} color="#374151" /> Security Information
                        </Text>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                <MaterialIcons name="lock" size={16} color="#374151" /> Password
                            </Text>
                            <Animated.View style={[
                                styles.inputWrapper,
                                focusedField === 'password' && styles.inputWrapperFocused,
                                {
                                    transform: [{ scale: focusedField === 'password' ? 1.02 : 1 }],
                                }
                            ]}>
                                <View style={styles.inputIconContainer}>
                                    <MaterialIcons name="lock" size={20} color="#3b82f6" />
                                </View>
                                <TextInput
                                    secureTextEntry={true}
                                    value={formData.password}
                                    style={styles.input}
                                    placeholder='Create a secure password'
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize='none'
                                    onChangeText={(value) => updateFormData('password', value)}
                                    editable={!loading}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField('')}
                                />
                                {formData.password.length >= 6 && (
                                    <MaterialIcons
                                        name="check-circle"
                                        size={20}
                                        color="#10b981"
                                        style={styles.validationIcon}
                                    />
                                )}
                            </Animated.View>
                            <Text style={styles.passwordHint}>
                                <MaterialIcons name="info" size={14} color="#6b7280" /> Minimum 6 characters required
                            </Text>
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>
                                <MaterialIcons name="lock-outline" size={16} color="#374151" /> Confirm Password
                            </Text>
                            <Animated.View style={[
                                styles.inputWrapper,
                                focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                                {
                                    transform: [{ scale: focusedField === 'confirmPassword' ? 1.02 : 1 }],
                                }
                            ]}>
                                <View style={styles.inputIconContainer}>
                                    <MaterialIcons name="lock-outline" size={20} color="#3b82f6" />
                                </View>
                                <TextInput
                                    secureTextEntry={true}
                                    value={formData.confirmPassword}
                                    style={styles.input}
                                    placeholder='Confirm your password'
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize='none'
                                    onChangeText={(value) => updateFormData('confirmPassword', value)}
                                    editable={!loading}
                                    onFocus={() => setFocusedField('confirmPassword')}
                                    onBlur={() => setFocusedField('')}
                                />
                                {formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && (
                                    <MaterialIcons
                                        name="check-circle"
                                        size={20}
                                        color="#10b981"
                                        style={styles.validationIcon}
                                    />
                                )}
                            </Animated.View>
                        </View>
                    </View>

                    {/* Role Selection Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>
                            <MaterialIcons name="work" size={18} color="#374151" /> Select Your Professional Role
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                            Choose the role that best describes your position in the municipal system
                        </Text>

                        <View style={styles.rolesGrid}>
                            {roles.map((role) => (
                                <TouchableOpacity
                                    key={role.value}
                                    style={[
                                        styles.roleCard,
                                        formData.role === role.value && styles.roleCardSelected
                                    ]}
                                    onPress={() => updateFormData('role', role.value)}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={formData.role === role.value ? role.gradient : ['#f8fafc', '#f1f5f9']}
                                        style={styles.roleCardGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <View style={styles.roleIconContainer}>
                                            <MaterialIcons
                                                name={role.icon as any}
                                                size={32}
                                                color={formData.role === role.value ? '#ffffff' : role.color}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.roleLabel,
                                            formData.role === role.value && styles.roleLabelSelected
                                        ]}>
                                            {role.label}
                                        </Text>
                                        <Text style={[
                                            styles.roleDescription,
                                            formData.role === role.value && styles.roleDescriptionSelected
                                        ]}>
                                            {role.description}
                                        </Text>
                                        <View style={[
                                            styles.roleSelector,
                                            formData.role === role.value && styles.roleSelectorSelected
                                        ]}>
                                            {formData.role === role.value && (
                                                <MaterialIcons name="check" size={16} color="#ffffff" />
                                            )}
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Contractor Selection for Drivers */}
                    {formData.role === 'driver' && (
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>
                                <MaterialIcons name="business" size={18} color="#374151" /> Select Your Contractor
                            </Text>
                            <Text style={styles.sectionSubtitle}>
                                Choose the contractor you want to work under. Your registration will require their approval.
                            </Text>

                            {contractors.length > 0 ? (
                                <View style={styles.contractorsList}>
                                    {contractors.map((contractor) => (
                                        <TouchableOpacity
                                            key={contractor.id}
                                            style={[
                                                styles.contractorCard,
                                                selectedContractor === contractor.id && styles.contractorCardSelected
                                            ]}
                                            onPress={() => setSelectedContractor(contractor.id)}
                                            activeOpacity={0.8}
                                        >
                                            <View style={styles.contractorInfo}>
                                                <MaterialIcons
                                                    name="engineering"
                                                    size={24}
                                                    color={selectedContractor === contractor.id ? '#3b82f6' : '#6b7280'}
                                                />
                                                <View style={styles.contractorDetails}>
                                                    <Text style={[
                                                        styles.contractorName,
                                                        selectedContractor === contractor.id && styles.contractorNameSelected
                                                    ]}>
                                                        {contractor.fullName}
                                                    </Text>
                                                    <Text style={styles.contractorEmail}>
                                                        {contractor.email}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[
                                                styles.contractorSelector,
                                                selectedContractor === contractor.id && styles.contractorSelectorSelected
                                            ]}>
                                                {selectedContractor === contractor.id && (
                                                    <MaterialIcons name="check" size={16} color="#3b82f6" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.noContractorsContainer}>
                                    <MaterialIcons name="info" size={24} color="#f59e0b" />
                                    <Text style={styles.noContractorsText}>
                                        No contractors available at the moment. Please contact the administrator.
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Admin Secret Input */}
                    {formData.role === 'admin' && (
                        <View style={styles.sectionContainer}>
                            <LinearGradient
                                colors={['#fef3c7', '#fde68a']}
                                style={styles.adminSecretContainer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={styles.adminSecretHeader}>
                                    <MaterialIcons name="security" size={24} color="#d97706" />
                                    <Text style={styles.adminSecretLabel}>Administrator Verification</Text>
                                </View>
                                <Text style={styles.adminSecretDescription}>
                                    Enter the administrator secret key to create an admin account
                                </Text>
                                <Animated.View style={[
                                    styles.inputWrapper,
                                    focusedField === 'adminSecret' && styles.inputWrapperFocused,
                                    {
                                        transform: [{ scale: focusedField === 'adminSecret' ? 1.02 : 1 }],
                                    }
                                ]}>
                                    <View style={styles.inputIconContainer}>
                                        <MaterialIcons name="vpn-key" size={20} color="#d97706" />
                                    </View>
                                    <TextInput
                                        value={adminSecret}
                                        style={styles.input}
                                        placeholder='Enter administrator secret key'
                                        placeholderTextColor="#9ca3af"
                                        secureTextEntry={true}
                                        onChangeText={setAdminSecret}
                                        editable={!loading}
                                        onFocus={() => setFocusedField('adminSecret')}
                                        onBlur={() => setFocusedField('')}
                                    />
                                    {adminSecret.length > 0 && (
                                        <MaterialIcons
                                            name="check-circle"
                                            size={20}
                                            color="#10b981"
                                            style={styles.validationIcon}
                                        />
                                    )}
                                </Animated.View>
                                <Text style={styles.adminSecretNote}>
                                    <MaterialIcons name="info" size={14} color="#d97706" /> This key is required for administrator access
                                </Text>
                            </LinearGradient>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButtonContainer, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
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
                                    <Text style={styles.loadingText}>Creating Account...</Text>
                                </View>
                            ) : (
                                <View style={styles.buttonContent}>
                                    <MaterialIcons
                                        name="person-add"
                                        size={20}
                                        color="#fff"
                                        style={styles.buttonIcon}
                                    />
                                    <Text style={styles.submitButtonText}>Create Professional Account</Text>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Switch to Login */}
                    <View style={styles.switchSection}>
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.switchContainer}>
                            <Text style={styles.switchText}>Already have a professional account? </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Login' as never)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.switchButtonText}>Sign In</Text>
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

export default Signup;

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
    sectionContainer: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 18,
        height: 58,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    inputWrapperFocused: {
        borderColor: '#3b82f6',
        backgroundColor: '#fff',
        shadowColor: '#3b82f6',
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
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        paddingVertical: 0,
    },
    validationIcon: {
        marginLeft: 8,
    },
    passwordHint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        marginLeft: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rolesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    roleCard: {
        width: '48%',
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    roleCardSelected: {
        shadowColor: '#3b82f6',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    roleCardGradient: {
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        minHeight: 140,
        justifyContent: 'space-between',
    },
    roleIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    roleLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 6,
    },
    roleLabelSelected: {
        color: '#ffffff',
    },
    roleDescription: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 12,
    },
    roleDescriptionSelected: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    roleSelector: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleSelectorSelected: {
        borderColor: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    adminSecretContainer: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    adminSecretHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    adminSecretLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#d97706',
        marginLeft: 8,
    },
    adminSecretDescription: {
        fontSize: 14,
        color: '#92400e',
        marginBottom: 16,
        lineHeight: 20,
    },
    adminSecretNote: {
        fontSize: 12,
        color: '#d97706',
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    submitButtonContainer: {
        borderRadius: 15,
        marginTop: 25,
        shadowColor: '#1e40af',
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
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#9ca3af',
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
        color: '#6b7280',
        textAlign: 'center',
    },
    switchButtonText: {
        fontSize: 14,
        color: '#3b82f6',
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
    // Contractor selection styles
    contractorsList: {
        marginTop: 12,
    },
    contractorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: '#f9fafb',
        marginBottom: 12,
    },
    contractorCardSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    contractorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    contractorDetails: {
        marginLeft: 12,
        flex: 1,
    },
    contractorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    contractorNameSelected: {
        color: '#3b82f6',
    },
    contractorEmail: {
        fontSize: 14,
        color: '#6b7280',
    },
    contractorSelector: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#d1d5db',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contractorSelectorSelected: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    noContractorsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fbbf24',
    },
    noContractorsText: {
        fontSize: 14,
        color: '#92400e',
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
});
