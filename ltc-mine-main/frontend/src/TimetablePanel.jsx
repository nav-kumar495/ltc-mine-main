import React from 'react'
import { Clock, MapPin, Calendar } from 'lucide-react'

export default function TimetablePanel({ compact = false, onViewDetail }) {
  const timetableData = [
    {
      day: 1,
      name: "Day 1",
      activity1: {
        time: "09:00 AM - 12:30 PM",
        title: "Registration and Squad Allocation",
        location: "Main Seminar Complex",
        description: "Participant registration, camp kit distribution, squad assignment, and initial team integration briefings."
      },
      activity2: {
        time: "02:00 PM - 05:00 PM",
        title: "Orientation and Team Alignment",
        location: "Main Seminar Complex",
        description: "Leadership profiling, ice-breaking exercises, safety briefing, and alignment on curriculum objectives."
      }
    },
    {
      day: 2,
      name: "Day 2",
      activity1: {
        time: "09:00 AM - 12:30 PM",
        title: "Governance and Policy Seminar",
        location: "Policy Research Auditorium",
        description: "Seminar regarding public policy paradigms, state governance frameworks, and administrative processes."
      },
      activity2: {
        time: "02:00 PM - 05:00 PM",
        title: "Policy Design Thinking Sprint",
        location: "Policy Research Auditorium",
        description: "Squad workshop focusing on policy drafting, design thinking applications, and case study preparations."
      }
    },
    {
      day: 3,
      name: "Day 3",
      activity1: {
        time: "09:00 AM - 01:00 PM",
        title: "Industrial Operations Tour",
        location: "Tech Manufacturing Hub",
        description: "Guided field visit to advanced manufacturing plants to study corporate scaling and logistics operations."
      },
      activity2: {
        time: "02:30 PM - 05:30 PM",
        title: "Technology Leadership Summit",
        location: "Corporate Innovation Park",
        description: "Panel discussion with industry executives focusing on tech integration, operations, and scalable systems."
      }
    },
    {
      day: 4,
      name: "Day 4",
      activity1: {
        time: "09:00 AM - 12:30 PM",
        title: "Heritage Tour and Regional Growth Models",
        location: "National Archeological Site",
        description: "Guided tour mapping historical administration models, architectural conservation, and cultural economics."
      },
      activity2: {
        time: "02:00 PM - 05:00 PM",
        title: "Socio-Cultural Economics Analysis",
        location: "Regional Heritage Museum",
        description: "Group discussion and synthesis session on regional developmental history and cultural legacy preservation."
      }
    },
    {
      day: 5,
      name: "Day 5",
      activity1: {
        time: "09:00 AM - 01:00 PM",
        title: "Capstone Draft Peer Reviews",
        location: "Grand Seminar Hall",
        description: "Review of squad capstone project drafts with peer feedback sessions and structural improvements."
      },
      activity2: {
        time: "02:30 PM - 05:30 PM",
        title: "Sustainable Development Lecture",
        location: "Grand Seminar Hall",
        description: "Special session on rural development frameworks, local self-governance models, and sustainability."
      }
    },
    {
      day: 6,
      name: "Day 6",
      activity1: {
        time: "09:00 AM - 01:00 PM",
        title: "Capstone Dry-Runs and Rehearsals",
        location: "Presentation Room A",
        description: "Timed presentations within squads, feedback collection from mentors, and slide design finalization."
      },
      activity2: {
        time: "02:30 PM - 05:30 PM",
        title: "Crisis Simulation Workshop",
        location: "Presentation Room B",
        description: "Interactive simulation exercise on crisis response, administrative decision-making, and communication strategies."
      }
    },
    {
      day: 7,
      name: "Day 7",
      activity1: {
        time: "09:00 AM - 12:30 PM",
        title: "Capstone Project Presentations",
        location: "Ceremonial Auditorium",
        description: "Delivery of capstone project presentations before external evaluation panels and university delegates."
      },
      activity2: {
        time: "02:00 PM - 04:30 PM",
        title: "Valedictory Ceremony and Certification",
        location: "Ceremonial Auditorium",
        description: "Presentation of completion certificates, outstanding squad awards, and overall program feedback collection."
      }
    }
  ]

  if (compact) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '850', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: '#2563eb' }} />
              Immersion Schedule Summary
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
              Quick 7-day overview of the camp activities
            </p>
          </div>
          <button 
            onClick={onViewDetail}
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '11.5px', fontWeight: '750', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center' }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#dbeafe';
              e.currentTarget.style.borderColor = '#93c5fd';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
          >
            View in Detail &rarr;
          </button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', fontWeight: '750', color: '#0f172a', width: '80px' }}>Day</th>
                <th style={{ padding: '10px 12px', fontWeight: '750', color: '#0f172a' }}>Morning Session</th>
                <th style={{ padding: '10px 12px', fontWeight: '750', color: '#0f172a' }}>Afternoon Session</th>
              </tr>
            </thead>
            <tbody>
              {timetableData.map((row) => (
                <tr key={row.day} style={{ borderBottom: row.day < 7 ? '1px solid #e2e8f0' : 'none', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px', fontWeight: '800', color: '#475569' }}>
                    Day {row.day}
                  </td>
                  <td style={{ padding: '12px', color: '#0f172a', fontWeight: '600' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '10.5px', color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', marginRight: '8px', fontWeight: '700' }}>
                      <Clock size={10} />
                      {row.activity1.time.split(' - ')[0]}
                    </span>
                    {row.activity1.title}
                  </td>
                  <td style={{ padding: '12px', color: '#0f172a', fontWeight: '600' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '10.5px', color: '#1d4ed8', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', marginRight: '8px', fontWeight: '700' }}>
                      <Clock size={10} />
                      {row.activity2.time.split(' - ')[0]}
                    </span>
                    {row.activity2.title}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '850', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: '#2563eb' }} />
            LTC 7-Day Immersion Schedule
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Core activities, locations, and milestones for the leadership training camp
          </p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#2563eb', background: '#eff6ff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          7 Days | 14 Core Sessions
        </span>
      </div>

      <div style={{ overflowX: 'auto', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              <th style={{ padding: '16px', fontWeight: '750', color: '#0f172a', width: '100px' }}>Day</th>
              <th style={{ padding: '16px', fontWeight: '750', color: '#0f172a', width: '45%' }}>Morning Session</th>
              <th style={{ padding: '16px', fontWeight: '750', color: '#0f172a', width: '45%' }}>Afternoon Session</th>
            </tr>
          </thead>
          <tbody>
            {timetableData.map((row) => (
              <tr key={row.day} style={{ borderBottom: row.day < 7 ? '1px solid #e2e8f0' : 'none', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                {/* Day Indicator */}
                <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', width: '60px', height: '60px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b' }}>Day</span>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', lineHeight: '1.1' }}>{row.day}</span>
                  </div>
                </td>

                {/* Morning Session Details */}
                <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: '750', color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '6px' }}>
                        <Clock size={12} />
                        {row.activity1.time}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                        <MapPin size={12} />
                        {row.activity1.location}
                      </span>
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>
                      {row.activity1.title}
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                      {row.activity1.description}
                    </p>
                  </div>
                </td>

                {/* Afternoon Session Details */}
                <td style={{ padding: '20px 16px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: '750', color: '#1d4ed8', background: '#eff6ff', padding: '3px 8px', borderRadius: '6px' }}>
                        <Clock size={12} />
                        {row.activity2.time}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                        <MapPin size={12} />
                        {row.activity2.location}
                      </span>
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>
                      {row.activity2.title}
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                      {row.activity2.description}
                    </p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
