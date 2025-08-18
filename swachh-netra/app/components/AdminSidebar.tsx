import React, { useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native"
import { Text } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

interface AdminSidebarProps {
  navigation: any
  isVisible: boolean
  onClose: () => void
  currentScreen?: string
}

interface MenuItem {
  id: string
  title: string
  icon: string
  screen: string
  badge?: number
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  navigation,
  isVisible,
  onClose,
  currentScreen = "",
}) => {
  const [slideAnim] = useState(new Animated.Value(-width * 0.8))

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "dashboard",
      screen: "AdminDashboard",
    },
    {
      id: "users",
      title: "User Management",
      icon: "people",
      screen: "UserManagement",
    },
    {
      id: "feeder-points",
      title: "Feeder Points",
      icon: "location-on",
      screen: "FeederPointManagement",
    },
    {
      id: "assignments",
      title: "Point Assignments",
      icon: "assignment",
      screen: "FeederPointAssignment",
    },
    {
      id: "vehicles",
      title: "Vehicle Management",
      icon: "local-shipping",
      screen: "VehicleManagement",
    },
    {
      id: "vehicle-assignments",
      title: "Vehicle Assignments",
      icon: "assignment-ind",
      screen: "VehicleAssignment",
    },
    {
      id: "contractors",
      title: "Contractors",
      icon: "business",
      screen: "ContractorManagement",
    },
    {
      id: "drivers",
      title: "Drivers",
      icon: "local-shipping",
      screen: "DriverManagement",
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      icon: "analytics",
      screen: "AdminReports",
    },
    {
      id: "settings",
      title: "System Settings",
      icon: "settings",
      screen: "AdminSettings",
    },
  ]

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -width * 0.8,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [isVisible])

  const handleMenuPress = (screen: string) => {
    onClose()
    if (screen !== currentScreen) {
      navigation.navigate(screen)
    }
  }

  const isCurrentScreen = (screen: string) => {
    return currentScreen === screen
  }

  if (!isVisible) return null

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      
      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.adminBadge}>
              <MaterialIcons name="admin-panel-settings" size={24} color="#3b82f6" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Admin Panel</Text>
              <Text style={styles.headerSubtitle}>System Management</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>MAIN MENU</Text>
          
          {menuItems.slice(0, 4).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isCurrentScreen(item.screen) && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons
                  name={item.icon as any}
                  size={22}
                  color={isCurrentScreen(item.screen) ? "#3b82f6" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    isCurrentScreen(item.screen) && styles.activeMenuItemText,
                  ]}
                >
                  {item.title}
                </Text>
              </View>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.menuSectionTitle}>MANAGEMENT</Text>
          
          {menuItems.slice(4, 6).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isCurrentScreen(item.screen) && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons
                  name={item.icon as any}
                  size={22}
                  color={isCurrentScreen(item.screen) ? "#3b82f6" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    isCurrentScreen(item.screen) && styles.activeMenuItemText,
                  ]}
                >
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.menuSectionTitle}>SYSTEM</Text>
          
          {menuItems.slice(6).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                isCurrentScreen(item.screen) && styles.activeMenuItem,
              ]}
              onPress={() => handleMenuPress(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons
                  name={item.icon as any}
                  size={22}
                  color={isCurrentScreen(item.screen) ? "#3b82f6" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    isCurrentScreen(item.screen) && styles.activeMenuItemText,
                  ]}
                >
                  {item.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Swachh Netra v1.0</Text>
          <Text style={styles.footerSubtext}>Admin Dashboard</Text>
        </View>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: "#ffffff",
    zIndex: 1000,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  headerContent: {
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
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    letterSpacing: 0.5,
    marginLeft: 20,
    marginBottom: 12,
    marginTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  activeMenuItem: {
    backgroundColor: "#eff6ff",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 12,
  },
  activeMenuItemText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  footerSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
})

export default AdminSidebar
