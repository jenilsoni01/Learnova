import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import api from '../api/axios';
import Toast from '../components/common/Toast';
import './Leaderboard.css';

const Leaderboard = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, limit]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data } = await api.get('/reporting/leaderboard', { params });
      setRows(Array.isArray(data?.data) ? data.data : []);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to load leaderboard', type: 'error' });
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="leaderboard">
      <Navbar />
      <div className="container">
        <div className="leaderboard-header">
          <h1 className="gradient-text">General Leaderboard</h1>
          <p>All learners ranked by total points.</p>
        </div>

        <div className="leaderboard-controls">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learner..."
            className="form-input search-input"
          />
          <select className="form-input limit-select" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="instructor-table-section">
          <table className="instructor-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Learner</th>
                <th>Badge</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="loading-row">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="empty-row">No learners found</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id}>
                    <td className={`rank-cell ${r.rank <= 3 ? `top-${r.rank}` : ''}`}>#{r.rank}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {r.avatar ? <img src={r.avatar} alt={r.name} /> : (r.name?.charAt(0) || '?')}
                        </div>
                        <div className="user-details">
                          <div className="user-name">{r.name}</div>
                          <div className="user-email">{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge-cell">{r.badgeLevel || 'Newbie'}</span></td>
                    <td className="points-cell">{r.totalPoints || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination-controls">
            <div className="pagination-nav">
              <button className="btn btn-secondary btn-sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</button>
              <span className="pagination-info">Page {currentPage} / {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
            <div className="pagination-jump">
              <input
                className="form-input page-input"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const page = Math.max(1, Math.min(totalPages, Number(pageInput) || 1));
                  setCurrentPage(page);
                }}
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Leaderboard;
