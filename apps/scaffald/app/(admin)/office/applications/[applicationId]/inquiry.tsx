import { InquiryHistoryTimeline } from "@scf/core/features/inquiries/components/InquiryHistoryTimeline";
import { InquiryViewOrganization } from "@scf/core/features/inquiries/components/InquiryViewOrganization";
import { useInquiryByApplication } from "@scf/core/utils/inquiries-sdk-hooks";
import { Text, Stack, Spinner } from "@scaffald/ui";
import { useLocalSearchParams } from "expo-router";
import { ScrollView } from "react-native";

export default function OfficeApplicationInquiryRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>();
  const applicationParam =
    typeof applicationId === "string" ? applicationId : "";
  const enabled = applicationParam.length > 0;

  const { data, isLoading, error } = useInquiryByApplication(applicationParam, {
    enabled,
  });

  if (!enabled) {
    return (
      <Stack align="center" justify="center" padding={16}>
        <Text color="gray">Missing application ID</Text>
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <Stack align="center" justify="center" padding={16} gap={8}>
        <Spinner size="lg" />
        <Text>Loading inquiry...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack align="center" justify="center" padding={16} gap={8}>
        <Text color="red">Unable to load inquiry</Text>
        <Text color="secondary">{error.message}</Text>
      </Stack>
    );
  }

  // No inquiry raised against this application yet. This used to share the red
  // error branch above, so the ordinary case was reported as a failure.
  if (!data || !data.inquiry) {
    return (
      <Stack align="center" justify="center" padding={16} gap={8}>
        <Text>No inquiry yet</Text>
        <Text color="secondary">
          No inquiry has been sent to this candidate.
        </Text>
      </Stack>
    );
  }

  const candidateName =
    data.candidate?.displayName || data.candidate?.username || "Candidate";
  const jobTitle = data.job?.title || "Job";

  return (
    <ScrollView>
      <Stack gap={16} padding={16}>
        <InquiryViewOrganization
          applicationId={applicationParam}
          inquiryId={data.inquiry.id as string}
          candidateName={candidateName}
          jobTitle={jobTitle}
        />
        <InquiryHistoryTimeline inquiryId={data.inquiry.id as string} />
      </Stack>
    </ScrollView>
  );
}
