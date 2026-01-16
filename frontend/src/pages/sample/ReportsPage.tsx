import { FileText, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RBACGuard } from '@/components/common/RBACGuard';
import { FeatureFlagGuard } from '@/components/common/FeatureFlagGuard';

// Sample report data
const reports = [
  {
    id: 1,
    name: 'Monthly Sales Report',
    description: 'Overview of sales performance for the current month',
    status: 'ready',
    generatedAt: '2025-01-10T10:30:00Z',
    size: '2.4 MB',
  },
  {
    id: 2,
    name: 'User Activity Report',
    description: 'Detailed user engagement metrics',
    status: 'generating',
    generatedAt: null,
    size: null,
  },
  {
    id: 3,
    name: 'Financial Summary Q4',
    description: 'Quarterly financial overview',
    status: 'ready',
    generatedAt: '2025-01-09T14:20:00Z',
    size: '5.1 MB',
  },
  {
    id: 4,
    name: 'Inventory Status',
    description: 'Current inventory levels and movements',
    status: 'ready',
    generatedAt: '2025-01-08T09:15:00Z',
    size: '1.8 MB',
  },
];

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and download reports for your organization.</p>
        </div>
        <RBACGuard menuSlug="reports" action="create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </RBACGuard>
      </div>

      <FeatureFlagGuard flagKey="advanced_analytics">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-full bg-blue-100 p-2">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Advanced Analytics Available</p>
              <p className="text-sm text-blue-700">
                You have access to advanced analytics features including custom report builders.
              </p>
            </div>
          </CardContent>
        </Card>
      </FeatureFlagGuard>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>View and download your generated reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'ready' ? 'default' : 'secondary'}>
                      {report.status === 'ready' ? 'Ready' : 'Generating...'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.generatedAt
                      ? new Date(report.generatedAt).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{report.size || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" disabled={report.status !== 'ready'}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
