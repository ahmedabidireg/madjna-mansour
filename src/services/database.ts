import { 
  Chicken, 
  HealthEvent, 
  EggProduction, 
  Sale, 
  Expense, 
  Carton,
  Vaccination,
  Client,
  User,
  UserActivity
} from '../types';
import { apiService } from './api';

class DatabaseService {
  private mapCarton(doc: any): Carton {
    return {
      id: doc.id ?? doc._id ?? crypto.randomUUID(),
      type: doc.type,
      capacity: doc.capacity,
      available_quantity: doc.available_quantity,
      purchase_price: doc.purchase_price,
      supplier: doc.supplier,
      purchase_date: typeof doc.purchase_date === 'string' ? doc.purchase_date : (doc.purchase_date ? new Date(doc.purchase_date).toISOString() : undefined),
    };
  }
  private mapSale(doc: any): Sale {
    return {
      id: doc.id ?? doc._id ?? crypto.randomUUID(),
      client_id: doc.client_id,
      client_name: doc.client_name,
      client_phone: doc.client_phone,
      sale_date: typeof doc.sale_date === 'string' ? doc.sale_date : new Date(doc.sale_date).toISOString(),
      items: (doc.items || []).map((it: any) => ({
        id: it.id ?? it._id ?? crypto.randomUUID(),
        product_type: it.product_type,
        batch_number: it.batch_number,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        description: it.description
      })),
      total_amount: doc.total_amount,
      payment_status: doc.payment_status,
      payment_method: doc.payment_method,
      invoice_number: doc.invoice_number,
      notes: doc.notes
    };
  }

