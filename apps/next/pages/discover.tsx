import Head from 'next/head'

import {
  DiscoverMapScreen,
  metersToMilesLabel,
  useDiscoverMapState,
  type DiscoverMapState,
} from '@app/core/features/discover-map'
import { FilterBar } from '@app/core/features/discover-map/components/FilterBar'
import { HomeLayout, type HeaderRenderProps } from '@app/core/features/home/layout.web'
import type { NextPageWithLayout } from './_app'
import { XStack, YStack } from '@app/ui'

const DiscoverHeader = ({
  drawerTrigger,
  headerRight: _headerRight,
  isDesktop,
  state,
}: HeaderRenderProps & { state: DiscoverMapState }) => {
  return (
    <YStack gap="$3" width="100%">
      <XStack gap="$3" alignItems="flex-start" width="100%">
        {!isDesktop && drawerTrigger ? <XStack flexShrink={0}>{drawerTrigger}</XStack> : null}
        <YStack flexGrow={1} flexShrink={1} minWidth={0}>
          <FilterBar
            locationQuery={state.locationQuery}
            onLocationChange={state.setLocationQuery}
            radiusLabel={metersToMilesLabel(state.radiusMeters)}
            onAdjustFilters={() => state.setFiltersOpen(true)}
            filters={state.activeFilters}
            onRemoveFilter={(filterId) =>
              state.setActiveFilters((current) => current.filter((filter) => filter.id !== filterId))
            }
            onClearFilters={() => state.setActiveFilters([])}
          />
        </YStack>
      </XStack>
    </YStack>
  )
}

export const Page: NextPageWithLayout = () => {
  const mapState = useDiscoverMapState()

  return (
    <>
      <Head>
        <title>Discover | Scaffald</title>
      </Head>
      <HomeLayout
        fullPage
        renderHeader={(headerProps) => <DiscoverHeader {...headerProps} state={mapState} />}
      >
        <DiscoverMapScreen state={mapState} showHeader={false} />
      </HomeLayout>
    </>
  )
}

export default Page
