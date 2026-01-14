/**
 * UnauthorizedPage - 403 page using Beyond UI
 */
import { Link } from 'react-router-dom';
import { Stack, Text, Button, H1 } from '@unicornlove/beyond-ui';
import { spacing, fontSize } from '@unicornlove/beyond-ui';

function UnauthorizedPage() {
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
        403 - Unauthorized
      </H1>
      <Text style={{ fontSize: fontSize.h5 }}>
        You are not authorized to view this page.
      </Text>
      <Button asChild variant="default">
        <Link to="/">Go to Home</Link>
      </Button>
    </Stack>
  );
}

export default UnauthorizedPage;
