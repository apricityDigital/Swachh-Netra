import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Appbar, FAB, Chip, DataTable } from 'react-native-paper';
import { useAuth } from '@context/AuthContext';

const ContractorDashboard: React.FC = () => {
  const { user, userData, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="Contractor Dashboard" 
          subtitle="Swach Netra - Contractor Portal"
        />
        <Appbar.Action icon="account" onPress={() => {}} />
        <Appbar.Action icon="logout" onPress={signOut} />
      </Appbar.Header>
      
      <ScrollView style={styles.content}>
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <Text style={styles.welcomeText}>
              Welcome, {userData?.name || user?.email}!
            </Text>
            <Chip style={styles.roleChip} textStyle={styles.roleText}>
              Contractor - Swach Netra
            </Chip>
            <Text style={styles.description}>
              Manage contracts, monitor work progress, and coordinate with municipal authorities.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Contract Overview</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Active Contracts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Workers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Areas Covered</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.tableCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Recent Activities</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Area</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
                <DataTable.Title numeric>Progress</DataTable.Title>
              </DataTable.Header>
              <DataTable.Row>
                <DataTable.Cell>Zone A</DataTable.Cell>
                <DataTable.Cell>In Progress</DataTable.Cell>
                <DataTable.Cell numeric>75%</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Zone B</DataTable.Cell>
                <DataTable.Cell>Completed</DataTable.Cell>
                <DataTable.Cell numeric>100%</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Zone C</DataTable.Cell>
                <DataTable.Cell>Pending</DataTable.Cell>
                <DataTable.Cell numeric>25%</DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <Button 
              mode="contained" 
              style={styles.actionButton}
              icon="file-document"
            >
              View Contracts
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="account-group"
            >
              Manage Workers
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="chart-line"
            >
              Progress Reports
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {}}
        label="New Contract"
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
    backgroundColor: '#ff9800',
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
    color: '#e65100',
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#fff3e0',
  },
  roleText: {
    color: '#e65100',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    backgroundColor: '#ff9800',
  },
});

export default ContractorDashboard;
