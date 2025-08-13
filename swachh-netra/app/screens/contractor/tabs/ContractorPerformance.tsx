"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from "react-native"
import { Card, Title, Text, Chip, List } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { PieChart, BarChart, LineChart } from "react-native-chart-kit"

const screenWidth = Dimensions.get("window").width

export default function ContractorPerformance() {
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d")

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  // Mock data for charts
  const tripStatusData = [
    {
      name: "Completed",
      population: 78,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Delayed",
      population: 15,
      color: "#FF9800",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Cancelled",
      population: 7,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
  ]

  const wasteTransportTrend = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [450, 520, 480, 610, 580, 490, 650],
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const topPerformers = [
    { id: "1", name: "Ramesh Kumar", score: 96, tripsCompleted: 45, onTimeRate: 98 },
    { id: "2", name: "Suresh Patel", score: 92, tripsCompleted: 42, onTimeRate: 95 },
    { id: "3", name: "Vikash Singh", score: 88, tripsCompleted: 38, onTimeRate: 90 },
    { id: "4", name: "Mohan Lal", score: 85, tripsCompleted: 35, onTimeRate: 88 },
  ]

  const vehicleUtilization = {
    labels: ["V-003", "V-007", "V-012", "V-015"],
    datasets: [
      {
        data: [95, 88, 75, 82],
      },
    ],
  }

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  }

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title>Transport Performance</Title>
            <View style={styles.timeRangeSelector}>
              {["7d", "30d", "90d"].map((range) => (
                <Chip
                  key={range}
                  selected={timeRange === range}
                  onPress={() => setTimeRange(range as any)}
                  style={styles.timeChip}
                >
                  {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Trip Status Distribution</Title>
            <PieChart
              data={tripStatusData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 10]}
              absolute
            />
          </Card.Content>
        </Card>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Daily Waste Transport Trend</Title>
            <LineChart
              data={wasteTransportTrend}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
            <Text style={styles.chartNote}>Total waste transported in kg per day</Text>
          </Card.Content>
        </Card>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Vehicle Utilization Rate</Title>
            <BarChart
              data={vehicleUtilization}
              width={screenWidth - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={chartConfig}
              style={styles.chart}
            />
            <Text style={styles.chartNote}>Vehicle utilization percentage</Text>
          </Card.Content>
        </Card>

        <Card style={styles.performersCard}>
          <Card.Content>
            <Title>Top Performing Drivers</Title>
            {topPerformers.map((driver, index) => (
              <Card key={driver.id} style={styles.performerCard}>
                <Card.Content>
                  <View style={styles.performerHeader}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{driver.name}</Text>
                      <Text style={styles.performerScore}>Performance Score: {driver.score}%</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={index === 0 ? "trophy" : index === 1 ? "medal" : "star"}
                      size={24}
                      color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"}
                    />
                  </View>

                  <View style={styles.performerMetrics}>
                    <View style={styles.performerMetric}>
                      <MaterialCommunityIcons name="truck-check" size={16} color="#4CAF50" />
                      <Text style={styles.metricText}>{driver.tripsCompleted} trips</Text>
                    </View>
                    <View style={styles.performerMetric}>
                      <MaterialCommunityIcons name="clock-check" size={16} color="#2196F3" />
                      <Text style={styles.metricText}>{driver.onTimeRate}% on-time</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.insightsCard}>
          <Card.Content>
            <Title>Performance Insights</Title>
            <List.Item
              title="Trip Completion Rate"
              description="78% of trips completed successfully this week"
              left={(props) => <MaterialCommunityIcons {...props} name="trending-up" size={24} color="#4CAF50" />}
              style={styles.insightItem}
            />
            <List.Item
              title="Peak Transport Day"
              description="Highest waste transport on Friday (650kg)"
              left={(props) => <MaterialCommunityIcons {...props} name="chart-line" size={24} color="#FF9800" />}
              style={styles.insightItem}
            />
            <List.Item
              title="Vehicle Maintenance Alert"
              description="V-012 showing lower utilization - check maintenance"
              left={(props) => <MaterialCommunityIcons {...props} name="alert-circle" size={24} color="#F44336" />}
              style={styles.insightItem}
            />
            <List.Item
              title="Driver Performance"
              description="Overall driver punctuality improved by 8%"
              left={(props) => <MaterialCommunityIcons {...props} name="account-check" size={24} color="#2196F3" />}
              style={styles.insightItem}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  timeRangeSelector: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  timeChip: {
    backgroundColor: "#FFF3E0",
  },
  chartCard: {
    marginBottom: 16,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartNote: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  performersCard: {
    marginBottom: 16,
    elevation: 2,
  },
  performerCard: {
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  performerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF9800",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  performerScore: {
    fontSize: 12,
    color: "#757575",
  },
  performerMetrics: {
    flexDirection: "row",
    gap: 16,
  },
  performerMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: "#757575",
  },
  insightsCard: {
    elevation: 2,
  },
  insightItem: {
    backgroundColor: "#f8f9fa",
    marginBottom: 8,
    borderRadius: 8,
  },
})
