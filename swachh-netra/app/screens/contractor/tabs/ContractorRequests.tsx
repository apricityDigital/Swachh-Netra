"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native"
import { Card, Title, Text, Button, Chip, Searchbar, FAB } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"

interface Request {
  id: string
  type: "driver_add" | "driver_edit" | "driver_delete" | "vehicle_add" | "vehicle_edit" | "vehicle_delete"
  itemName: string
  itemId?: string
  submittedOn: string
  status: "pending" | "approved" | "rejected"
  adminRemarks?: string
  details: string
}

export default function ContractorRequests() {
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [filterType, setFilterType] = useState<"all" | "driver" | "vehicle">("all")

  const [requests] = useState<Request[]>([
    {
      id: "1",
      type: "driver_add",
      itemName: "Mohan Lal",
      submittedOn: "2024-01-15",
      status: "pending",
      details: "New driver for Zone A routes, has 5 years experience",
    },
    {
      id: "2",
      type: "vehicle_edit",
      itemName: "V-012",
      itemId: "V-012",
      submittedOn: "2024-01-14",
      status: "approved",
      adminRemarks: "Vehicle information updated successfully",
      details: "Update vehicle capacity and maintenance schedule",
    },
    {
      id: "3",
      type: "driver_delete",
      itemName: "Ravi Kumar",
      itemId: "D005",
      submittedOn: "2024-01-13",
      status: "rejected",
      adminRemarks: "Driver has active route assignments",
      details: "Remove driver due to resignation",
    },
    {
      id: "4",
      type: "vehicle_add",
      itemName: "V-020",
      submittedOn: "2024-01-12",
      status: "approved",
      adminRemarks: "Vehicle added and ready for assignment",
      details: "New truck for expanding operations in Zone C",
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
      request.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.itemId && request.itemId.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = filterStatus === "all" || request.status === filterStatus

    const matchesType =
      filterType === "all" ||
      (filterType === "driver" && request.type.startsWith("driver")) ||
      (filterType === "vehicle" && request.type.startsWith("vehicle"))

    return matchesSearch && matchesStatus && matchesType
  })

  const getTypeIcon = (type: string) => {
    if (type.includes("driver")) {
      if (type.includes("add")) return "account-plus"
      if (type.includes("edit")) return "account-edit"
      if (type.includes("delete")) return "account-remove"
    }
    if (type.includes("vehicle")) {
      if (type.includes("add")) return "truck"
      if (type.includes("edit")) return "truck"
      if (type.includes("delete")) return "truck"
    }
    return "file-document"
  }

  const getTypeColor = (type: string) => {
    if (type.includes("add")) return "#4CAF50"
    if (type.includes("edit")) return "#2196F3"
    if (type.includes("delete")) return "#F44336"
    return "#757575"
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

  const formatRequestType = (type: string) => {
    return type
      .replace("_", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace("Add", "Addition")
      .replace("Edit", "Update")
      .replace("Delete", "Removal")
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
          <Text style={styles.filterLabel}>Status:</Text>
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

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Type:</Text>
          {["all", "driver", "vehicle"].map((type) => (
            <Chip
              key={type}
              selected={filterType === type}
              onPress={() => setFilterType(type as any)}
              style={styles.filterChip}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
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
                          <Text style={styles.requestType}>{formatRequestType(request.type)}</Text>
                        </View>
                        <Text style={styles.itemName}>{request.itemName}</Text>
                        {request.itemId && <Text style={styles.itemId}>ID: {request.itemId}</Text>}
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
                      <View
                        style={[
                          styles.remarksContainer,
                          {
                            backgroundColor: request.status === "approved" ? "#E8F5E8" : "#FFEBEE",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.remarksTitle,
                            {
                              color: request.status === "approved" ? "#2E7D32" : "#C62828",
                            },
                          ]}
                        >
                          Admin Remarks:
                        </Text>
                        <Text
                          style={[
                            styles.remarksText,
                            {
                              color: request.status === "approved" ? "#2E7D32" : "#C62828",
                            },
                          ]}
                        >
                          {request.adminRemarks}
                        </Text>
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
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  filterChip: {
    backgroundColor: "#FFF3E0",
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
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemId: {
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
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  remarksTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 12,
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
    backgroundColor: "#FF9800",
  },
})
