/**
 * Data Request Form Component
 * CCPA Compliance Implementation
 *
 * Form for users to submit CCPA data requests:
 * - Data export (Right to Know)
 * - Data deletion (Right to Delete)
 * - Data correction (Right to Correct)
 */

import { useState } from "react";
import { Pressable } from "react-native";
import { Button, Text, Row, Stack, Spinner, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { useCCPASubmitRequestMutation } from "@scf/core/utils/ccpa-sdk-hooks";

/**
 * Request type options
 */
export type DataRequestType = "export" | "deletion" | "correction";

/**
 * Props for DataRequestForm
 */
interface DataRequestFormProps {
  onSuccess?: (requestId: string) => void;
  onCancel?: () => void;
  initialType?: DataRequestType;
}

/**
 * Request type metadata
 */
const REQUEST_TYPE_INFO: Record<
  DataRequestType,
  {
    title: string;
    description: string;
    confirmText: string;
    buttonColor: string;
    warning?: string;
  }
> = {
  export: {
    title: "Request My Data",
    description:
      "Request a copy of all personal information we have collected about you. This includes your profile information, documents, activities, and any other data associated with your account.",
    confirmText: "Submit Export Request",
    buttonColor: "primary",
  },
  deletion: {
    title: "Request Data Deletion",
    description:
      "Request the deletion of your personal information. Please note that some information may be retained for legal, regulatory, or business purposes as permitted under CCPA.",
    confirmText: "Submit Deletion Request",
    buttonColor: "error",
    warning:
      "This action cannot be undone. Some data may be anonymized rather than deleted due to retention requirements. Financial and compliance records may be retained for up to 7 years.",
  },
  correction: {
    title: "Request Data Correction",
    description:
      "Request correction of inaccurate personal information. Please describe what information is incorrect and what the correct information should be.",
    confirmText: "Submit Correction Request",
    buttonColor: "secondary",
  },
};

/**
 * Data categories that can be selected for export/deletion
 */
const DATA_CATEGORIES = [
  {
    id: "profile",
    label: "Profile Information",
    description: "Name, email, phone, company info",
  },
  {
    id: "documents",
    label: "Documents",
    description: "Uploaded files and certificates",
  },
  {
    id: "policies",
    label: "Insurance Policies",
    description: "Policy records and coverage info",
  },
  {
    id: "tasks",
    label: "Tasks & Activities",
    description: "Task history and completions",
  },
  {
    id: "projects",
    label: "Projects",
    description: "Project data and assignments",
  },
  {
    id: "compliance",
    label: "Compliance Records",
    description: "Compliance scores and issues",
  },
  {
    id: "usage",
    label: "Usage Data",
    description: "Login history and feature usage",
  },
];

/**
 * Checkbox component
 */
function Checkbox({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  const { theme } = useThemeContext();
  return (
    <Pressable onPress={() => onChange(!checked)}>
      <Row
        padding="sm"
        style={{
          backgroundColor: checked ? colors.bg[theme].selected : colors.bg[theme].subtle,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: checked ? colors.border[theme].active : colors.border[theme].default,
        }}
        gap={12}
        align="flex-start"
      >
        <Stack
          width={20}
          height={20}
          style={{
            borderRadius: 4,
            borderWidth: 2,
            borderColor: checked ? colors.fg[theme].active : colors.border[theme].muted,
            backgroundColor: checked ? colors.fg[theme].active : "transparent",
            marginTop: 2,
          }}
          align="center"
          justify="center"
        >
          {checked && <Text style={{ color: '#ffffff' }}>✓</Text>}
        </Stack>
        <Stack flex={1} gap={4}>
          <Text>{label}</Text>
          {description && (
            <Text style={{ color: colors.text[theme].secondary }}>{description}</Text>
          )}
        </Stack>
      </Row>
    </Pressable>
  );
}

/**
 * Radio button component
 */
function RadioButton({
  selected,
  onSelect,
  label,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  description?: string;
}) {
  const { theme } = useThemeContext();
  return (
    <Pressable onPress={onSelect}>
      <Row
        padding="sm"
        style={{
          backgroundColor: selected ? colors.bg[theme].selected : colors.bg[theme].subtle,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: selected ? colors.border[theme].active : colors.border[theme].default,
        }}
        gap={12}
        align="flex-start"
      >
        <Stack
          width={20}
          height={20}
          style={{
            borderRadius: 10,
            borderWidth: 2,
            borderColor: selected ? colors.fg[theme].active : colors.border[theme].muted,
            marginTop: 2,
          }}
          align="center"
          justify="center"
        >
          {selected && (
            <Stack
              width={10}
              height={10}
              style={{
                borderRadius: 5,
                backgroundColor: colors.fg[theme].active,
              }}
            />
          )}
        </Stack>
        <Stack flex={1} gap={4}>
          <Text>{label}</Text>
          {description && (
            <Text style={{ color: colors.text[theme].secondary }}>{description}</Text>
          )}
        </Stack>
      </Row>
    </Pressable>
  );
}

/**
 * Data Request Form Component
 */
export function DataRequestForm({
  onSuccess,
  onCancel,
  initialType = "export",
}: DataRequestFormProps) {
  const { theme } = useThemeContext();
  const [requestType, setRequestType] = useState<DataRequestType>(initialType);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [correctionDetails, _setCorrectionDetails] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [step, setStep] = useState<
    "type" | "categories" | "confirm" | "submitted"
  >("type");

  // Submit request mutation
  const submitRequest = useCCPASubmitRequestMutation({
    onSuccess: (data) => {
      setStep("submitted");
      onSuccess?.(data.id);
    },
  });

  const typeInfo = REQUEST_TYPE_INFO[requestType];

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories(DATA_CATEGORIES.map((c) => c.id));
  };

  const handleSubmit = () => {
    submitRequest.mutate({
      type: requestType,
      categories:
        selectedCategories.length > 0 ? selectedCategories : undefined,
      correctionDetails:
        requestType === "correction" ? correctionDetails : undefined,
    });
  };

  // Submitted state
  if (step === "submitted") {
    return (
      <Stack padding="md" gap={16} align="center">
        <Stack
          width={80}
          height={80}
          style={{
            borderRadius: 40,
            backgroundColor: theme === 'dark' ? colors.success[900] : colors.success[100],
          }}
          align="center"
          justify="center"
        >
          <Text style={{ color: theme === 'dark' ? colors.success[300] : colors.success[600] }}>✓</Text>
        </Stack>
        <Text style={{ textAlign: "center" }}>Request Submitted</Text>
        <Text style={{ color: colors.text[theme].secondary, textAlign: "center" }}>
          Your{" "}
          {requestType === "export"
            ? "data export"
            : requestType === "deletion"
            ? "deletion"
            : "correction"}{" "}
          request has been submitted. We will process your request within 45
          days as required by CCPA.
        </Text>
        <Text style={{ color: colors.text[theme].secondary, textAlign: "center" }}>
          You will receive email updates about the status of your request.
        </Text>
        <Button onPress={onCancel} style={{ marginTop: 16 }}>
          Close
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap={16} padding="md">
      {/* Header */}
      <Stack gap={8}>
        <Text>{typeInfo.title}</Text>
        <Text style={{ color: colors.text[theme].secondary }}>{typeInfo.description}</Text>
      </Stack>

      {/* Step 1: Select Request Type */}
      {step === "type" && (
        <Stack gap={12}>
          <Text>Select Request Type</Text>
          <Stack gap={8}>
            <RadioButton
              selected={requestType === "export"}
              onSelect={() => setRequestType("export")}
              label="Request My Data (Export)"
              description="Get a copy of all your personal information"
            />
            <RadioButton
              selected={requestType === "deletion"}
              onSelect={() => setRequestType("deletion")}
              label="Delete My Data"
              description="Request deletion of your personal information"
            />
            <RadioButton
              selected={requestType === "correction"}
              onSelect={() => setRequestType("correction")}
              label="Correct My Data"
              description="Request correction of inaccurate information"
            />
          </Stack>

          <Row gap={12} justify="flex-end" style={{ marginTop: 16 }}>
            <Button variant="outline" onPress={onCancel}>
              Cancel
            </Button>
            <Button onPress={() => setStep("categories")}>Next</Button>
          </Row>
        </Stack>
      )}

      {/* Step 2: Select Data Categories */}
      {step === "categories" && (
        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <Text>
              {requestType === "correction"
                ? "Describe Correction"
                : "Select Data Categories"}
            </Text>
            {requestType !== "correction" && (
              <Button size="sm" variant="outline" onPress={selectAllCategories}>
                Select All
              </Button>
            )}
          </Row>

          {requestType === "correction" ? (
            <Stack gap={8}>
              <Text style={{ color: colors.text[theme].secondary }}>
                Please describe what information is incorrect and what the
                correct information should be:
              </Text>
              <Stack
                style={{
                  minHeight: 150,
                  backgroundColor: colors.bg[theme].subtle,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border[theme].default,
                }}
                padding="sm"
              >
                <Text
                  style={{ color: correctionDetails ? colors.text[theme].primary : colors.text[theme].tertiary }}
                >
                  {correctionDetails || "Enter correction details here..."}
                </Text>
              </Stack>
            </Stack>
          ) : (
            <Stack gap={8}>
              {DATA_CATEGORIES.map((category) => (
                <Checkbox
                  key={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  label={category.label}
                  description={category.description}
                />
              ))}
            </Stack>
          )}

          <Row gap={12} justify="flex-end" style={{ marginTop: 16 }}>
            <Button variant="outline" onPress={() => setStep("type")}>
              Back
            </Button>
            <Button
              onPress={() => setStep("confirm")}
              disabled={
                (requestType !== "correction" &&
                  selectedCategories.length === 0) ||
                (requestType === "correction" && !correctionDetails.trim())
              }
            >
              Next
            </Button>
          </Row>
        </Stack>
      )}

      {/* Step 3: Confirmation */}
      {step === "confirm" && (
        <Stack gap={12}>
          <Text>Confirm Your Request</Text>

          {/* Summary */}
          <Stack
            padding="sm"
            style={{
              backgroundColor: colors.bg[theme].subtle,
              borderRadius: 8,
            }}
            gap={8}
          >
            <Text>Request Type: {REQUEST_TYPE_INFO[requestType].title}</Text>
            {requestType !== "correction" && (
              <Text style={{ color: colors.text[theme].secondary }}>
                Categories:{" "}
                {selectedCategories.length === DATA_CATEGORIES.length
                  ? "All categories"
                  : selectedCategories
                      .map(
                        (id) => DATA_CATEGORIES.find((c) => c.id === id)?.label
                      )
                      .join(", ")}
              </Text>
            )}
          </Stack>

          {/* Warning for deletion */}
          {typeInfo.warning && (
            <Row
              padding="sm"
              style={{
                backgroundColor: theme === 'dark' ? colors.error[900] : colors.error[50],
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border[theme].error,
              }}
            >
              <Text style={{ color: theme === 'dark' ? colors.error[300] : colors.error[600] }}>⚠️ {typeInfo.warning}</Text>
            </Row>
          )}

          {/* Processing time info */}
          <Row
            padding="sm"
            style={{
              backgroundColor: theme === 'dark' ? colors.info[900] : colors.info[50],
              borderRadius: 8,
            }}
          >
            <Text style={{ color: colors.info[600] }}>
              Your request will be processed within 45 days as required by CCPA.
              You will receive email notifications about the status of your
              request.
            </Text>
          </Row>

          {/* Confirmation checkbox */}
          <Checkbox
            checked={confirmChecked}
            onChange={setConfirmChecked}
            label="I understand and confirm this request"
            description={
              requestType === "deletion"
                ? "I understand that some data may be retained for legal purposes and this action cannot be undone."
                : "I confirm that I want to submit this privacy request."
            }
          />

          <Row gap={12} justify="flex-end" style={{ marginTop: 16 }}>
            <Button variant="outline" onPress={() => setStep("categories")}>
              Back
            </Button>
            <Button
              onPress={handleSubmit}
              disabled={!confirmChecked || submitRequest.isPending}
              color={requestType === "deletion" ? "error" : undefined}
            >
              {submitRequest.isPending ? (
                <Row gap={8} align="center">
                  <Spinner variant="ios" size="sm" />
                  <Text>Submitting...</Text>
                </Row>
              ) : (
                typeInfo.confirmText
              )}
            </Button>
          </Row>
        </Stack>
      )}
    </Stack>
  );
}

export default DataRequestForm;
