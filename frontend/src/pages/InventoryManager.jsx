import { useState } from "react";

const InventoryManager = () => {
  const [medicineStock, setMedicineStock] = useState([
    { name: "Paracetamol", quantity: 120, expiry: "2026-01-01" },
    { name: "Ibuprofen", quantity: 60, expiry: "2025-06-15" }
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Inventory Manager</h1>
      
      {/* Track & Manage Medicine Stock */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Medicine Stock</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {medicineStock.map((med, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{med.name}</td>
                <td className="p-2">{med.quantity}</td>
                <td className="p-2">{med.expiry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow">Place Order</button>
        <button className="bg-green-500 text-white px-4 py-2 rounded-lg shadow">Receive Order</button>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow">Set Reorder Level</button>
      </div>
    </div>
  );
};

export default InventoryManager;
