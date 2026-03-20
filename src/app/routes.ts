import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./components/HomePage";
import { CatalogPage } from "./components/CatalogPage";
import { UserAuthPage } from "./components/UserAuthPage";
import { UserAccountPage } from "./components/UserAccountPage";
import { PaymentPage } from "./components/PaymentPage";
import { InstallmentCheckoutPage } from "./components/InstallmentCheckoutPage";
import { ContractViewPage } from "./components/ContractViewPage";
import { NewRequestPage } from "./components/NewRequestPage";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminMessages } from "./components/admin/AdminMessages";
import { AdminUsers } from "./components/admin/AdminUsers";
import { AdminBooks } from "./components/admin/AdminBooks";
import { AdminProjects } from "./components/admin/AdminProjects";
import { AdminContracts } from "./components/admin/AdminContracts";
import { NotFoundPage } from "./components/NotFoundPage";
import { PrivacyPage } from "./components/PrivacyPage";
import { TermsPage } from "./components/TermsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "catalogo", Component: CatalogPage },
      { path: "entrar", Component: UserAuthPage },
      { path: "minha-conta", Component: UserAccountPage },
      { path: "pagamento/:projectId", Component: PaymentPage },
      { path: "parcelas/:projectId", Component: InstallmentCheckoutPage },
      { path: "contrato/:projectId", Component: ContractViewPage },
      { path: "nova-solicitacao", Component: NewRequestPage },
      { path: "privacidade", Component: PrivacyPage },
      { path: "termos", Component: TermsPage },
      {
        path: "admin",
        Component: AdminLogin,
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { path: "dashboard", Component: AdminDashboard },
      { path: "mensagens", Component: AdminMessages },
      { path: "usuarios", Component: AdminUsers },
      { path: "livros", Component: AdminBooks },
      { path: "projetos", Component: AdminProjects },
      { path: "contratos", Component: AdminContracts },
    ],
  },
]);