import { useContext } from 'react'
import { Alert } from 'react-native'
import AuthContext from '../../contexts/AuthContext'
import { useProfessionalAlert } from '../components/ProfessionalAlert'

interface UseLogoutOptions {
  useProfessionalAlert?: boolean
  onLogoutStart?: () => void
  onLogoutComplete?: () => void
  onLogoutError?: (error: any) => void
}

export const useLogout = (options: UseLogoutOptions = {}) => {
  const authContext = useContext(AuthContext)
  if (!authContext) {
    throw new Error('useLogout must be used within an AuthProvider')
  }
  const { signOut } = authContext
  const { showAlert, AlertComponent } = useProfessionalAlert()
  const {
    useProfessionalAlert: useProfessional = true,
    onLogoutStart,
    onLogoutComplete,
    onLogoutError,
  } = options

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        if (onLogoutStart) onLogoutStart()

        console.log('🔄 [Logout] Starting logout process...')
        await signOut()

        console.log('✅ [Logout] Logout completed successfully')
        if (onLogoutComplete) onLogoutComplete()

      } catch (error) {
        console.error('❌ [Logout] Error during logout:', error)

        if (onLogoutError) {
          onLogoutError(error)
        } else {
          // Show error message
          if (useProfessional) {
            showAlert({
              title: 'Logout Failed',
              message: 'An error occurred while logging out. Please try again.',
              type: 'error',
              buttons: [{ text: 'OK' }],
            })
          } else {
            Alert.alert('Logout Failed', 'An error occurred while logging out. Please try again.')
          }
        }
      }
    }

    // Show confirmation dialog
    if (useProfessional) {
      showAlert({
        title: 'Confirm Logout',
        message: 'Are you sure you want to logout?',
        type: 'warning',
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ],
      })
    } else {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      )
    }
  }

  return {
    handleLogout,
    AlertComponent: useProfessional ? AlertComponent : null,
  }
}

// Quick logout hook for simple usage
export const useQuickLogout = (navigation?: any) => {
  const authContext = useContext(AuthContext)
  if (!authContext) {
    throw new Error('useQuickLogout must be used within an AuthProvider')
  }
  const { signOut } = authContext
  const { showAlert, AlertComponent } = useProfessionalAlert()

  const quickLogout = () => {
    showAlert({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 [QuickLogout] Starting logout process...')
              await signOut()
              console.log('✅ [QuickLogout] Logout completed successfully')

              // Navigate to login screen if navigation is provided
              if (navigation) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              }
            } catch (error) {
              console.error('❌ [QuickLogout] Logout error:', error)
              showAlert({
                title: 'Logout Failed',
                message: 'An error occurred while logging out. Please try again.',
                type: 'error',
              })
            }
          },
        },
      ],
    })
  }

  return { quickLogout, AlertComponent }
}
