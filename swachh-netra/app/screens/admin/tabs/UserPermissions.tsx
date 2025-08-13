"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import {
  Card,
  Title,
  Text,
  Button,
  List,
  Switch,
  Chip,
  Searchbar,
  FAB,
  Portal,
  Modal,
  TextInput,
} from "react-native-paper"

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface UserRole {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  status: "active" | "inactive"
  zone?: string
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: "view_dashboard", name: "View Dashboard", description: "Access to dashboard overview", category: "General" },
  { id: "manage_workers", name: "Manage Workers", description: "Add, edit, delete workers", category: "Workers" },
  { id: "view_workers", name: "View Workers", description: "View worker information only", category: "Workers" },
  { id: "assign_workers", name: "Assign Workers", description: "Assign workers to feeder points", category: "Workers" },
  { id: "manage_drivers", name: "Manage Drivers", description: "Add, edit, delete drivers", category: "Transport" },
  { id: "view_drivers", name: "View Drivers", description: "View driver information only", category: "Transport" },
  { id: "manage_vehicles", name: "Manage Vehicles", description: "Add, edit, delete vehicles", category: "Transport" },
  { id: "view_vehicles", name: "View Vehicles", description: "View vehicle information only", category: "Transport" },
  { id: "assign_routes", name: "Assign Routes", description: "Assign drivers to routes", category: "Transport" },
  { id: "view_reports", name: "View Reports", description: "Access to all reports and analytics", category: "Reports" },
  { id: "view_attendance", name: "View Attendance", description: "View attendance reports", category: "Reports" },
  {
    id: "view_waste_analytics",
    name: "View Waste Analytics",
    description: "View waste collection analytics",
    category: "Reports",
  },
  {
    id: "view_zone_performance",
    name: "View Zone Performance",
    description: "View zone performance metrics",
    category: "Reports",
  },
  { id: "export_data", name: "Export Data", description: "Export reports and data", category: "Reports" },
  {
    id: "monitor_quality",
    name: "Monitor Quality",
    description: "Quality monitoring and inspection",
    category: "Quality",
  },
  { id: "system_settings", name: "System Settings", description: "Modify system configurations", category: "Admin" },
  { id: "user_management", name: "User Management", description: "Manage user accounts and roles", category: "Admin" },
  {
    id: "approve_requests",
    name: "Approve Requests",
    description: "Approve worker/driver requests",
    category: "Admin",
  },
  {
    id: "messaging",
    name: "Internal Messaging",
    description: "Send and receive internal messages",
    category: "Communication",
  },
]

const PREDEFINED_ROLES = {
  admin: [
    "view_dashboard",
    "manage_workers",
    "manage_drivers",
    "manage_vehicles",
    "view_reports",
    "view_attendance",
    "view_waste_analytics",
    "view_zone_performance",
    "export_data",
    "system_settings",
    "user_management",
    "approve_requests",
    "messaging",
  ],
  swachh_hr: [
    "view_dashboard",
    "manage_workers",
    "view_workers",
    "assign_workers",
    "view_reports",
    "view_attendance",
    "view_waste_analytics",
    "messaging",
  ],
  transport_contractor: [
    "view_dashboard",
    "manage_drivers",
    "manage_vehicles",
    "view_drivers",
    "view_vehicles",
    "assign_routes",
    "view_reports",
    "view_attendance",
    "messaging",
  ],
  driver: ["view_dashboard"],
  quality_check: [
    "view_dashboard",
    "view_workers",
    "view_drivers",
    "view_vehicles",
    "view_reports",
    "view_attendance",
    "view_waste_analytics",
    "view_zone_performance",
    "monitor_quality",
    "export_data",
  ], // Read-only role with comprehensive monitoring access
}

