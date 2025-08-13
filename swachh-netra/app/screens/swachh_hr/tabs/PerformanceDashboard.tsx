"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from "react-native"
import { Card, Title, Text, Chip, List } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { PieChart, BarChart, LineChart } from "react-native-chart-kit"

const screenWidth = Dimensions.get("window").width

export default function PerformanceDashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d")

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }

  // Mock data for charts
  const attendanceData = [
    {
      name: "Present",
      population: 85,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Absent",
      population: 10,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
    {
      name: "Late",
      population: 5,
      color: "#FF9800",
      legendFontColor: "#333",
      legendFontSize: 12,
    },
  ]

  const wasteCollectionTrend = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [120, 145, 132, 158, 142, 135, 165],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const topPerformers = [
    { id: "1", name: "Priya Sharma", score: 98, wasteAvg: 52.5, attendanceRate: 100 },
    { id: "2", name: "Rajesh Kumar", score: 95, wasteAvg: 48.2, attendanceRate: 95 },
    { id: "3", name: "Sunita Devi", score: 92, wasteAvg: 45.8, attendanceRate: 98 },
    { id: "4", name: "Amit Singh", score: 88, wasteAvg: 42.1, attendanceRate: 90 },
    { id: "5", name: "Ravi Patel", score: 85, wasteAvg: 40.5, attendanceRate: 88 },
  ]

  const feederPointPerformance = {
    labels: ["FP-A12", "FP-B08", "FP-C15", "FP-D20"],
    datasets: [
      {
        data: [95, 88, 92, 85],
      },
    ],
  }

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
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
            <Title>Performance Overview</Title>
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
            <Title>Attendance Distribution</Title>
            <PieChart
              data={attendanceData}
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
            <Title>Daily Waste Collection Trend</Title>
            <LineChart
              data={wasteCollectionTrend}
              width={screenWidth - 64}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              }}
              bezier
              style={styles.chart}
            />
            <Text style={styles.chartNote}>Total waste collected in kg per day</Text>
          </Card.Content>
        </Card>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Title>Feeder Point Efficiency</Title>
            <BarChart
              data={feederPointPerformance}
              width={screenWidth - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix="%"
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
              }}
              style={styles.chart}
            />
            <Text style={styles.chartNote}>Overall efficiency percentage by feeder point</Text>
          </Card.Content>
        </Card>

        <Card style={styles.performersCard}>
          <Card.Content>
            <Title>Top Performing Workers</Title>
            {topPerformers.map((worker, index) => (
              <Card key={worker.id} style={styles.performerCard}>
                <Card.Content>
                  <View style={styles.performerHeader}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerName}>{worker.name}</Text>
                      <Text style={styles.performerScore}>Performance Score: {worker.score}%</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={index === 0 ? "trophy" : index === 1 ? "medal" : "star"}
                      size={24}
                      color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"}
                    />
                  </View>

                  <View style={styles.performerMetrics}>
                    <View style={styles.performerMetric}>
                      <MaterialCommunityIcons name="delete-variant" size={16} color="#4CAF50" />
                      <Text style={styles.metricText}>{worker.wasteAvg}kg avg</Text>
                    </View>
                    <View style={styles.performerMetric}>
                      <MaterialCommunityIcons name="calendar-check" size={16} color="#2196F3" />
                      <Text style={styles.metricText}>{worker.attendanceRate}% attendance</Text>
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
              title="Attendance Improvement"
              description="Overall attendance increased by 5% this week"
              left={(props) => <MaterialCommunityIcons {...props} name="trending-up" size={24} color="#4CAF50" />}
              style={styles.insightItem}
            />
            <List.Item
              title="Waste Collection Peak"
              description="Highest collection on Wednesday (165kg total)"
              left={(props) => <MaterialCommunityIcons {...props} name="chart-line" size={24} color="#2196F3" />}
              style={styles.insightItem}
            />
            <List.Item
              title="Underperforming Point"
              description="FP-D20 needs attention - 15% below average"
              left={(props) => <MaterialCommunityIcons {...props} name="alert-circle" size={24} color="#FF9800" />}
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
    backgroundColor: "#E3F2FD",
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
    backgroundColor: "#2196F3",
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
