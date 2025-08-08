'use client';

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';

interface Patient {
  id?: string;
  name: string;
  email: string;
  phone?: string;
}

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patient: Patient) => void;
  currentPatient?: Patient | null;
}

export default function PatientModal({ isOpen, onClose, onSelectPatient, currentPatient }: PatientModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form fields for new patient
  const [formData, setFormData] = useState<Patient>({
    name: '',
    email: '',
    phone: '',
  });

  // Fetch patients from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/patients`);
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  // Smart search with API
  useEffect(() => {
    const searchPatients = async () => {
      if (!searchTerm.trim()) {
        setFilteredPatients(patients);
        setIsCreatingNew(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/patients?search=${encodeURIComponent(searchTerm)}`);
        if (response.ok) {
          const data = await response.json();
          setFilteredPatients(data);
        }
      } catch (error) {
        console.error('Failed to search patients:', error);
        // Fallback to local filtering
        const term = searchTerm.toLowerCase();
        const filtered = patients.filter(patient => 
          patient.name.toLowerCase().includes(term) ||
          patient.email.toLowerCase().includes(term) ||
          patient.phone?.toLowerCase().includes(term)
        );
        setFilteredPatients(filtered);
      }
      // Auto-fill form if search looks like new patient data
      if (filteredPatients.length === 0) {
        setIsCreatingNew(true);
        
        // Check if search term looks like an email
        if (searchTerm.includes('@')) {
          setFormData(prev => ({ ...prev, email: searchTerm }));
        } 
        // Check if it looks like a phone number
        else if (/^\d{3}-?\d{3}-?\d{4}$/.test(searchTerm.replace(/\D/g, ''))) {
          setFormData(prev => ({ ...prev, phone: searchTerm }));
        }
        // Otherwise assume it's a name
        else {
          setFormData(prev => ({ ...prev, name: searchTerm }));
        }
      } else {
        setIsCreatingNew(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchPatients();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, patients]);

  const handleSelectPatient = (patient: Patient) => {
    onSelectPatient(patient);
    onClose();
    // Reset form
    setSearchTerm('');
    setFormData({ name: '', email: '', phone: '' });
  };

  const handleCreateNewPatient = () => {
    if (!formData.name || !formData.email) {
      alert('Please provide at least name and email');
      return;
    }
    
    handleSelectPatient(formData);
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select or Add Patient
              </h3>
              <button
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Search by name, email, or phone..."
              />
            </div>

            {/* Current Patient */}
            {currentPatient && !searchTerm && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">Current Patient</p>
                <p className="text-sm text-blue-700">{currentPatient.name}</p>
                <p className="text-sm text-blue-600">{currentPatient.email}</p>
                {currentPatient.phone && (
                  <p className="text-sm text-blue-600">{currentPatient.phone}</p>
                )}
              </div>
            )}

            {/* Search Results or New Patient Form */}
            <div className="max-h-96 overflow-y-auto">
              {!isCreatingNew ? (
                // Existing Patients List
                <div className="space-y-2">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                        {patient.phone && (
                          <p className="text-sm text-gray-500">{patient.phone}</p>
                        )}
                      </button>
                    ))
                  ) : searchTerm ? (
                    <div className="text-center py-8">
                      <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        No patients found. Fill in the form below to add a new patient.
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      Start typing to search for patients
                    </p>
                  )}
                </div>
              ) : (
                // New Patient Form
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Add New Patient</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Enter patient name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="patient@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (for SMS payment links)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="555-555-5555"
                    />
                  </div>

                  <button
                    onClick={handleCreateNewPatient}
                    disabled={!formData.name || !formData.email}
                    className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add New Patient
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}