import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  FileText,
  Stethoscope,
  Settings,
  Upload,
  UserCheck
} from 'lucide-react'

const Sidebar = () => {
  const { user } = useAuth()

  const doctorNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/consultations', icon: Stethoscope, label: 'Consultations' },
    { to: '/prescriptions', icon: FileText, label: 'Ordonnances' }
  ]

  const adminNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/admin', icon: Settings, label: 'Administration' },
    { to: '/admin/doctors', icon: UserCheck, label: 'Gestion Médecins' },
    { to: '/admin/import', icon: Upload, label: 'Import Données' }
  ]

  const navItems = user?.role === 'admin' ? adminNavItems : doctorNavItems

  return (
    <div className="bg-white w-64 shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">DynaMed</h2>
            <p className="text-xs text-gray-500">v1.0</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        <div className="px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 mb-1 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          © 2024 DynaMed Platform
        </div>
      </div>
    </div>
  )
}

export default Sidebar