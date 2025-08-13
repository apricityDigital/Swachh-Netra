import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
    RefreshControl,
    Dimensions,
    StatusBar,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../FirebaseConfig';

const { width } = Dimensions.get('window');

const Admin = ({ navigation }: { navigation: any }) => {
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        totalUsers: 0,
        totalReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        recentActivity: [] as any[]
    });

    useEffect(() => {
        fetchUserData();
        fetchDashboardData();
    }, []);

    const fetchUserData = async () => {
        try {
            const user = FIREBASE_AUTH.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserName(userData.fullName);
                }
            }
        } catch (error) {
            console.log('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const user = FIREBASE_AUTH.currentUser;
            if (user) {
                // Fetch all reports for admin
                const reportsRef = collection(FIRESTORE_DB, 'reports');
                const reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'), limit(50));
                const reportsSnapshot = await getDocs(reportsQuery);
                const reports = reportsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as any[];

                // Fetch all users for admin
                const usersRef = collection(FIRESTORE_DB, 'users');
                const usersSnapshot = await getDocs(usersRef);

                setDashboardData({
                    totalUsers: usersSnapshot.size,
                    totalReports: reports.length,
                    pendingReports: reports.filter(r => r.status === 'pending').length,
                    resolvedReports: reports.filter(r => r.status === 'resolved').length,
                    recentActivity: reports.slice(0, 5)
                });
            }
        } catch (error) {
            console.log('Error fetching dashboard data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(FIREBASE_AUTH);
                            navigation.replace('Login');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    }
                }
            ]
        );
    };

    const adminActions = [
        {
            title: 'User Management',
            screen: 'UserManagement',
            gradient: ['#ff9a9e', '#fecfef'] as const,
            icon: '👥'
        },
        {
            title: 'All Reports',
            screen: 'AllReports',
            gradient: ['#a8edea', '#fed6e3'] as const,
            icon: '📋'
        },
        {
            title: 'Analytics',
            screen: 'Analytics',
            gradient: ['#d299c2', '#fef9d7'] as const,
            icon: '📊'
        },
        {
            title: 'System Settings',
            screen: 'Settings',
            gradient: ['#89f7fe', '#66a6ff'] as const,
            icon: '⚙️'
        }
    ];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Gradient */}
                <LinearGradient
                    colors={['#1a365d', '#2d5a87', '#4299e1']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />

                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <View style={styles.adminBadge}>
                                <Text style={styles.adminBadgeText}>👑</Text>
                            </View>
                            <Text style={styles.welcomeText}>Admin Dashboard</Text>
                            <Text style={styles.userName}>{userName || 'Administrator'}</Text>
                            <Text style={styles.roleText}>System Administrator</Text>
                        </View>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                                style={styles.logoutButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.logoutText}>Logout</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Statistics Cards */}
                <View style={styles.statsContainer}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.statNumber}>{dashboardData.totalUsers}</Text>
                        <Text style={styles.statLabel}>Total Users</Text>
                        <Text style={styles.statIcon}>👥</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={['#f093fb', '#f5576c']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.statNumber}>{dashboardData.totalReports}</Text>
                        <Text style={styles.statLabel}>Total Reports</Text>
                        <Text style={styles.statIcon}>📊</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={['#ffecd2', '#fcb69f']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={[styles.statNumber, { color: '#d68910' }]}>
                            {dashboardData.pendingReports}
                        </Text>
                        <Text style={[styles.statLabel, { color: '#d68910' }]}>Pending</Text>
                        <Text style={styles.statIcon}>⏳</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={['#a8edea', '#fed6e3']}
                        style={styles.statCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={[styles.statNumber, { color: '#27ae60' }]}>
                            {dashboardData.resolvedReports}
                        </Text>
                        <Text style={[styles.statLabel, { color: '#27ae60' }]}>Resolved</Text>
                        <Text style={styles.statIcon}>✅</Text>
                    </LinearGradient>
                </View>

                {/* Admin Actions */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Admin Actions</Text>
                    <View style={styles.actionsGrid}>
                        {adminActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => navigation.navigate(action.screen)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={action.gradient}
                                    style={styles.actionCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.actionIcon}>{action.icon}</Text>
                                    <Text style={styles.actionTitle}>{action.title}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Recent System Activity</Text>
                    <View style={styles.activityContainer}>
                        {dashboardData.recentActivity.length > 0 ? (
                            dashboardData.recentActivity.map((item, index) => (
                                <View key={index} style={styles.activityItem}>
                                    <View style={styles.activityIcon}>
                                        <Text style={{
                                            color: item.status === 'resolved' ? '#2ECC71' : '#FECA57',
                                            fontSize: 20,
                                            fontWeight: 'bold'
                                        }}>
                                            {item.status === 'resolved' ? '✓' : '⏳'}
                                        </Text>
                                    </View>
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityTitle}>
                                            {item.title || 'Municipal Issue'}
                                        </Text>
                                        <Text style={styles.activitySubtitle}>
                                            {item.category || 'General'} • {item.status || 'pending'}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noDataText}>No recent activity</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Admin;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f8',
    },
    loadingText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '600',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        position: 'relative',
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 1,
    },
    headerLeft: {
        flex: 1,
        alignItems: 'flex-start',
    },
    adminBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 25,
        width: 50,
        height: 50,
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
    adminBadgeText: {
        fontSize: 24,
    },
    welcomeText: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        marginBottom: 4,
    },
    userName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    roleText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    logoutButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    logoutButtonGradient: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    statCard: {
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        width: (width - 60) / 2,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    statNumber: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    statLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
        marginBottom: 8,
    },
    statIcon: {
        fontSize: 20,
        position: 'absolute',
        top: 15,
        right: 15,
        opacity: 0.7,
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: (width - 60) / 2,
        borderRadius: 18,
        padding: 22,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    actionTitle: {
        color: '#2d3748',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 20,
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    activityContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    activitySubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    noDataText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        paddingVertical: 20,
    },
});