/**
 * iOS 26 Toolbar System Stories
 * Demonstrates NavigationBar, BottomToolbar, ToolbarSearchBar,
 * ToolbarButton, ToolbarButtonGroup, SearchAccessory, and PageControl pill variant
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { useState } from 'react'
import { NavigationBar } from '../../../components/NavigationBar'
import { BottomToolbar } from '../../../components/BottomToolbar'
import { ToolbarButton } from '../../../components/ToolbarButton'
import { ToolbarButtonGroup } from '../../../components/ToolbarButtonGroup'
import { ToolbarSearchBar } from '../../../components/ToolbarSearchBar'
import { SearchAccessory } from '../../../components/SearchAccessory'
import { PageControl } from '../../../components/PageControl'
import { Stack } from '../../../components/Layout'
import { Text, H4 } from '../../../components/Typography'

const meta: Meta = {
  title: 'Components/iOS 26 Toolbar',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'iOS 26 toolbar system: NavigationBar (top), BottomToolbar, ToolbarButton, ToolbarButtonGroup, ToolbarSearchBar, SearchAccessory.',
      },
    },
  },
}

export default meta

// ============================================================================
// NavigationBar — iPhone Standard
// ============================================================================

export const NavigationBarStandard: StoryObj = {
  name: 'NavigationBar — Standard',
  render: () => (
    <Stack gap={24} style={{ maxWidth: 440 }}>
      <H4>Standard with back + trailing</H4>
      <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
        <NavigationBar
          title="Title"
          subtitle="Subtitle"
          backButton={{ label: 'Back', onPress: () => {} }}
          trailingItems={
            <ToolbarButton variant="filled" label="Done" onPress={() => {}} />
          }
        />
      </View>

      <H4>Title only (no subtitle)</H4>
      <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
        <NavigationBar
          title="Messages"
          showSubtitle={false}
          backButton={{ onPress: () => {} }}
          trailingItems={
            <ToolbarButton
              icon={<Text style={{ fontSize: 20 }}>✎</Text>}
              onPress={() => {}}
            />
          }
        />
      </View>
    </Stack>
  ),
}

// ============================================================================
// NavigationBar — Large Title
// ============================================================================

export const NavigationBarLargeTitle: StoryObj = {
  name: 'NavigationBar — Large Title',
  render: () => (
    <Stack gap={24} style={{ maxWidth: 440 }}>
      <H4>Large title</H4>
      <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
        <NavigationBar
          title="Settings"
          titleSize="large"
          trailingItems={
            <ToolbarButton variant="text" label="Edit" onPress={() => {}} />
          }
        />
      </View>

      <H4>Large title with subtitle</H4>
      <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
        <NavigationBar
          title="Library"
          subtitle="42 items"
          titleSize="large"
          backButton={{ label: 'Back', onPress: () => {} }}
        />
      </View>
    </Stack>
  ),
}

// ============================================================================
// NavigationBar — iPad with Segmented Control
// ============================================================================

export const NavigationBarIPad: StoryObj = {
  name: 'NavigationBar — iPad',
  render: () => {
    const [tabIndex, setTabIndex] = useState(0)

    return (
      <Stack gap={24} style={{ maxWidth: 860 }}>
        <H4>iPad with segmented control</H4>
        <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
          <NavigationBar
            title="Library"
            backButton={{ onPress: () => {} }}
            segmentedControl={{
              segments: ['Songs', 'Albums', 'Artists'],
              selectedIndex: tabIndex,
              onSelectionChange: setTabIndex,
            }}
            trailingItems={
              <ToolbarButtonGroup
                buttons={[
                  { key: 'sort', icon: <Text style={{ fontSize: 18 }}>↕</Text>, onPress: () => {} },
                  { key: 'grid', icon: <Text style={{ fontSize: 18 }}>⊞</Text>, onPress: () => {} },
                ]}
              />
            }
          />
        </View>

        <H4>iPad with search accessory</H4>
        <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
          <NavigationBar
            title="Files"
            backButton={{ label: 'Browse', onPress: () => {} }}
            trailingItems={
              <ToolbarButton
                icon={<Text style={{ fontSize: 18 }}>⋯</Text>}
                onPress={() => {}}
              />
            }
            searchAccessory={{
              placeholder: 'Search Files',
              scopes: [
                { label: 'All', value: 'all' },
                { label: 'Recent', value: 'recent' },
              ],
              selectedScope: 'all',
            }}
          />
        </View>
      </Stack>
    )
  },
}

// ============================================================================
// BottomToolbar — Buttons
// ============================================================================

export const BottomToolbarButtons: StoryObj = {
  name: 'BottomToolbar — Buttons',
  render: () => (
    <Stack gap={24} style={{ maxWidth: 440 }}>
      <H4>4 icon buttons</H4>
      <View style={{ height: 80, position: 'relative', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
        <BottomToolbar
          variant="buttons"
          buttons={[
            { key: 'reply', icon: <Text style={{ fontSize: 20 }}>↩</Text>, onPress: () => {} },
            { key: 'folder', icon: <Text style={{ fontSize: 20 }}>📁</Text>, onPress: () => {} },
            { key: 'trash', icon: <Text style={{ fontSize: 20 }}>🗑</Text>, onPress: () => {} },
            { key: 'compose', icon: <Text style={{ fontSize: 20 }}>✎</Text>, onPress: () => {} },
          ]}
        />
      </View>

      <H4>2 icon buttons</H4>
      <View style={{ height: 80, position: 'relative', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
        <BottomToolbar
          variant="buttons"
          buttons={[
            { key: 'share', icon: <Text style={{ fontSize: 20 }}>↗</Text>, onPress: () => {} },
            { key: 'bookmark', icon: <Text style={{ fontSize: 20 }}>🔖</Text>, onPress: () => {} },
          ]}
        />
      </View>
    </Stack>
  ),
}

// ============================================================================
// BottomToolbar — Search
// ============================================================================

export const BottomToolbarSearch: StoryObj = {
  name: 'BottomToolbar — Search',
  render: () => {
    const [query, setQuery] = useState('')

    return (
      <Stack gap={24} style={{ maxWidth: 440 }}>
        <H4>Search bar</H4>
        <View style={{ height: 80, position: 'relative', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
          <BottomToolbar
            variant="search"
            searchBar={{
              value: query,
              onChangeText: setQuery,
              placeholder: 'Search',
            }}
          />
        </View>
      </Stack>
    )
  },
}

// ============================================================================
// BottomToolbar — Page Control
// ============================================================================

export const BottomToolbarPageControl: StoryObj = {
  name: 'BottomToolbar — Page Control',
  render: () => {
    const [page, setPage] = useState(2)

    return (
      <Stack gap={24} style={{ maxWidth: 440 }}>
        <H4>With page control + buttons</H4>
        <View style={{ height: 80, position: 'relative', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
          <BottomToolbar
            variant="pageControl"
            leadingButtons={[
              { key: 'back', icon: <Text style={{ fontSize: 20 }}>◀</Text>, onPress: () => setPage(Math.max(0, page - 1)) },
              { key: 'share', icon: <Text style={{ fontSize: 20 }}>↗</Text>, onPress: () => {} },
            ]}
            pageControl={{ count: 5, current: page, onChange: setPage }}
            trailingButtons={[
              { key: 'bookmark', icon: <Text style={{ fontSize: 20 }}>🔖</Text>, onPress: () => {} },
              { key: 'fwd', icon: <Text style={{ fontSize: 20 }}>▶</Text>, onPress: () => setPage(Math.min(4, page + 1)) },
            ]}
          />
        </View>
      </Stack>
    )
  },
}

// ============================================================================
// ToolbarSearchBar
// ============================================================================

export const SearchBarStates: StoryObj = {
  name: 'ToolbarSearchBar',
  render: () => {
    const [query1, setQuery1] = useState('')
    const [query2, setQuery2] = useState('Search Term')

    return (
      <Stack gap={24} style={{ maxWidth: 400 }}>
        <H4>Placeholder state</H4>
        <ToolbarSearchBar
          value={query1}
          onChangeText={setQuery1}
          placeholder="Search"
        />

        <H4>Active with text</H4>
        <ToolbarSearchBar
          value={query2}
          onChangeText={setQuery2}
          placeholder="Search"
        />

        <H4>Without microphone</H4>
        <ToolbarSearchBar
          value=""
          onChangeText={() => {}}
          placeholder="Filter"
          showMicrophone={false}
        />
      </Stack>
    )
  },
}

// ============================================================================
// SearchAccessory
// ============================================================================

export const SearchAccessoryDemo: StoryObj = {
  name: 'SearchAccessory',
  render: () => {
    const [query, setQuery] = useState('')
    const [scope, setScope] = useState('all')

    return (
      <Stack gap={24} style={{ maxWidth: 800 }}>
        <H4>Search with scope filter</H4>
        <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
          <SearchAccessory
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            scopes={[
              { label: 'All', value: 'all' },
              { label: 'Photos', value: 'photos' },
            ]}
            selectedScope={scope}
            onScopeChange={setScope}
          />
        </View>

        <H4>Search without scopes</H4>
        <View style={{ borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12 }}>
          <SearchAccessory
            value=""
            onChangeText={() => {}}
            placeholder="Search Messages"
          />
        </View>
      </Stack>
    )
  },
}

// ============================================================================
// PageControl — Pill Variant
// ============================================================================

export const PageControlPill: StoryObj = {
  name: 'PageControl — Pill Variant',
  render: () => {
    const [page3, setPage3] = useState(1)
    const [page5, setPage5] = useState(2)
    const [page7, setPage7] = useState(3)

    return (
      <Stack gap={24} style={{ maxWidth: 400 }}>
        <H4>3 pages (pill)</H4>
        <PageControl
          totalPages={3}
          currentPage={page3}
          onPageChange={setPage3}
          variant="pill"
        />

        <H4>5 pages (pill)</H4>
        <PageControl
          totalPages={5}
          currentPage={page5}
          onPageChange={setPage5}
          variant="pill"
        />

        <H4>7 pages (pill, with compression)</H4>
        <PageControl
          totalPages={7}
          currentPage={page7}
          onPageChange={setPage7}
          variant="pill"
        />

        <H4>5 pages (dots, default)</H4>
        <PageControl
          totalPages={5}
          currentPage={2}
        />
      </Stack>
    )
  },
}

// ============================================================================
// ToolbarButton Variants
// ============================================================================

export const ToolbarButtons: StoryObj = {
  name: 'ToolbarButton Variants',
  render: () => (
    <Stack gap={24} style={{ maxWidth: 400 }}>
      <H4>Icon button</H4>
      <ToolbarButton
        icon={<Text style={{ fontSize: 22 }}>⊕</Text>}
        onPress={() => {}}
        accessibilityLabel="Add"
      />

      <H4>Text button</H4>
      <ToolbarButton variant="text" label="Edit" onPress={() => {}} />

      <H4>Filled button</H4>
      <ToolbarButton variant="filled" label="Done" onPress={() => {}} />

      <H4>Back button</H4>
      <ToolbarButton variant="back" label="Messages" onPress={() => {}} />

      <H4>Disabled</H4>
      <ToolbarButton variant="text" label="Disabled" onPress={() => {}} disabled />
    </Stack>
  ),
}

// ============================================================================
// ToolbarButtonGroup
// ============================================================================

export const ToolbarButtonGroups: StoryObj = {
  name: 'ToolbarButtonGroup',
  render: () => (
    <Stack gap={24} style={{ maxWidth: 400 }}>
      <H4>3 buttons (glass)</H4>
      <ToolbarButtonGroup
        glass
        buttons={[
          { key: 'a', icon: <Text style={{ fontSize: 20 }}>↩</Text>, onPress: () => {} },
          { key: 'b', icon: <Text style={{ fontSize: 20 }}>📁</Text>, onPress: () => {} },
          { key: 'c', icon: <Text style={{ fontSize: 20 }}>🗑</Text>, onPress: () => {} },
        ]}
      />

      <H4>5 buttons (glass)</H4>
      <ToolbarButtonGroup
        glass
        buttons={[
          { key: '1', icon: <Text style={{ fontSize: 20 }}>⊕</Text>, onPress: () => {} },
          { key: '2', icon: <Text style={{ fontSize: 20 }}>↩</Text>, onPress: () => {} },
          { key: '3', icon: <Text style={{ fontSize: 20 }}>📁</Text>, onPress: () => {} },
          { key: '4', icon: <Text style={{ fontSize: 20 }}>🗑</Text>, onPress: () => {} },
          { key: '5', icon: <Text style={{ fontSize: 20 }}>✎</Text>, onPress: () => {} },
        ]}
      />

      <H4>No glass</H4>
      <ToolbarButtonGroup
        buttons={[
          { key: 'x', icon: <Text style={{ fontSize: 20 }}>↗</Text>, onPress: () => {} },
          { key: 'y', icon: <Text style={{ fontSize: 20 }}>🔖</Text>, onPress: () => {} },
        ]}
      />
    </Stack>
  ),
}
