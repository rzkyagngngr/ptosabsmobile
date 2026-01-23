import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

// Animated LinearGradient for animations
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * OilDroplet Component
 * 
 * Creates expanding oil-on-water droplet effect with chromatic aberration
 */
function OilDroplet({ delay = 0, position = 'right' }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 6000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 6000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const scale = progress.interpolate({
    inputRange: [0, 0.08, 0.15, 0.3, 0.5, 0.7, 0.9, 1],
    outputRange: [0, 0.5, 1.2, 3, 7, 13, 22, 30],
  });

  const rotation = progress.interpolate({
    inputRange: [0, 0.08, 0.15, 0.3, 0.5, 0.7, 0.9, 1],
    outputRange: position === 'left' ? 
      [0, -10, -20, -40, -70, -110, -150, -180] :
      [0, 10, 20, 40, 70, 110, 150, 180],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.08, 0.15, 0.3, 0.5, 0.7, 0.9, 1],
    outputRange: [0, 0.85, 1, 0.95, 0.85, 0.6, 0.2, 0],
  });

  const positionStyle = position === 'right' ? 
    { right: '25%', bottom: 3 } : 
    { left: '25%', top: 3 };

  return (
    <Animated.View
      style={[
        styles.droplet,
        positionStyle,
        {
          transform: [
            { scale },
            { rotate: rotation + 'deg' },
          ],
          opacity,
        },
      ]}
    >
      {/* Core white highlight with blue/cyan edges */}
      <LinearGradient
        colors={[
          'rgba(200, 220, 255, 1)',
          'rgba(180, 210, 255, 0.95)',
          'rgba(160, 200, 255, 0.9)',
          'rgba(100, 150, 255, 0.85)',
          'rgba(80, 130, 255, 0.9)',
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 0.95)',
          'rgba(80, 130, 255, 0.9)',
          'rgba(60, 110, 230, 0.85)',
          'rgba(100, 180, 255, 0.8)',
          'rgba(140, 200, 255, 0.7)',
          'rgba(160, 210, 255, 0.6)',
          'rgba(180, 220, 255, 0.5)',
          'rgba(200, 230, 255, 0.4)',
          'transparent',
        ]}
        locations={[0.42, 0.44, 0.46, 0.48, 0.50, 0.52, 0.54, 0.56, 0.58, 0.60, 0.62, 0.64, 0.66, 0.68, 0.72]}
        start={{ x: 0.48, y: 0.48 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Secondary cyan shimmer layer */}
      <LinearGradient
        colors={[
          'rgba(150, 220, 255, 0.95)',
          'rgba(120, 200, 255, 0.9)',
          'rgba(80, 150, 255, 0.95)',
          'rgba(255, 255, 255, 0.9)',
          'rgba(100, 180, 255, 0.85)',
          'rgba(70, 140, 240, 0.8)',
          'rgba(120, 200, 255, 0.75)',
          'rgba(140, 210, 255, 0.7)',
          'rgba(160, 220, 255, 0.6)',
          'rgba(180, 230, 255, 0.5)',
          'rgba(200, 235, 255, 0.45)',
          'transparent',
        ]}
        locations={[0.44, 0.46, 0.48, 0.50, 0.52, 0.54, 0.56, 0.58, 0.60, 0.62, 0.64, 0.68]}
        start={{ x: 0.52, y: 0.52 }}
        end={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/**
 * LiquidMetalBorder Component
 * 
 * Creates oil-on-water droplet effects that expand and ripple across the border
 */
function LiquidMetalBorder() {
  return (
    <View style={styles.borderContainer}>
      {/* Dark base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a1a' }]} />
      
      {/* Droplet 1 - bottom right */}
      <OilDroplet delay={0} position="right" />
      
      {/* Droplet 2 - top left (opposite) */}
      <OilDroplet delay={3000} position="left" />
      
      {/* Droplet 3 - center (for variation) */}
      <OilDroplet delay={1500} position="right" />
    </View>
  );
}


/**
 * CustomBottomTabBar Component
 * 
 * Liquid glass + flowing liquid metal border design.
 * Uses standard Animated API for Expo Go compatibility.
 * 
 * Platform strategy:
 * - iOS: native BlurView for true glass morphism
 * - Android: translucent background fallback
 * - Animations: Standard Animated API (works in Expo Go)
 */
export default function CustomBottomTabBar({ state, descriptors, navigation }) {
  const safePaddingBottom = Platform.select({
    ios: 20,
    android: 10,
  });

  return (
    <View style={[styles.outerContainer, { paddingBottom: safePaddingBottom }]}>
      <View style={styles.borderWrapper}>
        <LiquidMetalBorder />
        
        <View style={styles.glassContainer}>
          <View style={styles.glassBackground} />
          <LinearGradient
            colors={['rgba(232, 232, 240, 0)', 'rgba(232, 232, 240, 1)', 'rgba(232, 232, 240, 1)']}
            locations={[0, 0.4, 1]}
            style={styles.edgeBlur}
          />

          <View style={styles.contentContainer}>
            <LinearGradient
              colors={['rgba(0,0,0,0.05)', 'transparent']}
              style={styles.innerShadowHelper}
            />
            
            <RenderNavItems
              state={state}
              descriptors={descriptors}
              navigation={navigation}
            />
          </View>
        </View>
      </View>
    </View>
  );
}


/**
 * RenderNavItems Component
 * 
 * Renders individual navigation tabs with active state styling.
 */
function RenderNavItems({ state, descriptors, navigation }) {
  return (
    <View style={styles.navMenu}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            preventDefault: () => {},
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const getIconName = () => {
          if (route.name === 'Home') return 'home';
          if (route.name === 'History') return 'clock';
          if (route.name === 'Settings') return 'cog';
          return 'circle';
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={[styles.navItem, isFocused && styles.navItemActive]}
          >
            <View style={styles.iconWrapper}>
              <FontAwesome5
                name={getIconName()}
                size={22}
                color={isFocused ? '#2A2A2A' : '#888888'}
                solid={isFocused}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                isFocused ? styles.navLabelActive : styles.navLabelInactive,
              ]}
            >
              {label}
            </Text>
            
            {isFocused && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}


const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },

  borderWrapper: {
    borderRadius: 35,
    padding: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
        backgroundColor: 'transparent',
        shadowColor: '#000',
      },
    }),
    marginBottom: 10,
  },

  borderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },

  borderLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 35,
  },

  droplet: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },

  glassContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },

  glassBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E8E8F0',
    borderRadius: 30,
  },

  edgeBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },

  contentContainer: {
      paddingVertical: 8,
  },
  
  innerShadowHelper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 15,
    zIndex: 0,
  },

  navMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },

  navItemActive: {
    backgroundColor: 'rgba(200, 200, 200, 0.2)',
  },

  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  navLabelActive: {
    color: '#1F2937',
    fontWeight: '700',
  },

  navLabelInactive: {
    color: '#888888',
    fontWeight: '500',
  },
  
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1F2937',
  },
});

