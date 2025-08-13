import React, { useState } from 'react';
import { 
    Text, 
    TextInput, 
    View, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator, 
    ScrollView 
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../FirebaseConfig';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
    const navigation = useNavigation();
    const auth = FIREBASE_AUTH;

    // Define roles for your municipal monitoring app
    const roles = [
        { value: 'driver', label: 'Driver', description: 'pilot of swachh vehicles' },
        { value: 'swachh_hr', label: 'Swachh HR', description: 'Manage swachh workers' },
        { value: 'transport_contractor', label: 'Contractor', description: 'Manage Driver and vehicles' },
        { value: 'admin', label: 'Administrator', description: 'Full system access' },
    ];

    // Admin secret key - in production, this should be more secure
    const ADMIN_SECRET_KEY = 'MUNICIPAL_ADMIN_2024';

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

        setLoading(true);
        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email, 
                formData.password
            );
            
            const user = userCredential.user;

            // Store additional user data in Firestore with role
            await setDoc(doc(FIRESTORE_DB, 'users', user.uid), {
                uid: user.uid,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                createdAt: new Date().toISOString(),
                isActive: true,
                // Role-specific permissions
                permissions: getRolePermissions(formData.role)
            });

            Alert.alert(
                'Success', 
                `Account created successfully!\nRole: ${roles.find(r => r.value === formData.role)?.label}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.navigate('Login' as never);
                        }
                    }
                ]
            );

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

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join Municipal Monitoring System</Text>
                
                <TextInput 
                    value={formData.fullName} 
                    style={styles.input} 
                    placeholder='Full Name *' 
                    onChangeText={(value) => updateFormData('fullName', value)}
                    editable={!loading}
                />
                
                <TextInput 
                    value={formData.email} 
                    style={styles.input} 
                    placeholder='Email Address *' 
                    autoCapitalize='none'
                    keyboardType='email-address'
                    onChangeText={(value) => updateFormData('email', value)}
                    editable={!loading}
                />

                <TextInput 
                    value={formData.phone} 
                    style={styles.input} 
                    placeholder='Phone Number *' 
                    keyboardType='phone-pad'
                    onChangeText={(value) => updateFormData('phone', value)}
                    editable={!loading}
                />
                
                <TextInput 
                    secureTextEntry={true} 
                    value={formData.password} 
                    style={styles.input} 
                    placeholder='Password *' 
                    autoCapitalize='none' 
                    onChangeText={(value) => updateFormData('password', value)}
                    editable={!loading}
                />

                <TextInput 
                    secureTextEntry={true} 
                    value={formData.confirmPassword} 
                    style={styles.input} 
                    placeholder='Confirm Password *' 
                    autoCapitalize='none' 
                    onChangeText={(value) => updateFormData('confirmPassword', value)}
                    editable={!loading}
                />

                {/* Role Selection */}
                <Text style={styles.sectionTitle}>Select Your Role</Text>
                {roles.map((role) => (
                    <TouchableOpacity
                        key={role.value}
                        style={[
                            styles.roleOption,
                            formData.role === role.value && styles.roleOptionSelected
                        ]}
                        onPress={() => updateFormData('role', role.value)}
                        disabled={loading}
                    >
                        <View style={styles.roleContent}>
                            <Text style={[
                                styles.roleTitle,
                                formData.role === role.value && styles.roleTextSelected
                            ]}>
                                {role.label}
                            </Text>
                            <Text style={[
                                styles.roleDescription,
                                formData.role === role.value && styles.roleTextSelected
                            ]}>
                                {role.description}
                            </Text>
                        </View>
                        <View style={[
                            styles.radioButton,
                            formData.role === role.value && styles.radioButtonSelected
                        ]} />
                    </TouchableOpacity>
                ))}

                {/* Admin Secret Input */}
                {formData.role === 'admin' && (
                    <View style={styles.adminSecretContainer}>
                        <Text style={styles.adminSecretLabel}>Admin Secret Key *</Text>
                        <TextInput 
                            value={adminSecret} 
                            style={[styles.input, styles.adminSecretInput]} 
                            placeholder='Enter admin secret key' 
                            secureTextEntry={true}
                            onChangeText={setAdminSecret}
                            editable={!loading}
                        />
                        <Text style={styles.adminSecretNote}>
                            This key is required to create admin accounts
                        </Text>
                    </View>
                )}
                
                <TouchableOpacity 
                    style={[styles.signupButton, loading && styles.buttonDisabled]} 
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.signupButtonText}>Create Account</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => {
                        navigation.navigate('Login' as never);
                    }}>
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

export default Signup;

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        marginHorizontal: 20,
        paddingVertical: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        padding: 20,
        backgroundColor: '#edebebff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 15,
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        width: '100%',
        height: 50,
        marginVertical: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        marginVertical: 5,
        backgroundColor: '#fff',
    },
    roleOptionSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#f0f8ff',
    },
    roleContent: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    roleDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    roleTextSelected: {
        color: '#007AFF',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    radioButtonSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#007AFF',
    },
    adminSecretContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#fff3cd',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffeaa7',
    },
    adminSecretLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 10,
    },
    adminSecretInput: {
        marginVertical: 0,
        borderColor: '#ffeaa7',
    },
    adminSecretNote: {
        fontSize: 12,
        color: '#856404',
        marginTop: 5,
        fontStyle: 'italic',
    },
    signupButton: {
        backgroundColor: '#007AFF',
        width: '100%',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 16,
        color: '#666',
    },
    loginButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: 'bold',
    },
});
