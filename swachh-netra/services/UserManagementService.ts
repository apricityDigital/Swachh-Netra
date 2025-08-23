// Simplified service without Firebase dependencies for now
// import {
//   collection,
//   doc,
//   getDocs,
//   getDoc,
//   updateDoc,
//   deleteDoc,
//   query,
//   where,
//   orderBy,
//   Timestamp
// } from "firebase/firestore"
// import { FIREBASE_DB } from "../FirebaseConfig"

export interface User {
  id: string
  fullName: string
  email: string
  phone: string
  role: "admin" | "swachh_hr" | "contractor" | "driver"
  isActive: boolean
  createdAt: string
  lastLogin?: string
  department?: string
  permissions?: string[]
  assignedVehicles?: string[]
  assignedFeederPoints?: string[]
  contractorId?: string
  profileImage?: string
  address?: string
  emergencyContact?: string
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  swachhHRUsers: number
  contractorUsers: number
  driverUsers: number
  recentLogins: number
  pendingApprovals: number
}

export interface RoleChangeLog {
  id: string
  userId: string
  userName: string
  previousRole: string
  newRole: string
  changedBy: string
  changedAt: string
  reason?: string
}

class UserManagementService {
  // Mock data for development
  private mockUsers: User[] = [
    {
      id: "1",
      fullName: "Priya Sharma",
      email: "priya.sharma@swachhnetra.com",
      phone: "+91 98765 43210",
      role: "swachh_hr",
      department: "Human Resources",
      isActive: true,
      createdAt: "2024-01-15",
      lastLogin: "2024-01-20",
      permissions: ["user_management", "reports", "attendance"],
    },
    {
      id: "2",
      fullName: "Rajesh Kumar",
      email: "rajesh.kumar@swachhnetra.com",
      phone: "+91 87654 32109",
      role: "swachh_hr",
      department: "Operations",
      isActive: true,
      createdAt: "2024-01-10",
      lastLogin: "2024-01-19",
      permissions: ["operations", "scheduling", "reports"],
    },
    {
      id: "3",
      fullName: "Anita Patel",
      email: "anita.patel@swachhnetra.com",
      phone: "+91 76543 21098",
      role: "swachh_hr",
      department: "Training",
      isActive: false,
      createdAt: "2024-01-05",
      permissions: ["training", "documentation"],
    },
    {
      id: "4",
      fullName: "Admin User",
      email: "admin@swachhnetra.com",
      phone: "+91 99999 99999",
      role: "admin",
      department: "Administration",
      isActive: true,
      createdAt: "2024-01-01",
      lastLogin: "2024-01-21",
      permissions: ["all"],
    },
    {
      id: "5",
      fullName: "John Contractor",
      email: "john@contractor.com",
      phone: "+91 88888 88888",
      role: "contractor",
      department: "Fleet Management",
      isActive: true,
      createdAt: "2024-01-12",
      lastLogin: "2024-01-20",
      permissions: ["fleet", "drivers"],
    },
  ]

