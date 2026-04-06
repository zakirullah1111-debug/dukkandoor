import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

// Eagerly load Welcome (contains LCP element)
import Welcome from "./pages/Welcome";

// Lazy load all other routes
const Auth = lazy(() => import("./pages/Auth"));
const SetupProfile = lazy(() => import("./pages/SetupProfile"));
const ShopSetup = lazy(() => import("./pages/ShopSetup"));
const CustomerHome = lazy(() => import("./pages/CustomerHome"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const Categories = lazy(() => import("./pages/Categories"));
const Profile = lazy(() => import("./pages/Profile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const ShopkeeperDashboard = lazy(() => import("./pages/ShopkeeperDashboard"));
const ShopkeeperProducts = lazy(() => import("./pages/ShopkeeperProducts"));
const ShopkeeperOrders = lazy(() => import("./pages/ShopkeeperOrders"));
const RiderDashboard = lazy(() => import("./pages/RiderDashboard"));
const RiderProfile = lazy(() => import("./pages/RiderProfile"));
const RiderEditProfile = lazy(() => import("./pages/RiderEditProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
// Farmer
const FarmerSetup = lazy(() => import("./pages/FarmerSetup"));
const FarmerDashboard = lazy(() => import("./pages/FarmerDashboard"));
const FarmerHomePickup = lazy(() => import("./pages/FarmerHomePickup"));
const FarmerShopOrder = lazy(() => import("./pages/FarmerShopOrder"));
const FarmerFoodOrder = lazy(() => import("./pages/FarmerFoodOrder"));
const FarmerFoodCheckout = lazy(() => import("./pages/FarmerFoodCheckout"));
// Hotel
const HotelSetup = lazy(() => import("./pages/HotelSetup"));
const HotelDashboard = lazy(() => import("./pages/HotelDashboard"));
const HotelMenu = lazy(() => import("./pages/HotelMenu"));
const HotelOrders = lazy(() => import("./pages/HotelOrders"));
const HotelPage = lazy(() => import("./pages/HotelPage"));
// Admin
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminShops = lazy(() => import("./pages/admin/AdminShops"));
const AdminRiders = lazy(() => import("./pages/admin/AdminRiders"));
const AdminVillages = lazy(() => import("./pages/admin/AdminVillages"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const UserSettings = lazy(() => import("./pages/UserSettings"));

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
  <Suspense fallback={<LoadingScreen />}>
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
  </Suspense>
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
