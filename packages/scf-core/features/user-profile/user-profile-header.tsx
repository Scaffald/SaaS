import {
  Award,
  Briefcase,
  DollarSign,
  MapPin,
  MessageSquare,
  Star,
} from "lucide-react-native";
import { Button, Card, Text, Row, Stack } from "@scaffald/ui";

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
                style={{ overflow: "hidden" }}
                backgroundColor="$color3"
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
                backgroundColor="$blue4"
                align="center"
                justify="center"
              >
                <Text color="$blue10">{profile.name?.charAt(0) || "?"}</Text>
              </Stack>
            )}

            {/* Name and Headline */}
            <Stack flex={1} gap={8} minWidth={200}>
              <Text color="$gray11">{profile.name}</Text>
              {profile.headline && (
                <Text color="$gray11">{profile.headline}</Text>
              )}
              {profile.industry_name && (
                <Row gap={8} align="center">
                  <Briefcase size={18} color="$gray11" />
                  <Text color="$gray11">{profile.industry_name}</Text>
                </Row>
              )}
            </Stack>

            {/* Scaffald Score */}
            {profile.gamified_score !== null && (
              <Row
                backgroundColor="$blue2"
                paddingHorizontal={20}
                paddingVertical={12}
                borderRadius={16}
                gap={8}
                align="center"
                borderWidth={2}
                borderColor="$blue6"
              >
                <Star size={32} color="$blue10" fill="$blue10" />
                <Stack>
                  <Text color="$blue11">{profile.gamified_score}</Text>
                  <Text color="$blue10">Scaffald Score</Text>
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
              backgroundColor="$color2"
              borderRadius={12}
            >
              <MapPin size={18} color="$gray11" />
              <Text color="$gray11">{profile.location}</Text>
            </Row>
          )}

          {formattedYears !== null && (
            <Row
              gap={8}
              align="center"
              paddingHorizontal={12}
              paddingVertical={8}
              backgroundColor="$color2"
              borderRadius={12}
            >
              <Award size={18} color="$gray11" />
              <Text color="$gray11">{formattedYears} years experience</Text>
            </Row>
          )}

          {profile.hourly_rate_cents && (
            <Row
              gap={8}
              align="center"
              paddingHorizontal={12}
              paddingVertical={8}
              backgroundColor="$color2"
              borderRadius={12}
            >
              <DollarSign size={18} color="$gray11" />
              <Text color="$gray11">
                {formatHourlyRate(profile.hourly_rate_cents)}
              </Text>
            </Row>
          )}

          {profile.open_to_work && (
            <Row
              paddingHorizontal={12}
              paddingVertical={8}
              backgroundColor="$green3"
              borderRadius={12}
            >
              <Text color="$green11">✓ Available for Work</Text>
            </Row>
          )}
        </Row>
      </Stack>
    </Card>
  );
}
