import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '../layouts/AppLayout'
import { AdminDashboardPage, AdminLoginPage } from '../pages/admin/AdminPages'
import { HostPage, JoinPage } from '../pages/group/GroupPages'
import {
  IndividualPage,
  ResultsPage,
} from '../pages/individual/SimulationPages'
import {
  DonatePage,
  LearnPage,
  NotFoundPage,
} from '../pages/public/InformationPages'
import { LandingPage } from '../pages/public/LandingPage'
import { AdminRouteBoundary } from './AdminRouteBoundary'
import { paths } from './paths'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={paths.home} element={<LandingPage />} />
        <Route path={paths.learn} element={<LearnPage />} />
        <Route path={paths.donate} element={<DonatePage />} />
        <Route
          path={paths.introduction}
          element={<Navigate to={paths.individual} replace />}
        />
        <Route path={paths.individual} element={<IndividualPage />} />
        <Route path={paths.results} element={<ResultsPage />} />
        <Route path={paths.host} element={<HostPage />} />
        <Route path={paths.join} element={<JoinPage />} />
        <Route path={paths.adminLogin} element={<AdminLoginPage />} />
        <Route element={<AdminRouteBoundary />}>
          <Route path={paths.adminDashboard} element={<AdminDashboardPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
