import { ScanResult } from '../types';

interface TreeNode {
  name: string;
  isDir: boolean;
  children: Map<string, TreeNode>;
}

export function generateProjectTree(scan: ScanResult, maxDepth = 2): string {
  const rootName = '.';
  const treeLines: string[] = [rootName];

  const validFiles = scan.files.filter(f => {
    if (f.scope === 'fixture' || f.scope === 'vendor' || f.scope === 'generated') return false;
    return true;
  });

  const root: TreeNode = { name: rootName, isDir: true, children: new Map() };

  for (const f of validFiles) {
    const parts = f.path.split('/');
    const limit = Math.min(parts.length, maxDepth);

    let current = root;
    for (let i = 0; i < limit; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const isDir = isLast ? f.isDirectory : true;
      
      if (!current.children.has(part)) {
        current.children.set(part, { name: part, isDir, children: new Map() });
      } else if (isDir) {
        current.children.get(part)!.isDir = true;
      }
      current = current.children.get(part)!;
    }
  }

  function printNode(node: TreeNode, indent: string, isLast: boolean, depth: number) {
    if (depth > 0) {
      const prefix = isLast ? '└── ' : '├── ';
      const displayName = node.isDir ? `${node.name}/` : node.name;
      treeLines.push(`${indent}${prefix}${displayName}`);
    }

    if (node.isDir && depth < maxDepth) {
      const childIndent = depth === 0 ? '' : indent + (isLast ? '    ' : '│   ');
      
      const childrenArray = Array.from(node.children.values()).sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
      
      const cap = 12;
      const displayChildren = childrenArray.slice(0, cap);
      const hasMore = childrenArray.length > cap;

      displayChildren.forEach((child, idx) => {
        const childIsLast = idx === displayChildren.length - 1 && !hasMore;
        printNode(child, childIndent, childIsLast, depth + 1);
      });

      if (hasMore) {
        treeLines.push(`${childIndent}└── ...`);
      }
    }
  }

  printNode(root, '', true, 0);

  return treeLines.join('\n');
}
