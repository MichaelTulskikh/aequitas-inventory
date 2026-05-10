import { Link } from "react-router-dom";
import { formatDate } from "../../../../utils/dateTimeFormatters";
import styles from "../../DashboardPage.module.css";
import type { IRecentlyFulfilledShipments } from "../../../../utils/types/dashboard/main";
import clsx from "clsx";

interface IProps {
  data: IRecentlyFulfilledShipments[];
}

const RecentlyFulfilled = ({ data }: IProps) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2 className={styles.title}>Recently Fulfilled</h2>
        <Link to="/shipments" className={styles.link}>
          View all
        </Link>
      </div>

      <div className="table-section__card">
        {data.length === 0 ? (
          <div className="table-section--empty">
            No recently fulfilled shipments.
          </div>
        ) : (
          <div className={clsx("table-section__wrapper")}>
            <table className="table-section__table">
              <thead>
                <tr>
                  <th>Shipment</th>
                  <th>Requester</th>
                  <th>Fulfilled</th>
                </tr>
              </thead>
              <tbody>
                {data.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>
                      <Link to={`/shipments/${shipment.id}`}>
                        {shipment.shipment_number}
                      </Link>
                    </td>
                    <td>{shipment.requester_name || "—"}</td>
                    <td>{formatDate(shipment.fulfilled_at)}</td>
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

export default RecentlyFulfilled;
