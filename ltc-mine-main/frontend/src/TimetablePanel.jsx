import React, { useState } from 'react'
import { Clock, MapPin, Calendar, Info, Sparkles, ChevronRight, User, Shirt } from 'lucide-react'

export default function TimetablePanel({ compact = false, onViewDetail }) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [activeSubTab, setActiveSubTab] = useState('schedule') // 'schedule' or 'dresscode'

  // Summary data for compact view (Day 1 to 5) using strictly blue/black/white details
  const compactTimetableData = [
    {
      day: 1,
      name: "Day 1",
      activity1: {
        time: "02:00 PM",
        title: "Room Allotment & Bag Check",
        location: "Admin Office"
      },
      activity2: {
        time: "07:00 PM",
        title: "Orientation & Program Welcome",
        location: "Sanskruti Hall"
      }
    },
    {
      day: 2,
      name: "Day 2",
      activity1: {
        time: "06:00 AM",
        title: "Yoga & Physical Drills",
        location: "Playground & Hall"
      },
      activity2: {
        time: "10:00 AM",
        title: "Agriculture & Team Building (G1/G2 Swap)",
        location: "Farm & Hall"
      }
    },
    {
      day: 3,
      name: "Day 3",
      activity1: {
        time: "06:00 AM",
        title: "Yoga & Physical Drills",
        location: "Playground & Hall"
      },
      activity2: {
        time: "03:00 PM",
        title: "Pillar Quiz Competition",
        location: "Sanskruti Hall"
      }
    },
    {
      day: 4,
      name: "Day 4",
      activity1: {
        time: "06:00 AM",
        title: "Yoga & Obstacle Competition",
        location: "Playground & Hall"
      },
      activity2: {
        time: "03:00 PM",
        title: "Debate & Cultural Program Night",
        location: "Sanskruti Hall & Amphitheatre"
      }
    },
    {
      day: 5,
      name: "Day 5",
      activity1: {
        time: "08:00 AM",
        title: "Patriotism Obstacles Competition",
        location: "Sports Ground"
      },
      activity2: {
        time: "11:00 AM",
        title: "Certificate Awarding & Departure",
        location: "Sanskruti Hall / Loni Dome"
      }
    }
  ]

  // Helper template for Days 2, 3, 4 detailed activities (as they share a base template with minor variations)
  const getDay2To4Activities = (dayNumber) => {
    let afternoonLectureTitle = "Inspiring Talk (Guest Lecture)"
    let afternoonLectureDesc = "Inspiring talk (including interaction with students) by a renowned personality on a subject related to one of the pillars."
    let daySpecificActivities = []

    if (dayNumber === 3) {
      afternoonLectureTitle = "Pillar Quiz Competition"
      afternoonLectureDesc = "Interactive Quiz Competition testing core values, leadership concepts, and team cooperation."
    } else if (dayNumber === 4) {
      afternoonLectureTitle = "Debate Competition"
      afternoonLectureDesc = "Debate competition on relevant development, leadership, and public policy topics."
      
      // Day 4 has Kho-Kho and Cultural Program additions in the evening
      daySpecificActivities = [
        {
          time: "06:00 PM - 06:30 PM",
          title: "Kho-Kho Competition",
          location: "Playground",
          dress: "Collar T-Shirt & Track Pants",
          description: "Squad-level competitive matches promoting team coordination and sportsmanship.",
          type: "fitness"
        },
        {
          time: "08:30 PM - 10:00 PM",
          title: "Cultural Program & reflections",
          location: "Sanskruti Hall / Amphitheatre",
          dress: "Casual / Traditional",
          description: "Performances, cultural acts, patriotic presentations, and peer reflections.",
          type: "academic"
        }
      ]
    }

    const baseActivities = [
      {
        time: "05:00 AM - 05:40 AM",
        title: "Wakeup Call",
        location: "Hostel",
        dress: "Casual",
        description: "Wake up alert with Abhang, Bhupali, and classical music played by LTC staff.",
        type: "rest"
      },
      {
        time: "05:40 AM - 05:50 AM",
        title: "Distribution of Seasonal Fruit",
        location: "On the way to playground",
        dress: "Combat Dress & Sports Shoes",
        description: "Staff of LTC distributes fresh seasonal fruit to students heading to the grounds.",
        type: "meals"
      },
      {
        time: "05:50 AM - 06:00 AM",
        title: "Fall in Squads & Attendance",
        location: "Playground",
        dress: "Combat Dress & Sports Shoes",
        description: "Squad-wise assembly and roll call in front of designated squad poles.",
        type: "fitness"
      },
      {
        time: "06:00 AM - 06:05 AM",
        title: "National Song",
        location: "Playground",
        dress: "Combat Dress & Sports Shoes",
        description: "All squads join together for the singing of the National Song.",
        type: "fitness"
      },
      {
        time: "06:05 AM - 06:30 AM",
        title: "Stretching, Aerobics & Jogging",
        location: "Track around playground",
        dress: "Combat Dress & Sports Shoes",
        description: "Warm up with spot jogging, full-body stretching (3 mins), followed by road running (20 mins).",
        type: "fitness"
      },
      {
        time: "06:30 AM - 07:25 AM",
        title: "Physical Fitness/Sports OR Patriotism & Obstacles",
        location: "Playground / Obstacle Site",
        dress: "Combat Dress & Sports Shoes",
        description: "Track swap: Group I undergoes Indian sports/Fitness drills; Group II undergoes Obstacle/Army training.",
        type: "fitness",
        groupTrack: "Group I: Sports | Group II: Obstacles"
      },
      {
        time: "07:25 AM - 07:30 AM",
        title: "Cool Down",
        location: "Playground",
        dress: "Combat Dress & Sports Shoes",
        description: "Cool-down stretches and breathing exercises on the field.",
        type: "fitness"
      },
      {
        time: "07:30 AM - 07:55 AM",
        title: "Dress Change & Bio Break",
        location: "Hostel",
        dress: "Change to Yoga Dress",
        description: "Change to Yoga Dress (Boys: Kurta Pyjama, Girls: Salwar Kurta) and proceed to Sanskruti Hall.",
        type: "rest"
      },
      {
        time: "07:55 AM - 08:00 AM",
        title: "Seating in Hall",
        location: "Sanskruti Hall",
        dress: "Yoga Dress",
        description: "Taking designated squad seating spots inside the auditorium.",
        type: "academic"
      },
      {
        time: "08:00 AM - 09:00 AM",
        title: "Yoga (Spirituality & Peace)",
        location: "Sanskruti Hall",
        dress: "Boys: Kurta Pyjama | Girls: Salwar Kurta",
        description: "Guided yoga, breathing, and meditation session led by trained Yoga Teachers.",
        type: "academic"
      },
      {
        time: "09:00 AM - 09:30 AM",
        title: "Breakfast",
        location: "Annapurna Hall",
        dress: "Yoga Dress",
        description: "Nutritious morning breakfast served at Annapurna Hall.",
        type: "meals"
      },
      {
        time: "09:30 AM - 09:50 AM",
        title: "Dress Change & Bio Break",
        location: "Hostel",
        dress: "Change to Collar T-Shirt & Track Pants",
        description: "Change to Collar T-shirt and track pants.",
        type: "rest"
      },
      {
        time: "09:50 AM - 10:00 AM",
        title: "Assembly",
        location: "Sanskruti Hall / Sinhgad Block",
        dress: "Collar T-Shirt & Track Pants",
        description: "Group I gathers at Sanskruti Hall; Group II gathers near Sinhgad block for attendance.",
        type: "academic"
      },
      {
        time: "10:00 AM - 11:30 AM",
        title: "Team Building OR Agriculture",
        location: "Sanskruti Hall / Farm",
        dress: "Collar T-Shirt & Track Pants",
        description: "Group I undergoes Team Building and Leadership. Group II undergoes Agricultural training on the farm.",
        type: "academic",
        groupTrack: "Group I: Team Building | Group II: Agriculture"
      },
      {
        time: "11:30 AM - 12:25 PM",
        title: "Bath Break & Rest",
        location: "Hostel",
        dress: "Casual",
        description: "Return to hostel rooms, take bath, clean up, and rest.",
        type: "rest"
      },
      {
        time: "12:25 PM - 12:30 PM",
        title: "Assembly at Annapurna Hall",
        location: "Annapurna Hall",
        dress: "Casual",
        description: "Be seated at Annapurna Hall for prayers.",
        type: "meals"
      },
      {
        time: "12:30 PM - 01:30 PM",
        title: "Prayer and Lunch",
        location: "Annapurna Hall",
        dress: "Casual",
        description: "Daily prayers followed by lunch.",
        type: "meals"
      },
      {
        time: "01:30 PM - 02:50 PM",
        title: "Afternoon Rest",
        location: "Hostel",
        dress: "Casual",
        description: "Rest period inside hostel rooms.",
        type: "rest"
      },
      {
        time: "02:50 PM - 03:00 PM",
        title: "Seating & Attendance",
        location: "Sanskruti Hall",
        dress: "Collar T-Shirt & Track Pants",
        description: "Roll call and prep checklist check for afternoon events.",
        type: "academic"
      },
      {
        time: "03:00 PM - 03:45 PM",
        title: afternoonLectureTitle,
        location: "Sanskruti Hall",
        dress: "Collar T-Shirt & Track Pants",
        description: afternoonLectureDesc,
        type: "academic"
      },
      {
        time: "03:45 PM - 04:20 PM",
        title: "Snacks Break",
        location: "Annapurna Hall",
        dress: "Collar T-Shirt & Track Pants",
        description: "Students gather at Annapurna Hall for seasonal fruits and fresh Nimbu Pani.",
        type: "meals"
      },
      {
        time: "04:20 PM - 04:30 PM",
        title: "Assembly for Swapped Activities",
        location: "Sinhgad Block / Sanskruti Hall",
        dress: "Collar T-Shirt & Track Pants",
        description: "Group II assembles at Sanskruti Hall; Group I assembles near Sinhgad block.",
        type: "academic"
      },
      {
        time: "04:30 PM - 06:00 PM",
        title: "Agriculture OR Team Building",
        location: "Farm / Sanskruti Hall",
        dress: "Collar T-Shirt & Track Pants",
        description: "Swapped activity: Group I undergoes Agricultural training; Group II undergoes Team Building.",
        type: "academic",
        groupTrack: "Group I: Agriculture | Group II: Team Building"
      },
      {
        time: "06:00 PM - 07:00 PM",
        title: "Open Activity",
        location: "Playground",
        dress: "Collar T-Shirt & Track Pants",
        description: "Choice of recreational/creative activities (drawing, poetry, playing field games, etc.).",
        type: "fitness"
      },
      {
        time: "07:00 PM - 07:15 PM",
        title: "Fresh Up",
        location: "Hostel",
        dress: "Casual",
        description: "Return to hostel rooms to wash up before dinner.",
        type: "rest"
      },
      {
        time: "07:15 PM - 08:20 PM",
        title: "Dinner",
        location: "Annapurna Hall",
        dress: "Casual",
        description: "Dinner served at Annapurna Hall.",
        type: "meals"
      },
      {
        time: "08:20 PM - 08:30 PM",
        title: "Night Assembly",
        location: "Sanskruti Hall / Amphitheatre",
        dress: "Casual",
        description: "Night assembly and check of squad coordinates.",
        type: "academic"
      },
      {
        time: "08:30 PM - 09:40 PM",
        title: "Reflections & Patriotic Movie",
        location: "Sanskruti Hall / Amphitheatre",
        dress: "Casual",
        description: "Patriotic movie or documentary screening, followed by student reflection and experience sharing.",
        type: "academic"
      },
      {
        time: "09:45 PM",
        title: "Lights off",
        location: "Hostel",
        dress: "Night Dress",
        description: "Lights off and hostel curfew.",
        type: "rest"
      }
    ]

    // For Day 4, replace standard open activity and reflections with Kho-Kho and Cultural Night
    if (dayNumber === 4) {
      const filteredBase = baseActivities.filter(act => 
        act.title !== "Open Activity" && 
        act.title !== "Reflections & Patriotic Movie" &&
        act.title !== "Lights off"
      )
      // Insert Kho-Kho after Agriculture/Team building swap
      const idxOfAgri = filteredBase.findIndex(act => act.title === "Agriculture OR Team Building")
      filteredBase.splice(idxOfAgri + 1, 0, daySpecificActivities[0]) // Kho-Kho

      // Insert Cultural Program after Night Assembly
      const idxOfNightAssembly = filteredBase.findIndex(act => act.title === "Night Assembly")
      filteredBase.splice(idxOfNightAssembly + 1, 0, daySpecificActivities[1]) // Cultural Program

      // Add lights off at the end
      filteredBase.push({
        time: "10:00 PM",
        title: "Lights off",
        location: "Hostel",
        dress: "Night Dress",
        description: "End of Cultural Night, lights off.",
        type: "rest"
      })
      
      return filteredBase
    }

    return baseActivities
  }

  // Detailed schedule dataset
  const detailedSchedule = {
    1: [
      {
        time: "02:00 PM - 04:00 PM",
        title: "Room Allotment & Bag Checking",
        location: "Administrative Office",
        dress: "Formal Dress",
        description: "Baggage checked by LTC staff on Durries. Prohibited items deposited with Director LTC.",
        type: "registration"
      },
      {
        time: "02:00 PM - 05:00 PM",
        title: "Welcome Drink",
        location: "Annapurna Hall",
        dress: "Formal Dress",
        description: "Welcome refreshments served upon arrival.",
        type: "meals"
      },
      {
        time: "07:00 PM - 08:00 PM",
        title: "Presentation on Orientation",
        location: "Sanskruti Hall",
        dress: "Formal Dress",
        description: "Orientation to LTC rules. Briefing by LTC Director, Pillar Heads, and Dean address.",
        type: "academic"
      },
      {
        time: "08:00 PM - 09:00 PM",
        title: "Prayer and Dinner",
        location: "Annapurna Hall",
        dress: "Formal Dress",
        description: "Community prayer and dinner.",
        type: "meals"
      },
      {
        time: "09:00 PM - 10:30 PM",
        title: "Mobile Collection & Uniform Distribution",
        location: "Administrative Office",
        dress: "Formal Dress",
        description: "Mobiles collected for digital detox. Distribution of Army/Combat dress for morning drills.",
        type: "registration"
      },
      {
        time: "10:30 PM",
        title: "Lights off",
        location: "Hostel",
        dress: "Night Dress",
        description: "Curfew and lights off.",
        type: "rest"
      }
    ],
    2: getDay2To4Activities(2),
    3: getDay2To4Activities(3),
    4: getDay2To4Activities(4),
    5: [
      {
        time: "05:00 AM - 05:50 AM",
        title: "Fall in Squads & Attendance",
        location: "Playground",
        dress: "Combat Dress & Sports Shoes",
        description: "Wakeup call, fruit distribution, and attendance for final day activities.",
        type: "fitness"
      },
      {
        time: "05:50 AM - 06:00 AM",
        title: "Seating in Hall",
        location: "Sanskruti Hall",
        dress: "Kurta Pyjama / Salwar Kurta",
        description: "Students take seats for the final yoga session.",
        type: "academic"
      },
      {
        time: "06:00 AM - 07:00 AM",
        title: "Yoga (Spirituality and Peace)",
        location: "Sanskruti Hall",
        dress: "Boys: Kurta Pyjama | Girls: Salwar Kurta",
        description: "Final yoga, mindfulness, and breathing exercises under yoga teacher guidance.",
        type: "academic"
      },
      {
        time: "07:00 AM - 07:20 AM",
        title: "Dress Change & Bio Break",
        location: "Hostel",
        dress: "Change to Combat Dress",
        description: "Change to Army Combat Uniform for group photo and obstacles.",
        type: "rest"
      },
      {
        time: "07:20 AM - 07:30 AM",
        title: "Group Photo & National Song",
        location: "Amphitheatre",
        dress: "Combat Dress & Sports Shoes",
        description: "Official batch and squad photography session, followed by the National Song.",
        type: "registration"
      },
      {
        time: "07:30 AM - 08:00 AM",
        title: "Assembly at Ground",
        location: "Playground",
        dress: "Combat Dress & Sports Shoes",
        description: "Final assembly at squad poles, preparation for competition.",
        type: "fitness"
      },
      {
        time: "08:00 AM - 09:30 AM",
        title: "Obstacles Competition",
        location: "Sports Ground",
        dress: "Combat Dress & Sports Shoes",
        description: "Squad competition. Every squad races through the military obstacle course.",
        type: "fitness"
      },
      {
        time: "09:30 AM - 10:00 AM",
        title: "Breakfast",
        location: "Annapurna Hall",
        dress: "Combat Dress",
        description: "Morning breakfast at Annapurna Hall.",
        type: "meals"
      },
      {
        time: "10:00 AM - 11:00 AM",
        title: "Team Building OR Agriculture",
        location: "Sanskruti Hall / Farm",
        dress: "Collar T-Shirt & Track Pants",
        description: "Group II: Team building workshop. Group I: Agricultural farm work.",
        type: "academic",
        groupTrack: "Group I: Agriculture | Group II: Team Building"
      },
      {
        time: "11:00 AM - 11:30 AM",
        title: "Feedback & reflections",
        location: "Sanskruti Hall",
        dress: "Collar T-Shirt & Track Pants",
        description: "Experience sharing, feedback collection, suggestions, and 5-day glimpses video.",
        type: "academic"
      },
      {
        time: "11:30 AM - 12:30 PM",
        title: "Certificate & Award Distribution",
        location: "Sanskruti Hall",
        dress: "Collar T-Shirt & Track Pants",
        description: "Presentation of completion certificates and prizes for various squad competitions.",
        type: "academic"
      },
      {
        time: "12:30 PM - 01:00 PM",
        title: "Bath, Dress Change & packing",
        location: "Hostel",
        dress: "Change to Formal/Casual Dress",
        description: "Bath, change out of uniforms, pack baggage, and vacate rooms. Assemble at Sinhgad block.",
        type: "rest"
      },
      {
        time: "01:00 PM - 02:00 PM",
        title: "Prayer and Lunch",
        location: "Annapurna Hall",
        dress: "Formal/Casual Dress",
        description: "Prayers and farewell lunch at Annapurna Hall.",
        type: "meals"
      },
      {
        time: "02:00 PM - 02:30 PM",
        title: "Mobile Distribution & Uniform Collection",
        location: "Administrative Office",
        dress: "Formal/Casual Dress",
        description: "Mobiles returned. Combat uniforms collected back by faculty and coordinators.",
        type: "registration"
      },
      {
        time: "03:00 PM - 03:30 PM",
        title: "Boarding the Buses",
        location: "Sinhgad Block",
        dress: "Formal/Casual Dress",
        description: "Boarding assigned travel buses.",
        type: "registration"
      },
      {
        time: "03:30 PM - 05:00 PM",
        title: "Journey to Loni",
        location: "Travel by Bus",
        dress: "Formal/Casual Dress",
        description: "Travel from LTC back to Loni.",
        type: "rest"
      },
      {
        time: "05:00 PM - 05:30 PM",
        title: "Dome Visit",
        location: "Loni Dome",
        dress: "Formal/Casual Dress",
        description: "Guided tour of the Loni Dome hosted by staff.",
        type: "academic"
      },
      {
        time: "05:30 PM - 06:00 PM",
        title: "High Tea & Dinner",
        location: "Loni Dome",
        dress: "Formal/Casual Dress",
        description: "High tea and light dinner served at Loni Dome.",
        type: "meals"
      },
      {
        time: "06:00 PM - 07:30 PM",
        title: "Return Journey to MIT",
        location: "Travel by Bus",
        dress: "Formal/Casual Dress",
        description: "Buses depart Loni, completing the return travel to MIT Campus.",
        type: "rest"
      }
    ]
  }

  // Venue and dress code table data
  const dressCodeRules = [
    { activity: "Rural Immersion Visit", venue: "Village", dress: "Formal Dress", note: "Day 1 to Day 3" },
    { activity: "Room Allotment & Mobile Deposit", venue: "Administrative Office", dress: "Formal Dress", note: "Arrival checks" },
    { activity: "National Song & Assembly", venue: "Playground", dress: "Combat Dress with sports shoes", note: "Morning squad line-up" },
    { activity: "Jogging, Stretching & Running", venue: "Playground Track", dress: "Combat Dress with sports shoes", note: "Physical conditioning" },
    { activity: "Patriotism Obstacles Training", venue: "Obstacle Ground", dress: "Combat Dress with sports shoes", note: "Physical challenges" },
    { activity: "Yoga (Spirituality & Wisdom)", venue: "Sanskruti Hall", dress: "Boys: Kurta Pyjama | Girls: Salwar Kurta", note: "Mats provided in hall" },
    { activity: "Agriculture Activities", venue: "LTC Farm", dress: "Collar T-Shirt and track pants", note: "Fieldwork exercises" },
    { activity: "Team Building & Leadership", venue: "Sanskruti Hall", dress: "Collar T-Shirt and track pants", note: "Group workshops" },
    { activity: "Guest Lectures / Quiz / Debate", venue: "Sanskruti Hall", dress: "Collar T-Shirt and track pants", note: "Academic pillars" },
    { activity: "Open Activities & reflections", venue: "Playground / Sanskruti Hall", dress: "Collar T-Shirt and track pants", note: "Evening assemblies" },
    { activity: "Patriotic Movie Screening", venue: "Amphitheatre / Sanskruti Hall", dress: "Collar T-Shirt and track pants", note: "Evening recreation" },
    { activity: "Farewell Journeys", venue: "Buses & Loni Dome", dress: "Formal / Casual Dress", note: "Day 5 return travel" }
  ]

  // Helper to color code tags based on activity type (returns uniform identical styling for all types)
  const getActivityStyles = (type) => {
    const labelMap = {
      fitness: 'Fitness & Sports',
      academic: 'Leadership & Academic',
      meals: 'Meals & Prayer',
      rest: 'Rest & Breaks',
      registration: 'Registration & Admin'
    }
    return { 
      bg: '#eff6ff', 
      text: '#2563eb', 
      border: '#bfdbfe', 
      label: labelMap[type] || 'Activity' 
    }
  }

  // COMPACT VIEW FOR DASHBOARD CARDS
  if (compact) {
    return (
      <div 
        style={{ 
          background: '#ffffff', 
          border: '1px solid #bfdbfe', 
          borderRadius: '16px', 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px'
        }} 
        className="animate-fade-in"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #bfdbfe', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '850', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: '#2563eb' }} />
              Revised 5-Day Immersion Schedule
            </h3>
            <p style={{ fontSize: '12px', color: '#0f172a', margin: '2px 0 0 0' }}>
              Quick summary of the transformation camp schedule
            </p>
          </div>
          <button 
            onClick={onViewDetail}
            style={{ 
              background: '#eff6ff', 
              border: '1px solid #bfdbfe', 
              color: '#2563eb', 
              fontSize: '11.5px', 
              fontWeight: '750', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              transition: 'all 0.2s', 
              display: 'inline-flex', 
              alignItems: 'center' 
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#dbeafe';
              e.currentTarget.style.borderColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
          >
            View in Detail &rarr;
          </button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                <th style={{ padding: '10px 12px', fontWeight: '750', color: '#0f172a', width: '80px' }}>Day</th>
                <th style={{ padding: '10px 12px', fontWeight: '750', color: '#0f172a' }}>Morning Session</th>
                <th style={{ padding: '10px 12px', fontWeight: '750', color: '#0f172a' }}>Afternoon Session</th>
              </tr>
            </thead>
            <tbody>
              {compactTimetableData.map((row) => (
                <tr 
                  key={row.day} 
                  style={{ 
                    borderBottom: row.day < 5 ? '1px solid #bfdbfe' : 'none', 
                    transition: 'background-color 0.2s' 
                  }} 
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} 
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '12px', fontWeight: '800', color: '#0f172a' }}>
                    Day {row.day}
                  </td>
                  <td style={{ padding: '12px', color: '#0f172a', fontWeight: '600' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '10.5px', color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', marginRight: '8px', fontWeight: '700' }}>
                      <Clock size={10} style={{ color: '#2563eb' }} />
                      {row.activity1.time}
                    </span>
                    {row.activity1.title}
                    <span style={{ fontSize: '11px', color: '#2563eb', display: 'block', fontWeight: 'normal', marginTop: '2px' }}>
                      Venue: {row.activity1.location}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#0f172a', fontWeight: '600' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '10.5px', color: '#1d4ed8', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', marginRight: '8px', fontWeight: '700' }}>
                      <Clock size={10} style={{ color: '#1d4ed8' }} />
                      {row.activity2.time}
                    </span>
                    {row.activity2.title}
                    <span style={{ fontSize: '11px', color: '#2563eb', display: 'block', fontWeight: 'normal', marginTop: '2px' }}>
                      Venue: {row.activity2.location}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // DETAILED VIEW (WITH DAY TABS AND TIMELINE)
  return (
    <div 
      style={{ 
        background: '#ffffff', 
        border: '1px solid #bfdbfe', 
        borderRadius: '16px', 
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px'
      }} 
      className="animate-fade-in"
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #bfdbfe', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '850', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: '#2563eb' }} />
            LTC Revised 5-Day Immersion Schedule
          </h3>
          <p style={{ fontSize: '13px', color: '#0f172a', margin: '4px 0 0 0' }}>
            Interactive time-slot agenda, venues, and official dress codes
          </p>
        </div>
        
        {/* Navigation Tabs between Timeline & DressCode */}
        <div style={{ display: 'flex', background: '#eff6ff', padding: '4px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
          <button
            onClick={() => setActiveSubTab('schedule')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: activeSubTab === 'schedule' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'schedule' ? '#2563eb' : '#0f172a',
              boxShadow: activeSubTab === 'schedule' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Daywise Timeline
          </button>
          <button
            onClick={() => setActiveSubTab('dresscode')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              background: activeSubTab === 'dresscode' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'dresscode' ? '#2563eb' : '#0f172a',
              boxShadow: activeSubTab === 'dresscode' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Dress Codes & Venues
          </button>
        </div>
      </div>

      {activeSubTab === 'schedule' && (
        <>
          {/* Day selection tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid #bfdbfe' }}>
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: '800',
                  border: '1px solid',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  background: selectedDay === d ? '#2563eb' : '#ffffff',
                  color: selectedDay === d ? '#ffffff' : '#0f172a',
                  borderColor: selectedDay === d ? '#2563eb' : '#bfdbfe',
                  boxShadow: selectedDay === d ? '0 4px 10px rgba(37,99,235,0.2)' : 'none'
                }}
              >
                Day {d} {d === 1 ? '(Arrival)' : d === 5 ? '(Departure)' : ''}
              </button>
            ))}
          </div>

          {/* Timeline Wrapper */}
          <div style={{ position: 'relative', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            {/* Vertical Line */}
            <div 
              style={{ 
                position: 'absolute', 
                left: '27px', 
                top: '15px', 
                bottom: '15px', 
                width: '2px', 
                background: '#bfdbfe', 
                zIndex: 0 
              }} 
            />

            {detailedSchedule[selectedDay]?.map((activity, idx) => {
              const styles = getActivityStyles(activity.type)
              return (
                <div 
                  key={idx} 
                  style={{ 
                    position: 'relative', 
                    display: 'flex', 
                    gap: '20px', 
                    zIndex: 1,
                    alignItems: 'flex-start' 
                  }}
                >
                  {/* Timeline dot */}
                  <div 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: '#ffffff', 
                      border: `3px solid ${styles.border}`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0,
                      marginTop: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: styles.text }} />
                  </div>

                  {/* Card Content */}
                  <div 
                    style={{ 
                      flex: 1, 
                      background: '#ffffff', 
                      border: '1px solid #bfdbfe', 
                      borderLeft: `4px solid ${styles.text}`,
                      borderRadius: '12px', 
                      padding: '16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px'
                    }}
                  >
                    {/* Top Row: Time & Type Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '12.5px', 
                          fontWeight: '800', 
                          color: '#2563eb', 
                          background: '#eff6ff', 
                          padding: '4px 10px', 
                          borderRadius: '8px' 
                        }}
                      >
                        <Clock size={13} style={{ color: '#2563eb' }} />
                        {activity.time}
                      </span>

                      <span 
                        style={{ 
                          fontSize: '11px', 
                          fontWeight: '750', 
                          color: styles.text, 
                          background: styles.bg, 
                          border: `1px solid ${styles.border}`,
                          padding: '3px 8px', 
                          borderRadius: '6px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {styles.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 style={{ fontSize: '15px', fontWeight: '850', color: '#0f172a', margin: 0 }}>
                      {activity.title}
                    </h4>

                    {/* Meta info: Venue, Dress, Group Tracks */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#0f172a', marginTop: '2px' }}>
                      {activity.location && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} style={{ color: '#2563eb' }} />
                          <strong>Venue:</strong> {activity.location}
                        </span>
                      )}

                      {activity.dress && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Shirt size={13} style={{ color: '#2563eb' }} />
                          <strong>Dress:</strong> {activity.dress}
                        </span>
                      )}
                    </div>

                    {/* Split group track banner if available */}
                    {activity.groupTrack && (
                      <div 
                        style={{ 
                          background: 'linear-gradient(90deg, #ffffff 0%, #eff6ff 100%)', 
                          border: '1px solid #bfdbfe',
                          borderRadius: '8px', 
                          padding: '8px 12px', 
                          fontSize: '12px', 
                          fontWeight: '700',
                          color: '#1d4ed8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '4px'
                        }}
                      >
                        <Sparkles size={13} style={{ color: '#2563eb' }} />
                        <span>Squad Track: {activity.groupTrack}</span>
                      </div>
                    )}

                    {/* Description */}
                    {activity.description && (
                      <p style={{ fontSize: '13px', color: '#0f172a', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeSubTab === 'dresscode' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }} className="animate-fade-in">
          {/* Informative Alert */}
          <div 
            style={{ 
              background: '#eff6ff', 
              border: '1px solid #bfdbfe', 
              borderRadius: '12px', 
              padding: '16px', 
              display: 'flex', 
              gap: '12px',
              alignItems: 'flex-start' 
            }}
          >
            <Info size={20} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Dress Code Compliance Guidelines</h4>
              <p style={{ fontSize: '12px', color: '#0f172a', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                All participants must wear the specified uniform for each session. Changing times are allocated in the schedule. Failure to wear the designated dress order is a violation of the LTC discipline policies.
              </p>
            </div>
          </div>

          {/* Table of dress code guidelines */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#eff6ff', borderBottom: '1.5px solid #bfdbfe' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '750', color: '#0f172a' }}>Activity / Event</th>
                  <th style={{ padding: '12px 16px', fontWeight: '750', color: '#0f172a' }}>Location / Venue</th>
                  <th style={{ padding: '12px 16px', fontWeight: '750', color: '#0f172a' }}>Dress Order</th>
                  <th style={{ padding: '12px 16px', fontWeight: '750', color: '#0f172a' }}>Reference</th>
                </tr>
              </thead>
              <tbody>
                {dressCodeRules.map((rule, index) => (
                  <tr 
                    key={index} 
                    style={{ 
                      borderBottom: index < dressCodeRules.length - 1 ? '1px solid #bfdbfe' : 'none', 
                      transition: 'background-color 0.2s' 
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} 
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>{rule.activity}</td>
                    <td style={{ padding: '12px 16px', color: '#0f172a' }}>Venue: {rule.venue}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2563eb' }}>Dress: {rule.dress}</td>
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontStyle: 'italic', fontSize: '12px' }}>{rule.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
