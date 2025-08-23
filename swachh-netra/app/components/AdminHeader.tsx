import React from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import Typography, { Heading4, Subtitle, Caption } from "./Typography"

interface AdminHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  showMenuButton?: boolean
  showLogoutButton?: boolean
  onMenuPress?: () => void
  onBackPress?: () => void
  onLogoutPress?: () => void
  rightComponent?: React.ReactNode
  userName?: string
  isDashboard?: boolean
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  showMenuButton = true,
  showLogoutButton = false,
  onMenuPress,
  onBackPress,
  onLogoutPress,
  rightComponent,
  userName,
  isDashboard = false,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showMenuButton && (
            <TouchableOpacity
              onPress={onMenuPress}
              style={styles.iconButton}
            >
              <MaterialIcons name="menu" size={24} color="#374151" />
            </TouchableOpacity>
          )}

          {showBackButton && (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.iconButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          )}

          {isDashboard ? (
            <View style={styles.dashboardHeaderContent}>
              <View style={styles.adminBadge}>
                <MaterialIcons name="admin-panel-settings" size={24} color="#3b82f6" />
              </View>
              <View style={styles.headerText}>
                <Caption color="secondary">Welcome back,</Caption>
                <Heading4 weight="bold">{userName || "Administrator"}</Heading4>
                <Caption color="tertiary">System Administrator</Caption>
              </View>
            </View>
          ) : (
            <View style={styles.titleContainer}>
              <Heading4 weight="bold">{title}</Heading4>
              {subtitle && <Subtitle color="secondary">{subtitle}</Subtitle>}
            </View>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightComponent}
          {showLogoutButton && (
            <TouchableOpacity onPress={onLogoutPress} style={styles.iconButton}>
              <MaterialIcons name="logout" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  dashboardHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  adminBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  titleContainer: {
    flex: 1,
  },
})

export default AdminHeader