export default function UserPermissions() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserRole[]>([
    {
      id: "1",
      name: "Admin User",
      email: "admin@swachh.com",
      role: "admin",
      permissions: PREDEFINED_ROLES.admin,
      status: "active",
    },
    {
      id: "2",
      name: "HR Manager",
      email: "hr@swachh.com",
      role: "swachh_hr",
      permissions: PREDEFINED_ROLES.swachh_hr,
      status: "active",
      zone: "Zone A",
    },
    {
      id: "3",
      name: "Quality Inspector",
      email: "quality@swachh.com",
      role: "quality_check",
      permissions: PREDEFINED_ROLES.quality_check,
      status: "active",
    },
    {
      id: "4",
      name: "Transport Manager",
      email: "transport@swachh.com",
      role: "transport_contractor",
      permissions: PREDEFINED_ROLES.transport_contractor,
      status: "active",
      zone: "Zone B",
    },
  ])

  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [newUserModal, setNewUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "driver",
    zone: "",
  })

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handlePermissionToggle = (permissionId: string) => {
    if (!selectedUser) return

    const updatedPermissions = selectedUser.permissions.includes(permissionId)
      ? selectedUser.permissions.filter((p) => p !== permissionId)
      : [...selectedUser.permissions, permissionId]

    const updatedUser = { ...selectedUser, permissions: updatedPermissions }
    setSelectedUser(updatedUser)

    // Update in users array
    setUsers(users.map((user) => (user.id === selectedUser.id ? updatedUser : user)))
  }

  const handleRoleChange = (newRole: string) => {
    if (!selectedUser) return

    const updatedUser = {
      ...selectedUser,
      role: newRole,
      permissions: PREDEFINED_ROLES[newRole as keyof typeof PREDEFINED_ROLES] || [],
    }

    setSelectedUser(updatedUser)
    setUsers(users.map((user) => (user.id === selectedUser.id ? updatedUser : user)))
  }

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) {
      Alert.alert("Error", "Please fill in all required fields")
      return
    }

    const user: UserRole = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: PREDEFINED_ROLES[newUser.role as keyof typeof PREDEFINED_ROLES] || [],
      status: "active",
      zone: newUser.zone || undefined,
    }

    setUsers([...users, user])
    setNewUser({ name: "", email: "", role: "driver", zone: "" })
    setNewUserModal(false)
    Alert.alert("Success", "User created successfully")
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "#F44336"
      case "swachh_hr":
        return "#2196F3"
      case "transport_contractor":
        return "#FF9800"
      case "quality_check":
        return "#9C27B0"
      default:
        return "#4CAF50"
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "swachh_hr":
        return "SWACHH HR"
      case "transport_contractor":
        return "TRANSPORT CONTRACTOR"
      case "quality_check":
        return "QUALITY CHECK"
      default:
        return role.replace("_", " ").toUpperCase()
    }
  }

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <ScrollView style={styles.content}>
        {filteredUsers.map((user) => (
          <Card key={user.id} style={styles.userCard}>
            <Card.Content>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  {user.zone && <Text style={styles.userZone}>Zone: {user.zone}</Text>}
                </View>
                <View style={styles.userMeta}>
                  <Chip
                    style={[styles.roleChip, { backgroundColor: getRoleColor(user.role) }]}
                    textStyle={{ color: "#fff", fontSize: 12 }}
                  >
                    {getRoleDisplayName(user.role)}
                  </Chip>
                  <Chip
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: user.status === "active" ? "#4CAF50" : "#F44336",
                      },
                    ]}
                    textStyle={{ color: "#fff", fontSize: 12 }}
                  >
                    {user.status.toUpperCase()}
                  </Chip>
                </View>
              </View>

              <View style={styles.permissionSummary}>
                <Text style={styles.permissionCount}>{user.permissions.length} permissions assigned</Text>
                <Button
                  mode="outlined"
                  icon="cog"
                  compact
                  onPress={() => {
                    setSelectedUser(user)
                    setModalVisible(true)
                  }}
                >
                  Manage
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => setNewUserModal(true)} label="Add User" />

      {/* Permission Management Modal */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <ScrollView>
            <Title style={styles.modalTitle}>Manage Permissions - {selectedUser?.name}</Title>

            <Card style={styles.roleCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Role</Text>
                <View style={styles.roleButtons}>
                  {Object.keys(PREDEFINED_ROLES).map((role) => (
                    <Chip
                      key={role}
                      selected={selectedUser?.role === role}
                      onPress={() => handleRoleChange(role)}
                      style={styles.roleButton}
                    >
                      {getRoleDisplayName(role)}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>

            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <Card key={category} style={styles.permissionCard}>
                <Card.Content>
                  <Text style={styles.sectionTitle}>{category}</Text>
                  {permissions.map((permission) => (
                    <List.Item
                      key={permission.id}
                      title={permission.name}
                      description={permission.description}
                      right={() => (
                        <Switch
                          value={selectedUser?.permissions.includes(permission.id) || false}
                          onValueChange={() => handlePermissionToggle(permission.id)}
                        />
                      )}
                    />
                  ))}
                </Card.Content>
              </Card>
            ))}

            <Button mode="contained" onPress={() => setModalVisible(false)} style={styles.saveButton}>
              Save Changes
            </Button>
          </ScrollView>
        </Modal>

        {/* New User Modal */}
        <Modal visible={newUserModal} onDismiss={() => setNewUserModal(false)} contentContainerStyle={styles.modal}>
          <Title style={styles.modalTitle}>Create New User</Title>

          <TextInput
            label="Full Name *"
            value={newUser.name}
            onChangeText={(text) => setNewUser({ ...newUser, name: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Email *"
            value={newUser.email}
            onChangeText={(text) => setNewUser({ ...newUser, email: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
          />

          <TextInput
            label="Zone (optional)"
            value={newUser.zone}
            onChangeText={(text) => setNewUser({ ...newUser, zone: text })}
            style={styles.input}
            mode="outlined"
          />

          <Text style={styles.sectionTitle}>Role</Text>
          <View style={styles.roleButtons}>
            {Object.keys(PREDEFINED_ROLES).map((role) => (
              <Chip
                key={role}
                selected={newUser.role === role}
                onPress={() => setNewUser({ ...newUser, role })}
                style={styles.roleButton}
              >
                {getRoleDisplayName(role)}
              </Chip>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setNewUserModal(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateUser} style={styles.modalButton}>
              Create User
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  searchbar: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    marginBottom: 12,
    elevation: 2,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 2,
  },
  userZone: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  userMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  roleChip: {
    height: 24,
  },
  statusChip: {
    height: 20,
  },
  permissionSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  permissionCount: {
    fontSize: 12,
    color: "#757575",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#F44336",
  },
  modal: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  roleCard: {
    marginBottom: 16,
  },
  permissionCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  roleButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleButton: {
    backgroundColor: "#E3F2FD",
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 4,
  },
  input: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
})
