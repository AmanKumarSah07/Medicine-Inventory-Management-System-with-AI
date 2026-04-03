import { useState, useEffect } from "react";
import ReorderDemo from "../components/ReorderDemo";

const InventoryManager = () => {
  const [medicineStock, setMedicineStock] = useState([
    { id: 1, name: "Paracetamol", quantity: 120, expiry: "2026-01-01", reorderLevel: 50 },
    { id: 2, name: "Ibuprofen", quantity: 60, expiry: "2025-06-15", reorderLevel: 40 },
    { id: 3, name: "Amoxicillin", quantity: 15, expiry: "2025-01-10", reorderLevel: 30 }
  ]);
  const [showReorderManager, setShowReorderManager] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    quantity: 0,
    expiry: "",
    reorderLevel: 10
  });

  const handleAddMedicine = () => {
    if (!newMedicine.name.trim()) return;
    
    const medicine = {
      id: Date.now(),
      name: newMedicine.name.trim(),
      quantity: parseInt(newMedicine.quantity),
      expiry: newMedicine.expiry,
      reorderLevel: parseInt(newMedicine.reorderLevel)
    };
    
    setMedicineStock([...medicineStock, medicine]);
    setNewMedicine({ name: "", quantity: 0, expiry: "", reorderLevel: 10 });
  };

  const handleRemoveMedicine = (id) => {
    setMedicineStock(medicineStock.filter(med => med.id !== id));
  };

  const getLowStockMedicines = () => {
    return medicineStock.filter(med => med.quantity <= med.reorderLevel);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Manager</h1>
        <button
          onClick={() => setShowReorderManager(!showReorderManager)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showReorderManager ? 'Hide' : 'Show'} Reorder Manager
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Medicines</h3>
          <p className="text-2xl font-bold text-gray-900">{medicineStock.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
          <p className="text-2xl font-bold text-amber-600">{getLowStockMedicines().length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Out of Stock</h3>
          <p className="text-2xl font-bold text-red-600">{medicineStock.filter(med => med.quantity === 0).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Expiring Soon</h3>
          <p className="text-2xl font-bold text-orange-600">
            {medicineStock.filter(med => {
              const expiryDate = new Date(med.expiry);
              const today = new Date();
              const diffTime = expiryDate - today;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 30 && diffDays > 0;
            }).length}
          </p>
        </div>
      </div>

      {/* Add New Medicine */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Add New Medicine</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
            <input
              type="text"
              value={newMedicine.name}
              onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter medicine name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="0"
              value={newMedicine.quantity}
              onChange={(e) => setNewMedicine({ ...newMedicine, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              type="date"
              value={newMedicine.expiry}
              onChange={(e) => setNewMedicine({ ...newMedicine, expiry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
            <input
              type="number"
              min="0"
              value={newMedicine.reorderLevel}
              onChange={(e) => setNewMedicine({ ...newMedicine, reorderLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={handleAddMedicine}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Add Medicine
        </button>
      </div>
      
      {/* Medicine Stock Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Medicine Stock</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {medicineStock.map((med) => {
                const isLowStock = med.quantity <= med.reorderLevel;
                const isOutOfStock = med.quantity === 0;
                const isExpiringSoon = (() => {
                  const expiryDate = new Date(med.expiry);
                  const today = new Date();
                  const diffTime = expiryDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 30 && diffDays > 0;
                })();
                const isExpired = new Date(med.expiry) < new Date();

                return (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {med.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {med.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {med.reorderLevel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {med.expiry}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isExpired ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Expired
                        </span>
                      ) : isOutOfStock ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Low Stock
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          Expiring Soon
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveMedicine(med.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder Manager */}
      {showReorderManager && (
        <ReorderDemo 
          medicines={medicineStock} 
          onReorderUpdate={() => {
            // Refresh data or perform any necessary updates
            console.log('Reorder updated');
          }}
        />
      )}
    </div>
  );
};

export default InventoryManager;
