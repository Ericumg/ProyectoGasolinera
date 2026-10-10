export const INITIAL_STATE = {
  nextId: 1,
  prices: {
    SUPER: { id: 'SUPER', name: 'Gasolina Súper (95 Octanos)', price: 38.5 },
    REGULAR: { id: 'REGULAR', name: 'Gasolina Regular (88 Octanos)', price: 37.0 },
    DIESEL: { id: 'DIESEL', name: 'Diésel Ultra Bajo en Azufre', price: 34.5 }
  },
  pumps: [1, 2, 3, 4].map((id, i) => ({
    id, fuelKey: ['SUPER', 'REGULAR', 'DIESEL', 'SUPER'][i], state: 'INACTIVO',
    currentTotal: 0, targetTotal: 0, currentGallons: 0
  })),
  tanks: [
    { id: 1, fuelKey: 'SUPER', capacity: 3000, currentGallons: 2200 },
    { id: 2, fuelKey: 'REGULAR', capacity: 3000, currentGallons: 1100 },
    { id: 3, fuelKey: 'DIESEL', capacity: 4000, currentGallons: 3100 }
  ],
  tickets: [],
  invoices: [],
  incidents: [],
  shift: null,
  shifts: [],
  reconciliations: []
};
export const TOLERANCIA_PCT = 0.5;
export const STEP_Q = 5; // Quetzales por ciclo de simulación
export const TICK_MS = 300;
export const IVA = 1.12;
