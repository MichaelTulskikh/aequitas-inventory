import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { InventoryCatalogItem } from "../../api/inventory";
import { useAuth } from "../../auth/AuthContext";

import AppModal from "../../components/AppModal";
import InventoryLotDetailContent from "../../components/InventoryLotDetailContent";

import InventoryFilters from "./components/InventoryFilters";
import InventoryPagination from "./components/InventoryPagination";
import InventorySummaryBar from "./components/InventorySummaryBar";
import InventoryTable from "./components/InventoryTable";
import RequestInventoryModal from "./components/RequestInventoryModal";

import { useInventoryCatalog } from "./hooks/useInventoryCatalog";
import { useInventoryFilters } from "./hooks/useInventoryFilters";
import { useInventoryLotExpansion } from "./hooks/useInventoryLotExpansion";
import { useInventoryRequest } from "./hooks/useInventoryRequest";

import styles from "./InventoryPage.module.css";

export default function InventoryPage() {
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes("Admin");
  const isStaff = user?.roles?.includes("Staff");
  const isPrivileged = isAdmin || isStaff;

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [lotModalOpen, setLotModalOpen] = useState(false);

  const filters = useInventoryFilters();
  const expansion = useInventoryLotExpansion();

  const catalog = useInventoryCatalog({
    search: filters.search,
    selectedCategoryId: filters.selectedCategoryId,
    selectedTagIds: filters.selectedTagIds,
    palletNumbers: filters.palletNumbers,
    boxNumbers: filters.boxNumbers,
    page: filters.page,
    pageSize: filters.pageSize,
    showOnlyAvailable: filters.showOnlyAvailable,
    includeInternal: isPrivileged ? filters.includeInternal : false,
  });

  const request = useInventoryRequest({
    onRequestSuccess: catalog.reload,
  });

  const {
    setTagDropdownOpen,
    setPage,
    setPageSize,
    setSearchDraft,
    setSelectedCategoryId,
    setSelectedTagIds,
    setPalletSearchDraft,
    setBoxSearchDraft,
    setShowOnlyAvailable,
    setIncludeInternal,
  } = filters;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(`.${styles.tagSelector}`)) {
        setTagDropdownOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [setTagDropdownOpen]);

  function openLotModal(lotId: string) {
    setSelectedLotId(lotId);
    setLotModalOpen(true);
  }

  function closeLotModal() {
    setLotModalOpen(false);
    setSelectedLotId(null);
  }

  function clearFilters() {
    setSearchDraft("");
    filters.setSearch("");
    setSelectedCategoryId("");
    setSelectedTagIds([]);
    setPalletSearchDraft("");
    setBoxSearchDraft("");
    filters.setPalletNumbers([]);
    filters.setBoxNumbers([]);
    setShowOnlyAvailable(true);
    setIncludeInternal(false);
    filters.setTagSearch("");
    setTagDropdownOpen(false);
    setPage(1);
    expansion.collapseAll();
  }

  function renderTags(item: InventoryCatalogItem) {
    if (!item.tags.length) return <span className={styles.muted}>—</span>;

    return (
      <div className={styles.tagList}>
        {item.tags.map((tag) => (
          <span key={tag.id} className={styles.tagChip}>
            {tag.name}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Inventory</h1>
          <p className={styles.subtitle}>
            Browse requestable inventory by item and variant.
          </p>
        </div>

        {isPrivileged && (
          <div className={styles.headerAction}>
            <Link className={styles.linkButton} to="/receiving">
              Receive Inventory
            </Link>
          </div>
        )}
      </div>

      <InventoryFilters
        isPrivileged={isPrivileged || false}
        categoryOptions={catalog.categoryOptions}
        tagOptions={catalog.tagOptions}
        searchDraft={filters.searchDraft}
        setSearchDraft={filters.setSearchDraft}
        applySearch={() => {
          filters.applySearch();
          filters.resetToFirstPage();
          expansion.collapseAll();
        }}
        palletSearchDraft={filters.palletSearchDraft}
        setPalletSearchDraft={filters.setPalletSearchDraft}
        applyPalletSearch={() => {
          filters.applyPalletSearch();
          filters.resetToFirstPage();
          expansion.collapseAll();
        }}
        boxSearchDraft={filters.boxSearchDraft}
        setBoxSearchDraft={filters.setBoxSearchDraft}
        applyBoxSearch={() => {
          filters.applyBoxSearch();
          filters.resetToFirstPage();
          expansion.collapseAll();
        }}
        selectedCategoryId={filters.selectedCategoryId}
        setSelectedCategoryId={(value) => {
          filters.updateCategory(value);
          expansion.collapseAll();
        }}
        selectedTagIds={filters.selectedTagIds}
        setSelectedTagIds={filters.setSelectedTagIds}
        tagSearch={filters.tagSearch}
        setTagSearch={filters.setTagSearch}
        tagDropdownOpen={filters.tagDropdownOpen}
        setTagDropdownOpen={filters.setTagDropdownOpen}
        showOnlyAvailable={filters.showOnlyAvailable}
        setShowOnlyAvailable={filters.setShowOnlyAvailable}
        includeInternal={filters.includeInternal}
        setIncludeInternal={filters.setIncludeInternal}
        clearFilters={clearFilters}
        resetToFirstPage={() => {
          filters.resetToFirstPage();
          expansion.collapseAll();
        }}
      />

      {catalog.error && (
        <div className={styles.error}>Error: {catalog.error}</div>
      )}

      <InventorySummaryBar
        itemCount={catalog.items.length}
        total={catalog.total}
        requestPrereqLoading={request.requestPrereqLoading}
        profileComplete={request.profileComplete}
        hasActiveDraftShipment={!!request.activeDraftShipment}
      />

      <InventoryTable
        items={catalog.items}
        loading={catalog.loading}
        isPrivileged={isPrivileged || false}
        expandedItems={expansion.expandedItems}
        toggleExpanded={expansion.toggleExpanded}
        canRequestLots={request.canRequestLots}
        requestDisabledReason={request.requestDisabledReason}
        onOpenLotModal={openLotModal}
        onOpenRequestModal={request.openRequestModal}
        renderTags={renderTags}
      />

      <InventoryPagination
        page={filters.page}
        totalPages={catalog.totalPages}
        pageSize={filters.pageSize}
        loading={catalog.loading}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPage(1);
          setPageSize(size);
          expansion.collapseAll();
        }}
      />

      <RequestInventoryModal
        open={request.requestModalOpen}
        requestingLot={request.requestingLot}
        activeDraftShipment={request.activeDraftShipment}
        requestQuantity={request.requestQuantity}
        setRequestQuantity={request.setRequestQuantity}
        requestSaving={request.requestSaving}
        requestError={request.requestError}
        requestSuccess={request.requestSuccess}
        onClose={request.closeRequestModal}
        onSubmit={request.handleRequestSubmit}
      />

      {lotModalOpen && selectedLotId && (
        <AppModal title="Inventory Lot" width="1000px" onClose={closeLotModal}>
          <InventoryLotDetailContent lotId={selectedLotId} />
        </AppModal>
      )}
    </div>
  );
}