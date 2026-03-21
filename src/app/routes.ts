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
import { AdminFaq } from "./components/admin/AdminFaq";
import { AdminNewsletter } from "./components/admin/AdminNewsletter";
import { AdminPlans } from "./components/admin/AdminPlans";
import { AdminAuthors } from "./components/admin/AdminAuthors";
import { AdminTestimonials } from "./components/admin/AdminTestimonials";
import { AdminAbout } from "./components/admin/AdminAbout";
import { AdminLogo } from "./components/admin/AdminLogo";
import { AdminPaymentConfig } from "./components/admin/AdminPaymentConfig";
import { AdminContactInfo } from "./components/admin/AdminContactInfo";
import { BookDetailPage } from "./components/BookDetailPage";
import { PasswordResetPage } from "./components/PasswordResetPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { PrivacyPage } from "./components/PrivacyPage";
import { TermsPage } from "./components/TermsPage";
import { MeusDadosPage } from "./components/MeusDadosPage";

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
      { path: "livros/:slug", Component: BookDetailPage },
      { path: "privacidade", Component: PrivacyPage },
      { path: "meus-dados", Component: MeusDadosPage },
      { path: "termos", Component: TermsPage },
      { path: "recuperar-senha", Component: PasswordResetPage },
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
      { path: "faq", Component: AdminFaq },
      { path: "newsletter", Component: AdminNewsletter },
      { path: "planos", Component: AdminPlans },
      { path: "autores", Component: AdminAuthors },
      { path: "depoimentos", Component: AdminTestimonials },
      { path: "sobre", Component: AdminAbout },
      { path: "logo", Component: AdminLogo },
      { path: "pagamentos", Component: AdminPaymentConfig },
      { path: "contato", Component: AdminContactInfo },
    ],
  },
]);