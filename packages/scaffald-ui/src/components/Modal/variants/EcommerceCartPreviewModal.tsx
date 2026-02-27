/**
 * EcommerceCartPreviewModal component
 * Modal content variant for cart preview with products, quantity controls, and pricing
 * Mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { EcommerceCartPreviewModal } from '@scaffald/ui'
 *
 * <EcommerceCartPreviewModal
 *   items={[
 *     {
 *       id: '1',
 *       title: 'iPhone 15',
 *       description: 'Alpine Green - 1TB',
 *       quantity: 1,
 *       price: 190.0,
 *       image: 'https://example.com/iphone.jpg',
 *     },
 *   ]}
 *   onQuantityChange={(id, quantity) => updateQuantity(id, quantity)}
 *   subtotal={1280.0}
 *   tax={12.0}
 *   total={1292.0}
 *   onApplyCoupon={(code) => applyCoupon(code)}
 * />
 * ```
 */

import { useMemo } from 'react'
import { View, Text, Image, Pressable, StyleSheet, type ViewStyle, type TextStyle } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'
import type { EcommerceCartPreviewModalProps } from './EcommerceCartPreviewModal.types'
import { useThemeContext, type ThemeMode } from '../../../theme'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { borderRadius, borderWidth } from '../../../tokens/borders'
import { typography } from '../../../tokens/typography'
import { Button } from '../../Button'

export function EcommerceCartPreviewModal({
  items,
  onQuantityChange,
  onRemove,
  onApplyCoupon,
  subtotal,
  tax,
  total,
  style,
}: EcommerceCartPreviewModalProps) {
  const { theme } = useThemeContext()

  // Memoized styles
  const productItemBorderStyle = useMemo(() => getProductItemBorder(theme), [theme])
  const productTitleStyle = useMemo(() => getProductTitle(theme), [theme])
  const productDescriptionStyle = useMemo(() => getProductDescription(theme), [theme])
  const quantityControlsStyle = useMemo(() => getQuantityControls(theme), [theme])
  const quantityButtonStyle = useMemo(() => getQuantityButton(theme), [theme])
  const quantityValueStyle = useMemo(() => getQuantityValue(theme), [theme])
  const quantityTextStyle = useMemo(() => getQuantityText(theme), [theme])
  const productPriceStyle = useMemo(() => getProductPrice(theme), [theme])
  const priceLabelStyle = useMemo(() => getPriceLabel(theme), [theme])
  const priceValueStyle = useMemo(() => getPriceValue(theme), [theme])
  const totalRowStyle = useMemo(() => getTotalRow(theme), [theme])
  const totalLabelStyle = useMemo(() => getTotalLabel(theme), [theme])
  const totalValueStyle = useMemo(() => getTotalValue(theme), [theme])

  // Format price for display
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <View style={[localStyles.container, style]}>
      {/* Product List */}
      <View style={localStyles.productsContainer}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <View
              key={item.id}
              style={[
                localStyles.productItem,
                !isLast && productItemBorderStyle,
              ]}
            >
              {/* Product Info */}
              <View style={localStyles.productInfo}>
                {/* Product Image */}
                <View style={localStyles.productImage}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={localStyles.productImageContent}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        localStyles.productImagePlaceholder,
                        { backgroundColor: colors.gray[300] },
                      ]}
                    />
                  )}
                </View>

                {/* Product Details */}
                <View style={localStyles.productDetails}>
                  <Text style={productTitleStyle}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={productDescriptionStyle}>
                      {item.description}
                    </Text>
                  )}

                  {/* Quantity Controls */}
                  <View style={quantityControlsStyle}>
                    <Pressable
                      style={quantityButtonStyle}
                      onPress={() => {
                        if (item.quantity > 1) {
                          onQuantityChange(item.id, item.quantity - 1)
                        }
                      }}
                    >
                      <Minus size={20} color={colors.text[theme].primary} />
                    </Pressable>
                    <View style={quantityValueStyle}>
                      <Text style={quantityTextStyle}>
                        {item.quantity}
                      </Text>
                    </View>
                    <Pressable
                      style={[quantityButtonStyle, { borderRightWidth: 0 }]}
                      onPress={() => onQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus size={20} color={colors.text[theme].primary} />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Product Price */}
              <Text style={productPriceStyle}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Coupon Input */}
      {onApplyCoupon && (
        <View style={localStyles.couponContainer}>
          <View style={localStyles.couponInputWrapper}>
            <View style={localStyles.couponInput}>
              {/* Input placeholder - would use actual Input component with value management */}
            </View>
            <Button
              size="sm"
              variant="filled"
              color="primary"
              onPress={() => {
                // Coupon code would be managed via Input value
                onApplyCoupon('')
              }}
            >
              Apply
            </Button>
          </View>
        </View>
      )}

      {/* Price Summary */}
      <View style={localStyles.priceSummary}>
        <View style={localStyles.priceRow}>
          <Text style={priceLabelStyle}>Subtotal</Text>
          <Text style={priceValueStyle}>{formatPrice(subtotal)}</Text>
        </View>
        <View style={localStyles.priceRow}>
          <Text style={priceLabelStyle}>Tax</Text>
          <Text style={priceValueStyle}>+ {formatPrice(tax)}</Text>
        </View>
        <View style={[localStyles.priceRow, totalRowStyle]}>
          <Text style={totalLabelStyle}>Total</Text>
          <Text style={totalValueStyle}>{formatPrice(total)}</Text>
        </View>
      </View>
    </View>
  )
}

