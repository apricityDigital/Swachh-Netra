import React, { useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  Easing,
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
  description?: string
}

interface MenuSection {
  id: string
  title: string
  icon: string
  items: MenuItem[]
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  navigation,
  isVisible,
  onClose,
  currentScreen = "",
}) => {
  const sidebarWidth = width * 0.8
  const [slideAnim] = useState(new Animated.Value(-sidebarWidth))
  const [backdropAnim] = useState(new Animated.Value(0))

  const menuSections: MenuSection[] = [
    {
      id: "overview",
      title: "Overview",
      icon: "dashboard",
      items: [
        {
          id: "dashboard",
          title: "Dashboard",
          icon: "dashboard",
          screen: "AdminDashboard",
          description: "System overview & statistics"
        },
        {
          id: "reports",
          title: "Reports & Analytics",
          icon: "analytics",
          screen: "AdminReports",
          description: "System analytics & insights"
        }
      ]
    },
    {
      id: "user-management",
      title: "User Management",
      icon: "people",
      items: [
        {
          id: "users",
          title: "All Users",
          icon: "people",
          screen: "UserManagement",
          description: "Manage all system users"
        },
        {
          id: "contractors",
          title: "Contractors",
          icon: "business",
          screen: "ContractorManagement",
          description: "Transport contractor management"
        },
        {
          id: "drivers",
          title: "Drivers",
          icon: "person",
          screen: "DriverManagement",
          description: "Driver management & assignments"
        },
        {
          id: "swachh-hr",
          title: "Swachh-HR Staff",
          icon: "badge",
          screen: "SwachhHRManagement",
          description: "HR staff management & roles"
        }
      ]
    },
    {
      id: "resource-management",
      title: "Resource Management",
      icon: "inventory",
      items: [
        {
          id: "feeder-points",
          title: "Feeder Points",
          icon: "add-location",
          screen: "FeederPointManagement",
          description: "Waste collection points"
        },
        {
          id: "vehicles",
          title: "Vehicles",
          icon: "local-shipping",
          screen: "VehicleManagement",
          description: "Fleet management"
        }
      ]
    },
    {
      id: "assignments",
      title: "Assignment Management",
      icon: "assignment",
      items: [
        {
          id: "point-assignments",
          title: "Point Assignments",
          icon: "assignment",
          screen: "FeederPointAssignment",
          description: "Assign points to contractors"
        },
        {
          id: "vehicle-assignments",
          title: "Vehicle Assignments",
          icon: "assignment-ind",
          screen: "VehicleAssignment",
          description: "Assign vehicles to contractors"
        }
      ]
    },
    {
      id: "system",
      title: "System",
      icon: "settings",
      items: [
        {
          id: "settings",
          title: "Settings",
          icon: "settings",
          screen: "AdminSettings",
          description: "System configuration"
        }
      ]
    }
  ]

  React.useEffect(() => {
    // Animate sidebar slide
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -sidebarWidth,
      duration: 250,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start()

    // Animate backdrop fade
    Animated.timing(backdropAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start()
  }, [isVisible, slideAnim, backdropAnim, sidebarWidth])

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
      {/* Animated Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: backdropAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

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

        {/* Menu Items - Now Scrollable */}
        <ScrollView
          style={styles.menuContainer}
          contentContainerStyle={styles.menuContentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {menuSections.map((section) => (
            <View key={section.id} style={styles.menuSection}>
              <View style={styles.sectionHeader}>
                <MaterialIcons
                  name={section.icon as any}
                  size={18}
                  color="#3b82f6"
                />
                <Text style={styles.menuSectionTitle}>{section.title.toUpperCase()}</Text>
              </View>

              {section.items.map((item) => (
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
                    <View style={styles.menuItemTextContainer}>
                      <Text
                        style={[
                          styles.menuItemText,
                          isCurrentScreen(item.screen) && styles.activeMenuItemText,
                        ]}
                      >
                        {item.title}
                      </Text>
                      {item.description && (
                        <Text style={styles.menuItemDescription}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

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
    zIndex: 9999,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: "#ffffff",
    zIndex: 10000,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
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
  },
  menuContentContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  menuSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 4,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.8,
    marginLeft: 8,
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
  menuItemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    lineHeight: 20,
  },
  menuItemDescription: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
    lineHeight: 16,
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
