import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onDismiss,
  type = 'error'
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'error': return '#FFEBEE';
      case 'warning': return '#FFF3E0';
      case 'info': return '#E3F2FD';
      default: return '#FFEBEE';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error': return '#C62828';
      case 'warning': return '#EF6C00';
      case 'info': return '#1565C0';
      default: return '#C62828';
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'error': return 'alert-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'alert-circle';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <View style={styles.content}>
        <Ionicons 
          name={getIconName()} 
          size={20} 
          color={getTextColor()} 
          style={styles.icon}
        />
        <Text style={[styles.message, { color: getTextColor() }]}>
          {message}
        </Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={20} color={getTextColor()} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default ErrorMessage;
