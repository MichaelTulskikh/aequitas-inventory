import { formatDateTime } from "../../../../utils/dateTimeFormatters";
import type { IRecentReceivals } from "../../../../utils/types/dashboard/main";
import type { IDashboardTableProps } from "../../../../utils/types/dashboard/componentProps";
import skeletonStyles from "./skeleton.module.scss";

const SKELETON_ROWS = 2;
const columns = ["Time", "Item", "Qty", "Location"];

const RecentReceives = ({
  data,
  loading,
}: IDashboardTableProps<IRecentReceivals[]>) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2>Recent Receives</h2>
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
                      No recent receives.
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.inventory_txn_id}>
                    <td>{formatDateTime(row.occurred_at)}</td>
                    <td>{row.item_name}</td>
                    <td>{row.quantity}</td>
                    <td>{row.location_name}</td>
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

export default RecentReceives;
