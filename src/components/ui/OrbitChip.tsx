import React from "react";
import {
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type OrbitChipProps = {
  label: string;
  onPress: () => void;
  accent?: string;
  emergency?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
};

export function OrbitChip({
  label,
  onPress,
  accent,
  emergency = false,
  onLayout,
  style,
}: OrbitChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLayout={onLayout}
      className="active:opacity-70"
      style={[
        {
          minHeight: 38,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: 13,
          paddingVertical: 6,
          borderRadius: 19,
          backgroundColor: emergency
            ? "rgba(59,51,82,0.96)"
            : "rgba(20,18,24,0.88)",
          borderWidth: 1,
          borderColor: emergency
            ? "rgba(190,160,210,0.58)"
            : "rgba(236,233,241,0.14)",
          shadowColor: "#000",
          shadowOpacity: emergency ? 0.5 : 0.28,
          shadowRadius: emergency ? 12 : 8,
          shadowOffset: { width: 0, height: 4 },
        },
        style,
      ]}
    >
      {accent ? (
        <View
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: accent,
          }}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={{
          color: "#ECE9F1",
          fontFamily: "SkinnyCustard",
          fontSize: 20,
          lineHeight: 23,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
