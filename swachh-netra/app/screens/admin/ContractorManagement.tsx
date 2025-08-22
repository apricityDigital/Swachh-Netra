import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native"
import { Card, Text, Button, Chip, Searchbar, FAB } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { collection, getDocs, query, where, orderBy, updateDoc, doc } from "firebase/firestore"
import { FIRESTORE_DB } from "../../../FirebaseConfig"
import AdminSidebar from "../../components/AdminSidebar"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"

interface Contractor {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
  isActive: boolean
  createdAt: string
  assignedFeederPoints?: number
  assignedVehicles?: number
}

const ContractorManagement = ({ navigation }: any) => {
  const { hasAccess, userData } = useRequireAdmin(navigation)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({
    totalContractors: 0,
    activeContractors: 0,
    inactiveContractors: 0,
    totalAssignments: 0,
  })

  useEffect(() => {
    fetchContractors()
  }, [])

  const fetchContractors = async () => {
    try {
      setLoading(true)
      const contractorsQuery = query(
        collection(FIRESTORE_DB, "users"),
        where("role", "==", "transport_contractor"),
        orderBy("createdAt", "desc")
      )
      const contractorsSnapshot = await getDocs(contractorsQuery)
      const contractorsList = contractorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contractor[]

      setContractors(contractorsList)

      // Calculate stats
      const activeCount = contractorsList.filter(c => c.isActive).length
      setStats({
        totalContractors: contractorsList.length,
        activeContractors: activeCount,
        inactiveContractors: contractorsList.length - activeCount,
        totalAssignments: 0, // TODO: Calculate from assignments
      })
    } catch (error) {
      console.error("Error fetching contractors:", error)
      Alert.alert("Error", "Failed to fetch contractors")
    } finally {
      setLoading(false)
    }
  }

  const toggleContractorStatus = async (contractor: Contractor) => {
    try {
      await updateDoc(doc(FIRESTORE_DB, "users", contractor.id), {
        isActive: !contractor.isActive,
        updatedAt: new Date().toISOString()
      })
      Alert.alert("Success", `Contractor ${contractor.isActive ? 'deactivated' : 'activated'} successfully.`)
      fetchContractors()
    } catch (error) {
      console.error("Error updating contractor status:", error)
      Alert.alert("Error", "Failed to update contractor status")
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchContractors()
    setRefreshing(false)
  }

  const filteredContractors = contractors.filter(contractor => {
    const searchLower = searchQuery.toLowerCase()
    return (contractor.fullName || '').toLowerCase().includes(searchLower) ||
      (contractor.email || '').toLowerCase().includes(searchLower)
  })

  const renderContractorCard = ({ item }: { item: Contractor }) => (
    <Card style={styles.contractorCard}>
      <View style={styles.contractorHeader}>
        <View style={styles.contractorInfo}>
          <Text style={styles.contractorName}>{item.fullName}</Text>
          <Text style={styles.contractorEmail}>{item.email}</Text>
          <Text style={styles.contractorPhone}>{item.phone}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.isActive ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={[
            styles.statusText,
            item.isActive ? styles.activeText : styles.inactiveText
          ]}>
            {item.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.contractorStats}>
        <View style={styles.statItem}>
          <MaterialIcons name="location-on" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.assignedFeederPoints || 0} Points</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.assignedVehicles || 0} Vehicles</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="schedule" size={16} color="#6b7280" />
          <Text style={styles.statText}>
            Joined {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.contractorActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => Alert.alert("Coming Soon", "Contractor details view will be implemented")}
        >
          <MaterialIcons name="visibility" size={20} color="#3b82f6" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.statusButton,
            item.isActive ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={() => toggleContractorStatus(item)}
        >
          <MaterialIcons
            name={item.isActive ? 'block' : 'check-circle'}
            size={20}
            color="#fff"
          />
          <Text style={styles.statusButtonText}>
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="business" size={48} color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Contractors...</Text>
      </View>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin" navigation={navigation}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => setSidebarVisible(true)}
              style={styles.menuButton}
            >
              <MaterialIcons name="menu" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contractor Management</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <MaterialIcons name="refresh" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialIcons name="business" size={24} color="#3b82f6" />
                <Text style={styles.statNumber}>{stats.totalContractors}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialIcons name="check-circle" size={24} color="#10b981" />
                <Text style={styles.statNumber}>{stats.activeContractors}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <MaterialIcons name="block" size={24} color="#ef4444" />
                <Text style={styles.statNumber}>{stats.inactiveContractors}</Text>
                <Text style={styles.statLabel}>Inactive</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search contractors..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

        {/* Contractors List */}
        <FlatList
          data={filteredContractors}
          renderItem={renderContractorCard}
          keyExtractor={(item) => item.id}
          style={styles.contractorsList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <MaterialIcons name="business" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No contractors found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? "Try adjusting your search" : "No contractors registered yet"}
                </Text>
              </View>
            </Card>
          }
        />

        {/* Admin Sidebar */}
        <AdminSidebar
          navigation={navigation}
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentScreen="ContractorManagement"
        />
      </SafeAreaView>
    </ProtectedRoute>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingTop: Platform.OS === "ios" ? 0 : 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statContent: {
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchbar: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  contractorsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contractorCard: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  contractorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  contractorInfo: {
    flex: 1,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  contractorEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  contractorPhone: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: "#dcfce7",
  },
  inactiveBadge: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activeText: {
    color: "#166534",
  },
  inactiveText: {
    color: "#dc2626",
  },
  contractorStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  contractorActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  viewButtonText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
    marginLeft: 4,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activateButton: {
    backgroundColor: "#10b981",
  },
  deactivateButton: {
    backgroundColor: "#ef4444",
  },
  statusButtonText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyCard: {
    marginTop: 40,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyContent: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
})

export default ContractorManagement
