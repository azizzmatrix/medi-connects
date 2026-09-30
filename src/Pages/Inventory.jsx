import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMedicines,
  updateMedicine,
  deleteMedicine,
  getSupplier,
} from "../API/medicine";
import { Plus, Pencil, Trash2, Check, X, Search, Loader2 } from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatInputDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

function Inventory() {
  const navigate = useNavigate();
  const [inventoryData, setInventoryData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [meds, supps] = await Promise.all([getMedicines(), getSupplier()]);
        if (isMounted) {
          setInventoryData(Array.isArray(meds) ? meds : []);
          setSuppliers(Array.isArray(supps) ? supps : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching inventory data:", err);
          setError("Failed to load inventory. Please try again.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // O(1) Supplier HashMap to avoid repeated array scanning in render cycles
  const supplierMap = useMemo(() => {
    const map = new Map();
    suppliers.forEach((s) => {
      if (s?.supplierId) map.set(s.supplierId, s.supplierName);
    });
    return map;
  }, [suppliers]);

  const getSupplierName = (supplierId) => {
    return supplierMap.get(supplierId) || "Unknown Supplier";
  };

  const handleEdit = (item) => {
    setEditingId(item.medicineId);
    setEditData({ ...item });
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        ...editData,
        stockQuantity: Number(editData.stockQuantity) || 0,
        price: parseFloat(editData.price) || 0,
        expiryDate: editData.expiryDate
          ? new Date(editData.expiryDate).toISOString()
          : editData.expiryDate,
      };

      await updateMedicine(editingId, payload);
      setInventoryData((prev) =>
        prev.map((m) => (m.medicineId === editingId ? { ...m, ...payload } : m))
      );
      setEditingId(null);
      setEditData({});
    } catch (err) {
      console.error("Error updating medicine:", err);
      alert("Failed to update item. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      await deleteMedicine(id);
      // State update instead of expensive window.location.reload()
      setInventoryData((prev) => prev.filter((item) => item.medicineId !== id));
    } catch (err) {
      console.error("Error deleting medicine:", err);
      alert("Failed to delete item. Please try again.");
    }
  };

  // Memoized filter logic for fast search and filter execution
  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const today = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(today.getMonth() + 1);

    return inventoryData.filter((item) => {
      const supplierName = getSupplierName(item.supplierId);
      const matchesSearch =
        (item.name?.toLowerCase() || "").includes(searchLower) ||
        supplierName.toLowerCase().includes(searchLower);

      const matchesCategory =
        category === "all" || item.category?.toLowerCase() === category;

      const expiryDate = new Date(item.expiryDate);
      const isExpired = expiryDate < today;
      const isExpiringSoon = expiryDate >= today && expiryDate <= oneMonthFromNow;

      const matchesStatus =
        status === "all" ||
        (status === "low" && item.stockQuantity < (item.reorderLevel || 30)) ||
        (status === "out" && item.stockQuantity === 0) ||
        (status === "expiring" && isExpiringSoon) ||
        (status === "expired" && isExpired);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventoryData, searchTerm, category, status, supplierMap]);

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div className="header-container">
          <h1 className="inventory-title">Inventory</h1>
          <p className="inventory-count">{inventoryData.length} • medicines</p>
        </div>
        <div className="addmedicine">
          <button className="addmedicine-btn" onClick={() => navigate("/medicine")}>
            <Plus size={16} />
            Add Medicine
          </button>
        </div>
      </div>

      <div className="search-constainer">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search medicines..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <div className="category">
            <select
              className="filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              <option value="capsules">Capsules</option>
              <option value="injectables">Injectables</option>
              <option value="sachets">Sachets</option>
              <option value="supplements">Supplements</option>
              <option value="syrups">Syrups</option>
              <option value="tablets">Tablets</option>
              <option value="topicals">Topicals</option>
            </select>
          </div>
          <div className="status">
            <select
              className="filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
              <option value="expiring">Expiring soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="inventory-table-container">
        {isLoading ? (
          <div className="loading-state" style={{ padding: "2rem", textAlign: "center" }}>
            <Loader2 className="animate-spin" size={24} />
            <p>Loading inventory...</p>
          </div>
        ) : error ? (
          <div className="error-state" style={{ padding: "2rem", textAlign: "center", color: "red" }}>
            {error}
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Expiry</th>
                <th>Stock</th>
                <th>Price</th>
                <th>Supplier</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "1.5rem" }}>
                    No medicines match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.medicineId}>
                    <td>
                      <div className="tablecont">
                        <div className="cell-title">{item.name}</div>
                        <div className="cell-subtitle">
                          {getSupplierName(item.supplierId)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{item.category}</span>
                    </td>

                    {/* Expiry Column */}
                    <td>
                      {editingId === item.medicineId ? (
                        <input
                          type="date"
                          value={formatInputDate(editData.expiryDate)}
                          onChange={(e) =>
                            setEditData({ ...editData, expiryDate: e.target.value })
                          }
                          className="edit-input"
                        />
                      ) : (
                        (() => {
                          const expiryDate = new Date(item.expiryDate);
                          const now = new Date();
                          const diffDays = Math.ceil(
                            (expiryDate - now) / (1000 * 60 * 60 * 24)
                          );

                          if (expiryDate < now) {
                            return <span className="badge badge-red">Expired</span>;
                          } else if (diffDays <= 30) {
                            return (
                              <span className="badge badge-orange">
                                {diffDays}d left
                              </span>
                            );
                          } else {
                            return formatDate(item.expiryDate);
                          }
                        })()
                      )}
                    </td>

                    {/* Stock Column */}
                    <td>
                      {editingId === item.medicineId ? (
                        <input
                          type="number"
                          value={editData.stockQuantity}
                          onChange={(e) =>
                            setEditData({ ...editData, stockQuantity: e.target.value })
                          }
                          className="edit-input"
                        />
                      ) : (
                        (() => {
                          if (item.stockQuantity === 0) {
                            return (
                              <span className="badge badge-red">Out of stock</span>
                            );
                          } else if (item.stockQuantity < (item.reorderLevel || 30)) {
                            return (
                              <span className="badge badge-orange">
                                Low • {item.stockQuantity}
                              </span>
                            );
                          } else {
                            return (
                              <span className="badge badge-green">
                                {item.stockQuantity} in stock
                              </span>
                            );
                          }
                        })()
                      )}
                    </td>

                    {/* Price Column */}
                    <td className="cell-title">
                      {editingId === item.medicineId ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editData.price}
                          onChange={(e) =>
                            setEditData({ ...editData, price: e.target.value })
                          }
                          className="edit-input"
                        />
                      ) : (
                        `₹${item.price}`
                      )}
                    </td>

                    <td>{getSupplierName(item.supplierId)}</td>
                    <td className="text-right">
                      {editingId === item.medicineId ? (
                        <>
                          <button onClick={handleUpdate} className="action-btn">
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="action-btn delete"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="action-btn"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.medicineId)}
                            className="action-btn delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Inventory;