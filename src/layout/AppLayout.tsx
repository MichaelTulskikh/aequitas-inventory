import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { logout, getIdToken } from "../auth/auth";
import styles from "./AppLayout.module.css";
import i18n from "../i18n";

type NavItem = {
  label: string;
  to: string;
  exact?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function parseJwt(token: string | null): Record<string, unknown> | null {
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function normalizeGroups(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/inventory")) return "Inventory";
  if (pathname.startsWith("/shipments")) return "Shipments";
  if (pathname.startsWith("/profile")) return "My Profile";

  if (pathname.startsWith("/receiving")) return "Receive Inventory";
  if (pathname.startsWith("/admin/items")) return "Item Catalog";
  if (pathname.startsWith("/admin/categories")) return "Categories & Tags";
  if (pathname.startsWith("/admin/locations")) return "Locations";
  if (pathname.startsWith("/admin/requesters")) return "Requester Profiles";
  if (pathname.startsWith("/admin/inventory-audit")) return "Inventory Audit";
  if (pathname.startsWith("/admin/settings")) return "System Settings";
  if (pathname.startsWith("/admin/inbound-shipments"))
    return "Inbound Shipments";
  if (pathname.startsWith("/admin/inventory-valuation"))
    return "Inventory Valuation";
  if (pathname.startsWith("/admin/cognito-users")) return "Cognito Users";

  if (pathname.startsWith("/admin/docs")) return "API Docs";

  return "Warehouse Management";
}

function isPathActive(
  pathname: string,
  target: string,
  exact = false,
): boolean {
  if (exact) return pathname === target;
  if (target === "/") return pathname === "/";
  return pathname.startsWith(target);
}

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const currentLang = i18n.language as "en" | "ua";
  const isUA = currentLang === "ua";

  const toggleLanguage = () => {
    const next = isUA ? "en" : "ua";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  const claims = parseJwt(getIdToken());

  const displayName =
    (typeof claims?.name === "string" && claims.name) ||
    (typeof claims?.email === "string" && claims.email) ||
    (typeof claims?.["cognito:username"] === "string" &&
      claims["cognito:username"]) ||
    "User";

  const groups = normalizeGroups(claims?.["cognito:groups"]);
  const isAdmin = groups.includes("Admin");
  const isStaff = groups.includes("Staff");
  const isPrivileged = isAdmin || isStaff;

  const pageTitle = getPageTitle(location.pathname);

  const operationsNav = useMemo<NavGroup>(
    () => ({
      title: "Operations",
      items: [
        { label: "Dashboard", to: "/", exact: true },
        { label: "Inventory", to: "/inventory" },
        { label: "Shipments", to: "/shipments" },
        { label: "My Profile", to: "/profile" },
      ],
    }),
    [],
  );

  const adminNav = useMemo<NavGroup>(
    () => ({
      title: "Administration",
      items: [
        { label: "Receive Inventory", to: "/receiving" },
        { label: "Item Catalog", to: "/admin/items" },
        { label: "Categories & Tags", to: "/admin/categories" },
        { label: "Locations", to: "/admin/locations" },
        { label: "Requester Profiles", to: "/admin/requesters" },
        { label: "Inventory Audit", to: "/admin/inventory-audit" },
        { label: "System Settings", to: "/admin/settings" },
        { label: "Inbound Shipments", to: "/admin/inbound-shipments" },
        { label: "Inventory Valuation", to: "/admin/inventory-valuation" },
        { label: "Cognito Users", to: "/admin/cognito-users" },

        { label: "API Documentation", to: "/admin/docs" },
      ],
    }),
    [],
  );

  const closeSidebar = () => setSidebarOpen(false);

  const [, forceRender] = useState(0);

  useEffect(() => {
    const handleLanguageChanged = () => {
      forceRender((value) => value + 1);
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  const renderNavGroup = (group: NavGroup) => (
    <div className={styles.nav} key={group.title}>
      <div className={styles.navTitle}>{group.title}</div>

      {group.items.map((item) => (
        <Link
          key={item.to}
          className={
            isPathActive(location.pathname, item.to, item.exact)
              ? `${styles.navLink} ${styles.navLinkActive}`
              : styles.navLink
          }
          to={item.to}
          onClick={closeSidebar}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );

  return (
    <div className={styles.layout}>
      
      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brand}>Aequitas Warehouse</div>

        <nav className={styles.nav}>
          {renderNavGroup(operationsNav)}
          {isPrivileged && renderNavGroup(adminNav)}
        </nav>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.mobileMenu}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            <span className={styles.pageTitle}>{pageTitle}</span>
          </div>

          <div className={styles.headerRight}>
            <span className={styles.userName}>
              {displayName}
              {isAdmin && (
                <span className={styles.roleBadge}>Administrator</span>
              )}
              {!isAdmin && isStaff && (
                <span className={styles.roleBadge}>Staff</span>
              )}
            </span>

            <div className={styles.langSwitch} onClick={toggleLanguage}>
              <div
                className={`${styles.langSlider} ${isUA ? styles.langSliderRight : ""}`}
              />
              <span className={!isUA ? styles.langActive : ""}>EN</span>
              <span className={isUA ? styles.langActive : ""}>UA</span>
            </div>

            <button className={styles.logoutButton} onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className={styles.mainContent}>
          <Outlet />
        </main>

        <footer className={styles.footer}>
          © {new Date().getFullYear()} Aequitas
        </footer>
      </div>
    </div>
  );
}
