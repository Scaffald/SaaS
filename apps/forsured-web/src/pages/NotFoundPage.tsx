/**
 * NotFoundPage - 404 page using Beyond UI
 */
import { Link } from 'react-router-dom';
import { Stack, Text, Button, H1 } from '@scaffald/ui';
import { spacing, fontSize } from '@scaffald/ui';

function NotFoundPage() {
  return (
    <Stack
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: spacing[16],
      }}
    >
      <H1 style={{ fontSize: fontSize.h1, fontWeight: 700 }}>
        404 - Not Found
      </H1>
      <Text style={{ fontSize: fontSize.h5 }}>
        The page you are looking for does not exist.
      </Text>
      <Button asChild variant="default">
        <Link to="/">Go to Home</Link>
      </Button>
    </Stack>
  );
}

export default NotFoundPage;
