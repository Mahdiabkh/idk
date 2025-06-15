import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Consultations from './pages/Consultations'
import ConsultationForm from './pages/ConsultationForm'
import PrescriptionForm from './pages/PrescriptionForm'
import Prescriptions from './pages/Prescriptions'
import AdminDashboard from './pages/admin/AdminDashboard'
import DataImport from './pages/admin/DataImport'
import DoctorManagement from './pages/admin/DoctorManagement'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="patients" element={<Patients />} />
                <Route path="consultations" element={<Consultations />} />
                <Route path="consultations/new" element={<ConsultationForm />} />
                <Route path="consultations/:id/edit" element={<ConsultationForm />} />
                <Route path="consultations/:id/prescription" element={<PrescriptionForm />} />
                <Route path="prescriptions" element={<Prescriptions />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/import" element={<DataImport />} />
                <Route path="admin/doctors" element={<DoctorManagement />} />
              </Route>
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  )
}

export default App