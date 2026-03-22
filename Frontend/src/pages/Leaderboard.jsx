import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import api from '../api/axios';
import Toast from '../components/common/Toast';

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
    <div className="instructor-dashboard">
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem' }}>
        <div className="instructor-header" style={{ marginBottom: '1rem' }}>
          <h1 className="gradient-text">General Leaderboard</h1>
          <p>All learners ranked by total points.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learner..."
            className="form-input"
            style={{ maxWidth: '280px' }}
          />
          <select className="form-input" value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ width: '90px' }}>
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
                <tr><td colSpan={4}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4}>No learners found</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id}>
                    <td>#{r.rank}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
                          {r.avatar ? <img src={r.avatar} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (r.name?.charAt(0) || '?')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>{r.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r.badgeLevel || 'Newbie'}</td>
                    <td>{r.totalPoints || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</button>
              <span style={{ fontSize: '0.85rem' }}>Page {currentPage} / {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <input
                className="form-input"
                style={{ width: '70px', padding: '0.45rem' }}
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
