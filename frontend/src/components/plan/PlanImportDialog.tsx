import { useState, useCallback } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import planItemsApi, { type CsvPreviewResponse, type ImportResult } from '@/api/plan-items.api';

interface PlanImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'results';

export function PlanImportDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: PlanImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const resetDialog = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetDialog();
      onOpenChange(false);
    }
  };

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    try {
      const response = await planItemsApi.previewImport(projectId, selectedFile);
      if (response.success && response.data) {
        setPreview(response.data);
        if (response.data.errors.length > 0) {
          setError(response.data.errors.join('\n'));
        } else {
          setStep('preview');
        }
      } else {
        setError(response.error?.message || 'Failed to parse CSV file');
      }
    } catch (err) {
      setError('Failed to parse CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      handleFileChange(droppedFile);
    } else {
      setError('Please upload a CSV file');
    }
  }, [projectId]);

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setStep('importing');
    setError(null);

    try {
      const response = await planItemsApi.importCsv(projectId, file);
      if (response.success && response.data) {
        setImportResult(response.data);
        setStep('results');
        if (response.data.itemsCreated > 0 || response.data.itemsUpdated > 0) {
          onSuccess();
        }
      } else {
        setError(response.error?.message || 'Failed to import CSV');
        setStep('preview');
      }
    } catch (err) {
      setError('Failed to import CSV');
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateUrl = planItemsApi.getTemplateUrl();
    window.open(templateUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Plan from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import plan items. Items will be matched or created based on the hierarchy columns.
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Download Template */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Download a sample CSV template to get started</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* File Dropzone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
                isLoading && 'pointer-events-none opacity-50'
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (!isLoading) {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileChange(file);
                  };
                  input.click();
                }
              }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Parsing CSV...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop a CSV file, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max file size: 5MB
                  </p>
                </>
              )}
            </div>

            {file && !isLoading && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                <FileText className="h-4 w-4" />
                <span className="text-sm flex-1">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
              </Alert>
            )}

            {/* Column Format Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Expected CSV columns:</p>
              <p><strong>Hierarchy:</strong> workstream, milestone, activity, task, subtask</p>
              <p><strong>Metadata:</strong> status, owner, start_date, target_end_date, notes</p>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Found {preview.rows.length} rows to import
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    {preview.headers.map((header) => (
                      <th key={header} className="px-3 py-2 text-left font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 20).map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                      {preview.headers.map((header) => (
                        <td key={header} className="px-3 py-2 max-w-[200px] truncate">
                          {row[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 20 && (
                <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/50">
                  Showing 20 of {preview.rows.length} rows
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium">Importing plan items...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && importResult && (
          <div className="space-y-4">
            {importResult.errors.length === 0 ? (
              <Alert className="border-green-500 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle>Import Successful</AlertTitle>
                <AlertDescription>
                  {importResult.itemsCreated} items created, {importResult.itemsUpdated} items updated
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Completed with Errors</AlertTitle>
                <AlertDescription>
                  {importResult.itemsCreated} created, {importResult.itemsUpdated} updated, {importResult.errors.length} errors
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{importResult.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.itemsCreated}</div>
                <div className="text-sm text-green-600">Created</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importResult.itemsUpdated}</div>
                <div className="text-sm text-blue-600">Updated</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="border rounded-lg max-h-[200px] overflow-auto">
                <div className="px-3 py-2 bg-muted font-medium text-sm">Errors ({importResult.errors.length})</div>
                {importResult.errors.map((err, index) => (
                  <div key={index} className="px-3 py-2 border-t text-sm">
                    <span className="text-muted-foreground">Row {err.row}:</span> {err.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setPreview(null);
                }}
              >
                Back
              </Button>
              <Button onClick={handleImport} disabled={!file}>
                Import {preview?.rows.length} Items
              </Button>
            </>
          )}

          {step === 'results' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  resetDialog();
                }}
              >
                Import More
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
