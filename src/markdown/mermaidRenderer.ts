/**
 * mermaidRenderer.ts
 * 高兼容纯矢量 SVG 流程图与时序图直出引擎。
 * 
 * 微信公众号环境禁止任何客户端执行的 JavaScript (包括 mermaid.js 运行时)，
 * 微信文章必须直接提供自包含的内联 SVG / HTML 结构。
 * 本模块解析通用 Mermaid 流程图 (graph TD / graph LR / flowchart)、时序图 (sequenceDiagram) 与饼图 (pie)，
 * 直接生成高保真、美观大气的矢量 SVG 卡片，全端无缝高保真呈现！
 */

interface DiagramNode {
  id: string;
  label: string;
  shape: 'rect' | 'round' | 'pill' | 'diamond' | 'circle' | 'cylinder';
}

interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  isDotted?: boolean;
}

let diagramIdCounter = 0;

export function renderMermaidToSvg(code: string): string {
  if (!code || !code.trim()) return '';

  const lines = code
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('%%'));

  if (lines.length === 0) return '';

  const firstLine = lines[0].toLowerCase();
  const diagramUid = `mm_${Date.now().toString(36)}_${diagramIdCounter++}`;

  if (firstLine.startsWith('sequencediagram')) {
    return renderSequenceDiagram(lines.slice(1), diagramUid);
  } else if (firstLine.startsWith('pie')) {
    return renderPieChart(lines, diagramUid);
  } else if (firstLine.startsWith('graph') || firstLine.startsWith('flowchart')) {
    const isLR = firstLine.includes('lr') || firstLine.includes('rl');
    return renderFlowchartDiagram(lines.slice(1), isLR, diagramUid);
  } else {
    // Attempt flowchart as default or fallback
    return renderFlowchartDiagram(lines, false, diagramUid);
  }
}

/**
 * 解析并渲染流程图 (Flowchart / Graph)
 * 支持 TD (从上到下) 与 LR (从左到右)，多分支拓扑对齐与链式语法 A --> B --> C
 */
