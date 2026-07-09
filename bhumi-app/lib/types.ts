export type PropertyStatus = 'Live' | 'Reserved' | 'Sold'
export type PriceType = 'Fixed' | 'Negotiable' | 'On Request'

export interface Property {
  id: string
  code: string
  title: string
  location: string
  zone: 'North' | 'East' | 'South' | 'West'
  extent_acres: number
  price_per_acre_cr: number
  price_type: PriceType
  status: PropertyStatus
  land_use: string
  use_cases: string[]
  road_type: string
  dist_airport_km: number
  dist_city_km: number
  topo: string
  soil: string
  water: string
  conversion: string
  ownership: string
  title_clear: boolean
  risk: 'Low' | 'Moderate' | 'High'
  risk_notes: string
  description: string
  amenities: string
  img_url: string
  featured: boolean
  conn_score: number
  created_at: string
}

export interface Enquiry {
  id: string
  property_id: string
  property_code?: string
  property_title?: string
  name: string
  company: string
  phone: string
  email: string
  intent: 'Enquire' | 'Visit'
  stage: 'New' | 'Contacted' | 'Visit'
  source: string
  notes: string
  created_at: string
}
