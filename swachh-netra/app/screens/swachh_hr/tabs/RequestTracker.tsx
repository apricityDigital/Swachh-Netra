"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Card, Title, Text, Button, Chip, Searchbar, FAB } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

interface Request {
  id: string
  type: "add" | "edit" | "delete"
  workerName: string
  workerId?: string
  submittedOn: string
  status: "pending" | "approved" | "rejected"
  adminRemarks?: string
  details: string
}

export default function RequestTracker() {
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")

  const [requests] = useState<Request[]>([
    {
      id: "1",
      type: "add",
      workerName: "Mohan Lal",
      submittedOn: "2024-01-15",
      status: "pending",
      details: "New worker for Zone A, Ward 3",
    },
    {
      id: "2",
      type: "edit",
      workerName: "Priya Sharma",
      workerId: "SW002",
      submittedOn: "2024-01-14",
      status: "approved",
      adminRemarks: "Contact information updated successfully",
      details: "Update phone number and address",
    },
    {
      id: "3",
      type: "delete",
      workerName: "Ravi Kumar",
      workerId: "SW005",
      submittedOn: "2024-01-13",
      status: "rejected",
      adminRemarks: "Worker still has active assignments",
      details: "Remove worker due to relocation",
    },
    {
      id: "4",
      type: "add",
      workerName: "Sunita Devi",
      submittedOn: "2024-01-12",
      status: "approved",
      adminRemarks: "Worker added and assigned to FP-A12",
      details: "New worker for Zone A, Ward 1",
    },
  ])

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.workerId && request.workerId.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = filterStatus === "all" || request.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "add":
        return "account-plus"
      case "edit":
        return "account-edit"
      case "delete":
        return "account-remove"
      default:
        return "file-document"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "add":
        return "#4CAF50"
      case "edit":
        return "#2196F3"
      case "delete":
        return "#F44336"
      default:
        return "#757575"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#4CAF50"
      case "rejected":
        return "#F44336"
      case "pending":
        return "#FF9800"
      default:
        return "#757575"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "check-circle"
      case "rejected":
        return "close-circle"
      case "pending":
        return "clock"
      default:
        return "help-circle"
    }
  }

  const requestCounts = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search requests..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.filterContainer}>
          {["all", "pending", "approved", "rejected"].map((status) => (
            <Chip
              key={status}
              selected={filterStatus === status}
              onPress={() => setFilterStatus(status as any)}
              style={styles.filterChip}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Request Summary</Title>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{requestCounts.total}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: "#FF9800" }]}>{requestCounts.pending}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: "#4CAF50" }]}>{requestCounts.approved}</Text>
                <Text style={styles.summaryLabel}>Approved</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: "#F44336" }]}>{requestCounts.rejected}</Text>
                <Text style={styles.summaryLabel}>Rejected</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.requestsCard}>
          <Card.Content>
            <Title>Request History</Title>
            {filteredRequests.length === 0 ? (
              <Text style={styles.emptyText}>No requests found matching your criteria</Text>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} style={styles.requestCard}>
                  <Card.Content>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestInfo}>
                        <View style={styles.typeContainer}>
                          <MaterialCommunityIcons
                            name={getTypeIcon(request.type)}
                            size={20}
                            color={getTypeColor(request.type)}
                          />
                          <Text style={styles.requestType}>{request.type.toUpperCase()} REQUEST</Text>
                        </View>
                        <Text style={styles.workerName}>{request.workerName}</Text>
                        {request.workerId && <Text style={styles.workerId}>ID: {request.workerId}</Text>}
                        <Text style={styles.requestDate}>
                          Submitted: {new Date(request.submittedOn).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.statusContainer}>
                        <MaterialCommunityIcons
                          name={getStatusIcon(request.status)}
                          size={24}
                          color={getStatusColor(request.status)}
                        />
                        <Chip
                          style={[styles.statusChip, { backgroundColor: getStatusColor(request.status) }]}
                          textStyle={{ color: "#fff", fontSize: 12 }}
                        >
                          {request.status.toUpperCase()}
                        </Chip>
                      </View>
                    </View>

                    <View style={styles.requestDetails}>
                      <Text style={styles.detailsTitle}>Details:</Text>
                      <Text style={styles.detailsText}>{request.details}</Text>
                    </View>

                    {request.adminRemarks && (
                      <View style={styles.remarksContainer}>
                        <Text style={styles.remarksTitle}>Admin Remarks:</Text>
                        <Text style={styles.remarksText}>{request.adminRemarks}</Text>
                      </View>
                    )}

                    <View style={styles.requestActions}>
                      <Button mode="text" icon="eye" compact onPress={() => {}}>
                        View Details
                      </Button>
                      {request.status === "pending" && (
                        <Button mode="text" icon="pencil" compact onPress={() => {}}>
                          Edit Request
                        </Button>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => {}} label="New Request" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#E3F2FD",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  requestsCard: {
    elevation: 2,
  },
  emptyText: {
    textAlign: "center",
    color: "#757575",
    fontStyle: "italic",
    paddingVertical: 32,
  },
  requestCard: {
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  requestType: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  workerId: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  statusContainer: {
    alignItems: "center",
    gap: 4,
  },
  statusChip: {
    height: 20,
  },
  requestDetails: {
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  detailsText: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 20,
  },
  remarksContainer: {
    backgroundColor: "#E8F5E8",
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  remarksTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#2E7D32",
  },
  remarksText: {
    fontSize: 12,
    color: "#2E7D32",
    lineHeight: 16,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2196F3",
  },
})
