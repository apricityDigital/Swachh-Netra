import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Dimensions,
    StatusBar,
    Platform
} from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../FirebaseConfig';

const { width, height } = Dimensions.get('window');

interface DriverRequest {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    requestedAt: string;
    status: string;
    approver: string;
    approverType: string;
}

interface Driver {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    isActive: boolean;
    createdAt: string;
    contractorId: string;
}

const DriverApprovals = ({ navigation }: any) => {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [driverRequests, setDriverRequests] = useState<DriverRequest[]>([]);
    const [myDrivers, setMyDrivers] = useState<Driver[]>([]);
    const [selectedTab, setSelectedTab] = useState('requests');
    const [contractorId, setContractorId] = useState('');

    useEffect(() => {
        getCurrentContractorId();
    }, []);

    useEffect(() => {
        if (contractorId) {
            fetchData();
        }
    }, [contractorId]);

    const getCurrentContractorId = async () => {
        try {
            const user = FIREBASE_AUTH.currentUser;
            if (user) {
                setContractorId(user.uid);
            }
        } catch (error) {
            console.error('Error getting contractor ID:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchDriverRequests(),
                fetchMyDrivers()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchDriverRequests = async () => {
        try {
            const requestsQuery = query(
                collection(FIRESTORE_DB, 'approvalRequests'),
                where('status', '==', 'pending'),
                where('role', '==', 'driver'),
                where('approver', '==', contractorId),
                orderBy('requestedAt', 'desc')
            );
            const requestsSnapshot = await getDocs(requestsQuery);
            const requestsList = requestsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as DriverRequest[];

            setDriverRequests(requestsList);
        } catch (error) {
            console.error('Error fetching driver requests:', error);
        }
    };

    const fetchMyDrivers = async () => {
        try {
            const driversQuery = query(
                collection(FIRESTORE_DB, 'users'),
                where('role', '==', 'driver'),
                where('contractorId', '==', contractorId),
                orderBy('createdAt', 'desc')
            );
            const driversSnapshot = await getDocs(driversQuery);
            const driversList = driversSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Driver[];

            setMyDrivers(driversList);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };

    const handleApproveRequest = async (request: DriverRequest) => {
        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(
                FIREBASE_AUTH,
                request.email,
                request.password
            );

            const user = userCredential.user;

            // Store user data with contractor assignment
            await setDoc(doc(FIRESTORE_DB, 'users', user.uid), {
                uid: user.uid,
                fullName: request.fullName,
                email: request.email,
                phone: request.phone,
                role: request.role,
                contractorId: contractorId,
                createdAt: new Date().toISOString(),
                isActive: true,
                approvedAt: new Date().toISOString(),
                approvedBy: contractorId
            });

            // Update approval request status
            await updateDoc(doc(FIRESTORE_DB, 'approvalRequests', request.id), {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                approvedBy: contractorId
            });

            Alert.alert('Success', `${request.fullName} has been approved as your driver.`);
            fetchData();
        } catch (error) {
            console.error('Error approving request:', error);
            Alert.alert('Error', 'Failed to approve request');
        }
    };

    const handleRejectRequest = async (request: DriverRequest) => {
        Alert.alert(
            'Reject Request',
            `Are you sure you want to reject ${request.fullName}'s driver application?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await updateDoc(doc(FIRESTORE_DB, 'approvalRequests', request.id), {
                                status: 'rejected',
                                rejectedAt: new Date().toISOString(),
                                rejectedBy: contractorId
                            });
                            Alert.alert('Success', 'Driver request has been rejected.');
                            fetchData();
                        } catch (error) {
                            console.error('Error rejecting request:', error);
                            Alert.alert('Error', 'Failed to reject request');
                        }
                    }
                }
            ]
        );
    };

    const toggleDriverStatus = async (driver: Driver) => {
        try {
            await updateDoc(doc(FIRESTORE_DB, 'users', driver.id), {
                isActive: !driver.isActive,
                updatedAt: new Date().toISOString()
            });
            Alert.alert('Success', `Driver ${driver.isActive ? 'deactivated' : 'activated'} successfully.`);
            fetchMyDrivers();
        } catch (error) {
            console.error('Error updating driver status:', error);
            Alert.alert('Error', 'Failed to update driver status');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const renderRequestsTab = () => (
        <View style={styles.tabContent}>
            {driverRequests.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="check-circle-outline" size={64} color="#10b981" />
                        <Text style={styles.emptyTitle}>No Pending Requests</Text>
                        <Text style={styles.emptySubtitle}>All driver applications have been processed.</Text>
                    </View>
                </Card>
            ) : (
                driverRequests.map((request) => (
                    <Card key={request.id} style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                            <View style={styles.requestInfo}>
                                <Text style={styles.requestName}>{request.fullName}</Text>
                                <Text style={styles.requestRole}>Driver Application</Text>
                            </View>
                            <View style={styles.requestBadge}>
                                <Text style={styles.requestBadgeText}>PENDING</Text>
                            </View>
                        </View>
                        
                        <View style={styles.requestDetails}>
                            <View style={styles.requestDetailRow}>
                                <MaterialIcons name="email" size={16} color="#6b7280" />
                                <Text style={styles.requestDetailText}>{request.email}</Text>
                            </View>
                            <View style={styles.requestDetailRow}>
                                <MaterialIcons name="phone" size={16} color="#6b7280" />
                                <Text style={styles.requestDetailText}>{request.phone}</Text>
                            </View>
                            <View style={styles.requestDetailRow}>
                                <MaterialIcons name="schedule" size={16} color="#6b7280" />
                                <Text style={styles.requestDetailText}>
                                    Applied {new Date(request.requestedAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.requestActions}>
                            <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => handleRejectRequest(request)}
                            >
                                <MaterialIcons name="close" size={20} color="#fff" />
                                <Text style={styles.rejectButtonText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.approveButton}
                                onPress={() => handleApproveRequest(request)}
                            >
                                <MaterialIcons name="check" size={20} color="#fff" />
                                <Text style={styles.approveButtonText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                ))
            )}
        </View>
    );

    const renderDriversTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.statsContainer}>
                <Card style={styles.statCard}>
                    <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.statGradient}>
                        <MaterialIcons name="people" size={32} color="#fff" />
                        <Text style={styles.statNumber}>{myDrivers.length}</Text>
                        <Text style={styles.statLabel}>Total Drivers</Text>
                    </LinearGradient>
                </Card>
                <Card style={styles.statCard}>
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.statGradient}>
                        <MaterialIcons name="check-circle" size={32} color="#fff" />
                        <Text style={styles.statNumber}>{myDrivers.filter(d => d.isActive).length}</Text>
                        <Text style={styles.statLabel}>Active Drivers</Text>
                    </LinearGradient>
                </Card>
            </View>

            {myDrivers.map((driver) => (
                <Card key={driver.id} style={styles.driverCard}>
                    <View style={styles.driverHeader}>
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>{driver.fullName}</Text>
                            <Text style={styles.driverEmail}>{driver.email}</Text>
                        </View>
                        <View style={[
                            styles.driverStatusBadge,
                            driver.isActive ? styles.activeBadge : styles.inactiveBadge
                        ]}>
                            <Text style={[
                                styles.driverStatusText,
                                driver.isActive ? styles.activeText : styles.inactiveText
                            ]}>
                                {driver.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.driverDetails}>
                        <View style={styles.driverDetailRow}>
                            <MaterialIcons name="phone" size={16} color="#6b7280" />
                            <Text style={styles.driverDetailText}>{driver.phone}</Text>
                        </View>
                        <View style={styles.driverDetailRow}>
                            <MaterialIcons name="schedule" size={16} color="#6b7280" />
                            <Text style={styles.driverDetailText}>
                                Joined {new Date(driver.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.driverActions}>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                driver.isActive ? styles.deactivateButton : styles.activateButton
                            ]}
                            onPress={() => toggleDriverStatus(driver)}
                        >
                            <MaterialIcons 
                                name={driver.isActive ? 'block' : 'check-circle'} 
                                size={20} 
                                color="#fff" 
                            />
                            <Text style={styles.statusButtonText}>
                                {driver.isActive ? 'Deactivate' : 'Activate'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Card>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#f59e0b" />
            
            {/* Header */}
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Driver Management</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                    <MaterialIcons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'requests' && styles.activeTab]}
                    onPress={() => setSelectedTab('requests')}
                >
                    <Text style={[styles.tabText, selectedTab === 'requests' && styles.activeTabText]}>
                        Requests ({driverRequests.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'drivers' && styles.activeTab]}
                    onPress={() => setSelectedTab('drivers')}
                >
                    <Text style={[styles.tabText, selectedTab === 'drivers' && styles.activeTabText]}>
                        My Drivers ({myDrivers.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {selectedTab === 'requests' && renderRequestsTab()}
                {selectedTab === 'drivers' && renderDriversTab()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    refreshButton: {
        padding: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#f59e0b',
    },
    tabText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#f59e0b',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        padding: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statGradient: {
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#fff',
        marginTop: 4,
        textAlign: 'center',
    },
    emptyCard: {
        padding: 40,
        alignItems: 'center',
        borderRadius: 12,
    },
    emptyContainer: {
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
    },
    requestCard: {
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    requestInfo: {
        flex: 1,
    },
    requestName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    requestRole: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    requestBadge: {
        backgroundColor: '#fbbf24',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    requestBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#92400e',
    },
    requestDetails: {
        marginBottom: 16,
    },
    requestDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requestDetailText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8,
    },
    requestActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ef4444',
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 8,
    },
    rejectButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    approveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 12,
        borderRadius: 8,
        marginLeft: 8,
    },
    approveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    driverCard: {
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
    },
    driverHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    driverEmail: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    driverStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    activeBadge: {
        backgroundColor: '#d1fae5',
    },
    inactiveBadge: {
        backgroundColor: '#fee2e2',
    },
    driverStatusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeText: {
        color: '#065f46',
    },
    inactiveText: {
        color: '#991b1b',
    },
    driverDetails: {
        marginBottom: 16,
    },
    driverDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    driverDetailText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8,
    },
    driverActions: {
        flexDirection: 'row',
    },
    statusButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    activateButton: {
        backgroundColor: '#10b981',
    },
    deactivateButton: {
        backgroundColor: '#ef4444',
    },
    statusButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 4,
    },
});

export default DriverApprovals;
