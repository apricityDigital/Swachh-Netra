"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from "react-native"
import { Card, Title, Text, Button, List, Chip, TextInput, FAB, Avatar } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

interface Message {
  id: string
  from: string
  fromRole: "admin" | "zi" | "contractor"
  to: string
  toRole: "admin" | "zi" | "contractor"
  subject: string
  content: string
  timestamp: string
  status: "unread" | "read"
  priority: "low" | "medium" | "high"
}

interface Conversation {
  id: string
  participants: string[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  subject: string
}

export default function ContractorMessaging() {
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "compose">("inbox")
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState({
    to: "",
    subject: "",
    content: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  const [conversations] = useState<Conversation[]>([
    {
      id: "1",
      participants: ["Admin", "Transport Contractor"],
      lastMessage: "Please review the new driver assignments for this week",
      lastMessageTime: "2024-01-15 14:30",
      unreadCount: 1,
      subject: "Weekly Driver Assignments",
    },
    {
      id: "2",
      participants: ["ZI Officer", "Transport Contractor"],
      lastMessage: "Transport efficiency report has been submitted",
      lastMessageTime: "2024-01-14 11:20",
      unreadCount: 0,
      subject: "Transport Efficiency Report",
    },
    {
      id: "3",
      participants: ["Admin", "Transport Contractor"],
      lastMessage: "Vehicle maintenance schedule approved",
      lastMessageTime: "2024-01-13 16:45",
      unreadCount: 0,
      subject: "Vehicle Maintenance Approval",
    },
  ])

  const [messages] = useState<Message[]>([
    {
      id: "1",
      from: "Admin",
      fromRole: "admin",
      to: "Transport Contractor",
      toRole: "contractor",
      subject: "Weekly Driver Assignments",
      content:
        "Please review the new driver assignments for this week. We need to ensure all routes are covered efficiently.",
      timestamp: "2024-01-15 14:30",
      status: "unread",
      priority: "high",
    },
    {
      id: "2",
      from: "ZI Officer",
      fromRole: "zi",
      to: "Transport Contractor",
      toRole: "contractor",
      subject: "Transport Efficiency Report",
      content: "The weekly transport efficiency report shows good improvement. Overall completion rate is at 89%.",
      timestamp: "2024-01-14 11:20",
      status: "read",
      priority: "medium",
    },
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#F44336"
      case "medium":
        return "#FF9800"
      case "low":
        return "#4CAF50"
      default:
        return "#757575"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "#F44336"
      case "zi":
        return "#9C27B0"
      case "contractor":
        return "#FF9800"
      default:
        return "#757575"
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.to || !newMessage.subject || !newMessage.content) {
      return
    }

    console.log("Sending message:", newMessage)

    setNewMessage({
      to: "",
      subject: "",
      content: "",
      priority: "medium",
    })

    setActiveTab("inbox")
  }

  const renderInbox = () => (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Conversations</Title>
          {conversations.map((conversation) => (
            <Card key={conversation.id} style={styles.conversationCard}>
              <Card.Content>
                <View style={styles.conversationHeader}>
                  <View style={styles.conversationInfo}>
                    <Text style={styles.conversationSubject}>{conversation.subject}</Text>
                    <Text style={styles.conversationParticipants}>{conversation.participants.join(" • ")}</Text>
                    <Text style={styles.lastMessage}>{conversation.lastMessage}</Text>
                  </View>
                  <View style={styles.conversationMeta}>
                    <Text style={styles.messageTime}>
                      {new Date(conversation.lastMessageTime).toLocaleDateString()}
                    </Text>
                    {conversation.unreadCount > 0 && (
                      <Chip style={styles.unreadBadge} textStyle={{ color: "#fff", fontSize: 12 }}>
                        {conversation.unreadCount}
                      </Chip>
                    )}
                  </View>
                </View>
                <Button
                  mode="outlined"
                  icon="message-text"
                  compact
                  onPress={() => setSelectedConversation(conversation.id)}
                >
                  Open
                </Button>
              </Card.Content>
            </Card>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Messages</Title>
          {messages.map((message) => (
            <List.Item
              key={message.id}
              title={message.subject}
              description={`From: ${message.from} • ${message.content.substring(0, 50)}...`}
              left={(props) => (
                <Avatar.Text
                  {...props}
                  size={40}
                  label={message.from.charAt(0)}
                  style={{ backgroundColor: getRoleColor(message.fromRole) }}
                />
              )}
              right={(props) => (
                <View {...props} style={styles.messageRight}>
                  <Chip
                    style={[styles.priorityChip, { backgroundColor: getPriorityColor(message.priority) }]}
                    textStyle={{ color: "#fff", fontSize: 10 }}
                  >
                    {message.priority.toUpperCase()}
                  </Chip>
                  <Text style={styles.messageTime}>{new Date(message.timestamp).toLocaleTimeString()}</Text>
                  {message.status === "unread" && <MaterialCommunityIcons name="circle" size={8} color="#FF9800" />}
                </View>
              )}
              style={[styles.messageItem, message.status === "unread" && styles.unreadMessage]}
              onPress={() => {}}
            />
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  )

  const renderCompose = () => (
    <KeyboardAvoidingView style={styles.composeContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Compose Message</Title>

            <TextInput
              label="To (Role/Name)"
              value={newMessage.to}
              onChangeText={(text) => setNewMessage({ ...newMessage, to: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Admin, ZI Officer, etc."
            />

            <TextInput
              label="Subject"
              value={newMessage.subject}
              onChangeText={(text) => setNewMessage({ ...newMessage, subject: text })}
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>Priority:</Text>
              <View style={styles.priorityChips}>
                {["low", "medium", "high"].map((priority) => (
                  <Chip
                    key={priority}
                    selected={newMessage.priority === priority}
                    onPress={() => setNewMessage({ ...newMessage, priority: priority as any })}
                    style={[
                      styles.prioritySelectChip,
                      {
                        backgroundColor: newMessage.priority === priority ? getPriorityColor(priority) : "#FFF3E0",
                      },
                    ]}
                    textStyle={{
                      color: newMessage.priority === priority ? "#fff" : "#333",
                    }}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Chip>
                ))}
              </View>
            </View>

            <TextInput
              label="Message"
              value={newMessage.content}
              onChangeText={(text) => setNewMessage({ ...newMessage, content: text })}
              style={styles.messageInput}
              mode="outlined"
              multiline
              numberOfLines={6}
              placeholder="Type your message here..."
            />

            <View style={styles.composeActions}>
              <Button mode="outlined" onPress={() => setActiveTab("inbox")} style={styles.actionButton}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSendMessage}
                style={styles.actionButton}
                disabled={!newMessage.to || !newMessage.subject || !newMessage.content}
                icon="send"
              >
                Send Message
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  )

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {["inbox", "sent", "compose"].map((tab) => (
          <Chip
            key={tab}
            selected={activeTab === tab}
            onPress={() => setActiveTab(tab as any)}
            style={styles.tabChip}
            icon={tab === "inbox" ? "inbox" : tab === "sent" ? "send" : "pencil"}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Chip>
        ))}
      </View>

      {activeTab === "inbox" && renderInbox()}
      {activeTab === "compose" && renderCompose()}
      {activeTab === "sent" && (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="send" size={64} color="#E0E0E0" />
          <Text style={styles.emptyText}>Sent messages will appear here</Text>
        </View>
      )}

      {activeTab === "inbox" && (
        <FAB icon="plus" style={styles.fab} onPress={() => setActiveTab("compose")} label="Compose" />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
    gap: 8,
  },
  tabChip: {
    backgroundColor: "#FFF3E0",
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  conversationCard: {
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationSubject: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  conversationParticipants: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#9E9E9E",
    lineHeight: 18,
  },
  conversationMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  messageTime: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  unreadBadge: {
    backgroundColor: "#FF9800",
    height: 20,
  },
  messageItem: {
    backgroundColor: "#f8f9fa",
    marginBottom: 4,
    borderRadius: 8,
  },
  unreadMessage: {
    backgroundColor: "#FFF3E0",
  },
  messageRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  priorityChip: {
    height: 16,
  },
  composeContainer: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
  priorityContainer: {
    marginBottom: 12,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  priorityChips: {
    flexDirection: "row",
    gap: 8,
  },
  prioritySelectChip: {
    backgroundColor: "#FFF3E0",
  },
  messageInput: {
    marginBottom: 16,
  },
  composeActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#9E9E9E",
    marginTop: 16,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#FF9800",
  },
})
