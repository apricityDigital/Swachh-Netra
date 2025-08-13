"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Card, Text, Button, Avatar, List, Switch } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { signOut } from "firebase/auth"
import { FIREBASE_AUTH } from "../../../../FirebaseConfig"

const DriverProfile = () => {
  const [driverData] = useState({
    name: "Rajesh Kumar",
    id: "DRV001",
    phone: "+91 9876543210",
    email: "rajesh.kumar@swachhnetra.com",
    zone: "Zone A - Sector 15-20",
    joinDate: "2023-06-15",
    totalTrips: 1250,
    rating: 4.8,
  })

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [locationEnabled, setLocationEnabled] = useState(true)

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

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Profile
      </Text>

      {/* Profile Header */}
      <Card style={styles.card}>
        <Card.Content style={styles.profileHeader}>
          <Avatar.Text
            size={80}
            label={driverData.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text variant="headlineSmall">{driverData.name}</Text>
            <Text variant="bodyMedium" style={styles.driverId}>
              ID: {driverData.id}
            </Text>
            <Text variant="bodyMedium" style={styles.zone}>
              {driverData.zone}
            </Text>
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#ffc107" />
              <Text variant="bodySmall" style={styles.rating}>
                {driverData.rating} Rating
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Statistics */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialIcons name="local-shipping" size={24} color="#1976d2" />
              <Text variant="bodySmall">Total Trips</Text>
              <Text variant="titleMedium">{driverData.totalTrips}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="calendar-today" size={24} color="#4caf50" />
              <Text variant="bodySmall">Experience</Text>
              <Text variant="titleMedium">1.5 Years</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={24} color="#ff9800" />
              <Text variant="bodySmall">Performance</Text>
              <Text variant="titleMedium">Excellent</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Contact Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Contact Information</Text>
          <List.Item
            title="Phone"
            description={driverData.phone}
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          <List.Item
            title="Email"
            description={driverData.email}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          <List.Item
            title="Join Date"
            description={driverData.joinDate}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Settings</Text>
          <List.Item
            title="Notifications"
            description="Receive push notifications"
            left={(props) => <List.Icon {...props} icon="notifications" />}
            right={() => <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
          />
          <List.Item
            title="Location Services"
            description="Allow location tracking"
            left={(props) => <List.Icon {...props} icon="location-on" />}
            right={() => <Switch value={locationEnabled} onValueChange={setLocationEnabled} />}
          />
          <List.Item
            title="Language"
            description="English"
            left={(props) => <List.Icon {...props} icon="language" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Handle language selection */
            }}
          />
        </Card.Content>
      </Card>

      {/* Help & Support */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Help & Support</Text>
          <List.Item
            title="Help Center"
            description="Get help and support"
            left={(props) => <List.Icon {...props} icon="help" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to help */
            }}
          />
          <List.Item
            title="Report Issue"
            description="Report a problem"
            left={(props) => <List.Icon {...props} icon="report-problem" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Navigate to report issue */
            }}
          />
          <List.Item
            title="Contact Support"
            description="Get in touch with support team"
            left={(props) => <List.Icon {...props} icon="support-agent" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              /* Contact support */
            }}
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#1976d2",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  driverId: {
    color: "#666",
    marginTop: 4,
  },
  zone: {
    color: "#666",
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  rating: {
    marginLeft: 4,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
  },
  logoutButton: {
    marginTop: 8,
  },
})

export default DriverProfile
