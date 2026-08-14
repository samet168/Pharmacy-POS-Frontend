'use client';

import { useState, useEffect } from 'react';
import { drugInteractionsApi, activeIngredientsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Plus, Search, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function DrugInteractionsPage() {
  const [interactions, setInteractions] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [interactionsData, ingredientsData] = await Promise.all([
        drugInteractionsApi.listAll(),
        activeIngredientsApi.listAll(),
      ]);
      setInteractions(interactionsData);
      setIngredients(ingredientsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load drug interactions');
    } finally {
      setLoading(false);
    }
  };

  const getIngredientName = (id: number) => {
    const ingredient = ingredients.find(i => i.id === id);
    return ingredient?.name || `Ingredient #${id}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CONTRAINDICATED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredInteractions = interactions.filter(interaction =>
    getIngredientName(interaction.activeIngredientAId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getIngredientName(interaction.activeIngredientBId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Drug Interactions</h1>
          <p className="text-slate-600">Manage drug interaction warnings</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Interaction
        </Button>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Input
            placeholder="Search interactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Ingredient A</TableHeader>
              <TableHeader>Ingredient B</TableHeader>
              <TableHeader>Severity</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInteractions.map((interaction) => (
              <TableRow key={interaction.id}>
                <TableCell>{getIngredientName(interaction.activeIngredientAId)}</TableCell>
                <TableCell>{getIngredientName(interaction.activeIngredientBId)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {interaction.severity === 'HIGH' || interaction.severity === 'CONTRAINDICATED' ? (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    ) : null}
                    <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(interaction.severity)}`}>
                      {interaction.severity}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{interaction.description || '-'}</TableCell>
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