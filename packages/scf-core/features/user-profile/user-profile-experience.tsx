import { Briefcase, Calendar, MapPin } from "lucide-react-native";
import { Card, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

interface Experience {
  id: string;
  job_title: string | null;
  company_name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean | null;
  description: string | null;
}

interface UserProfileExperienceProps {
  experience: Experience[];
}

export function UserProfileExperience({
  experience,
}: UserProfileExperienceProps) {
  const { theme } = useThemeContext();
  const t = theme === "dark" ? "dark" : "light";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <Card elevate bordered>
      <Stack gap={16} padding="lg">
        <Row gap={8} align="center">
          <Briefcase size={24} color={t === "dark" ? colors.blue[300] : colors.blue[600]} />
          <Text color={colors.text[t].secondary}>Work Experience</Text>
        </Row>

        <Stack gap={12}>
          {experience.map((exp) => (
            <Card key={exp.id} bordered backgroundColor={colors.bg[t].muted}>
              <Stack gap={12} padding="md">
                <Stack gap={4}>
                  <Text color={colors.text[t].secondary}>{exp.job_title}</Text>
                  {exp.company_name && (
                    <Text color={colors.text[t].secondary}>{exp.company_name}</Text>
                  )}
                </Stack>

                <Row gap={12} wrap>
                  {(exp.start_date || exp.end_date) && (
                    <Row gap={8} align="center">
                      <Calendar size="md" color={colors.text[t].secondary} />
                      <Text color={colors.text[t].secondary}>
                        {formatDate(exp.start_date)} -{" "}
                        {exp.is_current ? "Present" : formatDate(exp.end_date)}
                      </Text>
                    </Row>
                  )}
                  {exp.location && (
                    <Row gap={8} align="center">
                      <MapPin size="md" color={colors.text[t].secondary} />
                      <Text color={colors.text[t].secondary}>{exp.location}</Text>
                    </Row>
                  )}
                </Row>

                {exp.description && (
                  <Text color={colors.text[t].secondary} style={{ lineHeight: 20 }}>
                    {exp.description}
                  </Text>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
