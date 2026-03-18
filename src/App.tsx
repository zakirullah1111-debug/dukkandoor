import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import SetupProfile from "./pages/SetupProfile";
import ShopSetup from "./pages/ShopSetup";
import CustomerHome from "./pages/CustomerHome";
import ShopPage from "./pages/ShopPage";
import CartPage from "./pages/CartPage";
import OrderTracking from "./pages/OrderTracking";
import OrderHistory from "./pages/OrderHistory";
import Categories from "./pages/Categories";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import ShopkeeperDashboard from "./pages/ShopkeeperDashboard";
import ShopkeeperProducts from "./pages/ShopkeeperProducts";
import ShopkeeperOrders from "./pages/ShopkeeperOrders";
import RiderDashboard from "./pages/RiderDashboard";
import RiderProfile from "./pages/RiderProfile";
import RiderEditProfile from "./pages/RiderEditProfile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/" replace />;
  if (!user?.name) return <Navigate to="/setup" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Welcome />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/setup" element={<SetupProfile />} />
    <Route path="/shopkeeper/setup" element={<ShopSetup />} />

    {/* Customer */}
    <Route path="/home" element={<ProtectedRoute allowedRoles={['customer']}><CustomerHome /></ProtectedRoute>} />
    <Route path="/shop/:shopId" element={<ProtectedRoute allowedRoles={['customer']}><ShopPage /></ProtectedRoute>} />
    <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer']}><CartPage /></ProtectedRoute>} />
    <Route path="/order-tracking" element={<ProtectedRoute allowedRoles={['customer']}><OrderTracking /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute allowedRoles={['customer']}><OrderHistory /></ProtectedRoute>} />
    <Route path="/categories" element={<ProtectedRoute allowedRoles={['customer']}><Categories /></ProtectedRoute>} />
    <Route path="/favorites" element={<ProtectedRoute allowedRoles={['customer']}><Favorites /></ProtectedRoute>} />
    <Route path="/rider/:riderId" element={<ProtectedRoute><RiderProfile /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

    {/* Shopkeeper Routes */}
    <Route path="/shopkeeper" element={<ProtectedRoute allowedRoles={['shopkeeper']}><ShopkeeperDashboard /></ProtectedRoute>} />
    <Route path="/shopkeeper/products" element={<ProtectedRoute allowedRoles={['shopkeeper']}><ShopkeeperProducts /></ProtectedRoute>} />
    <Route path="/shopkeeper/orders" element={<ProtectedRoute allowedRoles={['shopkeeper']}><ShopkeeperOrders /></ProtectedRoute>} />

    {/* Rider */}
    <Route path="/rider" element={<ProtectedRoute allowedRoles={['rider']}><RiderDashboard /></ProtectedRoute>} />
    <Route path="/rider/edit-profile" element={<ProtectedRoute allowedRoles={['rider']}><RiderEditProfile /></ProtectedRoute>} />

    {/* Admin */}
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
