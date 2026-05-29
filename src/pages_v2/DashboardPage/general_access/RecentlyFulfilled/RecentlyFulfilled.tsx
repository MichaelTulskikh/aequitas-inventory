import { Link } from "react-router-dom";
import { formatDate } from "../../../../utils/dateTimeFormatters";
import type { IRecentlyFulfilledShipments } from "../../../../utils/types/dashboard/main";
import skeletonStyles from "./skeleton.module.scss";
import type { IDashboardTableProps } from "../../../../utils/types/dashboard/componentProps";

const SKELETON_ROWS = 2;
const columns = ["Shipment", "Requester", "Fulfilled"];

const RecentlyFulfilled = ({
  data,
  loading,
}: IDashboardTableProps<IRecentlyFulfilledShipments[]>) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2>Recently Fulfilled</h2>
        <Link to="/shipments">View all</Link>
      </div>

      <div className="table-section__card">
        <div className="table-section__wrapper">
          <table className="table-section__table">
            <thead>
              <tr>
                {columns.map((i) => (
                  <th key={`th-${i}`}>{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((i) => (
                      <td
                        key={`td-${i}`}
                        data-column={i.toLowerCase()}
                        className={skeletonStyles.cell}
                      >
                        <div className={skeletonStyles.skeleton} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-section--empty">
                      No recently fulfilled shipments.
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>
                      <Link to={`/shipments/${shipment.id}`}>
                        {shipment.shipment_number}
                      </Link>
                    </td>
                    <td>{shipment.requester_name || "—"}</td>
                    <td>{formatDate(shipment.fulfilled_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default RecentlyFulfilled;
