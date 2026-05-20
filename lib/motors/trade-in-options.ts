export const MAKES: string[] = [
  'Acura',
  'Arctic Cat',
  'Audi',
  'BMW',
  'Buick',
  'Cadillac',
  'Can-Am',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ford',
  'GMC',
  'HISUN',
  'Honda',
  'HUMMER',
  'Hyundai',
  'INFINITI',
  'Jeep',
  'Kia',
  'Land Rover',
  'Lexus',
  'Lincoln',
  'Mazda',
  'Mercedes-Benz',
  'Mitsubishi',
  'Nissan',
  'Porsche',
  'Ram',
  'Subaru',
  'Tesla',
  'Toyota',
  'Volkswagen',
  'Volvo',
  'Other',
]

export const CATEGORIES: string[] = [
  'Car',
  'Truck',
  'SUV/Crossover',
  'Van',
  'ATV/SBS',
  'Other',
]

export interface ConditionOption {
  value: string
  label: string
  descriptor: string
}

export const CONDITIONS: ConditionOption[] = [
  { value: 'excellent', label: 'Excellent', descriptor: 'Looks and drives like new, no known issues' },
  { value: 'good',      label: 'Good',      descriptor: 'Minor cosmetic wear, mechanically sound' },
  { value: 'fair',      label: 'Fair',      descriptor: 'Visible wear, some maintenance needed' },
  { value: 'poor',      label: 'Poor',      descriptor: 'Significant issues, may not be drivable' },
]

export const OWNERSHIP_OPTIONS: string[] = [
  'Owned outright',
  'Still financing',
  'Lease return',
  'Not sure',
]
