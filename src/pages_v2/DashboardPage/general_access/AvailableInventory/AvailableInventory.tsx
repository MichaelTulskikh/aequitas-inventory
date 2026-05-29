import { Link } from "react-router-dom";
import type { IInventoryByCategory } from "../../../../utils/types/dashboard/main";
import skeletonStyles from "./skeleton.module.scss";
import type { IDashboardTableProps } from "../../../../utils/types/dashboard/componentProps";

const SKELETON_ROWS = 15;
const columns = ["Category", "Items", "Available Qty"];

const AvailableInventory = ({
  data,
  loading,
}: IDashboardTableProps<IInventoryByCategory[]>) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2>Available Inventory by Category</h2>
        <Link to="/inventory">Open inventory</Link>
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
                      No inventory found.
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.category_id || row.category_name}>
                    <td>{row.category_name}</td>
                    <td>{row.item_count}</td>
                    <td>{row.total_available_quantity}</td>
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

export default AvailableInventory;
