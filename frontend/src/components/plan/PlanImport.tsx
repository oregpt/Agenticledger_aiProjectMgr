import { useState, useCallback } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProjectStore } from '@/stores/projectStore';
import planItemsApi, { type CsvPreviewResponse, type ImportResult } from '@/api/plan-items.api';

type ImportState = 'idle' | 'preview' | 'importing' | 'complete';

export function PlanImport() {
  const { currentProject, fetchPlanItems } = useProjectStore();
  const [state, setState] = useState<ImportState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      handleFileSelect(droppedFile);
    } else {
      setError('Please drop a CSV file');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!currentProject) {
      setError('No project selected');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setState('preview');

    try {
      const response = await planItemsApi.previewImport(currentProject.id, selectedFile);
      if (response.success && response.data) {
        setPreview(response.data);
        if (response.data.errors.length > 0) {
          setError(response.data.errors.join('\n'));
        }
      } else {
        setError('Failed to preview file');
        setState('idle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview file');
      setState('idle');
    }
  };

  const handleImport = async () => {
    if (!currentProject || !file) return;

    setIsImporting(true);
    setError(null);

    try {
      const response = await planItemsApi.importCsv(currentProject.id, file);
      if (response.success && response.data) {
        setResult(response.data);
        setState('complete');
        // Refresh plan items to show new data
        fetchPlanItems(currentProject.id);
      } else {
        setError('Failed to import');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setState('idle');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleDownloadTemplate = () => {
    const templateUrl = planItemsApi.getTemplateUrl();
    window.open(templateUrl, '_blank');
  };

  // Render based on state
  if (state === 'complete' && result) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Import Complete</CardTitle>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Import Another File
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-900">{result.totalRows}</div>
                <div className="text-sm text-slate-600">Total Rows</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{result.itemsCreated}</div>
                <div className="text-sm text-slate-600">Items Created</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{result.itemsUpdated}</div>
                <div className="text-sm text-slate-600">Items Updated</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-700">
                    {result.errors.length} row(s) had errors
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto text-sm text-yellow-700">
                  {result.errors.map((err, i) => (
                    <div key={i}>
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Switch to the Plan View tab to see the imported items.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === 'preview' && preview) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Preview: {file?.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {preview.rows.length} rows found. Review before importing.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || (preview.errors.length > 0 && preview.rows.length === 0)}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import'
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {preview.rows.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600 border-b">#</th>
                      {preview.headers.map((header) => (
                        <th key={header} className="px-3 py-2 text-left font-medium text-slate-600 border-b">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-3 py-2 text-slate-500 border-b">{idx + 1}</td>
                        {preview.headers.map((header) => (
                          <td key={header} className="px-3 py-2 border-b truncate max-w-xs">
                            {row[header] || <span className="text-slate-300">-</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.rows.length > 50 && (
                <div className="p-3 bg-slate-50 text-center text-sm text-slate-600">
                  Showing first 50 of {preview.rows.length} rows
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default: file upload state
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Plan Items from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file to bulk import plan items. The CSV should follow the required format with
            hierarchy columns (workstream, milestone, activity, task, subtask).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              id="csv-upload"
              onChange={handleFileChange}
            />
            <Button asChild variant="outline">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Select CSV File
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSV Format</CardTitle>
          <CardDescription>
            Download the template or follow the format below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>

            <div className="text-sm">
              <h4 className="font-medium mb-2">Required columns (at least one):</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                <li><code className="text-xs bg-slate-100 px-1 rounded">workstream</code> - Top level (Level 1)</li>
                <li><code className="text-xs bg-slate-100 px-1 rounded">milestone</code> - Level 2</li>
                <li><code className="text-xs bg-slate-100 px-1 rounded">activity</code> - Level 3</li>
                <li><code className="text-xs bg-slate-100 px-1 rounded">task</code> - Level 4</li>
                <li><code className="text-xs bg-slate-100 px-1 rounded">subtask</code> - Level 5</li>
              </ul>

              <h4 className="font-medium mb-2">Optional columns:</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><code className="text-xs bg-slate-100 px-1 rounded">status</code> - not_started, in_progress, completed, on_hold, cancelled</li>
                <li><code className="text-xs bg-slate-100 px-1 rounded">owner</code> - Owner name</li>
                <li><code className="text-xs bg-slate-100 px-1 rounded">start_date</code> - YYYY-MM-DD or MM/DD/YYYY</li>
                <li><code className="text-xs bg-slate-100 px-1 rounded">target_end_date</code> - YYYY-MM-DD or MM/DD/YYYY</li>
                <li><code className="text-xs bg-slate-100 px-1 rounded">notes</code> - Additional notes</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium mb-2">Example:</h4>
              <pre className="text-xs overflow-x-auto">
{`workstream,milestone,activity,task,subtask,status,owner,start_date,target_end_date,notes
Development,Sprint 1,Setup,Create project,,in_progress,John Doe,2024-01-15,2024-01-20,Initial setup
Development,Sprint 1,Setup,Configure CI/CD,,not_started,Jane Smith,2024-01-21,2024-01-25,
Development,Sprint 1,Features,User auth,Login page,completed,John Doe,2024-01-15,2024-01-18,`}
              </pre>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <strong>How it works:</strong>
              <ul className="list-disc list-inside mt-2 text-slate-600 space-y-1">
                <li>Each row creates items at the deepest filled hierarchy level</li>
                <li>Parent items are automatically created or found by name</li>
                <li>Status, owner, dates, and notes are applied to the deepest item</li>
                <li>Existing items (same name under same parent) are reused, not duplicated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
