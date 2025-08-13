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
    StatusBar
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../FirebaseConfig';

const { width } = Dimensions.get('window');

const Home = ({ navigation }: { navigation: any }) => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState({
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
                    setUserRole(userData.role);
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
                const reportsRef = collection(FIRESTORE_DB, 'reports');

                let reportsQuery;
                if (userRole === 'citizen') {
                    reportsQuery = query(reportsRef, where('userId', '==', user.uid));
                } else {
                    reportsQuery = query(reportsRef, orderBy('createdAt', 'desc'), limit(50));
                }

                const reportsSnapshot = await getDocs(reportsQuery);
                const reports = reportsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as any[];

                setDashboardData({
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

    const getQuickActions = () => {
        switch (userRole) {
            case 'admin':
                return [
                    { title: 'User Management', icon: '👥', screen: 'UserManagement', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF8E8E'] },
                    { title: 'All Reports', icon: '📋', screen: 'AllReports', color: '#4ECDC4', gradient: ['#4ECDC4', '#6ED5D0'] },
                    { title: 'Analytics', icon: '📊', screen: 'Analytics', color: '#45B7D1', gradient: ['#45B7D1', '#6BC5D9'] },
                    { title: 'System Settings', icon: '⚙️', screen: 'Settings', color: '#96CEB4', gradient: ['#96CEB4', '#A8D5C1'] }
                ];
            case 'municipal_officer':
                return [
                    { title: 'Pending Reports', icon: '⏳', screen: 'PendingReports', color: '#FECA57', gradient: ['#FECA57', '#FED670'] },
                    { title: 'Assign Tasks', icon: '👤', screen: 'AssignTasks', color: '#FF9FF3', gradient: ['#FF9FF3', '#FFB3F6'] },
                    { title: 'Generate Report', icon: '📈', screen: 'GenerateReport', color: '#54A0FF', gradient: ['#54A0FF', '#74B0FF'] },
                    { title: 'Field Work', icon: '📍', screen: 'FieldWork', color: '#5F27CD', gradient: ['#5F27CD', '#7B4EE0'] }
                ];
            case 'citizen':
            default:
                return [
                    { title: 'Report Issue', icon: '⚠️', screen: 'ReportIssue', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF8E8E'] },
                    { title: 'My Reports', icon: '📝', screen: 'MyReports', color: '#4ECDC4', gradient: ['#4ECDC4', '#6ED5D0'] },
                    { title: 'Track Status', icon: '🔍', screen: 'TrackStatus', color: '#45B7D1', gradient: ['#45B7D1', '#6BC5D9'] },
                    { title: 'Emergency', icon: '🚨', screen: 'Emergency', color: '#FD79A8', gradient: ['#FD79A8', '#FE93B8'] }
                ];
        }
    };

    const getRoleTitle = () => {
        switch (userRole) {
            case 'admin': return 'Administrator Dashboard';
            case 'municipal_officer': return 'Municipal Officer Dashboard';
            case 'citizen': return 'Citizen Dashboard';
            default: return 'Municipal Monitoring';
        }
    };

    const getCurrentTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingSpinner}>
                    <Text style={styles.loadingEmoji}>🏛️</Text>
                    <Text style={styles.loadingText}>Loading Dashboard...</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Enhanced Header with Gradient Effect */}
                <View style={styles.headerGradient}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.greetingText}>{getCurrentTimeGreeting()},</Text>
                            <Text style={styles.userName}>{userName}</Text>
                            <View style={styles.roleContainer}>
                                <Text style={styles.roleIcon}>
                                    {userRole === 'admin' ? '👑' : userRole === 'municipal_officer' ? '🏢' : '👤'}
                                </Text>
                                <Text style={styles.roleText}>{getRoleTitle()}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>

                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Enhanced Statistics Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, styles.totalCard]}>
                        <Text style={styles.statIcon}>📊</Text>
                        <Text style={styles.statNumber}>{dashboardData.totalReports}</Text>
                        <Text style={styles.statLabel}>Total Reports</Text>
                    </View>
                    <View style={[styles.statCard, styles.pendingCard]}>
                        <Text style={styles.statIcon}>⏳</Text>
                        <Text style={[styles.statNumber, { color: '#FECA57' }]}>
                            {dashboardData.pendingReports}
                        </Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={[styles.statCard, styles.resolvedCard]}>
                        <Text style={styles.statIcon}>✅</Text>
                        <Text style={[styles.statNumber, { color: '#2ECC71' }]}>
                            {dashboardData.resolvedReports}
                        </Text>
                        <Text style={styles.statLabel}>Resolved</Text>
                    </View>
                </View>

                {/* Enhanced Quick Actions */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>
                        <Text style={styles.sectionSubtitle}>⚡ Tap to access services</Text>
                    </View>
                    <View style={styles.actionsGrid}>
                        {getQuickActions().map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.actionCard, { backgroundColor: action.color }]}
                                onPress={() => navigation.navigate(action.screen)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.actionIconContainer}>
                                    <Text style={styles.actionIcon}>{action.icon}</Text>
                                </View>
                                <Text style={styles.actionTitle}>{action.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Enhanced Recent Activity */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <Text style={styles.sectionSubtitle}>📈 Latest updates</Text>
                    </View>
                    <View style={styles.activityContainer}>
                        {dashboardData.recentActivity.length > 0 ? (
                            dashboardData.recentActivity.map((item, index) => (
                                <TouchableOpacity key={index} style={styles.activityItem} activeOpacity={0.7}>
                                    <View style={[
                                        styles.activityIcon,
                                        { backgroundColor: item.status === 'resolved' ? '#E8F5E8' : '#FFF3E0' }
                                    ]}>
                                        <Text style={{
                                            color: item.status === 'resolved' ? '#2ECC71' : '#FECA57',
                                            fontSize: 20,
                                            fontWeight: 'bold'
                                        }}>
                                            {item.status === 'resolved' ? '✅' : '⏳'}
                                        </Text>
                                    </View>
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityTitle}>
                                            {item.title || 'Municipal Issue'}
                                        </Text>
                                        <Text style={styles.activitySubtitle}>
                                            {item.category || 'General'} • {item.status || 'pending'}
                                        </Text>
                                        <Text style={styles.activityTime}>
                                            {new Date().toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={styles.activityArrow}>›</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.noDataContainer}>
                                <Text style={styles.noDataEmoji}>📭</Text>
                                <Text style={styles.noDataText}>No recent activity</Text>
                                <Text style={styles.noDataSubtext}>Your activities will appear here</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Enhanced Municipal Services Banner */}
                <TouchableOpacity style={styles.servicesBanner} activeOpacity={0.8}>
                    <View style={styles.bannerIconContainer}>
                        <Text style={styles.bannerIcon}>🏛️</Text>
                    </View>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Municipal Services</Text>
                        <Text style={styles.bannerSubtitle}>
                            Access all government services in one place
                        </Text>
                    </View>
                    <View style={styles.bannerArrowContainer}>
                        <Text style={styles.bannerArrow}>→</Text>
                    </View>
                </TouchableOpacity>

                {/* Footer spacing */}
                <View style={styles.footerSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingSpinner: {
        alignItems: 'center',
    },
    loadingEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '600',
    },
    headerGradient: {
        backgroundColor: '#007AFF',
        paddingTop: 10,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    headerLeft: {
        flex: 1,
    },
    greetingText: {
        fontSize: 16,
        color: '#ffffff90',
        fontWeight: '500',
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#ffffff20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        alignSelf: 'flex-start',
    },
    roleIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    roleText: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: '600',
    },
    logoutButton: {
        alignItems: 'center',
        backgroundColor: '#d10b0bf3',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginTop: 20,

    },
    logoutIcon: {
        fontSize: 18,
        marginBottom: 2,
    },
    logoutText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 25,
        justifyContent: 'space-between',
        marginTop: -15,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    totalCard: {
        borderTopWidth: 4,
        borderTopColor: '#007AFF',
    },
    pendingCard: {
        borderTopWidth: 4,
        borderTopColor: '#FECA57',
    },
    resolvedCard: {
        borderTopWidth: 4,
        borderTopColor: '#2ECC71',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        fontWeight: '500',
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 25,
    },
    sectionHeader: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: (width - 60) / 2,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        transform: [{ scale: 1 }],
    },
    actionIconContainer: {
        backgroundColor: '#ffffff30',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionIcon: {
        fontSize: 24,
    },
    actionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 20,
    },
    activityContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    activityIcon: {
        marginRight: 15,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    activitySubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        color: '#999',
    },
    activityArrow: {
        fontSize: 20,
        color: '#ccc',
        fontWeight: 'bold',
    },
    noDataContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noDataEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    noDataText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    noDataSubtext: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
    },
    servicesBanner: {
        backgroundColor: '#007AFF',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    bannerIconContainer: {
        backgroundColor: '#ffffff20',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    bannerIcon: {
        fontSize: 20,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: '#ffffff90',
        lineHeight: 18,
    },
    bannerArrowContainer: {
        backgroundColor: '#ffffff20',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerArrow: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerSpacing: {
        height: 20,
    },
});
