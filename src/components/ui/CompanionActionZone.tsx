import React from "react";
import { View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import { CompanionArt } from "@/components/ui/CompanionArt";
import { CompanionMenu, type CompanionMenuPoint } from "@/components/ui/CompanionMenu";

type CompanionActionZoneProps = {
  context: "home" | "journal" | "support";
  visible: boolean;
  onClose: () => void;
  onPress: () => void;
  onLongPress?: () => void;
  quietSignal?: number;
  onVoiceNote?: () => void;
  source: ImageSourcePropType;
  width: number;
  height: number;
  cropHeight?: number;
  zoneHeight: number;
  companionLeft: number;
  companionTop: number;
  points: CompanionMenuPoint[];
  caption?: CompanionMenuPoint;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function CompanionActionZone({
  context,
  visible,
  onClose,
  onPress,
  onLongPress,
  quietSignal,
  onVoiceNote,
  source,
  width,
  height,
  cropHeight,
  zoneHeight,
  companionLeft,
  companionTop,
  points,
  caption,
  className,
  style,
}: CompanionActionZoneProps) {
  const anchor = {
    x: companionLeft + width / 2,
    y: companionTop + (cropHeight ?? height) / 2,
  };

  return (
    <View
      className={className}
      style={[{ height: zoneHeight, position: "relative", overflow: "visible" }, style]}
    >
      <View style={{ position: "absolute", left: companionLeft, top: companionTop }}>
        <CompanionArt
          source={source}
          width={width}
          height={height}
          cropHeight={cropHeight}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      </View>
      <CompanionMenu
        visible={visible}
        onClose={onClose}
        context={context}
        quietSignal={quietSignal}
        onVoiceNote={onVoiceNote}
        zoneLayout={{ anchor, points, caption }}
      />
    </View>
  );
}
