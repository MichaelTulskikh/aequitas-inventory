import { formatDate } from "../../../../utils/dateTimeFormatters";
import { Link } from "react-router-dom";
import { normalizeStatus } from "../../../../utils/normalizers";
import type { IActiveShipments } from "../../../../utils/types/dashboard/main";
import clsx from "clsx";
import skeletonStyles from "./skeleton.module.scss";
import type { IDashboardTableProps } from "../../../../utils/types/dashboard/componentProps";

const SKELETON_ROWS = 2;
const columns = ["Shipment", "Status", "Requester", "Lines", "Created"];

const ActiveShipments = ({
  data,
  loading,
}: IDashboardTableProps<IActiveShipments[]>) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2>My Active Shipments</h2>
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
                      <td key={`td-${i}`} style={{ outline: "2px solid red" }}>
                        <div className={clsx(skeletonStyles.skeleton)} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="table-section--empty">
                      No active shipments.
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

                    <td>
                      <span
                        className={`shipment-status status-${normalizeStatus(
                          shipment.status,
                        )}`}
                      >
                        {shipment.status}
                      </span>
                    </td>

                    <td>{shipment.requester_name || "—"}</td>

                    <td>{shipment.line_count}</td>

                    <td>{formatDate(shipment.created_at)}</td>
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

export default ActiveShipments;
