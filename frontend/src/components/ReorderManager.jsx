import React, { useState, useEffect } from 'react';
import ReorderService from '../services/reorderService';

const ReorderManager = ({ medicines, onReorderUpdate }) => {
  const [reorders, setReorders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    reason: '',
    priority: '',
    sort: 'createdAt',
    order: 'desc'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReorder, setSelectedReorder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Form state for creating new reorder
  const [newReorder, setNewReorder] = useState({
    medicine: '',
    suggestedQuantity: 1,
    reason: 'manual',
    priority: 'normal',
    notes: ''
  });

  // Load reorders on component mount
  useEffect(() => {
    loadReorders();
  }, [filters]);

  const loadReorders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ReorderService.getReorders(filters);
      setReorders(response.data.docs || response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reorderId, notes = '') => {
    setActionLoading(reorderId);
    try {
      await ReorderService.approveReorder(reorderId, notes);
      await loadReorders();
      onReorderUpdate && onReorderUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reorderId, reason, notes = '') => {
    setActionLoading(reorderId);
    try {
      await ReorderService.rejectReorder(reorderId, reason, notes);
      await loadReorders();
      onReorderUpdate && onReorderUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateReorder = async () => {
    if (!newReorder.medicine || !newReorder.suggestedQuantity) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await ReorderService.createReorder(newReorder);
      setNewReorder({
        medicine: '',
        suggestedQuantity: 1,
        reason: 'manual',
        priority: 'normal',
        notes: ''
      });
      setShowCreateForm(false);
      await loadReorders();
      onReorderUpdate && onReorderUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      ordered: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header with filters and create button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Reorder Suggestions</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'Create Reorder'}
          </button>
          <button
            onClick={loadReorders}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="ordered">Ordered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filters.reason}
          onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Reasons</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="high_demand">High Demand</option>
          <option value="manual">Manual</option>
          <option value="auto">Auto</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={`${filters.sort}-${filters.order}`}
          onChange={(e) => {
            const [sort, order] = e.target.value.split('-');
            setFilters({ ...filters, sort, order });
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="priority-desc">Priority High to Low</option>
          <option value="priority-asc">Priority Low to High</option>
          <option value="suggestedQuantity-desc">Quantity High to Low</option>
          <option value="suggestedQuantity-asc">Quantity Low to High</option>
        </select>
      </div>

      {/* Create Reorder Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-4">Create New Reorder</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medicine *
              </label>
              <select
                value={newReorder.medicine}
                onChange={(e) => setNewReorder({ ...newReorder, medicine: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Medicine</option>
                {medicines.map((med) => (
                  <option key={med._id || med.id} value={med._id || med.id}>
                    {med.name} (Current: {med.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggested Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={newReorder.suggestedQuantity}
                onChange={(e) => setNewReorder({ ...newReorder, suggestedQuantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <select
                value={newReorder.reason}
                onChange={(e) => setNewReorder({ ...newReorder, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="manual">Manual</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="high_demand">High Demand</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={newReorder.priority}
                onChange={(e) => setNewReorder({ ...newReorder, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={newReorder.notes}
                onChange={(e) => setNewReorder({ ...newReorder, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes for this reorder..."
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreateReorder}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Reorder'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Reorders Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading reorders...</p>
          </div>
        ) : reorders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No reorder suggestions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medicine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reorders.map((reorder) => (
                  <tr key={reorder._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reorder.medicine?.name || 'Unknown Medicine'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Current: {reorder.currentQuantity || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reorder.suggestedQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reorder.status)}`}>
                        {reorder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(reorder.priority)}`}>
                        {reorder.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reorder.reason?.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reorder.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {reorder.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(reorder._id)}
                            disabled={actionLoading === reorder._id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {actionLoading === reorder._id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(reorder._id, 'rejected', 'Rejected by user')}
                            disabled={actionLoading === reorder._id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {actionLoading === reorder._id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}
                      {reorder.status === 'approved' && (
                        <span className="text-green-600">Approved</span>
                      )}
                      {reorder.status === 'rejected' && (
                        <span className="text-red-600">Rejected</span>
                      )}
                      {reorder.status === 'ordered' && (
                        <span className="text-blue-600">Ordered</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReorderManager;

