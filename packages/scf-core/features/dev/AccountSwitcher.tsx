import { useSessionContext } from '@scf/core/utils/supabase/useSessionContext'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Users, X, Check, Loader } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useState, useCallback } from 'react'
import { Pressable, View, Text, ScrollView, Platform } from 'react-native'

const DEMO_ACCOUNTS = [
  { label: 'Clay (Admin)', email: 'clay@unicorn.love', role: 'Platform Admin' },
  { label: 'Brian Carter', email: 'brian.carter@wizardconstruction.com', role: 'Employer' },
  { label: 'Marcus Rivera', email: 'marcus.rivera@example.test', role: 'Plumber' },
  { label: 'Jake Hendricks', email: 'jake.hendricks@example.test', role: 'Electrician' },
  { label: 'Carlos Gutierrez', email: 'carlos.gutierrez@example.test', role: 'Carpenter' },
] as const

const DEMO_PASSWORD = 'password123'

export function AccountSwitcher() {
  const { hasOfficeRole, isLoading: rolesLoading } = useUserRoles()
  const { session, supabaseClient } = useSessionContext()
  const { theme } = useThemeContext()
  const { width } = useResponsive()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  const currentEmail = session?.user?.email
  const isSmall = width < 1024

  const handleSwitch = useCallback(
    async (email: string) => {
      if (email === currentEmail) {
        setIsOpen(false)
        return
      }
      setSwitching(email)
      try {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password: DEMO_PASSWORD,
        })
        if (error) {
          console.error('Account switch failed:', error.message)
          setSwitching(null)
          return
        }
        setIsOpen(false)
        setSwitching(null)
        if (Platform.OS === 'web') {
          window.location.href = '/'
        } else {
          router.replace('/')
        }
      } catch (e) {
        console.error('Account switch error:', e)
        setSwitching(null)
      }
    },
    [currentEmail, supabaseClient, router]
  )

  // Only show for office-role users
  if (rolesLoading || !hasOfficeRole) return null

  const bottomOffset = isSmall ? 80 : 24

  return (
    <View
      style={{
        position: 'absolute',
        bottom: bottomOffset,
        right: 24,
        zIndex: 9999,
        alignItems: 'flex-end',
      }}
      pointerEvents="box-none"
    >
      {isOpen && (
        <View
          style={{
            marginBottom: 8,
            backgroundColor: colors.bg[theme].default,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border[theme].default,
            width: 280,
            maxHeight: 360,
            ...Platform.select({
              web: {
                boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
              },
              default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              },
            }),
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border[theme].subtle,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.text[theme].secondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Switch Account
            </Text>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {DEMO_ACCOUNTS.map((account) => {
              const isCurrent = account.email === currentEmail
              const isSwitching = switching === account.email
              return (
                <Pressable
                  key={account.email}
                  onPress={() => handleSwitch(account.email)}
                  disabled={isSwitching}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: pressed
                      ? colors.bg[theme].subtle
                      : isCurrent
                        ? colors.bg[theme].subtle
                        : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  })}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isCurrent ? '600' : '400',
                        color: colors.text[theme].primary,
                      }}
                    >
                      {account.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.text[theme].tertiary,
                        marginTop: 1,
                      }}
                    >
                      {account.role}
                    </Text>
                  </View>
                  {isSwitching ? (
                    <Loader size={16} color={colors.text[theme].secondary} />
                  ) : isCurrent ? (
                    <Check size={16} color={colors.fg[theme].success} />
                  ) : null}
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      )}

      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isOpen
            ? colors.bg[theme].subtle
            : pressed
              ? colors.bg[theme].muted
              : colors.bg[theme].primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: isOpen ? colors.border[theme].default : 'transparent',
          ...Platform.select({
            web: {
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            },
            default: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            },
          }),
        })}
        accessibilityLabel={isOpen ? 'Close account switcher' : 'Open account switcher'}
      >
        {isOpen ? (
          <X size={22} color={colors.text[theme].secondary} />
        ) : (
          <Users size={22} color={colors.text[theme].inverse} />
        )}
      </Pressable>
    </View>
  )
}
