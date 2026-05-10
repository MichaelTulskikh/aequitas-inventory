import clsx from "clsx";
import { formatDateTime } from "../../../../utils/dateTimeFormatters";
import type { IRecentAdjustments } from "../../../../utils/types/dashboard/main";
import styles from "../../DashboardPage.module.css";

interface IProps {
  data: IRecentAdjustments[];
}

const RecentAdjustments = ({ data }: IProps) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2 className={styles.title}>Recent Adjustments</h2>
      </div>

      <div className="table-section__card">
        {!data || data.length === 0 ? (
          <div className="table-section--empty">No recent adjustments.</div>
        ) : (
          <div className={clsx("table-section__wrapper")}>
            <table className="table-section__table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Item</th>
                  <th>Delta</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.inventory_txn_id}>
                    <td>{formatDateTime(row.occurred_at)}</td>
                    <td>{row.item_name}</td>
                    <td>{row.quantity}</td>
                    <td>{row.location_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentAdjustments;
