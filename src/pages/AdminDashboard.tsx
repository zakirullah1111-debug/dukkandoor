import { Navigate } from 'react-router-dom';

// Legacy redirect — admin now uses /admin/* routes
const AdminDashboard = () => <Navigate to="/admin" replace />;

export default AdminDashboard;
