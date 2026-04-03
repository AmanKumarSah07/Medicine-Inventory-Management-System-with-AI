// API service for reorder management
import { apiRequest } from '../config/api';

class ReorderService {
  // Get all reorders with optional filters
  static async getReorders(filters = {}) {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.reason) queryParams.append('reason', filters.reason);
    if (filters.priority) queryParams.append('priority', filters.priority);
    if (filters.medicine) queryParams.append('medicine', filters.medicine);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.sort) queryParams.append('sort', filters.sort);
    if (filters.order) queryParams.append('order', filters.order);

    return await apiRequest(`/reorders?${queryParams}`);
  }

  // Get single reorder by ID
  static async getReorder(id) {
    return await apiRequest(`/reorders/${id}`);
  }

  // Create new reorder
  static async createReorder(reorderData) {
    return await apiRequest('/reorders', {
      method: 'POST',
      body: JSON.stringify(reorderData)
    });
  }

  // Update reorder
  static async updateReorder(id, updateData) {
    return await apiRequest(`/reorders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  // Approve reorder
  static async approveReorder(id, notes = '') {
    return await apiRequest(`/reorders/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes })
    });
  }

  // Reject reorder
  static async rejectReorder(id, reason, notes = '') {
    return await apiRequest(`/reorders/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason, notes })
    });
  }

  // Get pending reorders
  static async getPendingReorders() {
    return await apiRequest('/reorders/pending');
  }

  // Get urgent reorders
  static async getUrgentReorders() {
    return await apiRequest('/reorders/urgent');
  }

  // Get reorder statistics
  static async getReorderStats() {
    return await apiRequest('/reorders/stats');
  }
}

export default ReorderService;
