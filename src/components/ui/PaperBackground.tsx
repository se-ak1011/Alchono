import React from 'react';
import { ImageBackground, type StyleProp, type ViewStyle } from 'react-native';

/**
 * The notebook-page backdrop shared by the "written on paper" screens (A note,
 * Your Notes, Recovery, Tonight). Fills the screen with the drawn cream page;
 * content layers on top. Because the paper is light, the content on these
 * screens uses DARK INK (not the app's usual light-on-dark text).
 */
export function PaperBackground({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ImageBackground
      source={require('../../../assets/scenes/notebook_page.png')}
      style={[{ flex: 1, backgroundColor: '#e9dfc9' }, style]}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
}