function renderFlowchartDiagram(rawLines: string[], isLR: boolean, uid: string): string {
  const nodeMap = new Map<string, DiagramNode>();
  const edges: DiagramEdge[] = [];

  const parseNodeToken = (raw: string): { id: string; label: string; shape: DiagramNode['shape'] } => {
    const trimmed = raw.trim();
    // 胶囊形 ([...])
    const pillMatch = trimmed.match(/^([A-Za-z0-9_\u4e00-\u9fa5\-]+)\(\[(.*?)\]\)$/);
    if (pillMatch) return { id: pillMatch[1], label: pillMatch[2] || pillMatch[1], shape: 'pill' };

    // 圆柱形 [(...)]
    const cylMatch = trimmed.match(/^([A-Za-z0-9_\u4e00-\u9fa5\-]+)\[\((.*?)\)\]$/);
    if (cylMatch) return { id: cylMatch[1], label: cylMatch[2] || cylMatch[1], shape: 'cylinder' };

    // 菱形 {...}
    const diamondMatch = trimmed.match(/^([A-Za-z0-9_\u4e00-\u9fa5\-]+)\{(.*?)\}$/);
    if (diamondMatch) return { id: diamondMatch[1], label: diamondMatch[2] || diamondMatch[1], shape: 'diamond' };

    // 圆角形 (...)
    const roundMatch = trimmed.match(/^([A-Za-z0-9_\u4e00-\u9fa5\-]+)\((.*?)\)$/);
    if (roundMatch) return { id: roundMatch[1], label: roundMatch[2] || roundMatch[1], shape: 'round' };

    // 圆形 ((...))
    const circleMatch = trimmed.match(/^([A-Za-z0-9_\u4e00-\u9fa5\-]+)\(\((.*?)\)\)$/);
    if (circleMatch) return { id: circleMatch[1], label: circleMatch[2] || circleMatch[1], shape: 'circle' };

    // 矩形 [...]
    const rectMatch = trimmed.match(/^([A-Za-z0-9_\u4e00-\u9fa5\-]+)\[(.*?)\]$/);
    if (rectMatch) return { id: rectMatch[1], label: rectMatch[2] || rectMatch[1], shape: 'rect' };

    // 单纯 ID
    return { id: trimmed, label: trimmed, shape: 'round' };
  };

  const registerNode = (raw: string): string => {
    const { id, label, shape } = parseNodeToken(raw);
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label, shape });
    } else {
      const existing = nodeMap.get(id)!;
      if (label && label !== id && existing.label === id) {
        existing.label = label;
      }
      if (shape !== 'round' && existing.shape === 'round') {
        existing.shape = shape;
      }
    }
    return id;
  };

  // 逐行解析：支持 A --> B, A -->|标签| B, 以及链式 A --> B --> C
  for (const line of rawLines) {
    if (!line || line.startsWith('%%') || line.startsWith('subgraph') || line === 'end') continue;

    // 匹配所有箭头分割符: (-->|text| 或 ==> 或 -.-> 或 ---)
    const arrowPattern = /\s*(-+>|==>|-\.->|---+)\s*(?:\|(.*?)\|)?\s*/g;
    const parts: string[] = [];
    const arrowLabels: Array<{ label?: string; isDotted?: boolean }> = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = arrowPattern.exec(line)) !== null) {
      parts.push(line.slice(lastIndex, match.index).trim());
      const arrowType = match[1];
      const label = match[2];
      arrowLabels.push({
        label: label ? label.trim() : undefined,
        isDotted: arrowType.includes('.'),
      });
      lastIndex = arrowPattern.lastIndex;
    }
    parts.push(line.slice(lastIndex).trim());

    if (parts.length >= 2) {
      for (let i = 0; i < parts.length - 1; i++) {
        const fromPart = parts[i];
        const toPart = parts[i + 1];
        if (fromPart && toPart) {
          const fromId = registerNode(fromPart);
          const toId = registerNode(toPart);
          const arrowInfo = arrowLabels[i] || {};
          edges.push({
            from: fromId,
            to: toId,
            label: arrowInfo.label,
            isDotted: arrowInfo.isDotted,
          });
        }
      }
    } else if (parts[0]) {
      // 独立节点注册
      registerNode(parts[0]);
    }
  }

  const nodes = Array.from(nodeMap.values());
  if (nodes.length === 0) {
    return `<div class="wechat-mermaid-fallback" style="padding:14px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;font-family:monospace;font-size:12px;color:#475569;margin:1.5em 0;"><pre style="margin:0;">${codeEscape(rawLines.join('\n'))}</pre></div>`;
  }

  // 拓扑层级 (Level / Rank) 计算：实现真实多分支网格排版
  const inDegree = new Map<string, number>();
  const childrenMap = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    childrenMap.set(n.id, []);
  });

  edges.forEach((e) => {
    inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
    const ch = childrenMap.get(e.from) || [];
    ch.push(e.to);
    childrenMap.set(e.from, ch);
  });

  const levelMap = new Map<string, number>();
  nodes.forEach((n) => levelMap.set(n.id, 0));

  // 迭代计算深度 (避免循环引用死循环，限制最大深度 20)
  for (let round = 0; round < 15; round++) {
    let changed = false;
    edges.forEach((e) => {
      const uL = levelMap.get(e.from) || 0;
      const vL = levelMap.get(e.to) || 0;
      if (vL <= uL) {
        levelMap.set(e.to, uL + 1);
        changed = true;
      }
    });
    if (!changed) break;
  }

  // 聚合各层级节点
  const layers: DiagramNode[][] = [];
  nodes.forEach((n) => {
    const l = levelMap.get(n.id) || 0;
    if (!layers[l]) layers[l] = [];
    layers[l].push(n);
  });

  // 紧凑排布
  const denseLayers = layers.filter((l) => l && l.length > 0);
  const maxNodesInLayer = Math.max(...denseLayers.map((l) => l.length), 1);

  // 尺寸定义
  const nodeWidth = 150;
  const nodeHeight = 44;
  const gapX = isLR ? 90 : 50;
  const gapY = isLR ? 40 : 68;
  const padding = 24;

  let svgWidth = 0;
  let svgHeight = 0;
  const posMap = new Map<string, { x: number; y: number }>();

  if (isLR) {
    // 横向流：层级决定 X 坐标，同层数量决定 Y 坐标
    svgWidth = denseLayers.length * (nodeWidth + gapX) - gapX + padding * 2;
    svgHeight = Math.max(maxNodesInLayer * (nodeHeight + gapY) - gapY + padding * 2, 140);

    denseLayers.forEach((layer, layerIdx) => {
      const x = padding + layerIdx * (nodeWidth + gapX);
      const layerTotalHeight = layer.length * (nodeHeight + gapY) - gapY;
      const startY = (svgHeight - layerTotalHeight) / 2;

      layer.forEach((node, nodeIdx) => {
        const y = startY + nodeIdx * (nodeHeight + gapY);
        posMap.set(node.id, { x, y });
      });
    });
  } else {
    // 纵向流 (TD)：层级决定 Y 坐标，同层数量决定 X 坐标
    svgWidth = Math.max(maxNodesInLayer * (nodeWidth + gapX) - gapX + padding * 2, 320);
    svgHeight = denseLayers.length * (nodeHeight + gapY) - gapY + padding * 2;

    denseLayers.forEach((layer, layerIdx) => {
      const y = padding + layerIdx * (nodeHeight + gapY);
      const layerTotalWidth = layer.length * (nodeWidth + gapX) - gapX;
      const startX = (svgWidth - layerTotalWidth) / 2;

      layer.forEach((node, nodeIdx) => {
        const x = startX + nodeIdx * (nodeWidth + gapX);
        posMap.set(node.id, { x, y });
      });
    });
  }

  // 颜色风格调色板 (专为微信深浅底色适配的优雅商务质感)
  const colorThemes = [
    { bg: '#eff6ff', stroke: '#3b82f6', text: '#1e40af', pill: '#dbeafe' },
    { bg: '#f0fdf4', stroke: '#10b981', text: '#065f46', pill: '#d1fae5' },
    { bg: '#faf5ff', stroke: '#8b5cf6', text: '#5b21b6', pill: '#ede9fe' },
    { bg: '#fff7ed', stroke: '#f97316', text: '#9a3412', pill: '#ffedd5' },
    { bg: '#fdf2f8', stroke: '#ec4899', text: '#9d174d', pill: '#fce7f3' },
  ];

  // 1. 绘制连线 (Edges)
  let edgesSvg = '';
  edges.forEach((edge) => {
    const p1 = posMap.get(edge.from);
    const p2 = posMap.get(edge.to);
    if (!p1 || !p2) return;

    let pathD = '';
    let labelX = 0;
    let labelY = 0;

    if (isLR) {
      const startX = p1.x + nodeWidth;
      const startY = p1.y + nodeHeight / 2;
      const endX = p2.x;
      const endY = p2.y + nodeHeight / 2;

      if (Math.abs(startY - endY) < 5) {
        pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
      } else {
        const midX = (startX + endX) / 2;
        pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
      }

      labelX = (startX + endX) / 2;
      labelY = (startY + endY) / 2 - 8;
    } else {
      const startX = p1.x + nodeWidth / 2;
      const startY = p1.y + nodeHeight;
      const endX = p2.x + nodeWidth / 2;
      const endY = p2.y;

      if (Math.abs(startX - endX) < 5) {
        pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
      } else {
        const midY = (startY + endY) / 2;
        pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
      }

      labelX = (startX + endX) / 2;
      labelY = (startY + endY) / 2;
    }

    const strokeDash = edge.isDotted ? 'stroke-dasharray="4 4"' : '';

    edgesSvg += `
      <g>
        <path d="${pathD}" stroke="#64748b" stroke-width="2" fill="none" ${strokeDash} marker-end="url(#${uid}-arrow)" />
        ${
          edge.label
            ? `
          <rect x="${labelX - (edge.label.length * 6 + 10) / 2}" y="${labelY - 9}" width="${edge.label.length * 6 + 10}" height="17" rx="4" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
          <text x="${labelX}" y="${labelY + 3}" font-size="11" font-family="-apple-system, system-ui, sans-serif" font-weight="500" fill="#475569" text-anchor="middle">${codeEscape(edge.label)}</text>
        `
            : ''
        }
      </g>
    `;
  });

  // 2. 绘制节点 (Nodes)
  let nodesSvg = '';
  nodes.forEach((node, idx) => {
    const pos = posMap.get(node.id);
    if (!pos) return;

    const theme = colorThemes[idx % colorThemes.length];
    const { x, y } = pos;
    const labelText = codeEscape(node.label || node.id);

    let shapeSvg = '';
    const rx = node.shape === 'pill' ? 22 : node.shape === 'round' ? 8 : node.shape === 'circle' ? 22 : 4;

    if (node.shape === 'diamond') {
      const cx = x + nodeWidth / 2;
      const cy = y + nodeHeight / 2;
      const halfW = nodeWidth / 2;
      const halfH = nodeHeight / 2;
      shapeSvg = `<polygon points="${cx},${cy - halfH} ${cx + halfW},${cy} ${cx},${cy + halfH} ${cx - halfW},${cy}" fill="${theme.bg}" stroke="${theme.stroke}" stroke-width="2" filter="url(#${uid}-shadow)" />`;
    } else {
      shapeSvg = `<rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="${rx}" fill="${theme.bg}" stroke="${theme.stroke}" stroke-width="2" filter="url(#${uid}-shadow)" />`;
    }

    nodesSvg += `
      <g>
        ${shapeSvg}
        <text x="${x + nodeWidth / 2}" y="${y + nodeHeight / 2 + 5}" font-size="13" font-weight="600" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" fill="${theme.text}" text-anchor="middle">
          ${labelText}
        </text>
      </g>
    `;
  });

  return `
<section class="wechat-mermaid-container" style="margin: 1.8em 0; overflow-x: auto; -webkit-overflow-scrolling: touch; text-align: center;">
  <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="max-width: 100%; height: auto; display: inline-block; border-radius: 12px; background: #fafafa; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 10px;">
    <defs>
      <marker id="${uid}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
      </marker>
      <filter id="${uid}-shadow" x="-5%" y="-5%" width="110%" height="115%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.05"/>
      </filter>
    </defs>
    ${edgesSvg}
    ${nodesSvg}
  </svg>
  <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; letter-spacing: 0.05em;">📊 矢量流程图 · 微信全端无损直出</div>
</section>`;
}

