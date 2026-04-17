import type { Dispatch, SetStateAction } from "react";
import styles from "../InventoryPage.module.css";

type InventoryPaginationProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  loading: boolean;
  onPageChange: Dispatch<SetStateAction<number>>;
  onPageSizeChange: (size: number) => void;
};

export default function InventoryPagination({
  page,
  totalPages,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange,
}: InventoryPaginationProps) {
  return (
    <div className={styles.pagination}>
      <div className={styles.paginationGroup}>
        <button
          type="button"
          className={styles.button}
          disabled={page === 1 || loading}
          onClick={() => onPageChange(1)}
        >
          First
        </button>

        <button
          type="button"
          className={styles.button}
          disabled={page === 1 || loading}
          onClick={() => onPageChange((prev) => Math.max(1, prev - 1))}
        >
          Previous
        </button>
      </div>

      <span className={styles.pageStatus}>
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>

      <div className={styles.paginationGroup}>
        <button
          type="button"
          className={styles.button}
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange((prev) => Math.min(totalPages, prev + 1))}
        >
          Next
        </button>

        <button
          type="button"
          className={styles.button}
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(totalPages)}
        >
          Last
        </button>
      </div>

      <div className={styles.pageSizeControl}>
        <label htmlFor="inventory-page-size" className={styles.pageSizeLabel}>
          Items Per Page
        </label>
        <select
          id="inventory-page-size"
          className={styles.select}
          value={pageSize}
          disabled={loading}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}