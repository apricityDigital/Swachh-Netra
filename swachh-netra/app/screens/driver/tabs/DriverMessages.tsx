"use client"

import { useState } from "react"
import { View, StyleSheet, FlatList } from "react-native"
import { Card, Text, TextInput, Button, Avatar, Chip } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"

interface Message {
  id: string
  sender: string
  senderRole: "admin" | "contractor" | "zi"
  message: string
  timestamp: string
  isRead: boolean
  priority: "low" | "medium" | "high"
}

const DriverMessages = () => {
  const [messages] = useState<Message[]>([
    {
      id: "1",
      sender: "Transport Contractor",
      senderRole: "contractor",
      message: "Please ensure all pickups are completed by 6 PM today. There's an important inspection tomorrow.",
      timestamp: "2024-01-15 10:30 AM",
      isRead: false,
      priority: "high",
    },
    {
      id: "2",
      sender: "ZI Admin",
      senderRole: "zi",
      message: "New safety protocols have been updated. Please check the safety guidelines in your profile.",
      timestamp: "2024-01-15 09:15 AM",
      isRead: true,
      priority: "medium",
    },
    {
      id: "3",
      sender: "System Admin",
      senderRole: "admin",
      message: "Your performance this week has been excellent! Keep up the good work.",
      timestamp: "2024-01-14 05:45 PM",
      isRead: true,
      priority: "low",
    },
  ])

  const [newMessage, setNewMessage] = useState("")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#f44336"
      case "medium":
        return "#ff9800"
      case "low":
        return "#4caf50"
      default:
        return "#666"
    }
  }

  const getSenderIcon = (role: string) => {
    switch (role) {
      case "admin":
        return "admin-panel-settings"
      case "contractor":
        return "business"
      case "zi":
        return "location-city"
      default:
        return "person"
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <Card style={[styles.messageCard, !item.isRead && styles.unreadCard]}>
      <Card.Content>
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <Avatar.Icon size={32} icon={getSenderIcon(item.senderRole)} style={styles.avatar} />
            <View>
              <Text variant="titleSmall">{item.sender}</Text>
              <Text variant="bodySmall" style={styles.timestamp}>
                {item.timestamp}
              </Text>
            </View>
          </View>
          <View style={styles.messageStatus}>
            <Chip
              mode="flat"
              textStyle={{ color: getPriorityColor(item.priority), fontSize: 10 }}
              style={styles.priorityChip}
            >
              {item.priority.toUpperCase()}
            </Chip>
            {!item.isRead && <MaterialIcons name="fiber-manual-record" size={12} color="#1976d2" />}
          </View>
        </View>

        <Text variant="bodyMedium" style={styles.messageText}>
          {item.message}
        </Text>

        <View style={styles.messageActions}>
          <Button
            mode="text"
            icon="reply"
            onPress={() => {
              /* Handle reply */
            }}
          >
            Reply
          </Button>
          {!item.isRead && (
            <Button
              mode="text"
              icon="mark-email-read"
              onPress={() => {
                /* Mark as read */
              }}
            >
              Mark Read
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  )

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would send the message to Firebase
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Messages
      </Text>

      {/* Message Compose */}
      <Card style={styles.composeCard}>
        <Card.Content>
          <Text variant="titleMedium">Send Message</Text>
          <TextInput
            label="Type your message..."
            value={newMessage}
            onChangeText={setNewMessage}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.messageInput}
          />
          <Button
            mode="contained"
            icon="send"
            onPress={handleSendMessage}
            style={styles.sendButton}
            disabled={!newMessage.trim()}
          >
            Send to Admin
          </Button>
        </Card.Content>
      </Card>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.messagesList}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    marginBottom: 16,
    color: "#1976d2",
  },
  composeCard: {
    marginBottom: 16,
  },
  messageInput: {
    marginVertical: 8,
  },
  sendButton: {
    alignSelf: "flex-end",
  },
  messagesList: {
    flex: 1,
  },
  messageCard: {
    marginBottom: 12,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#1976d2",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    marginRight: 8,
    backgroundColor: "#1976d2",
  },
  timestamp: {
    color: "#666",
    fontSize: 12,
  },
  messageStatus: {
    alignItems: "flex-end",
  },
  priorityChip: {
    height: 20,
    marginBottom: 4,
  },
  messageText: {
    marginBottom: 12,
    lineHeight: 20,
  },
  messageActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
})

export default DriverMessages
