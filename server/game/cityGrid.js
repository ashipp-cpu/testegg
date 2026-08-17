// The city is a fixed 25x25 tile grid. Sectors are hand-placed rectangular
// regions (not a uniform checkerboard — sizes and reading order vary on
// purpose) that tile the grid exactly, with no gaps or overlaps. Row/col
// are 1-indexed to match CSS grid-row/grid-column.
const GRID_SIZE = 25;

const SECTORS = [
  { number: 5, startRow: 1, startCol: 1, rowSpan: 6, colSpan: 6, color: '#2c3542' },
  { number: 7, startRow: 1, startCol: 7, rowSpan: 6, colSpan: 7, color: '#383a22' },
  { number: 2, startRow: 1, startCol: 14, rowSpan: 6, colSpan: 6, color: '#1f3d3a' },
  { number: 3, startRow: 1, startCol: 20, rowSpan: 6, colSpan: 6, color: '#3a2440' },
  { number: 15, startRow: 7, startCol: 1, rowSpan: 7, colSpan: 6, color: '#262e3a' },
  { number: 10, startRow: 7, startCol: 7, rowSpan: 7, colSpan: 7, color: '#204036' },
  { number: 12, startRow: 7, startCol: 14, rowSpan: 7, colSpan: 6, color: '#202c40' },
  { number: 9, startRow: 7, startCol: 20, rowSpan: 7, colSpan: 6, color: '#3a2e22' },
  { number: 1, startRow: 14, startCol: 1, rowSpan: 6, colSpan: 6, color: '#24344a' },
  { number: 13, startRow: 14, startCol: 7, rowSpan: 6, colSpan: 7, color: '#2e3a26' },
  { number: 8, startRow: 14, startCol: 14, rowSpan: 6, colSpan: 6, color: '#2a2a4a' },
  { number: 16, startRow: 14, startCol: 20, rowSpan: 6, colSpan: 6, color: '#34223a' },
  { number: 6, startRow: 20, startCol: 1, rowSpan: 6, colSpan: 6, color: '#3a2430' },
  { number: 4, startRow: 20, startCol: 7, rowSpan: 6, colSpan: 7, color: '#223a24' },
  { number: 11, startRow: 20, startCol: 14, rowSpan: 6, colSpan: 6, color: '#3a2838' },
  { number: 14, startRow: 20, startCol: 20, rowSpan: 6, colSpan: 6, color: '#3a2e20' },
];

module.exports = { GRID_SIZE, SECTORS };
