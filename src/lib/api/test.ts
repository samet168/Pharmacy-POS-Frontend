import { apiClient } from './client';

// Simple API test function
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection to:', process.env.NEXT_PUBLIC_API_BASE_URL);
    
    // Test organizations endpoint (should be public)
    const orgs = await apiClient.get('/organizations');
    console.log('Organizations API test passed:', orgs);
    
    // Test dashboard overview (should require auth - this will fail without token)
    try {
      const dashboard = await apiClient.get('/dashboard/overview');
      console.log('Dashboard API test passed:', dashboard);
    } catch (dashboardError) {
      console.log('Dashboard API test failed (expected without auth):', dashboardError);
    }
    
    return { success: true, orgs };
  } catch (error) {
    console.error('API connection test failed:', error);
    return { success: false, error };
  }
};