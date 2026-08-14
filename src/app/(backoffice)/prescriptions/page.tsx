'use client';

import { useState, useEffect } from 'react';
import { prescriptionsApi, customersApi, doctorsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Plus, Search, Edit, Trash2, Eye, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prescriptionsData, customersData, doctorsData] = await Promise.all([
        prescriptionsApi.listAll(),
        customersApi.listAll(),
        doctorsApi.listAll(),
      ]);
      setPrescriptions(prescriptionsData);
      setCustomers(customersData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (id: number) => {
    const customer = customers.find(c => c.id === id);
    return customer?.name || `Customer #${id}`;
  };

  const getDoctorName = (id: number) => {
    const doctor = doctors.find(d => d.id === id);
    return doctor?.name || `Doctor #${id}`;
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    getCustomerName(prescription.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDoctorName(prescription.doctorId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prescription.diagnosis && prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-slate-600">Manage customer prescriptions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Customer</TableHeader>
              <TableHeader>Doctor</TableHeader>
              <TableHeader>Date</TableHeader>
              <TableHeader>Diagnosis</TableHeader>
              <TableHeader>Allergy Check</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrescriptions.map((prescription) => (
              <TableRow key={prescription.id}>
                <TableCell className="font-semibold">{getCustomerName(prescription.customerId)}</TableCell>
                <TableCell>{getDoctorName(prescription.doctorId)}</TableCell>
                <TableCell>{new Date(prescription.prescriptionDate).toLocaleDateString()}</TableCell>
                <TableCell>{prescription.diagnosis || '-'}</TableCell>
                <TableCell>
                  <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Check
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-blue-600 hover:text-blue-800">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}