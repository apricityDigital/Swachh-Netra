import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Appbar, FAB, Chip, List, Divider } from 'react-native-paper';
import { useAuth } from '@context/AuthContext';

const SwachhHRDashboard: React.FC = () => {
  const { user, userData, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.Content 
          title="Swachh HR Dashboard" 
          subtitle="Swach Netra - HR Management Portal"
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
              Swachh HR - Human Resources
            </Chip>
            <Text style={styles.description}>
              Manage employee records, attendance, and HR operations for municipal services.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>HR Overview</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>156</Text>
                <Text style={styles.statLabel}>Total Employees</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>142</Text>
                <Text style={styles.statLabel}>Present Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>14</Text>
                <Text style={styles.statLabel}>On Leave</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.listCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Recent HR Activities</Text>
            <List.Item
              title="New Employee Onboarding"
              description="5 new sanitation workers joined"
              left={props => <List.Icon {...props} icon="account-plus" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
            <Divider />
            <List.Item
              title="Attendance Review"
              description="Weekly attendance completed"
              left={props => <List.Icon {...props} icon="calendar-check" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
            <Divider />
            <List.Item
              title="Performance Evaluation"
              description="Monthly reviews pending"
              left={props => <List.Icon {...props} icon="chart-box" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <Button 
              mode="contained" 
              style={styles.actionButton}
              icon="account-group"
            >
              Employee Management
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="calendar-month"
            >
              Attendance Tracking
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="file-chart"
            >
              HR Reports
            </Button>
            <Button 
              mode="outlined" 
              style={styles.actionButton}
              icon="school"
            >
              Training Programs
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {}}
        label="Add Employee"
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
    backgroundColor: '#2196f3',
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
    color: '#1565c0',
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#e3f2fd',
  },
  roleText: {
    color: '#1565c0',
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
  listCard: {
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
    color: '#2196f3',
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
    backgroundColor: '#2196f3',
  },
});

export default SwachhHRDashboard;
