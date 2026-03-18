import { Outlet, useLocation } from "react-router-dom";
import AccountSidebar from "../components/AccountSidebar";
import AnimatedPage from "../components/AnimatedPage";

const AccountLayout = () => {
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname === "/addresses") return "addresses";
    if (location.pathname === "/orders") return "orders";
    if (location.pathname === "/vouchers") return "vouchers";
    return "profile";
  };

  return (
    <div className="site-container py-6 min-h-[60vh] grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-6">
      <AccountSidebar active={getActiveTab()} />
      <AnimatedPage>
        <Outlet />
      </AnimatedPage>
    </div>
  );
};

export default AccountLayout;
