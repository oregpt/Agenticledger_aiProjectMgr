/**
 * Output Formatter Service
 * Handles converting reports to Markdown and PowerPoint formats
 */

import PptxGenJS from 'pptxgenjs';
import type {
  FormatMarkdownInput,
  FormatMarkdownResponse,
  FormatPptxInput,
  FormatPptxResponse,
} from './output-formatter.schema';

/**
 * Format data as Markdown
 */
export function formatAsMarkdown(input: FormatMarkdownInput): FormatMarkdownResponse {
  let markdown = '';
  const data = input.data as Record<string, unknown>;

  if (input.sourceType === 'activity_report' || input.sourceType === 'combined') {
    markdown = formatActivityReportMarkdown(input.projectName, data);
  } else if (input.sourceType === 'plan') {
    markdown = formatPlanMarkdown(input.projectName, data);
  }

  // Generate filename
  const date = new Date().toISOString().split('T')[0];
  const sanitizedName = input.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `${sanitizedName}-${input.sourceType}-${date}.md`;

  return { content: markdown, filename };
}

/**
 * Format activity report as Markdown
 */
function formatActivityReportMarkdown(projectName: string, data: Record<string, unknown>): string {
  const { title, periodStart, periodEnd, reportData } = data as {
    title: string;
    periodStart: string;
    periodEnd: string;
    reportData: {
      summary: string;
      statusUpdates: Array<{ planItemName: string | null; update: string; status: string }>;
      actionItems: Array<{ title: string; description: string; owner: string | null; dueDate: string | null; priority: string; status: string }>;
      risks: Array<{ title: string; description: string; severity: string; mitigation: string | null }>;
      decisions: Array<{ title: string; description: string; decisionMaker: string | null; decisionDate: string | null }>;
      blockers: Array<{ title: string; description: string; resolution: string | null }>;
    };
  };

  let md = `# ${title || `${projectName} Activity Report`}\n\n`;
  md += `**Project:** ${projectName}\n`;
  md += `**Period:** ${periodStart} to ${periodEnd}\n`;
  md += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n`;
  md += `---\n\n`;

  // Summary
  md += `## Summary\n\n${reportData.summary}\n\n`;

  // Status Updates
  if (reportData.statusUpdates.length > 0) {
    md += `## Status Updates\n\n`;
    reportData.statusUpdates.forEach(su => {
      const itemName = su.planItemName || 'General';
      md += `### ${itemName}\n`;
      md += `- **Status:** ${formatStatus(su.status)}\n`;
      md += `- ${su.update}\n\n`;
    });
  }

  // Action Items
  if (reportData.actionItems.length > 0) {
    md += `## Action Items\n\n`;
    md += `| Item | Owner | Due | Priority | Status |\n`;
    md += `|------|-------|-----|----------|--------|\n`;
    reportData.actionItems.forEach(ai => {
      md += `| ${ai.title} | ${ai.owner || '-'} | ${ai.dueDate || '-'} | ${ai.priority} | ${formatStatus(ai.status || 'open')} |\n`;
    });
    md += '\n';

    // Details
    md += `### Action Item Details\n\n`;
    reportData.actionItems.forEach((ai, i) => {
      md += `**${i + 1}. ${ai.title}**\n`;
      md += `${ai.description}\n\n`;
    });
  }

  // Risks
  if (reportData.risks.length > 0) {
    md += `## Risks\n\n`;
    md += `| Risk | Severity | Mitigation |\n`;
    md += `|------|----------|------------|\n`;
    reportData.risks.forEach(r => {
      md += `| ${r.title} | ${r.severity.toUpperCase()} | ${r.mitigation || 'TBD'} |\n`;
    });
    md += '\n';

    // Details
    md += `### Risk Details\n\n`;
    reportData.risks.forEach((r, i) => {
      md += `**${i + 1}. ${r.title}** (${r.severity.toUpperCase()} severity)\n`;
      md += `${r.description}\n`;
      if (r.mitigation) md += `*Mitigation:* ${r.mitigation}\n`;
      md += '\n';
    });
  }

  // Decisions
  if (reportData.decisions.length > 0) {
    md += `## Decisions\n\n`;
    reportData.decisions.forEach((d, i) => {
      md += `**${i + 1}. ${d.title}**\n`;
      md += `${d.description}\n`;
      if (d.decisionMaker) md += `*Decided by:* ${d.decisionMaker}`;
      if (d.decisionDate) md += ` on ${d.decisionDate}`;
      md += '\n\n';
    });
  }

  // Blockers
  if (reportData.blockers.length > 0) {
    md += `## Blockers\n\n`;
    reportData.blockers.forEach((b, i) => {
      md += `**${i + 1}. ${b.title}**\n`;
      md += `${b.description}\n`;
      if (b.resolution) md += `*Resolution:* ${b.resolution}\n`;
      md += '\n';
    });
  }

  return md;
}

