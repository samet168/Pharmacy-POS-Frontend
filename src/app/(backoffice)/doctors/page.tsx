'use client';

import { useState, useEffect } from 'react';
import { doctorsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Plus, Search, Edit, Trash2, Eye, User } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const data = await doctorsApi.listAll();
      setDoctors(data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doctor.phone && doctor.phone.includes(searchTerm))
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-slate-600">Manage doctor information</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Specialization</TableHeader>
              <TableHeader>Phone</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>License Number</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDoctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  {doctor.name}
                </TableCell>
                <TableCell>{doctor.specialization || '-'}</TableCell>
                <TableCell>{doctor.phone || '-'}</TableCell>
                <TableCell>{doctor.email || '-'}</TableCell>
                <TableCell>{doctor.licenseNumber || '-'}</TableCell>
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