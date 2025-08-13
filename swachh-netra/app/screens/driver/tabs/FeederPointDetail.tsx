"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, Alert, ScrollView } from "react-native"
import { Card, Text, Button, Chip, Modal, Portal, TextInput, RadioButton, Divider } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"

// Define types inline
interface Worker {
  id: string
  name: string
  employeeId: string
  status: "pending" | "present" | "absent" | "reliever" | "no_collection"
  photo: string | null
  wasteCollected?: {
    type: "mixed" | "dry" | "wet" | "recyclable" | "hazardous"
    quantity: number
    unit: "kg" | "bags"
  }
  relieverInfo?: {
    name: string
    employeeId: string
    type: string
  }
  notes?: string
  timestamp?: string
}

interface FeederPoint {
  id: string
  name: string
  address: string
  zone: string
  ward: string
  scheduledTime: string
  status: string
  totalWorkers: number
  completedWorkers: number
  estimatedWaste: string
  coordinates: { latitude: number; longitude: number }
}

interface FeederPointDetailProps {
  route: {
    params: {
      feederPoint: FeederPoint
    }
  }
  navigation: any
}

const FeederPointDetail = ({ route, navigation }: FeederPointDetailProps) => {
  const { feederPoint } = route.params
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [workerStatus, setWorkerStatus] = useState<string>("present")
  const [wasteType, setWasteType] = useState<string>("mixed")
  const [wasteQuantity, setWasteQuantity] = useState<string>("")
  const [wasteUnit, setWasteUnit] = useState<string>("kg")
  const [photo, setPhoto] = useState<string | null>(null)
  const [relieverName, setRelieverName] = useState<string>("")
  const [relieverEmployeeId, setRelieverEmployeeId] = useState<string>("")
  const [relieverType, setRelieverType] = useState<string>("registered")
  const [notes, setNotes] = useState<string>("")

  useEffect(() => {
    loadWorkers()
    navigation.setOptions({
      title: feederPoint.name,
      headerRight: () => (
        <Button onPress={completeFeederPoint} mode="text">
          Complete
        </Button>
      ),
    })
  }, [])

  const loadWorkers = async () => {
    try {
      setLoading(true)
      // Demo data with proper Worker interface
      const demoWorkers: Worker[] = [
        {
          id: "worker_001",
          name: "Rajesh Kumar",
          employeeId: "EMP001",
          status: "pending",
          photo: null,
        },
        {
          id: "worker_002",
          name: "Priya Sharma",
          employeeId: "EMP002",
          status: "pending",
          photo: null,
        },
        {
          id: "worker_003",
          name: "Amit Singh",
          employeeId: "EMP003",
          status: "pending",
          photo: null,
        },
      ]
      setWorkers(demoWorkers)
    } catch (error) {
      console.error("Error loading workers:", error)
    } finally {
      setLoading(false)
    }
  }

  const openWorkerModal = (worker: Worker) => {
    setSelectedWorker(worker)
    setWorkerStatus(worker.status === "pending" ? "present" : worker.status)
    setWasteType((worker.wasteCollected as any)?.type || "mixed")
    setWasteQuantity((worker.wasteCollected as any)?.quantity?.toString() || "")
    setWasteUnit((worker.wasteCollected as any)?.unit || "kg")
    setPhoto(worker.photo || null)
    setRelieverName(worker.relieverInfo?.name || "")
    setRelieverEmployeeId(worker.relieverInfo?.employeeId || "")
    setRelieverType(worker.relieverInfo?.type || "registered")
    setNotes(worker.notes || "")
    setModalVisible(true)
  }

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is required")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled) {
        setPhoto(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo")
    }
  }

  const saveWorkerData = async () => {
    if (!selectedWorker) return

    try {
      const location = await Location.getCurrentPositionAsync({})

      const updatedWorker: Worker = {
        ...selectedWorker,
        status: workerStatus as Worker["status"],
        wasteCollected:
          workerStatus === "present" || workerStatus === "reliever"
            ? {
                type: wasteType as "mixed" | "dry" | "wet" | "recyclable" | "hazardous",
                quantity: Number.parseFloat(wasteQuantity) || 0,
                unit: wasteUnit as "kg" | "bags",
              }
            : undefined,
        photo: photo,
        timestamp: new Date().toISOString(),
      }

      // Worker attendance updated locally
      console.log('Worker data updated:', updatedWorker)

      // Update local state
      setWorkers((prev) => prev.map((w) => (w.id === selectedWorker.id ? updatedWorker : w)))
      setModalVisible(false)

      Alert.alert("Success", "Worker data saved successfully")
    } catch (error) {
      console.error("Error saving worker data:", error)
      Alert.alert("Error", "Failed to save worker data")
    }
  }

  const completeFeederPoint = async () => {
    const pendingWorkers = workers.filter((w) => w.status === "pending")
    if (pendingWorkers.length > 0) {
      Alert.alert(
        "Incomplete",
        `${pendingWorkers.length} workers still pending. Complete all workers before finishing.`,
      )
      return
    }

    try {
      // Mark feeder point as completed
      Alert.alert("Success", "Feeder point completed successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    } catch (error) {
      console.error("Error completing feeder point:", error)
      Alert.alert("Error", "Failed to complete feeder point")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "#4caf50"
      case "absent":
        return "#f44336"
      case "reliever":
        return "#ff9800"
      case "no_collection":
        return "#9c27b0"
      default:
        return "#666"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return "check-circle"
      case "absent":
        return "cancel"
      case "reliever":
        return "swap-horiz"
      case "no_collection":
        return "block"
      default:
        return "pending"
    }
  }

  const renderWorker = ({ item }: { item: Worker }) => (
    <Card style={styles.workerCard} onPress={() => openWorkerModal(item)}>
      <Card.Content>
        <View style={styles.workerHeader}>
          <View>
            <Text variant="titleMedium">{item.name}</Text>
            <Text variant="bodySmall" style={styles.employeeId}>
              ID: {item.employeeId}
            </Text>
          </View>
          <Chip icon={getStatusIcon(item.status)} textStyle={{ color: getStatusColor(item.status) }} mode="flat">
            {item.status.toUpperCase()}
          </Chip>
        </View>

        {item.wasteCollected && (
          <View style={styles.wasteInfo}>
            <MaterialIcons name="delete" size={16} color="#666" />
            <Text variant="bodySmall" style={styles.wasteText}>
              {item.wasteCollected.quantity} {item.wasteCollected.unit} - {item.wasteCollected.type}
            </Text>
          </View>
        )}

        {item.relieverInfo && (
          <View style={styles.relieverInfo}>
            <MaterialIcons name="swap-horiz" size={16} color="#ff9800" />
            <Text variant="bodySmall" style={styles.relieverText}>
              Reliever: {item.relieverInfo.name}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  )

  const completedCount = workers.filter((w) => w.status !== "pending").length

  return (
    <View style={styles.container}>
      {/* Header Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleLarge">{feederPoint.name}</Text>
          <Text variant="bodyMedium" style={styles.address}>
            {feederPoint.address}
          </Text>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={styles.summaryNumber}>
                {workers.length}
              </Text>
              <Text variant="bodySmall">Total Workers</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryNumber, { color: "#4caf50" }]}>
                {completedCount}
              </Text>
              <Text variant="bodySmall">Completed</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryNumber, { color: "#f44336" }]}>
                {workers.length - completedCount}
              </Text>
              <Text variant="bodySmall">Pending</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Workers List */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Workers Attendance
      </Text>

      <FlatList
        data={workers}
        renderItem={renderWorker}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {/* Worker Detail Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {selectedWorker?.name}
            </Text>
            <Text variant="bodyMedium" style={styles.modalSubtitle}>
              Employee ID: {selectedWorker?.employeeId}
            </Text>

            {/* Status Selection */}
            <Text variant="titleMedium" style={styles.sectionHeader}>
              Mark Status
            </Text>
            <RadioButton.Group onValueChange={setWorkerStatus} value={workerStatus}>
              <View style={styles.radioItem}>
                <RadioButton value="present" />
                <Text>Present (Collected waste)</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="absent" />
                <Text>Absent</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="reliever" />
                <Text>Reliever Attendance</Text>
              </View>
              <View style={styles.radioItem}>
                <RadioButton value="no_collection" />
                <Text>No Collection</Text>
              </View>
            </RadioButton.Group>

            {/* Reliever Info */}
            {workerStatus === "reliever" && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionHeader}>
                  Reliever Information
                </Text>
                <RadioButton.Group onValueChange={setRelieverType} value={relieverType}>
                  <View style={styles.radioItem}>
                    <RadioButton value="registered" />
                    <Text>Registered Reliever</Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton value="unregistered" />
                    <Text>Unregistered Reliever</Text>
                  </View>
                </RadioButton.Group>
                <TextInput
                  label="Reliever Name"
                  value={relieverName}
                  onChangeText={setRelieverName}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Reliever Employee ID (Optional)"
                  value={relieverEmployeeId}
                  onChangeText={setRelieverEmployeeId}
                  style={styles.input}
                  mode="outlined"
                />
              </View>
            )}

            {/* Waste Collection */}
            {(workerStatus === "present" || workerStatus === "reliever") && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionHeader}>
                  Waste Collection
                </Text>
                <Text variant="bodyMedium" style={styles.label}>
                  Waste Type
                </Text>
                <RadioButton.Group onValueChange={setWasteType} value={wasteType}>
                  {["wet", "dry", "recyclable", "mixed", "hazardous"].map((type) => (
                    <View key={type} style={styles.radioItem}>
                      <RadioButton value={type} />
                      <Text style={styles.capitalize}>{type}</Text>
                    </View>
                  ))}
                </RadioButton.Group>

                <View style={styles.quantityRow}>
                  <TextInput
                    label="Quantity"
                    value={wasteQuantity}
                    onChangeText={setWasteQuantity}
                    style={[styles.input, { flex: 1 }]}
                    mode="outlined"
                    keyboardType="numeric"
                  />
                  <RadioButton.Group onValueChange={setWasteUnit} value={wasteUnit}>
                    <View style={styles.unitContainer}>
                      <View style={styles.radioItem}>
                        <RadioButton value="kg" />
                        <Text>KG</Text>
                      </View>
                      <View style={styles.radioItem}>
                        <RadioButton value="bags" />
                        <Text>Bags</Text>
                      </View>
                    </View>
                  </RadioButton.Group>
                </View>
              </View>
            )}

            {/* Photo */}
            {(workerStatus === "present" || workerStatus === "reliever") && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionHeader}>
                  Proof Photo
                </Text>
                <Button mode="outlined" onPress={takePhoto} icon="camera" style={styles.photoButton}>
                  {photo ? "Retake Photo" : "Take Photo"}
                </Button>
                {photo && (
                  <View style={styles.photoPreview}>
                    <Text variant="bodySmall">✓ Photo captured</Text>
                  </View>
                )}
              </View>
            )}

            {/* Notes */}
            <TextInput
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
                Cancel
              </Button>
              <Button mode="contained" onPress={saveWorkerData} style={styles.modalButton}>
                Save
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 4,
  },
  address: {
    color: "#666",
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    color: "#1976d2",
    fontWeight: "bold",
  },
  sectionTitle: {
    marginBottom: 12,
    color: "#333",
  },
  listContainer: {
    paddingBottom: 20,
  },
  workerCard: {
    marginBottom: 8,
    elevation: 2,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  employeeId: {
    color: "#666",
  },
  wasteInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  wasteText: {
    marginLeft: 8,
    color: "#666",
  },
  relieverInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  relieverText: {
    marginLeft: 8,
    color: "#ff9800",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: "90%",
  },
  modalTitle: {
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#666",
    marginBottom: 20,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  section: {
    marginBottom: 16,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    color: "#666",
  },
  capitalize: {
    textTransform: "capitalize",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  unitContainer: {
    flexDirection: "row",
  },
  photoButton: {
    marginBottom: 8,
  },
  photoPreview: {
    padding: 8,
    backgroundColor: "#e8f5e8",
    borderRadius: 4,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 0.45,
  },
})

export default FeederPointDetail
