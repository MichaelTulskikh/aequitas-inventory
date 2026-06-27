import { formatDate } from "../../../../utils/dateTimeFormatters";
import { Link } from "react-router-dom";
import type { IExpiringSoonLots } from "../../../../utils/types/dashboard/main";
import type { IDashboardTableProps } from "../../../../utils/types/dashboard/componentProps";
import skeletonStyles from "./skeleton.module.scss";

const SKELETON_ROWS = 2;
const columns = ["Time", "Expiration", "Available"];

const ExpiringSoon = ({
  data,
  loading,
}: IDashboardTableProps<IExpiringSoonLots[]>) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2>Expiring Soon</h2>
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
                        data-testid="skeleton"
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
                      No expiring lots found.
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((lot) => (
                  <tr key={lot.inventory_lot_id}>
                    <td>
                      <Link to={`/inventory/lots/${lot.inventory_lot_id}`}>
                        {lot.item_name}
                      </Link>
                    </td>
                    <td>{formatDate(lot.expiration_date)}</td>
                    <td>{lot.available_quantity}</td>
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

export default ExpiringSoon;
