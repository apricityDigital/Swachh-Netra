import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Appbar, FAB, Chip } from 'react-native-paper';
import { useAuth } from '@context/AuthContext';

const DriverDashboard: React.FC = () => {
  const { user, userData, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="Driver Dashboard" 
          subtitle="Swach Netra - Driver Portal"
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
              Driver - Swach Netra
            </Chip>
            <Text style={styles.description}>
              Manage your vehicle routes, waste collection schedules, and municipal assignments.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Today's Overview</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Routes Assigned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>6</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <Button 
              mode="contained" 
              style={styles.actionButton}
              icon="map-marker-path"
            >
              View Routes
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="truck"
            >
              Vehicle Status
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="clipboard-check"
            >
              Report Issue
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {}}
        label="New Report"
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
    backgroundColor: '#4caf50',
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
    color: '#2e7d32',
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#e8f5e8',
  },
  roleText: {
    color: '#2e7d32',
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
    color: '#4caf50',
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
    backgroundColor: '#4caf50',
  },
});

export default DriverDashboard;
