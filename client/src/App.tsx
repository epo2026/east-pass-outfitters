import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { CartProvider } from "@/lib/cart";
import { Layout } from "@/components/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";
import Home from "@/pages/Home";
import Apparel from "@/pages/Apparel";
import Tackle from "@/pages/Tackle";
import SpeciesPage from "@/pages/SpeciesPage";
import FishPage from "@/pages/FishPage";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import About from "@/pages/About";
import Charter from "@/pages/Charter";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/apparel" component={Apparel} />
      <Route path="/tackle" component={Tackle} />
      <Route path="/tackle/:species/:fish" component={FishPage} />
      <Route path="/tackle/:species" component={SpeciesPage} />
      <Route path="/product/:slug" component={ProductDetail} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order/:orderNumber" component={OrderConfirmation} />
      <Route path="/charter" component={Charter} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

// The admin dashboard renders without the storefront chrome (nav/footer).
// Everything else gets wrapped in <Layout>.
function Shell() {
  const [location] = useLocation();
  if (location.startsWith("/admin")) {
    return <Admin />;
  }
  return (
    <Layout>
      <AppRouter />
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <CartProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <ScrollToTop />
              <Shell />
            </Router>
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
