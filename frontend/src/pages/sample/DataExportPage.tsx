import { useState } from 'react';
import { Database, Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RBACGuard } from '@/components/common/RBACGuard';
import { FeatureFlagGuard } from '@/components/common/FeatureFlagGuard';

const exportOptions = [
  { id: 'users', label: 'Users', description: 'User accounts and profiles' },
  { id: 'transactions', label: 'Transactions', description: 'All transaction records' },
  { id: 'audit_logs', label: 'Audit Logs', description: 'System activity logs' },
  { id: 'settings', label: 'Settings', description: 'Organization configuration' },
];

const formatOptions = [
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Comma-separated values' },
  { id: 'json', label: 'JSON', icon: FileJson, description: 'JavaScript Object Notation' },
  { id: 'xlsx', label: 'Excel', icon: FileText, description: 'Microsoft Excel format' },
];

export function DataExportPage() {
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleDataToggle = (id: string) => {
    setSelectedData((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsExporting(false);
    alert('Export completed! (Demo)');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Export</h1>
        <p className="text-muted-foreground">Export your organization data in various formats.</p>
      </div>

      <FeatureFlagGuard flagKey="data_export">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Data Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Data</CardTitle>
              <CardDescription>Choose what data to include in your export.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {exportOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 rounded-lg border p-4"
                >
                  <Checkbox
                    id={option.id}
                    checked={selectedData.includes(option.id)}
                    onCheckedChange={() => handleDataToggle(option.id)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={option.id} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
              <CardDescription>Choose the format for your exported data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formatOptions.map((format) => (
                <div
                  key={format.id}
                  className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedFormat === format.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedFormat(format.id)}
                >
                  <div
                    className={`rounded-lg p-2 ${
                      selectedFormat === format.id ? 'bg-primary/10' : 'bg-muted'
                    }`}
                  >
                    <format.icon
                      className={`h-5 w-5 ${
                        selectedFormat === format.id ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{format.label}</p>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </div>
                  {selectedFormat === format.id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Export Button */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">Ready to export</p>
              <p className="text-sm text-muted-foreground">
                {selectedData.length} data type(s) selected, exporting as {selectedFormat.toUpperCase()}
              </p>
            </div>
            <RBACGuard menuSlug="data-export" action="create">
              <Button
                onClick={handleExport}
                disabled={selectedData.length === 0 || isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </RBACGuard>
          </CardContent>
        </Card>
      </FeatureFlagGuard>

      <FeatureFlagGuard flagKey="data_export" fallback={
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Data Export Disabled</h3>
            <p className="text-muted-foreground max-w-md mt-2">
              Data export is currently disabled for your organization. Contact your administrator
              to enable this feature.
            </p>
          </CardContent>
        </Card>
      }>
        <></>
      </FeatureFlagGuard>
    </div>
  );
}
