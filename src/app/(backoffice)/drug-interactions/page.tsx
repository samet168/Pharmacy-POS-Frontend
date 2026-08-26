'use client';

import { useState, useEffect } from 'react';
import { drugInteractionsApi, activeIngredientsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PageSkeleton, TableSkeleton, CardSkeleton, LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function DrugInteractionsPage() {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    activeIngredientAId: '',
    activeIngredientBId: '',
    severity: 'MODERATE' as 'LOW' | 'MODERATE' | 'HIGH' | 'CONTRAINDICATED',
    description: '',
    descriptionKh: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [interactionsData, ingredientsData] = await Promise.all([
        drugInteractionsApi.listAll(),
        activeIngredientsApi.listAll(),
      ]);
      const interactionsArray = Array.isArray(interactionsData) ? interactionsData : (interactionsData?.content || []);
      const ingredientsArray = Array.isArray(ingredientsData) ? ingredientsData : (ingredientsData?.content || []);
      setInteractions(interactionsArray);
      setIngredients(ingredientsArray);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load drug interactions data. Please try again.');
      setInteractions([]);
      setIngredients([]);
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

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setSubmitting(true);
      await drugInteractionsApi.create({
        ...formData,
        activeIngredientAId: parseInt(formData.activeIngredientAId),
        activeIngredientBId: parseInt(formData.activeIngredientBId),
      });
      toast.success('Drug interaction created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to create drug interaction:', error);
      toast.error('Failed to create drug interaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      await drugInteractionsApi.update(selectedInteraction.id, {
        ...formData,
        activeIngredientAId: parseInt(formData.activeIngredientAId),
        activeIngredientBId: parseInt(formData.activeIngredientBId),
      });
      toast.success('Drug interaction updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to update drug interaction:', error);
      toast.error('Failed to update drug interaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await drugInteractionsApi.delete(selectedInteraction.id);
      toast.success('Drug interaction deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedInteraction(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete drug interaction:', error);
      toast.error('Failed to delete drug interaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (interaction: any) => {
    setSelectedInteraction(interaction);
    setFormData({
      activeIngredientAId: interaction.activeIngredientAId?.toString() || '',
      activeIngredientBId: interaction.activeIngredientBId?.toString() || '',
      severity: interaction.severity || 'MODERATE',
      description: interaction.description || '',
      descriptionKh: interaction.descriptionKh || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (interaction: any) => {
    setSelectedInteraction(interaction);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      activeIngredientAId: '',
      activeIngredientBId: '',
      severity: 'MODERATE',
      description: '',
      descriptionKh: '',
    });
    setSelectedInteraction(null);
  };

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;

  if (loading) return <PageSkeleton kpiCards={3} showFilterBar tableRows={7} />;  
  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Drug Interactions</h1>
          <p className="text-slate-600">Manage drug interaction warnings</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
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
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => openEditModal(interaction)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-800"
                      onClick={() => openDeleteModal(interaction)}
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
        title={isEditModalOpen ? 'Edit Drug Interaction' : 'Add New Drug Interaction'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ingredient A <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.activeIngredientAId}
              onChange={(e) => setFormData({ ...formData, activeIngredientAId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
              required
            >
              <option value="">Select ingredient</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ingredient B <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.activeIngredientBId}
              onChange={(e) => setFormData({ ...formData, activeIngredientBId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
              required
            >
              <option value="">Select ingredient</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Severity <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bento-primary dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
              required
            >
              <option value="LOW">Low</option>
              <option value="MODERATE">Moderate</option>
              <option value="HIGH">High</option>
              <option value="CONTRAINDICATED">Contraindicated</option>
            </select>
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

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description (Khmer)
            </label>
            <Input
              value={formData.descriptionKh}
              onChange={(e) => setFormData({ ...formData, descriptionKh: e.target.value })}
              placeholder="Enter description in Khmer"
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
              disabled={submitting || !formData.activeIngredientAId || !formData.activeIngredientBId}
            >
              {submitting ? 'Saving...' : isEditModalOpen ? 'Update Interaction' : 'Create Interaction'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedInteraction(null);
        }}
        title="Delete Drug Interaction"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this drug interaction? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedInteraction(null);
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
              {submitting ? 'Deleting...' : 'Delete Interaction'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}