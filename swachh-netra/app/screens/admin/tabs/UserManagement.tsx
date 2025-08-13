"use client"

import { useState } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Card, Text, Button, Chip, Searchbar, FAB, Menu } from "react-native-paper"

interface User {
  id: string
  name: string
  email: string
  role: "driver" | "contractor" | "zi" | "hr" | "worker"
  status: "active" | "inactive" | "pending"
  zone: string
  joinDate: string
}

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [menuVisible, setMenuVisible] = useState(false)

  const [users] = useState<User[]>([
    {
      id: "1",
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      role: "driver",
      status: "active",
      zone: "Zone A",
      joinDate: "2023-06-15",
    },
    {
      id: "2",
      name: "Priya Sharma",
      email: "priya@example.com",
      role: "contractor",
      status: "active",
      zone: "Zone B",
      joinDate: "2023-05-20",
    },
    {
      id: "3",
      name: "Amit Singh",
      email: "amit@example.com",
      role: "driver",
      status: "pending",
      zone: "Zone C",
      joinDate: "2024-01-10",
    },
  ])

  const getRoleColor = (role: string) => {
    switch (role) {
      case "driver":
        return "#1976d2"
      case "contractor":
        return "#ff9800"
      case "zi":
        return "#9c27b0"
      case "hr":
        return "#4caf50"
      case "worker":
        return "#795548"
      default:
        return "#666"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4caf50"
      case "inactive":
        return "#f44336"
      case "pending":
        return "#ff9800"
      default:
        return "#666"
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const renderUser = ({ item }: { item: User }) => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text variant="titleMedium">{item.name}</Text>
            <Text variant="bodySmall" style={styles.userEmail}>
              {item.email}
            </Text>
            <Text variant="bodySmall" style={styles.userZone}>
              {item.zone} • Joined {item.joinDate}
            </Text>
          </View>
          <View style={styles.userStatus}>
            <Chip mode="flat" textStyle={{ color: getRoleColor(item.role) }} style={styles.roleChip}>
              {item.role.toUpperCase()}
            </Chip>
            <Chip mode="flat" textStyle={{ color: getStatusColor(item.status) }} style={styles.statusChip}>
              {item.status.toUpperCase()}
            </Chip>
          </View>
        </View>

        <View style={styles.userActions}>
          <Button
            mode="outlined"
            icon="edit"
            onPress={() => {
              /* Edit user */
            }}
            style={styles.actionButton}
          >
            Edit
          </Button>
          <Button
            mode="outlined"
            icon="key"
            onPress={() => {
              /* Reset password */
            }}
            style={styles.actionButton}
          >
            Reset Password
          </Button>
          <Button
            mode="outlined"
            icon={item.status === "active" ? "block" : "check"}
            onPress={() => {
              /* Toggle status */
            }}
            style={styles.actionButton}
          >
            {item.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        User Management
      </Text>

      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button mode="outlined" icon="filter-list" onPress={() => setMenuVisible(true)} style={styles.filterButton}>
              {selectedRole === "all" ? "All Roles" : selectedRole.toUpperCase()}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedRole("all")
              setMenuVisible(false)
            }}
            title="All Roles"
          />
          <Menu.Item
            onPress={() => {
              setSelectedRole("driver")
              setMenuVisible(false)
            }}
            title="Drivers"
          />
          <Menu.Item
            onPress={() => {
              setSelectedRole("contractor")
              setMenuVisible(false)
            }}
            title="Contractors"
          />
          <Menu.Item
            onPress={() => {
              setSelectedRole("zi")
              setMenuVisible(false)
            }}
            title="ZI"
          />
          <Menu.Item
            onPress={() => {
              setSelectedRole("hr")
              setMenuVisible(false)
            }}
            title="HR"
          />
          <Menu.Item
            onPress={() => {
              setSelectedRole("worker")
              setMenuVisible(false)
            }}
            title="Workers"
          />
        </Menu>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.usersList}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          /* Add new user */
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    marginBottom: 16,
    color: "#1976d2",
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    minWidth: 100,
  },
  usersList: {
    flex: 1,
  },
  userCard: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    color: "#666",
    marginTop: 2,
  },
  userZone: {
    color: "#666",
    marginTop: 2,
    fontSize: 12,
  },
  userStatus: {
    alignItems: "flex-end",
  },
  roleChip: {
    marginBottom: 4,
  },
  statusChip: {
    height: 24,
  },
  userActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#1976d2",
  },
})

export default UserManagement