/**
 * 解析并渲染时序图 (Sequence Diagram)
 */
function renderSequenceDiagram(lines: string[], uid: string): string {
  const participants: string[] = [];
  const participantLabels = new Map<string, string>();
  const messages: Array<{ from: string; to: string; text: string; isDotted: boolean }> = [];

  for (const line of lines) {
    if (!line || line.startsWith('%%')) continue;

    // participant A as 客户端
    const partMatch = line.match(/^participant\s+([A-Za-z0-9_\u4e00-\u9fa5\-]+)(?:\s+as\s+(.*))?$/i);
    if (partMatch) {
      const pId = partMatch[1];
      const pLabel = partMatch[2] ? partMatch[2].trim() : pId;
      if (!participants.includes(pId)) {
        participants.push(pId);
      }
      participantLabels.set(pId, pLabel);
      continue;
    }

    // A ->> B: 文本 或 A -->> B: 文本
    const msgMatch = line.match(/^([A-Za-z0-9_\u4e00-\u9fa5\-]+)\s*(-->>|->>|-->|->)\s*([A-Za-z0-9_\u4e00-\u9fa5\-]+)\s*:\s*(.*)$/);
    if (msgMatch) {
      const from = msgMatch[1];
      const arrow = msgMatch[2];
      const to = msgMatch[3];
      const text = msgMatch[4].trim();

      if (!participants.includes(from)) participants.push(from);
      if (!participants.includes(to)) participants.push(to);

      messages.push({
        from,
        to,
        text,
        isDotted: arrow.includes('--'),
      });
    }
  }

  if (participants.length === 0) {
    return '';
  }

  const colWidth = 150;
  const headerHeight = 38;
  const msgGap = 48;
  const paddingX = 30;
  const totalWidth = participants.length * colWidth + paddingX * 2;
  const totalHeight = headerHeight + messages.length * msgGap + 70;

  const colX = new Map<string, number>();
  participants.forEach((p, i) => {
    colX.set(p, paddingX + i * colWidth + 25);
  });

  let svgContent = '';

  // 1. 生命线 (Lifelines)
  participants.forEach((p) => {
    const x = colX.get(p)! + 50;
    svgContent += `
      <line x1="${x}" y1="${headerHeight + 20}" x2="${x}" y2="${totalHeight - 30}" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 4" />
    `;
  });

  // 2. 参与者盒子 (Participant Header Boxes)
  participants.forEach((p, idx) => {
    const x = colX.get(p)!;
    const label = participantLabels.get(p) || p;
    const colors = [
      { bg: '#eff6ff', stroke: '#3b82f6', text: '#1e40af' },
      { bg: '#f0fdf4', stroke: '#10b981', text: '#065f46' },
      { bg: '#faf5ff', stroke: '#8b5cf6', text: '#5b21b6' },
      { bg: '#fff7ed', stroke: '#f97316', text: '#9a3412' },
    ];
    const theme = colors[idx % colors.length];

    svgContent += `
      <g>
        <rect x="${x}" y="12" width="100" height="${headerHeight}" rx="8" fill="${theme.bg}" stroke="${theme.stroke}" stroke-width="2" />
        <text x="${x + 50}" y="${12 + headerHeight / 2 + 5}" font-size="12" font-weight="600" font-family="-apple-system, sans-serif" fill="${theme.text}" text-anchor="middle">
          ${codeEscape(label)}
        </text>
      </g>
    `;
  });

  // 3. 消息流箭头 (Messages)
  messages.forEach((msg, idx) => {
    const x1 = colX.get(msg.from)! + 50;
    const x2 = colX.get(msg.to)! + 50;
    const y = headerHeight + 42 + idx * msgGap;
    const strokeDash = msg.isDotted ? 'stroke-dasharray="4 4"' : '';

    svgContent += `
      <g>
        <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#475569" stroke-width="1.8" ${strokeDash} marker-end="url(#${uid}-arrow)" />
        <rect x="${(x1 + x2) / 2 - (msg.text.length * 6 + 10) / 2}" y="${y - 18}" width="${msg.text.length * 6 + 10}" height="16" rx="4" fill="#ffffff" opacity="0.95" />
        <text x="${(x1 + x2) / 2}" y="${y - 6}" font-size="11" font-weight="500" font-family="-apple-system, sans-serif" fill="#1e293b" text-anchor="middle">${codeEscape(msg.text)}</text>
      </g>
    `;
  });

  return `
<section class="wechat-mermaid-container" style="margin: 1.8em 0; overflow-x: auto; -webkit-overflow-scrolling: touch; text-align: center;">
  <svg viewBox="0 0 ${totalWidth} ${totalHeight}" style="max-width: 100%; height: auto; display: inline-block; border-radius: 12px; background: #fafafa; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 10px;">
    <defs>
      <marker id="${uid}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
      </marker>
    </defs>
    ${svgContent}
  </svg>
  <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; letter-spacing: 0.05em;">📊 矢量时序图 · 微信全端无损直出</div>
</section>`;
}

