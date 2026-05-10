import { Link } from "react-router-dom";
import styles from "../../DashboardPage.module.css";
import type { IInventoryByCategory } from "../../../../utils/types/dashboard/main";
import clsx from "clsx";

interface IProps {
  data: IInventoryByCategory[];
}

const AvailableInventory = ({ data }: IProps) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2 className={styles.title}>Available Inventory by Category</h2>
        <Link to="/inventory" className={styles.link}>
          Open inventory
        </Link>
      </div>

      <div className="table-section__card">
        {data.length === 0 ? (
          <div className="table-section--empty">No inventory found.</div>
        ) : (
          <div className={clsx("table-section__wrapper")}>
            <table className="table-section__table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Items</th>
                  <th>Available Qty</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.category_id || row.category_name}>
                    <td>{row.category_name}</td>
                    <td>{row.item_count}</td>
                    <td>{row.total_available_quantity}</td>
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

export default AvailableInventory;