// Helper style functions
function getProductItemBorder(theme: ThemeMode): ViewStyle {
  return {
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.border[theme].default,
    paddingBottom: spacing[16],
  }
}

function getProductTitle(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphMMedium.fontFamily,
    fontSize: typography.paragraphMMedium.fontSize,
    fontWeight: typography.paragraphMMedium.fontWeight,
    lineHeight: typography.paragraphMMedium.lineHeight,
    color: colors.text[theme].primary,
  }
}

function getProductDescription(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: colors.text[theme].secondary,
  }
}

function getQuantityControls(theme: ThemeMode): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[8],
    borderWidth: borderWidth.thin,
    borderColor: colors.border[theme].default,
    borderRadius: borderRadius.l,
    overflow: 'hidden',
  }
}

function getQuantityButton(theme: ThemeMode): ViewStyle {
  return {
    width: spacing[32],
    height: spacing[32],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg[theme].default,
    borderRightWidth: borderWidth.thin,
    borderRightColor: colors.border[theme].default,
  }
}

function getQuantityValue(theme: ThemeMode): ViewStyle {
  return {
    minWidth: spacing[48],
    height: spacing[32],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg[theme].default,
    paddingHorizontal: spacing[12],
    borderRightWidth: borderWidth.thin,
    borderRightColor: colors.border[theme].default,
  }
}

function getQuantityText(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphMMedium.fontFamily,
    fontSize: typography.paragraphMMedium.fontSize,
    fontWeight: typography.paragraphMMedium.fontWeight,
    lineHeight: typography.paragraphMMedium.lineHeight,
    color: colors.text[theme].primary,
    textAlign: 'center',
  }
}

function getProductPrice(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphMMedium.fontFamily,
    fontSize: typography.paragraphMMedium.fontSize,
    fontWeight: typography.paragraphMMedium.fontWeight,
    lineHeight: typography.paragraphMMedium.lineHeight,
    color: colors.text[theme].primary,
    textAlign: 'right',
    width: 78,
  }
}

function getPriceLabel(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphMMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.paragraphMMedium.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: colors.text[theme].secondary,
  }
}

function getPriceValue(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphMMedium.fontFamily,
    fontSize: typography.paragraphMMedium.fontSize,
    fontWeight: typography.paragraphMMedium.fontWeight,
    lineHeight: typography.paragraphMMedium.lineHeight,
    color: colors.text[theme].primary,
  }
}

function getTotalRow(theme: ThemeMode): ViewStyle {
  return {
    borderTopWidth: borderWidth.thin,
    borderTopColor: colors.border[theme].default,
    borderStyle: 'dashed',
    paddingTop: spacing[16],
    marginTop: spacing[12],
  }
}

function getTotalLabel(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphMMedium.fontFamily,
    fontSize: typography.paragraphMMedium.fontSize,
    fontWeight: typography.paragraphMMedium.fontWeight,
    lineHeight: typography.paragraphMMedium.lineHeight,
    color: colors.text[theme].secondary,
  }
}

function getTotalValue(theme: ThemeMode): TextStyle {
  return {
    fontFamily: typography.paragraphLMedium.fontFamily,
    fontSize: typography.paragraphLMedium.fontSize,
    fontWeight: typography.paragraphLMedium.fontWeight,
    lineHeight: typography.paragraphLMedium.lineHeight,
    color: colors.text[theme].primary,
  }
}

const localStyles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[20],
  },
  productsContainer: {
    flexDirection: 'column',
    gap: spacing[20],
    paddingVertical: spacing[16],
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[6],
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  productImage: {
    width: 82,
    height: 82,
    borderRadius: borderRadius.s,
    overflow: 'hidden',
  },
  productImageContent: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
    flexDirection: 'column',
    gap: spacing[2],
  },
  couponContainer: {
    marginTop: spacing[8],
  },
  couponInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
  },
  couponInput: {
    flex: 1,
  },
  priceSummary: {
    flexDirection: 'column',
    gap: spacing[12],
    paddingTop: spacing[12],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
