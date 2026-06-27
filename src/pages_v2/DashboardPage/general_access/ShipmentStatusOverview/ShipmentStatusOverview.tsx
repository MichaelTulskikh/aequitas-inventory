import clsx from "clsx";
import type { IShipmentsByStatus } from "../../../../utils/types/dashboard/main";
import styles from "./ShipmentStatusOverview.module.scss";
import skeletonStyles from "./skeleton.module.scss";
import type { IDashboardTableProps } from "../../../../utils/types/dashboard/componentProps";

const SKELETON_CARDS = 6;

const ShipmentStatusOverview = ({
  data,
  loading,
}: IDashboardTableProps<IShipmentsByStatus | null>) => {
  return (
    <section className="table-section">
      <div className="table-section__header">
        <h2>Shipment Status Overview</h2>
      </div>

      <div className={styles.statusGrid}>
        {loading
          ? Array.from({ length: SKELETON_CARDS }).map((_, i) => (
              <div
                data-testid="skeleton"
                key={i}
                className={skeletonStyles.skeletonCard}
              >
                <div
                  className={clsx(
                    skeletonStyles.skeleton,
                    skeletonStyles.skeletonText,
                  )}
                  style={{ width: "60%" }}
                />

                <div
                  className={clsx(
                    skeletonStyles.skeleton,
                    skeletonStyles.skeletonValue,
                  )}
                />
              </div>
            ))
          : data
            ? Object.entries(data).map(([k, v]) => {
                const status = k.charAt(0).toUpperCase() + k.slice(1);

                return (
                  <div
                    key={k}
                    className={clsx(
                      styles.statusCard,
                      styles[`status${status}`],
                    )}
                  >
                    <div className={styles.statusLabel}>{status}</div>

                    <div className={styles.statusValue}>{v}</div>
                  </div>
                );
              })
            : null}
      </div>
    </section>
  );
};

export default ShipmentStatusOverview;
