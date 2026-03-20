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
import NotFound from "./pages/NotFound";
// Farmer
import FarmerSetup from "./pages/FarmerSetup";
import FarmerDashboard from "./pages/FarmerDashboard";
import FarmerHomePickup from "./pages/FarmerHomePickup";
import FarmerShopOrder from "./pages/FarmerShopOrder";
import FarmerFoodOrder from "./pages/FarmerFoodOrder";
import FarmerFoodCheckout from "./pages/FarmerFoodCheckout";
// Hotel
import HotelSetup from "./pages/HotelSetup";
import HotelDashboard from "./pages/HotelDashboard";
import HotelMenu from "./pages/HotelMenu";
import HotelOrders from "./pages/HotelOrders";
import HotelPage from "./pages/HotelPage";
// Admin
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminShops from "./pages/admin/AdminShops";
import AdminRiders from "./pages/admin/AdminRiders";
import AdminVillages from "./pages/admin/AdminVillages";
import AdminReports from "./pages/admin/AdminReports";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

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
    <Route path="/shop/:shopId" element={<ProtectedRoute allowedRoles={['customer', 'farmer']}><ShopPage /></ProtectedRoute>} />
    <Route path="/cart" element={<ProtectedRoute allowedRoles={['customer']}><CartPage /></ProtectedRoute>} />
    <Route path="/order-tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
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

    {/* Admin — separate auth */}
    <Route path="/admin" element={<AdminLogin />} />
    <Route path="/admin/*" element={<AdminLayout />}>
      <Route path="dashboard" element={<AdminOverview />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="shops" element={<AdminShops />} />
      <Route path="riders" element={<AdminRiders />} />
      <Route path="villages" element={<AdminVillages />} />
      <Route path="reports" element={<AdminReports />} />
      <Route path="notifications" element={<AdminNotifications />} />
      <Route path="analytics" element={<AdminAnalytics />} />
      <Route path="settings" element={<AdminSettings />} />
    </Route>

    {/* Farmer */}
    <Route path="/farmer/setup" element={<FarmerSetup />} />
    <Route path="/farmer" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerDashboard /></ProtectedRoute>} />
    <Route path="/farmer/home-pickup" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerHomePickup /></ProtectedRoute>} />
    <Route path="/farmer/shop-order" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerShopOrder /></ProtectedRoute>} />
    <Route path="/farmer/food-order" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerFoodOrder /></ProtectedRoute>} />
    <Route path="/farmer/food-checkout" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerFoodCheckout /></ProtectedRoute>} />

    {/* Hotel */}
    <Route path="/hotel/setup" element={<HotelSetup />} />
    <Route path="/hotel" element={<ProtectedRoute allowedRoles={['hotel']}><HotelDashboard /></ProtectedRoute>} />
    <Route path="/hotel/menu" element={<ProtectedRoute allowedRoles={['hotel']}><HotelMenu /></ProtectedRoute>} />
    <Route path="/hotel/orders" element={<ProtectedRoute allowedRoles={['hotel']}><HotelOrders /></ProtectedRoute>} />
    <Route path="/hotel/:hotelId" element={<ProtectedRoute><HotelPage /></ProtectedRoute>} />

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
