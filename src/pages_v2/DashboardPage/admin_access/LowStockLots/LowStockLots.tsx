import { Link } from "react-router-dom";
import type { ILowStockLots } from "../../../../utils/types/dashboard/main";
import skeletonStyles from "./skeleton.module.scss";
import type { IDashboardTableProps } from "../../../../utils/types/dashboard/componentProps";

const SKELETON_ROWS = 2;
const columns = ["Item", "Location", "Available"];

const LowStockLots = ({
  data,
  loading,
}: IDashboardTableProps<ILowStockLots[]>) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2>Low Stock Lots</h2>
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
                      No low stock lots.
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
                    <td>{lot.location_name}</td>
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

export default LowStockLots;
