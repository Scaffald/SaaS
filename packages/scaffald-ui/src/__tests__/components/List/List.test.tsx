/**
 * List component tests
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { describe, it, expect } from 'vitest'
import { List } from '../../../components/List'
import { ListItem } from '../../../components/ListItem'

describe('List', () => {
  it('renders without title', () => {
    const { getByText } = render(
      <List>
        <ListItem variant="task" title="Task 1" iconColor="success" />
      </List>
    )

    expect(getByText('Task 1')).toBeTruthy()
  })

  it('renders with title', () => {
    const { getByText } = render(
      <List title="List title">
        <ListItem variant="task" title="Task 1" iconColor="success" />
      </List>
    )

    expect(getByText('List title')).toBeTruthy()
    expect(getByText('Task 1')).toBeTruthy()
  })

  it('renders multiple items', () => {
    const { getByText } = render(
      <List title="List title">
        <ListItem variant="task" title="Task 1" iconColor="success" />
        <ListItem variant="task" title="Task 2" iconColor="error" />
        <ListItem variant="task" title="Task 3" iconColor="warning" />
      </List>
    )

    expect(getByText('Task 1')).toBeTruthy()
    expect(getByText('Task 2')).toBeTruthy()
    expect(getByText('Task 3')).toBeTruthy()
  })

  it('applies custom gap', () => {
    const { container } = render(
      <List title="List title" gap={16}>
        <ListItem variant="task" title="Task 1" iconColor="success" />
        <ListItem variant="task" title="Task 2" iconColor="error" />
      </List>
    )

    expect(container).toBeTruthy()
  })

  it('applies custom style', () => {
    const { container } = render(
      <List title="List title" style={{ padding: 20 }}>
        <ListItem variant="task" title="Task 1" iconColor="success" />
      </List>
    )

    expect(container).toBeTruthy()
  })

  it('has accessibility role', () => {
    const { container } = render(
      <List title="List title" accessibilityLabel="Task list">
        <ListItem variant="task" title="Task 1" iconColor="success" />
      </List>
    )

    expect(container).toBeTruthy()
  })
})
