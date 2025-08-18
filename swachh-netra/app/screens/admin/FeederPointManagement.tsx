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
  Image,
} from "react-native"
import { Card, Text, TextInput, Button } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import { FIREBASE_AUTH } from "../../../FirebaseConfig"
import AdminSidebar from "../../components/AdminSidebar"
import { FeederPointService, FeederPoint } from "../../../services/FeederPointService"

const FeederPointManagement = ({ navigation }: any) => {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feederPoints, setFeederPoints] = useState<FeederPoint[]>([])
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<Partial<FeederPoint>>({
    areaName: "",
    areaDescription: "",
    wardNumber: "",
    populationDensity: "",
    accessibility: "",
    additionalDetails: "",
    kothiName: "",
    feederPointName: "",
    nearestLandmark: "",
    approximateHouseholds: "",
    vehicleTypes: "",
    locationPhoto: "",
    coordinates: { latitude: 0, longitude: 0 },
  })

  useEffect(() => {
    fetchFeederPoints()
    requestLocationPermission()
  }, [])

  useEffect(() => {
    if (!showForm) {
      // Reset form when closing
      setFormData({
        areaName: "",
        areaDescription: "",
        wardNumber: "",
        populationDensity: "",
        accessibility: "",
        additionalDetails: "",
        kothiName: "",
        feederPointName: "",
        nearestLandmark: "",
        approximateHouseholds: "",
        vehicleTypes: "",
        locationPhoto: "",
        coordinates: { latitude: 0, longitude: 0 },
      })
    }
  }, [showForm])

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location permission is required to create feeder points")
    }
  }

  const fetchFeederPoints = async () => {
    try {
      console.log("Fetching feeder points...")
      const points = await FeederPointService.getAllFeederPoints()
      console.log("Fetched feeder points:", points.length)
      setFeederPoints(points)
    } catch (error) {
      console.error("Error fetching feeder points:", error)
      Alert.alert("Error", `Failed to fetch feeder points: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getCurrentLocation = async () => {
    try {
      setLoading(true)
      const location = await Location.getCurrentPositionAsync({})
      setFormData(prev => ({
        ...prev,
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      }))
      Alert.alert("Success", "Current location captured successfully")
    } catch (error) {
      Alert.alert("Error", "Failed to get current location")
    } finally {
      setLoading(false)
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          locationPhoto: result.assets[0].uri
        }))
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled) {
        setFormData(prev => ({
          ...prev,
          locationPhoto: result.assets[0].uri
        }))
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo")
    }
  }

  const validateForm = (): boolean => {
    const required = [
      "areaName", "wardNumber", "kothiName", "feederPointName", 
      "nearestLandmark", "approximateHouseholds", "vehicleTypes"
    ]
    
    for (const field of required) {
      if (!formData[field as keyof FeederPoint]) {
        Alert.alert("Validation Error", `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`)
        return false
      }
    }
    
    if (!formData.coordinates?.latitude || !formData.coordinates?.longitude) {
      Alert.alert("Validation Error", "Location coordinates are required")
      return false
    }
    
    return true
  }

  const saveFeederPoint = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      console.log("Saving feeder point...")

      const user = FIREBASE_AUTH.currentUser
      const feederPointData = {
        ...formData,
        createdBy: user?.uid || "admin",
      } as Omit<FeederPoint, "id" | "createdAt" | "isActive">

      console.log("Feeder point data:", feederPointData)
      const feederPointId = await FeederPointService.createFeederPoint(feederPointData)
      console.log("Feeder point created with ID:", feederPointId)

      Alert.alert("Success", "Feeder point created successfully", [
        { text: "OK", onPress: () => {
          setShowForm(false)
          setFormData({
            areaName: "",
            areaDescription: "",
            wardNumber: "",
            populationDensity: "",
            accessibility: "",
            additionalDetails: "",
            kothiName: "",
            feederPointName: "",
            nearestLandmark: "",
            approximateHouseholds: "",
            vehicleTypes: "",
            locationPhoto: "",
            coordinates: { latitude: 0, longitude: 0 },
          })
          fetchFeederPoints()
        }}
      ])
    } catch (error) {
      console.error("Error saving feeder point:", error)
      Alert.alert("Error", `Failed to save feeder point: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const updateFormField = (field: keyof FeederPoint, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
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
            <Text style={styles.headerTitle}>Feeder Point Management</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowForm(!showForm)} 
            style={styles.addButton}
          >
            <MaterialIcons name={showForm ? "close" : "add"} size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create New Feeder Point</Text>
            
            {/* Basic Information */}
            <Card style={styles.formCard}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Basic Information</Text>
                
                <TextInput
                  label="Area Name *"
                  value={formData.areaName}
                  onChangeText={(text) => updateFormField("areaName", text)}
                  style={styles.input}
                  mode="outlined"
                />
                
                <TextInput
                  label="Area Description"
                  value={formData.areaDescription}
                  onChangeText={(text) => updateFormField("areaDescription", text)}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                />
                
                <TextInput
                  label="Ward Number *"
                  value={formData.wardNumber}
                  onChangeText={(text) => updateFormField("wardNumber", text)}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                />
                
                <TextInput
                  label="Population Density"
                  value={formData.populationDensity}
                  onChangeText={(text) => updateFormField("populationDensity", text)}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., High, Medium, Low"
                />
                
                <TextInput
                  label="Accessibility"
                  value={formData.accessibility}
                  onChangeText={(text) => updateFormField("accessibility", text)}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., Easy, Moderate, Difficult"
                />

                <TextInput
                  label="Additional Details"
                  value={formData.additionalDetails}
                  onChangeText={(text) => updateFormField("additionalDetails", text)}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                  placeholder="Any additional information"
                />
              </View>
            </Card>

            {/* Detailed Information */}
            <Card style={styles.formCard}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Detailed Information</Text>

                <TextInput
                  label="Kothi Name *"
                  value={formData.kothiName}
                  onChangeText={(text) => updateFormField("kothiName", text)}
                  style={styles.input}
                  mode="outlined"
                />

                <TextInput
                  label="Feeder Point Name *"
                  value={formData.feederPointName}
                  onChangeText={(text) => updateFormField("feederPointName", text)}
                  style={styles.input}
                  mode="outlined"
                />

                <TextInput
                  label="Nearest Landmark/Address *"
                  value={formData.nearestLandmark}
                  onChangeText={(text) => updateFormField("nearestLandmark", text)}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={2}
                />

                <TextInput
                  label="Approximate Number of Households *"
                  value={formData.approximateHouseholds}
                  onChangeText={(text) => updateFormField("approximateHouseholds", text)}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                />

                <TextInput
                  label="Types of Vehicles Used for Collections *"
                  value={formData.vehicleTypes}
                  onChangeText={(text) => updateFormField("vehicleTypes", text)}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., Truck, Auto, Cycle"
                />
              </View>
            </Card>

            {/* Location & Photo */}
            <Card style={styles.formCard}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Location & Photo</Text>

                <View style={styles.locationSection}>
                  <Text style={styles.locationLabel}>Location Coordinates</Text>
                  {formData.coordinates?.latitude && formData.coordinates?.longitude ? (
                    <View style={styles.coordinatesDisplay}>
                      <Text style={styles.coordinateText}>
                        Lat: {formData.coordinates.latitude.toFixed(6)}
                      </Text>
                      <Text style={styles.coordinateText}>
                        Lng: {formData.coordinates.longitude.toFixed(6)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noLocationText}>No location captured</Text>
                  )}

                  <Button
                    mode="outlined"
                    onPress={getCurrentLocation}
                    loading={loading}
                    style={styles.locationButton}
                    icon="my-location"
                  >
                    {formData.coordinates?.latitude ? "Update Location" : "Get Current Location"}
                  </Button>
                </View>

                <View style={styles.photoSection}>
                  <Text style={styles.photoLabel}>Location Photo</Text>
                  {formData.locationPhoto ? (
                    <View style={styles.photoContainer}>
                      <Image source={{ uri: formData.locationPhoto }} style={styles.photoPreview} />
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => updateFormField("locationPhoto", "")}
                      >
                        <MaterialIcons name="close" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <MaterialIcons name="photo-camera" size={48} color="#9ca3af" />
                      <Text style={styles.photoPlaceholderText}>No photo selected</Text>
                    </View>
                  )}

                  <View style={styles.photoButtons}>
                    <Button
                      mode="outlined"
                      onPress={takePhoto}
                      style={styles.photoButton}
                      icon="camera"
                    >
                      Take Photo
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={pickImage}
                      style={styles.photoButton}
                      icon="image"
                    >
                      Choose Image
                    </Button>
                  </View>
                </View>

                <Button
                  mode="contained"
                  onPress={saveFeederPoint}
                  loading={loading}
                  style={styles.saveButton}
                  icon="save"
                >
                  Create Feeder Point
                </Button>
              </View>
            </Card>
          </View>
        )}

        {/* Existing Feeder Points List */}
        {!showForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Existing Feeder Points ({feederPoints.length})</Text>
            
            {feederPoints.map((point) => (
              <Card key={point.id} style={styles.pointCard}>
                <View style={styles.pointContent}>
                  <View style={styles.pointHeader}>
                    <Text style={styles.pointName}>{point.feederPointName}</Text>
                    <Text style={styles.pointWard}>Ward {point.wardNumber}</Text>
                  </View>
                  <Text style={styles.pointArea}>{point.areaName}</Text>
                  <Text style={styles.pointLandmark}>{point.nearestLandmark}</Text>
                  <View style={styles.pointFooter}>
                    <Text style={styles.pointHouseholds}>{point.approximateHouseholds} households</Text>
                    <Text style={styles.pointVehicles}>{point.vehicleTypes}</Text>
                  </View>
                </View>
              </Card>
            ))}
            
            {feederPoints.length === 0 && (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyContent}>
                  <MaterialIcons name="location-off" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>No feeder points created yet</Text>
                  <Text style={styles.emptySubtext}>Tap the + button to create your first feeder point</Text>
                </View>
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* Admin Sidebar */}
      <AdminSidebar
        navigation={navigation}
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        currentScreen="FeederPointManagement"
      />
    </SafeAreaView>
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
  addButton: {
    padding: 8,
    borderRadius: 8,
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
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
  },
  locationSection: {
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  coordinatesDisplay: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  coordinateText: {
    fontSize: 14,
    color: "#6b7280",
    fontFamily: "monospace",
  },
  noLocationText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    marginBottom: 12,
  },
  locationButton: {
    marginBottom: 16,
  },
  photoSection: {
    marginBottom: 20,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 12,
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  removePhotoButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  photoPlaceholder: {
    height: 120,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
  },
  photoButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
  },
  pointCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 12,
  },
  pointContent: {
    padding: 16,
  },
  pointHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pointName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  pointWard: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3b82f6",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointArea: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  pointLandmark: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 12,
  },
  pointFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointHouseholds: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  pointVehicles: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "500",
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
})

export default FeederPointManagement
