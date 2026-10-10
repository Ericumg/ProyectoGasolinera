# SGBG - Gasolinera
npm install && npm run dev
Cada módulo vive en src/modules/<nombre>/ y tiene su propia ruta (#/monitor, #/bombas, ...).
El estado global está en src/context/StationContext.jsx (useReducer + localStorage).
