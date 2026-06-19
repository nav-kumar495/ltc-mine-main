import React, { useState, useMemo } from 'react'
import { Plus, Search, Trash2, RefreshCw, GraduationCap, Bell } from 'lucide-react'

export default function StudentsModule({
  users,
  students,
  studentPg,
  studentSearch,
  setStudentSearch,
  selectedSchool,
  setSelectedSchool,
  selectedDepartment,
  setSelectedDepartment,
  selectedDivision,
  setSelectedDivision,
  selectedPanel,
  setSelectedPanel,
  availableSchools,
  availableDepartments,
  availableDivisions,
  availablePanels,
  setIsStudentModalOpen,
  handleUpdatePanel,
  handleUpdateInsurance,
  handleToggleStudentBatch,
  handleViewFeedback,
  handleDeleteUser,
  fetchUsers,
  PaginationBar,
  hideTitle = false
}) {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        {!hideTitle && (
          <div className="page-header-left">
            <h2 className="page-title">Student Database</h2>
            <p className="page-subtitle">{students.length} students found · Directory</p>
          </div>
        )}
        <div className="page-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn btn-outline btn-sm" style={{ padding: '8px', position: 'relative' }} title="Notifications">
            <Bell size={14} />
            <span style={{ position: 'absolute', top: '2px', right: '2px', width: '5px', height: '5px', background: '#0f172a', borderRadius: '50%' }} />
          </button>
          <button className="btn btn-outline btn-sm" onClick={fetchUsers}>
            <RefreshCw size={14} />
          </button>
          <button className="btn" onClick={() => setIsStudentModalOpen(true)}>
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      <div className="glass-card">
        <div className="students-filters-row">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              className="input-field"
              placeholder="Search name, email, PRN…"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <select
            className="input-field filter-select"
            value={selectedSchool}
            onChange={e => {
              setSelectedSchool(e.target.value)
              setSelectedDepartment('')
              setSelectedDivision('')
            }}
          >
            <option value="">All Schools</option>
            {availableSchools.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="input-field filter-select"
            value={selectedDepartment}
            onChange={e => {
              setSelectedDepartment(e.target.value)
              setSelectedDivision('')
            }}
          >
            <option value="">All Depts</option>
            {availableDepartments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            className="input-field filter-select panel-select"
            value={selectedPanel}
            onChange={e => setSelectedPanel(e.target.value)}
          >
            <option value="">All Panels</option>
            {availablePanels.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {studentPg.paginated.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={36} style={{ color: 'var(--text-4)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-3)', fontSize: '14.5px', fontWeight: '600', margin: 0 }}>No students found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>PRN / LTC ID</th>
                  <th>Email</th>
                  <th>School / Dept</th>
                  <th>Panel</th>
                  <th>NRI</th>
                  <th>Insured</th>
                  <th>Undertaking</th>
                  <th>Legacy Batch</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentPg.paginated.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{u.name}</div>
                      {u.red_flag && (
                        <span className="badge badge-black" style={{ marginTop: 3 }}>🚩 Flagged</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <code style={{ fontSize: 12 }}>{u.prn || '—'}</code>
                        {u.ltc_id && (
                          <span
                            className="badge badge-blue"
                            style={{
                              fontSize: 10,
                              alignSelf: 'flex-start',
                              background: 'var(--primary-bg)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(37, 99, 235, 0.2)'
                            }}
                          >
                            LTC ID: {u.ltc_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{u.email}</td>
                    <td style={{ fontSize: 12.5 }}>
                      <div style={{ fontWeight: 600 }}>{u.school || '—'}</div>
                      <div style={{ color: 'var(--text-4)', fontSize: 11.5 }}>{u.department}</div>
                    </td>
                    <td>
                      <select
                        value={u.panel || ''}
                        onChange={e => handleUpdatePanel(u.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1.5px solid var(--border)',
                          fontSize: 12,
                          background: 'white'
                        }}
                      >
                        <option value="">None</option>
                        {['PA', 'PB', 'PC', 'PD', 'ALL'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {u.nri ? (
                        <span className="badge badge-nri">NRI</span>
                      ) : (
                        <span style={{ color: 'var(--text-4)', fontSize: 12 }}>Regular</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={u.insured ? 'true' : 'false'}
                        onChange={e => handleUpdateInsurance(u.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1.5px solid var(--border)',
                          fontSize: 12,
                          background: 'white'
                        }}
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </td>
                    <td>
                      {u.undertaking_submitted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ Signed
                          </span>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>LTC Student Undertaking Proof - ${u.name}</title>
                                    <style>
                                      body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; background: #ffffff; }
                                      .document { border: 2px solid #0f172a; border-radius: 16px; padding: 40px; max-width: 700px; margin: 0 auto; background: #ffffff; }
                                      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
                                      h2 { font-size: 22px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                                      .subtitle { font-size: 13px; color: #64748b; margin-top: 6px; }
                                      .receipt { display: flex; flex-direction: column; align-items: center; gap: 20px; text-align: center; padding: 20px; }
                                      .checkmark { font-size: 24px; color: #2563eb; font-weight: bold; }
                                      .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: left; width: 100%; margin-top: 20px; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 12px; background: #f8fafc; }
                                      .label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; }
                                      .value { font-size: 14px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0; }
                                      .sig { font-family: Georgia, serif; font-style: italic; font-size: 16px; }
                                      .code-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 13.5px; color: #334155; line-height: 1.6; text-align: left; margin-bottom: 20px; }
                                      ol { margin: 0; padding-left: 20px; }
                                      li { margin-bottom: 8px; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="document">
                                      <div class="header">
                                        <h2>LTC Student Undertaking Proof</h2>
                                        <div class="subtitle">Official Participant Immersion Agreement</div>
                                      </div>
                                      
                                      <div class="code-box">
                                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #0f172a;">LTC Honor Code & Conduct Policy</p>
                                        <p style="margin: 0 0 10px 0;">As a student representing my institution and participating in the Life Transformation Centre (LTC) program, I solemnly declare that:</p>
                                        <ol>
                                          <li>I will adhere to all instruction timings, discipline guidelines, and code of conduct set by the LTC administration.</li>
                                          <li>I will cooperate with my teammates, squad leader, and assigned faculty to complete all required projects.</li>
                                          <li>I will perform all tasks with integrity and honesty, and avoid any plagiarism or misconduct.</li>
                                          <li>I understand that violating any policy may lead to disciplinary actions and cancellation of my LTC credentials.</li>
                                        </ol>
                                      </div>

                                      <div class="receipt">
                                        <div class="checkmark">✓ SIGNED UNDERTAKING RECORD</div>
                                        <div class="details-grid">
                                          <div>
                                            <div class="label">Signed Signature</div>
                                            <div class="value sig">${u.undertaking_signed_name || ''}</div>
                                          </div>
                                          <div>
                                            <div class="label">PRN / LTC ID</div>
                                            <div class="value">${u.prn || ''}</div>
                                          </div>
                                          <div>
                                            <div class="label">Submission Date</div>
                                            <div class="value">${u.undertaking_signed_date || ''}</div>
                                          </div>
                                          <div>
                                            <div class="label">Verification Status</div>
                                            <div class="value" style="color: #2563eb;">Verified Record</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <script>
                                      window.onload = function() {
                                        window.print();
                                        setTimeout(() => { window.close(); }, 500);
                                      }
                                    </script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }}
                            style={{
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: '650',
                              borderRadius: '4px',
                              border: '1.5px solid var(--primary)',
                              color: 'var(--primary)',
                              background: 'transparent',
                              cursor: 'pointer',
                              marginTop: '2px',
                              alignSelf: 'stretch',
                              textAlign: 'center'
                            }}
                          >
                            Print Proof
                          </button>
                        </div>
                      ) : (
                        <span className="badge badge-black" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ⚠️ Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={!!u.in_current_batch}
                          onChange={e => handleToggleStudentBatch(u.id, e.target.checked)}
                        />
                        <span style={{ color: u.in_current_batch ? 'var(--primary)' : 'var(--text-4)' }}>
                          {u.in_current_batch ? 'In Batch' : 'No'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleViewFeedback(u.id, u.name)}>
                          Feedback
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                          onClick={() => handleDeleteUser(u.id, 'student')}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar
          page={studentPg.page}
          totalPages={studentPg.totalPages}
          total={studentPg.total}
          setPage={p => studentPg.setPage(p)}
        />
      </div>
    </div>
  )
}
