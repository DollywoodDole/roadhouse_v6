import VehicleCard from '@/components/motors/VehicleCard'
import type { Vehicle } from '@/types/inventory'

interface InventoryGridProps {
  vehicles: Vehicle[]
}

export default function InventoryGrid({ vehicles }: InventoryGridProps) {
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-white/30 text-lg font-medium">No vehicles match your filters.</p>
        <p className="text-white/20 text-sm mt-2">Try adjusting or clearing your search criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.map((vehicle, i) => (
        <VehicleCard key={vehicle.vin} vehicle={vehicle} index={i} />
      ))}
    </div>
  )
}
