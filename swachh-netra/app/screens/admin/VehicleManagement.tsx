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
  FlatList,
} from "react-native"
import { Card, Text, TextInput, Button, Chip, FAB } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { FIREBASE_AUTH } from "../../../FirebaseConfig"
import AdminSidebar from "../../components/AdminSidebar"
import { VehicleService, Vehicle } from "../../../services/VehicleService"
import ProtectedRoute from "../../components/ProtectedRoute"
import { useRequireAdmin } from "../../hooks/useRequireAuth"

const VehicleManagement = ({ navigation }: any) => {
  const { hasAccess, userData } = useRequireAdmin(navigation)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    vehicleName: "",
    capacity: "",
    vehicleType: "",
    status: "active" as Vehicle["status"],
    manufacturer: "",
    model: "",
    year: "",
    fuelType: "diesel",
  })

  const vehicleTypes = [
    { value: "truck", label: "Truck", minCapacity: 5, maxCapacity: 20 },
    { value: "van", label: "Van", minCapacity: 2, maxCapacity: 8 },
    { value: "compactor", label: "Compactor", minCapacity: 10, maxCapacity: 25 },
    { value: "tipper", label: "Tipper", minCapacity: 8, maxCapacity: 15 },
  ]

  const fuelTypes = ["diesel", "petrol", "cng", "electric"]
  const statusOptions = ["active", "inactive", "maintenance"]

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      console.log("Fetching vehicles...")
      setLoading(true)
      const vehicleList = await VehicleService.getAllVehicles()
      console.log("Fetched vehicles:", vehicleList.length)
      console.log("Vehicle data sample:", vehicleList[0])
      setVehicles(vehicleList)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      console.error("Error details:", error)
      Alert.alert("Error", `Failed to fetch vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const updateFormField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    if (!formData.vehicleNumber.trim()) {
      Alert.alert("Validation Error", "Vehicle number is required")
      return false
    }
    if (!formData.vehicleName.trim()) {
      Alert.alert("Validation Error", "Vehicle name is required")
      return false
    }
    if (!formData.capacity.trim() || isNaN(Number(formData.capacity))) {
      Alert.alert("Validation Error", "Valid capacity is required")
      return false
    }
    if (!formData.vehicleType.trim()) {
      Alert.alert("Validation Error", "Vehicle type is required")
      return false
    }

    // Validate capacity based on vehicle type
    const selectedType = vehicleTypes.find(type => type.value === formData.vehicleType)
    const capacity = Number(formData.capacity)

    if (capacity <= 0) {
      Alert.alert("Validation Error", "Capacity must be greater than 0")
      return false
    }

    if (selectedType) {
      if (capacity < selectedType.minCapacity || capacity > selectedType.maxCapacity) {
        Alert.alert(
          "Validation Error",
          `${selectedType.label} capacity must be between ${selectedType.minCapacity} and ${selectedType.maxCapacity} tons`
        )
        return false
      }
    }

    // Validate vehicle number format (basic check)
    const vehicleNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/
    if (!vehicleNumberRegex.test(formData.vehicleNumber.trim().toUpperCase())) {
      Alert.alert("Validation Error", "Please enter a valid vehicle number (e.g., MH12AB1234)")
      return false
    }

    return true
  }

  const saveVehicle = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      console.log("Saving vehicle...")

      const user = FIREBASE_AUTH.currentUser
      const vehicleData = {
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        vehicleName: formData.vehicleName.trim(),
        capacity: Number(formData.capacity),
        vehicleType: formData.vehicleType.trim(),
        status: formData.status,
        manufacturer: formData.manufacturer.trim(),
        model: formData.model.trim(),
        year: formData.year ? Number(formData.year) : new Date().getFullYear(),
        fuelType: formData.fuelType,
        registrationDate: new Date(),
        createdBy: user?.uid || "admin",
        isActive: formData.status === "active",
        lastMaintenanceDate: null,
        nextMaintenanceDate: null,
      }

      if (editingVehicle) {
        await VehicleService.updateVehicle(editingVehicle.id!, vehicleData)
        Alert.alert("Success", "Vehicle updated successfully")
      } else {
        const vehicleId = await VehicleService.createVehicle(vehicleData)
        console.log("Vehicle created with ID:", vehicleId)
        Alert.alert("Success", "Vehicle created successfully")
      }

      // Reset form and refresh list
      setShowForm(false)
      setEditingVehicle(null)
      setFormData({
        vehicleNumber: "",
        vehicleName: "",
        capacity: "",
        vehicleType: "",
        status: "active",
        manufacturer: "",
        model: "",
        year: "",
        fuelType: "diesel",
      })
      fetchVehicles()
    } catch (error) {
      console.error("Error saving vehicle:", error)
      Alert.alert("Error", `Failed to save vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const editVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleName: vehicle.vehicleName || "",
      capacity: vehicle.capacity.toString(),
      vehicleType: vehicle.vehicleType,
      status: vehicle.status,
      manufacturer: vehicle.manufacturer || "",
      model: vehicle.model || "",
      year: vehicle.year ? vehicle.year.toString() : "",
      fuelType: vehicle.fuelType || "diesel",
    })
    setShowForm(true)
  }

  const toggleVehicleStatus = async (vehicle: Vehicle) => {
    const newStatus = vehicle.status === "active" ? "inactive" : "active"
    const actionText = newStatus === "active" ? "activate" : "deactivate"

    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Vehicle`,
      `Are you sure you want to ${actionText} vehicle ${vehicle.vehicleNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: newStatus === "active" ? "default" : "destructive",
          onPress: async () => {
            try {
              setLoading(true)
              await VehicleService.toggleVehicleStatus(vehicle.id!)
              Alert.alert("Success", `Vehicle ${actionText}d successfully`)
              fetchVehicles()
            } catch (error) {
              console.error(`Error ${actionText}ing vehicle:`, error)
              Alert.alert("Error", `Failed to ${actionText} vehicle`)
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const deleteVehicle = async (vehicle: Vehicle) => {
    Alert.alert(
      "Delete Vehicle",
      `Are you sure you want to delete vehicle ${vehicle.vehicleNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true)
              await VehicleService.deleteVehicle(vehicle.id!)
              Alert.alert("Success", "Vehicle deleted successfully")
              fetchVehicles()
            } catch (error) {
              Alert.alert("Error", "Failed to delete vehicle")
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const getStatusColor = (status: Vehicle["status"]) => {
    switch (status) {
      case "active": return "#10b981"
      case "maintenance": return "#f59e0b"
      case "inactive": return "#ef4444"
      default: return "#6b7280"
    }
  }

  const getStatusIcon = (status: Vehicle["status"]) => {
    switch (status) {
      case "active": return "check-circle"
      case "maintenance": return "build"
      case "inactive": return "cancel"
      default: return "help"
    }
  }

  const renderVehicleCard = ({ item }: { item: Vehicle }) => (
    <Card style={styles.vehicleCard}>
      <View style={styles.vehicleContent}>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleNumber}>{item.vehicleNumber}</Text>
            {item.vehicleName && <Text style={styles.vehicleName}>{item.vehicleName}</Text>}
            <Text style={styles.vehicleType}>{item.vehicleType}</Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: `${getStatusColor(item.status)}20` }]}
            textStyle={[styles.statusChipText, { color: getStatusColor(item.status) }]}
            icon={getStatusIcon(item.status)}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.vehicleDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="local-shipping" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Capacity: {item.capacity} tons</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="calendar-today" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              Registered: {new Date(item.registrationDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.vehicleActions}>
          <Button
            mode="outlined"
            onPress={() => editVehicle(item)}
            style={styles.actionButton}
            icon="edit"
          >
            Edit
          </Button>
          <Button
            mode="outlined"
            onPress={() => toggleVehicleStatus(item)}
            style={[styles.actionButton, item.status === "active" ? styles.deactivateButton : styles.activateButton]}
            textColor={item.status === "active" ? "#ef4444" : "#10b981"}
            icon={item.status === "active" ? "block" : "check-circle"}
          >
            {item.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            mode="outlined"
            onPress={() => deleteVehicle(item)}
            style={[styles.actionButton, styles.deleteButton]}
            textColor="#ef4444"
            icon="delete"
          >
            Delete
          </Button>
        </View>
      </View>
    </Card>
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

            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Vehicle Management</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Statistics Cards */}
          <View style={styles.statsContainer}>
            <Card style={styles.statsCard}>
              <View style={styles.statsContent}>
                <MaterialIcons name="local-shipping" size={32} color="#3b82f6" />
                <Text style={styles.statsNumber}>{vehicles.length}</Text>
                <Text style={styles.statsLabel}>Total Vehicles</Text>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <View style={styles.statsContent}>
                <MaterialIcons name="check-circle" size={32} color="#10b981" />
                <Text style={styles.statsNumber}>
                  {vehicles.filter(v => v.status === "active").length}
                </Text>
                <Text style={styles.statsLabel}>Active</Text>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <View style={styles.statsContent}>
                <MaterialIcons name="build" size={32} color="#f59e0b" />
                <Text style={styles.statsNumber}>
                  {vehicles.filter(v => v.status === "maintenance").length}
                </Text>
                <Text style={styles.statsLabel}>Maintenance</Text>
              </View>
            </Card>
          </View>

          {/* Vehicle Form */}
          {showForm && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </Text>

              <Card style={styles.formCard}>
                <View style={styles.cardContent}>
                  <TextInput
                    label="Vehicle Number *"
                    value={formData.vehicleNumber}
                    onChangeText={(text) => updateFormField("vehicleNumber", text)}
                    style={styles.input}
                    mode="outlined"
                    placeholder="e.g., MH12AB1234"
                    autoCapitalize="characters"
                  />

                  <TextInput
                    label="Vehicle Name *"
                    value={formData.vehicleName}
                    onChangeText={(text) => updateFormField("vehicleName", text)}
                    style={styles.input}
                    mode="outlined"
                    placeholder="e.g., Garbage Truck 1, Compactor A"
                  />

                  <TextInput
                    label="Capacity (tons) *"
                    value={formData.capacity}
                    onChangeText={(text) => updateFormField("capacity", text)}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="numeric"
                    placeholder="e.g., 5"
                  />

                  <TextInput
                    label="Vehicle Type *"
                    value={formData.vehicleType}
                    onChangeText={(text) => updateFormField("vehicleType", text)}
                    style={styles.input}
                    mode="outlined"
                    placeholder="e.g., Garbage Truck, Compactor"
                  />

                  <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Status</Text>
                    <View style={styles.statusButtons}>
                      {(["active", "maintenance", "inactive"] as Vehicle["status"][]).map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusButton,
                            formData.status === status && styles.statusButtonActive
                          ]}
                          onPress={() => updateFormField("status", status)}
                        >
                          <Text style={[
                            styles.statusButtonText,
                            formData.status === status && styles.statusButtonTextActive
                          ]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formActions}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setShowForm(false)
                        setEditingVehicle(null)
                        setFormData({
                          vehicleNumber: "",
                          vehicleName: "",
                          capacity: "",
                          vehicleType: "",
                          status: "active",
                          manufacturer: "",
                          model: "",
                          year: "",
                          fuelType: "diesel",
                        })
                      }}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={saveVehicle}
                      loading={loading}
                      style={styles.saveButton}
                      icon="save"
                    >
                      {editingVehicle ? "Update Vehicle" : "Create Vehicle"}
                    </Button>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Vehicles List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Registered Vehicles</Text>

            {vehicles.length > 0 ? (
              <FlatList
                data={vehicles}
                renderItem={renderVehicleCard}
                keyExtractor={(item) => item.id || ""}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyContent}>
                  <MaterialIcons name="local-shipping" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>No vehicles registered</Text>
                  <Text style={styles.emptySubtext}>
                    Add your first garbage vehicle to get started
                  </Text>
                </View>
              </Card>
            )}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => setShowForm(true)}
          label="Add Vehicle"
        />

        {/* Admin Sidebar */}
        <AdminSidebar
          navigation={navigation}
          isVisible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          currentScreen="VehicleManagement"
        />
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
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statsContent: {
    padding: 16,
    alignItems: "center",
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  statsLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardContent: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  statusButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  statusButtonTextActive: {
    color: "#ffffff",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  vehicleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 12,
  },
  vehicleContent: {
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusChip: {
    height: 32,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  vehicleDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  vehicleActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: "#ef4444",
  },
  activateButton: {
    borderColor: "#10b981",
  },
  deactivateButton: {
    borderColor: "#ef4444",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyContent: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#3b82f6",
  },
})

export default VehicleManagement
