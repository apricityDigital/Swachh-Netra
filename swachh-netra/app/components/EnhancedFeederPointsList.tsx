import React, { useState, useMemo } from "react"
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native"
import { Card, Text, Chip, Searchbar, FAB } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"

interface AssignedFeederPoint {
  id: string
  feederPointName: string
  areaName: string
  wardNumber: string
  nearestLandmark: string
  approximateHouseholds: string
  completedTrips: number
  totalTrips: number
  nextTripTime?: string
  estimatedDuration?: number
  priority?: "high" | "medium" | "low"
  status?: "pending" | "in_progress" | "completed"
}

interface EnhancedFeederPointsListProps {
  feederPoints: AssignedFeederPoint[]
  onFeederPointPress?: (feederPoint: AssignedFeederPoint) => void
  onStartTrip?: (feederPoint: AssignedFeederPoint) => void
  showSearch?: boolean
  showGrouping?: boolean
}

const { width } = Dimensions.get('window')

const EnhancedFeederPointsList = ({
  feederPoints,
  onFeederPointPress,
  onStartTrip,
  showSearch = true,
  showGrouping = true
}: EnhancedFeederPointsListProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all")
  const [viewMode, setViewMode] = useState<"list" | "compact" | "grid">("list")
  const [groupBy, setGroupBy] = useState<"none" | "ward" | "status" | "priority">("none")

  // Filter and group feeder points
  const { filteredPoints, groupedPoints } = useMemo(() => {
    let filtered = feederPoints.filter(fp => {
      const matchesSearch = (fp.feederPointName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fp.areaName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fp.wardNumber || '').includes(searchQuery)

      const status = fp.completedTrips >= fp.totalTrips ? "completed" :
        fp.completedTrips > 0 ? "in_progress" : "pending"

      const matchesFilter = selectedFilter === "all" ||
        (selectedFilter === "pending" && status === "pending") ||
        (selectedFilter === "in_progress" && status === "in_progress") ||
        (selectedFilter === "completed" && status === "completed")

      return matchesSearch && matchesFilter
    })

    // Group points if needed
    let grouped: { [key: string]: AssignedFeederPoint[] } = {}

    if (groupBy === "none") {
      grouped["all"] = filtered
    } else if (groupBy === "ward") {
      filtered.forEach(fp => {
        const key = `Ward ${fp.wardNumber || 'Unknown'}`
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(fp)
      })
    } else if (groupBy === "status") {
      filtered.forEach(fp => {
        const status = fp.completedTrips >= fp.totalTrips ? "Completed" :
          fp.completedTrips > 0 ? "In Progress" : "Pending"
        if (!grouped[status]) grouped[status] = []
        grouped[status].push(fp)
      })
    } else if (groupBy === "priority") {
      filtered.forEach(fp => {
        const priority = fp.priority || "medium"
        const key = priority.charAt(0).toUpperCase() + priority.slice(1) + " Priority"
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(fp)
      })
    }

    return { filteredPoints: filtered, groupedPoints: grouped }
  }, [feederPoints, searchQuery, selectedFilter, groupBy])

  const getStatusColor = (fp: AssignedFeederPoint) => {
    if (fp.completedTrips >= fp.totalTrips) return "#10b981"
    if (fp.completedTrips > 0) return "#f59e0b"
    return "#6b7280"
  }

  const getStatusIcon = (fp: AssignedFeederPoint) => {
    if (fp.completedTrips >= fp.totalTrips) return "check-circle"
    if (fp.completedTrips > 0) return "schedule"
    return "radio-button-unchecked"
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "#ef4444"
      case "medium": return "#f59e0b"
      case "low": return "#10b981"
      default: return "#6b7280"
    }
  }

  const renderCompactCard = ({ item }: { item: AssignedFeederPoint }) => (
    <TouchableOpacity
      style={styles.compactCard}
      onPress={() => onFeederPointPress?.(item)}
    >
      <View style={styles.compactContent}>
        <View style={styles.compactHeader}>
          <MaterialIcons
            name={getStatusIcon(item)}
            size={16}
            color={getStatusColor(item)}
          />
          <Text style={styles.compactName} numberOfLines={1}>
            {item.feederPointName || 'Unknown Location'}
          </Text>
          <Text style={styles.compactProgress}>
            {item.completedTrips || 0}/{item.totalTrips || 0}
          </Text>
        </View>
        <Text style={styles.compactArea} numberOfLines={1}>
          {item.areaName || 'Unknown Area'}, Ward {item.wardNumber || 'N/A'}
        </Text>
        {item.priority && (
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
        )}
      </View>
    </TouchableOpacity>
  )

  const renderListCard = ({ item }: { item: AssignedFeederPoint }) => (
    <Card style={styles.feederPointCard}>
      <TouchableOpacity onPress={() => onFeederPointPress?.(item)}>
        <View style={styles.feederPointContent}>
          <View style={styles.feederPointHeader}>
            <View style={styles.feederPointTitleRow}>
              <MaterialIcons name="location-on" size={20} color="#3b82f6" />
              <Text style={styles.feederPointName}>{item.feederPointName || 'Unknown Location'}</Text>
              {item.priority && (
                <Chip
                  style={[styles.priorityChip, { backgroundColor: `${getPriorityColor(item.priority)}20` }]}
                  textStyle={[styles.priorityChipText, { color: getPriorityColor(item.priority) }]}
                >
                  {item.priority.toUpperCase()}
                </Chip>
              )}
            </View>
            <View style={styles.tripProgress}>
              <MaterialIcons
                name={getStatusIcon(item)}
                size={20}
                color={getStatusColor(item)}
              />
              <Text style={styles.tripCount}>{item.completedTrips || 0}/{item.totalTrips || 0}</Text>
            </View>
          </View>

          <Text style={styles.feederPointArea}>{item.areaName || 'Unknown Area'}, Ward {item.wardNumber || 'N/A'}</Text>
          <Text style={styles.feederPointLandmark}>📍 {item.nearestLandmark || 'No landmark specified'}</Text>

          <View style={styles.feederPointStats}>
            <Text style={styles.householdsText}>~{item.approximateHouseholds || 'Unknown'} households</Text>
            {item.nextTripTime && item.completedTrips < item.totalTrips && (
              <Text style={styles.nextTripTime}>Next: {item.nextTripTime}</Text>
            )}
            {item.completedTrips >= item.totalTrips && (
              <Text style={styles.completedText}>✅ All trips completed</Text>
            )}
          </View>

          {item.completedTrips < item.totalTrips && onStartTrip && (
            <TouchableOpacity
              style={styles.startTripButton}
              onPress={() => onStartTrip(item)}
            >
              <MaterialIcons name="play-arrow" size={16} color="#ffffff" />
              <Text style={styles.startTripText}>Start Trip</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  )

  const renderGridCard = ({ item }: { item: AssignedFeederPoint }) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => onFeederPointPress?.(item)}
    >
      <View style={styles.gridContent}>
        <MaterialIcons
          name={getStatusIcon(item)}
          size={24}
          color={getStatusColor(item)}
        />
        <Text style={styles.gridName} numberOfLines={2}>
          {item.feederPointName || 'Unknown Location'}
        </Text>
        <Text style={styles.gridArea} numberOfLines={1}>
          Ward {item.wardNumber || 'N/A'}
        </Text>
        <Text style={styles.gridProgress}>
          {item.completedTrips || 0}/{item.totalTrips || 0}
        </Text>
        {item.priority && (
          <View style={[styles.gridPriorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
        )}
      </View>
    </TouchableOpacity>
  )

  const renderItem = ({ item }: { item: AssignedFeederPoint }) => {
    switch (viewMode) {
      case "compact": return renderCompactCard({ item })
      case "grid": return renderGridCard({ item })
      default: return renderListCard({ item })
    }
  }

  const renderGroupHeader = (groupName: string, items: AssignedFeederPoint[]) => (
    <View style={styles.groupHeader}>
      <Text style={styles.groupTitle}>{groupName}</Text>
      <Chip style={styles.groupCount} textStyle={styles.groupCountText}>
        {items.length}
      </Chip>
    </View>
  )

  const renderGroupedList = () => {
    return (
      <View>
        {Object.entries(groupedPoints).map(([groupName, items]) => (
          <View key={groupName}>
            {groupBy !== "none" && renderGroupHeader(groupName, items)}
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              numColumns={viewMode === "grid" ? 2 : 1}
              key={viewMode} // Force re-render when view mode changes
            />
          </View>
        ))}
      </View>
    )
  }

  const pendingCount = filteredPoints.filter(fp => fp.completedTrips === 0).length
  const inProgressCount = filteredPoints.filter(fp => fp.completedTrips > 0 && fp.completedTrips < fp.totalTrips).length
  const completedCount = filteredPoints.filter(fp => fp.completedTrips >= fp.totalTrips).length

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {showSearch && (
        <Searchbar
          placeholder="Search routes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      )}

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterChips}>
          {[
            { key: "all", label: "All", count: filteredPoints.length },
            { key: "pending", label: "Pending", count: pendingCount },
            { key: "in_progress", label: "In Progress", count: inProgressCount },
            { key: "completed", label: "Completed", count: completedCount }
          ].map((filter) => (
            <Chip
              key={filter.key}
              selected={selectedFilter === filter.key}
              onPress={() => setSelectedFilter(filter.key as any)}
              style={[
                styles.filterChip,
                selectedFilter === filter.key && styles.filterChipSelected
              ]}
              textStyle={[
                styles.filterChipText,
                selectedFilter === filter.key && styles.filterChipTextSelected
              ]}
            >
              {filter.label} ({filter.count})
            </Chip>
          ))}
        </View>
      </View>

      {/* View Mode and Grouping Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.viewModeControls}>
          {["list", "compact", "grid"].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.viewModeButtonSelected
              ]}
              onPress={() => setViewMode(mode as any)}
            >
              <MaterialIcons
                name={mode === "list" ? "view-list" : mode === "compact" ? "view-agenda" : "view-module"}
                size={20}
                color={viewMode === mode ? "#ffffff" : "#6b7280"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {showGrouping && (
          <View style={styles.groupControls}>
            <TouchableOpacity
              style={styles.groupButton}
              onPress={() => {
                const options = ["none", "ward", "status", "priority"]
                const currentIndex = options.indexOf(groupBy)
                const nextIndex = (currentIndex + 1) % options.length
                setGroupBy(options[nextIndex] as any)
              }}
            >
              <MaterialIcons name="group-work" size={16} color="#6b7280" />
              <Text style={styles.groupButtonText}>
                Group: {groupBy === "none" ? "None" : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Feeder Points List */}
      {filteredPoints.length > 0 ? (
        renderGroupedList()
      ) : (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <MaterialIcons name="map" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No routes found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? "Try adjusting your search" : "No routes assigned for today"}
            </Text>
          </View>
        </Card>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
  },
  filterChipSelected: {
    backgroundColor: "#3b82f6",
  },
  filterChipText: {
    color: "#6b7280",
    fontSize: 12,
  },
  filterChipTextSelected: {
    color: "#ffffff",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewModeControls: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 6,
  },
  viewModeButtonSelected: {
    backgroundColor: "#3b82f6",
  },
  groupControls: {
    flexDirection: "row",
  },
  groupButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  groupButtonText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  groupCount: {
    backgroundColor: "#e5e7eb",
    height: 24,
  },
  groupCountText: {
    fontSize: 11,
    color: "#6b7280",
  },
  // List view styles
  feederPointCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 12,
  },
  feederPointContent: {
    padding: 16,
  },
  feederPointHeader: {
    marginBottom: 8,
  },
  feederPointTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  feederPointName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  priorityChip: {
    height: 24,
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: "600",
  },
  tripProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tripCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  feederPointArea: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  feederPointLandmark: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  feederPointStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  householdsText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  nextTripTime: {
    fontSize: 12,
    color: "#f59e0b",
    fontWeight: "500",
  },
  completedText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  startTripButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    gap: 4,
  },
  startTripText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Compact view styles
  compactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    marginBottom: 6,
  },
  compactContent: {
    padding: 12,
    position: "relative",
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  compactName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  compactProgress: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  compactArea: {
    fontSize: 12,
    color: "#6b7280",
  },
  priorityDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Grid view styles
  gridCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    margin: 6,
    width: (width - 48) / 2, // Account for padding and gaps
  },
  gridContent: {
    padding: 16,
    alignItems: "center",
    position: "relative",
  },
  gridName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  gridArea: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  gridProgress: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  gridPriorityDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Empty state
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginTop: 20,
  },
  emptyContent: {
    padding: 32,
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

export default EnhancedFeederPointsList
