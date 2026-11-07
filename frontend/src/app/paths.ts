export const paths = {
  home: '/',
  learn: '/learn',
  donate: '/donate',
  data: '/data',
  introduction: '/simulation/introduction',
  individual: '/simulation/individual',
  review: '/simulation/review',
  simulation: '/simulation',
  results: '/simulation/results',
  host: '/group/host',
  join: '/group/join',
  adminLogin: '/admin/login',
  adminDashboard: '/admin/dashboard',
} as const

// Simulation pages share the scenic stage between the header and footer.
export function isStagePath(pathname: string) {
  return pathname === '/simulation' || pathname.startsWith('/simulation/')
}
