import { useEffect, useMemo } from 'react'
import MapboxGL from '@rnmapbox/maps'
import Constants from 'expo-constants'
import { StyleSheet } from 'react-native'
import { Text, Theme, View, YStack } from '@app/ui'

import type { TalentMapProps } from './types'
import { createRadiusFeature, radiusToZoomLevel } from './geometry'

let isTokenInitialized = false

const getConfig = () => {
  const extras = Constants.expoConfig?.extra as {
    mapbox?: { accessToken?: string; styleURL?: string }
  }
  return {
    accessToken: extras?.mapbox?.accessToken ?? process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
    styleURL:
      extras?.mapbox?.styleURL ??
      process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ??
      MapboxGL.StyleURL.Street,
  }
}

export const TalentMap = ({
  center,
  markers,
  radiusMeters,
  selectedMarkerId,
  onMarkerPress,
}: TalentMapProps) => {
  const config = useMemo(getConfig, [])

  useEffect(() => {
    if (config.accessToken && !isTokenInitialized) {
      MapboxGL.setAccessToken(config.accessToken)
      isTokenInitialized = true
    }
    void MapboxGL.setTelemetryEnabled(false)
  }, [config.accessToken])

  const circleFeature = useMemo(() => {
    if (!radiusMeters) return null
    return createRadiusFeature(center, radiusMeters)
  }, [center, radiusMeters])

  const zoomLevel = useMemo(
    () => (radiusMeters ? radiusToZoomLevel(radiusMeters) : 8),
    [radiusMeters]
  )

  return (
    <View flex={1} position="relative" overflow="hidden" borderRadius="$5">
      <MapboxGL.MapView styleURL={config.styleURL} style={StyleSheet.absoluteFill}>
        <MapboxGL.Camera centerCoordinate={center} zoomLevel={zoomLevel} animationMode="flyTo" />
        {circleFeature ? (
          <MapboxGL.ShapeSource id="search-radius" shape={circleFeature}>
            <MapboxGL.FillLayer
              id="radius-fill"
              style={{ fillColor: '#2563EB', fillOpacity: 0.18, fillOutlineColor: '#2563EB' }}
            />
            <MapboxGL.LineLayer
              id="radius-stroke"
              style={{ lineColor: '#1E3A8A', lineWidth: 1.5, lineOpacity: 0.7 }}
            />
          </MapboxGL.ShapeSource>
        ) : null}
        {markers.map((marker) => {
          const isSelected = marker.id === selectedMarkerId
          return (
            <MapboxGL.PointAnnotation
              key={marker.id}
              id={marker.id}
              coordinate={marker.coordinate}
              onSelected={() => onMarkerPress?.(marker.id)}
            >
              <Theme name={isSelected ? 'blue' : 'light'}>
                <YStack
                  padding="$2"
                  borderRadius="$10"
                  backgroundColor={isSelected ? '$color9' : '$color6'}
                  borderWidth={1}
                  borderColor={isSelected ? '$color10' : '$color7'}
                >
                  <YStack alignItems="center">
                    <Text fontSize="$2" fontWeight="700" color="$color12">
                      {marker.metric ?? ''}
                    </Text>
                    <Text fontSize="$1" color="$color11">
                      {marker.title}
                    </Text>
                  </YStack>
                </YStack>
              </Theme>
            </MapboxGL.PointAnnotation>
          )
        })}
      </MapboxGL.MapView>
    </View>
  )
}

export default TalentMap
