import {
  Award,
  Briefcase,
  DollarSign,
  MapPin,
  MessageSquare,
  Star,
} from "lucide-react-native";
import { Button, Card, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

interface UserProfileHeaderProps {
  profile: {
    name: string | null;
    avatar_url: string | null;
    headline: string | null;
    industry_name: string | null;
    years_of_experience: number | null;
    calculatedYearsOfExperience?: number | null;
    gamified_score: number | null;
    location: string | null;
    hourly_rate_cents: number | null;
    open_to_work: boolean | null;
  };
  onLeaveReview?: () => void;
  canLeaveReview?: boolean;
}

/**
 * User Profile Header
 * Shows avatar, name, headline, score, and key stats
 */
export function UserProfileHeader({
  profile,
  onLeaveReview,
  canLeaveReview,
}: UserProfileHeaderProps) {
  const { theme } = useThemeContext();
  const formatHourlyRate = (cents: number | null) => {
    if (!cents) return null;
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}/hr`;
  };

  const resolvedYears =
    typeof profile.calculatedYearsOfExperience === "number"
      ? profile.calculatedYearsOfExperience
      : profile.years_of_experience;

  const formattedYears =
    typeof resolvedYears === "number" && !Number.isNaN(resolvedYears)
      ? resolvedYears % 1 !== 0
        ? resolvedYears.toFixed(1)
        : resolvedYears
      : null;

  return (
    <Card elevate bordered>
      <Stack gap={16} padding="lg">
        {/* Header Row */}
        <Row gap={16} align="center" wrap justify="space-between">
          <Row gap={16} align="center" wrap flex={1}>
            {/* Avatar */}
            {profile.avatar_url ? (
              <Stack
                width={120}
                height={120}
                borderRadius={60}
                style={{ overflow: "hidden", backgroundColor: colors.bg[theme].muted }}
              >
                <img
                  src={profile.avatar_url}
                  alt={profile.name || "User"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Stack>
            ) : (
              <Stack
                width={120}
                height={120}
                borderRadius={60}
                style={{ backgroundColor: theme === 'light' ? colors.blue[100] : colors.blue[800] }}
                align="center"
                justify="center"
              >
                <Text style={{ color: theme === 'light' ? colors.blue[600] : colors.blue[400] }}>{profile.name?.charAt(0) || "?"}</Text>
              </Stack>
            )}

            {/* Name and Headline */}
            <Stack flex={1} gap={8} minWidth={200}>
              <Text style={{ color: colors.text[theme].secondary }}>{profile.name}</Text>
              {profile.headline && (
                <Text style={{ color: colors.text[theme].secondary }}>{profile.headline}</Text>
              )}
              {profile.industry_name && (
                <Row gap={8} align="center">
                  <Briefcase size={18} color={colors.text[theme].secondary} />
                  <Text style={{ color: colors.text[theme].secondary }}>{profile.industry_name}</Text>
                </Row>
              )}
            </Stack>

            {/* Scaffald Score */}
            {profile.gamified_score !== null && (
              <Row
                style={{
                  backgroundColor: theme === 'light' ? colors.blue[50] : colors.blue[900],
                  borderWidth: 2,
                  borderColor: theme === 'light' ? colors.blue[300] : colors.blue[700],
                }}
                paddingHorizontal={20}
                paddingVertical={12}
                borderRadius={16}
                gap={8}
                align="center"
              >
                <Star size={32} color={theme === 'light' ? colors.blue[600] : colors.blue[400]} fill={theme === 'light' ? colors.blue[600] : colors.blue[400]} />
                <Stack>
                  <Text style={{ color: theme === 'light' ? colors.blue[700] : colors.blue[300] }}>{profile.gamified_score}</Text>
                  <Text style={{ color: theme === 'light' ? colors.blue[600] : colors.blue[400] }}>Scaffald Score</Text>
                </Stack>
              </Row>
            )}
          </Row>

          {/* Leave Review Button */}
          {canLeaveReview && onLeaveReview && (
            <Button
              size="md"
              color="primary"
              iconStart={MessageSquare}
              onPress={onLeaveReview}
            >
              Leave Review
            </Button>
          )}
        </Row>

        {/* Stats Row */}
        <Row gap={16} wrap>
          {profile.location && (
            <Row
              gap={8}
              align="center"
              paddingHorizontal={12}
              paddingVertical={8}
              style={{ backgroundColor: colors.bg[theme].muted }}
              borderRadius={12}
            >
              <MapPin size={18} color={colors.text[theme].secondary} />
              <Text style={{ color: colors.text[theme].secondary }}>{profile.location}</Text>
            </Row>
          )}

          {formattedYears !== null && (
            <Row
              gap={8}
              align="center"
              paddingHorizontal={12}
              paddingVertical={8}
              style={{ backgroundColor: colors.bg[theme].muted }}
              borderRadius={12}
            >
              <Award size={18} color={colors.text[theme].secondary} />
              <Text style={{ color: colors.text[theme].secondary }}>{formattedYears} years experience</Text>
            </Row>
          )}

          {profile.hourly_rate_cents && (
            <Row
              gap={8}
              align="center"
              paddingHorizontal={12}
              paddingVertical={8}
              style={{ backgroundColor: colors.bg[theme].muted }}
              borderRadius={12}
            >
              <DollarSign size={18} color={colors.text[theme].secondary} />
              <Text style={{ color: colors.text[theme].secondary }}>
                {formatHourlyRate(profile.hourly_rate_cents)}
              </Text>
            </Row>
          )}

          {profile.open_to_work && (
            <Row
              paddingHorizontal={12}
              paddingVertical={8}
              style={{ backgroundColor: theme === 'light' ? colors.green[50] : colors.green[900] }}
              borderRadius={12}
            >
              <Text style={{ color: theme === 'light' ? colors.green[700] : colors.green[300] }}>✓ Available for Work</Text>
            </Row>
          )}
        </Row>
      </Stack>
    </Card>
  );
}
