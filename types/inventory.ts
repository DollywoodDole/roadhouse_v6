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

export interface InventoryFilters {
  make?: string
  model?: string
  year_min?: number
  year_max?: number
  price_min?: number
  price_max?: number
  status?: VehicleStatus
}
