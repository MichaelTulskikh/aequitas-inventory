import "../styles/admin-data.css";
// import ItemManager from "../components/ItemManager";
import ItemTypeManager from "../components/ItemTypeManager";
import LocationManager from "../components/LocationManager";

export default function AdminDataPage() {
  return (
    <div className="admin-page">
      <h1>Admin Reference Data</h1>

      <section className="admin-section">
        <h2>Item Categories</h2>
        <ItemTypeManager />
      </section>

      {/* <section className="admin-section">
        <h2>Items</h2>
        <ItemManager />
      </section> */}

      <section className="admin-section">
        <h2>Locations</h2>
        <LocationManager />
      </section>
    </div>
  );
}
