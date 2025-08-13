"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, Alert, Image } from "react-native"
import { Card, Title, Paragraph, Button, Text, Chip, TextInput } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import * as Location from "expo-location"
import * as ImagePicker from "expo-image-picker"
import AsyncStorage from "@react-native-async-storage/async-storage"


interface DriverPunchScreenProps {
  route: {
    params: {
      onPunchIn: () => void
      driverInfo?: {
        id: string
        name: string
        vehicleNumber: string
      }
    }
  }
}

export default function DriverPunchScreen({ route }: DriverPunchScreenProps) {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [vehicleNumber, setVehicleNumber] = useState<string>("")
  const [driverName, setDriverName] = useState<string>("")
  const [isPunchedIn, setIsPunchedIn] = useState(false)
  const [punchInTime, setPunchInTime] = useState<Date | null>(null)

  useEffect(() => {
    loadDriverData()
    checkPunchStatus()
  }, [])

  const loadDriverData = async () => {
    try {
      // Load driver info from route params or AsyncStorage
      if (route.params?.driverInfo) {
        setVehicleNumber(route.params.driverInfo.vehicleNumber)
        setDriverName(route.params.driverInfo.name)
      } else {
        const savedVehicle = await AsyncStorage.getItem("driverVehicleNumber")
        const savedName = await AsyncStorage.getItem("driverName")
        if (savedVehicle) setVehicleNumber(savedVehicle)
        if (savedName) setDriverName(savedName)
      }
    } catch (error) {
      console.error("Error loading driver data:", error)
    }
  }

  const checkPunchStatus = async () => {
    try {
      const today = new Date().toDateString()
      const punchData = await AsyncStorage.getItem(`punchIn_${today}`)
      if (punchData) {
        const data = JSON.parse(punchData)
        setIsPunchedIn(true)
        setPunchInTime(new Date(data.timestamp))
      }
    } catch (error) {
      console.error("Error checking punch status:", error)
    }
  }

  const getCurrentLocation = async () => {
    try {
      setLoading(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required for attendance")
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      setLocation(location)
    } catch (error) {
      Alert.alert("Error", "Failed to get location")
    } finally {
      setLoading(false)
    }
  }

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Camera permission is required for attendance")
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

  const handlePunchIn = async () => {
    if (!location) {
      Alert.alert("Location Required", "Please capture your location first")
      return
    }

    if (!photo) {
      Alert.alert("Photo Required", "Please take your attendance photo")
      return
    }

    if (!driverName.trim()) {
      Alert.alert("Name Required", "Please enter your name")
      return
    }

    try {
      setLoading(true)
      const punchData = {
        driverId: route.params?.driverInfo?.id || "driver_001",
        driverName: driverName.trim(),
        timestamp: new Date().toISOString(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: await getAddressFromCoords(location.coords.latitude, location.coords.longitude),
        },
        photo,
        vehicleNumber,
        type: "punch_in",
      }

      // Driver attendance recorded locally
      console.log('Punch in data:', punchData)

      // Also save locally for offline access
      const today = new Date().toDateString()
      await AsyncStorage.setItem(`punchIn_${today}`, JSON.stringify(punchData))
      await AsyncStorage.setItem("driverVehicleNumber", vehicleNumber)
      await AsyncStorage.setItem("driverName", driverName)

      setIsPunchedIn(true)
      setPunchInTime(new Date())

      Alert.alert("Success", "Punched in successfully!", [
        {
          text: "Continue",
          onPress: () => route.params.onPunchIn(),
        },
      ])
    } catch (error) {
      console.error("Punch in error:", error)
      Alert.alert("Error", "Failed to punch in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePunchOut = async () => {
    try {
      setLoading(true)
      const punchOutData = {
        driverId: route.params?.driverInfo?.id || "driver_001",
        driverName,
        timestamp: new Date().toISOString(),
        location: location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              address: await getAddressFromCoords(location.coords.latitude, location.coords.longitude),
            }
          : null,
        vehicleNumber,
        type: "punch_out",
      }

      // Driver punch out recorded locally
      console.log('Punch out data:', punchOutData)

      // Update local storage
      const today = new Date().toDateString()
      const existingData = await AsyncStorage.getItem(`punchIn_${today}`)
      if (existingData) {
        const data = JSON.parse(existingData)
        data.punchOut = punchOutData
        await AsyncStorage.setItem(`punchIn_${today}`, JSON.stringify(data))
      }

      Alert.alert("Success", "Punched out successfully!")
      setIsPunchedIn(false)
      setPunchInTime(null)
      setPhoto(null)
      setLocation(null)
    } catch (error) {
      console.error("Punch out error:", error)
      Alert.alert("Error", "Failed to punch out. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getAddressFromCoords = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude })
      if (result.length > 0) {
        const addr = result[0]
        return `${addr.street || ""} ${addr.city || ""} ${addr.region || ""}`.trim()
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
    }
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  }

  if (isPunchedIn) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <MaterialCommunityIcons name="check-circle" size={60} color="#4CAF50" />
              <Title style={styles.title}>Punched In</Title>
              <Text style={styles.welcomeText}>Welcome, {driverName}!</Text>
            </View>

            <View style={styles.infoContainer}>
              <Chip icon="clock" style={styles.chip}>
                Punch In: {punchInTime?.toLocaleTimeString()}
              </Chip>
              <Chip icon="truck" style={styles.chip}>
                Vehicle: {vehicleNumber}
              </Chip>
              {location && (
                <Chip icon="map-marker" style={styles.chip}>
                  Location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                </Chip>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={() => route.params.onPunchIn()}
                style={[styles.button, { backgroundColor: "#4CAF50" }]}
                icon="arrow-right"
              >
                Continue to App
              </Button>

              <Button mode="outlined" onPress={handlePunchOut} style={styles.button} loading={loading} icon="logout">
                Punch Out
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialCommunityIcons name="clock-check" size={60} color="#2196F3" />
            <Title style={styles.title}>Driver Attendance</Title>
            <Paragraph style={styles.subtitle}>Please complete your punch in process</Paragraph>
          </View>

          <TextInput
            label="Driver Name"
            value={driverName}
            onChangeText={setDriverName}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Vehicle Number"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="truck" />}
          />

          <View style={styles.stepContainer}>
            <View style={styles.step}>
              <MaterialCommunityIcons
                name={location ? "check-circle" : "map-marker"}
                size={24}
                color={location ? "#4CAF50" : "#757575"}
              />
              <Text style={styles.stepText}>
                {location
                  ? `Location: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
                  : "Capture Location"}
              </Text>
              {!location && (
                <Button mode="outlined" onPress={getCurrentLocation} loading={loading} compact>
                  Get Location
                </Button>
              )}
            </View>

            <View style={styles.step}>
              <MaterialCommunityIcons
                name={photo ? "check-circle" : "camera"}
                size={24}
                color={photo ? "#4CAF50" : "#757575"}
              />
              <Text style={styles.stepText}>{photo ? "Photo Captured" : "Take Attendance Photo"}</Text>
              {!photo && (
                <Button mode="outlined" onPress={takePhoto} compact>
                  Take Photo
                </Button>
              )}
            </View>
          </View>

          {photo && (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
            </View>
          )}

          <Button
            mode="contained"
            onPress={handlePunchIn}
            style={styles.punchButton}
            disabled={!location || !photo || !driverName.trim() || loading}
            loading={loading}
            icon="clock-check"
          >
            Punch In
          </Button>
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  card: {
    elevation: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  subtitle: {
    textAlign: "center",
    color: "#757575",
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: "#4CAF50",
    marginTop: 4,
  },
  input: {
    marginBottom: 16,
  },
  stepContainer: {
    marginBottom: 24,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
    borderRadius: 8,
  },
  stepText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  punchButton: {
    paddingVertical: 8,
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  chip: {
    marginVertical: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 4,
  },
})
