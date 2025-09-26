import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
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
    deleteDoc,
    addDoc,
    setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../../FirebaseConfig';
import { ApprovalService } from '../../../services/ApprovalService';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useRequireAdmin } from '../../hooks/useRequireAuth';

const { width, height } = Dimensions.get('window');

interface User {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

interface ApprovalRequest {
    id?: string;
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

const UserManagement = ({ navigation }: any) => {
    const { hasAccess, userData } = useRequireAdmin(navigation);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
    const [selectedTab, setSelectedTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState('');
    const [showUserDetailModal, setShowUserDetailModal] = useState(false);
    const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
    const [userStats, setUserStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        drivers: 0,
        contractors: 0,
        swachhHR: 0,
        admins: 0,
        pendingApprovals: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersList = await fetchUsers();
            const requestsList = await fetchApprovalRequests();

            const stats = {
                totalUsers: usersList.length,
                activeUsers: usersList.filter(u => u.isActive).length,
                drivers: usersList.filter(u => u.role === 'driver').length,
                contractors: usersList.filter(u => u.role === 'transport_contractor').length,
                swachhHR: usersList.filter(u => u.role === 'swachh_hr').length,
                admins: usersList.filter(u => u.role === 'admin').length,
                pendingApprovals: requestsList.length
            };

            setUsers(usersList);
            setApprovalRequests(requestsList);
            setUserStats(stats);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async (): Promise<User[]> => {
        try {
            const usersQuery = query(
                collection(FIRESTORE_DB, 'users'),
                orderBy('createdAt', 'desc')
            );
            const usersSnapshot = await getDocs(usersQuery);
            return usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    };

    const fetchApprovalRequests = async (): Promise<ApprovalRequest[]> => {
        try {
            return await ApprovalService.getAdminApprovalRequests();
        } catch (error) {
            console.error('Error fetching approval requests:', error);
            return [];
        }
    };

    const handleApproveRequest = async (request: ApprovalRequest) => {
        try {
            const currentUser = FIREBASE_AUTH.currentUser;
            if (!currentUser) {
                Alert.alert('Error', 'You must be logged in to approve requests');
                return;
            }

            await ApprovalService.approveRequest(request.id!, currentUser.uid);
            Alert.alert('Success', `${request.fullName}'s account has been approved and created.`);
            fetchData();
        } catch (error) {
            console.error('Error approving request:', error);
            Alert.alert('Error', 'Failed to approve request');
        }
    };

    const handleRejectRequest = async (request: ApprovalRequest) => {
        Alert.alert(
            'Reject Request',
            `Are you sure you want to reject ${request.fullName}'s registration request?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const currentUser = FIREBASE_AUTH.currentUser;
                            if (!currentUser) {
                                Alert.alert('Error', 'You must be logged in to reject requests');
                                return;
                            }

                            await ApprovalService.rejectRequest(request.id!, currentUser.uid);
                            Alert.alert('Success', 'Request has been rejected.');
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

    const toggleUserStatus = async (user: User) => {
        try {
            await updateDoc(doc(FIRESTORE_DB, 'users', user.id), {
                isActive: !user.isActive,
                updatedAt: new Date().toISOString()
            });
            Alert.alert('Success', `User ${user.isActive ? 'deactivated' : 'activated'} successfully.`);
            fetchUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
            Alert.alert('Error', 'Failed to update user status');
        }
    };

    const openRoleModal = (user: User) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setShowRoleModal(true);
    };

    const openUserDetailModal = (user: User) => {
        setSelectedUserDetail(user);
        setShowUserDetailModal(true);
    };

    const deleteUser = async (user: User) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to permanently delete ${user.fullName}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(FIRESTORE_DB, 'users', user.id));
                            Alert.alert('Success', 'User deleted successfully');
                            fetchUsers();
                        } catch (error) {
                            console.error('Error deleting user:', error);
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    }
                }
            ]
        );
    };

    const updateUserRole = async () => {
        if (!selectedUser || !newRole) return;

        try {
            await updateDoc(doc(FIRESTORE_DB, 'users', selectedUser.id), {
                role: newRole,
                updatedAt: new Date().toISOString()
            });
            Alert.alert('Success', 'User role updated successfully.');
            setShowRoleModal(false);
            setSelectedUser(null);
            setNewRole('');
            fetchUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            Alert.alert('Error', 'Failed to update user role');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const renderOverviewTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.statsGrid}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedTab('users'); setRoleFilter('all'); setStatusFilter('all'); }}
                >
                    <Card style={styles.statCard}>
                        <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.statGradient}>
                            <MaterialIcons name="people" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{userStats.totalUsers}</Text>
                            <Text style={styles.statLabel}>Total Users</Text>
                        </LinearGradient>
                    </Card>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedTab('users'); setStatusFilter('active'); }}
                >
                    <Card style={styles.statCard}>
                        <LinearGradient colors={['#10b981', '#059669']} style={styles.statGradient}>
                            <MaterialIcons name="check-circle" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{userStats.activeUsers}</Text>
                            <Text style={styles.statLabel}>Active Users</Text>
                        </LinearGradient>
                    </Card>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedTab('users'); setRoleFilter('driver'); }}
                >
                    <Card style={styles.statCard}>
                        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statGradient}>
                            <MaterialIcons name="local-shipping" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{userStats.drivers}</Text>
                            <Text style={styles.statLabel}>Drivers</Text>
                        </LinearGradient>
                    </Card>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedTab('users'); setRoleFilter('transport_contractor'); }}
                >
                    <Card style={styles.statCard}>
                        <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.statGradient}>
                            <MaterialIcons name="engineering" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{userStats.contractors}</Text>
                            <Text style={styles.statLabel}>Contractors</Text>
                        </LinearGradient>
                    </Card>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedTab('approvals'); }}
                >
                    <Card style={styles.statCard}>
                        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.statGradient}>
                            <MaterialIcons name="pending-actions" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{userStats.pendingApprovals}</Text>
                            <Text style={styles.statLabel}>Pending Approvals</Text>
                        </LinearGradient>
                    </Card>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setSelectedTab('users'); setRoleFilter('admin'); }}
                >
                    <Card style={styles.statCard}>
                        <LinearGradient colors={['#06b6d4', '#0891b2']} style={styles.statGradient}>
                            <MaterialIcons name="admin-panel-settings" size={32} color="#fff" />
                            <Text style={styles.statNumber}>{userStats.admins}</Text>
                            <Text style={styles.statLabel}>Administrators</Text>
                        </LinearGradient>
                    </Card>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderApprovalsTab = () => (
        <View style={styles.tabContent}>
            {approvalRequests.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="check-circle-outline" size={64} color="#10b981" />
                        <Text style={styles.emptyTitle}>No Pending Approvals</Text>
                        <Text style={styles.emptySubtitle}>All registration requests have been processed.</Text>
                    </View>
                </Card>
            ) : (
                approvalRequests.map((request) => (
                    <Card key={request.id} style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                            <View style={styles.requestInfo}>
                                <Text style={styles.requestName}>{request.fullName}</Text>
                                <Text style={styles.requestRole}>
                                    {request.role === 'transport_contractor' ? 'Transport Contractor' :
                                        request.role === 'swachh_hr' ? 'Swachh HR' : request.role}
                                </Text>
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
                                    {new Date(request.requestedAt).toLocaleDateString()}
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

    const filteredUsers = users.filter(user => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = (user.fullName || '').toLowerCase().includes(searchLower) ||
            (user.email || '').toLowerCase().includes(searchLower) ||
            (user.phone || '').toLowerCase().includes(searchLower);
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && user.isActive) ||
            (statusFilter === 'inactive' && !user.isActive);
        return matchesSearch && matchesRole && matchesStatus;
    });

    const renderUsersTab = () => (
        <View style={styles.tabContent}>
            {/* Search and Filters */}
            <View style={styles.filtersContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <View style={styles.filterRow}>
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Role:</Text>
                        <View style={styles.filterButtons}>
                            {['all', 'admin', 'transport_contractor', 'swachh_hr', 'driver'].map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={[
                                        styles.filterButton,
                                        roleFilter === role && styles.activeFilterButton
                                    ]}
                                    onPress={() => setRoleFilter(role)}
                                >
                                    <Text style={[
                                        styles.filterButtonText,
                                        roleFilter === role && styles.activeFilterButtonText
                                    ]}>
                                        {role === 'all' ? 'All' :
                                            role === 'transport_contractor' ? 'Contractor' :
                                                role === 'swachh_hr' ? 'HR' :
                                                    role.charAt(0).toUpperCase() + role.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Status:</Text>
                        <View style={styles.filterButtons}>
                            {['all', 'active', 'inactive'].map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.filterButton,
                                        statusFilter === status && styles.activeFilterButton
                                    ]}
                                    onPress={() => setStatusFilter(status)}
                                >
                                    <Text style={[
                                        styles.filterButtonText,
                                        statusFilter === status && styles.activeFilterButtonText
                                    ]}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Users List */}
            {filteredUsers.map((user) => (
                <TouchableOpacity
                    key={user.id}
                    onPress={() => openUserDetailModal(user)}
                    activeOpacity={0.7}
                >
                    <Card style={styles.userCard}>
                        <View style={styles.userHeader}>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.fullName}</Text>
                                <Text style={styles.userRole}>
                                    {user.role === 'transport_contractor' ? 'Transport Contractor' :
                                        user.role === 'swachh_hr' ? 'Swachh HR' :
                                            user.role === 'admin' ? 'Administrator' : user.role}
                                </Text>
                            </View>
                            <View style={[
                                styles.userStatusBadge,
                                user.isActive ? styles.activeBadge : styles.inactiveBadge
                            ]}>
                                <Text style={[
                                    styles.userStatusText,
                                    user.isActive ? styles.activeText : styles.inactiveText
                                ]}>
                                    {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.userDetails}>
                            <View style={styles.userDetailRow}>
                                <MaterialIcons name="email" size={16} color="#6b7280" />
                                <Text style={styles.userDetailText}>{user.email}</Text>
                            </View>
                            <View style={styles.userDetailRow}>
                                <MaterialIcons name="phone" size={16} color="#6b7280" />
                                <Text style={styles.userDetailText}>{user.phone}</Text>
                            </View>
                            <View style={styles.userDetailRow}>
                                <MaterialIcons name="schedule" size={16} color="#6b7280" />
                                <Text style={styles.userDetailText}>
                                    Joined {new Date(user.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.userActions}>
                            <TouchableOpacity
                                style={styles.roleButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    openRoleModal(user);
                                }}
                            >
                                <MaterialIcons name="edit" size={20} color="#3b82f6" />
                                <Text style={styles.roleButtonText}>Change Role</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    user.isActive ? styles.deactivateButton : styles.activateButton
                                ]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    toggleUserStatus(user);
                                }}
                            >
                                <MaterialIcons
                                    name={user.isActive ? 'block' : 'check-circle'}
                                    size={20}
                                    color="#fff"
                                />
                                <Text style={styles.statusButtonText}>
                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    deleteUser(user);
                                }}
                            >
                                <MaterialIcons name="delete" size={20} color="#ef4444" />
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <ProtectedRoute requiredRole="admin" navigation={navigation}>
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>User Management</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                        <MaterialIcons name="refresh" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
                        onPress={() => setSelectedTab('overview')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
                            Overview
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'approvals' && styles.activeTab]}
                        onPress={() => setSelectedTab('approvals')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'approvals' && styles.activeTabText]}>
                            Approvals ({userStats.pendingApprovals})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'users' && styles.activeTab]}
                        onPress={() => setSelectedTab('users')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'users' && styles.activeTabText]}>
                            All Users
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {selectedTab === 'overview' && renderOverviewTab()}
                    {selectedTab === 'approvals' && renderApprovalsTab()}
                    {selectedTab === 'users' && renderUsersTab()}
                </ScrollView>

                {/* Role Change Modal */}
                <Modal
                    visible={showRoleModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowRoleModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Change User Role</Text>
                            <Text style={styles.modalSubtitle}>
                                {selectedUser?.fullName} ({selectedUser?.email})
                            </Text>

                            <View style={styles.roleOptions}>
                                {['admin', 'transport_contractor', 'swachh_hr', 'driver'].map((role) => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[
                                            styles.roleOption,
                                            newRole === role && styles.selectedRoleOption
                                        ]}
                                        onPress={() => setNewRole(role)}
                                    >
                                        <Text style={[
                                            styles.roleOptionText,
                                            newRole === role && styles.selectedRoleOptionText
                                        ]}>
                                            {role === 'transport_contractor' ? 'Transport Contractor' :
                                                role === 'swachh_hr' ? 'Swachh HR' :
                                                    role.charAt(0).toUpperCase() + role.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setShowRoleModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={updateUserRole}
                                >
                                    <Text style={styles.confirmButtonText}>Update Role</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* User Detail Modal */}
                <Modal
                    visible={showUserDetailModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowUserDetailModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.userDetailModalContent}>
                            <View style={styles.userDetailHeader}>
                                <Text style={styles.modalTitle}>User Details</Text>
                                <TouchableOpacity
                                    onPress={() => setShowUserDetailModal(false)}
                                    style={styles.closeButton}
                                >
                                    <MaterialIcons name="close" size={24} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            {selectedUserDetail && (
                                <ScrollView style={styles.userDetailContent}>
                                    <View style={styles.userDetailSection}>
                                        <Text style={styles.userDetailSectionTitle}>Personal Information</Text>
                                        <View style={styles.userDetailItem}>
                                            <Text style={styles.userDetailLabel}>Full Name</Text>
                                            <Text style={styles.userDetailValue}>{selectedUserDetail.fullName}</Text>
                                        </View>
                                        <View style={styles.userDetailItem}>
                                            <Text style={styles.userDetailLabel}>Email</Text>
                                            <Text style={styles.userDetailValue}>{selectedUserDetail.email}</Text>
                                        </View>
                                        <View style={styles.userDetailItem}>
                                            <Text style={styles.userDetailLabel}>Phone</Text>
                                            <Text style={styles.userDetailValue}>{selectedUserDetail.phone}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.userDetailSection}>
                                        <Text style={styles.userDetailSectionTitle}>Account Information</Text>
                                        <View style={styles.userDetailItem}>
                                            <Text style={styles.userDetailLabel}>Role</Text>
                                            <Text style={styles.userDetailValue}>
                                                {selectedUserDetail.role === 'transport_contractor' ? 'Transport Contractor' :
                                                    selectedUserDetail.role === 'swachh_hr' ? 'Swachh HR' :
                                                        selectedUserDetail.role === 'admin' ? 'Administrator' : selectedUserDetail.role}
                                            </Text>
                                        </View>
                                        <View style={styles.userDetailItem}>
                                            <Text style={styles.userDetailLabel}>Status</Text>
                                            <View style={[
                                                styles.userStatusBadge,
                                                selectedUserDetail.isActive ? styles.activeBadge : styles.inactiveBadge
                                            ]}>
                                                <Text style={[
                                                    styles.userStatusText,
                                                    selectedUserDetail.isActive ? styles.activeText : styles.inactiveText
                                                ]}>
                                                    {selectedUserDetail.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.userDetailItem}>
                                            <Text style={styles.userDetailLabel}>Joined Date</Text>
                                            <Text style={styles.userDetailValue}>
                                                {new Date(selectedUserDetail.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.userDetailActions}>
                                        <TouchableOpacity
                                            style={styles.roleButton}
                                            onPress={() => {
                                                setShowUserDetailModal(false);
                                                openRoleModal(selectedUserDetail);
                                            }}
                                        >
                                            <MaterialIcons name="edit" size={20} color="#3b82f6" />
                                            <Text style={styles.roleButtonText}>Change Role</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.statusButton,
                                                selectedUserDetail.isActive ? styles.deactivateButton : styles.activateButton
                                            ]}
                                            onPress={() => {
                                                setShowUserDetailModal(false);
                                                toggleUserStatus(selectedUserDetail);
                                            }}
                                        >
                                            <MaterialIcons
                                                name={selectedUserDetail.isActive ? 'block' : 'check-circle'}
                                                size={20}
                                                color="#fff"
                                            />
                                            <Text style={styles.statusButtonText}>
                                                {selectedUserDetail.isActive ? 'Deactivate' : 'Activate'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        </ProtectedRoute>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    refreshButton: {
        padding: 8,
        borderRadius: 8,
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
        borderBottomColor: '#3b82f6',
    },
    tabText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    tabContent: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        margin: 6,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statGradient: {
        padding: 15,
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
    // Empty state styles
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
    // Request card styles
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
    // User card styles
    userCard: {
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    userRole: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    userStatusBadge: {
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
    userStatusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeText: {
        color: '#065f46',
    },
    inactiveText: {
        color: '#991b1b',
    },
    userDetails: {
        marginBottom: 16,
    },
    userDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userDetailText: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 8,
    },
    userActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    roleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b82f6',
        flexBasis: '48%',
        marginTop: 8,
    },
    roleButtonText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '500',
        marginLeft: 4,
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        flexBasis: '48%',
        marginTop: 8,
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
    // Filter styles
    filtersContainer: {
        padding: 16,
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
        backgroundColor: '#ffffff',
    },
    filterRow: {
        gap: 12,
    },
    filterGroup: {
        marginBottom: 8,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    filterButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#ffffff',
    },
    activeFilterButton: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    filterButtonText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
    activeFilterButtonText: {
        color: '#ffffff',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        margin: 20,
        minWidth: width * 0.8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
    },
    roleOptions: {
        marginBottom: 24,
    },
    roleOption: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginBottom: 8,
    },
    selectedRoleOption: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    roleOptionText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    selectedRoleOptionText: {
        color: '#3b82f6',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginRight: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: '500',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#3b82f6',
        marginLeft: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
    },
    // Delete button styles
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#fef2f2',
        flexBasis: '48%',
        marginTop: 8,
    },
    deleteButtonText: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: '500',
        marginLeft: 4,
    },
    // User detail modal styles
    userDetailModalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        margin: 20,
        maxHeight: height * 0.8,
        width: width * 0.9,
    },
    userDetailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    closeButton: {
        padding: 4,
    },
    userDetailContent: {
        padding: 20,
    },
    userDetailSection: {
        marginBottom: 24,
    },
    userDetailSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    userDetailItem: {
        marginBottom: 16,
    },
    userDetailLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    userDetailValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '400',
    },
    userDetailActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
});

export default UserManagement;
