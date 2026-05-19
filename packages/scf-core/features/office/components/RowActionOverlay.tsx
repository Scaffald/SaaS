import { Eye, Pencil, X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { Button, Row, useThemeContext } from "@scaffald/ui";
import { DeleteButton } from "./DeleteButton";
import { DuplicateButton } from "./DuplicateButton";
import { colors } from "@scaffald/ui/tokens";

export interface RowActionOverlayProps<TData> {
  /** The row data */
  row: TData;
  /** View action handler */
  onView?: (row: TData) => void;
  /** Edit action handler */
  onEdit: (row: TData) => void;
  /** Delete action handler */
  onDelete: (row: TData) => Promise<void>;
  /** Duplicate action handler */
  onDuplicate?: (row: TData) => Promise<void>;
  /** Position of the overlay */
  position: { x: number; y: number };
  /** Close handler */
  onClose: () => void;
  /** Name of the item (for delete confirmation) */
  itemName: string;
  /** Type of item (for delete confirmation) */
  itemType: string;
}

/**
 * RowActionOverlay - Overlay that appears on table row click
 *
 * Shows View, Edit, Delete actions in an overlay positioned relative to the clicked row.
 * Dismisses on outside click or Escape key.
 *
 * @example
 * ```tsx
 * <RowActionOverlay
 *   row={selectedRow}
 *   position={{ x: 100, y: 200 }}
 *   onEdit={(row) => router.push(buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: row.id }))}
 *   onDelete={async (row) => await deleteMutation.mutateAsync({ id: row.id })}
 *   onClose={() => setSelectedRow(null)}
 *   itemName={selectedRow.name}
 *   itemType="job"
 * />
 * ```
 */
export function RowActionOverlay<TData>({
  row,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  position,
  onClose,
  itemName,
  itemType,
}: RowActionOverlayProps<TData>) {
  const { theme } = useThemeContext();
  const overlayRef = useRef<View>(null);

  // Handle Escape key (web only — native uses a back-button modal pattern)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape); // platform-allow: gated above by Platform.OS !== 'web'
    return () => document.removeEventListener("keydown", handleEscape); // platform-allow: gated above by Platform.OS !== 'web'
  }, [onClose]);

  // Handle outside click (web only)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const handleClickOutside = (e: MouseEvent) => {
      const el = overlayRef.current as unknown as HTMLElement | null;
      if (el && !el.contains(e.target as Node)) onClose();
    };

    // Use setTimeout to avoid immediate dismissal on the click that opened the overlay
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside); // platform-allow: gated above by Platform.OS !== 'web'
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside); // platform-allow: gated above by Platform.OS !== 'web'
    };
  }, [onClose]);

  const handleDelete = async () => {
    await onDelete(row);
    onClose();
  };

  const handleDuplicate = async () => {
    if (onDuplicate) {
      await onDuplicate(row);
      onClose();
    }
  };

  return (
    <View
      ref={overlayRef}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: colors.border[theme].default,
        borderRadius: 16,
        padding: 8,
        backgroundColor: colors.bg[theme].subtle,
        ...(typeof window !== "undefined"
          ? { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }
          : {}),
      }}
    >
      <Row gap={8}>
        {onView && (
          <Button
            size="sm"
            variant="outline"
            iconStart={Eye}
            onPress={() => {
              onView(row);
              onClose();
            }}
          >
            View
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          iconStart={Pencil}
          onPress={() => {
            onEdit(row);
            onClose();
          }}
        >
          Edit
        </Button>
        {onDuplicate && (
          <DuplicateButton
            itemName={itemName}
            itemType={itemType}
            onDuplicate={handleDuplicate}
            size="sm"
            variant="outline"
          />
        )}
        <DeleteButton
          itemName={itemName}
          itemType={itemType}
          onDelete={handleDelete}
          size="sm"
          variant="outline"
        />
        <Button size="sm" variant="outline" iconStart={X} onPress={onClose}>
          Close
        </Button>
      </Row>
    </View>
  );
}
