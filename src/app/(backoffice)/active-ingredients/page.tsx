'use client';

import { useState, useEffect } from 'react';
import { activeIngredientsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function ActiveIngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const data = await activeIngredientsApi.listAll();
      setIngredients(data);
    } catch (error) {
      console.error('Failed to fetch active ingredients:', error);
      toast.error('Failed to load active ingredients');
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ingredient.nameKh?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Ingredients</h1>
          <p className="text-slate-600">Manage drug active ingredients</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Ingredient
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Name (Khmer)</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredIngredients.map((ingredient) => (
              <TableRow key={ingredient.id}>
                <TableCell>{ingredient.name}</TableCell>
                <TableCell>{ingredient.nameKh || '-'}</TableCell>
                <TableCell>{ingredient.description || '-'}</TableCell>
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