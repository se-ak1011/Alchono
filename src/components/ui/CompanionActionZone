import React, { useEffect, useState } from "react";
import { View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
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

const COMPANION_DISCOVERY_KEY = "alchono:companion-discovery-seen";

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
  const [showDiscoveryCue, setShowDiscoveryCue] = useState(false);
  const haloScale = useSharedValue(0.82);
  const haloOpacity = useSharedValue(0);
  const companionScale = useSharedValue(1);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(COMPANION_DISCOVERY_KEY).then((seen) => {
      if (mounted && !seen) setShowDiscoveryCue(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!showDiscoveryCue) return;
    haloOpacity.value = withDelay(550, withSequence(withTiming(0.18, { duration: 450 }), withTiming(0, { duration: 1200 })));
    haloScale.value = withDelay(550, withSequence(withTiming(1, { duration: 450 }), withTiming(1.34, { duration: 1200 })));
    companionScale.value = withDelay(550, withSequence(withTiming(1.018, { duration: 650 }), withTiming(1, { duration: 900 })));
  }, [showDiscoveryCue, haloOpacity, haloScale, companionScale]);

  const haloStyle = useAnimatedStyle(() => ({ opacity: haloOpacity.value, transform: [{ scale: haloScale.value }] }));
  const companionStyle = useAnimatedStyle(() => ({ transform: [{ scale: companionScale.value }] }));

  const anchor = {
    x: companionLeft + width / 2,
    y: companionTop + (cropHeight ?? height) / 2,
  };

  const handlePress = async () => {
    if (showDiscoveryCue) {
      setShowDiscoveryCue(false);
      await AsyncStorage.setItem(COMPANION_DISCOVERY_KEY, "true");
    }
    onPress();
  };

  return (
    <View className={className} style={[{ height: zoneHeight, position: "relative", overflow: "visible" }, style]}>
      <View style={{ position: "absolute", left: companionLeft, top: companionTop }}>
        {showDiscoveryCue ? (
          <Animated.View
            pointerEvents="none"
            style={[haloStyle, {
              position: "absolute",
              left: -10,
              top: -8,
              width: width + 20,
              height: (cropHeight ?? height) + 16,
              borderRadius: Math.max(width, cropHeight ?? height),
              backgroundColor: "rgba(240,242,244,0.28)",
            }]}
          />
        ) : null}
        <Animated.View style={companionStyle}>
          <CompanionArt source={source} width={width} height={height} cropHeight={cropHeight} onPress={handlePress} onLongPress={onLongPress} />
        </Animated.View>
      </View>
      <CompanionMenu visible={visible} onClose={onClose} context={context} quietSignal={quietSignal} onVoiceNote={onVoiceNote} zoneLayout={{ anchor, points, caption }} />
    </View>
  );
}