/**
 * Format plan as Markdown
 */
function formatPlanMarkdown(projectName: string, data: Record<string, unknown>): string {
  const { planItems } = data as {
    planItems: Array<{
      id: string;
      name: string;
      status: string;
      itemType: string;
      owner?: string | null;
      startDate?: string | null;
      targetEndDate?: string | null;
      notes?: string | null;
      children?: unknown[];
    }>;
  };

  let md = `# ${projectName} Project Plan\n\n`;
  md += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n`;
  md += `---\n\n`;

  // Render plan items recursively
  function renderPlanItem(item: (typeof planItems)[0], depth: number): string {
    const indent = '  '.repeat(depth);
    const prefix = depth === 0 ? '##' : depth === 1 ? '###' : '-';

    let line = '';
    if (depth < 2) {
      line = `${prefix} ${item.name}\n`;
      line += `${indent}- **Status:** ${formatStatus(item.status)}\n`;
      if (item.owner) line += `${indent}- **Owner:** ${item.owner}\n`;
      if (item.targetEndDate) line += `${indent}- **Target:** ${item.targetEndDate}\n`;
      if (item.notes) line += `${indent}- **Notes:** ${item.notes}\n`;
      line += '\n';
    } else {
      line = `${indent}${prefix} **${item.name}** - ${formatStatus(item.status)}`;
      if (item.owner) line += ` (${item.owner})`;
      line += '\n';
    }

    if (item.children && item.children.length > 0) {
      (item.children as typeof planItems).forEach(child => {
        line += renderPlanItem(child, depth + 1);
      });
    }

    return line;
  }

  planItems.forEach(item => {
    md += renderPlanItem(item, 0);
  });

  return md;
}

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    not_started: '⬜ Not Started',
    in_progress: '🔵 In Progress',
    on_track: '🟢 On Track',
    at_risk: '🟡 At Risk',
    blocked: '🔴 Blocked',
    completed: '✅ Completed',
    delayed: '🔴 Delayed',
    cancelled: '⚫ Cancelled',
    open: '⬜ Open',
  };
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format data as PowerPoint
 */
export async function formatAsPptx(input: FormatPptxInput): Promise<FormatPptxResponse> {
  const pptx = new PptxGenJS();
  const data = input.data as Record<string, unknown>;

  // Set presentation properties
  pptx.author = 'AI Project Manager';
  pptx.title = `${input.projectName} Report`;
  pptx.subject = input.sourceType === 'activity_report' ? 'Activity Report' : 'Project Plan';

  // Color scheme
  const colors = {
    primary: '1E3A5F', // Deep blue
    secondary: '64748B', // Slate
    success: '22C55E', // Green
    warning: 'F59E0B', // Yellow
    danger: 'EF4444', // Red
    text: '1E293B', // Dark slate
    muted: '94A3B8', // Light slate
    background: 'F8FAFC', // Light background
  };

  if (input.sourceType === 'activity_report' || input.sourceType === 'combined') {
    await createActivityReportSlides(pptx, input.projectName, data, colors);
  } else if (input.sourceType === 'plan') {
    await createPlanSlides(pptx, input.projectName, data, colors);
  }

  // Generate filename
  const date = new Date().toISOString().split('T')[0];
  const sanitizedName = input.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `${sanitizedName}-${input.sourceType}-${date}.pptx`;

  // Generate buffer
  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

  return { buffer, filename };
}

/**
 * Create activity report slides
 */
async function createActivityReportSlides(
  pptx: PptxGenJS,
  projectName: string,
  data: Record<string, unknown>,
  colors: Record<string, string>
): Promise<void> {
  const { title, periodStart, periodEnd, reportData } = data as {
    title: string;
    periodStart: string;
    periodEnd: string;
    reportData: {
      summary: string;
      statusUpdates: Array<{ planItemName: string | null; update: string; status: string }>;
      actionItems: Array<{ title: string; description: string; owner: string | null; dueDate: string | null; priority: string; status?: string }>;
      risks: Array<{ title: string; description: string; severity: string; mitigation: string | null }>;
      decisions: Array<{ title: string; description: string }>;
      blockers: Array<{ title: string; description: string; resolution: string | null }>;
    };
  };

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(title || `${projectName} Activity Report`, {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1.5,
    fontSize: 36,
    bold: true,
    color: colors.primary,
    align: 'center',
  });
  titleSlide.addText(`${periodStart} to ${periodEnd}`, {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: colors.muted,
    align: 'center',
  });
  titleSlide.addText(`Generated: ${new Date().toISOString().split('T')[0]}`, {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.5,
    fontSize: 12,
    color: colors.muted,
    align: 'center',
  });

  // Summary Slide
  const summarySlide = pptx.addSlide();
  addSlideTitle(summarySlide, 'Executive Summary', colors);
  summarySlide.addText(reportData.summary, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 4,
    fontSize: 14,
    color: colors.text,
    valign: 'top',
  });

  // Status Updates Slide (if any)
  if (reportData.statusUpdates.length > 0) {
    const statusSlide = pptx.addSlide();
    addSlideTitle(statusSlide, 'Status Updates', colors);

    const statusRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Item', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
        { text: 'Status', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
        { text: 'Update', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
      ],
    ];

    reportData.statusUpdates.slice(0, 8).forEach(su => {
      statusRows.push([
        { text: su.planItemName || 'General', options: { color: colors.text } },
        { text: su.status.replace(/_/g, ' '), options: { color: getStatusColor(su.status, colors) } },
        { text: truncate(su.update, 60), options: { color: colors.text } },
      ]);
    });

    statusSlide.addTable(statusRows, {
      x: 0.5,
      y: 1.5,
      w: 9,
      colW: [2.5, 1.5, 5],
      fontSize: 11,
      border: { type: 'solid', pt: 0.5, color: colors.muted },
    });
  }

  // Action Items Slide (if any)
  if (reportData.actionItems.length > 0) {
    const actionSlide = pptx.addSlide();
    addSlideTitle(actionSlide, 'Action Items', colors);

    const actionRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Action Item', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
        { text: 'Owner', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
        { text: 'Due', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
        { text: 'Priority', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
      ],
    ];

    reportData.actionItems.slice(0, 8).forEach(ai => {
      actionRows.push([
        { text: truncate(ai.title, 40), options: { color: colors.text } },
        { text: ai.owner || '-', options: { color: colors.text } },
        { text: ai.dueDate || '-', options: { color: colors.text } },
        { text: ai.priority, options: { color: getPriorityColor(ai.priority, colors) } },
      ]);
    });

    actionSlide.addTable(actionRows, {
      x: 0.5,
      y: 1.5,
      w: 9,
      colW: [4, 2, 1.5, 1.5],
      fontSize: 11,
      border: { type: 'solid', pt: 0.5, color: colors.muted },
    });
  }

  // Risks Slide (if any)
  if (reportData.risks.length > 0) {
    const risksSlide = pptx.addSlide();
    addSlideTitle(risksSlide, 'Risks', colors);

    const riskRows: PptxGenJS.TableRow[] = [
      [
        { text: 'Risk', options: { bold: true, fill: { color: colors.warning }, color: colors.text } },
        { text: 'Severity', options: { bold: true, fill: { color: colors.warning }, color: colors.text } },
        { text: 'Mitigation', options: { bold: true, fill: { color: colors.warning }, color: colors.text } },
      ],
    ];

    reportData.risks.slice(0, 6).forEach(r => {
      riskRows.push([
        { text: r.title, options: { color: colors.text } },
        { text: r.severity.toUpperCase(), options: { color: getSeverityColor(r.severity, colors) } },
        { text: truncate(r.mitigation || 'TBD', 50), options: { color: colors.text } },
      ]);
    });

    risksSlide.addTable(riskRows, {
      x: 0.5,
      y: 1.5,
      w: 9,
      colW: [3, 1.5, 4.5],
      fontSize: 11,
      border: { type: 'solid', pt: 0.5, color: colors.muted },
    });
  }

  // Blockers Slide (if any)
  if (reportData.blockers.length > 0) {
    const blockersSlide = pptx.addSlide();
    addSlideTitle(blockersSlide, 'Blockers', colors);

    let yPos = 1.5;
    reportData.blockers.slice(0, 4).forEach(b => {
      blockersSlide.addShape(pptx.ShapeType.rect, {
        x: 0.5,
        y: yPos,
        w: 9,
        h: 1,
        fill: { color: 'FEF2F2' },
        line: { color: colors.danger, pt: 1 },
      });
      blockersSlide.addText(b.title, {
        x: 0.7,
        y: yPos + 0.1,
        w: 8.6,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: colors.danger,
      });
      blockersSlide.addText(truncate(b.description, 100), {
        x: 0.7,
        y: yPos + 0.45,
        w: 8.6,
        h: 0.5,
        fontSize: 10,
        color: colors.text,
      });
      yPos += 1.2;
    });
  }
}

/**
 * Create plan slides
 */
async function createPlanSlides(
  pptx: PptxGenJS,
  projectName: string,
  data: Record<string, unknown>,
  colors: Record<string, string>
): Promise<void> {
  const { planItems } = data as {
    planItems: Array<{
      name: string;
      status: string;
      itemType: string;
      owner?: string | null;
      targetEndDate?: string | null;
      children?: unknown[];
    }>;
  };

  // Title Slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(`${projectName} Project Plan`, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1.5,
    fontSize: 36,
    bold: true,
    color: colors.primary,
    align: 'center',
  });
  titleSlide.addText(`Generated: ${new Date().toISOString().split('T')[0]}`, {
    x: 0.5,
    y: 4,
    w: 9,
    h: 0.5,
    fontSize: 12,
    color: colors.muted,
    align: 'center',
  });

  // Create a slide for each top-level workstream
  planItems.forEach(workstream => {
    const slide = pptx.addSlide();
    addSlideTitle(slide, workstream.name, colors);

    // Workstream status
    slide.addText(`Status: ${workstream.status.replace(/_/g, ' ')}`, {
      x: 0.5,
      y: 1.3,
      w: 4,
      h: 0.3,
      fontSize: 12,
      color: getStatusColor(workstream.status, colors),
    });

    if (workstream.owner) {
      slide.addText(`Owner: ${workstream.owner}`, {
        x: 5,
        y: 1.3,
        w: 4.5,
        h: 0.3,
        fontSize: 12,
        color: colors.muted,
        align: 'right',
      });
    }

    // Child items table
    if (workstream.children && (workstream.children as unknown[]).length > 0) {
      const rows: PptxGenJS.TableRow[] = [
        [
          { text: 'Item', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
          { text: 'Type', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
          { text: 'Status', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
          { text: 'Owner', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
          { text: 'Target', options: { bold: true, fill: { color: colors.primary }, color: 'FFFFFF' } },
        ],
      ];

      type ChildItem = {
        name: string;
        itemType: string;
        status: string;
        owner?: string | null;
        targetEndDate?: string | null;
      };

      (workstream.children as ChildItem[]).slice(0, 8).forEach(child => {
        rows.push([
          { text: truncate(child.name, 35), options: { color: colors.text } },
          { text: child.itemType, options: { color: colors.muted } },
          { text: child.status.replace(/_/g, ' '), options: { color: getStatusColor(child.status, colors) } },
          { text: child.owner || '-', options: { color: colors.text } },
          { text: child.targetEndDate || '-', options: { color: colors.text } },
        ]);
      });

      slide.addTable(rows, {
        x: 0.5,
        y: 1.8,
        w: 9,
        colW: [3.5, 1.2, 1.5, 1.5, 1.3],
        fontSize: 10,
        border: { type: 'solid', pt: 0.5, color: colors.muted },
      });
    }
  });
}

// Helper functions
function addSlideTitle(slide: PptxGenJS.Slide, title: string, colors: Record<string, string>): void {
  slide.addText(title, {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: colors.primary,
  });
  // Add line under title
  slide.addShape('line' as PptxGenJS.ShapeType, {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 0,
    line: { color: colors.primary, pt: 2 },
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function getStatusColor(status: string, colors: Record<string, string>): string {
  const statusColors: Record<string, string> = {
    completed: colors.success,
    on_track: colors.success,
    in_progress: colors.primary,
    at_risk: colors.warning,
    delayed: colors.danger,
    blocked: colors.danger,
    not_started: colors.muted,
    open: colors.muted,
  };
  return statusColors[status] || colors.text;
}

function getPriorityColor(priority: string, colors: Record<string, string>): string {
  const priorityColors: Record<string, string> = {
    high: colors.danger,
    medium: colors.warning,
    low: colors.muted,
  };
  return priorityColors[priority] || colors.text;
}

function getSeverityColor(severity: string, colors: Record<string, string>): string {
  return getPriorityColor(severity, colors);
}

export default {
  formatAsMarkdown,
  formatAsPptx,
};