  /**
   * Get all users with optional role filtering
   */
  async getAllUsers(roleFilter?: string): Promise<User[]> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100))

      let users = [...this.mockUsers]

      if (roleFilter) {
        users = users.filter(user => user.role === roleFilter)
      }

      // Sort by creation date (newest first)
      users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return users
    } catch (error) {
      console.error("Error fetching users:", error)
      throw new Error("Failed to fetch users")
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 50))

      const user = this.mockUsers.find(u => u.id === userId)
      return user || null
    } catch (error) {
      console.error("Error fetching user:", error)
      throw new Error("Failed to fetch user")
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const q = query(
        this.usersCollection,
        where("role", "==", role),
        orderBy("createdAt", "desc")
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User))
    } catch (error) {
      console.error("Error fetching users by role:", error)
      throw new Error(`Failed to fetch ${role} users`)
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100))

      const userIndex = this.mockUsers.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        this.mockUsers[userIndex] = {
          ...this.mockUsers[userIndex],
          ...updates,
        }
      } else {
        throw new Error("User not found")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      throw new Error("Failed to update user")
    }
  }

  /**
   * Change user role with logging
   */
  async changeUserRole(
    userId: string,
    newRole: string,
    changedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      // Get current user data
      const currentUser = await this.getUserById(userId)
      if (!currentUser) {
        throw new Error("User not found")
      }

      // Update user role
      await this.updateUser(userId, { role: newRole as any })

      // Log the role change
      await this.logRoleChange({
        userId,
        userName: currentUser.fullName,
        previousRole: currentUser.role,
        newRole,
        changedBy,
        changedAt: new Date().toISOString(),
        reason
      })
    } catch (error) {
      console.error("Error changing user role:", error)
      throw new Error("Failed to change user role")
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(userId: string): Promise<void> {
    try {
      const user = await this.getUserById(userId)
      if (!user) {
        throw new Error("User not found")
      }

      await this.updateUser(userId, {
        isActive: !user.isActive,
      })
    } catch (error) {
      console.error("Error toggling user status:", error)
      throw new Error("Failed to update user status")
    }
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async deleteUser(userId: string, deletedBy: string): Promise<void> {
    try {
      // For mock data, we'll actually remove the user
      await new Promise(resolve => setTimeout(resolve, 100))

      const userIndex = this.mockUsers.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        this.mockUsers.splice(userIndex, 1)
      } else {
        throw new Error("User not found")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      throw new Error("Failed to delete user")
    }
  }

  /**
   * Hard delete user (permanent removal)
   */
  async permanentDeleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(this.usersCollection, userId)
      await deleteDoc(userRef)
    } catch (error) {
      console.error("Error permanently deleting user:", error)
      throw new Error("Failed to permanently delete user")
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const users = await this.getAllUsers()

      const stats: UserStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        adminUsers: users.filter(u => u.role === "admin").length,
        swachhHRUsers: users.filter(u => u.role === "swachh_hr").length,
        contractorUsers: users.filter(u => u.role === "contractor").length,
        driverUsers: users.filter(u => u.role === "driver").length,
        recentLogins: users.filter(u => u.lastLogin &&
          new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        pendingApprovals: users.filter(u => !u.isActive && u.role === "driver").length
      }

      return stats
    } catch (error) {
      console.error("Error getting user stats:", error)
      throw new Error("Failed to get user statistics")
    }
  }

  /**
   * Search users by query
   */
  async searchUsers(searchQuery: string, roleFilter?: string): Promise<User[]> {
    try {
      const users = await this.getAllUsers(roleFilter)

      const query = searchQuery.toLowerCase()
      return users.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query) ||
        (user.department && user.department.toLowerCase().includes(query))
      )
    } catch (error) {
      console.error("Error searching users:", error)
      throw new Error("Failed to search users")
    }
  }

  /**
   * Log role change
   */
  private async logRoleChange(logData: Omit<RoleChangeLog, "id">): Promise<void> {
    try {
      // In a real implementation, you would add this to Firestore
      console.log("Role change logged:", logData)
    } catch (error) {
      console.error("Error logging role change:", error)
      // Don't throw here as it's not critical
    }
  }

  /**
   * Get role change history for a user
   */
  async getRoleChangeHistory(userId: string): Promise<RoleChangeLog[]> {
    try {
      // In a real implementation, you would query Firestore
      // For now, return empty array
      return []
    } catch (error) {
      console.error("Error fetching role change history:", error)
      throw new Error("Failed to fetch role change history")
    }
  }

  /**
   * Validate role permissions
   */
  validateRoleChange(currentUserRole: string, targetRole: string): boolean {
    // Only admins can change roles to admin
    if (targetRole === "admin" && currentUserRole !== "admin") {
      return false
    }

    // Admins can change any role
    if (currentUserRole === "admin") {
      return true
    }

    // Swachh-HR can manage contractor and driver roles
    if (currentUserRole === "swachh_hr") {
      return ["contractor", "driver", "swachh_hr"].includes(targetRole)
    }

    // Contractors can only manage driver roles
    if (currentUserRole === "contractor") {
      return targetRole === "driver"
    }

    return false
  }

  /**
   * Get users accessible to current user based on their role
   */
  async getAccessibleUsers(currentUserRole: string, currentUserId: string): Promise<User[]> {
    try {
      const allUsers = await this.getAllUsers()

      switch (currentUserRole) {
        case "admin":
          // Admins can see all users
          return allUsers

        case "swachh_hr":
          // Swachh-HR can see all except other admins
          return allUsers.filter(user => user.role !== "admin")

        case "contractor":
          // Contractors can see drivers assigned to them and other contractors
          return allUsers.filter(user =>
            user.role === "driver" ||
            (user.role === "contractor" && user.id === currentUserId)
          )

        case "driver":
          // Drivers can only see their own profile
          return allUsers.filter(user => user.id === currentUserId)

        default:
          return []
      }
    } catch (error) {
      console.error("Error getting accessible users:", error)
      throw new Error("Failed to get accessible users")
    }
  }
}

export const userManagementService = new UserManagementService()
export default UserManagementService
