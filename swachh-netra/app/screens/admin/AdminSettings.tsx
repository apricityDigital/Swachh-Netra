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
  Switch,
} from "react-native"
import { Card, Text, Button, TextInput, Divider } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import AdminSidebar from "../../components/AdminSidebar"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"
import { useQuickLogout } from "../../hooks/useLogout"

interface SystemSettings {
  maintenanceMode: boolean
  allowNewRegistrations: boolean
  requireApprovalForDrivers: boolean
  requireApprovalForContractors: boolean
  maxVehiclesPerContractor: number
  maxFeederPointsPerContractor: number
  systemNotifications: boolean
  emailNotifications: boolean
  smsNotifications: boolean
}

const AdminSettings = ({ navigation }: any) => {
  const { hasAccess, userData } = useRequireAdmin(navigation)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireApprovalForDrivers: true,
    requireApprovalForContractors: true,
    maxVehiclesPerContractor: 10,
    maxFeederPointsPerContractor: 20,
    systemNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // TODO: Load settings from Firestore
      // For now, using default values
    } catch (error) {
      console.error("Error loading settings:", error)
      Alert.alert("Error", "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setLoading(true)
      // TODO: Save settings to Firestore
      Alert.alert("Success", "Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      Alert.alert("Error", "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all settings to default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setSettings({
              maintenanceMode: false,
              allowNewRegistrations: true,
              requireApprovalForDrivers: true,
              requireApprovalForContractors: true,
              maxVehiclesPerContractor: 10,
              maxFeederPointsPerContractor: 20,
              systemNotifications: true,
              emailNotifications: true,
              smsNotifications: false,
            })
            Alert.alert("Success", "Settings reset to defaults")
          }
        }
      ]
    )
  }

  // Using professional logout - import useQuickLogout at the top
  const { quickLogout, AlertComponent } = useQuickLogout(navigation)

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    icon: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <MaterialIcons name={icon as any} size={24} color="#6b7280" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#f3f4f6", true: "#dbeafe" }}
        thumbColor={value ? "#3b82f6" : "#9ca3af"}
      />
    </View>
  )

  const renderNumberSetting = (
    title: string,
    description: string,
    value: number,
    onChangeText: (text: string) => void,
    icon: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <MaterialIcons name={icon as any} size={24} color="#6b7280" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <TextInput
        value={value.toString()}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={styles.numberInput}
        mode="outlined"
        dense
      />
    </View>
  )

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
            <Text style={styles.headerTitle}>System Settings</Text>
            <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
              <MaterialIcons name="save" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* System Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Configuration</Text>
            <Card style={styles.settingsCard}>
              {renderSettingItem(
                "Maintenance Mode",
                "Temporarily disable system access for maintenance",
                settings.maintenanceMode,
                () => updateSetting("maintenanceMode", !settings.maintenanceMode),
                "build"
              )}
              <Divider />
              {renderSettingItem(
                "Allow New Registrations",
                "Enable new user registrations",
                settings.allowNewRegistrations,
                () => updateSetting("allowNewRegistrations", !settings.allowNewRegistrations),
                "person-add"
              )}
            </Card>
          </View>

          {/* User Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Management</Text>
            <Card style={styles.settingsCard}>
              {renderSettingItem(
                "Require Driver Approval",
                "New drivers need admin approval",
                settings.requireApprovalForDrivers,
                () => updateSetting("requireApprovalForDrivers", !settings.requireApprovalForDrivers),
                "local-shipping"
              )}
              <Divider />
              {renderSettingItem(
                "Require Contractor Approval",
                "New contractors need admin approval",
                settings.requireApprovalForContractors,
                () => updateSetting("requireApprovalForContractors", !settings.requireApprovalForContractors),
                "business"
              )}
            </Card>
          </View>

          {/* Limits Configuration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Limits</Text>
            <Card style={styles.settingsCard}>
              {renderNumberSetting(
                "Max Vehicles per Contractor",
                "Maximum vehicles a contractor can manage",
                settings.maxVehiclesPerContractor,
                (text) => updateSetting("maxVehiclesPerContractor", parseInt(text) || 0),
                "local-shipping"
              )}
              <Divider />
              {renderNumberSetting(
                "Max Feeder Points per Contractor",
                "Maximum feeder points a contractor can manage",
                settings.maxFeederPointsPerContractor,
                (text) => updateSetting("maxFeederPointsPerContractor", parseInt(text) || 0),
                "location-on"
              )}
            </Card>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Card style={styles.settingsCard}>
              {renderSettingItem(
                "System Notifications",
                "Enable in-app notifications",
                settings.systemNotifications,
                () => updateSetting("systemNotifications", !settings.systemNotifications),
                "notifications"
              )}
              <Divider />
              {renderSettingItem(
                "Email Notifications",
                "Send notifications via email",
                settings.emailNotifications,
                () => updateSetting("emailNotifications", !settings.emailNotifications),
                "email"
              )}
              <Divider />
              {renderSettingItem(
                "SMS Notifications",
                "Send notifications via SMS",
                settings.smsNotifications,
                () => updateSetting("smsNotifications", !settings.smsNotifications),
                "sms"
              )}
            </Card>
          </View>

          {/* Admin Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Actions</Text>
            <Card style={styles.actionsCard}>
              <TouchableOpacity style={styles.actionButton} onPress={resetToDefaults}>
                <MaterialIcons name="restore" size={24} color="#f59e0b" />
                <Text style={[styles.actionButtonText, { color: "#f59e0b" }]}>
                  Reset to Defaults
                </Text>
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity style={styles.actionButton} onPress={quickLogout}>
                <MaterialIcons name="logout" size={24} color="#ef4444" />
                <Text style={[styles.actionButtonText, { color: "#ef4444" }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </Card>
          </View>

          {/* System Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Information</Text>
            <Card style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Admin User:</Text>
                <Text style={styles.infoValue}>{userData?.fullName || "Administrator"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{userData?.email || "admin@swachhnetra.com"}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>App Version:</Text>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Last Updated:</Text>
                <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
              </View>
            </Card>
          </View>
        </ScrollView>

        {/* Admin Sidebar */}
        <AdminSidebar
          navigation={navigation}
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentScreen="AdminSettings"
        />

        {/* Professional Alert Component */}
        <AlertComponent />
      </SafeAreaView>
    </ProtectedRoute>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  saveButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  settingsCard: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  settingDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  numberInput: {
    width: 80,
    height: 40,
  },
  actionsCard: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 16,
  },
  infoCard: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
})

export default AdminSettings
