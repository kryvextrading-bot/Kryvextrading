/**
 * Mock Authentication Service
 * For testing the trading platform without real database authentication
 */

interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  balance: number;
}

// Mock users for testing
const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'user@test.com',
    firstName: 'Test',
    lastName: 'User',
    isAdmin: false,
    balance: 10000
  },
  {
    id: '99',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    isAdmin: true,
    balance: 0
  }
];

class MockAuthService {
  private currentUser: MockUser | null = null;

  async signIn(email: string, password: string): Promise<{ profile: MockUser }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find user by email (password is ignored in mock)
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Invalid login credentials');
    }

    this.currentUser = user;
    
    // Store in localStorage for persistence
    localStorage.setItem('mockUser', JSON.stringify(user));
    
    return { profile: user };
  }

  async getCurrentUser(): Promise<{ profile: MockUser | null }> {
    // Check localStorage first
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      return { profile: this.currentUser };
    }

    return { profile: null };
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('mockUser');
  }

  async register(userData: any): Promise<{ profile: MockUser }> {
    // Simulate registration
    await new Promise(resolve => setTimeout(resolve, 500));

    const newUser: MockUser = {
      id: (mockUsers.length + 1).toString(),
      email: userData.email,
      firstName: userData.firstName || 'New',
      lastName: userData.lastName || 'User',
      isAdmin: false,
      balance: 1000
    };

    mockUsers.push(newUser);
    this.currentUser = newUser;
    localStorage.setItem('mockUser', JSON.stringify(newUser));

    return { profile: newUser };
  }

  getCurrentUserSync(): MockUser | null {
    if (this.currentUser) return this.currentUser;
    
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      return this.currentUser;
    }
    
    return null;
  }
}

export const mockAuthService = new MockAuthService();
