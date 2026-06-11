export type VehicleStatus = 'available' | 'pending' | 'sold'

export interface Vehicle {
  id: string
  dealer_id: string
  vin: string
  stock_number: string
  year: number
  make: string
  model: string
  trim: string
  body_style: string
  mileage: number
  price: number
  msrp?: number
  status: VehicleStatus
  images: string[]
  fuel_type: string
  transmission: string
  exterior_color: string
  interior_color: string
  features: string[]
  description?: string
  updated_at: string
}

export interface MotorsLeadTradeIn {
  category: string
  year: string
  make: string
  model: string
  trim?: string
  mileage: string
  condition: string
  ownership: string
  postalCode?: string
  upgrade?: string
}

export interface MotorsLead {
  id: string
  submittedAt: string
  name: string
  phone: string
  email?: string
  vehicleInterest?: string
  vin?: string
  creditRange?: string
  monthlyIncome?: string
  employmentStatus?: string
  message?: string
  status: 'new' | 'contacted' | 'approved' | 'closed' | 'dead'
  source: 'credit-form' | 'vehicle-form' | 'trade-in'
  deliveryStatus: 'sent' | 'failed'
  tradeIn?: MotorsLeadTradeIn
}

export interface InventoryFilters {
  make?: string
  model?: string
  year_min?: number
  year_max?: number
  price_min?: number
  price_max?: number
  status?: VehicleStatus
  search?: string
}
