import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HierarchyRow, HierarchyNode, EntityType } from "./HierarchyRow";

interface UnifiedHierarchyTableProps {
  nodes: HierarchyNode[];
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectEntity: (node: HierarchyNode) => void;
  typeFilter: EntityType | "all";
}

export const UnifiedHierarchyTable = ({
  nodes,
  expandedNodes,
  onToggleExpand,
  onSelectEntity,
  typeFilter,
}: UnifiedHierarchyTableProps) => {
  // Flatten nodes if filtering to a specific type
  const getDisplayNodes = (): HierarchyNode[] => {
    if (typeFilter === "all") {
      return nodes;
    }

    // Recursively collect all nodes of the specified type
    const collectByType = (nodeList: HierarchyNode[], targetType: EntityType): HierarchyNode[] => {
      const result: HierarchyNode[] = [];
      
      for (const node of nodeList) {
        if (node.type === targetType) {
          // Show the node without children when filtering
          result.push({ ...node, children: [] });
        }
        // Also check children
        if (node.children.length > 0) {
          result.push(...collectByType(node.children, targetType));
        }
      }
      
      return result;
    };

    return collectByType(nodes, typeFilter);
  };

  const displayNodes = getDisplayNodes();

  if (displayNodes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No data found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="w-[350px] font-semibold">Name</TableHead>
          <TableHead className="font-semibold">Email</TableHead>
          <TableHead className="w-[120px] font-semibold">Type</TableHead>
          <TableHead className="font-semibold">Stats</TableHead>
          <TableHead className="w-[150px] font-semibold">Created</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayNodes.map((node) => (
          <HierarchyRow
            key={node.id}
            node={node}
            depth={0}
            isExpanded={expandedNodes.has(node.id)}
            expandedNodes={expandedNodes}
            onToggleExpand={onToggleExpand}
            onSelectEntity={onSelectEntity}
          />
        ))}
      </TableBody>
    </Table>
  );
};
