'use client';

import { useState, useEffect } from 'react';
import { activeIngredientsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ActiveIngredientsPage() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    nameKh: '',
    description: '',
  });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const data = await activeIngredientsApi.listAll();
      const dataArray = Array.isArray(data) ? data : (data?.content || []);
      setIngredients(dataArray);
    } catch (error) {
      console.error('Failed to fetch active ingredients:', error);
      toast.error('Failed to load active ingredients. Please try again.');
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ingredient.nameKh?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setSubmitting(true);
      await activeIngredientsApi.create(formData);
      toast.success('Active ingredient created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchIngredients();
    } catch (error) {
      console.error('Failed to create active ingredient:', error);
      toast.error('Failed to create active ingredient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      await activeIngredientsApi.update(selectedIngredient.id, formData);
      toast.success('Active ingredient updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchIngredients();
    } catch (error) {
      console.error('Failed to update active ingredient:', error);
      toast.error('Failed to update active ingredient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await activeIngredientsApi.delete(selectedIngredient.id);
      toast.success('Active ingredient deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedIngredient(null);
      fetchIngredients();
    } catch (error) {
      console.error('Failed to delete active ingredient:', error);
      toast.error('Failed to delete active ingredient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (ingredient: any) => {
    setSelectedIngredient(ingredient);
    setFormData({
      name: ingredient.name || '',
      nameKh: ingredient.nameKh || '',
      description: ingredient.description || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (ingredient: any) => {
    setSelectedIngredient(ingredient);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameKh: '',
      description: '',
    });
    setSelectedIngredient(null);
  };

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
        <Button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
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
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => openEditModal(ingredient)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-800"
                      onClick={() => openDeleteModal(ingredient)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
        }}
        title={isEditModalOpen ? 'Edit Active Ingredient' : 'Add New Active Ingredient'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ingredient Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter ingredient name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name (Khmer)
            </label>
            <Input
              value={formData.nameKh}
              onChange={(e) => setFormData({ ...formData, nameKh: e.target.value })}
              placeholder="Enter name in Khmer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                resetForm();
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={isEditModalOpen ? handleUpdate : handleCreate}
              disabled={submitting || !formData.name}
            >
              {submitting ? 'Saving...' : isEditModalOpen ? 'Update Ingredient' : 'Create Ingredient'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedIngredient(null);
        }}
        title="Delete Active Ingredient"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete active ingredient <strong>{selectedIngredient?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedIngredient(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Ingredient'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}