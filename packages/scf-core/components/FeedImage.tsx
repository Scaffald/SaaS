import { useState } from 'react'
import { Image, type ImageProps } from 'react-native'

/**
 * Feed image that collapses when the source fails to load.
 *
 * Feed/post images render at a fixed height with a muted backing colour, so a
 * broken URL used to show as a huge empty gray block (~40% of the mobile
 * viewport) in the dashboard and community feeds (#387). Rendering nothing is
 * strictly better: the post's text content closes the gap.
 */
export function FeedImage(props: ImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return null
  }

  return (
    <Image
      {...props}
      onError={(e) => {
        setFailed(true)
        props.onError?.(e)
      }}
    />
  )
}
