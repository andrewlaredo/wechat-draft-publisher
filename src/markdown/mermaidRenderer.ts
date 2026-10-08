/**
 * mermaidRenderer.ts
 * 高兼容纯矢量 SVG 流程图与时序图直出引擎。
 * 
 * 微信公众号环境禁止任何客户端执行的 JavaScript (包括 mermaid.js 运行时)，
 * 微信文章必须直接提供自包含的内联 SVG / HTML 结构。
 * 本模块解析通用 Mermaid 流程图 (graph TD / graph LR) 与时序图 (sequenceDiagram)，
 * 直接生成高保真、美观大气的矢量 SVG 卡片，全端无缝高保真呈现！
 */

interface DiagramNode {
  id: string;
  label: string;
  shape?: 'rect' | 'round' | 'circle';
}

interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export function renderMermaidToSvg(code: string): string {
  const lines = code
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'));

  if (lines.length === 0) return '';

  const firstLine = lines[0].toLowerCase();
  const isSequence = firstLine.startsWith('sequencediagram');
  const isLR = firstLine.includes('lr');

  if (isSequence) {
    return renderSequenceDiagram(lines.slice(1));
  } else {
    return renderFlowchartDiagram(lines.slice(1), isLR);
  }
}

function renderFlowchartDiagram(lines: string[], isLR: boolean): string {
  const nodeMap = new Map<string, DiagramNode>();
  const edges: DiagramEdge[] = [];

  const getNode = (id: string, defaultLabel?: string): DiagramNode => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label: defaultLabel || id });
    }
    const node = nodeMap.get(id)!;
    if (defaultLabel && node.label === id) {
      node.label = defaultLabel;
    }
    return node;
  };

  // Parse lines: A[Label] -->|text| B[Label2]
  const arrowRegex = /([\w-]+)(?:\[(.*?)\]|\((.*?)\))?\s*(-+>|==>|-\.->)\s*(?:\|(.*?)\|)?\s*([\w-]+)(?:\[(.*?)\]|\((.*?)\))?/;

  for (const line of lines) {
    const match = line.match(arrowRegex);
    if (match) {
      const fromId = match[1];
      const fromLabel = match[2] || match[3] || fromId;
      const edgeLabel = match[5] || '';
      const toId = match[6];
      const toLabel = match[7] || match[8] || toId;

      getNode(fromId, fromLabel);
      getNode(toId, toLabel);

      edges.push({
        from: fromId,
        to: toId,
        label: edgeLabel.trim(),
      });
    } else {
      // Standalone node: A[Label]
      const singleMatch = line.match(/([\w-]+)\[(.*?)\]/);
      if (singleMatch) {
        getNode(singleMatch[1], singleMatch[2]);
      }
    }
  }

  const nodes = Array.from(nodeMap.values());
  if (nodes.length === 0) {
    return `<div class="mermaid-fallback-box" style="padding:14px;background:#f9fafb;border:1px dashed #cbd5e1;border-radius:8px;font-family:monospace;font-size:12px;color:#475569;"><pre style="margin:0;">${codeEscape(lines.join('\n'))}</pre></div>`;
  }

  // Calculate layout coordinates
  const nodeWidth = 140;
  const nodeHeight = 44;
  const gapX = isLR ? 100 : 40;
  const gapY = isLR ? 40 : 64;

  const totalCols = isLR ? nodes.length : 1;
  const totalRows = isLR ? 1 : nodes.length;

  const svgWidth = isLR ? nodes.length * (nodeWidth + gapX) + 40 : nodeWidth + 120;
  const svgHeight = isLR ? 120 : nodes.length * (nodeHeight + gapY) + 40;

  // Node position cache
  const posMap = new Map<string, { x: number; y: number }>();

  nodes.forEach((node, i) => {
    const x = isLR ? 20 + i * (nodeWidth + gapX) : 60;
    const y = isLR ? 38 : 20 + i * (nodeHeight + gapY);
    posMap.set(node.id, { x, y });
  });

  // Build SVG Content
  let svgContent = '';

  // 1. Draw Edges
  edges.forEach((edge, idx) => {
    const p1 = posMap.get(edge.from);
    const p2 = posMap.get(edge.to);
    if (!p1 || !p2) return;

    if (isLR) {
      const startX = p1.x + nodeWidth;
      const startY = p1.y + nodeHeight / 2;
      const endX = p2.x;
      const endY = p2.y + nodeHeight / 2;

      svgContent += `
        <path d="M ${startX} ${startY} L ${endX} ${endY}" stroke="#64748b" stroke-width="2" fill="none" marker-end="url(#mermaid-arrow)" />
        ${edge.label ? `<text x="${(startX + endX) / 2}" y="${startY - 6}" font-size="11" font-family="system-ui, sans-serif" fill="#475569" text-anchor="middle">${edge.label}</text>` : ''}
      `;
    } else {
      const startX = p1.x + nodeWidth / 2;
      const startY = p1.y + nodeHeight;
      const endX = p2.x + nodeWidth / 2;
      const endY = p2.y;

      svgContent += `
        <path d="M ${startX} ${startY} L ${endX} ${endY}" stroke="#64748b" stroke-width="2" fill="none" marker-end="url(#mermaid-arrow)" />
        ${edge.label ? `<text x="${startX + 8}" y="${(startY + endY) / 2 + 4}" font-size="11" font-family="system-ui, sans-serif" fill="#475569" text-anchor="start">${edge.label}</text>` : ''}
      `;
    }
  });

  // 2. Draw Nodes
  nodes.forEach((node, idx) => {
    const pos = posMap.get(node.id)!;
    const colors = [
      { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
      { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
      { bg: '#faf5ff', border: '#8b5cf6', text: '#5b21b6' },
      { bg: '#fff7ed', border: '#f97316', text: '#9a3412' },
      { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
    ];
    const theme = colors[idx % colors.length];

    svgContent += `
      <g transform="translate(${pos.x}, ${pos.y})">
        <rect width="${nodeWidth}" height="${nodeHeight}" rx="8" fill="${theme.bg}" stroke="${theme.border}" stroke-width="2" filter="url(#mermaid-shadow)" />
        <text x="${nodeWidth / 2}" y="${nodeHeight / 2 + 5}" font-size="13" font-weight="600" font-family="system-ui, -apple-system, sans-serif" fill="${theme.text}" text-anchor="middle">
          ${codeEscape(node.label)}
        </text>
      </g>
    `;
  });

  return `
<section class="wechat-mermaid-container" style="margin:1.6em 0;overflow-x:auto;-webkit-overflow-scrolling:touch;text-align:center;">
  <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="max-width:100%;height:auto;display:inline-block;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;padding:12px;">
    <defs>
      <marker id="mermaid-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
      </marker>
      <filter id="mermaid-shadow" x="-5%" y="-5%" width="110%" height="115%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.06"/>
      </filter>
    </defs>
    ${svgContent}
  </svg>
  <div style="font-size:11px;color:#94a3b8;margin-top:6px;">📊 矢量流程图 · 微信全端自适应</div>
</section>`;
}

function renderSequenceDiagram(lines: string[]): string {
  const participants = new Set<string>();
  const messages: Array<{ from: string; to: string; text: string }> = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith('participant')) {
      const p = line.split(/\s+/)[1];
      if (p) participants.add(p);
      continue;
    }
    const match = line.match(/([\w-]+)\s*(->>|->)\s*([\w-]+)\s*:\s*(.*)/);
    if (match) {
      const from = match[1];
      const to = match[3];
      const text = match[4];
      participants.add(from);
      participants.add(to);
      messages.push({ from, to, text: text.trim() });
    }
  }

  const pList = Array.from(participants);
  if (pList.length === 0) return '';

  const colWidth = 140;
  const headerHeight = 36;
  const msgGap = 44;
  const totalWidth = pList.length * colWidth + 40;
  const totalHeight = headerHeight + messages.length * msgGap + 50;

  const colX = new Map<string, number>();
  pList.forEach((p, i) => {
    colX.set(p, 40 + i * colWidth);
  });

  let svgContent = '';

  // Lifelines
  pList.forEach((p) => {
    const x = colX.get(p)! + 45;
    svgContent += `
      <line x1="${x}" y1="${headerHeight + 20}" x2="${x}" y2="${totalHeight - 20}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 4" />
    `;
  });

  // Participant boxes
  pList.forEach((p) => {
    const x = colX.get(p)!;
    svgContent += `
      <rect x="${x}" y="10" width="90" height="${headerHeight}" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5" />
      <text x="${x + 45}" y="${10 + headerHeight / 2 + 5}" font-size="12" font-weight="600" fill="#1e40af" text-anchor="middle">${p}</text>
    `;
  });

  // Messages
  messages.forEach((msg, idx) => {
    const x1 = colX.get(msg.from)! + 45;
    const x2 = colX.get(msg.to)! + 45;
    const y = headerHeight + 35 + idx * msgGap;

    svgContent += `
      <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#475569" stroke-width="2" marker-end="url(#mermaid-arrow)" />
      <text x="${(x1 + x2) / 2}" y="${y - 6}" font-size="11" fill="#334155" text-anchor="middle">${codeEscape(msg.text)}</text>
    `;
  });

  return `
<section class="wechat-mermaid-container" style="margin:1.6em 0;overflow-x:auto;-webkit-overflow-scrolling:touch;text-align:center;">
  <svg viewBox="0 0 ${totalWidth} ${totalHeight}" style="max-width:100%;height:auto;display:inline-block;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;padding:12px;">
    <defs>
      <marker id="mermaid-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
      </marker>
    </defs>
    ${svgContent}
  </svg>
  <div style="font-size:11px;color:#94a3b8;margin-top:6px;">📊 矢量时序图 · 微信全端自适应</div>
</section>`;
}

function codeEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
