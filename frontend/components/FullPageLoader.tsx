import { colors } from "@/lib/theme";
import { Spinner } from "@/components/ui/Spinner";

export function FullPageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.primary,
      }}
    >
      <Spinner size={28} />
    </div>
  );
}