import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, Users, GraduationCap, MapPin, Calendar, ChevronRight, Edit2, Trash2, Upload, Download, Search, X, CheckCircle, AlertCircle, RefreshCw, Lock, Unlock, UserCheck, UserX, Shield, ChevronLeft, ChevronDown, FileText, Layers, Bell, ClipboardList } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001'
const SQUAD_NAMES = ['Surya', 'Aditya', 'Ravi', 'Divakar', 'Mitra', 'Martand', 'Dinkar', 'Prabhakar', 'Bhaskar', 'Tejonidhi']
const SQUAD_COLORS = {
  Surya:     '#1e3a8a',
  Aditya:    '#2563eb',
  Ravi:      '#1d4ed8',
  Divakar:   '#3b82f6',
  Mitra:     '#1e40af',
  Martand:   '#0284c7',
  Dinkar:    '#3b82f6',
  Prabhakar: '#0369a1',
  Bhaskar:   '#0f172a',
  Tejonidhi: '#000000',
}

const BATCH_IMAGES = [
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498243691581-b145c3f54a91?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527891751199-7225231a68dd?w=600&auto=format&fit=crop&q=80'
]
const getBatchImage = (id) => BATCH_IMAGES[(id || 0) % BATCH_IMAGES.length]

// ─── Toast Hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])
  return { toasts, toast }
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle size={18} className="toast-icon" />}
          {t.type === 'error' && <AlertCircle size={18} className="toast-icon" />}
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Pagination Component ─────────────────────────────────────────────────────
function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null
  const { page, pages, total, limit } = pagination
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  const pageNums = []
  let lo = Math.max(1, page - 2), hi = Math.min(pages, page + 2)
  for (let i = lo; i <= hi; i++) pageNums.push(i)

  return (
    <div className="pagination">
      <button className="pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={14} />
      </button>
      {lo > 1 && <><button className="pagination-btn" onClick={() => onPageChange(1)}>1</button>{lo > 2 && <span style={{ color: 'var(--text-4)', padding: '0 4px' }}>…</span>}</>}
      {pageNums.map(n => (
        <button key={n} className={`pagination-btn ${n === page ? 'active' : ''}`} onClick={() => onPageChange(n)}>{n}</button>
      ))}
      {hi < pages && <><span style={{ color: 'var(--text-4)', padding: '0 4px' }}>…</span><button className="pagination-btn" onClick={() => onPageChange(pages)}>{pages}</button></>}
      <button className="pagination-btn" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight size={14} />
      </button>
      <span className="pagination-info">Showing {start}–{end} of {total}</span>
    </div>
  )
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, size = '' }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', padding: 4 }}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// ─── Batch Form Modal ─────────────────────────────────────────────────────────
function BatchFormModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({ name: '', location: '', start_date: '', end_date: '', status: 'upcoming', description: '', batch_code: '', year: String(new Date().getFullYear()), capacity: '' })
  
  useEffect(() => { 
    if (initial) {
      setForm({
        name: initial.name || '',
        location: initial.location || '',
        start_date: initial.start_date || '',
        end_date: initial.end_date || '',
        status: initial.status || 'upcoming',
        description: initial.description || '',
        batch_code: initial.batch_code || '',
        year: initial.year || String(new Date().getFullYear()),
        capacity: initial.capacity || ''
      })
    } else { 
      setForm({ name: '', location: '', start_date: '', end_date: '', status: 'upcoming', description: '', batch_code: '', year: String(new Date().getFullYear()), capacity: '' }) 
    } 
  }, [initial, open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Batch' : 'Create New Batch'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Batch Name *</label>
            <input className="input-field input-field-rect" placeholder="e.g. LTC Nashik" value={form.name} onChange={e => set('name', e.target.value)} style={{ marginBottom: 0 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Year *</label>
            <input type="number" className="input-field input-field-rect" placeholder="e.g. 2026" value={form.year} onChange={e => set('year', e.target.value)} style={{ marginBottom: 0 }} />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Batch Code</label>
            <input className="input-field input-field-rect" placeholder="Auto-generated if blank" value={form.batch_code} onChange={e => set('batch_code', e.target.value)} style={{ marginBottom: 0 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Capacity (Max Students)</label>
            <input type="number" className="input-field input-field-rect" placeholder="e.g. 250" value={form.capacity} onChange={e => set('capacity', e.target.value)} style={{ marginBottom: 0 }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Location</label>
          <input className="input-field input-field-rect" placeholder="e.g. MIT Campus, Pune" value={form.location} onChange={e => set('location', e.target.value)} style={{ marginBottom: 0 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Start Date</label>
            <input type="date" className="input-field input-field-rect" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={{ marginBottom: 0 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>End Date</label>
            <input type="date" className="input-field input-field-rect" value={form.end_date} onChange={e => set('end_date', e.target.value)} style={{ marginBottom: 0 }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Status</label>
          <select className="input-field input-field-rect" value={form.status} onChange={e => set('status', e.target.value)} style={{ marginBottom: 0, borderRadius: 12 }}>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Description</label>
          <textarea className="input-field" placeholder="Optional notes about this batch..." value={form.description} onChange={e => set('description', e.target.value)} style={{ marginBottom: 0, minHeight: 80, borderRadius: 12 }} />
        </div>
      </div>
      <div className="modal-footer" style={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 0, marginTop: 20 }}>
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={() => onSave(form)} disabled={!form.name.trim()}>{initial ? 'Save Changes' : 'Create Batch'}</button>
      </div>
    </Modal>
  )
}

// ─── Batch Students Tab ───────────────────────────────────────────────────────
function BatchStudentsTab({ batchId, token, toast }) {
  const [students, setStudents] = useState([])
  const [pagination, setPagination] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [jobProgress, setJobProgress] = useState(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [recordsToConfirm, setRecordsToConfirm] = useState([])

  const fetchStudents = useCallback(async (pg = 1, q = search) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/batches/${batchId}/students?page=${pg}&limit=50&search=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) { setStudents(data.students); setPagination(data.pagination) }
    } finally { setLoading(false) }
  }, [batchId, token, search])

  useEffect(() => { fetchStudents(1, '') }, [batchId])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchStudents(1, search) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const handleRemove = async (studentId) => {
    if (!window.confirm('Remove this student from the batch? Their master record will be preserved.')) return
    await fetch(`${API}/api/admin/batches/${batchId}/students/${studentId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    })
    toast('Student removed from batch.', 'success')
    fetchStudents(page, search)
  }

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const name = file.name.toLowerCase()
    const parse = (records) => processBulkUpload(records)

    if (name.endsWith('.csv')) {
      Papa.parse(file, { header: true, skipEmptyLines: true, complete: r => parse(r.data), error: () => toast('CSV parse error', 'error') })
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const reader = new FileReader()
      reader.onload = evt => {
        const wb = XLSX.read(evt.target.result, { type: 'binary' })
        parse(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]))
      }
      reader.readAsBinaryString(file)
    }
    e.target.value = null
  }

  const processBulkUpload = (records) => {
    if (!Array.isArray(records) || records.length === 0) {
      toast('The uploaded file is empty or invalid.', 'error');
      return;
    }
    const normalized = records.map(raw => {
      const r = {};
      for (const key in raw) {
        r[key.replace(/^\uFEFF/, '').toLowerCase().trim()] = String(raw[key] || '').trim();
      }
      return {
        name: r.name || r['full name'] || r.username || '—',
        email: r.email || '—',
        prn: r.prn || r['student id'] || r.student_id || r.faculty_id || r['faculty id'] || r.id || '—',
        role: r.role || 'student',
        department: r.department || r.dept || '—'
      };
    });
    setRecordsToConfirm(normalized);
    setShowConfirmModal(true);
  };

  const handleLinkConfirm = async () => {
    setShowConfirmModal(false);
    setUploading(true);
    try {
      const res = await fetch(`${API}/api/admin/batches/${batchId}/enroll-existing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ records: recordsToConfirm })
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.message || 'Linking failed.', 'error');
        return;
      }

      const parts = [];
      if (data.enrolled > 0)       parts.push(`${data.enrolled} enrolled`);
      if (data.alreadyInBatch > 0) parts.push(`${data.alreadyInBatch} already in batch`);
      if (data.notFound > 0)       parts.push(`${data.notFound} not found in database`);

      const type = data.notFound > 0 ? 'warning' : 'success';
      toast(parts.join(' · ') || 'No changes made.', type);
      fetchStudents(1, search);
    } catch (err) {
      toast('Network error during upload.', 'error');
    } finally {
      setUploading(false);
      setRecordsToConfirm([]);
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(students.map(s => ({
      Name: s.name, Email: s.email, PRN: s.prn, Department: s.department,
      School: s.school, Semester: s.semester, Squad: s.squad || '', Room: s.room || '',
      Gender: s.gender, NRI: s.nri ? 'Yes' : 'No', Insured: s.insured ? 'Yes' : 'No',
      Barcode: s.barcode || ''
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, `batch_${batchId}_students.xlsx`)
    toast('Exported successfully', 'success')
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          <Search className="search-icon" size={16} />
          <input className="input-field" placeholder="Search by name, email, PRN…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ marginBottom: 0 }} />
        </div>
        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
          <Upload size={14} /> {uploading ? 'Linking…' : 'Link to this batch'}
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleBulkUpload} style={{ display: 'none' }} />
        </label>
        <button className="btn btn-outline btn-sm" onClick={handleExport}><Download size={14} /> Export</button>
        <button className="btn btn-outline btn-sm" onClick={() => fetchStudents(page, search)}><RefreshCw size={14} /></button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr>
            <th>Name</th><th>PRN / LTC ID</th><th>Email</th><th>School / Dept</th>
            <th>Squad</th><th>NRI</th><th>Insured</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-center" style={{ minHeight: 80 }}><div className="spinner spinner-sm" /></div></td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state" style={{ padding: '40px 0' }}><GraduationCap size={36} /><p>No students found. Upload a CSV/XLSX to add students.</p></div></td></tr>
            ) : students.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13.5 }}>{s.name}</div>
                  {s.red_flag && <span className="badge badge-black" style={{ marginTop: 3 }}>🚩 Flagged</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <code style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.prn || '—'}</code>
                    {s.ltc_id && (
                      <span className="badge badge-blue" style={{ fontSize: 10, alignSelf: 'flex-start', background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                        LTC ID: {s.ltc_id}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{s.email}</td>
                <td style={{ fontSize: 12.5 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>{s.school || '—'}</div>
                  <div style={{ color: 'var(--text-4)', fontSize: 11.5 }}>{s.department}</div>
                </td>
                <td>
                  {s.squad
                    ? <span className="badge" style={{ background: (SQUAD_COLORS[s.squad] + '22') || 'var(--primary-bg)', color: SQUAD_COLORS[s.squad] || 'var(--primary)' }}>{s.squad}</span>
                    : <span style={{ color: 'var(--text-4)', fontSize: 12 }}>—</span>}
                </td>
                <td>{s.nri ? <span className="badge badge-nri">NRI</span> : <span style={{ color: 'var(--text-4)', fontSize: 12 }}>Regular</span>}</td>
                <td>{s.insured ? <span className="badge badge-blue">✓ Yes</span> : <span className="badge badge-black">✗ No</span>}</td>
                <td>
                  <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleRemove(s.id)}>
                    <UserX size={12} /> Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={p => { setPage(p); fetchStudents(p, search) }} />

      <Modal open={showProgressModal} onClose={() => {
        if (jobProgress && (jobProgress.status === 'completed' || jobProgress.status === 'failed')) {
          setShowProgressModal(false);
          setJobProgress(null);
        }
      }} title="Bulk Upload Progress" size="lg">
        {jobProgress ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                {jobProgress.status === 'processing' ? 'Processing records...' :
                 jobProgress.status === 'completed' ? 'Upload Completed!' :
                 jobProgress.status === 'failed' ? 'Upload Failed' : 'Initializing...'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
                {jobProgress.processed_records} / {jobProgress.total_records}
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${jobProgress.total_records > 0 ? (jobProgress.processed_records / jobProgress.total_records) * 100 : 0}%`,
                height: '100%',
                background: jobProgress.status === 'failed' ? 'var(--danger)' : 'var(--primary)',
                transition: 'width 0.4s ease'
              }} />
            </div>

            {/* Stats Counter */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#eff6ff', border: '1px solid #bbf7d0', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#166534' }}>{jobProgress.success_count}</div>
                <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>Success</div>
              </div>
              <div style={{ background: '#fef2f2', border: '1px solid #f1f5f9', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{jobProgress.failed_count}</div>
                <div style={{ fontSize: 12, color: '#000000', fontWeight: 600 }}>Failed</div>
              </div>
            </div>

            {/* Errors List */}
            {jobProgress.errors && jobProgress.errors.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>Row-level Errors / Warnings ({jobProgress.errors.length})</h4>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: '#f8fafc' }}>
                  <table className="data-table data-table-compact" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Row Target</th>
                        <th>Error Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobProgress.errors.map((err, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, fontSize: 12 }}><code style={{ background: '#e2e8f0', padding: '2px 4px', borderRadius: 4 }}>{err.row}</code></td>
                          <td style={{ color: 'var(--danger)', fontSize: 12 }}>{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Controls */}
            {(jobProgress.status === 'completed' || jobProgress.status === 'failed') && (
              <div className="modal-footer" style={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 0, marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => {
                  setShowProgressModal(false);
                  setJobProgress(null);
                  fetchStudents(1, search);
                }}>Done</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 12 }}>
            <div className="spinner" />
            <span style={{ color: 'var(--text-3)', fontSize: 14, fontWeight: 600 }}>Uploading & parsing file...</span>
          </div>
        )}
      </Modal>

      {/* Link Confirmation Modal */}
      <Modal open={showConfirmModal} onClose={() => { setShowConfirmModal(false); setRecordsToConfirm([]); }} title="Confirm Batch Linkage" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-light)', padding: 16, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Users size={20} style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Ready to Link Records</h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                We parsed <strong>{recordsToConfirm.length}</strong> record(s) from your file. Please verify them below. Clicking <strong>Confirm & Link</strong> will associate these students/faculty with the current batch. No master database profile details will be modified.
              </p>
            </div>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
            <table className="data-table data-table-compact" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>PRN / ID</th>
                  <th>Role</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {recordsToConfirm.map((rec, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{rec.name}</td>
                    <td>{rec.email}</td>
                    <td><code style={{ fontSize: 11 }}>{rec.prn}</code></td>
                    <td>
                      <span className={`badge ${rec.role === 'faculty' ? 'badge-blue' : 'badge-green'}`}>
                        {rec.role}
                      </span>
                    </td>
                    <td>{rec.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="modal-footer" style={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 0, marginTop: 12, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowConfirmModal(false);
                setRecordsToConfirm([]);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleLinkConfirm}
            >
              Confirm & Link
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Batch Faculty Tab ────────────────────────────────────────────────────────
function BatchFacultyTab({ batchId, token, toast }) {
  const [faculty, setFaculty] = useState([])
  const [allFaculty, setAllFaculty] = useState([])
  const [search, setSearch] = useState('')
  const [addSearch, setAddSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchFaculty = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/batches/${batchId}/faculty`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setFaculty(data.faculty)
    } finally { setLoading(false) }
  }, [batchId, token])

  const fetchAll = async () => {
    const res = await fetch(`${API}/api/admin/faculty-list?limit=200&search=${encodeURIComponent(addSearch)}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (res.ok) setAllFaculty(data.faculty)
  }

  useEffect(() => { fetchFaculty() }, [batchId])
  useEffect(() => { if (showAddModal) fetchAll() }, [showAddModal, addSearch])

  const handleAdd = async (fid) => {
    await fetch(`${API}/api/admin/batches/${batchId}/faculty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ faculty_ids: [fid] })
    })
    toast('Faculty added to batch.', 'success')
    fetchFaculty()
  }

  const handleRemove = async (fid) => {
    if (!window.confirm('Remove this faculty from batch? Master record preserved.')) return
    await fetch(`${API}/api/admin/batches/${batchId}/faculty/${fid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    toast('Faculty removed from batch.', 'success')
    fetchFaculty()
  }

  const inBatch = useMemo(() => new Set(faculty.map(f => f.id)), [faculty])
  const filtered = useMemo(() => faculty.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.email.toLowerCase().includes(search.toLowerCase())
  ), [faculty, search])

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          <Search className="search-icon" size={16} />
          <input className="input-field" placeholder="Search faculty…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 0 }} />
        </div>
        <button className="btn btn-sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> Assign Faculty</button>
        <button className="btn btn-outline btn-sm" onClick={fetchFaculty}><RefreshCw size={14} /></button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Panel</th><th>Type</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="loading-center" style={{ minHeight: 80 }}><div className="spinner spinner-sm" /></div></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state" style={{ padding: '40px 0' }}><Users size={36} /><p>No faculty assigned yet.</p></div></td></tr>
            ) : filtered.map(f => (
              <tr key={f.id}>
                <td><div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13.5 }}>{f.name}</div></td>
                <td style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{f.email}</td>
                <td style={{ fontSize: 12.5 }}>{f.department}</td>
                <td>{f.panel ? <span className="badge badge-blue">{f.panel}</span> : <span style={{ color: 'var(--text-4)', fontSize: 12 }}>—</span>}</td>
                <td>{f.is_primary ? <span className="badge badge-blue">Primary</span> : <span className="badge badge-gray">Secondary</span>}</td>
                <td>
                  <button className="btn btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleRemove(f.id)}>
                    <UserX size={12} /> Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Assign Faculty to Batch" size="lg">
        <div className="search-wrapper" style={{ maxWidth: '100%' }}>
          <Search className="search-icon" size={16} />
          <input className="input-field" placeholder="Search faculty…" value={addSearch} onChange={e => setAddSearch(e.target.value)} style={{ marginBottom: 0 }} />
        </div>
        <div className="table-wrapper" style={{ marginTop: 16 }}>
          <table className="data-table data-table-compact">
            <thead><tr><th>Name</th><th>Department</th><th>Panel</th><th>Action</th></tr></thead>
            <tbody>
              {allFaculty.map(f => (
                <tr key={f.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-4)' }}>{f.email}</div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{f.department}</td>
                  <td>{f.panel ? <span className="badge badge-blue">{f.panel}</span> : '—'}</td>
                  <td>
                    {inBatch.has(f.id)
                      ? <span className="badge badge-blue"><CheckCircle size={10} /> Added</span>
                      : <button className="btn btn-sm" onClick={() => handleAdd(f.id)}><Plus size={12} /> Add</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}

// ─── Squad Allocation Tab ─────────────────────────────────────────────────────
function SquadAllocationTab({ batchId, token, toast }) {
  const [data, setData] = useState({ locked: false, students: [], faculty: [], squadNames: SQUAD_NAMES })
  const [loading, setLoading] = useState(false)
  const [allocating, setAllocating] = useState(false)
  const [selectedSquad, setSelectedSquad] = useState(SQUAD_NAMES[0])
  const [search, setSearch] = useState('')
  const [notifying, setNotifying] = useState(null)

  const handleNotifySquads = async (type) => {
    if (!window.confirm(`Are you sure you want to send ${type} notifications to all students and faculty about their squad assignments?`)) return
    setNotifying(type)
    try {
      const res = await fetch(`${API}/api/admin/batches/${batchId}/notify-squads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type })
      })
      const d = await res.json()
      toast(d.message, res.ok ? 'success' : 'error')
    } catch (e) {
      toast('Failed to send notifications.', 'error')
    } finally {
      setNotifying(null)
    }
  }

  const fetchSquads = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/batches/${batchId}/squads`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (res.ok) setData(d)
    } finally { setLoading(false) }
  }
  useEffect(() => { fetchSquads() }, [batchId])

  const handleAutoAllocate = async () => {
    if (!window.confirm('Auto-allocate all students into 10 squads? This will overwrite existing assignments.')) return
    setAllocating(true)
    try {
      const res = await fetch(`${API}/api/admin/batches/${batchId}/auto-allocate-squads`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      toast(d.message, res.ok ? 'success' : 'error')
      if (res.ok) fetchSquads()
    } finally { setAllocating(false) }
  }

  const handleLockToggle = async () => {
    const locked = !data.locked
    const res = await fetch(`${API}/api/admin/batches/${batchId}/lock-squads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ locked })
    })
    const d = await res.json()
    toast(d.message, res.ok ? 'success' : 'error')
    if (res.ok) fetchSquads()
  }

  const handleSquadChange = async (studentId, squad) => {
    if (data.locked) { toast('Unlock squad allocation first.', 'warning'); return }
    await fetch(`${API}/api/admin/batches/${batchId}/student-squad`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ student_id: studentId, squad })
    })
    toast('Squad updated.', 'success')
    fetchSquads()
  }

  const squadStats = useMemo(() => {
    const stats = {}
    SQUAD_NAMES.forEach(s => { stats[s] = { students: 0, faculty: 0 } })
    data.students.forEach(s => { if (s.squad && stats[s.squad]) stats[s.squad].students++ })
    data.faculty.forEach(f => { if (f.squad && stats[f.squad]) stats[f.squad].faculty++ })
    return stats
  }, [data])

  const squadStudents = useMemo(() =>
    data.students.filter(s => s.squad === selectedSquad && (!search || s.name.toLowerCase().includes(search.toLowerCase())))
  , [data.students, selectedSquad, search])

  const squadFaculty = useMemo(() =>
    data.faculty.filter(f => f.squad === selectedSquad)
  , [data.faculty, selectedSquad])

  const unassigned = data.students.filter(s => !s.squad)

  return (
    <div>
      <div className="squad-actions-header" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-sm btn-auto-allocate" onClick={handleAutoAllocate} disabled={allocating || data.locked}>
          {allocating ? <><div className="spinner spinner-sm" />Allocating…</> : <><RefreshCw size={14} />Auto Allocate 10 Squads</>}
        </button>
        <button className={`btn btn-sm ${data.locked ? 'btn-unlock-allocation' : 'btn-lock-allocation'}`} onClick={handleLockToggle}>
          {data.locked ? <><Unlock size={14} />Unlock</> : <><Lock size={14} />Lock Allocation</>}
        </button>
        {data.locked && <span className="badge badge-blue"><Lock size={10} /> Allocation Locked</span>}
        
        <button 
          className="btn btn-sm" 
          onClick={() => handleNotifySquads('email')} 
          disabled={notifying === 'email'} 
          style={{ background: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }}
        >
          {notifying === 'email' ? 'Sending Emails...' : 'Send Email to All'}
        </button>
        <button 
          className="btn btn-sm" 
          onClick={() => handleNotifySquads('whatsapp')} 
          disabled={notifying === 'whatsapp'} 
          style={{ background: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }}
        >
          {notifying === 'whatsapp' ? 'Sending WhatsApp...' : 'Send WhatsApp to All'}
        </button>

        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>
          {data.students.length} students · {unassigned.length} unassigned
        </span>
      </div>

      <div className="squads-grid">
        {SQUAD_NAMES.map(sq => (
          <div key={sq} className={`squad-card ${selectedSquad === sq ? 'selected' : ''}`}
            style={{ '--squad-color': SQUAD_COLORS[sq] || 'var(--primary)' }}
            onClick={() => setSelectedSquad(sq)}>
            <div className="squad-card-header">
              <div className="squad-badge">
                {sq.substring(0, 2)}
              </div>
              <div className="squad-card-title">{sq}</div>
            </div>
            <div className="squad-stats-row">
              <div className="squad-stat-item">
                <span className="squad-stat-value">{squadStats[sq]?.students || 0}</span>
                <span className="squad-stat-label">Students</span>
              </div>
              <div className="squad-stat-item">
                <span className="squad-stat-value">{squadStats[sq]?.faculty || 0}</span>
                <span className="squad-stat-label">Faculty</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        <div className="squad-detail-header">
          <div className="squad-badge" style={{ background: SQUAD_COLORS[selectedSquad] || 'var(--primary)', width: 40, height: 40, fontSize: 14 }}>{selectedSquad.substring(0, 2)}</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{selectedSquad} Squad</h3>
          <div className="search-wrapper" style={{ margin: 0, marginLeft: 'auto', maxWidth: 260 }}>
            <Search className="search-icon" size={14} />
            <input className="input-field" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 0, paddingLeft: 40 }} />
          </div>
        </div>

        {/* Allocated Faculty Section */}
        <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Allocated Squad Faculty ({squadFaculty.length})
          </h4>
          {squadFaculty.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {squadFaculty.map(f => (
                <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{f.name}</span>
                    {f.undertaking_submitted ? (
                      <span className="badge badge-blue" style={{ fontSize: '9px', padding: '1px 5px', whiteSpace: 'nowrap' }}>Signed</span>
                    ) : (
                      <span className="badge badge-black" style={{ fontSize: '9px', padding: '1px 5px', whiteSpace: 'nowrap' }}>Pending</span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{f.email}</span>
                  {f.department && (
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', marginTop: '2px' }}>
                      Dept: {f.department}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
              No faculty allocated to this squad yet.
            </p>
          )}
        </div>

        <div className="table-wrapper">
          <table className="data-table data-table-compact">
            <thead><tr><th>Name</th><th>PRN</th><th>Gender</th><th>Undertaking</th><th>Change Squad</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5}><div className="loading-center" style={{ minHeight: 60 }}><div className="spinner spinner-sm" /></div></td></tr>
                : squadStudents.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-4)', padding: '24px 0', fontStyle: 'italic' }}>No students in this squad</td></tr>
                  : squadStudents.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td><code style={{ fontSize: 11 }}>{s.prn || '—'}</code></td>
                      <td>{s.gender || '—'}</td>
                      <td>
                        {s.undertaking_submitted ? (
                          <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', fontSize: '11px' }}>
                            ✓ Signed
                          </span>
                        ) : (
                          <span className="badge badge-black" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', fontSize: '11px' }}>
                            ⚠️ Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <select disabled={data.locked} value={s.squad || ''} onChange={e => handleSquadChange(s.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 12, background: 'white', cursor: data.locked ? 'not-allowed' : 'pointer' }}>
                          {SQUAD_NAMES.map(sq => <option key={sq} value={sq}>{sq}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Batch Attendance Tab ──────────────────────────────────────────────────────
function BatchAttendanceTab({ batchId, token, toast }) {
  const [students, setStudents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [records, setRecords] = useState([])
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [selectedSquad, setSelectedSquad] = useState(SQUAD_NAMES[0])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const studentsRes = await fetch(`${API}/api/admin/batches/${batchId}/squads`, { headers: { Authorization: `Bearer ${token}` } })
      const squadData = studentsRes.ok ? await studentsRes.json() : {}
      if (squadData.students) {
        setStudents(squadData.students)
      }

      const schedRes = await fetch(`${API}/api/schedules?batchId=${batchId}`, { headers: { Authorization: `Bearer ${token}` } })
      const schedData = schedRes.ok ? await schedRes.json() : {}
      if (schedData.schedules) {
        setSchedules(schedData.schedules)
      }

      const attRes = await fetch(`${API}/api/faculty/attendance_records`, { headers: { Authorization: `Bearer ${token}` } })
      const attData = attRes.ok ? await attRes.json() : {}
      if (attData.records) {
        setRecords(attData.records)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [batchId, token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const activeSchedule = schedules.find(s => s.id === parseInt(selectedScheduleId))
  const filteredStudents = students.filter(st => st.squad === selectedSquad)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Batch Attendance Tracking</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>Real-time student attendance status for timetable activities.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchData} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={12} className={loading ? 'spinner' : ''} /> Refresh Records
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Select Activity / Session</label>
          <select className="input-field" value={selectedScheduleId} onChange={e => setSelectedScheduleId(e.target.value)}>
            <option value="">-- All Students Summary --</option>
            {schedules.map(s => (
              <option key={s.id} value={s.id}>{s.title} ({s.date})</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Select Squad
        </label>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1.5px solid var(--border)' }}>
          {SQUAD_NAMES.map(sq => (
            <button
              key={sq}
              onClick={() => setSelectedSquad(sq)}
              style={{
                padding: '6px 14px',
                borderRadius: '50px',
                border: '1.5px solid',
                borderColor: selectedSquad === sq ? 'var(--primary)' : '#e2e8f0',
                background: selectedSquad === sq ? 'var(--primary)' : '#ffffff',
                color: selectedSquad === sq ? '#ffffff' : '#64748b',
                fontSize: '12.5px',
                fontWeight: '750',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-center" style={{ minHeight: '120px' }}><div className="spinner" /></div>
      ) : !selectedScheduleId ? (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>PRN / LTC ID</th>
                <th>Student Name</th>
                <th>Squad</th>
                <th>Sessions Present</th>
                <th>Sessions Absent</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(st => {
                const studentRecords = records.filter(r => r.student_id === st.id)
                const presentCount = studentRecords.filter(r => r.status === 'Present').length
                const absentCount = studentRecords.filter(r => r.status === 'Absent').length
                const totalMarked = presentCount + absentCount
                const rate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0

                return (
                  <tr key={st.id}>
                    <td>
                      <code style={{ fontSize: '11.5px' }}>{st.prn || '—'}</code>
                    </td>
                    <td style={{ fontWeight: '600' }}>{st.name}</td>
                    <td>
                      {st.squad ? (
                        <span className="badge badge-blue" style={{ background: '#eff6ff', color: '#2563eb', fontWeight: '600' }}>{st.squad}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ color: '#059669', fontWeight: '700' }}>{presentCount}</td>
                    <td style={{ color: '#dc2626', fontWeight: '700' }}>{absentCount}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${rate}%`, height: '100%', background: rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '12.5px', color: rate >= 75 ? '#059669' : rate >= 50 ? '#d97706' : '#dc2626' }}>
                          {rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>No students in this squad.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>PRN / LTC ID</th>
                <th>Student Name</th>
                <th>Squad</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(st => {
                const rec = records.find(r => r.student_id === st.id && r.schedule_id === activeSchedule.id)
                return (
                  <tr key={st.id}>
                    <td>
                      <code style={{ fontSize: '11.5px' }}>{st.prn || '—'}</code>
                    </td>
                    <td style={{ fontWeight: '600' }}>{st.name}</td>
                    <td>
                      {st.squad ? (
                        <span className="badge badge-blue" style={{ background: '#eff6ff', color: '#2563eb', fontWeight: '600' }}>{st.squad}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      {rec ? (
                        <span className="badge" style={{
                          background: rec.status === 'Present' ? '#d1fae5' : '#fee2e2',
                          color: rec.status === 'Present' ? '#065f46' : '#991b1b',
                          fontWeight: '750'
                        }}>
                          {rec.status}
                        </span>
                      ) : (
                        <span className="badge badge-gray" style={{ background: '#f1f5f9', color: '#64748b' }}>
                          Not Marked
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>No students in this squad.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Batch Detail View ────────────────────────────────────────────────────────
function BatchDetail({ batch, token, toast, onBack, onRefresh }) {
  const [tab, setTab] = useState('students')

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  const statusColor = { active: 'green', upcoming: 'blue', completed: 'gray', archived: 'gray' }[batch.status] || 'gray'

  return (
    <div className="batch-management-page animate-fade-in">
      <div className="batch-detail-header-wrapper">
        <button className="btn btn-outline btn-sm detail-header-back-btn" onClick={onBack}><ChevronLeft size={14} /> All Batches</button>
        
        <div className="detail-header-info">
          <div className="detail-title-row">
            <h2 className="detail-title-text">{batch.name}</h2>
            {batch.batch_code && <span className="badge badge-code">{batch.batch_code}</span>}
            <span className={`badge badge-${statusColor} status-${batch.status}`}>{batch.status}</span>
          </div>
          <div className="detail-meta-row">
            {batch.location && (
              <span className="detail-meta-item">
                <MapPin size={13} className="info-icon" />
                {batch.location}
              </span>
            )}
            {batch.start_date && (
              <span className="detail-meta-item">
                <Calendar size={13} className="info-icon" />
                {formatDate(batch.start_date)} &rarr; {formatDate(batch.end_date)}
              </span>
            )}
            {batch.year && (
              <span className="detail-meta-item">
                <strong>Year:</strong> {batch.year}
              </span>
            )}
          </div>
        </div>

        <div className="premium-detail-cards-row">
          {/* Card 1: Students */}
          <div className="premium-detail-card" onClick={() => {
            setTab('students');
            document.getElementById('batch-detail-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <span className="premium-detail-card-badge">
              Active
            </span>
            <h3 className="premium-detail-title">Students</h3>
            <p className="premium-detail-subtitle">Batch Enrollment Roster</p>
            
            <div className="premium-detail-details-row">
              <div className="premium-detail-item">
                <GraduationCap className="premium-detail-icon" size={14} />
                <span>{batch.student_count} Enrolled</span>
              </div>
              <div className="premium-detail-item">
                <Layers className="premium-detail-icon" size={14} />
                <span>Limit: {batch.capacity || '250'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
              <button className="premium-detail-btn-open" onClick={() => {
                setTab('students');
                document.getElementById('batch-detail-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Manage Students
              </button>
            </div>
          </div>

          {/* Card 2: Faculty */}
          <div className="premium-detail-card" onClick={() => {
            setTab('faculty');
            document.getElementById('batch-detail-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            <span className="premium-detail-card-badge green-badge">
              Assigned
            </span>
            <h3 className="premium-detail-title">Faculty</h3>
            <p className="premium-detail-subtitle">Batch Mentor Allocations</p>
            
            <div className="premium-detail-details-row">
              <div className="premium-detail-item">
                <Users className="premium-detail-icon" size={14} />
                <span>{batch.faculty_count} Allocated</span>
              </div>
              <div className="premium-detail-item">
                <Shield className="premium-detail-icon" size={14} />
                <span>Squad Ready</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
              <button className="premium-detail-btn-open" onClick={() => {
                setTab('faculty');
                document.getElementById('batch-detail-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Manage Faculty
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="batch-detail-tabs-section" className="tabs" style={{ marginBottom: 24 }}>
        {[
          { key: 'students', label: 'Students', icon: <GraduationCap size={13} /> },
          { key: 'faculty', label: 'Faculty', icon: <Users size={13} /> },
          { key: 'squads', label: 'Squad Allocation', icon: <Shield size={13} /> },
          { key: 'attendance', label: 'Attendance', icon: <ClipboardList size={13} /> },
        ].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        {tab === 'students' && <BatchStudentsTab batchId={batch.id} token={token} toast={toast} />}
        {tab === 'faculty' && <BatchFacultyTab batchId={batch.id} token={token} toast={toast} />}
        {tab === 'squads' && <SquadAllocationTab batchId={batch.id} token={token} toast={toast} />}
        {tab === 'attendance' && <BatchAttendanceTab batchId={batch.id} token={token} toast={toast} />}
      </div>
    </div>
  )
}

// ─── Main BatchManagement Component ──────────────────────────────────────────
export default function BatchManagementModule({ token, onBatchesChange }) {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editBatch, setEditBatch] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const { toasts, toast } = useToast()

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/batches`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setBatches(data.batches)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchBatches() }, [])

  const handleCreate = async (form) => {
    const res = await fetch(`${API}/api/admin/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    toast(data.message, res.ok ? 'success' : 'error')
    if (res.ok) {
      setShowCreate(false)
      fetchBatches()
      if (onBatchesChange) onBatchesChange()
    }
  }

  const handleEdit = async (form) => {
    const res = await fetch(`${API}/api/admin/batches/${editBatch.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    toast(data.message, res.ok ? 'success' : 'error')
    if (res.ok) {
      setEditBatch(null)
      fetchBatches()
      if (onBatchesChange) onBatchesChange()
    }
  }

  const handleDelete = async (batch) => {
    if (!window.confirm(`Delete "${batch.name}"? Student and faculty master records will NOT be deleted.`)) return
    const res = await fetch(`${API}/api/admin/batches/${batch.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    toast(data.message, res.ok ? 'success' : 'error')
    if (res.ok) {
      fetchBatches()
      if (onBatchesChange) onBatchesChange()
    }
  }

  const filtered = useMemo(() => batches.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !search || b.name.toLowerCase().includes(q) || (b.location || '').toLowerCase().includes(q) || (b.batch_code || '').toLowerCase().includes(q)
    const matchStatus = !filterStatus || b.status === filterStatus
    return matchSearch && matchStatus
  }), [batches, search, filterStatus])

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null

  const statusBadge = (s) => ({
    active: <span className="badge badge-blue status-active">Active</span>,
    upcoming: <span className="badge badge-blue status-upcoming">Upcoming</span>,
    completed: <span className="badge badge-gray status-completed">Completed</span>,
    archived: <span className="badge badge-gray status-archived">Archived</span>,
  }[s] || <span className="badge badge-gray">{s}</span>)

  if (selectedBatch) {
    return (
      <div className="batch-management-page">
        <BatchDetail
          batch={selectedBatch}
          token={token}
          toast={toast}
          onBack={() => {
            setSelectedBatch(null)
            fetchBatches()
            if (onBatchesChange) onBatchesChange()
          }}
          onRefresh={() => {
            fetchBatches()
            if (onBatchesChange) onBatchesChange()
          }}
        />
        <ToastContainer toasts={toasts} />
      </div>
    )
  }

  return (
    <div className="batch-management-page animate-fade-in">
      <style>{`
        .premium-batch-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .premium-batch-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 32px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        .premium-batch-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        .premium-batch-image-wrapper {
          position: relative;
          width: 100%;
          height: 180px;
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .premium-batch-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .premium-batch-card:hover .premium-batch-image {
          transform: scale(1.05);
        }

        .premium-batch-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.9);
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 750;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .premium-batch-badge.active {
          color: #2563eb;
        }
        .premium-batch-badge.upcoming {
          color: #2563eb;
        }
        .premium-batch-badge.completed {
          color: #64748b;
        }

        .premium-batch-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
          line-height: 1.25;
        }

        .premium-batch-subtitle {
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          margin: 0 0 16px 0;
        }

        .premium-batch-details-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          background: #f8fafc;
          padding: 10px 14px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }

        .premium-batch-detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #334155;
          font-weight: 700;
        }

        .premium-batch-detail-icon {
          color: #64748b;
        }

        .premium-batch-btn-open {
          flex: 1;
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: 50px;
          height: 48px;
          font-size: 14.5px;
          font-weight: 750;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }

        .premium-batch-btn-open:hover {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.25);
        }

        .premium-batch-btn-open:active {
          transform: translateY(0);
        }

        .premium-batch-btn-action {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .premium-batch-btn-action:hover {
          border-color: #cbd5e1;
          color: #0f172a;
          background: #f8fafc;
        }

        .premium-batch-btn-action.btn-del:hover {
          border-color: #e2e8f0;
          color: #0f172a;
          background: #fef2f2;
        }

        .premium-detail-cards-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 20px;
          margin-bottom: 24px;
        }

        .premium-detail-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 32px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          flex: 1;
          min-width: 280px;
        }

        .premium-detail-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        .premium-detail-card-badge {
          position: absolute;
          top: 18px;
          right: 20px;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .premium-detail-card-badge.green-badge {
          background: rgba(16, 185, 129, 0.1);
          color: #2563eb;
        }

        .premium-detail-title {
          font-size: 22px;
          font-weight: 850;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
          line-height: 1.25;
        }

        .premium-detail-subtitle {
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          margin: 0 0 20px 0;
        }

        .premium-detail-details-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          background: #f8fafc;
          padding: 10px 14px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }

        .premium-detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          color: #334155;
          font-weight: 700;
        }

        .premium-detail-icon {
          color: #64748b;
        }

        .premium-detail-btn-open {
          flex: 1;
          background: #0f172a;
          color: #ffffff;
          border: none;
          border-radius: 50px;
          height: 48px;
          font-size: 14.5px;
          font-weight: 750;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }

        .premium-detail-btn-open:hover {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.25);
        }

        .premium-detail-btn-open:active {
          transform: translateY(0);
        }

        .premium-detail-btn-action {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .premium-detail-btn-action:hover {
          border-color: #cbd5e1;
          color: #0f172a;
          background: #f8fafc;
        }
      `}</style>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Batch Management</h2>
          <p className="page-subtitle">Create and manage LTC batches, assign students and faculty, allocate squads</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" style={{ padding: '8px', position: 'relative' }} title="Notifications">
            <Bell size={14} />
            <span style={{ position: 'absolute', top: '2px', right: '2px', width: '5px', height: '5px', background: '#0f172a', borderRadius: '50%' }} />
          </button>
          <button className="btn btn-outline btn-sm" onClick={fetchBatches}><RefreshCw size={14} /></button>
          <button className="btn" onClick={() => setShowCreate(true)}><Plus size={16} /> New Batch</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Batches', value: batches.length, icon: <Layers size={20} />, iconBg: '#dbeafe', iconColor: '#2563eb', accentColor: '#2563eb' },
          { label: 'Active', value: batches.filter(b => b.status === 'active').length, icon: <CheckCircle size={20} />, iconBg: '#dcfce7', iconColor: '#2563eb', accentColor: '#2563eb' },
          { label: 'Upcoming', value: batches.filter(b => b.status === 'upcoming').length, icon: <Calendar size={20} />, iconBg: '#eff6ff', iconColor: '#3b82f6', accentColor: '#3b82f6' },
          { label: 'Total Students Enrolled', value: batches.reduce((a, b) => a + parseInt(b.student_count || 0), 0), icon: <GraduationCap size={20} />, iconBg: '#eff6ff', iconColor: '#2563eb', accentColor: '#2563eb' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-body-wrapper">
              <div className="stat-card-info">
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-label">{s.label}</div>
              </div>
              <div className="stat-card-icon-container" style={{ background: s.iconBg, color: s.iconColor }}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrapper" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          <Search className="search-icon" size={16} />
          <input className="input-field" placeholder="Search batches…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 0 }} />
        </div>
        <select className="input-field input-field-rect" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ marginBottom: 0, width: 'auto', minWidth: 140, borderRadius: 50, fontSize: 13 }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /><p>Loading batches…</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <GraduationCap size={48} />
          <h3>No batches found</h3>
          <p>Create your first LTC batch to get started. Students and faculty can then be added from the master database.</p>
          <button className="btn" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}><Plus size={16} /> Create Batch</button>
        </div>
      ) : (
        <div className="premium-batch-grid">
          {filtered.map(b => {
            const statusClass = b.status === 'active' ? 'active' : b.status === 'upcoming' ? 'upcoming' : 'completed';
            return (
              <div key={b.id} className="premium-batch-card" onClick={() => setSelectedBatch(b)}>
                <div className="premium-batch-image-wrapper">
                  <img src={getBatchImage(b.id)} alt={b.name} className="premium-batch-image" />
                  <span className={`premium-batch-badge ${statusClass}`}>
                    {b.status}
                  </span>
                </div>

                <h3 className="premium-batch-title">{b.name}</h3>
                <p className="premium-batch-subtitle">
                  {b.batch_code || 'LTC-BATCH'} {b.location ? `• ${b.location}` : ''}
                </p>

                <div className="premium-batch-details-row">
                  <div className="premium-batch-detail-item">
                    <Calendar className="premium-batch-detail-icon" size={14} />
                    <span>Year {b.year || '—'}</span>
                  </div>
                  <div className="premium-batch-detail-item">
                    <GraduationCap className="premium-batch-detail-icon" size={14} />
                    <span>{b.student_count} / {b.capacity || '250'} Enrolled</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }} onClick={e => e.stopPropagation()}>
                  <button className="premium-batch-btn-open" onClick={() => setSelectedBatch(b)}>
                    Open Batch
                  </button>
                  <button className="premium-batch-btn-action" onClick={() => setEditBatch({ ...b, start_date: b.start_date?.split('T')[0], end_date: b.end_date?.split('T')[0] })} title="Edit Batch">
                    <Edit2 size={16} />
                  </button>
                  <button className="premium-batch-btn-action btn-del" onClick={() => handleDelete(b)} title="Delete Batch">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BatchFormModal open={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreate} />
      <BatchFormModal open={!!editBatch} onClose={() => setEditBatch(null)} onSave={handleEdit} initial={editBatch} />

      <ToastContainer toasts={toasts} />
    </div>
  )
}
