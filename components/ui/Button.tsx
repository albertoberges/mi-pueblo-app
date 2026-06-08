import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { Colors } from "@/constants/colors";

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  onPress, label, variant = "primary", size = "md",
  loading, disabled, icon, fullWidth = false,
}: ButtonProps) {
  const bgMap = {
    primary: Colors.primary,
    secondary: Colors.secondary,
    outline: "transparent",
    danger: Colors.danger,
    ghost: "transparent",
  };
  const textColorMap = {
    primary: "#fff",
    secondary: "#fff",
    outline: Colors.primary,
    danger: "#fff",
    ghost: Colors.primary,
  };
  const sizeMap = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-3 text-base rounded-xl",
    lg: "px-6 py-4 text-lg rounded-xl",
  };
  const borderStyle = variant === "outline" ? { borderWidth: 1.5, borderColor: Colors.primary } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center ${sizeMap[size]} ${fullWidth ? "w-full" : ""}`}
      style={[{ backgroundColor: bgMap[variant], opacity: disabled ? 0.5 : 1 }, borderStyle]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColorMap[variant]} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className="font-semibold" style={{ color: textColorMap[variant] }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
