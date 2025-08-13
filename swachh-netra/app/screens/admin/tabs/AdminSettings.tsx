"use client"

import { useState } from "react"
import { StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Text, Button, List, Switch } from "react-native-paper"
import { signOut } from "firebase/auth"
import { FIREBASE_AUTH } from "../../../../FirebaseConfig";

const AdminSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            if (FIREBASE_AUTH) {
              await signOut(FIREBASE_AUTH)
            }
          } catch (error) {
            Alert.alert("Error", "Failed to logout")
          }
        },
      },
    ])
  }

  const handleDataBackup = () => {
    Alert.alert("Data Backup", "This will create a backup of all system data. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Backup",
        onPress: () => {
          // Implement backup logic
          Alert.alert("Success", "Data backup completed successfully")
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        System Settings
      </Text>

      {/* System Configuration */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">System Configuration</Text>
          <List.Item
            title="Maintenance Mode"
            description="Enable system maintenance mode"
            left={(props) => <List.Icon {...props} icon="build" />}
            right={() => <Switch value={maintenanceMode} onValueChange={setMaintenanceMode} />}
          />
          <List.Item
            title="Auto Backup"
            description="Automatically backup data daily"
            left={(props) => <List.Icon {...props} icon="backup" />}
            right={() => <Switch value={autoBackup} onValueChange={setAutoBackup} />}
          />
          <List.Item
            title="System Notifications"
            description="Receive system alerts and notifications"
            left={(props) => <List.Icon {...props} icon="notifications" />}
            right={() => <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
          />
        </Card.Content>
      </Card>

      {/* User Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">User Management</Text>
          <List.Item
            title="Roles & Permissions"
            description="Configure user roles and permissions"
            left={(props) => <List.Icon {...props} icon="admin-panel-settings" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to roles */
            }}
          />
          <List.Item
            title="User Registration"
            description="Manage user registration settings"
            left={(props) => <List.Icon {...props} icon="person-add" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to registration settings */
            }}
          />
          <List.Item
            title="Password Policy"
            description="Configure password requirements"
            left={(props) => <List.Icon {...props} icon="security" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to password policy */
            }}
          />
        </Card.Content>
      </Card>

      {/* Zone Configuration */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Zone Configuration</Text>
          <List.Item
            title="Feeder Points Setup"
            description="Configure feeder points and locations"
            left={(props) => <List.Icon {...props} icon="location-on" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to feeder points */
            }}
          />
          <List.Item
            title="Zone Boundaries"
            description="Define zone boundaries and areas"
            left={(props) => <List.Icon {...props} icon="map" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to zone boundaries */
            }}
          />
          <List.Item
            title="Collection Schedule"
            description="Set collection schedules for zones"
            left={(props) => <List.Icon {...props} icon="schedule" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to schedules */
            }}
          />
        </Card.Content>
      </Card>

      {/* Data Management */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Data Management</Text>
          <List.Item
            title="Data Backup"
            description="Create manual backup of system data"
            left={(props) => <List.Icon {...props} icon="backup" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleDataBackup}
          />
          <List.Item
            title="Data Export"
            description="Export system data to external formats"
            left={(props) => <List.Icon {...props} icon="file-download" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to data export */
            }}
          />
          <List.Item
            title="System Logs"
            description="View system activity and audit logs"
            left={(props) => <List.Icon {...props} icon="list-alt" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to logs */
            }}
          />
        </Card.Content>
      </Card>

      {/* Application Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Application Settings</Text>
          <List.Item
            title="Theme Settings"
            description="Configure application theme and appearance"
            left={(props) => <List.Icon {...props} icon="palette" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to theme settings */
            }}
          />
          <List.Item
            title="Language Settings"
            description="Configure supported languages"
            left={(props) => <List.Icon {...props} icon="language" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to language settings */
            }}
          />
          <List.Item
            title="Notification Settings"
            description="Configure notification preferences"
            left={(props) => <List.Icon {...props} icon="notifications-active" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to notification settings */
            }}
          />
        </Card.Content>
      </Card>

      {/* System Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">System Information</Text>
          <List.Item title="App Version" description="1.0.0" left={(props) => <List.Icon {...props} icon="info" />} />
          <List.Item
            title="Database Version"
            description="Firebase v10.7.0"
            left={(props) => <List.Icon {...props} icon="storage" />}
          />
          <List.Item
            title="Last Backup"
            description="2024-01-15 03:00 AM"
            left={(props) => <List.Icon {...props} icon="backup" />}
          />
        </Card.Content>
      </Card>

      {/* Logout */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            icon="logout"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#f44336"
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
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
  card: {
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
})

export default AdminSettings;
