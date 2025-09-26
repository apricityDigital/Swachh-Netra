import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl,
} from "react-native"
import { Card, Text, Chip, Modal, Portal, Button, TextInput, Searchbar } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import AdminSidebar from "../../components/AdminSidebar"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"
import FirebaseService from "../../../services/FirebaseService"

// Systematic spacing scale for consistent layout
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
}

// SwachhHR User interface - only for swachh_hr role users
interface SwachhHRUser {
  uid: string
  fullName: string
  email: string
  phone?: string
  role: "swachh_hr"
  department?: string
  isActive: boolean
  createdAt?: string
  lastLogin?: string
}

// Form interface for user creation
interface CreateUserForm {
  fullName: string
  email: string
  phone: string
  password: string
  department: string
}

// Statistics interface
interface Statistics {
  totalStaff: number
  activeUsers: number
  inactiveUsers: number
  departments: number
  recentLogins: number
}

const SwachhHRManagement = ({ navigation }: { navigation: any }) => {
  useRequireAdmin(navigation)

  // Core state
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [users, setUsers] = useState<SwachhHRUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [operationLoading, setOperationLoading] = useState(false)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [filtersVisible, setFiltersVisible] = useState(false)

  // Modal state
  const [selectedUser, setSelectedUser] = useState<SwachhHRUser | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)

  // Bulk operations state
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  // Filter states
  const [filters, setFilters] = useState({
    status: "all" as "all" | "active" | "inactive",
    department: "all" as string,
    dateRange: "all" as "all" | "week" | "month" | "year",
    sortBy: "name" as "name" | "email" | "createdAt" | "lastLogin",
    sortOrder: "asc" as "asc" | "desc",
  })

  // Form states
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    isActive: true,
  })

  const [createForm, setCreateForm] = useState<CreateUserForm>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    department: "",
  })

  // Statistics state
  const [statistics, setStatistics] = useState<Statistics>({
    totalStaff: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    departments: 0,
    recentLogins: 0,
  })

  // Real-time data fetching from Firebase
  const fetchSwachhHRUsers = useCallback(async () => {
    setLoading(true)
    try {
      const allUsers = await FirebaseService.getAllUsers()

      // Filter for ONLY swachh_hr role users
      const swachhHRUsers: SwachhHRUser[] = allUsers
        .filter(user => user.role === "swachh_hr")
        .map(user => ({
          uid: user.uid,
          fullName: user.fullName,
          email: user.email,
          phone: user.phoneNumber || "",
          role: "swachh_hr" as const,
          department: "General", // Default since not in UserData interface
          isActive: user.isActive !== false,
          createdAt: user.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
          lastLogin: user.lastLogin?.toDate?.()?.toISOString?.() || "Never",
        }))

      setUsers(swachhHRUsers)

      // Calculate real-time statistics
      const departments = [...new Set(swachhHRUsers.map(u => u.department).filter(Boolean))]
      const activeUsers = swachhHRUsers.filter(u => u.isActive).length
      const inactiveUsers = swachhHRUsers.length - activeUsers
      const recentLogins = swachhHRUsers.filter(u => {
        if (!u.lastLogin || u.lastLogin === "Never") return false
        const loginDate = new Date(u.lastLogin)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return loginDate > weekAgo
      }).length

      setStatistics({
        totalStaff: swachhHRUsers.length,
        activeUsers,
        inactiveUsers,
        departments: departments.length,
        recentLogins,
      })
    } catch (error) {
      console.error("Error fetching Swachh-HR users:", error)
      Alert.alert("Error", "Failed to load Swachh-HR staff data. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchSwachhHRUsers()
  }, [fetchSwachhHRUsers])

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchSwachhHRUsers()
  }, [fetchSwachhHRUsers])

  // CREATE - User creation
  const handleCreateUser = async () => {
    if (operationLoading) return

    // Validate form
    if (!createForm.fullName || !createForm.email || !createForm.password) {
      Alert.alert("Validation Error", "Please fill in all required fields (Name, Email, Password)")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(createForm.email)) {
      Alert.alert("Validation Error", "Please enter a valid email address")
      return
    }

    // Password validation
    if (createForm.password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters long")
      return
    }

    setOperationLoading(true)
    try {
      // Create user with Firebase Auth and Firestore
      await FirebaseService.signUp(createForm.email, createForm.password, {
        fullName: createForm.fullName,
        phoneNumber: createForm.phone,
        role: "swachh_hr",
        isActive: true,
      })

      setCreateModalVisible(false)
      setCreateForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        department: "",
      })
      Alert.alert("Success", "Swachh-HR user created successfully!")

      // Refresh the user list
      await fetchSwachhHRUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      let errorMessage = "Failed to create user. Please try again."
      if (error instanceof Error) {
        if (error.message.includes("email-already-in-use")) {
          errorMessage = "This email address is already registered."
        } else if (error.message.includes("weak-password")) {
          errorMessage = "Password is too weak. Please choose a stronger password."
        } else if (error.message.includes("invalid-email")) {
          errorMessage = "Invalid email address format."
        }
      }
      Alert.alert("Error", errorMessage)
    } finally {
      setOperationLoading(false)
    }
  }

  // READ - User editing setup
  const handleEditUser = (user: SwachhHRUser) => {
    setSelectedUser(user)
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      department: user.department || "",
      isActive: user.isActive !== false,
    })
    setEditModalVisible(true)
  }

  // UPDATE - Save user changes
  const handleSaveUser = async () => {
    if (!selectedUser || operationLoading) return

    // Validate form
    if (!editForm.fullName || !editForm.email) {
      Alert.alert("Validation Error", "Name and Email are required fields")
      return
    }

    setOperationLoading(true)
    try {
      // Update user in Firebase
      await FirebaseService.updateUserData(selectedUser.uid, {
        fullName: editForm.fullName,
        phoneNumber: editForm.phone,
        isActive: editForm.isActive,
      })

      setEditModalVisible(false)
      setSelectedUser(null)
      Alert.alert("Success", "User information updated successfully!")

      // Refresh the user list
      await fetchSwachhHRUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      Alert.alert("Error", "Failed to update user information. Please try again.")
    } finally {
      setOperationLoading(false)
    }
  }

  // DELETE - User deletion setup
  const handleDeleteUser = (user: SwachhHRUser) => {
    setSelectedUser(user)
    setDeleteModalVisible(true)
  }

  // DELETE - Confirm user deletion (soft delete)
  const confirmDeleteUser = async () => {
    if (!selectedUser || operationLoading) return

    setOperationLoading(true)
    try {
      // Soft delete: deactivate user instead of permanent deletion
      await FirebaseService.updateUserData(selectedUser.uid, {
        isActive: false
      })

      setDeleteModalVisible(false)
      setSelectedUser(null)
      Alert.alert("Success", "User deactivated successfully")

      // Refresh the user list
      await fetchSwachhHRUsers()
    } catch (error) {
      console.error("Error deactivating user:", error)
      Alert.alert("Error", "Failed to deactivate user. Please try again.")
    } finally {
      setOperationLoading(false)
    }
  }

  // Toggle user status (activate/deactivate)
  const toggleUserStatus = async (user: SwachhHRUser) => {
    try {
      await FirebaseService.updateUserData(user.uid, {
        isActive: !user.isActive
      })

      Alert.alert(
        "Success",
        `User ${!user.isActive ? "activated" : "deactivated"} successfully`
      )

      // Refresh the user list
      await fetchSwachhHRUsers()
    } catch (error) {
      console.error("Error updating user status:", error)
      Alert.alert("Error", "Failed to update user status. Please try again.")
    }
  }

  // Bulk operations
  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const selectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map((user: SwachhHRUser) => user.uid)))
    }
  }

  const handleBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedUsers.size === 0) {
      Alert.alert("No Selection", "Please select users to perform bulk action")
      return
    }

    const actionText = action === "activate" ? "activate" : action === "deactivate" ? "deactivate" : "delete"

    Alert.alert(
      `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Are you sure you want to ${actionText} ${selectedUsers.size} selected user(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          onPress: () => executeBulkAction(action),
          style: action === "delete" ? "destructive" : "default"
        }
      ]
    )
  }

  const executeBulkAction = async (action: "activate" | "deactivate" | "delete") => {
    setOperationLoading(true)
    try {
      const promises = Array.from(selectedUsers).map(userId => {
        if (action === "activate") {
          return FirebaseService.updateUserData(userId, { isActive: true })
        } else if (action === "deactivate") {
          return FirebaseService.updateUserData(userId, { isActive: false })
        } else {
          // For delete, we'll deactivate (soft delete)
          return FirebaseService.updateUserData(userId, { isActive: false })
        }
      })

      await Promise.all(promises)

      setSelectedUsers(new Set())
      Alert.alert("Success", `Bulk ${action} completed successfully`)

      // Refresh the user list
      await fetchSwachhHRUsers()
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      Alert.alert("Error", `Failed to perform bulk ${action}. Please try again.`)
    } finally {
      setOperationLoading(false)
    }
  }



  // Advanced filtering and sorting logic
  const filteredUsers = users
    .filter(user => {
      // Text search filter
      const query = searchQuery.toLowerCase()
      const matchesSearch = !query || (
        (user.fullName || "").toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query) ||
        (user.department || "").toLowerCase().includes(query) ||
        (user.phone || "").includes(query)
      )

      // Status filter
      const matchesStatus = filters.status === "all" ||
        (filters.status === "active" && user.isActive) ||
        (filters.status === "inactive" && !user.isActive)

      // Department filter
      const matchesDepartment = filters.department === "all" ||
        (user.department || "General") === filters.department

      // Date range filter
      const matchesDateRange = (() => {
        if (filters.dateRange === "all") return true
        if (!user.createdAt) return false

        const userDate = new Date(user.createdAt)
        const now = new Date()
        const diffTime = now.getTime() - userDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        switch (filters.dateRange) {
          case "week": return diffDays <= 7
          case "month": return diffDays <= 30
          case "year": return diffDays <= 365
          default: return true
        }
      })()

      return matchesSearch && matchesStatus && matchesDepartment && matchesDateRange
    })
    .sort((a, b) => {
      let aValue: string | number = ""
      let bValue: string | number = ""

      switch (filters.sortBy) {
        case "name":
          aValue = a.fullName || ""
          bValue = b.fullName || ""
          break
        case "email":
          aValue = a.email || ""
          bValue = b.email || ""
          break
        case "createdAt":
          aValue = a.createdAt || ""
          bValue = b.createdAt || ""
          break
        case "lastLogin":
          aValue = a.lastLogin || ""
          bValue = b.lastLogin || ""
          break
      }

      if (filters.sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  // User card rendering
  const renderUserCard = ({ item }: { item: SwachhHRUser }) => (
    <TouchableOpacity
      onPress={() => handleEditUser(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.userCard}>
        <View style={styles.userContent}>
          <View style={styles.userHeader}>
            {bulkMode && (
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => toggleUserSelection(item.uid)}
              >
                <MaterialIcons
                  name={selectedUsers.has(item.uid) ? "check-box" : "check-box-outline-blank"}
                  size={24}
                  color={selectedUsers.has(item.uid) ? "#2563eb" : "#9ca3af"}
                />
              </TouchableOpacity>
            )}

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.fullName}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userDepartment}>
                <MaterialIcons name="business" size={14} color="#6b7280" />
                {" "}{item.department || "General"}
              </Text>
            </View>

            <View style={styles.userBadges}>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: item.isActive ? "#f0fdf4" : "#fef2f2" }
                ]}
                textStyle={[
                  styles.statusChipText,
                  { color: item.isActive ? "#059669" : "#dc2626" }
                ]}
              >
                {item.isActive ? "Active" : "Inactive"}
              </Chip>
            </View>
          </View>

          <View style={styles.userDetails}>
            <View style={styles.userDetailRow}>
              <MaterialIcons name="phone" size={14} color="#6b7280" />
              <Text style={styles.userPhone}>{item.phone || "No phone"}</Text>
            </View>
            {item.lastLogin && item.lastLogin !== "Never" && (
              <View style={styles.userDetailRow}>
                <MaterialIcons name="access-time" size={14} color="#6b7280" />
                <Text style={styles.lastLogin}>Last login: {new Date(item.lastLogin).toLocaleDateString()}</Text>
              </View>
            )}
          </View>

          <View style={styles.userActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleEditUser(item);
              }}
            >
              <MaterialIcons name="edit" size={16} color="#2563eb" />
              <Text style={[styles.actionButtonText, { color: "#2563eb" }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.statusButton]}
              onPress={(e) => {
                e.stopPropagation();
                toggleUserStatus(item);
              }}
            >
              <MaterialIcons
                name={item.isActive ? "pause" : "play-arrow"}
                size={16}
                color={item.isActive ? "#d97706" : "#059669"}
              />
              <Text style={[styles.actionButtonText, { color: item.isActive ? "#d97706" : "#059669" }]}>
                {item.isActive ? "Deactivate" : "Activate"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteUser(item);
              }}
            >
              <MaterialIcons name="person-off" size={16} color="#dc2626" />
              <Text style={[styles.actionButtonText, { color: "#dc2626" }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={48} color="#2563eb" />
        <Text style={styles.loadingText}>Loading Swachh-HR staff data...</Text>
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

            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <MaterialIcons name="business-center" size={20} color="#2563eb" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>SHM</Text>
                  <Text style={styles.headerSubtitle}>Manage Swachh</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <MaterialIcons name="person-add" size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>Add User</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
        >
          {/* Statistics Overview */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="analytics" size={20} color="#111827" />
              <Text style={styles.sectionTitle}>Staff Overview</Text>
            </View>
            <View style={styles.statsGrid}>
              <TouchableOpacity
                onPress={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                activeOpacity={0.7}
              >
                <Card style={styles.statCard}>
                  <View style={styles.statContent}>
                    <View style={[styles.statIconContainer, { backgroundColor: "#eff6ff" }]}>
                      <MaterialIcons name="group" size={24} color="#2563eb" />
                    </View>
                    <View style={styles.statInfo}>
                      <Text style={styles.statNumber}>{statistics.totalStaff}</Text>
                      <Text style={styles.statLabel}>Total Staff</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilters(prev => ({ ...prev, status: 'active' }))}
                activeOpacity={0.7}
              >
                <Card style={styles.statCard}>
                  <View style={styles.statContent}>
                    <View style={[styles.statIconContainer, { backgroundColor: "#f0fdf4" }]}>
                      <MaterialIcons name="check-circle" size={24} color="#059669" />
                    </View>
                    <View style={styles.statInfo}>
                      <Text style={styles.statNumber}>{statistics.activeUsers}</Text>
                      <Text style={styles.statLabel}>Active</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Alert.alert('Departments', 'Department management coming soon')}
                activeOpacity={0.7}
              >
                <Card style={styles.statCard}>
                  <View style={styles.statContent}>
                    <View style={[styles.statIconContainer, { backgroundColor: "#fffbeb" }]}>
                      <MaterialIcons name="business" size={24} color="#d97706" />
                    </View>
                    <View style={styles.statInfo}>
                      <Text style={styles.statNumber}>{statistics.departments}</Text>
                      <Text style={styles.statLabel}>Departments</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Alert.alert('Recent Logins', 'Login analytics coming soon')}
                activeOpacity={0.7}
              >
                <Card style={styles.statCard}>
                  <View style={styles.statContent}>
                    <View style={[styles.statIconContainer, { backgroundColor: "#fef2f2" }]}>
                      <MaterialIcons name="access-time" size={24} color="#dc2626" />
                    </View>
                    <View style={styles.statInfo}>
                      <Text style={styles.statNumber}>{statistics.recentLogins}</Text>
                      <Text style={styles.statLabel}>Recent Logins</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search and Filters */}
          <View style={styles.section}>
            <View style={styles.searchContainer}>
              <Searchbar
                placeholder="Search by name, email, phone, or department..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
              />
              <TouchableOpacity
                style={styles.filterToggleButton}
                onPress={() => setFiltersVisible(!filtersVisible)}
              >
                <MaterialIcons
                  name={filtersVisible ? "filter-list-off" : "filter-list"}
                  size={24}
                  color="#2563eb"
                />
              </TouchableOpacity>
            </View>

            {/* Advanced Filters */}
            {filtersVisible && (
              <View style={styles.filtersContainer}>
                <View style={styles.filterRow}>
                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Status</Text>
                    <TouchableOpacity
                      style={styles.filterDropdown}
                      onPress={() => {
                        Alert.alert(
                          "Filter by Status",
                          "Select status to filter",
                          [
                            { text: "All Status", onPress: () => setFilters(prev => ({ ...prev, status: "all" })) },
                            { text: "Active", onPress: () => setFilters(prev => ({ ...prev, status: "active" })) },
                            { text: "Inactive", onPress: () => setFilters(prev => ({ ...prev, status: "inactive" })) },
                          ]
                        )
                      }}
                    >
                      <Text style={styles.filterDropdownText}>
                        {filters.status === "all" ? "All Status" :
                          filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.filterItem}>
                    <Text style={styles.filterLabel}>Sort By</Text>
                    <TouchableOpacity
                      style={styles.filterDropdown}
                      onPress={() => {
                        Alert.alert(
                          "Sort By",
                          "Select sorting option",
                          [
                            { text: "Name", onPress: () => setFilters(prev => ({ ...prev, sortBy: "name" })) },
                            { text: "Email", onPress: () => setFilters(prev => ({ ...prev, sortBy: "email" })) },
                            { text: "Created Date", onPress: () => setFilters(prev => ({ ...prev, sortBy: "createdAt" })) },
                            { text: "Last Login", onPress: () => setFilters(prev => ({ ...prev, sortBy: "lastLogin" })) },
                          ]
                        )
                      }}
                    >
                      <Text style={styles.filterDropdownText}>
                        {filters.sortBy === "name" ? "Name" :
                          filters.sortBy === "email" ? "Email" :
                            filters.sortBy === "createdAt" ? "Created Date" : "Last Login"}
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.filterActions}>
                  <TouchableOpacity
                    style={styles.sortOrderButton}
                    onPress={() => setFilters(prev => ({
                      ...prev,
                      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc"
                    }))}
                  >
                    <MaterialIcons
                      name={filters.sortOrder === "asc" ? "arrow-upward" : "arrow-downward"}
                      size={20}
                      color="#2563eb"
                    />
                    <Text style={styles.sortOrderText}>
                      {filters.sortOrder === "asc" ? "Ascending" : "Descending"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={() => setFilters({
                      status: "all",
                      department: "all",
                      dateRange: "all",
                      sortBy: "name",
                      sortOrder: "asc"
                    })}
                  >
                    <MaterialIcons name="clear" size={20} color="#dc2626" />
                    <Text style={styles.clearFiltersText}>Clear Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* User List */}
          <View style={styles.section}>
            <View style={styles.listHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialIcons name="people" size={20} color="#111827" />
                <Text style={styles.sectionTitle}>Swachh-HR Staff Members</Text>
              </View>

              <View style={styles.listActions}>
                <TouchableOpacity
                  style={styles.bulkToggleButton}
                  onPress={() => setBulkMode(!bulkMode)}
                >
                  <MaterialIcons
                    name={bulkMode ? "check-box" : "check-box-outline-blank"}
                    size={20}
                    color="#2563eb"
                  />
                  <Text style={styles.bulkToggleText}>
                    {bulkMode ? "Exit Bulk" : "Bulk Select"}
                  </Text>
                </TouchableOpacity>

                {bulkMode && (
                  <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={selectAllUsers}
                  >
                    <MaterialIcons
                      name={selectedUsers.size === filteredUsers.length ? "deselect" : "select-all"}
                      size={20}
                      color="#059669"
                    />
                    <Text style={styles.selectAllText}>
                      {selectedUsers.size === filteredUsers.length ? "Deselect All" : "Select All"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Bulk Actions Bar */}
            {bulkMode && selectedUsers.size > 0 && (
              <View style={styles.bulkActionsBar}>
                <Text style={styles.bulkActionsText}>
                  {selectedUsers.size} user(s) selected
                </Text>
                <View style={styles.bulkActionsButtons}>
                  <TouchableOpacity
                    style={[styles.bulkActionButton, styles.activateButton]}
                    onPress={() => handleBulkAction("activate")}
                  >
                    <MaterialIcons name="play-arrow" size={16} color="#059669" />
                    <Text style={styles.bulkActionText}>Activate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bulkActionButton, styles.deactivateButton]}
                    onPress={() => handleBulkAction("deactivate")}
                  >
                    <MaterialIcons name="pause" size={16} color="#d97706" />
                    <Text style={styles.bulkActionText}>Deactivate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bulkActionButton, styles.deleteButton]}
                    onPress={() => handleBulkAction("delete")}
                  >
                    <MaterialIcons name="delete" size={16} color="#dc2626" />
                    <Text style={styles.bulkActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* User List */}
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="people-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>No Swachh-HR Staff Found</Text>
                <Text style={styles.emptyStateText}>
                  {users.length === 0
                    ? "No Swachh-HR staff members have been added yet."
                    : "No staff members match your current search and filter criteria."
                  }
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <MaterialIcons name="person-add" size={20} color="#ffffff" />
                  <Text style={styles.emptyStateButtonText}>Add First User</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                renderItem={renderUserCard}
                keyExtractor={(item) => item.uid}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
              />
            )}
          </View>
        </ScrollView>

        {/* Sidebar */}
        <AdminSidebar
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          navigation={navigation}
        />
        {/* Create User Modal */}
        <Portal>
          <Modal
            visible={createModalVisible}
            onDismiss={() => setCreateModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <View style={styles.modalTitleContainer}>
                  <MaterialIcons name="person-add" size={20} color="#2563eb" />
                  <Text style={styles.modalTitle}>Create New Swachh-HR User</Text>
                </View>

                <View style={styles.formContainer}>
                  <TextInput
                    label="Full Name *"
                    value={createForm.fullName}
                    onChangeText={(text) => setCreateForm(prev => ({ ...prev, fullName: text }))}
                    style={styles.input}
                    mode="outlined"
                    dense={false}
                  />

                  <TextInput
                    label="Email Address *"
                    value={createForm.email}
                    onChangeText={(text) => setCreateForm(prev => ({ ...prev, email: text }))}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    dense={false}
                  />

                  <TextInput
                    label="Phone Number"
                    value={createForm.phone}
                    onChangeText={(text) => setCreateForm(prev => ({ ...prev, phone: text }))}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="phone-pad"
                    dense={false}
                  />

                  <TextInput
                    label="Password *"
                    value={createForm.password}
                    onChangeText={(text) => setCreateForm(prev => ({ ...prev, password: text }))}
                    style={styles.input}
                    mode="outlined"
                    secureTextEntry
                    dense={false}
                  />

                  <TextInput
                    label="Department"
                    value={createForm.department}
                    onChangeText={(text) => setCreateForm(prev => ({ ...prev, department: text }))}
                    style={styles.input}
                    mode="outlined"
                    placeholder="e.g., Operations, Field Management"
                    dense={false}
                  />
                </View>

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setCreateModalVisible(false)}
                    style={styles.modalButton}
                    icon="close"
                    contentStyle={styles.buttonContent}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleCreateUser}
                    style={styles.modalButton}
                    loading={operationLoading}
                    disabled={operationLoading}
                    icon="account-plus"
                    contentStyle={styles.buttonContent}
                  >
                    Create User
                  </Button>
                </View>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {/* Edit User Modal */}
        <Portal>
          <Modal
            visible={editModalVisible}
            onDismiss={() => setEditModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <View style={styles.modalTitleContainer}>
                  <MaterialIcons name="edit" size={20} color="#2563eb" />
                  <Text style={styles.modalTitle}>Edit User Information</Text>
                </View>

                <View style={styles.formContainer}>
                  <TextInput
                    label="Full Name *"
                    value={editForm.fullName}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, fullName: text }))}
                    style={styles.input}
                    mode="outlined"
                    dense={false}
                  />

                  <TextInput
                    label="Email Address *"
                    value={editForm.email}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={false}
                    disabled
                    dense={false}
                  />

                  <TextInput
                    label="Phone Number"
                    value={editForm.phone}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="phone-pad"
                    dense={false}
                  />

                  <TextInput
                    label="Department"
                    value={editForm.department}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, department: text }))}
                    style={styles.input}
                    mode="outlined"
                    dense={false}
                  />

                  <View style={styles.statusToggleContainer}>
                    <Text style={styles.statusToggleLabel}>Account Status</Text>
                    <TouchableOpacity
                      style={[
                        styles.statusToggle,
                        { backgroundColor: editForm.isActive ? "#f0fdf4" : "#fef2f2" }
                      ]}
                      onPress={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                    >
                      <MaterialIcons
                        name={editForm.isActive ? "check-circle" : "cancel"}
                        size={20}
                        color={editForm.isActive ? "#059669" : "#dc2626"}
                      />
                      <Text style={[
                        styles.statusToggleText,
                        { color: editForm.isActive ? "#059669" : "#dc2626" }
                      ]}>
                        {editForm.isActive ? "Active" : "Inactive"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setEditModalVisible(false)}
                    style={styles.modalButton}
                    icon="close"
                    contentStyle={styles.buttonContent}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveUser}
                    style={styles.modalButton}
                    loading={operationLoading}
                    disabled={operationLoading}
                    icon="check"
                    contentStyle={styles.buttonContent}
                  >
                    Save Changes
                  </Button>
                </View>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        {/* Delete Confirmation Modal */}
        <Portal>
          <Modal
            visible={deleteModalVisible}
            onDismiss={() => setDeleteModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalTitleContainer}>
                <MaterialIcons name="warning" size={20} color="#dc2626" />
                <Text style={styles.modalTitle}>Deactivate User</Text>
              </View>

              <Text style={styles.modalText}>
                Are you sure you want to deactivate <Text style={styles.boldText}>{selectedUser?.fullName}</Text>?
                This will disable their access to the system. You can reactivate them later if needed.
              </Text>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setDeleteModalVisible(false)}
                  style={styles.modalButton}
                  icon="close"
                  contentStyle={styles.buttonContent}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmDeleteUser}
                  style={[styles.modalButton, { backgroundColor: "#dc2626" }]}
                  loading={operationLoading}
                  disabled={operationLoading}
                  icon="account-off"
                  contentStyle={styles.buttonContent}
                >
                  Deactivate
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>

      </SafeAreaView>
    </ProtectedRoute>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: SPACING.lg,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginLeft: SPACING.sm,
    lineHeight: 22,
  },

  // Header styles - Perfect alignment
  header: {
    backgroundColor: "#ffffff",
    paddingTop: SPACING.xxxxxl + 2, // 50px for status bar
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 56, // Consistent header height
  },
  menuButton: {
    padding: SPACING.sm,
    borderRadius: SPACING.sm,
    marginRight: SPACING.md,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: SPACING.sm,
    borderRadius: SPACING.sm,
    marginRight: SPACING.md,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: SPACING.xs,
    lineHeight: 18,
  },

  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2, // 10px
    borderRadius: SPACING.sm,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    height: 40, // Consistent button height
    minWidth: 120,
    justifyContent: "center",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },

  // Statistics grid
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -SPACING.sm,   // Negative margin for consistent spacing
  },
  statCard: {
    width: "60%", // Increased width for better content fit
    marginHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: SPACING.md,
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    height: 100, // Fixed height for consistent appearance
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    height: "100%", // Fill the entire card height
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  statInfo: {
    flex: 1,
    minWidth: 0, // Prevent text overflow
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: SPACING.xs,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    lineHeight: 16,
  },

  // Search and Filter styles - Perfect alignment
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  searchBar: {
    backgroundColor: "#ffffff",
    elevation: 2,
    flex: 1,
    borderRadius: SPACING.sm,
    marginRight: SPACING.md,
    // Remove default margins from Searchbar
    marginHorizontal: 0,
    marginVertical: 0,
  },
  filterToggleButton: {
    width: 48,
    height: 48,
    borderRadius: SPACING.sm,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  filtersContainer: {
    backgroundColor: "#ffffff",
    borderRadius: SPACING.md,
    padding: SPACING.lg,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginTop: SPACING.sm,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  filterItem: {
    flex: 1,
    minWidth: 0, // Prevent overflow
    marginRight: SPACING.md,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  filterDropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2, // 10px
    height: 44, // Consistent dropdown height
  },
  filterDropdownText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 18,
  },

  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  sortOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.sm,
    height: 36, // Consistent action button height
    minWidth: 100,
    justifyContent: "center",
  },
  sortOrderText: {
    fontSize: 14,
    color: "#2563eb",
    marginLeft: SPACING.xs,
    fontWeight: "500",
    lineHeight: 18,
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.sm,
    height: 36, // Consistent action button height
    minWidth: 100,
    justifyContent: "center",
  },
  clearFiltersText: {
    fontSize: 14,
    color: "#dc2626",
    marginLeft: SPACING.xs,
    fontWeight: "500",
    lineHeight: 18,
  },

  // Bulk operations styles - Perfect alignment
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
    minHeight: 40, // Consistent header height
  },
  listActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  bulkToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.sm,
    height: 36, // Consistent button height
    minWidth: 100,
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  bulkToggleText: {
    fontSize: 14,
    color: "#2563eb",
    marginLeft: SPACING.xs,
    fontWeight: "500",
    lineHeight: 18,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.sm,
    height: 36, // Consistent button height
    minWidth: 100,
    justifyContent: "center",
  },
  selectAllText: {
    fontSize: 14,
    color: "#059669",
    marginLeft: SPACING.xs,
    fontWeight: "500",
    lineHeight: 18,
  },

  bulkActionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 56, // Consistent bar height
  },
  bulkActionsText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    lineHeight: 18,
    flex: 1,
  },
  bulkActionsButtons: {
    flexDirection: "row",
  },
  bulkActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm + 2, // 10px
    paddingVertical: SPACING.xs + 2, // 6px
    borderRadius: SPACING.xs + 2, // 6px
    height: 32, // Consistent bulk action button height
    minWidth: 80,
    justifyContent: "center",
    marginLeft: SPACING.sm,
  },
  activateButton: {
    backgroundColor: "#f0fdf4",
  },
  deactivateButton: {
    backgroundColor: "#fffbeb",
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: SPACING.xs,
    lineHeight: 16,
  },

  // User card styles - Perfect alignment
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: SPACING.md,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: SPACING.lg,
    overflow: "hidden", // Ensure content doesn't overflow rounded corners
  },
  userContent: {
    padding: SPACING.lg,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
    minHeight: 48, // Consistent header height
  },
  checkboxContainer: {
    marginRight: SPACING.md,
    paddingTop: SPACING.xs,
    width: 32, // Fixed width for consistent alignment
    alignItems: "center",
  },

  userInfo: {
    flex: 1,
    marginRight: SPACING.md,
    minWidth: 0, // Prevent text overflow
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: SPACING.xs,
    lineHeight: 22,
  },
  userEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  userDepartment: {
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 16,
  },

  userBadges: {
    alignItems: "flex-end",
    minWidth: 80, // Consistent badge width
  },
  statusChip: {
    height: 28,
    minWidth: 70,
    justifyContent: "center",
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
  },

  // User details styles - Perfect alignment
  userDetails: {
    marginBottom: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  userDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
    minHeight: 20, // Consistent row height
  },
  userPhone: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: SPACING.xs,
    lineHeight: 16,
    flex: 1,
  },
  lastLogin: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: SPACING.xs,
    lineHeight: 16,
    flex: 1,
  },

  // Action buttons styles - Perfect alignment
  userActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: SPACING.sm,
    backgroundColor: "#f9fafb",
    flexBasis: "32%",
    minWidth: "30%",
    minHeight: 36,
    marginHorizontal: SPACING.xs,
    marginTop: SPACING.xs,
  },
  editButton: {
    backgroundColor: "#eff6ff",
  },
  statusButton: {
    backgroundColor: "#f0fdf4",
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: SPACING.xs,
    lineHeight: 16,
  },

  // Empty state styles
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xxxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.xxl,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.sm,
  },
  emptyStateButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: SPACING.sm,
  },

  // Modal styles - Responsive and properly aligned
  modalContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: SPACING.lg, // Responsive horizontal margin
    marginVertical: SPACING.xxxxl, // Vertical margin for proper centering
    borderRadius: SPACING.md,
    maxHeight: "85%", // Prevent modal from taking full screen height
    width: "90%", // Responsive width that works on all screen sizes
    alignSelf: "center",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  modalScrollView: {
    maxHeight: "100%", // Ensure scrollview doesn't exceed modal bounds
  },

  modalContent: {
    padding: SPACING.xl, // Consistent padding inside modal
  },

  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginLeft: SPACING.sm,
    lineHeight: 24,
    textAlign: "center",
  },

  modalText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: SPACING.xl,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: SPACING.sm,
  },

  boldText: {
    fontWeight: "700",
    color: "#111827",
  },

  formContainer: {
    marginBottom: SPACING.lg,
  },

  input: {
    marginBottom: SPACING.lg, // Increased spacing between inputs
    backgroundColor: "#ffffff",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },

  modalButton: {
    flex: 1, // Equal width modal buttons
    minHeight: 48, // Larger touch target for better UX
    marginHorizontal: SPACING.sm, // Proper spacing between buttons
    borderRadius: SPACING.sm,
  },

  buttonContent: {
    height: 48, // Consistent button content height
    justifyContent: "center",
    alignItems: "center",
  },

  // Status toggle styles
  statusToggleContainer: {
    marginBottom: SPACING.lg,
  },
  statusToggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: SPACING.sm,
  },
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusToggleText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: SPACING.sm,
  },
})

export default SwachhHRManagement