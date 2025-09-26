import React from 'react'
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
} from 'react-native'
import { Text, Button } from 'react-native-paper'
import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'

const { width } = Dimensions.get('window')

interface AlertButton {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

interface ProfessionalAlertProps {
  visible: boolean
  title: string
  message?: string
  buttons?: AlertButton[]
  type?: 'info' | 'success' | 'warning' | 'error'
  onDismiss?: () => void
}

const ProfessionalAlert: React.FC<ProfessionalAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  type = 'info',
  onDismiss,
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'check-circle', color: '#10b981', bgColor: '#ecfdf5' }
      case 'warning':
        return { icon: 'warning', color: '#f59e0b', bgColor: '#fffbeb' }
      case 'error':
        return { icon: 'error', color: '#ef4444', bgColor: '#fef2f2' }
      default:
        return { icon: 'info', color: '#3b82f6', bgColor: '#eff6ff' }
    }
  }

  const { icon, color, bgColor } = getIconAndColor()

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress()
    }
    if (onDismiss) {
      onDismiss()
    }
  }

  const getButtonMode = (style?: string) => {
    switch (style) {
      case 'destructive':
        return 'contained'
      case 'cancel':
        return 'outlined'
      default:
        return 'contained'
    }
  }

  const getButtonColor = (style?: string) => {
    switch (style) {
      case 'destructive':
        return '#ef4444'
      case 'cancel':
        return '#6b7280'
      default:
        return '#3b82f6'
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}

        <View style={styles.container}>
          <View style={styles.alertBox}>
            {/* Header with Icon */}
            <View style={[styles.header, { backgroundColor: bgColor }]}>
              <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <MaterialIcons name={icon as any} size={24} color="white" />
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <View key={index} style={styles.buttonWrapper}>
                  <Button
                    mode={getButtonMode(button.style)}
                    onPress={() => handleButtonPress(button)}
                    style={[
                      styles.button,
                      button.style === 'cancel' && styles.cancelButton,
                    ]}
                    buttonColor={
                      button.style === 'cancel' ? 'transparent' : getButtonColor(button.style)
                    }
                    textColor={
                      button.style === 'cancel' ? '#6b7280' : 'white'
                    }
                    compact
                  >
                    {button.text}
                  </Button>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
  },
  alertBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelButton: {
    borderColor: '#d1d5db',
    borderWidth: 1,
  },
})

// Hook for easy usage
export const useProfessionalAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean
    title: string
    message?: string
    buttons?: AlertButton[]
    type?: 'info' | 'success' | 'warning' | 'error'
  }>({
    visible: false,
    title: '',
  })

  const showAlert = (config: Omit<typeof alertConfig, 'visible'>) => {
    setAlertConfig({ ...config, visible: true })
  }

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }))
  }

  const AlertComponent = () => (
    <ProfessionalAlert
      {...alertConfig}
      onDismiss={hideAlert}
    />
  )

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  }
}

export default ProfessionalAlert
