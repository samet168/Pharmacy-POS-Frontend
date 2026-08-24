'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Moon, Sun, Globe, Type } from 'lucide-react';
import { toast } from 'sonner';

export default function POSSettingsPage() {
  const [settings, setSettings] = useState({
    theme: 'system',
    language: 'km',
    fontScale: 'normal',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings logic
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Configure your POS preferences</p>
      </div>

      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 ${
                    settings.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-sm">Light</span>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 ${
                    settings.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-sm">Dark</span>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'system' })}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 ${
                    settings.theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <Type className="h-5 w-5" />
                  <span className="text-sm">System</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Font Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSettings({ ...settings, fontScale: 'normal' })}
                  className={`p-3 border-2 rounded-lg ${
                    settings.fontScale === 'normal' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setSettings({ ...settings, fontScale: 'large' })}
                  className={`p-3 border-2 rounded-lg ${
                    settings.fontScale === 'large' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  Large
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Language</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSettings({ ...settings, language: 'km' })}
              className={`p-3 border-2 rounded-lg flex items-center gap-2 ${
                settings.language === 'km' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
              }`}
            >
              <Globe className="h-5 w-5" />
              <span>ខ្មែរ (Khmer)</span>
            </button>
            <button
              onClick={() => setSettings({ ...settings, language: 'en' })}
              className={`p-3 border-2 rounded-lg flex items-center gap-2 ${
                settings.language === 'en' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
              }`}
            >
              <Globe className="h-5 w-5" />
              <span>English</span>
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Security</h2>
          <Button variant="outline" className="w-full mb-2">
            Change Password
          </Button>
          <Button variant="outline" className="w-full text-red-600 hover:text-red-800">
            Sign Out
          </Button>
        </Card>

        <Button onClick={handleSave} loading={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}