// API Configuration
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://madjana.onrender.com/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    const response = await this.request<{
      token: string;
      user: any;
      message: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    return response;
  }

  async register(userData: { email: string; password: string; name: string; role?: string }) {
    const response = await this.request<{
      token: string;
      user: any;
      message: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    return response;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  async updateProfile(data: { name?: string; email?: string; phone?: string }) {
    return this.request<{ user: any; message: string }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Chicken management
  async getChickens() {
    return this.request<any[]>('/chickens');
  }

  async getChicken(id: string) {
    return this.request<any>(`/chickens/${id}`);
  }

  async addChicken(chicken: any) {
    return this.request<any>('/chickens', {
      method: 'POST',
      body: JSON.stringify(chicken),
    });
  }

  async updateChicken(id: string, chicken: any) {
    return this.request<any>(`/chickens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chicken),
    });
  }

  async deleteChicken(id: string) {
    return this.request<{ message: string }>(`/chickens/${id}`, {
      method: 'DELETE',
    });
  }

  async getHealthEvents(chickenId: string) {
    return this.request<any[]>(`/chickens/${chickenId}/health-events`);
  }

  async addHealthEvent(chickenId: string, event: any) {
    return this.request<any>(`/chickens/${chickenId}/health-events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // Egg production management
  async getEggProductions(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    return this.request<any[]>(`/eggs${queryString ? `?${queryString}` : ''}`);
  }

  async addEggProduction(production: any) {
    return this.request<any>('/eggs', {
      method: 'POST',
      body: JSON.stringify(production),
    });
  }

  async updateEggProduction(id: string, production: any) {
    return this.request<any>(`/eggs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(production),
    });
  }

  async deleteEggProduction(id: string) {
    return this.request<{ message: string }>(`/eggs/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales management
  async getSales(startDate?: string, endDate?: string, clientId?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (clientId) params.append('clientId', clientId);
    
    const queryString = params.toString();
    return this.request<any[]>(`/sales${queryString ? `?${queryString}` : ''}`);
  }

  async addSale(sale: any) {
    return this.request<any>('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async updateSale(id: string, sale: any) {
    return this.request<any>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sale),
    });
  }

  async deleteSale(id: string) {
    return this.request<{ message: string }>(`/sales/${id}`, {
      method: 'DELETE',
    });
  }

  // Client management
  async getClients() {
    return this.request<any[]>('/clients');
  }

  // AI assistant
  async sendAIMessage(message: string, farmStats?: any) {
    return this.request<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, farmStats }),
    });
  }

  async getClient(id: string) {
    return this.request<any>(`/clients/${id}`);
  }

  async addClient(client: any) {
    return this.request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async updateClient(id: string, client: any) {
    return this.request<any>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  async deleteClient(id: string) {
    return this.request<{ message: string }>(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Expense management
  async getExpenses(startDate?: string, endDate?: string, category?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (category) params.append('category', category);
    
    const queryString = params.toString();
    return this.request<any[]>(`/expenses${queryString ? `?${queryString}` : ''}`);
  }

  async addExpense(expense: any) {
    return this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(id: string, expense: any) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: string) {
    return this.request<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Carton management
  async getCartons() {
    return this.request<any[]>('/cartons');
  }

  async addCarton(carton: any) {
    return this.request<any>('/cartons', {
      method: 'POST',
      body: JSON.stringify(carton),
    });
  }

  async updateCarton(id: string, carton: any) {
    return this.request<any>(`/cartons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(carton),
    });
  }

  async deleteCarton(id: string) {
    return this.request<{ message: string }>(`/cartons/${id}`, {
      method: 'DELETE',
    });
  }

  // User management
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async addUser(user: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, user: any) {
    console.log('apiService.updateUser called:', { id, user });
    try {
      const result = await this.request<any>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
      });
      console.log('apiService.updateUser success:', result);
      return result;
    } catch (error: any) {
      console.error('apiService.updateUser error:', error);
      throw error;
    }
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard statistics
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string; database: string }>('/health');
  }
}

export const apiService = new ApiService();
