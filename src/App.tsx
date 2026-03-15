import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { OrderProvider } from "@/contexts/OrderContext";

import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import SetupProfile from "./pages/SetupProfile";
import CustomerHome from "./pages/CustomerHome";
import ShopPage from "./pages/ShopPage";
import CartPage from "./pages/CartPage";
import OrderTracking from "./pages/OrderTracking";
import OrderHistory from "./pages/OrderHistory";
import Categories from "./pages/Categories";
import Profile from "./pages/Profile";
import ShopkeeperDashboard from "./pages/ShopkeeperDashboard";
import ShopkeeperProducts from "./pages/ShopkeeperProducts";
import AddProduct from "./pages/AddProduct";
import ShopkeeperOrders from "./pages/ShopkeeperOrders";
import RiderDashboard from "./pages/RiderDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!user.name) return <Navigate to="/setup" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Welcome />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/setup" element={<SetupProfile />} />

    {/* Customer Routes */}
    <Route path="/home" element={<ProtectedRoute allowedRoles={['customer']}><CustomerHome /></ProtectedRoute>} />
    <Route path="/shop/:shopId" element={<ProtectedRoute allowedRoles={['customer']}><ShopPage /></ProtectedRoute>} />
    <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer']}><CartPage /></ProtectedRoute>} />
    <Route path="/order-tracking" element={<ProtectedRoute allowedRoles={['customer']}><OrderTracking /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute allowedRoles={['customer']}><OrderHistory /></ProtectedRoute>} />
    <Route path="/categories" element={<ProtectedRoute allowedRoles={['customer']}><Categories /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

    {/* Shopkeeper Routes */}
    <Route path="/shopkeeper" element={<ProtectedRoute allowedRoles={['shopkeeper']}><ShopkeeperDashboard /></ProtectedRoute>} />
    <Route path="/shopkeeper/products" element={<ProtectedRoute allowedRoles={['shopkeeper']}><ShopkeeperProducts /></ProtectedRoute>} />
    <Route path="/shopkeeper/add-product" element={<ProtectedRoute allowedRoles={['shopkeeper']}><AddProduct /></ProtectedRoute>} />
    <Route path="/shopkeeper/orders" element={<ProtectedRoute allowedRoles={['shopkeeper']}><ShopkeeperOrders /></ProtectedRoute>} />

    {/* Rider Routes */}
    <Route path="/rider" element={<ProtectedRoute allowedRoles={['rider']}><RiderDashboard /></ProtectedRoute>} />

    {/* Admin Routes */}
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
