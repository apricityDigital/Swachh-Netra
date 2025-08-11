import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Appbar, FAB, Chip, DataTable, ProgressBar } from 'react-native-paper';
import { useAuth } from '@context/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user, userData, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="Admin Dashboard" 
          subtitle="Swach Netra - System Administration"
        />
        <Appbar.Action icon="cog" onPress={() => {}} />
        <Appbar.Action icon="account" onPress={() => {}} />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>
      
      <ScrollView style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text style={styles.welcomeText}>
              Welcome Admin, {userData?.name || user?.email}!
            </Text>
            <Chip style={styles.roleChip} textStyle={styles.roleText}>
              System Administrator
            </Chip>
            <Text style={styles.description}>
              Full system control and monitoring for Swach Netra municipal management platform.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>System Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1,248</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>34</Text>
                <Text style={styles.statLabel}>Active Drivers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Contractors</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>HR Staff</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.performanceCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>System Performance</Text>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Server Load</Text>
              <ProgressBar progress={0.65} color="#4caf50" style={styles.progressBar} />
              <Text style={styles.performanceValue}>65%</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Database Usage</Text>
              <ProgressBar progress={0.43} color="#2196f3" style={styles.progressBar} />
              <Text style={styles.performanceValue}>43%</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Active Sessions</Text>
              <ProgressBar progress={0.78} color="#ff9800" style={styles.progressBar} />
              <Text style={styles.performanceValue}>78%</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.tableCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Recent User Activities</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>User</DataTable.Title>
                <DataTable.Title>Role</DataTable.Title>
                <DataTable.Title>Last Active</DataTable.Title>
              </DataTable.Header>
              <DataTable.Row>
                <DataTable.Cell>John Driver</DataTable.Cell>
                <DataTable.Cell>Driver</DataTable.Cell>
                <DataTable.Cell>2 mins ago</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Sarah HR</DataTable.Cell>
                <DataTable.Cell>Swachh_HR</DataTable.Cell>
                <DataTable.Cell>15 mins ago</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Mike Contract</DataTable.Cell>
                <DataTable.Cell>Contractor</DataTable.Cell>
                <DataTable.Cell>1 hour ago</DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Admin Actions</Text>
            <Button 
              mode="contained" 
              style={styles.actionButton}
              icon="account-multiple"
            >
              User Management
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="database"
            >
              Database Management
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="chart-line"
            >
              Analytics & Reports
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="cog"
            >
              System Settings
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="security"
            >
              Security Logs
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {}}
        label="Quick Add"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#9c27b0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    elevation: 4,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#7b1fa2',
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#f3e5f5',
  },
  roleText: {
    color: '#7b1fa2',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  statsCard: {
    elevation: 4,
    marginBottom: 16,
  },
  performanceCard: {
    elevation: 4,
    marginBottom: 16,
  },
  tableCard: {
    elevation: 4,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9c27b0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  performanceItem: {
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  performanceValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  actionCard: {
    elevation: 4,
    marginBottom: 80,
  },
  actionButton: {
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#9c27b0',
  },
});

export default AdminDashboard;
