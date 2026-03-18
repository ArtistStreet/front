import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ShopHome from "./pages/ShopHome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotificationsPage from "./pages/Notifications";
import AccountPage from "./pages/Account";
import AddressesPage from "./pages/Addresses";
import OrdersPage from "./pages/Orders";
import VouchersPage from "./pages/Vouchers";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProductList from "./pages/admin/AdminProductList";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminReviewList from "./pages/admin/AdminReviewList";
import Chatbot from "./components/Chatbot";
import { AnimatePresence } from "framer-motion";
import AnimatedPage from "./components/AnimatedPage";
import AccountLayout from "./components/AccountLayout";

function App() {
  const location = useLocation();
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route
                  path="/"
                  element={
                    <AnimatedPage>
                      <Home />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/product/:id"
                  element={
                    <AnimatedPage>
                      <ProductDetail />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <AnimatedPage>
                      <Cart />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <AnimatedPage>
                      <Checkout />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/shop"
                  element={
                    <AnimatedPage>
                      <ShopHome />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <AnimatedPage>
                      <Login />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <AnimatedPage>
                      <Register />
                    </AnimatedPage>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <AnimatedPage>
                      <NotificationsPage />
                    </AnimatedPage>
                  }
                />

                {/* Account Routes with Shared Sidebar Layout */}
                <Route element={<AccountLayout />}>
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/addresses" element={<AddressesPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/vouchers" element={<VouchersPage />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProductList />} />
                  <Route path="products/new" element={<AdminProductForm />} />
                  <Route
                    path="products/edit/:id"
                    element={<AdminProductForm />}
                  />
                  <Route path="reviews" element={<AdminReviewList />} />
                </Route>

                <Route
                  path="*"
                  element={
                    <AnimatedPage>
                      <Home />
                    </AnimatedPage>
                  }
                />
              </Routes>
            </AnimatePresence>
            <Chatbot />
          </Layout>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const Root = () => (
  <Router>
    <App />
  </Router>
);

export default Root;
