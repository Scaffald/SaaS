import type { MapPin } from './types'

export const mockMapPins: MapPin[] = [
  {
    id: 'pin-1',
    coordinate: [-83.0458, 42.3314], // Detroit, MI
    title: 'Sarah Johnson',
    subtitle: 'Electrician • 12 years experience',
    score: 95,
    hourlyRate: 45,
    availability: 'available',
    organization: 'Individual',
    badges: [
      { id: 'osha', label: 'OSHA 30', tone: 'success' },
      { id: 'electrical', label: 'Master Electrician', tone: 'success' },
    ],
  },
  {
    id: 'pin-2',
    coordinate: [-85.6681, 42.9634], // Grand Rapids, MI
    title: 'Mike Rodriguez',
    subtitle: 'Welder • 8 years experience',
    score: 88,
    hourlyRate: 38,
    availability: 'unavailable',
    organization: 'Individual',
    badges: [
      { id: 'welding', label: 'AWS Certified', tone: 'success' },
      { id: 'safety', label: 'Safety Certified', tone: 'warning' },
    ],
  },
  {
    id: 'pin-3',
    coordinate: [-84.5555, 42.7325], // Lansing, MI
    title: 'Industrial Solutions LLC',
    subtitle: 'Commercial contractor',
    score: 92,
    availability: 'available',
    organization: 'Organization',
    badges: [
      { id: 'bonded', label: 'Licensed & Bonded', tone: 'success' },
      { id: 'commercial', label: 'Commercial', tone: 'success' },
    ],
  },
  {
    id: 'pin-4',
    coordinate: [-81.6944, 41.4993], // Cleveland, OH
    title: 'David Kim',
    subtitle: 'Plumber • 15 years experience',
    score: 90,
    hourlyRate: 42,
    availability: 'available',
    organization: 'Individual',
    badges: [
      { id: 'plumbing', label: 'Master Plumber', tone: 'success' },
      { id: 'hvac', label: 'HVAC Certified', tone: 'success' },
    ],
  },
  {
    id: 'pin-5',
    coordinate: [-82.9988, 39.9612], // Columbus, OH
    title: 'Jessica Martinez',
    subtitle: 'Carpenter • 6 years experience',
    score: 82,
    hourlyRate: 35,
    availability: 'unavailable',
    organization: 'Individual',
    badges: [
      { id: 'carpentry', label: 'Carpentry', tone: 'success' },
      { id: 'framing', label: 'Framing', tone: 'success' },
    ],
  },
  {
    id: 'pin-6',
    coordinate: [-84.512, 39.1031], // Cincinnati, OH
    title: 'BuildRight Construction',
    subtitle: 'General contractor',
    score: 87,
    availability: 'available',
    organization: 'Organization',
    badges: [
      { id: 'gc', label: 'General Contractor', tone: 'success' },
      { id: 'residential', label: 'Residential', tone: 'warning' },
    ],
  },
  {
    id: 'pin-7',
    coordinate: [-86.1581, 39.7684], // Indianapolis, IN
    title: 'Alex Thompson',
    subtitle: 'HVAC Technician • 10 years experience',
    score: 86,
    hourlyRate: 40,
    availability: 'available',
    organization: 'Individual',
    badges: [
      { id: 'hvac', label: 'EPA Certified', tone: 'success' },
      { id: 'commercial', label: 'Commercial HVAC', tone: 'success' },
    ],
  },
  {
    id: 'pin-8',
    coordinate: [-87.6298, 41.8781], // Chicago, IL
    title: 'Maria Garcia',
    subtitle: 'Painter • 9 years experience',
    score: 84,
    hourlyRate: 36,
    availability: 'unavailable',
    organization: 'Individual',
    badges: [
      { id: 'painting', label: 'Interior/Exterior', tone: 'success' },
      { id: 'commercial', label: 'Commercial', tone: 'warning' },
    ],
  },
  {
    id: 'pin-9',
    coordinate: [-87.9065, 43.0389], // Milwaukee, WI
    title: 'Precision Metalworks',
    subtitle: 'Specialized fabrication',
    score: 91,
    availability: 'available',
    organization: 'Organization',
    badges: [
      { id: 'welding', label: 'Certified Welding', tone: 'success' },
      { id: 'fabrication', label: 'Custom Fabrication', tone: 'success' },
    ],
  },
  {
    id: 'pin-10',
    coordinate: [-93.265, 44.9778], // Minneapolis, MN
    title: 'Robert Chen',
    subtitle: 'Roofer • 14 years experience',
    score: 89,
    hourlyRate: 41,
    availability: 'available',
    organization: 'Individual',
    badges: [
      { id: 'roofing', label: 'Commercial Roofing', tone: 'success' },
      { id: 'safety', label: 'Fall Protection', tone: 'success' },
    ],
  },
]

export const defaultMapCenter: [number, number] = [-84.5555, 42.7325] // Lansing, MI
export const defaultMapZoom = 7
export const defaultRadius = 150000 // 150km in meters
