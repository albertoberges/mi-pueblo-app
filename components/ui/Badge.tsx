import { View, Text } from "react-native";
import { CategoryColors } from "@/constants/colors";

interface BadgeProps {
  label: string;
  category?: string;
  color?: string;
  size?: "sm" | "md";
}

export function Badge({ label, category, color, size = "md" }: BadgeProps) {
  const bg = color ?? (category ? CategoryColors[category] ?? "#7f8c8d" : "#7f8c8d");
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const padding = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";

  return (
    <View className={`rounded-full ${padding}`} style={{ backgroundColor: bg + "22" }}>
      <Text className={`font-medium ${textSize}`} style={{ color: bg }}>
        {label}
      </Text>
    </View>
  );
}