  // Chickens Management
  async getChickens(): Promise<Chicken[]> {
    try {
      const raw = await apiService.getChickens();
      // Normalize backend documents to frontend shape
      return (raw || []).map((doc: any) => ({
        id: doc.id ?? doc._id ?? crypto.randomUUID(),
        batch_number: doc.batch_number,
        breed: doc.breed,
        count: doc.count,
        age_weeks: doc.age_weeks,
        purchase_date: typeof doc.purchase_date === 'string' ? doc.purchase_date : new Date(doc.purchase_date).toISOString(),
        purchase_price: doc.purchase_price,
        status: doc.status,
        current_stock: doc.current_stock ?? doc.stock ?? doc.available_stock ?? doc.count ?? 0,
        notes: doc.notes ?? '',
        created_at: typeof doc.created_at === 'string' ? doc.created_at : (doc.created_at ? new Date(doc.created_at).toISOString() : undefined),
      })) as Chicken[];
    } catch (error) {
      console.warn('API error, falling back to localStorage:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('chickens');
      return stored ? JSON.parse(stored) : [];
    }
  }

  async addChicken(chicken: Omit<Chicken, 'id'>): Promise<Chicken> {
    try {
      return await apiService.addChicken(chicken);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      // Fallback to localStorage
      const newChicken: Chicken = {
        id: crypto.randomUUID(),
        ...chicken,
      };
      const chickens = await this.getChickens();
      chickens.unshift(newChicken);
      localStorage.setItem('chickens', JSON.stringify(chickens));
      return newChicken;
    }
  }

  async updateChicken(id: string, chicken: Partial<Chicken>): Promise<Chicken> {
    try {
      return await apiService.updateChicken(id, chicken);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      // Fallback to localStorage
      const chickens = await this.getChickens();
      const index = chickens.findIndex(c => c.id === id);
      if (index !== -1) {
        chickens[index] = { ...chickens[index], ...chicken };
        localStorage.setItem('chickens', JSON.stringify(chickens));
        return chickens[index];
      }
      throw new Error('Chicken not found');
    }
  }

  async deleteChicken(id: string): Promise<boolean> {
    try {
      await apiService.deleteChicken(id);
      return true;
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      // Fallback to localStorage
      const chickens = await this.getChickens();
      const filteredChickens = chickens.filter(c => c.id !== id);
      localStorage.setItem('chickens', JSON.stringify(filteredChickens));
      return true;
    }
  }

  // Health Events Management
  async getHealthEvents(chickenId: string): Promise<HealthEvent[]> {
    try {
      const raw = await apiService.getHealthEvents(chickenId);
      return (raw || []).map((doc: any) => ({
        id: doc.id ?? doc._id ?? crypto.randomUUID(),
        chicken_id: doc.chicken_id ?? chickenId,
        event_type: doc.event_type,
        date: typeof doc.date === 'string' ? doc.date : new Date(doc.date).toISOString(),
        description: doc.description,
        medication: doc.medication,
        dosage: doc.dosage,
        veterinarian: doc.veterinarian,
        cost: doc.cost,
        notes: doc.notes
      })) as HealthEvent[];
    } catch (error) {
      console.warn('API error, falling back to localStorage:', error);
      const stored = localStorage.getItem('health_events');
      const allEvents = stored ? JSON.parse(stored) : [];
      return allEvents.filter((event: HealthEvent) => event.chicken_id === chickenId);
    }
  }

  async getHealthEventsForChickens(chickenIds: string[]): Promise<HealthEvent[]> {
    const results: HealthEvent[] = [];
    for (const chickenId of chickenIds) {
      const events = await this.getHealthEvents(chickenId);
      results.push(...events);
    }
    return results;
  }

  async addHealthEvent(event: Omit<HealthEvent, 'id'>): Promise<HealthEvent> {
    try {
      return await apiService.addHealthEvent(event.chicken_id, event);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const newEvent: HealthEvent = {
        id: crypto.randomUUID(),
        ...event,
      };
      const stored = localStorage.getItem('health_events');
      const events = stored ? JSON.parse(stored) : [];
      events.unshift(newEvent);
      localStorage.setItem('health_events', JSON.stringify(events));
      return newEvent;
    }
  }

  // Egg Production Management
  async getEggProductions(): Promise<EggProduction[]> {
    try {
      const raw = await apiService.getEggProductions();
      // Normalize backend documents to frontend shape
      return (raw || []).map((doc: any) => ({
        id: doc.id ?? doc._id ?? crypto.randomUUID(),
        batch_number: doc.batch_number,
        date: typeof doc.date === 'string' ? doc.date : new Date(doc.date).toISOString().split('T')[0],
        total_eggs: doc.total_eggs,
        damaged_eggs: doc.damaged_eggs,
        good_eggs: doc.good_eggs,
        collection_time: doc.collection_time,
        notes: doc.notes ?? '',
        created_at: typeof doc.created_at === 'string' ? doc.created_at : (doc.created_at ? new Date(doc.created_at).toISOString() : undefined),
      })) as EggProduction[];
    } catch (error) {
      console.warn('API error, falling back to localStorage:', error);
      const stored = localStorage.getItem('egg_productions');
      return stored ? JSON.parse(stored) : [];
    }
  }

  async addEggProduction(production: Omit<EggProduction, 'id'>): Promise<EggProduction> {
    try {
      const raw = await apiService.addEggProduction(production);
      // Normalize backend response to frontend shape
      return {
        id: raw.id ?? raw._id ?? crypto.randomUUID(),
        batch_number: raw.batch_number,
        date: typeof raw.date === 'string' ? raw.date : new Date(raw.date).toISOString().split('T')[0],
        total_eggs: raw.total_eggs,
        damaged_eggs: raw.damaged_eggs,
        good_eggs: raw.good_eggs,
        collection_time: raw.collection_time,
        notes: raw.notes ?? '',
        created_at: typeof raw.created_at === 'string' ? raw.created_at : (raw.created_at ? new Date(raw.created_at).toISOString() : undefined),
      } as EggProduction;
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const newProduction: EggProduction = {
        id: crypto.randomUUID(),
        ...production,
      };
      const productions = await this.getEggProductions();
      productions.unshift(newProduction);
      localStorage.setItem('egg_productions', JSON.stringify(productions));
      return newProduction;
    }
  }

  async updateEggProduction(id: string, production: Partial<EggProduction>): Promise<EggProduction> {
    try {
      const raw = await apiService.updateEggProduction(id, production);
      // Normalize backend response to frontend shape
      return {
        id: raw.id ?? raw._id ?? id,
        batch_number: raw.batch_number ?? production.batch_number ?? '',
        date: typeof raw.date === 'string' ? raw.date : new Date(raw.date).toISOString().split('T')[0],
        total_eggs: raw.total_eggs,
        damaged_eggs: raw.damaged_eggs,
        good_eggs: raw.good_eggs,
        collection_time: raw.collection_time,
        notes: raw.notes ?? '',
        created_at: typeof raw.created_at === 'string' ? raw.created_at : (raw.created_at ? new Date(raw.created_at).toISOString() : undefined),
      } as EggProduction;
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const productions = await this.getEggProductions();
      const index = productions.findIndex(p => p.id === id);
      if (index !== -1) {
        productions[index] = { ...productions[index], ...production };
        localStorage.setItem('egg_productions', JSON.stringify(productions));
        return productions[index];
      }
      throw new Error('Egg production not found');
    }
  }

  async deleteEggProduction(id: string): Promise<boolean> {
    try {
      // The id should be the MongoDB _id (which we normalized from _id to id in getEggProductions)
      // But MongoDB expects the original _id format, so we need to handle both cases
      await apiService.deleteEggProduction(id);
      return true;
    } catch (error: any) {
      console.warn('API error, using localStorage:', error);
      // Fallback to localStorage
      const productions = await this.getEggProductions();
      const filteredProductions = productions.filter(p => p.id !== id);
      localStorage.setItem('egg_productions', JSON.stringify(filteredProductions));
      return true;
    }
  }

  // Client Management
  async getClients(): Promise<Client[]> {
    try {
      const raw = await apiService.getClients();
      return (raw || []).map((doc: any) => ({
        id: doc.id ?? doc._id ?? crypto.randomUUID(),
        name: doc.name,
        phone: doc.phone,
        email: doc.email,
        address: doc.address,
        city: doc.city,
        postal_code: doc.postal_code,
        tax_id: doc.tax_id,
        commercial_register: doc.commercial_register,
        notes: doc.notes,
        created_at: typeof doc.created_at === 'string' ? doc.created_at : (doc.created_at ? new Date(doc.created_at).toISOString() : undefined),
      })) as Client[];
    } catch (error) {
      console.warn('API error, falling back to localStorage:', error);
      const stored = localStorage.getItem('clients');
      return stored ? JSON.parse(stored) : [];
    }
  }

  async addClient(client: Omit<Client, 'id'>): Promise<Client> {
    try {
      const created = await apiService.addClient(client);
      return {
        id: created.id ?? created._id ?? crypto.randomUUID(),
        name: created.name,
        phone: created.phone,
        email: created.email,
        address: created.address,
        city: created.city,
        postal_code: created.postal_code,
        tax_id: created.tax_id,
        commercial_register: created.commercial_register,
        notes: created.notes,
        created_at: typeof created.created_at === 'string' ? created.created_at : (created.created_at ? new Date(created.created_at).toISOString() : undefined),
      };
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const newClient: Client = {
        id: crypto.randomUUID(),
        ...client,
      };
      const clients = await this.getClients();
      clients.unshift(newClient);
      localStorage.setItem('clients', JSON.stringify(clients));
      return newClient;
    }
  }

  async updateClient(id: string, client: Partial<Client>): Promise<Client> {
    try {
      const updated = await apiService.updateClient(id, client);
      return {
        id: updated.id ?? updated._id ?? id,
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        city: updated.city,
        postal_code: updated.postal_code,
        tax_id: updated.tax_id,
        commercial_register: updated.commercial_register,
        notes: updated.notes,
        created_at: typeof updated.created_at === 'string' ? updated.created_at : (updated.created_at ? new Date(updated.created_at).toISOString() : undefined),
      };
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const clients = await this.getClients();
      const index = clients.findIndex(c => c.id === id);
      if (index !== -1) {
        clients[index] = { ...clients[index], ...client };
        localStorage.setItem('clients', JSON.stringify(clients));
        return clients[index];
      }
      throw new Error('Client not found');
    }
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      await apiService.deleteClient(id);
      return true;
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const clients = await this.getClients();
      const filteredClients = clients.filter(c => c.id !== id);
      localStorage.setItem('clients', JSON.stringify(filteredClients));
      return true;
    }
  }

