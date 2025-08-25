import React, { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native"
import { Card, Text, Button, Chip, FAB } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import { ContractorCommunicationService, Message, CommunicationData } from "../../../services/ContractorCommunicationService"
import { useRequireAuth } from "../../hooks/useRequireAuth"

const ContractorCommunication = ({ navigation, route }: any) => {
  const { userData } = useRequireAuth(navigation)
  const { contractorId, contractorName } = route.params || {}

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [communicationData, setCommunicationData] = useState<CommunicationData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (userData?.uid && contractorId) {
      fetchCommunicationData()
      setupRealTimeListener()
    }
  }, [userData?.uid, contractorId])

  const fetchCommunicationData = async () => {
    try {
      setLoading(true)
      console.log("💬 [ContractorCommunication] Fetching communication data")
      
      const data = await ContractorCommunicationService.getCommunicationData(
        userData?.uid || '',
        contractorId
      )
      setCommunicationData(data)
      setMessages(data.messages)
      
      console.log("✅ [ContractorCommunication] Communication data loaded:", data.messages.length, "messages")
    } catch (error) {
      console.error("❌ [ContractorCommunication] Error fetching communication data:", error)
      Alert.alert("Error", "Failed to load messages. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const setupRealTimeListener = () => {
    const unsubscribe = ContractorCommunicationService.subscribeToMessages(
      userData?.uid || '',
      contractorId,
      (newMessages) => {
        setMessages(newMessages)
      }
    )

    return () => unsubscribe()
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchCommunicationData()
    setRefreshing(false)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert("Empty Message", "Please enter a message before sending.")
      return
    }

    try {
      setSendingMessage(true)
      console.log("📤 [ContractorCommunication] Sending message")
      
      await ContractorCommunicationService.sendMessage({
        senderId: userData?.uid || '',
        senderName: userData?.fullName || 'Driver',
        senderRole: 'driver',
        receiverId: contractorId,
        receiverRole: 'contractor',
        message: newMessage.trim(),
        messageType: 'text',
        priority: 'normal'
      })

      setNewMessage("")
      console.log("✅ [ContractorCommunication] Message sent successfully")
      
    } catch (error) {
      console.error("❌ [ContractorCommunication] Error sending message:", error)
      Alert.alert("Error", "Failed to send message. Please try again.")
    } finally {
      setSendingMessage(false)
    }
  }

  const sendQuickMessage = (messageType: string) => {
    let message = ""
    switch (messageType) {
      case "arrived":
        message = "I have arrived at the collection point."
        break
      case "completed":
        message = "Collection completed for this route."
        break
      case "issue":
        message = "I'm experiencing an issue and need assistance."
        break
      case "delay":
        message = "I will be delayed due to traffic/other issues."
        break
      default:
        return
    }

    setNewMessage(message)
  }

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "#6b7280"
      case "delivered": return "#3b82f6"
      case "read": return "#10b981"
      default: return "#6b7280"
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Communication</Text>
          <Text style={styles.headerSubtitle}>{contractorName || "Contractor"}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <ScrollView 
        style={styles.messagesContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {messages.length > 0 ? (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageCard,
                message.senderRole === 'driver' ? styles.sentMessage : styles.receivedMessage
              ]}
            >
              <View style={styles.messageContent}>
                <Text style={styles.messageText}>{message.message}</Text>
                <View style={styles.messageFooter}>
                  <Text style={styles.messageTime}>
                    {formatMessageTime(message.timestamp)}
                  </Text>
                  {message.senderRole === 'driver' && (
                    <MaterialIcons 
                      name="check" 
                      size={16} 
                      color={getMessageStatusColor(message.status)} 
                    />
                  )}
                </View>
              </View>
              {message.priority === 'urgent' && (
                <Chip mode="outlined" style={styles.urgentChip}>
                  Urgent
                </Chip>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="chat-bubble-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Messages Yet</Text>
            <Text style={styles.emptyText}>
              Start a conversation with your contractor
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Message Buttons */}
      <View style={styles.quickMessages}>
        <Text style={styles.quickMessagesTitle}>Quick Messages</Text>
        <View style={styles.quickButtonsRow}>
          <Button
            mode="outlined"
            onPress={() => sendQuickMessage("arrived")}
            style={styles.quickButton}
            icon="location-on"
          >
            Arrived
          </Button>
          <Button
            mode="outlined"
            onPress={() => sendQuickMessage("completed")}
            style={styles.quickButton}
            icon="check-circle"
          >
            Completed
          </Button>
        </View>
        <View style={styles.quickButtonsRow}>
          <Button
            mode="outlined"
            onPress={() => sendQuickMessage("issue")}
            style={styles.quickButton}
            icon="warning"
          >
            Issue
          </Button>
          <Button
            mode="outlined"
            onPress={() => sendQuickMessage("delay")}
            style={styles.quickButton}
            icon="schedule"
          >
            Delayed
          </Button>
        </View>
      </View>

      {/* Message Input */}
      <View style={styles.messageInput}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={sendingMessage || !newMessage.trim()}
          style={[
            styles.sendButton,
            (!newMessage.trim() || sendingMessage) && styles.sendButtonDisabled
          ]}
        >
          <MaterialIcons 
            name="send" 
            size={24} 
            color={(!newMessage.trim() || sendingMessage) ? "#9ca3af" : "#ffffff"} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#1f2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
  },
  refreshButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageCard: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  messageContent: {
    padding: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  urgentChip: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fef2f2",
    borderColor: "#ef4444",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  quickMessages: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  quickMessagesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  quickButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  quickButton: {
    flex: 1,
  },
  messageInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
})

export default ContractorCommunication
