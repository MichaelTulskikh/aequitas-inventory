import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import clsx from "clsx";
import { fetchDashboardSummary } from "../../api/dashboard";
import styles from "./DashboardPage.module.css";
import LowStockLots from "./admin_access/LowStockLots/LowStockLots";
import ExpiringSoon from "./admin_access/ExpiringSoon/ExpiringSoon";
import RecentAdjustments from "./admin_access/RecentAdjustments/RecentAdjustments";
import RecentReceivals from "./admin_access/RecentReceivals/RecentReceivals";
import ActiveShipments from "./general_access/ActiveShipments/ActiveShipments";
import RecentlyFulfilled from "./general_access/RecentlyFulfilled/RecentlyFulfilled";
import ShipmentStatusOverview from "./general_access/ShipmentStatusOverview/ShipmentStatusOverview";
import AvailableInventory from "./general_access/AvailableInventory/AvailableInventory";
import type { IDashboardSummaryResponse } from "../../utils/types/dashboard/main";
import Loader from "../../components/common/Loader/Loader";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin");
  const isStaff = user?.roles?.includes("Staff");
  const isPrivileged = isAdmin || isStaff;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IDashboardSummaryResponse | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchDashboardSummary();
      setData(result);
    } catch (err: unknown) {
      if (err instanceof Error)
        setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = data?.summary;

  return (
    <div className={clsx("page__wrapper", styles.page)}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className="page__heading">Dashboard</h1>
          <p className="page__description">
            Warehouse activity, shipment workflow, and inventory overview.
          </p>
        </div>
        {loading && <Loader />}
      </div>
      {error && <div className="alert-error">Error: {error}</div>}

      <ShipmentStatusOverview
        loading={loading}
        data={summary?.shipments_by_status || null}
      />

      <div className="twoCol">
        <ActiveShipments
          loading={loading}
          data={summary?.my_active_shipments || []}
        />
        {/* <RecentlyFulfilled
              data={summary.recent_fulfilled_shipments || []}
            />*/}
      </div>

      {/* <AvailableInventory
            loading={loading}
            data={summary.inventory_by_category || []}
          />

          {isPrivileged && (
            <>
              <div className="twoCol">
                {
                  <LowStockLots
                    loading={loading}
                    data={summary.low_stock_lots || []}
                  />
                }
                <ExpiringSoon
                  loading={loading}
                  data={summary.expiring_soon_lots || []}
                />
              </div>

              <div className="twoCol">
                <RecentReceivals
                  loading={loading}
                  data={summary.recent_receives || []}
                />
                <RecentAdjustments
                  loading={loading}
                  data={summary.recent_adjustments || []}
                />
              </div>
            </>
          )}  */}
    </div>
  );
}
