import styles from "./Loader.module.scss";

const Loader = () => {
  return (
    <div className={styles.loader}>
      <div className={styles.spinner} />
      <span>Loading info…</span>
    </div>
  );
};

export default Loader;
