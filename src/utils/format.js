export function numberWithCommas(x) {
  if (x === null || x === undefined) return 'N/A';
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
