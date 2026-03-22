import { ROUTES } from "@scf/core/constants/routes";
import { useHasUploadedResume } from "@scf/core/utils/resume-sdk-hooks";
import { DashboardWidget } from "@scaffald/ui";
import { colors, namedSpacing } from "@scaffald/ui/tokens";
import { FileText, ShieldCheck } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { ResumeUploadButton } from "./ResumeUploadButton";
import { ResumeUploadModal } from "./ResumeUploadModal";

export function ResumeImportWidget() {
  const { theme } = useThemeContext();
  const t = theme === 'dark' ? 'dark' : 'light' as const;
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const handleResumeUploadComplete = useCallback(
    (resumeId: string) => {
      setModalOpen(false);
      router.push({
        pathname: ROUTES.PROFILE.RESUME.REVIEW.path,
        params: { resumeId },
      });
    },
    [router]
  );
  const { data, isLoading } = useHasUploadedResume({
    refetchOnWindowFocus: false,
  });

  const shouldHideWidget = !isLoading && data?.hasUploaded;

  if (shouldHideWidget) {
    return null;
  }

  return (
    <>
      <DashboardWidget>
        <Stack gap={namedSpacing.md}>
          <Row gap={namedSpacing.md} align="center">
            <Stack
              width={48}
              height={48}
              align="center"
              justify="center"
              style={{ backgroundColor: t === 'dark' ? colors.blue[900] : colors.blue[50] }}
              borderRadius={16}
            >
              <FileText color={t === 'dark' ? colors.blue[300] : colors.blue[600]} size={26} />
            </Stack>
            <Stack gap={4}>
              <Text style={{ color: colors.text[t].secondary }}>Import Your Resume</Text>
              <Text style={{ color: colors.text[t].secondary }}>
                Upload a PDF or Word document and we'll auto-fill your profile
                details for you.
              </Text>
            </Stack>
          </Row>

          <Stack gap={8}>
            <Row gap={8} align="center">
              <ShieldCheck size={18} color={t === 'dark' ? colors.green[300] : colors.green[600]} />
              <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[600] }}>
                Files stay private — only you can access your resume.
              </Text>
            </Row>
            <Text style={{ color: colors.text[t].secondary }}>
              Accepted formats: PDF, DOC, DOCX. Maximum size: 1MB.
            </Text>
          </Stack>

          <ResumeUploadButton
            onPress={() => setModalOpen(true)}
            label="Upload Resume"
            size="md"
          />
        </Stack>
      </DashboardWidget>

      <ResumeUploadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUploadComplete={handleResumeUploadComplete}
      />
    </>
  );
}
