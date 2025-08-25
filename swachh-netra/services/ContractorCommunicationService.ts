import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  limit
} from "firebase/firestore"
import { FIRESTORE_DB } from "../FirebaseConfig"

// Communication interfaces
export interface Message {
  id?: string
  senderId: string
  senderName: string
  senderRole: 'driver' | 'contractor' | 'admin'
  receiverId: string
  receiverRole: 'driver' | 'contractor' | 'admin'
  message: string
  messageType: 'text' | 'image' | 'location' | 'system'
  priority: 'normal' | 'urgent'
  status: 'sent' | 'delivered' | 'read'
  timestamp: Date
  createdAt: Date
  updatedAt: Date
}

export interface CommunicationData {
  driverId: string
  contractorId: string
  messages: Message[]
  lastMessage?: Message
  unreadCount: number
  lastActivity: Date
}

export interface SendMessageParams {
  senderId: string
  senderName: string
  senderRole: 'driver' | 'contractor' | 'admin'
  receiverId: string
  receiverRole: 'driver' | 'contractor' | 'admin'
  message: string
  messageType?: 'text' | 'image' | 'location' | 'system'
  priority?: 'normal' | 'urgent'
}

export class ContractorCommunicationService {
  // Get communication data between driver and contractor
  static async getCommunicationData(driverId: string, contractorId: string): Promise<CommunicationData> {
    try {
      console.log("💬 [ContractorCommunicationService] Fetching communication data for driver:", driverId, "contractor:", contractorId)

      // Get messages between driver and contractor
      const messages = await this.getMessages(driverId, contractorId)
      
      // Calculate unread count (messages from contractor that driver hasn't read)
      const unreadCount = messages.filter(msg => 
        msg.senderRole === 'contractor' && msg.status !== 'read'
      ).length

      // Get last message
      const lastMessage = messages.length > 0 ? messages[0] : undefined

      // Get last activity
      const lastActivity = lastMessage ? lastMessage.timestamp : new Date()

      const communicationData: CommunicationData = {
        driverId,
        contractorId,
        messages,
        lastMessage,
        unreadCount,
        lastActivity
      }

      console.log("✅ [ContractorCommunicationService] Communication data loaded:", messages.length, "messages")
      return communicationData

    } catch (error) {
      console.error("❌ [ContractorCommunicationService] Error fetching communication data:", error)
      throw new Error("Failed to fetch communication data")
    }
  }

