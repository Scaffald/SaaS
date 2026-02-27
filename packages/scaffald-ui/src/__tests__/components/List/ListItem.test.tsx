/**
 * ListItem component tests
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import { ListItem } from '../../../components/ListItem'

describe('ListItem', () => {
  describe('user-profile-01 variant', () => {
    it('renders user profile with name and username', () => {
      const { getByText } = render(
        <ListItem
          variant="user-profile-01"
          name="Tina Hernandez"
          username="@tinahernan90"
          description="Product Designer"
        />
      )

      expect(getByText('Tina Hernandez')).toBeTruthy()
      expect(getByText('@tinahernan90')).toBeTruthy()
      expect(getByText('Product Designer')).toBeTruthy()
    })

    it('calls onFollowPress when Follow button is pressed', () => {
      const onFollowPress = vi.fn()
      const { getByText } = render(
        <ListItem
          variant="user-profile-01"
          name="Tina Hernandez"
          username="@tinahernan90"
          onFollowPress={onFollowPress}
        />
      )

      const followButton = getByText('Follow')
      fireEvent.press(followButton)
      expect(onFollowPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('user-profile-02 variant', () => {
    it('renders user profile with subscription date', () => {
      const { getByText } = render(
        <ListItem
          variant="user-profile-02"
          name="Tina Hernandez"
          username="@tinahernan90"
          subscriptionDate="March 25, 2024"
        />
      )

      expect(getByText('Tina Hernandez')).toBeTruthy()
      expect(getByText('@tinahernan90')).toBeTruthy()
      expect(getByText(/Subscribed on/)).toBeTruthy()
    })
  })

  describe('product variant', () => {
    it('renders product with name and tags', () => {
      const { getByText } = render(
        <ListItem
          variant="product"
          name="Flux Co."
          tags={['UX Design', 'Design Systems']}
          count={16}
        />
      )

      expect(getByText('Flux Co.')).toBeTruthy()
      expect(getByText('UX Design')).toBeTruthy()
      expect(getByText('Design Systems')).toBeTruthy()
    })
  })

  describe('search-result-01 variant', () => {
    it('renders search result with title and breadcrumbs', () => {
      const { getByText } = render(
        <ListItem
          variant="search-result-01"
          title="Personal Settings"
          timestamp="March 25, 2024 04:53PM"
          breadcrumbs={[
            { label: 'Help Center' },
            { label: 'Manage my account' },
          ]}
          description="Customize your experience"
        />
      )

      expect(getByText('Personal Settings')).toBeTruthy()
      expect(getByText('Customize your experience')).toBeTruthy()
    })
  })

  describe('search-result-02 variant', () => {
    it('renders search result with author info', () => {
      const { getByText } = render(
        <ListItem
          variant="search-result-02"
          title="Personal Settings"
          description="Unlock a world of personalization"
          authorName="Tina Hernandez"
          updatedText="Updated over a week ago"
        />
      )

      expect(getByText('Personal Settings')).toBeTruthy()
      expect(getByText(/Written by/)).toBeTruthy()
    })
  })

  describe('search-result-03 variant', () => {
    it('renders search result with icon', () => {
      const { getByText } = render(
        <ListItem
          variant="search-result-03"
          title="Personal Settings"
          description="Unlock a world of personalization"
        />
      )

      expect(getByText('Personal Settings')).toBeTruthy()
      expect(getByText('Unlock a world of personalization')).toBeTruthy()
    })
  })

  describe('task variant', () => {
    it('renders task with title and metadata', () => {
      const { getByText } = render(
        <ListItem
          variant="task"
          title="Opportunity 4"
          metadata="Opportunity Pipeline"
          updatedText="Updated 10 min ago"
          iconColor="success"
        />
      )

      expect(getByText('Opportunity 4')).toBeTruthy()
      expect(getByText('Opportunity Pipeline')).toBeTruthy()
      expect(getByText('Updated 10 min ago')).toBeTruthy()
    })
  })

  describe('song-title variant', () => {
    it('renders song with title and metadata', () => {
      const { getByText } = render(
        <ListItem
          variant="song-title"
          title="Auto Layout (feat. DJ Rectangle)"
          type="Single"
          artist="Beyond UI"
          year="2024"
        />
      )

      expect(getByText('Auto Layout (feat. DJ Rectangle)')).toBeTruthy()
      expect(getByText('Single')).toBeTruthy()
      expect(getByText('Beyond UI')).toBeTruthy()
      expect(getByText('2024')).toBeTruthy()
    })
  })

  describe('cloud-file variant', () => {
    it('renders cloud file with name and metadata', () => {
      const { getByText } = render(
        <ListItem
          variant="cloud-file"
          name="Request Files"
          service="Boxdrop"
          size="24MB"
        />
      )

      expect(getByText('Request Files')).toBeTruthy()
      expect(getByText('Boxdrop')).toBeTruthy()
      expect(getByText('24MB')).toBeTruthy()
    })
  })

  describe('phone-number variant', () => {
    it('renders phone number with country code and name', () => {
      const { getByText } = render(
        <ListItem
          variant="phone-number"
          countryCode="+1"
          countryName="United States"
        />
      )

      expect(getByText('+1')).toBeTruthy()
      expect(getByText('United States')).toBeTruthy()
    })
  })

  describe('integration variant', () => {
    it('renders integration with name and chevron', () => {
      const { getByText } = render(
        <ListItem
          variant="integration"
          name="Figma"
          onPress={() => {}}
        />
      )

      expect(getByText('Figma')).toBeTruthy()
    })

    it('calls onPress when pressed', () => {
      const onPress = vi.fn()
      const { getByText } = render(
        <ListItem
          variant="integration"
          name="Figma"
          onPress={onPress}
        />
      )

      fireEvent.press(getByText('Figma'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has accessibility label', () => {
      const { getByLabelText } = render(
        <ListItem
          variant="task"
          title="Task 1"
          accessibilityLabel="Task item"
        />
      )

      expect(getByLabelText('Task item')).toBeTruthy()
    })
  })
})
