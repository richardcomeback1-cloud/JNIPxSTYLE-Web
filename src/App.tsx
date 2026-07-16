import { lazy, Suspense } from 'react';
import { useRouter, matchRoute } from './lib/router';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import PromotionPage from './pages/PromotionPage';
import NotFoundPage from './pages/NotFoundPage';
import { ShippingPolicyPage, PrivacyPolicyPage } from './pages/PolicyPages';

const AdminPage = lazy(() => import('./pages/AdminPage'));

function Routes() {
  const { route } = useRouter();
  const path = route.path;

  // Match routes
  let page;
  if (path === '/' || path === '') {
    page = <HomePage />;
  } else if (path === '/shop') {
    page = <ShopPage searchQuery={route.query.search} filter={route.query.filter} />;
  } else if (matchRoute('/category/:slug', path)) {
    const { slug } = matchRoute('/category/:slug', path)!;
    page = <ShopPage categorySlug={slug} subCategory={route.query.sub} />;
  } else if (matchRoute('/product/:slug', path)) {
    const { slug } = matchRoute('/product/:slug', path)!;
    page = <ProductDetailPage slug={slug} />;
  } else if (path === '/cart') {
    page = <CartPage />;
  } else if (path === '/checkout') {
    page = <CheckoutPage />;
  } else if (path === '/login') {
    page = <AuthPage mode="login" />;
  } else if (path === '/register') {
    page = <AuthPage mode="register" />;
  } else if (path === '/account') {
    page = <AccountPage />;
  } else if (path === '/about') {
    page = <AboutPage />;
  } else if (path === '/contact') {
    page = <ContactPage />;
  } else if (path === '/faq') {
    page = <FAQPage />;
  } else if (path === '/promotion') {
    page = <PromotionPage />;
  } else if (path === '/shipping-policy') {
    page = <ShippingPolicyPage />;
  } else if (path === '/privacy') {
    page = <PrivacyPolicyPage />;
  } else if (path === '/admin') {
    page = (
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-taupe-400">กำลังโหลด...</div>}>
        <AdminPage />
      </Suspense>
    );
  } else {
    page = <NotFoundPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes />
      </CartProvider>
    </AuthProvider>
  );
}
