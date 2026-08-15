'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/utils/errorHandler';
import { subscriptionPlansApi, SubscriptionPlan, SubscriptionPlanRequest } from '@/lib/api/subscriptionPlans';
import { CreditCard, Building2, Users, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Crown, Zap, Shield } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';

export default function SubscriptionsPage() {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionPlansApi.getByOrganization(organizationId);
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [organizationId]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'TRIAL': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'SUSPENDED': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TRIAL':
        return <Clock className="h-4 w-4" />;
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4" />;
      case 'SUSPENDED':
        return <AlertTriangle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <LoadingSkeleton variant="text" width={200} height={32} />
            <LoadingSkeleton variant="text" width={400} height={20} className="mt-2" />
          </div>
          <LoadingSkeleton variant="rectangular" width={150} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-bento-primary dark:text-slate-100">
            Subscriptions
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage subscription plans and billing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchSubscriptions}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-2"
          >
            <Crown className="h-4 w-4" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-bento-primary/10 rounded-xl">
              <Building2 className="h-6 w-6 text-bento-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Plans</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {subscriptions.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {subscriptions.filter(s => s.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Trial</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {subscriptions.filter(s => s.status === 'TRIAL').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-bento-primary dark:text-slate-100">
                {subscriptions.filter(s => getDaysRemaining(s.endsAt) <= 30 && getDaysRemaining(s.endsAt) > 0).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold text-bento-primary dark:text-slate-100 mb-4">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-2 border-bento-primary/20">
            <div className="text-center mb-6">
              <div className="p-3 bg-bento-primary/10 rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-6 w-6 text-bento-primary" />
              </div>
              <h3 className="text-xl font-bold text-bento-primary dark:text-slate-100">Starter</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Perfect for small pharmacies</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-bento-primary dark:text-slate-100">$29</span>
                <span className="text-slate-500 dark:text-slate-400">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Up to 3 branches
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Up to 10 users
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Basic inventory
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Standard support
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast.info('Contact sales for Starter plan')}
            >
              Get Started
            </Button>
          </Card>

          <Card className="p-6 border-2 border-bento-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-bento-primary text-white text-xs px-3 py-1 rounded-full">
              Popular
            </div>
            <div className="text-center mb-6">
              <div className="p-3 bg-bento-primary/10 rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Crown className="h-6 w-6 text-bento-primary" />
              </div>
              <h3 className="text-xl font-bold text-bento-primary dark:text-slate-100">Professional</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">For growing pharmacies</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-bento-primary dark:text-slate-100">$79</span>
                <span className="text-slate-500 dark:text-slate-400">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Up to 10 branches
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Up to 50 users
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Advanced inventory
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Priority support
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Analytics & reports
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => toast.info('Contact sales for Professional plan')}
            >
              Get Started
            </Button>
          </Card>

          <Card className="p-6 border-2 border-bento-primary/20">
            <div className="text-center mb-6">
              <div className="p-3 bg-bento-primary/10 rounded-xl w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-6 w-6 text-bento-primary" />
              </div>
              <h3 className="text-xl font-bold text-bento-primary dark:text-slate-100">Enterprise</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">For large pharmacy chains</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-bento-primary dark:text-slate-100">$199</span>
                <span className="text-slate-500 dark:text-slate-400">/month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Unlimited branches
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Unlimited users
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Full inventory suite
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                24/7 dedicated support
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Custom integrations
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => toast.info('Contact sales for Enterprise plan')}
            >
              Contact Sales
            </Button>
          </Card>
        </div>
      </div>

      {/* Current Subscriptions */}
      <div>
        <h2 className="text-xl font-semibold text-bento-primary dark:text-slate-100 mb-4">
          Current Subscriptions
        </h2>
        <Card className="overflow-hidden">
          {subscriptions.length === 0 ? (
            <EmptyState
              title="No active subscriptions"
              description="You don't have any active subscriptions. Choose a plan to get started."
              action={
                <Button onClick={() => setShowUpgradeModal(true)} className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  View Plans
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Plan</TableHeader>
                    <TableHeader>Organization</TableHeader>
                    <TableHeader>Branches</TableHeader>
                    <TableHeader>Users</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Start Date</TableHeader>
                    <TableHeader>End Date</TableHeader>
                    <TableHeader>Days Remaining</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const daysRemaining = getDaysRemaining(sub.endsAt);
                    const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
                    const isExpired = daysRemaining <= 0;
                    
                    return (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.planName}</TableCell>
                        <TableCell>#{sub.organizationId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span>{sub.maxBranches}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{sub.maxUsers}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                            {getStatusIcon(sub.status)}
                            {sub.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(sub.startsAt)}</TableCell>
                        <TableCell>{formatDate(sub.endsAt)}</TableCell>
                        <TableCell>
                          {isExpired ? (
                            <span className="text-red-600 dark:text-red-400 font-medium">Expired</span>
                          ) : isExpiringSoon ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">{daysRemaining} days</span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">{daysRemaining} days</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPlan(sub);
                                setShowUpgradeModal(true);
                              }}
                              className="flex items-center gap-1"
                            >
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={selectedPlan ? 'Manage Subscription' : 'Choose a Plan'}
      >
        <div className="space-y-4">
          {selectedPlan ? (
            <>
              <div className="p-4 bg-bento-bg dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-bento-primary dark:text-slate-100">{selectedPlan.planName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Organization #{selectedPlan.organizationId}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPlan.status)}`}>
                    {selectedPlan.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Max Branches</p>
                    <p className="font-medium">{selectedPlan.maxBranches}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Max Users</p>
                    <p className="font-medium">{selectedPlan.maxUsers}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Start Date</p>
                    <p className="font-medium">{formatDate(selectedPlan.startsAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">End Date</p>
                    <p className="font-medium">{formatDate(selectedPlan.endsAt)}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => toast.info('Upgrade subscription - Coming soon')}
                  className="flex-1"
                >
                  Upgrade Plan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.info('Cancel subscription - Coming soon')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Choose a subscription plan that fits your pharmacy's needs. You can upgrade or downgrade at any time.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => toast.info('Contact sales to get started')}
                  className="flex-1"
                >
                  Contact Sales
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}