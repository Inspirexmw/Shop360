import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import FooterNote from "./FooterNote";
import ModalBackdrop from "./ModalBackdrop";
import DashboardPage from "./pages/DashboardPage";
import PosPage from "./pages/PosPage";
import InventoryPage from "./pages/InventoryPage";
import SalesPage from "./pages/SalesPage";
import DailyPage from "./pages/DailyPage";
import ReceivingPage from "./pages/ReceivingPage";
import ReportsPage from "./pages/ReportsPage";
import CustomersPage from "./pages/CustomersPage";
import LayawayPage from "./pages/LayawayPage";
import OrdersPage from "./pages/OrdersPage";
import SuppliersPage from "./pages/SuppliersPage";
import FinancePage from "./pages/FinancePage";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/SettingsPage";

/**
 * Same DOM tree as the original HTML:
 *   .app > aside.sidebar + main.main > (header.topbar, #notifPanel, .content > sections + footer)
 *   then #modalBackdrop, #printArea, #toast as siblings.
 * The inline onclick handlers of #notifPanel and #modalBackdrop are attached by LegacyRuntime.
 */
export default function AppShell() {
  return (
    <>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Topbar />
          <div id="notifPanel" suppressHydrationWarning />
          <div className="content">
            <DashboardPage />
            <PosPage />
            <InventoryPage />
            <SalesPage />
            <DailyPage />
            <ReceivingPage />
            <ReportsPage />
            <CustomersPage />
            <LayawayPage />
            <OrdersPage />
            <SuppliersPage />
            <FinancePage />
            <TeamPage />
            <SettingsPage />
            <FooterNote />
          </div>
        </main>
      </div>
      <ModalBackdrop />
      <div id="printArea" suppressHydrationWarning />
      <div className="toast" id="toast" suppressHydrationWarning />
    </>
  );
}
