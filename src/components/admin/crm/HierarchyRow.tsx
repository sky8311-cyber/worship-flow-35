import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Building2, Crown, Users, User, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export type EntityType = "church_account" | "worship_leader" | "community" | "member";

export interface HierarchyNode {
  id: string;
  type: EntityType;
  data: any;
  children: HierarchyNode[];
}

interface HierarchyRowProps {
  node: HierarchyNode;
  depth: number;
  isExpanded: boolean;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectEntity: (node: HierarchyNode) => void;
}

const typeConfig = {
  church_account: {
    icon: Building2,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    badgeClass: "bg-blue-500",
  },
  worship_leader: {
    icon: Crown,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    badgeClass: "bg-purple-500",
  },
  community: {
    icon: Users,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    badgeClass: "bg-green-500",
  },
  member: {
    icon: User,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    badgeClass: "bg-orange-500",
  },
};

export const HierarchyRow = ({
  node,
  depth,
  isExpanded,
  expandedNodes,
  onToggleExpand,
  onSelectEntity,
}: HierarchyRowProps) => {
  const hasChildren = node.children.length > 0;
  const config = typeConfig[node.type];
  const Icon = config.icon;
  
  // Get display info based on entity type
  const getDisplayInfo = () => {
    const { data, type } = node;
    
    switch (type) {
      case "church_account":
        return {
          name: data.name,
          email: data.owner?.email || "-",
          avatar: data.logo_url,
          typeLabel: data.subscription_status === "active" ? "Active" : data.subscription_status,
          stats: `${data.communityCount || 0} communities · ${data.memberCount || 0} members`,
          created: data.created_at,
        };
      case "worship_leader":
        return {
          name: data.profile?.full_name || "Unknown",
          email: data.profile?.email || "-",
          avatar: data.profile?.avatar_url,
          typeLabel: data.churchAccount ? "Church" : data.isPremium ? "Premium" : "Free",
          stats: `${data.communityCount || 0} communities`,
          created: data.createdAt || data.profile?.created_at,
        };
      case "community":
        return {
          name: data.name,
          email: data.leader?.email || "-",
          avatar: data.avatar_url,
          typeLabel: data.is_active ? "Active" : "Inactive",
          stats: `${data.memberCount || 0} members`,
          created: data.created_at,
        };
      case "member":
        return {
          name: data.profile?.full_name || "Unknown",
          email: data.profile?.email || "-",
          avatar: data.profile?.avatar_url,
          typeLabel: data.role || "Member",
          stats: "",
          created: data.joined_at || data.profile?.created_at,
        };
      default:
        return { name: "Unknown", email: "-", avatar: null, typeLabel: "", stats: "", created: null };
    }
  };

  const info = getDisplayInfo();
  const indentPx = depth * 28;
  
  // Row opacity decreases slightly with depth for visual hierarchy
  const rowOpacity = Math.max(0.7, 1 - depth * 0.08);

  return (
    <>
      <TableRow 
        className="group cursor-pointer hover:bg-muted/50 transition-colors"
        style={{ opacity: rowOpacity }}
        onClick={() => onSelectEntity(node)}
      >
        {/* Expand/Collapse + Icon + Name Column */}
        <TableCell className="py-3">
          <div className="flex items-center" style={{ paddingLeft: `${indentPx}px` }}>
            {/* Tree connector line */}
            {depth > 0 && (
              <div className="relative">
                <div 
                  className="absolute border-l-2 border-muted-foreground/20" 
                  style={{ 
                    left: -14, 
                    top: -20, 
                    height: 28,
                  }} 
                />
                <div 
                  className="absolute border-t-2 border-muted-foreground/20" 
                  style={{ 
                    left: -14, 
                    top: 8, 
                    width: 10,
                  }} 
                />
              </div>
            )}
            
            {/* Expand Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 mr-1 ${!hasChildren ? 'invisible' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            
            {/* Avatar/Icon */}
            {info.avatar ? (
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage src={info.avatar} />
                <AvatarFallback className={config.bgColor}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className={`h-8 w-8 rounded-full ${config.bgColor} flex items-center justify-center mr-3`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
            )}
            
            {/* Name */}
            <div className="flex flex-col">
              <span className="font-medium text-sm">{info.name}</span>
              {hasChildren && (
                <span className="text-xs text-muted-foreground">
                  {node.children.length} {node.children.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
          </div>
        </TableCell>

        {/* Email Column */}
        <TableCell className="text-sm text-muted-foreground">
          {info.email}
        </TableCell>

        {/* Type Column */}
        <TableCell>
          <Badge variant="secondary" className={`${config.badgeClass} text-white text-xs`}>
            {info.typeLabel}
          </Badge>
        </TableCell>

        {/* Stats Column */}
        <TableCell className="text-sm text-muted-foreground">
          {info.stats || "-"}
        </TableCell>

        {/* Created Column */}
        <TableCell className="text-sm text-muted-foreground">
          {info.created ? formatDistanceToNow(new Date(info.created), { addSuffix: true }) : "-"}
        </TableCell>

        {/* Action Column */}
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onSelectEntity(node);
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      {/* Render children with animation */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <>
            {node.children.map((child) => (
              <motion.tr
                key={child.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="contents"
              >
                <HierarchyRow
                  node={child}
                  depth={depth + 1}
                  isExpanded={expandedNodes.has(child.id)}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  onSelectEntity={onSelectEntity}
                />
              </motion.tr>
            ))}
          </>
        )}
      </AnimatePresence>
    </>
  );
};
