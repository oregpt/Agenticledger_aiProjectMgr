import { format } from 'date-fns';
import {
  FileText,
  Calendar,
  Tag,
  Link,
  File,
  Mail,
  MessageSquare,
  Mic,
  CheckCircle,
  AlertTriangle,
  XCircle,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { ContentItem, ContentType, ActivityItemType } from '@/api/content-items.api';

interface ContentItemDetailDialogProps {
  item: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentTypes: ContentType[];
  activityTypes: ActivityItemType[];
}

export function ContentItemDetailDialog({
  item,
  open,
  onOpenChange,
  contentTypes,
  activityTypes,
}: ContentItemDetailDialogProps) {
  if (!item) return null;

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'file':
        return <File className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'calendar':
        return <Calendar className="h-4 w-4" />;
      case 'transcript':
        return <Mic className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-gray-100 text-gray-700', label: 'Pending' },
      processing: { className: 'bg-blue-100 text-blue-700', label: 'Processing' },
      completed: { className: 'bg-green-100 text-green-700', label: 'Completed' },
      failed: { className: 'bg-red-100 text-red-700', label: 'Failed' },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getExtractedItemIcon = (type: string) => {
    switch (type) {
      case 'action_item':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'blocker':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'decision':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Tag className="h-4 w-4 text-blue-500" />;
    }
  };

  // Extract analysis data if available
  const analysisData = item.aiExtractedEntities?.analysis as {
    extractedItems?: Array<{
      type: string;
      title: string;
      description: string;
      owner?: string;
      dueDate?: string;
      status?: string;
    }>;
    suggestedContentTypes?: Array<{ id: number; confidence: string }>;
    suggestedActivityTypes?: Array<{ id: number; confidence: string }>;
    suggestedPlanItems?: Array<{ id: string; confidence: string }>;
    tags?: string[];
  } | undefined;

  const extractedItems = analysisData?.extractedItems || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSourceTypeIcon(item.sourceType)}
            {item.title}
          </DialogTitle>
          <DialogDescription>
            Submitted on {format(new Date(item.createdAt), 'MMMM d, yyyy')} at{' '}
            {format(new Date(item.createdAt), 'h:mm a')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4 max-h-[60vh]">
          <div className="space-y-6">
            {/* Meta Information */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Date Occurred</Label>
                <p className="flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(item.dateOccurred), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Source Type</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="gap-1">
                    {getSourceTypeIcon(item.sourceType)}
                    {item.sourceType}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(item.processingStatus)}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Project Week</Label>
                <p className="mt-1">{item.projectWeek ? `Week ${item.projectWeek}` : 'N/A'}</p>
              </div>
            </div>

            <hr className="my-4 border-t border-gray-200" />

            {/* Tags */}
            {item.tags.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Content Types */}
            {item.contentTypeIds.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Content Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.contentTypeIds.map((id) => {
                    const ct = contentTypes.find((c) => c.id === id);
                    return ct ? (
                      <Badge key={id} variant="outline">
                        {ct.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Activity Types */}
            {item.activityTypeIds.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Activity Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.activityTypeIds.map((id) => {
                    const at = activityTypes.find((a) => a.id === id);
                    return at ? (
                      <Badge key={id} variant="outline">
                        {at.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Linked Plan Items */}
            {item.planItemIds.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Linked Plan Items</Label>
                <p className="text-sm mt-1 flex items-center gap-1">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  {item.planItemIds.length} plan item(s) linked
                </p>
              </div>
            )}

            <hr className="my-4 border-t border-gray-200" />

            {/* AI Summary */}
            {item.aiSummary && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Summary
                </Label>
                <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm">{item.aiSummary}</p>
                </div>
              </div>
            )}

            {/* Extracted Items */}
            {extractedItems.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Extracted Items ({extractedItems.length})
                </Label>
                <div className="space-y-3 mt-2">
                  {extractedItems.map((extracted, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getExtractedItemIcon(extracted.type)}
                        <span className="font-medium text-sm">{extracted.title}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {extracted.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{extracted.description}</p>
                      {(extracted.owner || extracted.dueDate) && (
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {extracted.owner && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {extracted.owner}
                            </span>
                          )}
                          {extracted.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {extracted.dueDate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="my-4 border-t border-gray-200" />

            {/* Raw Content */}
            {item.rawContent && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Raw Content</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg max-h-[200px] overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {item.rawContent}
                  </pre>
                </div>
              </div>
            )}

            {/* File Reference */}
            {item.fileName && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">File Attachment</Label>
                <div className="mt-2 flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.fileName}</p>
                    {item.fileSize && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(item.fileSize)} - {item.mimeType}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground">
              <p>Created: {format(new Date(item.createdAt), 'PPpp')}</p>
              <p>Updated: {format(new Date(item.updatedAt), 'PPpp')}</p>
              {item.createdBy && <p>Created by: {item.createdBy}</p>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
