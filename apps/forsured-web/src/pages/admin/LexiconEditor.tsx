/**
 * Admin Lexicon Editor Page
 * Multi-industry user set type system with configurable lexicon
 * Admin lexicon editor UI
 *
 * Allows administrators to:
 * - View all lexicon keys and values for each user set type
 * - Edit lexicon values (override defaults)
 * - Reset values to defaults
 * - Add new custom lexicon entries
 */
import { useState, useMemo } from 'react'
import {
  PlusCircle,
  Edit,
  Trash2,
  RefreshCcw,
  X,
  RotateCcw,
  Book,
  Check,
  AlertTriangle,
  Search,
} from 'lucide-react'
import {
  Stack,
  Row,
  Text,
  Button,
  Heading,
  Card,
  Input,
  Label,
  Spinner,
  colors,
  spacing,
} from '@unicornlove/beyond-ui'
import { EmptyState } from '../../ui/EmptyState'
import { trpc } from '../../lib/trpc'
import { DEFAULT_LEXICON } from '../../contexts/LexiconContext'

interface LexiconEntry {
  id: string
  key: string
  value: string
  isCustom: boolean
}

function AdminLexiconEditor() {
  // State
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomOnly, setShowCustomOnly] = useState(false)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingEntry, setEditingEntry] = useState<LexiconEntry | null>(null)
  const [formData, setFormData] = useState({ key: '', value: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // tRPC queries
  const { data: userSetTypes, isLoading: isLoadingTypes } = trpc.userSetTypes.list.useQuery()

  const {
    data: lexiconData,
    isLoading: isLoadingLexicon,
    refetch: refetchLexicon,
  } = trpc.userSetTypes.getLexicon.useQuery(
    { userSetTypeId: selectedTypeId },
    { enabled: !!selectedTypeId }
  )

  const upsertMutation = trpc.userSetTypes.upsertLexiconEntry.useMutation()
  const deleteMutation = trpc.userSetTypes.deleteLexiconEntry.useMutation()

  // Set initial selection when types load
  useMemo(() => {
    if (userSetTypes?.length && !selectedTypeId) {
      const activeType = userSetTypes.find((t) => t.isActive)
      if (activeType) {
        setSelectedTypeId(activeType.id)
      }
    }
  }, [userSetTypes, selectedTypeId])

  // Build combined lexicon entries (defaults + custom)
  const lexiconEntries = useMemo((): LexiconEntry[] => {
    const entries: LexiconEntry[] = []
    const customEntries = lexiconData?.entries ?? {}

    // Add all default keys
    for (const [key, defaultValue] of Object.entries(DEFAULT_LEXICON)) {
      const customValue = customEntries[key]
      entries.push({
        id: key,
        key,
        value: customValue ?? defaultValue,
        isCustom: !!customValue,
      })
    }

    // Add any custom entries that aren't in defaults
    for (const [key, value] of Object.entries(customEntries)) {
      if (!DEFAULT_LEXICON[key]) {
        entries.push({
          id: key,
          key,
          value,
          isCustom: true,
        })
      }
    }

    return entries.sort((a, b) => a.key.localeCompare(b.key))
  }, [lexiconData])

  // Filter entries
  const filteredEntries = useMemo(() => {
    return lexiconEntries.filter((entry) => {
      const matchesSearch =
        entry.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.value.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCustom = !showCustomOnly || entry.isCustom
      return matchesSearch && matchesCustom
    })
  }, [lexiconEntries, searchTerm, showCustomOnly])

  const selectedType = userSetTypes?.find((t) => t.id === selectedTypeId)
  const customCount = lexiconEntries.filter((e) => e.isCustom).length

  const handleRefresh = () => {
    refetchLexicon()
  }

  const openAddModal = () => {
    setModalMode('add')
    setEditingEntry(null)
    setFormData({ key: '', value: '' })
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (entry: LexiconEntry) => {
    setModalMode('edit')
    setEditingEntry(entry)
    setFormData({ key: entry.key, value: entry.value })
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingEntry(null)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTypeId) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await upsertMutation.mutateAsync({
        userSetTypeId: selectedTypeId,
        key: formData.key,
        value: formData.value,
      })

      closeModal()
      refetchLexicon()
    } catch (err) {
      console.error('Failed to save lexicon entry:', err)
      setFormError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetToDefault = async (key: string) => {
    if (!selectedTypeId) return
    if (!window.confirm('Are you sure you want to reset this value to the default?')) return

    setActionInProgress(key)
    try {
      await deleteMutation.mutateAsync({
        userSetTypeId: selectedTypeId,
        key,
      })
      refetchLexicon()
    } catch (err) {
      console.error('Failed to reset lexicon entry:', err)
      alert(err instanceof Error ? err.message : 'Failed to reset')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleDeleteCustom = async (key: string) => {
    if (!selectedTypeId) return
    if (!window.confirm('Are you sure you want to delete this custom entry?')) return

    setActionInProgress(key)
    try {
      await deleteMutation.mutateAsync({
        userSetTypeId: selectedTypeId,
        key,
      })
      refetchLexicon()
    } catch (err) {
      console.error('Failed to delete lexicon entry:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setActionInProgress(null)
    }
  }

  // Get category from key (e.g., "nav.dashboard" -> "nav")
  const getCategory = (key: string): string => {
    const parts = key.split('.')
    return parts[0] ?? 'other'
  }

  // Group entries by category
  const groupedEntries = useMemo(() => {
    const groups: Record<string, LexiconEntry[]> = {}
    for (const entry of filteredEntries) {
      const category = getCategory(entry.key)
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(entry)
    }
    return groups
  }, [filteredEntries])

  if (isLoadingTypes) {
    return (
      <Stack alignItems="center" justifyContent="center" paddingVertical={spacing[48]}>
        <Row alignItems="center" gap={spacing[8]}>
          <Spinner size="lg" color={colors.primary[500]} />
          <Text>Loading...</Text>
        </Row>
      </Stack>
    )
  }

  return (
    <Stack>
      <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: spacing[24] }}>
        <Stack>
          <Heading level={1} weight="bold" style={{ fontSize: 32, fontWeight: '700' }}>
            Lexicon Editor
          </Heading>
          <Text color={colors.text.light.secondary} size="sm" style={{ marginTop: spacing[4] }}>
            Customize labels and text for each industry vertical
          </Text>
        </Stack>
        <Row alignItems="center" gap={spacing[12]}>
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            style={{
              padding: '8px',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--borderColor)',
              borderRadius: '12px',
              backgroundColor: 'var(--background)',
              fontSize: 14,
            }}
          >
            <option value="">Select Industry...</option>
            {userSetTypes
              ?.filter((t) => t.isActive)
              .map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
          </select>
          <Button
            onPress={handleRefresh}
            disabled={isLoadingLexicon || !selectedTypeId}
            iconStart={isLoadingLexicon ? undefined : RefreshCcw}
            loading={isLoadingLexicon}
            variant="outline"
            color="gray"
            style={{ opacity: isLoadingLexicon || !selectedTypeId ? 0.5 : 1 }}
          >
            Refresh
          </Button>
        </Row>
      </Row>

      {!selectedTypeId ? (
        <EmptyState
          icon={Book}
          title="Select an Industry"
          description="Choose an industry vertical above to view and edit its lexicon entries. Each industry can have customized labels and terminology."
        />
      ) : (
        <>
          {/* Summary and Filters */}
          <Card style={{ padding: spacing[16], marginBottom: spacing[24] }}>
            <Row
              alignItems="center"
              justifyContent="space-between"
              style={{ flexWrap: 'wrap', gap: spacing[16] }}
            >
              <Row alignItems="center" gap={spacing[16]}>
                <Row alignItems="center" gap={spacing[8]}>
                  <Book size={20} color={colors.primary[500]} />
                  <Text weight="semibold">{selectedType?.name}</Text>
                </Row>
                <Row alignItems="center" gap={spacing[8]}>
                  <Text size="sm" color={colors.text.light.secondary}>
                    {lexiconEntries.length} entries
                  </Text>
                  {customCount > 0 && (
                    <Row
                      style={{
                        paddingHorizontal: spacing[8],
                        paddingVertical: spacing[4],
                        backgroundColor: colors.primary[200],
                        borderRadius: 8,
                      }}
                    >
                      <Text size="xs" color={colors.primary[600]}>
                        {customCount} customized
                      </Text>
                    </Row>
                  )}
                </Row>
              </Row>
              <Row alignItems="center" gap={spacing[12]}>
                <Row style={{ position: 'relative', width: 256 }}>
                  <Search
                    size={16}
                    color={colors.text.light.tertiary}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                    }}
                  />
                  <Input
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholder="Search keys or values..."
                    containerStyle={{
                      paddingLeft: spacing[36],
                      paddingRight: spacing[16],
                      width: 256,
                    }}
                  />
                </Row>
                <Row alignItems="center" gap={spacing[8]}>
                  <input
                    type="checkbox"
                    checked={showCustomOnly}
                    onChange={(e) => setShowCustomOnly(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  <Label size="sm" color={colors.text.light.secondary}>
                    Customized only
                  </Label>
                </Row>
                <Button
                  onPress={openAddModal}
                  iconStart={PlusCircle}
                  color="primary"
                  variant="filled"
                >
                  Add Entry
                </Button>
              </Row>
            </Row>
          </Card>

          {/* Lexicon Entries by Category */}
          {isLoadingLexicon ? (
            <Stack alignItems="center" justifyContent="center" paddingVertical={spacing[48]}>
              <Row alignItems="center" gap={spacing[8]}>
                <Spinner size="sm" color={colors.primary[500]} />
                <Text>Loading lexicon...</Text>
              </Row>
            </Stack>
          ) : filteredEntries.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No entries match your search"
              description="Try adjusting your search term or disable the 'Customized only' filter to see all lexicon entries."
              secondaryAction={{
                label: 'Clear Search',
                onClick: () => {
                  setSearchTerm('')
                  setShowCustomOnly(false)
                },
              }}
            />
          ) : (
            <Stack gap={spacing[24]}>
              {Object.entries(groupedEntries).map(([category, entries]) => (
                <Card key={category}>
                  <Row
                    style={{
                      paddingHorizontal: spacing[16],
                      paddingVertical: spacing[12],
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border.light.default,
                      backgroundColor: colors.bg.light.subtle,
                      borderTopLeftRadius: spacing[16],
                      borderTopRightRadius: spacing[16],
                    }}
                  >
                    <Heading level={3} weight="semibold" style={{ textTransform: 'capitalize' }}>
                      {category} ({entries.length})
                    </Heading>
                  </Row>
                  <table style={{ width: '100%', minWidth: '100%' }}>
                    <thead>
                      <tr>
                        <th
                          style={{
                            padding: '8px 16px',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          Key
                        </th>
                        <th
                          style={{
                            padding: '8px 16px',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          Value
                        </th>
                        <th
                          style={{
                            padding: '8px 16px',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: 14,
                            width: 96,
                          }}
                        >
                          Status
                        </th>
                        <th
                          style={{
                            padding: '8px 16px',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: 14,
                            width: 128,
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr
                          key={entry.key}
                          style={{
                            borderTopWidth: 1,
                            borderTopStyle: 'solid',
                            borderTopColor: 'var(--borderColor)',
                            backgroundColor: entry.isCustom ? 'var(--blue4)' : 'transparent',
                          }}
                        >
                          <td
                            style={{ padding: '8px 16px', fontFamily: 'monospace', fontSize: 14 }}
                          >
                            <Text
                              style={{ fontFamily: 'monospace' }}
                              size="sm"
                              color={colors.text.light.secondary}
                            >
                              {entry.key}
                            </Text>
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <Row alignItems="center" gap={spacing[8]}>
                              <Text
                                color={
                                  entry.isCustom ? colors.primary[600] : colors.text.light.primary
                                }
                                weight={entry.isCustom ? 'semibold' : 'regular'}
                              >
                                {entry.value}
                              </Text>
                              {entry.isCustom && DEFAULT_LEXICON[entry.key] && (
                                <Text size="xs" color={colors.text.light.tertiary}>
                                  (default: {DEFAULT_LEXICON[entry.key]})
                                </Text>
                              )}
                            </Row>
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            {entry.isCustom ? (
                              <Row
                                style={{
                                  paddingHorizontal: spacing[8],
                                  paddingVertical: spacing[4],
                                  backgroundColor: colors.primary[200],
                                  borderRadius: 8,
                                }}
                              >
                                <Text size="xs" color={colors.primary[600]}>
                                  Customized
                                </Text>
                              </Row>
                            ) : (
                              <Row
                                style={{
                                  paddingHorizontal: spacing[8],
                                  paddingVertical: spacing[4],
                                  backgroundColor: colors.bg.light.subtle,
                                  borderRadius: 8,
                                }}
                              >
                                <Text size="xs" color={colors.text.light.secondary}>
                                  Default
                                </Text>
                              </Row>
                            )}
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <Row alignItems="center" gap={spacing[4]}>
                              <Button
                                onPress={() => openEditModal(entry)}
                                disabled={actionInProgress === entry.key}
                                iconStart={Edit}
                                variant="text"
                                color="gray"
                                iconOnly
                                style={{ opacity: actionInProgress === entry.key ? 0.5 : 1 }}
                              />
                              {entry.isCustom && DEFAULT_LEXICON[entry.key] && (
                                <Button
                                  onPress={() => handleResetToDefault(entry.key)}
                                  disabled={actionInProgress === entry.key}
                                  iconStart={actionInProgress === entry.key ? undefined : RotateCcw}
                                  loading={actionInProgress === entry.key}
                                  variant="text"
                                  color="gray"
                                  iconOnly
                                />
                              )}
                              {entry.isCustom && !DEFAULT_LEXICON[entry.key] && (
                                <Button
                                  onPress={() => handleDeleteCustom(entry.key)}
                                  disabled={actionInProgress === entry.key}
                                  iconStart={actionInProgress === entry.key ? undefined : Trash2}
                                  loading={actionInProgress === entry.key}
                                  variant="text"
                                  color="error"
                                  iconOnly
                                />
                              )}
                            </Row>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Stack
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <Card
            style={{
              width: '100%',
              maxWidth: 448,
              marginHorizontal: spacing[16],
            }}
          >
            <Row
              alignItems="center"
              justifyContent="space-between"
              style={{
                padding: spacing[16],
                borderBottomWidth: 1,
                borderBottomColor: colors.border.light.default,
              }}
            >
              <Heading level={3} weight="semibold" style={{ fontSize: 20 }}>
                {modalMode === 'add' ? 'Add Lexicon Entry' : 'Edit Lexicon Entry'}
              </Heading>
              <Button onPress={closeModal} iconStart={X} variant="text" color="gray" iconOnly />
            </Row>

            <form onSubmit={handleSubmit}>
              <Stack style={{ padding: spacing[16], gap: spacing[16] }}>
                {formError && (
                  <Row
                    style={{
                      padding: spacing[12],
                      backgroundColor: colors.error[200],
                      borderWidth: 1,
                      borderColor: colors.error[400],
                      borderRadius: 8,
                      gap: spacing[8],
                      alignItems: 'flex-start',
                    }}
                  >
                    <AlertTriangle
                      size={16}
                      color={colors.error[500]}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <Text size="sm" color={colors.error[600]}>
                      {formError}
                    </Text>
                  </Row>
                )}

                <Stack gap={spacing[4]}>
                  <Label
                    size="sm"
                    weight="semibold"
                    color={colors.text.light.primary}
                    style={{ marginBottom: spacing[4] }}
                  >
                    Key
                  </Label>
                  <Input
                    value={formData.key}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, key: value }))}
                    disabled={modalMode === 'edit'}
                    containerStyle={{
                      width: '100%',
                      backgroundColor:
                        modalMode === 'edit' ? colors.bg.light.subtle : colors.bg.light.default,
                    }}
                    style={{ fontFamily: 'monospace' }}
                    placeholder="e.g., nav.custom_link"
                    required
                  />
                  {modalMode === 'edit' && (
                    <Text
                      size="xs"
                      color={colors.text.light.secondary}
                      style={{ marginTop: spacing[4] }}
                    >
                      Key cannot be changed
                    </Text>
                  )}
                </Stack>

                <Stack gap={spacing[4]}>
                  <Label
                    size="sm"
                    weight="semibold"
                    color={colors.text.light.primary}
                    style={{ marginBottom: spacing[4] }}
                  >
                    Value
                  </Label>
                  <Input
                    value={formData.value}
                    onChangeText={(value) => setFormData((prev) => ({ ...prev, value }))}
                    containerStyle={{ width: '100%' }}
                    placeholder="Display text for this key"
                    required
                  />
                  {editingEntry && DEFAULT_LEXICON[editingEntry.key] && (
                    <Text
                      size="xs"
                      color={colors.text.light.secondary}
                      style={{ marginTop: spacing[4] }}
                    >
                      Default value: {DEFAULT_LEXICON[editingEntry.key]}
                    </Text>
                  )}
                </Stack>

                <Row
                  justifyContent="flex-end"
                  gap={spacing[12]}
                  style={{ paddingTop: spacing[16] }}
                >
                  <Button onPress={closeModal} variant="outline" color="gray">
                    Cancel
                  </Button>
                  <Button
                    onPress={() => {
                      const syntheticEvent = new Event('submit') as any
                      syntheticEvent.preventDefault = () => {}
                      handleSubmit(syntheticEvent)
                    }}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    color="primary"
                    variant="filled"
                  >
                    {modalMode === 'add' ? 'Add Entry' : 'Save Changes'}
                  </Button>
                </Row>
              </Stack>
            </form>
          </Card>
        </Stack>
      )}
    </Stack>
  )
}

export default AdminLexiconEditor
