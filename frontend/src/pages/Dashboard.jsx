import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Medical Inventory System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <Link to="/inventory-manager" className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold">Inventory Manager</h2>
          <p className="text-gray-600">Manage stock, orders, and medicine levels.</p>
        </Link>

        <Link to="/admin" className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold">Admin</h2>
          <p className="text-gray-600">Manage users, suppliers, and reports.</p>
        </Link>

        <Link to="/doctor-nurse" className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold">Doctor/Nurse</h2>
          <p className="text-gray-600">Request and view medicine availability.</p>
        </Link>

        <Link to="/supplier" className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
          <h2 className="text-xl font-semibold">Supplier</h2>
          <p className="text-gray-600">Update order status and view purchase orders.</p>
        </Link>

      </div>
    </div>
  );
};

export default Dashboard;
