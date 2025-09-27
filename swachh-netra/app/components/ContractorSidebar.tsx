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

interface ContractorSidebarProps {
  navigation: any
  isVisible: boolean
  onClose: () => void
  currentScreen?: string
  onSelectAction?: (actionKey: string) => void
}

interface MenuItem {
  id: string
  title: string
  icon: string
  actionKey: string
  description?: string
}

interface MenuSection {
  id: string
  title: string
  icon: string
  items: MenuItem[]
}

const ContractorSidebar: React.FC<ContractorSidebarProps> = ({
  navigation,
  isVisible,
  onClose,
  currentScreen = "",
  onSelectAction,
}) => {
  const sidebarWidth = width * 0.8
  const [slideAnim] = useState(new Animated.Value(-sidebarWidth))
  const [backdropAnim] = useState(new Animated.Value(0))

  const menuSections: MenuSection[] = [
    {
      id: "quick-actions",
      title: "Quick Actions",
      icon: "flash-on",
      items: [
        {
          id: "assign-drivers",
          title: "Assign Drivers",
          icon: "assignment-ind",
          actionKey: "DriverAssignment",
          description: "Assign vehicles and routes to drivers",
        },
        {
          id: "daily-assignments",
          title: "Daily Assignments",
          icon: "today",
          actionKey: "ContractorDailyAssignments",
          description: "Manage daily route assignments",
        },
        {
          id: "vehicle-management",
          title: "Vehicle Management",
          icon: "local-shipping",
          actionKey: "VehicleManagement",
          description: "Manage fleet and assignments",
        },
        {
          id: "trip-monitoring",
          title: "Trip Monitoring",
          icon: "track-changes",
          actionKey: "TripMonitoring",
          description: "Monitor daily trips and progress",
        },
        {
          id: "worker-attendance",
          title: "Worker Attendance",
          icon: "how-to-reg",
          actionKey: "WorkerAttendance",
          description: "View worker attendance records",
        },
        {
          id: "feeder-points",
          title: "Feeder Points",
          icon: "location-on",
          actionKey: "FeederPoints",
          description: "View assigned feeder points",
        },
        {
          id: "reports",
          title: "Reports",
          icon: "analytics",
          actionKey: "Reports",
          description: "Performance and activity reports",
        },
      ],
    },
  ]

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -sidebarWidth,
      duration: 250,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start()

    Animated.timing(backdropAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: true,
    }).start()
  }, [isVisible, slideAnim, backdropAnim, sidebarWidth])

  const handlePress = (actionKey: string) => {
    onClose()
    if (onSelectAction) {
      onSelectAction(actionKey)
    } else if (actionKey && actionKey !== currentScreen) {
      navigation.navigate(actionKey)
    }
  }

  if (!isVisible) return null

  return (
    <>
      <Animated.View
        style={[styles.overlay, { opacity: backdropAnim }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.contractorBadge}>
              <MaterialIcons name="business" size={24} color="#3b82f6" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Contractor Panel</Text>
              <Text style={styles.headerSubtitle}>Quick Access</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.menuContainer}
          contentContainerStyle={styles.menuContentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {menuSections.map((section) => (
            <View key={section.id} style={styles.menuSection}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name={section.icon as any} size={18} color="#3b82f6" />
                <Text style={styles.menuSectionTitle}>{section.title.toUpperCase()}</Text>
              </View>

              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handlePress(item.actionKey)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemContent}>
                    <MaterialIcons name={item.icon as any} size={22} color="#6b7280" />
                    <View style={styles.menuItemTextContainer}>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      {item.description && (
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      )}
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Swachh Netra v1.0</Text>
          <Text style={styles.footerSubtext}>Contractor Dashboard</Text>
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
  contractorBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  closeButton: { padding: 8, borderRadius: 8 },
  menuContainer: { flex: 1 },
  menuContentContainer: { paddingTop: 20, paddingBottom: 20 },
  menuSection: { marginBottom: 8 },
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
  menuItemContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  menuItemTextContainer: { flex: 1, marginLeft: 12 },
  menuItemText: { fontSize: 15, fontWeight: "500", color: "#374151", lineHeight: 20 },
  menuItemDescription: { fontSize: 12, color: "#9ca3af", marginTop: 2, lineHeight: 16 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#f3f4f6", alignItems: "center" },
  footerText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  footerSubtext: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
})

export default ContractorSidebar

