import { Link } from "react-router-dom";
import type { ILowStockLots } from "../../../../utils/types/dashboard/main";
import styles from "../../DashboardPage.module.css";
import clsx from "clsx";

interface IProps {
  data: ILowStockLots[];
}

const LowStockLots = ({ data }: IProps) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2 className={styles.title}>Low Stock Lots</h2>
      </div>

      <div className="table-section__card">
        {!data || data.length === 0 ? (
          <div className="table-section--empty">No low stock lots.</div>
        ) : (
          <div className={clsx("table-section__wrapper")}>
            <table className="table-section__table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Location</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {data.map((lot) => (
                  <tr key={lot.inventory_lot_id}>
                    <td>
                      <Link to={`/inventory/lots/${lot.inventory_lot_id}`}>
                        {lot.item_name}
                      </Link>
                    </td>
                    <td>{lot.location_name}</td>
                    <td>{lot.available_quantity}</td>
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

export default LowStockLots;
