import { useAuth } from "../../auth/AuthContext";
import LowStockLots from "./admin_access/LowStockLots/LowStockLots";
import ExpiringSoon from "./admin_access/ExpiringSoon/ExpiringSoon";
import RecentAdjustments from "./admin_access/RecentAdjustments/RecentAdjustments";
import RecentReceivals from "./admin_access/RecentReceivals/RecentReceivals";
import ActiveShipments from "./general_access/ActiveShipments/ActiveShipments";
import RecentlyFulfilled from "./general_access/RecentlyFulfilled/RecentlyFulfilled";
import ShipmentStatusOverview from "./general_access/ShipmentStatusOverview/ShipmentStatusOverview";
import AvailableInventory from "./general_access/AvailableInventory/AvailableInventory";
import Loader from "../../components/common/Loader/Loader";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";

export default function DashboardPage() {
  const { data, isLoading, error, isFetching } = useDashboardSummary();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin");
  const isStaff = user?.roles?.includes("Staff");
  const isPrivileged = isAdmin || isStaff;

  if (error instanceof Error) {
    return <div>{error.message}</div>;
  }

  return (
    <div className="page__wrapper">
      <div className="page__header">
        <div className="page__header--left">
          <h1 className="page__heading">Dashboard</h1>
          <p className="page__description">
            Warehouse activity, shipment workflow, and inventory overview.
          </p>
        </div>
        <div className="page__header--right">
          {" "}
          {isLoading || (isFetching && <Loader />)}
        </div>
      </div>
      {error && (
        <div role="alert" className="alert-error">
          Error: {error}
        </div>
      )}

      <ShipmentStatusOverview
        loading={isLoading}
        data={data?.summary?.shipments_by_status || null}
      />

      <div className="grid-cols-2">
        <ActiveShipments
          loading={isLoading}
          data={data?.summary?.my_active_shipments || []}
        />
        <RecentlyFulfilled
          data={data?.summary?.recent_fulfilled_shipments || []}
          loading={isLoading}
        />
      </div>

      <AvailableInventory
        loading={isLoading}
        data={data?.summary?.inventory_by_category || []}
      />

      {isPrivileged && (
        <>
          <div className="grid-cols-2">
            {
              <LowStockLots
                loading={isLoading}
                data={data?.summary?.low_stock_lots || []}
              />
            }
            <ExpiringSoon
              loading={isLoading}
              data={data?.summary?.expiring_soon_lots || []}
            />
          </div>

          <div className="grid-cols-2">
            <RecentReceivals
              loading={isLoading}
              data={data?.summary?.recent_receives || []}
            />
            <RecentAdjustments
              loading={isLoading}
              data={data?.summary?.recent_adjustments || []}
            />
          </div>
        </>
      )}
    </div>
  );
}
