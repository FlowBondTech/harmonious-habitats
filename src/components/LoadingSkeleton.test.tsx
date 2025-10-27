import { describe, it, expect } from 'vitest'
import { render } from '../test/utils'
import {
  Skeleton,
  EventCardSkeleton,
  SpaceCardSkeleton,
  ProfileHeaderSkeleton,
  ListItemSkeleton,
  MessageSkeleton,
  TableRowSkeleton,
  GridSkeleton,
  PageLoadingSkeleton,
  FormSkeleton
} from './LoadingSkeleton'

describe('LoadingSkeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default classes', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('animate-pulse')
      expect(skeleton).toHaveClass('bg-gradient-to-r')
    })

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="h-10 w-full" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('h-10')
      expect(skeleton).toHaveClass('w-full')
    })
  })

  describe('EventCardSkeleton', () => {
    it('renders event card structure', () => {
      const { container } = render(<EventCardSkeleton />)

      // Should have multiple skeleton elements
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(5) // Image, title, date, location, organizer, button
    })
  })

  describe('SpaceCardSkeleton', () => {
    it('renders space card structure', () => {
      const { container } = render(<SpaceCardSkeleton />)

      // Should have multiple skeleton elements
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(5) // Image, title, description, location, features, button
    })
  })

  describe('ProfileHeaderSkeleton', () => {
    it('renders profile header structure', () => {
      const { container } = render(<ProfileHeaderSkeleton />)

      // Should have skeleton for avatar, name, username, bio, stats
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(4)
    })
  })

  describe('ListItemSkeleton', () => {
    it('renders list item structure', () => {
      const { container } = render(<ListItemSkeleton />)

      // Should have skeleton for avatar, text lines, button
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(4)
    })
  })

  describe('MessageSkeleton', () => {
    it('renders message structure', () => {
      const { container } = render(<MessageSkeleton />)

      // Should have skeleton for avatar, name, message content
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(3)
    })
  })

  describe('GridSkeleton', () => {
    it('renders default 6 event cards', () => {
      const { container } = render(<GridSkeleton />)

      // Should render 6 EventCardSkeletons by default
      const cards = container.querySelectorAll('.bg-white.rounded-2xl')
      expect(cards.length).toBe(6)
    })

    it('renders custom count of cards', () => {
      const { container } = render(<GridSkeleton count={3} />)

      const cards = container.querySelectorAll('.bg-white.rounded-2xl')
      expect(cards.length).toBe(3)
    })

    it('renders space cards when type is space', () => {
      const { container } = render(<GridSkeleton type="space" count={2} />)

      const cards = container.querySelectorAll('.bg-white.rounded-2xl')
      expect(cards.length).toBe(2)
    })

    it('renders list items when type is profile', () => {
      const { container } = render(<GridSkeleton type="profile" count={4} />)

      const items = container.querySelectorAll('.flex.items-center')
      expect(items.length).toBe(4)
    })
  })

  describe('PageLoadingSkeleton', () => {
    it('renders with title and description by default', () => {
      const { container } = render(<PageLoadingSkeleton />)

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(10) // Title, 2 description lines, grid items
    })

    it('renders without title when title=false', () => {
      const { container } = render(<PageLoadingSkeleton title={false} />)

      // Should have fewer skeletons without title
      const allSkeletons = container.querySelectorAll('.animate-pulse')
      expect(allSkeletons).toBeTruthy()
    })

    it('renders without description when description=false', () => {
      const { container } = render(<PageLoadingSkeleton description={false} />)

      const allSkeletons = container.querySelectorAll('.animate-pulse')
      expect(allSkeletons).toBeTruthy()
    })
  })

  describe('FormSkeleton', () => {
    it('renders form structure with fields and button', () => {
      const { container } = render(<FormSkeleton />)

      // Should have skeleton for title, 4 form fields (label + input), and submit button
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(10) // 1 title + (4 fields * 2) + 1 button
    })
  })

  describe('TableRowSkeleton', () => {
    it('renders with default 4 columns', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      expect(cells.length).toBe(4)
    })

    it('renders with custom number of columns', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton columns={6} />
          </tbody>
        </table>
      )

      const cells = container.querySelectorAll('td')
      expect(cells.length).toBe(6)
    })
  })
})