/**
 * 解析并渲染饼图 (Pie Chart)
 */
function renderPieChart(lines: string[], uid: string): string {
  let title = '数据占比';
  const slices: Array<{ label: string; value: number }> = [];

  for (const line of lines) {
    if (!line || line.startsWith('%%')) continue;
    if (line.toLowerCase().startsWith('pie')) {
      const tMatch = line.match(/title\s+(.*)/i);
      if (tMatch) title = tMatch[1].trim();
      continue;
    }
    const sliceMatch = line.match(/"(.*?)"\s*:\s*([0-9.]+)/);
    if (sliceMatch) {
      slices.push({
        label: sliceMatch[1].trim(),
        value: parseFloat(sliceMatch[2]),
      });
    }
  }

  if (slices.length === 0) return '';

  const total = slices.reduce((acc, cur) => acc + cur.value, 0);
  if (total <= 0) return '';

  const cx = 130;
  const cy = 130;
  const r = 90;
  const innerR = 48; // Donut style
  let currentAngle = -Math.PI / 2;

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

  let pathsSvg = '';
  let legendSvg = '';

  slices.forEach((slice, idx) => {
    const fraction = slice.value / total;
    const angle = fraction * 2 * Math.PI;
    const endAngle = currentAngle + angle;

    const x1 = cx + r * Math.cos(currentAngle);
    const y1 = cy + r * Math.sin(currentAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const inX1 = cx + innerR * Math.cos(currentAngle);
    const inY1 = cy + innerR * Math.sin(currentAngle);
    const inX2 = cx + innerR * Math.cos(endAngle);
    const inY2 = cy + innerR * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    const pathD = `M ${inX1} ${inY1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${inX2} ${inY2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${inX1} ${inY1} Z`;

    const color = colors[idx % colors.length];
    pathsSvg += `<path d="${pathD}" fill="${color}" stroke="#ffffff" stroke-width="2" />`;

    // Legend item
    const pct = (fraction * 100).toFixed(1);
    const legY = 50 + idx * 24;
    legendSvg += `
      <g transform="translate(260, ${legY})">
        <rect width="12" height="12" rx="3" fill="${color}" />
        <text x="20" y="10" font-size="12" font-weight="500" font-family="-apple-system, sans-serif" fill="#334155">${codeEscape(slice.label)} (${pct}%)</text>
      </g>
    `;

    currentAngle = endAngle;
  });

  const svgHeight = Math.max(260, 60 + slices.length * 26);

  return `
<section class="wechat-mermaid-container" style="margin: 1.8em 0; overflow-x: auto; -webkit-overflow-scrolling: touch; text-align: center;">
  <svg viewBox="0 0 460 ${svgHeight}" style="max-width: 100%; height: auto; display: inline-block; border-radius: 12px; background: #fafafa; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 10px;">
    <text x="230" y="26" font-size="14" font-weight="700" font-family="-apple-system, sans-serif" fill="#1e293b" text-anchor="middle">${codeEscape(title)}</text>
    <g>${pathsSvg}</g>
    <g>${legendSvg}</g>
  </svg>
  <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; letter-spacing: 0.05em;">📊 矢量饼图 · 微信全端无损直出</div>
</section>`;
}

function codeEscape(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
