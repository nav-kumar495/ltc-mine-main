import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Calendar, CheckSquare, FileText, Activity, LayoutDashboard, ClipboardList, PenTool, Search, LogOut, MessageSquare, Users, Bell, Menu, Clock, RefreshCw, X, Compass, Award, MapPin, BookOpen, User, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import ScrollToTop from './ScrollToTop'
import TimetablePanel from './TimetablePanel'


export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [students, setStudents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [documents, setDocuments] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [facultyInfo, setFacultyInfo] = useState(null)
  const [squadLeader, setSquadLeader] = useState(null)
  const [squadStudents, setSquadStudents] = useState([])
  const [batchFaculty, setBatchFaculty] = useState([])

  const [scheduleForm, setScheduleForm] = useState({ title: '', date: '', time: '', panel: 'PA' })
  const [evalForm, setEvalForm] = useState({ student_id: '', schedule_id: '', marks: '', remarks: '', marking_scheme: '' })
  const [evalSubmitting, setEvalSubmitting] = useState(false)
  const [submittingStudentId, setSubmittingStudentId] = useState(null)
  const [selectedMarkings, setSelectedMarkings] = useState({}) // pending selection per studentId
  const [savedEvals, setSavedEvals] = useState({})             // confirmed saved per studentId
  const [allEvaluations, setAllEvaluations] = useState([])     // all fetched evaluations
  const [studentSearch, setStudentSearch] = useState('')
  const [activeCardModal, setActiveCardModal] = useState(null)
  const [undertakingFilter, setUndertakingFilter] = useState('all')
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('General')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [undertakingForm, setUndertakingForm] = useState({
    signedName: '',
    signedDate: new Date().toISOString().split('T')[0]
  })
  const [submittingUndertaking, setSubmittingUndertaking] = useState(false)

  const [readDocumentIds, setReadDocumentIds] = useState(() => {
    return JSON.parse(localStorage.getItem('readDocumentIds') || '[]')
  })
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [selectedEvalScheduleId, setSelectedEvalScheduleId] = useState('')
  const [selectedEvalStudent, setSelectedEvalStudent] = useState(null)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebar_collapsed') === 'true')

  const toggleSidebarCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar_collapsed', String(newState))
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const unreadDocuments = useMemo(() => documents.filter(d => !readDocumentIds.includes(d.id)), [documents, readDocumentIds])
  const unreadCount = useMemo(() => unreadDocuments.length, [unreadDocuments])

  const markAsRead = (id) => {
    const updated = [...readDocumentIds, id]
    setReadDocumentIds(updated)
    localStorage.setItem('readDocumentIds', JSON.stringify(updated))
  }

  const markAllAsRead = () => {
    const allIds = documents.map(d => d.id)
    setReadDocumentIds(allIds)
    localStorage.setItem('readDocumentIds', JSON.stringify(allIds))
  }

  const renderNotifications = () => (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-outline" style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsNotifOpen(!isNotifOpen)}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px' }}>
            {unreadCount}
          </span>
        )}
      </button>
      {isNotifOpen && (
        <div style={{ position: 'absolute', top: '45px', right: '0', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '320px', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {documents.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No documents available.
              </div>
            ) : (
              documents.map(d => {
                const isRead = readDocumentIds.includes(d.id)
                return (
                  <div
                    key={d.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      background: isRead ? 'transparent' : '#f8fafc',
                      position: 'relative'
                    }}
                  >
                    {!isRead && (
                      <div style={{ width: '8px', height: '8px', background: '#2563eb', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }}></div>
                    )}
                    <div style={{ flex: 1, paddingLeft: isRead ? '20px' : '0' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' }}>{d.name}</p>
                      <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}>View Document</a>
                    </div>
                    {!isRead && (
                      <button
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => markAsRead(d.id)}
                      >
                        Read
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (s.panel && s.panel.toLowerCase().includes(studentSearch.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      if (undertakingFilter === 'submitted') {
        return s.undertaking_submitted === true;
      }
      if (undertakingFilter === 'pending') {
        return !s.undertaking_submitted;
      }
      return true;
    });
  }, [students, studentSearch, undertakingFilter])

  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const isPrimary = currentUser.is_primary === true || currentUser.is_primary === 'true'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!feedbackText.trim()) return alert('Please enter feedback.')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          feedback_text: feedbackText,
          category: feedbackCategory,
          additional_notes: additionalNotes
        })
      })
      if (res.ok) {
        alert('Feedback submitted successfully!')
        setFeedbackText('')
        setFeedbackCategory('General')
        setAdditionalNotes('')
      }
    } catch (err) {
      alert('Failed to submit feedback.')
    }
  }

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'faculty') {
      navigate('/login')
      return
    }
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (selectedEvalScheduleId && allEvaluations.length > 0) {
      const currentSchedEvals = allEvaluations.filter(e => String(e.schedule_id) === String(selectedEvalScheduleId));
      const newSaved = {};
      currentSchedEvals.forEach(e => {
        newSaved[e.student_id] = e.marking_scheme;
      });
      setSavedEvals(newSaved);
    } else {
      setSavedEvals({});
    }
  }, [selectedEvalScheduleId, allEvaluations]);

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { 'Authorization': `Bearer ${token}`, ...(options.headers || {}) }
    })
    if (res.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/')
      return null
    }
    return res
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch assigned students
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/dashboard`)
      if (!res) return
      if (res.ok) {
        const data = await res.json()
        setStudents(data.data || [])
        setFacultyInfo(data.facultyInfo || null)
        setSquadLeader(data.squadLeader || null)
        setSquadStudents(data.squadStudents || [])
        setBatchFaculty(data.batchFaculty || [])
      }

      // Fetch Schedules
      const schedRes = await apiFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/schedules`)
      if (!schedRes) return
      const schedData = await schedRes.json()
      if (schedRes.ok) setSchedules(schedData.schedules || [])

      // Fetch docs
      const docRes = await apiFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/documents`)
      if (!docRes) return
      const docData = await docRes.json()
      if (docRes.ok) setDocuments(docData.documents || [])

      // Fetch attendance
      const attRes = await apiFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/attendance_records`)
      if (!attRes) return
      const attData = await attRes.json()
      if (attRes.ok) setAttendanceRecords(attData.records || [])

      // Fetch evaluations
      const evalRes = await apiFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/evaluations`)
      if (!evalRes) return
      const evalData = await evalRes.json()
      if (evalRes.ok) setAllEvaluations(evalData.evaluations || [])

    } catch (err) {
      console.error('Failed to fetch faculty data', err)
    }
  }

  // Primary Actions
  const handleAssignPanel = async (student_id, panel) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/assign-panel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id, panel })
      })
      if (res.ok) {
        alert('Panel updated successfully')
        fetchDashboardData()
      }
    } catch (err) { }
  }

  const handleCreateSchedule = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(scheduleForm)
      })
      if (res.ok) {
        alert('Schedule created')
        setScheduleForm({ title: '', date: '', time: '', panel: 'PA' })
        fetchDashboardData()
      }
    } catch (err) { }
  }

  const handleGenerate7DaySchedule = async () => {
    if (!scheduleForm.date || !scheduleForm.time) {
      alert("Please select a start date and time first.");
      return;
    }

    const startDate = new Date(scheduleForm.date);

    try {
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];

        let title = '';
        if (i < 3) {
          title = `RUIP - Day ${i + 1}`;
        } else {
          title = `LTC - Day ${i - 2}`;
        }

        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            title,
            date: dateString,
            time: scheduleForm.time,
            panel: scheduleForm.panel
          })
        });
      }

      alert('7-Day Schedule successfully generated.');
      setScheduleForm({ title: '', date: '', time: '', panel: 'PA' });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error generating 7-day schedule');
    }
  }

  const handleMarkAttendance = async (student_id, schedule_id, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ schedule_id, student_id, status })
      })
      if (res.ok) {
        fetchDashboardData()
      }
    } catch (err) { }
  }

  const handleMarkAllPresent = async () => {
    if (!selectedScheduleId) {
      alert('Please select an activity first.')
      return
    }

    const selectedSchedule = schedules.find(s => s.id === parseInt(selectedScheduleId))
    if (!selectedSchedule) return

    const unmarked = []
    filteredStudents.forEach(st => {
      if (selectedSchedule) {
        const existingRecord = attendanceRecords.find(a => a.student_id === st.id && a.schedule_id === selectedSchedule.id)
        if (!existingRecord) {
          unmarked.push({ student_id: st.id, schedule_id: selectedSchedule.id })
        }
      }
    })

    if (unmarked.length === 0) {
      alert('All students are already marked for this activity.')
      return
    }

    if (!window.confirm(`Mark ${unmarked.length} students as Present for "${selectedSchedule.title}"?`)) return

    for (const item of unmarked) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ student_id: item.student_id, schedule_id: item.schedule_id, status: 'Present' })
        })
      } catch (err) { }
    }
    fetchDashboardData()
  }

  const handleToggleRedFlag = async (studentId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/toggle-red-flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_id: studentId })
      })
      const data = await res.json()
      if (res.ok) {
        setStudents(students.map(s => s.id === studentId ? { ...s, red_flag: data.red_flag } : s))
      } else {
        alert(data.message || 'Failed to toggle red flag')
      }
    } catch (err) {
      alert('Failed to toggle red flag')
    }
  }

  // Evaluation — save all pending
  const handleEvaluate = async () => {
    const studentIds = Object.keys(selectedMarkings).filter(id => selectedMarkings[id] && !savedEvals[id]);
    if (studentIds.length === 0) return;

    setEvalSubmitting(true);
    try {
      for (const studentId of studentIds) {
        const scheme = selectedMarkings[studentId];
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            student_id: studentId,
            schedule_id: selectedEvalScheduleId,
            marking_scheme: scheme,
            marks: scheme === 'fully_done' ? 100 : scheme === 'partially_done' ? 50 : 0,
            remarks: scheme === 'fully_done' ? 'Fully completed' : scheme === 'partially_done' ? 'Partially completed' : 'Not done'
          })
        });
      }

      // Refresh evaluations
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/evaluations`);
      if (res && res.ok) {
        const data = await res.json();
        setAllEvaluations(data.evaluations || []);
        setSelectedMarkings({}); // Clear pending
        alert('Evaluations saved and locked.');
      }
    } catch (err) {
      console.error('Evaluation failed', err);
      alert('Failed to save evaluations.');
    } finally {
      setEvalSubmitting(false);
    }
  };

  const handleSubmitUndertaking = async (e) => {
    e.preventDefault()
    if (!undertakingForm.signedName.trim()) return alert('Please type your full name to sign the undertaking.')
    setSubmittingUndertaking(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/faculty/submit-undertaking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(undertakingForm)
      })
      if (res.ok) {
        alert('Undertaking signed and submitted successfully!')
        fetchDashboardData()
      } else {
        alert('Failed to submit undertaking.')
      }
    } catch (err) {
      alert('Error submitting undertaking.')
    } finally {
      setSubmittingUndertaking(false)
    }
  }

  const handlePrintUndertaking = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>LTC Faculty Undertaking</title>
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
              <h2>LTC Faculty Undertaking</h2>
              <div class="subtitle">Official Immersion Honor Code & Agreement</div>
            </div>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #0f172a;">LTC Honor Code & Conduct Policy</p>
              <p style="margin: 0 0 10px 0;">As a faculty representing my institution and participating in the Life Transformation Centre (LTC) program, I solemnly declare that:</p>
              <ol>
                <li>I will actively mentor and guide my assigned squad members, helping them achieve all project and evaluation milestones.</li>
                <li>I will attend and evaluate scheduled sessions on time and grade students fairly according to the rubric.</li>
                <li>I will maintain high standards of professionalism and follow the official guidelines set by the LTC administration.</li>
                <li>I understand that my role as a faculty member is crucial for the transformation of my squad students.</li>
              </ol>
            </div>

            <div class="receipt">
              <div class="checkmark">✓ SIGNED UNDERTAKING RECORD</div>
              <div class="details-grid">
                <div>
                  <div class="label">Signed Signature</div>
                  <div class="value sig">\${facultyInfo?.undertaking_signed_name || ''}</div>
                </div>
                <div>
                  <div class="label">Department</div>
                  <div class="value">\${facultyInfo?.department || ''}</div>
                </div>
                <div>
                  <div class="label">Submission Date</div>
                  <div class="value">\${facultyInfo?.undertaking_signed_date || ''}</div>
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
  }

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Sidebar Navigation */}
      {isMobile && isSidebarOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className={`sidebar ${!isMobile && isCollapsed ? 'collapsed' : ''}`} style={{
        position: isMobile ? 'fixed' : 'sticky',
        top: 0, left: 0, bottom: 0, zIndex: 1000,
        transform: isMobile && !isSidebarOpen ? 'translateX(-100%)' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100vh',
        paddingTop: isMobile ? 'env(safe-area-inset-top)' : '0px',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-container">
            <img src="/ltc.png" alt="LTC Logo" className="sidebar-brand-logo" />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">LTC Portal</span>
              <span className="sidebar-brand-subtitle">Faculty Space</span>
            </div>
          </div>
          {isMobile ? (
            <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Close Sidebar">
              <X size={14} />
            </button>
          ) : (
            <button
              className="sidebar-collapse-toggle"
              onClick={toggleSidebarCollapse}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', padding: '8px 12px 0', display: 'block' }}>faculty</span>
          
          <p className="sidebar-section-label" style={{ paddingTop: '8px' }}>Overview</p>
          <button className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); if (isMobile) setIsSidebarOpen(false); }}>
            <span className="sidebar-item-content">
              <GraduationCap size={16} />
              <span>My Overview</span>
            </span>
          </button>
          <button className={`sidebar-item ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => { setActiveTab('timetable'); if (isMobile) setIsSidebarOpen(false); }}>
            <span className="sidebar-item-content">
              <Clock size={16} />
              <span>Immersion Timetable</span>
            </span>
          </button>

          <p className="sidebar-section-label">Performance</p>
          <button className={`sidebar-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); if (isMobile) setIsSidebarOpen(false); }}>
            <span className="sidebar-item-content">
              <ClipboardList size={16} />
              <span>My Attendance</span>
            </span>
          </button>
          <button className={`sidebar-item ${activeTab === 'evaluate' ? 'active' : ''}`} onClick={() => { setActiveTab('evaluate'); if (isMobile) setIsSidebarOpen(false); }}>
            <span className="sidebar-item-content">
              <PenTool size={16} />
              <span>Evaluations & Marks</span>
            </span>
          </button>

          <p className="sidebar-section-label">Support</p>
          <button className={`sidebar-item ${activeTab === 'guidelines' ? 'active' : ''}`} onClick={() => { setActiveTab('guidelines'); if (isMobile) setIsSidebarOpen(false); }}>
            <span className="sidebar-item-content">
              <FileText size={16} />
              <span>Docs & Guidelines</span>
            </span>
            {unreadCount > 0 && (
              <span className="sidebar-badge">{unreadCount}</span>
            )}
          </button>
          <button className={`sidebar-item ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => { setActiveTab('feedback'); if (isMobile) setIsSidebarOpen(false); }}>
            <span className="sidebar-item-content">
              <MessageSquare size={16} />
              <span>Submit Feedback</span>
            </span>
          </button>
          <button className={`sidebar-item ${activeTab === 'undertaking' ? 'active' : ''}`} onClick={() => { setActiveTab('undertaking'); if (isMobile) setIsSidebarOpen(false); }}>
            <span className="sidebar-item-content">
              <FileText size={16} />
              <span>Undertaking Form</span>
            </span>
            {!facultyInfo?.undertaking_submitted && (
              <span className="sidebar-badge" style={{ background: '#0f172a', color: '#ffffff' }}>Pending</span>
            )}
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'FC'}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{currentUser?.name || 'Faculty Member'}</span>
              <span className="sidebar-user-role">{isPrimary ? 'Primary Faculty' : 'Secondary Faculty'}</span>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign Out" aria-label="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ flex: 1, padding: isMobile ? 'calc(10px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom))' : '30px' }}>
        {!facultyInfo?.undertaking_submitted && (
          <div style={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1d4ed8 100%)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '20px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Action Required: Your official LTC Faculty Undertaking is pending! Please sign it immediately.
            </span>
            <button 
              onClick={() => setActiveTab('undertaking')} 
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap'
              }}
            >
              Sign Now
            </button>
          </div>
        )}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', background: 'white', padding: '10px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => setIsSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <h1 style={{ fontSize: '18px', margin: 0 }}>Faculty Portal</h1>
            </div>
            {renderNotifications()}
          </div>
        )}
        {activeTab !== 'dashboard' && (
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {!isMobile && renderNotifications()}
            </div>
          </div>
        )}


        {activeTab === 'timetable' && (
          <TimetablePanel />
        )}

        {activeTab === 'dashboard' && (() => {
          // Compute undertaking & feedback stats
          const totalStudents = students.length
          const undertakingSubmitted = students.filter(s => s.undertaking_submitted).length
          const undertakingPending = totalStudents - undertakingSubmitted
          const undertakingPct = totalStudents > 0 ? Math.round((undertakingSubmitted / totalStudents) * 100) : 0

          const feedbackSubmitted = new Set(allEvaluations.map(e => e.student_id)).size
          const feedbackPending = Math.max(0, totalStudents - feedbackSubmitted)
          const feedbackPct = totalStudents > 0 ? Math.round((feedbackSubmitted / totalStudents) * 100) : 0

          // greeting
          const hours = new Date().getHours()
          const facultyName = facultyInfo?.name || currentUser?.name || 'Faculty'
          const firstName = facultyName.split(' ')[0]
          let greetingText = ''
          if (hours < 12) greetingText = `Good Morning, ${firstName}! 🌅`
          else if (hours < 18) greetingText = `Good Afternoon, ${firstName}! 👋`
          else greetingText = `Good Evening, ${firstName}! 🌙`

          const FACULTY_SCHEDULE = [
            { time: '09:00 AM', event: 'Meditation Session', location: 'Hall 1', iconName: 'compass' },
            { time: '11:00 AM', event: 'Immersion Program', location: 'Batch 12', iconName: 'award' },
            { time: '02:00 PM', event: 'Faculty Meeting', location: 'Conference Room', iconName: 'users' },
            { time: '04:00 PM', event: 'Review & Feedback', location: 'Admin Office', iconName: 'activity' },
          ]

          const getIcon = (name) => {
            if (name === 'compass') return <Compass size={14} />
            if (name === 'award') return <Award size={14} />
            if (name === 'users') return <Users size={14} />
            return <Activity size={14} />
          }

          // SVG circle chart helper
          const CircleChart = ({ pct, color, label, count, subtitle }) => {
            const r = 45
            const circ = 2 * Math.PI * r
            const dash = (pct / 100) * circ
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{ position: 'relative', width: 90, height: 90 }}>
                  <svg width="90" height="90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r={r} fill="none"
                      stroke={color} strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${circ}`}
                      strokeDashoffset={circ / 4}
                      transform="rotate(0 50 50)"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: 1 }}>{totalStudents > 0 ? `${pct}%` : count}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{subtitle}</div>
                </div>
              </div>
            )
          }

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">

            {/* ── Overview Info Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {/* Faculty Profile */}
              <div className="faculty-overview-card" style={{ cursor: 'pointer' }} onClick={() => setActiveCardModal('profile')}>
                <div className="faculty-overview-icon" style={{ background: '#dbeafe' }}>
                  <User size={20} style={{ color: '#2563eb' }} fill="currentColor" />
                </div>
                <div className="faculty-overview-content">
                  <div className="faculty-overview-title">Faculty Profile</div>
                  <div className="faculty-overview-value">{facultyInfo?.name || currentUser.name}</div>
                </div>
              </div>

              {/* Allocated Squad */}
              <div className="faculty-overview-card" style={{ cursor: 'pointer' }} onClick={() => setActiveCardModal('squad')}>
                <div className="faculty-overview-icon" style={{ background: '#eff6ff' }}>
                  <Users size={20} style={{ color: '#1d4ed8' }} fill="currentColor" />
                </div>
                <div className="faculty-overview-content">
                  <div className="faculty-overview-title">Allocated Squad</div>
                  <div className="faculty-overview-value">{facultyInfo?.squad || 'Not Assigned'}</div>
                </div>
              </div>

              {/* Squad Leader */}
              <div className="faculty-overview-card" style={{ cursor: 'pointer' }} onClick={() => setActiveCardModal('leader')}>
                <div className="faculty-overview-icon" style={{ background: '#eff6ff' }}>
                  <GraduationCap size={20} style={{ color: '#1e40af' }} fill="currentColor" />
                </div>
                <div className="faculty-overview-content">
                  <div className="faculty-overview-title">Squad Leader</div>
                  <div className="faculty-overview-value">{squadLeader ? squadLeader.name : 'Not Assigned'}</div>
                </div>
              </div>

              {/* Faculty Colleagues */}
              <div className="faculty-overview-card" style={{ cursor: 'pointer' }} onClick={() => setActiveCardModal('colleagues')}>
                <div className="faculty-overview-icon" style={{ background: '#eff6ff' }}>
                  <Users size={20} style={{ color: '#2563eb' }} fill="currentColor" />
                </div>
                <div className="faculty-overview-content">
                  <div className="faculty-overview-title">Colleagues</div>
                  <div className="faculty-overview-value">
                    {(() => {
                      const others = batchFaculty.filter(f => f.id !== (facultyInfo?.id || currentUser?.id));
                      if (others.length === 1) return others[0].name;
                      return `${others.length} Members`;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Today's Sessions + Charts Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '20px' }}>

              {/* My Squad Metrics & Alerts */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} style={{ color: '#2563eb' }} /> Squad Health & Alerts
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                    Squad: {facultyInfo?.squad || 'None'}
                  </span>
                </div>

                {/* Insurance Compliance Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Insurance Uploads</span>
                    <span style={{ fontSize: '12px', fontWeight: '750', color: '#0f172a' }}>
                      {students.filter(s => s.insured).length} / {students.length} ({students.length > 0 ? Math.round((students.filter(s => s.insured).length / students.length) * 100) : 0}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#eff6ff', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: '#2563eb',
                      borderRadius: '3px',
                      width: `${students.length > 0 ? Math.round((students.filter(s => s.insured).length / students.length) * 100) : 0}%`,
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                </div>

                {/* Average Marks Display */}
                <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '755', color: '#2563eb', textTransform: 'uppercase', display: 'block' }}>Average Marks</span>
                    <span style={{ fontSize: '11px', color: '#1e40af', display: 'block', marginTop: '2px' }}>Across evaluations</span>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: '850', color: '#2563eb' }}>
                    {(() => {
                      const studentIds = students.map(s => s.id);
                      const evals = allEvaluations.filter(e => studentIds.includes(e.student_id));
                      return evals.length > 0 ? Math.round(evals.reduce((sum, current) => sum + (current.marks || 0), 0) / evals.length) : 0;
                    })()}
                  </span>
                </div>

                {/* Urgent Compliance Nudges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠️ Action Required: Missing Undertakings
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '90px', overflowY: 'auto' }}>
                    {students.filter(s => !s.undertaking_submitted).length === 0 ? (
                      <span style={{ fontSize: '12px', color: '#10b981', fontStyle: 'italic' }}>All students have submitted undertaking!</span>
                    ) : (
                      students.filter(s => !s.undertaking_submitted).slice(0, 3).map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff5f5', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fee2e2' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#b91c1c' }}>{s.name}</span>
                          <span style={{ fontSize: '10px', color: '#b91c1c', fontWeight: '650', background: '#fee2e2', padding: '1px 5px', borderRadius: '4px' }}>Nudge Student</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Undertaking Form Submitted */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckSquare size={16} style={{ color: '#1d4ed8' }} /> Undertaking Form
                  </h3>
                  <button onClick={() => setActiveTab('nri')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>View Students →</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                  <CircleChart
                    pct={undertakingPct}
                    color="#1d4ed8"
                    label="Undertaking Submitted"
                    count={undertakingSubmitted}
                    subtitle="Today"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '2px' }}>Submitted</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d4ed8' }}>{undertakingSubmitted}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '2px' }}>Pending</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{undertakingPending}</div>
                  </div>
                </div>
              </div>

              {/* Feedback Form Submitted */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} style={{ color: '#2563eb' }} /> Feedback Form
                  </h3>
                  <button onClick={() => setActiveTab('feedback')} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>View Feedback →</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                  <CircleChart
                    pct={feedbackPct}
                    color="#2563eb"
                    label="Feedback Submitted"
                    count={feedbackSubmitted}
                    subtitle="This Month"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '2px' }}>Submitted</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb' }}>{feedbackSubmitted}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '2px' }}>Pending</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{feedbackPending}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Active Students Table Card */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <GraduationCap className="text-primary" /> Active Students
                </h2>
                <button className="btn btn-outline btn-sm" onClick={fetchDashboardData}>
                  <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh Data
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row' }}>
                <div className="search-wrapper" style={{ flex: 1, margin: 0 }}>
                  <Search className="search-icon" size={20} />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="input-field"
                    style={{ margin: 0 }}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <div style={{ minWidth: '220px' }}>
                  <select
                    className="input-field"
                    style={{ margin: 0, height: '100%', cursor: 'pointer', outline: 'none' }}
                    value={undertakingFilter}
                    onChange={(e) => setUndertakingFilter(e.target.value)}
                  >
                    <option value="all">All Undertaking Status</option>
                    <option value="submitted">Undertaking Submitted</option>
                    <option value="pending">Undertaking Pending</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>PRN / LTC ID</th><th>Name</th><th>Email</th><th>Type</th><th>Undertaking</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredStudents.map(s => {
                      const isNri = s.nri === true || s.nri === 1 || String(s.nri).toLowerCase() === 'true' || String(s.nri).toLowerCase() === 'yes'
                      return (
                        <tr key={s.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <code style={{ fontSize: '12px' }}>{s.prn || '—'}</code>
                              {s.ltc_id && (
                                <span className="badge badge-blue" style={{ fontSize: '10px', alignSelf: 'flex-start', background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                                  LTC ID: {s.ltc_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {s.name}
                            {s.red_flag && (
                              <span style={{ marginLeft: '8px', color: '#000000' }} title="Red Flagged">🚩</span>
                            )}
                          </td>
                          <td>{s.email}</td>
                          <td>
                            {isNri
                              ? <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>NRI</span>
                              : <span style={{ color: '#64748b', fontSize: '11px' }}>Regular</span>
                            }
                          </td>
                          <td>
                            {s.undertaking_submitted ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ background: '#eff6ff', color: '#1e40af', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700', alignSelf: 'flex-start' }}>
                                  Submitted
                                </span>
                                {s.undertaking_signed_date && (
                                  <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                                    {s.undertaking_signed_date}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ background: '#f8fafc', color: '#0f172a', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700', alignSelf: 'flex-start' }}>
                                Pending
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '11px', borderColor: s.red_flag ? '#000000' : 'var(--border)', color: s.red_flag ? '#000000' : 'var(--text-main)' }}
                              onClick={() => handleToggleRedFlag(s.id)}
                            >
                              {s.red_flag ? 'Remove Flag' : 'Red Flag'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredStudents.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8' }}>No students found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <TimetablePanel compact={true} onViewDetail={() => setActiveTab('timetable')} />

            {/* ── Modals for Overview Cards ── */}
            {activeCardModal && (
              <div className="modal-overlay" onClick={() => setActiveCardModal(null)}>
                <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%' }}>
                  <div className="modal-header">
                    <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {activeCardModal === 'profile' && <><User size={20} style={{ color: '#2563eb' }} /> Faculty Profile</>}
                      {activeCardModal === 'squad' && <><Users size={20} style={{ color: '#1d4ed8' }} /> Allocated Squad</>}
                      {activeCardModal === 'leader' && <><GraduationCap size={20} style={{ color: '#1e40af' }} /> Squad Leader</>}
                      {activeCardModal === 'colleagues' && <><Users size={20} style={{ color: '#2563eb' }} /> Faculty Colleagues</>}
                    </h3>
                    <button className="modal-close" onClick={() => setActiveCardModal(null)}><X size={20} /></button>
                  </div>
                  <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {activeCardModal === 'profile' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={20} fill="currentColor" />
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Full Name</div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', wordBreak: 'break-word', whiteSpace: 'normal' }}>{facultyInfo?.name || currentUser.name}</div>
                          </div>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MessageSquare size={20} fill="currentColor" />
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Email Address</div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', wordBreak: 'break-word', whiteSpace: 'normal' }}>{facultyInfo?.email || currentUser.email}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeCardModal === 'squad' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Users size={20} fill="currentColor" />
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Allocated Squad Name</div>
                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', wordBreak: 'break-word', whiteSpace: 'normal' }}>{facultyInfo?.squad || 'Not Assigned'}</div>
                          </div>
                        </div>
                        {facultyInfo?.squad && (
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Squad Statistics</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total Students</span>
                              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{squadStudents.length}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Female</div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>{squadStudents.filter(s => s.gender?.toLowerCase() === 'female').length}</div>
                              </div>
                              <div style={{ padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>Male</div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: '#3b82f6' }}>{squadStudents.length - squadStudents.filter(s => s.gender?.toLowerCase() === 'female').length}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {activeCardModal === 'leader' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {squadLeader ? (
                          <>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <GraduationCap size={20} fill="currentColor" />
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Leader Name</div>
                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', wordBreak: 'break-word', whiteSpace: 'normal' }}>{squadLeader.name}</div>
                              </div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <MessageSquare size={20} fill="currentColor" />
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Email Address</div>
                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', wordBreak: 'break-word', whiteSpace: 'normal' }}>{squadLeader.email}</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>No squad leader assigned.</div>
                          </div>
                        )}
                      </div>
                    )}
                    {activeCardModal === 'colleagues' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(() => {
                          const others = batchFaculty.filter(f => f.id !== (facultyInfo?.id || currentUser?.id));
                          if (others.length === 0) return (
                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                              <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>No other colleagues in this squad.</div>
                            </div>
                          );
                          return others.map(c => (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {c.name ? c.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'FC'}
                              </div>
                              <div>
                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', wordBreak: 'break-word', whiteSpace: 'normal' }}>{c.name}</div>
                                <div style={{ fontSize: '13px', color: '#64748b', wordBreak: 'break-word', whiteSpace: 'normal', marginTop: '2px' }}>{c.email}</div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
          )
        })()}


        {activeTab === 'nri' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '20px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users className="text-primary" /> NRI Students
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              Filter view — NRI students appear in all other sections (attendance, evaluation, student list) as well.
            </p>

            <div className="search-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search NRI students..."
                className="input-field"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>PRN / LTC ID</th><th>Name</th><th>Email</th><th>Status</th></tr></thead>
                <tbody>
                  {filteredStudents.filter(s => s.nri === true || s.nri === 1 || String(s.nri).toLowerCase() === 'true' || String(s.nri).toLowerCase() === 'yes').map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <code style={{ fontSize: '12px' }}>{s.prn || '—'}</code>
                          {s.ltc_id && (
                            <span className="badge badge-blue" style={{ fontSize: '10px', alignSelf: 'flex-start', background: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                              LTC ID: {s.ltc_id}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{s.name}{s.red_flag && <span style={{ marginLeft: '8px', color: '#000000' }}>🚩</span>}</td>
                      <td>{s.email}</td>
                      <td><span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' }}>NRI</span></td>
                    </tr>
                  ))}
                  {filteredStudents.filter(s => s.nri === true || s.nri === 1 || String(s.nri).toLowerCase() === 'true' || String(s.nri).toLowerCase() === 'yes').length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No NRI students found. Upload students with <code>nri=yes</code> in the bulk upload.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar className="text-primary" /> Create Activity Schedule
            </h2>
            <form onSubmit={handleCreateSchedule} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '32px' }}>
              <input type="text" placeholder="Activity Title (Optional for 7-Day)" className="input-field" style={{ margin: 0 }} value={scheduleForm.title} onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })} />
              <input type="date" className="input-field" style={{ margin: 0 }} required value={scheduleForm.date} onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })} />
              <input type="time" className="input-field" style={{ margin: 0 }} required value={scheduleForm.time} onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })} />
              <select className="input-field" style={{ margin: 0, width: isMobile ? '100%' : 'auto' }} value={scheduleForm.panel} onChange={e => setScheduleForm({ ...scheduleForm, panel: e.target.value })}>
                <option value="PA">Panel PA</option>
                <option value="PB">Panel PB</option>
                <option value="PC">Panel PC</option>
                <option value="PD">Panel PD</option>
                <option value="ALL">All Panels</option>
              </select>
              <button type="submit" className="btn" style={{ width: isMobile ? '100%' : 'auto' }}>Schedule</button>
              <button type="button" className="btn" style={{ background: 'var(--secondary)', width: isMobile ? '100%' : 'auto' }} onClick={handleGenerate7DaySchedule}>Generate 7-Days</button>
            </form>

            <h3 style={{ marginBottom: '16px' }}>Upcoming Activities</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Title</th><th>Date</th><th>Time</th><th>Target Panel</th></tr></thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id}><td>{s.title}</td><td>{s.date}</td><td>{s.time}</td><td>{s.panel}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="glass-card animate-fade-in">

            {/* ── DETAIL PAGE ── */}
            {selectedScheduleId ? (() => {
              const sel = schedules.find(s => String(s.id) === String(selectedScheduleId))
              if (!sel) return null
              const marked = attendanceRecords.filter(a => a.schedule_id === sel.id).length
              return (
                <div>
                  {/* Back + header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <button onClick={() => setSelectedScheduleId('')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '7px 14px', fontWeight: '700', fontSize: '12px', color: '#0f172a', cursor: 'pointer' }}>
                      ← Back
                    </button>
                    <div>
                      <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Attendance · {sel.date}</div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>{sel.title}</div>
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {[['Total Students', students.length, '#0f172a'], ['Marked', marked, '#2563eb'], ['Unmarked', Math.max(0, students.length - marked), '#475569']].map(([lbl, val, clr]) => (
                      <div key={lbl} style={{ flex: '1 1 100px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: clr }}>{val}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>{lbl}</div>
                      </div>
                    ))}
                    <button onClick={handleMarkAllPresent} style={{ flex: '1 1 140px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 20px', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>✓ Mark All Present</button>
                  </div>

                  {/* Student table */}
                  {students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', fontSize: '13px' }}>No students allocated to your squad yet.</div>
                  ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#0f172a' }}>
                            {['#', 'PRN / LTC ID', 'Student Name', 'Status', 'Action'].map(h => (
                              <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Action' ? 'center' : 'left', color: '#fff', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((st, i) => {
                            const rec = attendanceRecords.find(a => a.student_id === st.id && a.schedule_id === sel.id)
                            const isP = rec?.status === 'Present', isA = rec?.status === 'Absent'
                            return (
                              <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: '600', fontSize: '11px', whiteSpace: 'nowrap' }}>{i + 1}</td>
                                <td style={{ padding: '10px 14px' }}>
                                  <code style={{ fontSize: '11px', color: '#0f172a', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{st.prn || '—'}</code>
                                  {st.ltc_id && <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: '700', marginTop: '2px' }}>LTC: {st.ltc_id}</div>}
                                </td>
                                <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0f172a' }}>{st.name}</td>
                                <td style={{ padding: '10px 14px' }}>
                                  {rec
                                    ? <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', background: isP ? '#2563eb' : '#0f172a', color: '#fff' }}>{rec.status}</span>
                                    : <span style={{ fontSize: '11px', color: '#94a3b8' }}>Not Marked</span>}
                                </td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button onClick={() => handleMarkAttendance(st.id, sel.id, 'Present')} style={{ padding: '5px 16px', borderRadius: '7px', border: `2px solid ${isP ? '#2563eb' : '#e2e8f0'}`, background: isP ? '#2563eb' : '#fff', color: isP ? '#fff' : '#2563eb', fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}>P</button>
                                    <button onClick={() => handleMarkAttendance(st.id, sel.id, 'Absent')} style={{ padding: '5px 16px', borderRadius: '7px', border: `2px solid ${isA ? '#0f172a' : '#e2e8f0'}`, background: isA ? '#0f172a' : '#fff', color: isA ? '#fff' : '#0f172a', fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}>A</button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })() : (

              /* ── ACTIVITY TABLE LIST ── */
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
                  <ClipboardList size={20} style={{ color: '#2563eb' }} /> Mark Student Attendance
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Select an activity to open its attendance page.</p>

                {schedules.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '1.5px dashed #e2e8f0', borderRadius: '12px' }}>
                    <ClipboardList size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No activities found for your active batch.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#0f172a' }}>
                          {['#', 'Date', 'Activity', 'Time', 'Marked', 'Progress', 'Action'].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((s, i) => {
                          const cnt = attendanceRecords.filter(a => a.schedule_id === s.id).length
                          const total = students.length
                          const pct = total > 0 ? Math.round((cnt / total) * 100) : 0
                          const done = cnt >= total && total > 0
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ padding: '11px 14px', color: '#94a3b8', fontWeight: '600', fontSize: '11px' }}>{i + 1}</td>
                              <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb' }}>{s.date}</span>
                              </td>
                              <td style={{ padding: '11px 14px', fontWeight: '700', color: '#0f172a', minWidth: '160px' }}>{s.title}</td>
                              <td style={{ padding: '11px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>{s.time}</td>
                              <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: '800', color: '#0f172a' }}>{cnt}</span>
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}> / {total}</span>
                              </td>
                              <td style={{ padding: '11px 14px', minWidth: '100px' }}>
                                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: done ? '#2563eb' : '#0f172a', borderRadius: '99px', transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px', fontWeight: '600' }}>{pct}%</div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <button
                                  onClick={() => setSelectedScheduleId(String(s.id))}
                                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                >Open →</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}






        {activeTab === 'evaluate' && (
          <div className="glass-card animate-fade-in">

            {/* ── DETAIL PAGE ── */}
            {selectedEvalScheduleId ? (() => {
              const OPTS = [
                { value: 'not_done',       label: 'Not Done', icon: '✗', selBg: '#0f172a', selColor: '#fff' },
                { value: 'partially_done', label: 'Partial',  icon: '◑', selBg: '#1e40af', selColor: '#fff' },
                { value: 'fully_done',     label: 'Done',     icon: '✓', selBg: '#2563eb', selColor: '#fff' },
              ]
              const evalStudents = students
              const pendingCount = Object.keys(selectedMarkings).filter(id => selectedMarkings[id] !== undefined).length
              return (
                <div>
                  {/* Back + header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => { setSelectedEvalScheduleId(''); setSavedEvals({}); setSelectedMarkings({}) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '7px 14px', fontWeight: '700', fontSize: '12px', color: '#0f172a', cursor: 'pointer' }}>← Back</button>
                      <div>
                        <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Evaluation · {schedules.find(s => String(s.id) === String(selectedEvalScheduleId))?.date}</div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>{schedules.find(s => String(s.id) === String(selectedEvalScheduleId))?.title}</div>
                      </div>
                    </div>
                    <button
                      disabled={pendingCount === 0 || evalSubmitting}
                      onClick={handleEvaluate}
                      style={{ background: pendingCount > 0 ? '#2563eb' : '#e2e8f0', color: pendingCount > 0 ? '#fff' : '#94a3b8', border: 'none', padding: '9px 22px', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: pendingCount > 0 ? 'pointer' : 'default', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
                    >{evalSubmitting ? 'Saving…' : `Save ${pendingCount} Response${pendingCount !== 1 ? 's' : ''}`}</button>
                  </div>

                  {evalStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', background: '#f8fafc', borderRadius: '10px', fontSize: '13px' }}>No students allocated to your squad yet.</div>
                  ) : (
                    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#0f172a' }}>
                            {['#', 'Student', 'PRN', 'Not Done', 'Partial', 'Done', 'Status'].map(h => (
                              <th key={h} style={{ padding: '10px 13px', textAlign: 'left', color: '#fff', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {evalStudents.map((st, i) => {
                            const pending = selectedMarkings[st.id]
                            const saved = savedEvals[st.id]
                            return (
                              <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc', opacity: saved ? 0.75 : 1 }}>
                                <td style={{ padding: '10px 13px', color: '#94a3b8', fontWeight: '600', fontSize: '11px' }}>{i + 1}</td>
                                <td style={{ padding: '10px 13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>{st.name}</td>
                                <td style={{ padding: '10px 13px' }}>
                                  <code style={{ fontSize: '11px', color: '#475569', background: '#f1f5f9', padding: '2px 5px', borderRadius: '4px' }}>{st.prn || '—'}</code>
                                  {st.ltc_id && <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: '700', marginTop: '2px' }}>LTC: {st.ltc_id}</div>}
                                </td>
                                {OPTS.map(opt => {
                                  const isActive = (saved === opt.value) || (pending === opt.value && !saved)
                                  return (
                                    <td key={opt.value} style={{ padding: '10px 13px' }}>
                                      <button
                                        disabled={!!saved}
                                        onClick={() => setSelectedMarkings(prev => ({ ...prev, [st.id]: prev[st.id] === opt.value ? undefined : opt.value }))}
                                        style={{ padding: '5px 12px', borderRadius: '7px', border: `2px solid ${isActive ? opt.selBg : '#e2e8f0'}`, background: isActive ? opt.selBg : '#fff', color: isActive ? opt.selColor : '#64748b', fontWeight: '700', fontSize: '12px', cursor: saved ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                                      ><span>{opt.icon}</span>{opt.label}</button>
                                    </td>
                                  )
                                })}
                                <td style={{ padding: '10px 13px', whiteSpace: 'nowrap' }}>
                                  {saved
                                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: '#2563eb' }}>🔒 Locked</span>
                                    : pending
                                      ? <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>● Pending</span>
                                      : <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })() : (

              /* ── ACTIVITY TABLE LIST ── */
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a' }}>
                  <PenTool size={20} style={{ color: '#2563eb' }} /> Student Evaluation
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Select an activity to open its evaluation page.</p>

                {schedules.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '1.5px dashed #e2e8f0', borderRadius: '12px' }}>
                    <PenTool size={36} style={{ marginBottom: '10px', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>No activities found for your active batch.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#0f172a' }}>
                          {['#', 'Date', 'Activity', 'Time', 'Evaluated', 'Action'].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((s, i) => {
                          const evalsDone = allEvaluations.filter(e => String(e.schedule_id) === String(s.id)).length
                          const total = students.length
                          const allDone = evalsDone >= total && total > 0
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                              <td style={{ padding: '11px 14px', color: '#94a3b8', fontWeight: '600', fontSize: '11px' }}>{i + 1}</td>
                              <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb' }}>{s.date}</span>
                              </td>
                              <td style={{ padding: '11px 14px', fontWeight: '700', color: '#0f172a', minWidth: '160px' }}>{s.title}</td>
                              <td style={{ padding: '11px 14px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>{s.time}</td>
                              <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                                <span style={{ fontWeight: '800', color: allDone ? '#2563eb' : '#0f172a' }}>{evalsDone}</span>
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}> / {total}</span>
                                {allDone && <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: '800', color: '#2563eb' }}>✓ Done</span>}
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <button
                                  onClick={() => { setSelectedEvalScheduleId(String(s.id)); setSavedEvals({}); setSelectedMarkings({}) }}
                                  style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '7px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                >Open →</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}













        {activeTab === 'guidelines' && (
          <div className="glass-card animate-fade-in">
            <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText className="text-primary" /> Notifications, SOPs & Guidelines
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Document Name</th><th>Link</th></tr></thead>
                <tbody>
                  {documents.map(d => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td><a href={d.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>View Document</a></td>
                    </tr>
                  ))}
                  {documents.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center' }}>No documents currently issued.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MessageSquare className="text-primary" size={28} /> Share Your Feedback
            </h2>
            <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px' }}>
              Your feedback is valuable and helps us improve the platform.
            </p>

            <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="input-field"
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    style={{ paddingLeft: '40px', marginBottom: 0 }}
                  >
                    <option value="General">General Feedback</option>
                    <option value="Academics">Academic Programs</option>
                    <option value="Facilities">Campus Facilities</option>
                    <option value="Support">Student Support</option>
                  </select>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Message</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '160px', borderRadius: '12px', padding: '16px', marginBottom: 0 }}
                  placeholder="Tell us what you think, suggest improvements, or report issues..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Additional Notes</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ marginBottom: 0 }}
                  placeholder="Any extra details or quick notes..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn" style={{ padding: '12px 24px', fontSize: '14px', fontWeight: '600', alignSelf: isMobile ? 'stretch' : 'flex-start', width: isMobile ? '100%' : 'auto', background: '#0A082C', color: 'white' }}>
                Submit Feedback
              </button>
            </form>
          </div>
        )}

        {activeTab === 'undertaking' && (
          <div className="glass-card animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto', padding: isMobile ? '20px' : '40px', background: '#ffffff', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid #e2e8f0' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #0f172a', paddingBottom: '20px' }}>
              <img src="/ltc.png" alt="LTC Logo" style={{ height: '60px', objectFit: 'contain', marginBottom: '12px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>LTC Faculty Undertaking</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0 0', fontWeight: '500' }}>Official Immersion Honor Code & Agreement</p>
            </div>

            {facultyInfo?.undertaking_submitted ? (
              // Submitted State
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '30px 20px', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
                  ✓
                </div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Undertaking Submitted Successfully</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: 0 }}>
                    You have digitally signed and recorded this undertaking on the LTC system. A copy has been shared with the LTC Administration.
                  </p>
                </div>

                <div style={{ width: '100%', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '20px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', textAlign: 'left', marginTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Signed Signature</span>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0', fontFamily: 'serif', fontStyle: 'italic' }}>{facultyInfo.undertaking_signed_name}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Department</span>
                    <p style={{ fontSize: '15px', fontWeight: '750', color: '#0f172a', margin: '4px 0 0 0' }}>{facultyInfo.department || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Submission Date</span>
                    <p style={{ fontSize: '15px', fontWeight: '750', color: '#0f172a', margin: '4px 0 0 0' }}>{facultyInfo.undertaking_signed_date}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Verification Status</span>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#2563eb', margin: '4px 0 0 0' }}>Verified Record</p>
                  </div>
                </div>

                <button onClick={handlePrintUndertaking} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: '600' }}>
                  Print Receipt
                </button>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleSubmitUndertaking} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', color: '#334155', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0, fontWeight: '700', color: '#0f172a' }}>LTC Honor Code & Conduct Policy</p>
                  <p style={{ margin: 0 }}>
                    As a faculty representing my institution and participating in the Life Transformation Centre (LTC) program, I solemnly declare that:
                  </p>
                  <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>I will actively mentor and guide my assigned squad members, helping them achieve all project and evaluation milestones.</li>
                    <li>I will attend and evaluate scheduled sessions on time and grade students fairly according to the rubric.</li>
                    <li>I will maintain high standards of professionalism and follow the official guidelines set by the LTC administration.</li>
                    <li>I understand that my role as a faculty member is crucial for the transformation of my squad students.</li>
                  </ol>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                    <input type="checkbox" required style={{ marginTop: '3px' }} />
                    <span>I confirm that I have read and fully understand the LTC Honor Code and Conduct Policy guidelines.</span>
                  </label>
                  <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                    <input type="checkbox" required style={{ marginTop: '3px' }} />
                    <span>I agree to abide by the faculty mentorship, evaluation, and mark submission rules.</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Full Name (Digital Signature)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Type your full name to sign..."
                      style={{ margin: 0 }}
                      value={undertakingForm.signedName}
                      onChange={(e) => setUndertakingForm({ ...undertakingForm, signedName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Date of Signature</label>
                    <input
                      type="date"
                      className="input-field"
                      style={{ margin: 0 }}
                      value={undertakingForm.signedDate}
                      onChange={(e) => setUndertakingForm({ ...undertakingForm, signedDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn" 
                  disabled={submittingUndertaking}
                  style={{ background: '#0f172a', color: '#ffffff', padding: '12px 24px', fontSize: '14px', fontWeight: '700', borderRadius: '8px', alignSelf: 'flex-start', border: 'none', cursor: 'pointer' }}
                >
                  {submittingUndertaking ? 'Submitting...' : 'Sign & Submit Undertaking'}
                </button>
              </form>
            )}
          </div>
        )}

        <ScrollToTop />
      </div>
    </div>
  )
}