  // Sales Management
  async getSales(): Promise<Sale[]> {
    try {
      const raw = await apiService.getSales();
      return (raw || []).map((doc: any) => this.mapSale(doc));
    } catch (error) {
      console.warn('API error, falling back to localStorage:', error);
      const stored = localStorage.getItem('sales');
      return stored ? JSON.parse(stored) : [];
    }
  }

  async addSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
    try {
      const created = await apiService.addSale(sale);
      return this.mapSale(created);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const newSale: Sale = {
        id: crypto.randomUUID(),
        ...sale,
      };
      const sales = await this.getSales();
      sales.unshift(newSale);
      localStorage.setItem('sales', JSON.stringify(sales));
      return newSale;
    }
  }

  async updateSale(id: string, sale: Partial<Sale>): Promise<Sale> {
    try {
      const updated = await apiService.updateSale(id, sale);
      return this.mapSale(updated);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const sales = await this.getSales();
      const index = sales.findIndex(s => s.id === id);
      if (index !== -1) {
        sales[index] = { ...sales[index], ...sale };
        localStorage.setItem('sales', JSON.stringify(sales));
        return sales[index];
      }
      throw new Error('Sale not found');
    }
  }

  async deleteSale(id: string): Promise<boolean> {
    try {
      await apiService.deleteSale(id);
      return true;
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const sales = await this.getSales();
      const filteredSales = sales.filter(s => s.id !== id);
      localStorage.setItem('sales', JSON.stringify(filteredSales));
      return true;
    }
  }

  // Expense Management
  private mapExpense(doc: any): Expense {
    return {
      id: doc.id || doc._id?.toString() || '',
      date: typeof doc.date === 'string' ? doc.date : (doc.date ? new Date(doc.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      category: doc.category || 'other',
      description: doc.description || '',
      amount: doc.amount || 0,
      beneficiary: doc.beneficiary || doc.supplier || '',
      payment_status: doc.payment_status || 'unpaid',
      notes: doc.notes || ''
    };
  }

  async getExpenses(): Promise<Expense[]> {
    try {
      const data = await apiService.getExpenses();
      return (data || []).map((doc: any) => this.mapExpense(doc));
    } catch (error) {
      console.warn('API error, falling back to localStorage:', error);
      const stored = localStorage.getItem('expenses');
      return stored ? JSON.parse(stored) : [];
    }
  }

  async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    try {
      const response = await apiService.addExpense(expense);
      return this.mapExpense(response);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        ...expense,
      };
      const expenses = await this.getExpenses();
      expenses.unshift(newExpense);
      localStorage.setItem('expenses', JSON.stringify(expenses));
      return newExpense;
    }
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    try {
      const response = await apiService.updateExpense(id, expense);
      return this.mapExpense(response);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const expenses = await this.getExpenses();
      const index = expenses.findIndex(e => e.id === id);
      if (index !== -1) {
        expenses[index] = { ...expenses[index], ...expense };
        localStorage.setItem('expenses', JSON.stringify(expenses));
        return expenses[index];
      }
      throw new Error('Expense not found');
    }
  }

  async deleteExpense(id: string): Promise<boolean> {
    try {
      await apiService.deleteExpense(id);
      return true;
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const expenses = await this.getExpenses();
      const filteredExpenses = expenses.filter(e => e.id !== id);
      localStorage.setItem('expenses', JSON.stringify(filteredExpenses));
      return true;
    }
  }

  // Carton Management
  async getCartons(): Promise<Carton[]> {
    try {
      const raw = await apiService.getCartons();
      return (raw || []).map((doc: any) => this.mapCarton(doc));
    } catch (error) {
      console.warn('API error, falling back to localStorage:', error);
      const stored = localStorage.getItem('cartons');
      return stored ? JSON.parse(stored) : [];
    }
  }

  async addCarton(carton: Omit<Carton, 'id'>): Promise<Carton> {
    try {
      const created = await apiService.addCarton(carton);
      return this.mapCarton(created);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const newCarton: Carton = {
        id: crypto.randomUUID(),
        ...carton,
      };
      const cartons = await this.getCartons();
      cartons.unshift(newCarton);
      localStorage.setItem('cartons', JSON.stringify(cartons));
      return newCarton;
    }
  }

  async updateCarton(id: string, carton: Partial<Carton>): Promise<Carton> {
    try {
      const updated = await apiService.updateCarton(id, carton);
      return this.mapCarton(updated);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const cartons = await this.getCartons();
      const index = cartons.findIndex(c => c.id === id);
      if (index !== -1) {
        cartons[index] = { ...cartons[index], ...carton };
        localStorage.setItem('cartons', JSON.stringify(cartons));
        return cartons[index];
      }
      throw new Error('Carton not found');
    }
  }

  async deleteCarton(id: string): Promise<boolean> {
    try {
      await apiService.deleteCarton(id);
      return true;
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const cartons = await this.getCartons();
      const filteredCartons = cartons.filter(c => c.id !== id);
      localStorage.setItem('cartons', JSON.stringify(filteredCartons));
      return true;
    }
  }

  // Carton Movements (local fallback storage)
  async getCartonMovements(): Promise<CartonMovement[]> {
    const stored = localStorage.getItem('carton_movements');
    return stored ? JSON.parse(stored) : [];
  }

  async addCartonMovement(movement: Omit<CartonMovement, 'id'>): Promise<CartonMovement> {
    const newMovement: CartonMovement = {
      id: crypto.randomUUID(),
      ...movement,
    };
    const movements = await this.getCartonMovements();
    movements.unshift(newMovement);
    localStorage.setItem('carton_movements', JSON.stringify(movements));
    return newMovement;
  }

  // Vaccination Management
  async getVaccinations(): Promise<Vaccination[]> {
    try {
      // This would need to be implemented in the API
      const stored = localStorage.getItem('vaccinations');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Error getting vaccinations:', error);
      return [];
    }
  }

  async addVaccination(vaccination: Omit<Vaccination, 'id'>): Promise<Vaccination> {
    try {
      const newVaccination: Vaccination = {
        id: crypto.randomUUID(),
        ...vaccination,
      };
      const vaccinations = await this.getVaccinations();
      vaccinations.unshift(newVaccination);
      localStorage.setItem('vaccinations', JSON.stringify(vaccinations));
      return newVaccination;
    } catch (error) {
      console.warn('Error adding vaccination:', error);
      throw error;
    }
  }

  // Users Management
  private mapUser(doc: any): User {
    return {
      id: doc.id || doc._id?.toString() || '',
      name: doc.name || '',
      email: doc.email || '',
      role: doc.role || 'employee',
      phone: doc.phone || '',
      status: doc.status || 'active',
      permissions: doc.permissions || [],
      created_at: doc.created_at ? (typeof doc.created_at === 'string' ? doc.created_at : new Date(doc.created_at).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      last_login: doc.last_login ? (typeof doc.last_login === 'string' ? doc.last_login : new Date(doc.last_login).toISOString()) : null
    };
  }

  async getUsers(): Promise<User[]> {
    try {
      const data = await apiService.getUsers();
      return (data || []).map((user: any) => this.mapUser(user));
    } catch (error) {
      console.warn('API error, falling back to localStorage:', error);
      const stored = localStorage.getItem('users');
      return stored ? JSON.parse(stored) : [];
    }
  }

  async addUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const response = await apiService.addUser(user);
      const newUser = response.user || response;
      return this.mapUser(newUser);
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const newUser: User = {
        id: crypto.randomUUID(),
        ...user,
        created_at: new Date().toISOString().split('T')[0]
      };
      const users = await this.getUsers();
      users.unshift(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      return newUser;
    }
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    try {
      console.log('databaseService.updateUser called:', { id, user });
      const updated = await apiService.updateUser(id, user);
      console.log('API response:', updated);
      return this.mapUser(updated);
    } catch (error: any) {
      console.error('API error in updateUser:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      // Don't fallback to localStorage, throw the error so the UI can handle it
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await apiService.deleteUser(id);
      return true;
    } catch (error) {
      console.warn('API error, using localStorage:', error);
      const users = await this.getUsers();
      const filteredUsers = users.filter(u => u.id !== id);
      localStorage.setItem('users', JSON.stringify(filteredUsers));
      return true;
    }
  }

  // Dashboard Statistics
  async getDashboardStats() {
    try {
      return await apiService.getDashboardStats();
    } catch (error) {
      console.warn('API error, calculating stats from localStorage:', error);
      // Calculate stats from localStorage data
      const chickens = await this.getChickens();
      const eggProductions = await this.getEggProductions();
      const sales = await this.getSales();
      const expenses = await this.getExpenses();
      const cartons = await this.getCartons();

      // Calculate chicken stats based on Health Events (same method as ChickenManagement page)
      // Only get health events for existing chickens (filter out deleted batches)
      const existingChickenIds = chickens.map(c => c.id);
      const healthEvents = await this.getHealthEventsForChickens(existingChickenIds);
      
      // Filter health events to only include those for existing chickens
      const validHealthEvents = healthEvents.filter(ev => existingChickenIds.includes(ev.chicken_id));
      
      // Helper function to extract count from event description
      const getEventCountValue = (event: HealthEvent): number => {
        if (event.description) {
          // Try to extract count from description like "العدد: 3" or any digits
          const match = event.description.match(/العدد\s*:\s*(\d+)/);
          if (match && match[1]) {
            const n = parseInt(match[1], 10);
            if (!Number.isNaN(n) && n > 0) return n;
          }
          const anyNumber = event.description.match(/(\d+)/);
          if (anyNumber && anyNumber[1]) {
            const n = parseInt(anyNumber[1], 10);
            if (!Number.isNaN(n) && n > 0) return n;
          }
        }
        return 1;
      };
      
      // Calculate total chickens from all batches
      const totalChickens = chickens.reduce((sum, batch) => sum + (batch.count || 0), 0);
      
      // Calculate sick and dead chickens from health events (only for existing batches)
      // Sick = total illness - total recovery
      const totalSick = validHealthEvents
        .filter(ev => ev.event_type === 'illness')
        .reduce((sum, ev) => sum + getEventCountValue(ev), 0);
      
      const totalRecovered = validHealthEvents
        .filter(ev => ev.event_type === 'recovery')
        .reduce((sum, ev) => sum + getEventCountValue(ev), 0);
      
      const sickChickens = Math.max(totalSick - totalRecovered, 0);
      
      const deadChickens = validHealthEvents
        .filter(ev => ev.event_type === 'death')
        .reduce((sum, ev) => sum + getEventCountValue(ev), 0);
      
      // Alive chickens = total - dead (same as ChickenManagement page)
      const aliveChickens = Math.max(totalChickens - deadChickens, 0);

      // Calculate egg production stats
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

      const todayEggs = eggProductions
        .filter(ep => {
          const epDate = new Date(ep.date);
          return epDate >= today && epDate <= endOfDay;
        })
        .reduce((sum, ep) => sum + (ep.good_eggs || 0), 0);

      const weeklyEggs = eggProductions
        .filter(ep => {
          const epDate = new Date(ep.date);
          return epDate >= weekAgo;
        })
        .reduce((sum, ep) => sum + (ep.good_eggs || 0), 0);

      const monthlyEggs = eggProductions
        .filter(ep => {
          const epDate = new Date(ep.date);
          return epDate >= monthAgo;
        })
        .reduce((sum, ep) => sum + (ep.good_eggs || 0), 0);

      // Calculate damage rate
      const totalEggsProduced = eggProductions.reduce((sum, p) => sum + (p.total_eggs || 0), 0);
      const totalDamagedEggs = eggProductions.reduce((sum, p) => sum + (p.damaged_eggs || 0), 0);
      const damageRate = totalEggsProduced > 0 ? (totalDamagedEggs / totalEggsProduced) * 100 : 0;

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      return {
        totalChickens,
        aliveChickens,
        sickChickens,
        deadChickens,
        todayEggs,
        weeklyEggs,
        monthlyEggs,
        damageRate: Math.round(damageRate * 100) / 100,
        totalDamagedEggs,
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
        lowStockCartons: cartons.filter(c => c.available_quantity < 10)
      };
    }
  }
}

export const databaseService = new DatabaseService();