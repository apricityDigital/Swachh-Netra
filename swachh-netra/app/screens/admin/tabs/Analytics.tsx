"use client"

import { useState } from "react"
import { View, StyleSheet, ScrollView, Dimensions } from "react-native"
import { Card, Text, Button, Chip } from "react-native-paper"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"

const screenWidth = Dimensions.get("window").width

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#1976d2",
    },
  }

  const attendanceData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [85, 92, 88, 94, 90, 87, 89],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const collectionData = {
    labels: ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"],
    datasets: [
      {
        data: [450, 380, 520, 290, 410],
      },
    ],
  }

  const performanceData = [
    {
      name: "Excellent",
      population: 45,
      color: "#4caf50",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
    {
      name: "Good",
      population: 35,
      color: "#2196f3",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
    {
      name: "Average",
      population: 15,
      color: "#ff9800",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
    {
      name: "Poor",
      population: 5,
      color: "#f44336",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
  ]

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Analytics & Reports
      </Text>

      {/* Period Selection */}
      <View style={styles.periodContainer}>
        <Text variant="titleMedium">Time Period:</Text>
        <View style={styles.periodChips}>
          {["week", "month", "quarter", "year"].map((period) => (
            <Chip
              key={period}
              mode={selectedPeriod === period ? "flat" : "outlined"}
              selected={selectedPeriod === period}
              onPress={() => setSelectedPeriod(period)}
              style={styles.periodChip}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Text variant="headlineLarge" style={styles.metricValue}>
              92%
            </Text>
            <Text variant="bodyMedium">Avg Attendance</Text>
            <Text variant="bodySmall" style={styles.metricChange}>
              +5% from last week
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Text variant="headlineLarge" style={styles.metricValue}>
              2,050
            </Text>
            <Text variant="bodyMedium">Total Collections</Text>
            <Text variant="bodySmall" style={styles.metricChange}>
              +12% from last week
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Text variant="headlineLarge" style={styles.metricValue}>
              98%
            </Text>
            <Text variant="bodyMedium">Route Completion</Text>
            <Text variant="bodySmall" style={styles.metricChange}>
              +2% from last week
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.metricCard}>
          <Card.Content style={styles.metricContent}>
            <Text variant="headlineLarge" style={styles.metricValue}>
              4.8
            </Text>
            <Text variant="bodyMedium">Avg Rating</Text>
            <Text variant="bodySmall" style={styles.metricChange}>
              +0.2 from last week
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Attendance Trend */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.chartTitle}>
            Weekly Attendance Trend
          </Text>
          <LineChart
            data={attendanceData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Collection by Zone */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.chartTitle}>
            Waste Collection by Zone (kg)
          </Text>
          <BarChart
            data={collectionData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            yAxisLabel=""
            yAxisSuffix="kg"
          />
        </Card.Content>
      </Card>

      {/* Performance Distribution */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.chartTitle}>
            Driver Performance Distribution
          </Text>
          <PieChart
            data={performanceData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Export Options */}
      <Card style={styles.exportCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.exportTitle}>
            Export Reports
          </Text>
          <View style={styles.exportButtons}>
            <Button
              mode="outlined"
              icon="file-pdf-box"
              onPress={() => {
                /* Export PDF */
              }}
              style={styles.exportButton}
            >
              Export PDF
            </Button>
            <Button
              mode="outlined"
              icon="file-excel"
              onPress={() => {
                /* Export Excel */
              }}
              style={styles.exportButton}
            >
              Export Excel
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
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
  periodContainer: {
    marginBottom: 16,
  },
  periodChips: {
    flexDirection: "row",
    marginTop: 8,
  },
  periodChip: {
    marginRight: 8,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metricCard: {
    width: "48%",
    marginBottom: 8,
  },
  metricContent: {
    alignItems: "center",
  },
  metricValue: {
    color: "#1976d2",
    fontWeight: "bold",
  },
  metricChange: {
    color: "#4caf50",
    marginTop: 4,
  },
  chartCard: {
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 16,
    color: "#1976d2",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  exportCard: {
    marginBottom: 16,
  },
  exportTitle: {
    marginBottom: 12,
    color: "#1976d2",
  },
  exportButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exportButton: {
    flex: 1,
    marginHorizontal: 4,
  },
})

export default Analytics
