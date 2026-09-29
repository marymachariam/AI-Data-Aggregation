import { colors } from "@/lib/theme";
import { Spinner } from "@/components/ui/Spinner";

export function LoadingBlock() {
  return (
    <div style={{ padding: 48, display: "flex", justifyContent: "center", color: colors.primary }}>
      <Spinner size={24} />
    </div>
  );
}