import React, { useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native"
import { Card, Text, Chip, Modal, Portal, Button, RadioButton } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"

// Local style constants to avoid import issues
const COLORS = {
  white: "#ffffff",
  primary: "#2563eb",
  primaryLight: "#eff6ff",
  secondary: "#059669",
  secondaryLight: "#f0fdf4",
  accent: "#d97706",
  accentLight: "#fffbeb",
  error: "#dc2626",
  errorLight: "#fef2f2",
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  gray200: "#e5e7eb",
}

const SPACING = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
}

const FONT_SIZES = {
  sm: 12,
  md: 14,
  xl: 18,
}

const FONT_WEIGHTS = {
  semibold: "600" as const,
  bold: "700" as const,
}

interface RoleManagementProps {
  currentRole: "admin" | "swachh_hr" | "contractor" | "driver"
  userId: string
  userName: string
  onRoleChange: (userId: string, newRole: string) => Promise<void>
  disabled?: boolean
  showAllRoles?: boolean
}

const ROLE_DEFINITIONS = {
  admin: {
    label: "👑 Administrator",
    description: "Full system access and management",
    color: COLORS.error,
    bgColor: COLORS.errorLight,
    permissions: [
      "🔧 System configuration",
      "👥 User management",
      "📊 All reports access",
      "🗑️ Delete operations",
      "⚙️ Role assignments",
    ],
  },
  swachh_hr: {
    label: "👨‍💼 Swachh-HR",
    description: "HR operations and staff management",
    color: COLORS.primary,
    bgColor: COLORS.primaryLight,
    permissions: [
      "👥 Staff management",
      "📋 Attendance tracking",
      "📊 HR reports",
      "📝 Performance reviews",
      "💰 Payroll access",
    ],
  },
  contractor: {
    label: "🏢 Contractor",
    description: "Fleet and driver management",
    color: COLORS.secondary,
    bgColor: COLORS.secondaryLight,
    permissions: [
      "🚛 Vehicle management",
      "👨‍✈️ Driver assignments",
      "📍 Route planning",
      "📊 Fleet reports",
      "✅ Driver approvals",
    ],
  },
  driver: {
    label: "🚗 Driver",
    description: "Vehicle operation and route execution",
    color: COLORS.accent,
    bgColor: COLORS.accentLight,
    permissions: [
      "🗺️ Route access",
      "📱 Trip logging",
      "⚠️ Issue reporting",
      "📊 Personal reports",
      "📞 Support access",
    ],
  },
}

const RoleManagement: React.FC<RoleManagementProps> = ({
  currentRole,
  userId,
  userName,
  onRoleChange,
  disabled = false,
  showAllRoles = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  const availableRoles = showAllRoles
    ? Object.keys(ROLE_DEFINITIONS)
    : Object.keys(ROLE_DEFINITIONS).filter(role => role !== "admin")

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      setModalVisible(false)
      return
    }

    Alert.alert(
      "🔄 Confirm Role Change",
      `Are you sure you want to change ${userName}'s role from ${ROLE_DEFINITIONS[currentRole].label} to ${ROLE_DEFINITIONS[selectedRole as keyof typeof ROLE_DEFINITIONS].label}?`,
      [
        {
          text: "❌ Cancel",
          style: "cancel",
        },
        {
          text: "✅ Confirm",
          onPress: async () => {
            setLoading(true)
            try {
              await onRoleChange(userId, selectedRole)
              setModalVisible(false)
              Alert.alert("✅ Success", "Role updated successfully")
            } catch (error) {
              Alert.alert("❌ Error", "Failed to update role")
              setSelectedRole(currentRole) // Reset selection
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const currentRoleInfo = ROLE_DEFINITIONS[currentRole]

  return (
    <>
      <TouchableOpacity
        style={[styles.roleCard, disabled && styles.disabledCard]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.roleHeader}>
          <Chip
            style={[styles.roleChip, { backgroundColor: currentRoleInfo.bgColor }]}
            textStyle={[styles.roleChipText, { color: currentRoleInfo.color }]}
          >
            {currentRoleInfo.label}
          </Chip>
          {!disabled && (
            <MaterialIcons name="edit" size={20} color={COLORS.textSecondary} />
          )}
        </View>
        <Text style={styles.roleDescription}>{currentRoleInfo.description}</Text>
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>🔄 Change User Role</Text>
          <Text style={styles.modalSubtitle}>
            Changing role for: <Text style={styles.boldText}>{userName}</Text>
          </Text>

          <View style={styles.rolesContainer}>
            {availableRoles.map((role) => {
              const roleInfo = ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]
              return (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    selectedRole === role && styles.selectedRoleOption,
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <View style={styles.roleOptionHeader}>
                    <RadioButton
                      value={role}
                      status={selectedRole === role ? "checked" : "unchecked"}
                      onPress={() => setSelectedRole(role)}
                    />
                    <View style={styles.roleOptionInfo}>
                      <Text style={styles.roleOptionLabel}>{roleInfo.label}</Text>
                      <Text style={styles.roleOptionDescription}>
                        {roleInfo.description}
                      </Text>
                    </View>
                  </View>

                  {selectedRole === role && (
                    <View style={styles.permissionsContainer}>
                      <Text style={styles.permissionsTitle}>🔑 Permissions:</Text>
                      {roleInfo.permissions.map((permission, index) => (
                        <Text key={index} style={styles.permissionItem}>
                          • {permission}
                        </Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setSelectedRole(currentRole)
                setModalVisible(false)
              }}
              style={styles.modalButton}
              disabled={loading}
            >
              ❌ Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleRoleChange}
              style={styles.modalButton}
              loading={loading}
              disabled={loading || selectedRole === currentRole}
            >
              🔄 Update Role
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  )
}

const styles = StyleSheet.create({
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  disabledCard: {
    opacity: 0.6,
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  roleChip: {
    height: 28,
  },
  roleChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  roleDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Modal styles
  modalContainer: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    margin: SPACING.lg,
    borderRadius: 12,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: "center",
  },
  boldText: {
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },

  // Role options
  rolesContainer: {
    marginBottom: SPACING.xl,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  selectedRoleOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleOptionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  roleOptionInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  roleOptionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  roleOptionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Permissions
  permissionsContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  permissionsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  permissionItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
    marginLeft: SPACING.sm,
  },

  // Modal actions
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalButton: {
    minWidth: 120,
  },
})

export default RoleManagement
