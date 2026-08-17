import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { StorefrontLayout } from '@/components/layout/StorefrontLayout';
import { CheckoutLayout } from '@/components/layout/CheckoutLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AccountLayout } from '@/components/layout/AccountLayout';
import { RequireAuth, RequireAdmin } from '@/components/guards';
import { NotFoundPage, ServerErrorPage } from '@/pages/errors/ErrorPages';

const HomePage = lazy(() => import('@/pages/storefront/HomePage').then((m) => ({ default: m.HomePage })));
const ShopPage = lazy(() => import('@/pages/storefront/CatalogPages').then((m) => ({ default: m.ShopPage })));
const CategoryPage = lazy(() => import('@/pages/storefront/CatalogPages').then((m) => ({ default: m.CategoryPage })));
const SearchPage = lazy(() => import('@/pages/storefront/CatalogPages').then((m) => ({ default: m.SearchPage })));
const ProductPage = lazy(() => import('@/pages/storefront/ProductPage').then((m) => ({ default: m.ProductPage })));
const ComparePage = lazy(() => import('@/pages/storefront/ComparePage').then((m) => ({ default: m.ComparePage })));
const CartPage = lazy(() => import('@/pages/storefront/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('@/pages/storefront/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const LoginPage = lazy(() => import('@/pages/storefront/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/storefront/AuthPages').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/storefront/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/storefront/AuthPages').then((m) => ({ default: m.ResetPasswordPage })));
const AboutPage = lazy(() => import('@/pages/storefront/ContentPages').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('@/pages/storefront/ContentPages').then((m) => ({ default: m.ContactPage })));
const FaqPage = lazy(() => import('@/pages/storefront/ContentPages').then((m) => ({ default: m.FaqPage })));
const TermsPage = lazy(() => import('@/pages/storefront/ContentPages').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/pages/storefront/ContentPages').then((m) => ({ default: m.PrivacyPage })));
const EsewaReturnPage = lazy(() => import('@/pages/storefront/PaymentReturnPages').then((m) => ({ default: m.EsewaReturnPage })));
const KhaltiReturnPage = lazy(() => import('@/pages/storefront/PaymentReturnPages').then((m) => ({ default: m.KhaltiReturnPage })));

const AccountHomePage = lazy(() => import('@/pages/account/AccountPages').then((m) => ({ default: m.AccountHomePage })));
const AccountOrdersPage = lazy(() => import('@/pages/account/AccountPages').then((m) => ({ default: m.AccountOrdersPage })));
const AccountOrderDetailPage = lazy(() => import('@/pages/account/AccountPages').then((m) => ({ default: m.AccountOrderDetailPage })));
const AccountProfilePage = lazy(() => import('@/pages/account/AccountPages').then((m) => ({ default: m.AccountProfilePage })));
const AccountAddressesPage = lazy(() => import('@/pages/account/AccountPages').then((m) => ({ default: m.AccountAddressesPage })));
const AccountWishlistPage = lazy(() => import('@/pages/account/AccountPages').then((m) => ({ default: m.AccountWishlistPage })));
const AccountReviewsPage = lazy(() => import('@/pages/account/AccountPages').then((m) => ({ default: m.AccountReviewsPage })));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboardPage })));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminAnalyticsPage })));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProductsPage })));
const AdminProductFormPage = lazy(() => import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProductFormPage })));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminRest').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminRest').then((m) => ({ default: m.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminRest').then((m) => ({ default: m.AdminOrderDetailPage })));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminRest').then((m) => ({ default: m.AdminCustomersPage })));
const AdminInventoryPage = lazy(() => import('@/pages/admin/AdminRest').then((m) => ({ default: m.AdminInventoryPage })));
const AdminCouponsPage = lazy(() => import('@/pages/admin/AdminRest').then((m) => ({ default: m.AdminCouponsPage })));
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminRest').then((m) => ({ default: m.AdminReviewsPage })));
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminRest').then((m) => ({ default: m.AdminPaymentsPage })));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminRest').then((m) => ({ default: m.AdminSettingsPage })));

function Fallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-48 animate-pulse bg-muted-bg" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/payments/esewa/return" element={<EsewaReturnPage />} />
          <Route path="/payments/khalti/return" element={<KhaltiReturnPage />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AccountHomePage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
            <Route path="orders/:id" element={<AccountOrderDetailPage />} />
            <Route path="profile" element={<AccountProfilePage />} />
            <Route path="addresses" element={<AccountAddressesPage />} />
            <Route path="wishlist" element={<AccountWishlistPage />} />
            <Route path="reviews" element={<AccountReviewsPage />} />
          </Route>
          <Route path="/500" element={<ServerErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<CheckoutLayout />}>
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id" element={<AdminProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