  // Get messages between driver and contractor
  static async getMessages(driverId: string, contractorId: string): Promise<Message[]> {
    try {
      const messagesRef = collection(FIRESTORE_DB, "messages")
      
      // Query for messages between driver and contractor (both directions)
      const q = query(
        messagesRef,
        where("participants", "array-contains-any", [driverId, contractorId]),
        orderBy("timestamp", "desc"),
        limit(100)
      )
      
      const querySnapshot = await getDocs(q)
      const messages: Message[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        
        // Only include messages between this specific driver and contractor
        if ((data.senderId === driverId && data.receiverId === contractorId) ||
            (data.senderId === contractorId && data.receiverId === driverId)) {
          messages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            receiverId: data.receiverId,
            receiverRole: data.receiverRole,
            message: data.message,
            messageType: data.messageType || 'text',
            priority: data.priority || 'normal',
            status: data.status || 'sent',
            timestamp: data.timestamp?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          })
        }
      })

      return messages

    } catch (error) {
      console.error("❌ [ContractorCommunicationService] Error fetching messages:", error)
      return []
    }
  }

  // Send a message
  static async sendMessage(params: SendMessageParams): Promise<void> {
    try {
      console.log("📤 [ContractorCommunicationService] Sending message from:", params.senderName, "to:", params.receiverId)

      const messageData: Omit<Message, "id"> = {
        senderId: params.senderId,
        senderName: params.senderName,
        senderRole: params.senderRole,
        receiverId: params.receiverId,
        receiverRole: params.receiverRole,
        message: params.message,
        messageType: params.messageType || 'text',
        priority: params.priority || 'normal',
        status: 'sent',
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save to Firebase with additional fields for querying
      await addDoc(collection(FIRESTORE_DB, "messages"), {
        ...messageData,
        participants: [params.senderId, params.receiverId], // For easier querying
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      console.log("✅ [ContractorCommunicationService] Message sent successfully")

    } catch (error) {
      console.error("❌ [ContractorCommunicationService] Error sending message:", error)
      throw new Error("Failed to send message")
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(driverId: string, contractorId: string): Promise<void> {
    try {
      console.log("👁️ [ContractorCommunicationService] Marking messages as read for driver:", driverId)

      const messagesRef = collection(FIRESTORE_DB, "messages")
      const q = query(
        messagesRef,
        where("senderId", "==", contractorId),
        where("receiverId", "==", driverId),
        where("status", "!=", "read")
      )
      
      const querySnapshot = await getDocs(q)
      
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          status: 'read',
          updatedAt: serverTimestamp()
        })
      )

      await Promise.all(updatePromises)
      console.log("✅ [ContractorCommunicationService] Messages marked as read")

    } catch (error) {
      console.error("❌ [ContractorCommunicationService] Error marking messages as read:", error)
    }
  }

  // Real-time listener for messages
  static subscribeToMessages(
    driverId: string,
    contractorId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    console.log("🔄 [ContractorCommunicationService] Setting up real-time message listener")

    const messagesRef = collection(FIRESTORE_DB, "messages")
    const q = query(
      messagesRef,
      where("participants", "array-contains-any", [driverId, contractorId]),
      orderBy("timestamp", "desc"),
      limit(100)
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: Message[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        
        // Only include messages between this specific driver and contractor
        if ((data.senderId === driverId && data.receiverId === contractorId) ||
            (data.senderId === contractorId && data.receiverId === driverId)) {
          messages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            receiverId: data.receiverId,
            receiverRole: data.receiverRole,
            message: data.message,
            messageType: data.messageType || 'text',
            priority: data.priority || 'normal',
            status: data.status || 'sent',
            timestamp: data.timestamp?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          })
        }
      })

      callback(messages)
    })

    return () => {
      console.log("🔄 [ContractorCommunicationService] Cleaning up real-time message listener")
      unsubscribe()
    }
  }

  // Send system message (automated messages)
  static async sendSystemMessage(
    driverId: string,
    contractorId: string,
    message: string,
    priority: 'normal' | 'urgent' = 'normal'
  ): Promise<void> {
    try {
      await this.sendMessage({
        senderId: 'system',
        senderName: 'System',
        senderRole: 'admin',
        receiverId: contractorId,
        receiverRole: 'contractor',
        message,
        messageType: 'system',
        priority
      })
    } catch (error) {
      console.error("❌ [ContractorCommunicationService] Error sending system message:", error)
    }
  }

  // Get unread message count for driver
  static async getUnreadCount(driverId: string, contractorId: string): Promise<number> {
    try {
      const messagesRef = collection(FIRESTORE_DB, "messages")
      const q = query(
        messagesRef,
        where("senderId", "==", contractorId),
        where("receiverId", "==", driverId),
        where("status", "!=", "read")
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.size

    } catch (error) {
      console.error("❌ [ContractorCommunicationService] Error getting unread count:", error)
      return 0
    }
  }

  // Send location update to contractor
  static async sendLocationUpdate(
    driverId: string,
    driverName: string,
    contractorId: string,
    location: { latitude: number; longitude: number },
    message?: string
  ): Promise<void> {
    try {
      const locationMessage = message || `Current location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      
      await this.sendMessage({
        senderId: driverId,
        senderName: driverName,
        senderRole: 'driver',
        receiverId: contractorId,
        receiverRole: 'contractor',
        message: locationMessage,
        messageType: 'location',
        priority: 'normal'
      })

    } catch (error) {
      console.error("❌ [ContractorCommunicationService] Error sending location update:", error)
    }
  }
}
