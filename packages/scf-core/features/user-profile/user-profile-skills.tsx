import { Award } from "lucide-react-native";
import { Card, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";

export interface UserProfileSkill {
  id: string;
  name: string;
  proficiency: number;
  displayCode?: string | null;
  taxonomy?: "csi" | "onet";
  yearsExperience?: number | null;
  verified?: boolean;
  label?: string | null;
}

interface UserProfileSkillsProps {
  skills: UserProfileSkill[];
}

export function UserProfileSkills({ skills }: UserProfileSkillsProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light' as const

  return (
    <Card elevate bordered>
      <Stack gap={16} padding="lg">
        <Row gap={8} align="center">
          <Award size={24} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
          <Text style={{ color: colors.text[t].secondary }}>Skills & Proficiency</Text>
        </Row>

        <Stack gap={12}>
          {skills.map((skill) => (
            <Stack key={skill.id} gap={8}>
              <Row justify="space-between" align="center">
                <Stack flex={1}>
                  <Text style={{ color: colors.text[t].secondary }}>
                    {typeof skill.label === "string" && skill.label.length > 0
                      ? skill.label
                      : skill.displayCode
                      ? `${skill.displayCode} · ${skill.name}`
                      : skill.name}
                  </Text>
                  {typeof skill.yearsExperience === "number" && (
                    <Text style={{ color: colors.text[t].secondary }}>
                      {skill.yearsExperience} years experience
                    </Text>
                  )}
                </Stack>
                <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[600] }}>{skill.proficiency}%</Text>
              </Row>
              <Row
                style={{
                  height: 8,
                  backgroundColor: colors.bg[t].muted,
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <Row
                  width={`${skill.proficiency}%`}
                  style={{ backgroundColor: t === 'dark' ? colors.blue[300] : colors.blue[600] }}
                />
              </Row>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
