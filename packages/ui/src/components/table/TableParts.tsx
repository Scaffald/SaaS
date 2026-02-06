import type { SizeTokens } from 'tamagui'
import { createStyledContext, styled, Stack, withStaticProperties } from '@tamagui/core'

type AlignCells = {
  y: 'center' | 'start' | 'end'
  x: 'center' | 'start' | 'end'
}

type AlignHeaderCells = AlignCells

const TableContext = createStyledContext<{
  cellWidth: SizeTokens | number
  cellHeight: SizeTokens | number
  alignHeaderCells: {
    y: 'center' | 'start' | 'end'
    x: 'center' | 'start' | 'end'
  }
  alignCells: {
    y: 'center' | 'start' | 'end'
    x: 'center' | 'start' | 'end'
  }
  borderColor: string
}>({
  cellWidth: '$8',
  cellHeight: '$8',
  alignHeaderCells: { x: 'start', y: 'center' },
  alignCells: { x: 'center', y: 'center' },
  borderColor: '$borderColor',
})

/** Table Components */
const Row = styled(Stack, {
  tag: 'tr',
  flexDirection: 'row',
  context: TableContext,
  variants: {
    rowLocation: {
      first: () => {
        return {
          borderBottomWidth: 0.5,
        }
      },
      last: () => {
        return {
          borderBottomWidth: 0,
        }
      },
      middle: () => {
        return {
          borderBottomWidth: 0.5,
        }
      },
    },
  },
})

const Cell = styled(Stack, {
  tag: 'td',
  flexDirection: 'row',
  context: TableContext,
  variants: {
    cellWidth: {
      '...size': (name) => {
        return {
          width: name,
        }
      },
    },
    cellHeight: {
      '...size': (name) => {
        return {
          minHeight: name,
        }
      },
    },
    alignCells: (val: AlignCells) => {
      return {
        alignItems: val.y === 'center' ? 'center' : `flex-${val.y}`,
        justifyContent: val.x === 'center' ? 'center' : `flex-${val.x}`,
      }
    },
    cellLocation: {
      first: () => {
        return {}
      },
      last: () => {
        return {
          borderLeftWidth: 0.5,
        }
      },
      middle: () => {
        return {
          borderLeftWidth: 0.5,
        }
      },
    },
  } as const,
})

const HeaderCell = styled(Stack, {
  tag: 'th',
  flexDirection: 'row',
  context: TableContext,
  paddingVertical: '$3',

  variants: {
    cellWidth: {
      '...size': (name) => {
        return {
          width: name,
        }
      },
    },

    alignHeaderCells: (val: AlignHeaderCells) => {
      return {
        alignItems: val.y === 'center' ? 'center' : `flex-${val.y}`,
        justifyContent: val.x === 'center' ? 'center' : `flex-${val.x}`,
      }
    },

    cellLocation: {
      first: () => {
        return {}
      },
      last: () => {
        return {
          borderLeftWidth: 1,
        }
      },
      middle: () => {
        return {
          borderLeftWidth: 1,
        }
      },
    },
  } as const,
})

const TableBody = styled(Stack, {
  tag: 'tbody',
  flexDirection: 'column',
  context: TableContext,
})

const TableHead = styled(Stack, {
  tag: 'thead',
  flexDirection: 'column',
  context: TableContext,
})

const TableFoot = styled(Stack, {
  tag: 'tfoot',
  flexDirection: 'column',
  context: TableContext,
})

const TableComp = styled(Stack, {
  tag: 'table',
  context: TableContext,
  borderWidth: 1,
  backgrounded: true,
  variants: {
    /** just added these empty variants to avoid ts errors on Table */
    cellWidth: {
      '...size': () => {
        return {}
      },
    },
    cellHeight: {
      '...size': () => {
        return {}
      },
    },
    alignHeaderCells: (_val) => ({}),
    alignCells: (_val) => ({}),
  },
})

export const Table = withStaticProperties(TableComp, {
  Head: TableHead,
  Body: TableBody,
  Row,
  Cell,
  HeaderCell,
  Foot: TableFoot,
})
