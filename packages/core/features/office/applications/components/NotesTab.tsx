import { useState } from 'react'
import { YStack, XStack, Text, Card, TextArea, Button } from 'tamagui'
import { Star } from '@tamagui/lucide-icons'
import type { MockApplication } from '../../mock-data/ats-mock-data'

interface NotesTabProps {
  notes: MockApplication['notes']
  applicationId: string
}

export const NotesTab = ({ notes, applicationId }: NotesTabProps) => {
  const [newNote, setNewNote] = useState('')
  const [newRating, setNewRating] = useState(0)

  const handleSubmit = () => {
    console.log('Add note:', { applicationId, note: newNote, rating: newRating })
    // TODO: Call API to add note
    setNewNote('')
    setNewRating(0)
  }

  return (
    <YStack gap="$4">
      {/* Add New Note */}
      <Card p="$4" bg="$color2">
        <Text fontSize="$5" fontWeight="600" mb="$3">
          Add Note
        </Text>

        {/* Rating */}
        <YStack gap="$2" mb="$3">
          <Text fontSize="$3" opacity={0.7}>
            Rating
          </Text>
          <XStack gap="$2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                size="$3"
                circular
                chromeless
                onPress={() => setNewRating(star)}
                icon={
                  <Star
                    size={20}
                    fill={star <= newRating ? '$yellow9' : 'transparent'}
                    color={star <= newRating ? '$yellow9' : '$color10'}
                  />
                }
              />
            ))}
          </XStack>
        </YStack>

        {/* Note Text */}
        <TextArea
          placeholder="Add your notes about this candidate..."
          value={newNote}
          onChangeText={setNewNote}
          numberOfLines={4}
          mb="$3"
        />

        <Button onPress={handleSubmit} disabled={!newNote.trim()} theme="info">
          Add Note
        </Button>
      </Card>

      {/* Existing Notes */}
      <YStack gap="$3">
        {notes.length === 0 ? (
          <Card p="$4" bg="$color2">
            <Text fontSize="$3" opacity={0.7} text="center">
              No notes yet. Add one above!
            </Text>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id} p="$4" bg="$color2">
              <XStack justify="space-between" items="center" mb="$2">
                <YStack>
                  <Text fontWeight="600">{note.author}</Text>
                  <Text fontSize="$2" opacity={0.7}>
                    {new Date(note.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </YStack>

                {/* Rating Stars */}
                <XStack gap="$1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      fill={star <= note.rating ? '$yellow9' : 'transparent'}
                      color={star <= note.rating ? '$yellow9' : '$color10'}
                    />
                  ))}
                </XStack>
              </XStack>

              <Text fontSize="$3">{note.content}</Text>
            </Card>
          ))
        )}
      </YStack>
    </YStack>
  )
}
